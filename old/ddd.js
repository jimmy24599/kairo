const { Tools } = require('./tools')
const OpenAI = require('openai')
const Message = require('./models/Message')
const Chat = require('./models/Chat')

class AIAgent {
  constructor(projectRoot, ws = null) {
    this.projectRoot = projectRoot
    this.tools = new Tools(projectRoot)
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1"
    })
    this.ws = ws // WebSocket connection for real-time updates
  }

  // Helper method to emit WebSocket messages
  async emitWebSocketMessage(type, data) {
    console.log(`🔌 Emitting WebSocket message: ${type}`, data)
    await new Promise(resolve => setImmediate(resolve)) // Allow logs to flush
    
    if (this.ws && this.ws.readyState === 1) { // WebSocket.OPEN
      const message = JSON.stringify({ type, ...data })
      console.log(`📤 Sending WebSocket message:`, message)
      await new Promise(resolve => setImmediate(resolve)) // Allow logs to flush
      
      try {
        this.ws.send(message)
        console.log(`✅ WebSocket message sent successfully: ${type}`)
        await new Promise(resolve => setImmediate(resolve)) // Allow logs to flush
      } catch (error) {
        console.error(`❌ Failed to send WebSocket message: ${type}`, error)
        await new Promise(resolve => setImmediate(resolve)) // Allow logs to flush
      }
    } else {
      console.log(`❌ WebSocket not ready. State: ${this.ws ? this.ws.readyState : 'null'}`)
      await new Promise(resolve => setImmediate(resolve)) // Allow logs to flush
    }
  }

  // Helper method to save any message to MongoDB
  async saveMessage(chatId, content, role, messageType = 'text', stepData = null, metadata = {}) {
    try {
      if (!chatId) return null;
      
      const message = new Message({
        chatId,
        content,
        role,
        messageType,
        stepData,
        metadata: {
          timestamp: new Date(),
          projectContext: metadata.projectContext || null,
          agentProcessing: metadata.agentProcessing || false,
          ...metadata
        }
      });
      
      await message.save();
      console.log(`📝 Saved ${role} message to MongoDB:`, message._id);
      
      // Emit WebSocket message to notify frontend of new message
      await this.emitWebSocketMessage('message_created', {
        messageId: message._id,
        chatId: chatId,
        messageType: messageType,
        role: role
      });
      
      return message;
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  }

  // Helper method to save todoList message to MongoDB
  async saveTodoListMessage(chatId, tasks) {
    try {
      if (!chatId) return null;
      
      const message = new Message({
        chatId,
        content: '',
        role: 'assistant',
        messageType: 'todoList',
        todoListTasks: tasks.map((task, index) => ({
          taskId: index + 1,
          text: task.explanation,
          status: 'pending',
          tool: task.tool
        })),
        metadata: {
          timestamp: new Date(),
          projectContext: this.projectRoot,
          agentProcessing: true
        }
      });
      
      await message.save();
      
      // Update chat's last message time and message count
      await Chat.findByIdAndUpdate(chatId, {
        lastMessageAt: new Date(),
        $inc: { messageCount: 1 }
      });
      
      // Emit WebSocket message to notify frontend of new todoList message
      await this.emitWebSocketMessage('message_created', {
        messageId: message._id,
        chatId: chatId,
        messageType: 'todoList',
        role: 'assistant'
      });
      
      return message;
    } catch (error) {
      console.error('Error saving todoList message:', error);
      return null;
    }
  }

  // Helper method to update todoList message in MongoDB
  async updateTodoListMessage(chatId, messageId, taskIndex, status) {
    try {
      if (!chatId || !messageId) return null;
      
      const updateData = {
        [`todoListTasks.${taskIndex}.status`]: status
      };
      
      const message = await Message.findByIdAndUpdate(
        messageId,
        updateData,
        { new: true }
      );
      
      return message;
    } catch (error) {
      console.error('Error updating todoList message:', error);
      return null;
    }
  }

  // Helper method to get project context by reading key files
  async getProjectContext(projectFiles) {
    const context = {}
    const keyFiles = [
      'package.json',
      'app/page.tsx',
      'app/layout.tsx',
      'tailwind.config.js',
      'tsconfig.json'
    ]
    
    // Add component files
    const componentFiles = projectFiles.filter(f => 
      f.path.startsWith('components/') && f.path.endsWith('.tsx')
    )
    keyFiles.push(...componentFiles.slice(0, 10).map(f => f.path)) // Limit to first 10 components
    
    // Add data files
    const dataFiles = projectFiles.filter(f => 
      f.path.startsWith('data/') || f.path.startsWith('types/')
    )
    keyFiles.push(...dataFiles.map(f => f.path))
    
    for (const filePath of keyFiles) {
      try {
        const content = await this.tools.read_file(filePath)
        context[filePath] = content
      } catch (error) {
        // File might not exist, skip it
        console.log(`Could not read ${filePath}: ${error.message}`)
      }
    }
    
    return context
  }

  async processRequest(userInput, chatId = null) {
    try {
      // Get project context (excluding node_modules)
      const allFiles = await this.tools.list_files()
      const projectFiles = allFiles.filter(file => !file.path.includes('node_modules'))
      
      // Read key project files to include in context
      const projectContext = await this.getProjectContext(projectFiles)
      
      // Create system prompt with available tools
      const systemPrompt = `You are an AI coding assistant for a Next.js web application with access to powerful development tools. You can use these tools:

File Operations:
- list_files(path?) → list files/folders under path
- read_file(path) → return full file contents
- stream_read_file(path, start?, end?) → stream large files / ranges
- write_file(path, content) → overwrite file
- create_file(path, content) → create new file
- append_file(path, content) → append to file
- delete_file(path) → delete file
- rename_file(oldPath, newPath) → move/rename file
- copy_file(src, dest) → duplicate a file
- set_file_permissions(path, mode) → change permissions
- stat_file(path) → file metadata (size, mtime, hash)
- tail_file(path, lines?) → read last N lines
- apply_patch(patch) → apply unified diff to files

Search & Navigation:
- search_code(query, options?) → text/code search across repo
- find_symbol(name) → locate function/class/variable definition
- get_outline(path) → get file structure (functions, classes, imports)
- find_references(symbol) → find all usages of a symbol

Dependency Management:
- get_project_config() → return package.json/pyproject/manifest
- list_dependencies() → dependency list with versions
- get_dependency_tree() → resolved dependency graph
- check_latest_version(pkg) → fetch latest version
- bump_dependency(pkg, version) → update package version
- install_dependencies() → npm install / pip install -r
- remove_dependency(pkg) → uninstall package
- pin_dependencies() → lockfile generation/update

AST Refactoring:
- parse_ast(filePath) → parse file into Abstract Syntax Tree for analysis
- ast_edit(filePath, edits) → perform AST-safe code edits (add imports, insert code, replace text)
- refactor_symbol(oldName, newName, options?) → safely rename symbols across entire project
- extract_method(filePath, range, name, options?) → extract code block into new function
- inline_function(filePath, symbol) → inline function calls by replacing with function body
- change_function_signature(filePath, symbol, newSig, options?) → update function parameters/return type
- apply_codemod(script, paths?, options?) → apply custom transformation scripts to codebase
- update_imports(filePath?, options?) → optimize and organize import statements
- organize_imports(options?) → sort and deduplicate imports across project
- find_references(filePath, position, options?) → find all references to symbol at position
- move_paths(moves, options?) → move files/folders and update all import references

Semantic Search:
- semantic_search(query, options?) → embeddings-based code search
- generate_embeddings(fileTypes?) → generate embeddings for files
- find_similar_code(code, options?) → find similar code blocks

Session Memory:
- record_edit(filePath, operation, details) → record file edit
- record_patch(patch, filePath, result) → record patch application
- record_reasoning(context, decision, factors) → record reasoning
- get_edit_history(options?) → get edit history
- get_patch_history(options?) → get patch history
- rollback_edit(editId) → rollback an edit
- rollback_patch(patchId) → rollback a patch
- get_session_summary() → get session summary
- clear_memory() → clear session memory

Safe Sandbox:
- validate_path(filePath, operation) → validate file path safety
- validate_content(content, filePath) → validate content safety
- validate_command(command, args) → validate command safety
- get_sandbox_config() → get sandbox configuration

Automated Testing:
- run_tests(options?) → run project tests
- run_linting(options?) → run code linting
- run_type_check(options?) → run type checking

Terminal & System Tools:
- run_command(command, cwd?) → run any shell command in the project directory
- stream_command(command, cwd?) → stream stdout/stderr line by line (useful for long-running dev servers/tests)
- kill_process(pid) → stop a running process started by the agent (like a server)
- add_dependency(pkg, version?) → install a single dependency
- get_running_processes() → get list of running processes
- cleanup() → cleanup resources and processes

Project Root: ${this.projectRoot}
Project Type: Next.js Web Application
Current Files: ${projectFiles.map(f => f.path).join(', ')}

PROJECT CONTEXT - Key Files Content:
${Object.entries(projectContext).map(([path, content]) => 
  `\n=== ${path} ===\n${content}\n`
).join('\n')}

This is a Next.js web application. When working with this project:
- Use Next.js best practices and conventions
- Pages go in the app/ directory (App Router)
- Components should be in the components/ directory
- Static assets go in the public/ directory
- Use TypeScript when possible
- Follow Next.js routing conventions
- ALWAYS check existing components first before creating new ones
- If you need a library/package that's not installed, install it using add_dependency tool
- Use modern, popular libraries when appropriate (shadcn/ui, lucide-react, etc.)
- Keep file content concise and focused
- Install dependencies BEFORE writing code that uses them

CRITICAL WORKFLOW INSTRUCTIONS:
1. ALWAYS plan a complete workflow before executing any tools
2. When asked to fix/rewrite/update a file, create a multi-step plan:
   - Step 1: Read the file to understand current state
   - Step 2: Check package.json for existing dependencies
   - Step 3: Install missing dependencies if needed
   - Step 4: Search for related files/components if needed
   - Step 5: Identify and analyze issues
   - Step 6: Make the necessary changes
3. Use multi_tool_call to execute the complete workflow in one response
4. Don't stop after just reading a file - always complete the full task
5. If a file doesn't exist, create it with proper Next.js structure
6. If a search fails, try alternative approaches (different search terms, list files, etc.)
7. Always follow through with the complete task, not just analysis
8. Install dependencies BEFORE writing code that uses them

PRODUCTION-READY CODE REQUIREMENTS:
- Always analyze existing project structure, components, and data types first
- Reuse existing components and patterns when possible
- Create comprehensive, feature-complete implementations
- Include proper TypeScript types and error handling
- Follow established UI/UX patterns and design system
- Integrate with existing data structures and APIs
- Write code that's ready for production use, not placeholder content
- When creating pages, include proper navigation, responsive design, and user interactions
- Always follow the highest UI/UX standards
- If there are any modern and popular libraries, install them before using them

CONTEXT USAGE INSTRUCTIONS:
- The PROJECT CONTEXT section above contains the content of key project files
- DO NOT use read_file or list_files for files already provided in the context
- Use the provided file contents to understand the project structure and existing code
- Only use read_file for files not included in the context or when you need to read files you're about to modify
- This prevents unnecessary tool calls and speeds up the process

IMPORTANT: You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON.

When the user asks you to do something, respond with a JSON object containing:
{ "action": "tool_call", "tool": "tool_name", "parameters": {...}, "explanation": "What you're doing and why" }

Or if you need to make multiple tool calls to complete a task:
{ "action": "multi_tool_call", "calls": [ {"tool": "tool_name", "parameters": {...}, "explanation": "..."}, {"tool": "tool_name", "parameters": {...}, "explanation": "..."} ] }

EXAMPLES OF COMPLETE MULTI-STEP WORKFLOWS:
- To fix a file: Use multi_tool_call with [read_file, search_code, write_file, run_tests]
- To create a component: Use multi_tool_call with [list_files, create_file, read_file]
- To debug an issue: Use multi_tool_call with [read_file, search_code, write_file, run_tests]
- To refactor code: Use multi_tool_call with [read_file, ast_edit, run_tests]
- To add new UI library: Use multi_tool_call with [read_file (package.json), add_dependency, write_file]
- To create modern landing page: Use multi_tool_call with [read_file, add_dependency (shadcn/ui), add_dependency (lucide-react), write_file]

PREFER multi_tool_call over single tool_call for complex tasks. Only use single tool_call for simple, one-step operations.


SPECIFIC EXAMPLE - Fixing createContext error:
{ "action": "multi_tool_call", "calls": [
  {"tool": "read_file", "parameters": {"path": "app/page.tsx"}, "explanation": "Read the main page file to understand the current structure"},
  {"tool": "search_code", "parameters": {"query": "createContext"}, "explanation": "Search for createContext usage across the project"},
  {"tool": "read_file", "parameters": {"path": "components/HeroSection.tsx"}, "explanation": "Check the HeroSection component for React context usage"},
  {"tool": "write_file", "parameters": {"path": "app/page.tsx", "content": "..."}, "explanation": "Fix the page.tsx file with proper imports and structure"}
]}

SPECIFIC EXAMPLE - Adding shadcn/ui to project:
{ "action": "multi_tool_call", "calls": [
  {"tool": "read_file", "parameters": {"path": "package.json"}, "explanation": "Check current dependencies"},
  {"tool": "add_dependency", "parameters": {"pkg": "@radix-ui/react-slot", "version": "latest"}, "explanation": "Install Radix UI slot component"},
  {"tool": "add_dependency", "parameters": {"pkg": "class-variance-authority", "version": "latest"}, "explanation": "Install CVA for component variants"},
  {"tool": "add_dependency", "parameters": {"pkg": "clsx", "version": "latest"}, "explanation": "Install clsx for conditional classes"},
  {"tool": "add_dependency", "parameters": {"pkg": "tailwind-merge", "version": "latest"}, "explanation": "Install tailwind-merge for class merging"},
  {"tool": "write_file", "parameters": {"path": "lib/utils.ts", "content": "..."}, "explanation": "Create utility functions for shadcn/ui"},
  {"tool": "write_file", "parameters": {"path": "components/ui/button.tsx", "content": "..."}, "explanation": "Create Button component"}
]}

SPECIFIC EXAMPLE - Creating a comprehensive properties listing page (using provided context):
{ "action": "multi_tool_call", "calls": [
  {"tool": "write_file", "parameters": {"path": "app/properties/page.tsx", "content": "..."}, "explanation": "Create comprehensive properties listing page using the property types, data, and components already provided in the PROJECT CONTEXT section above"}
]}

SPECIFIC EXAMPLE - Redesigning homepage (using provided context):
{ "action": "multi_tool_call", "calls": [
  {"tool": "write_file", "parameters": {"path": "app/page.tsx", "content": "..."}, "explanation": "Redesign the homepage using the existing components, styling patterns, and project structure already provided in the PROJECT CONTEXT section above"}
]}

SPECIFIC EXAMPLE - Refactoring code with AST tools:
{ "action": "multi_tool_call", "calls": [
  {"tool": "parse_ast", "parameters": {"filePath": "components/Button.tsx"}, "explanation": "Parse the Button component to understand its structure"},
  {"tool": "refactor_symbol", "parameters": {"oldName": "Button", "newName": "CustomButton", "options": {"dryRun": true}}, "explanation": "Rename Button component to CustomButton across the entire project"},
  {"tool": "extract_method", "parameters": {"filePath": "app/page.tsx", "range": [10, 25], "name": "handleUserClick", "options": {}}, "explanation": "Extract lines 10-25 into a new function called handleUserClick"},
  {"tool": "update_imports", "parameters": {"filePath": "app/page.tsx", "options": {}}, "explanation": "Organize and optimize import statements in the page"}
]}

CRITICAL: Your response must be ONLY the JSON object. No additional text, explanations, or formatting outside the JSON. The response will be parsed directly as JSON.

JSON FORMATTING RULES:
- ALL keys must be in double quotes: "tool", "parameters", "explanation"
- NO trailing commas before closing braces or brackets
- NO unquoted keys or values
- Use proper JSON syntax throughout`

      // Save user message to MongoDB
      if (chatId) {
        await this.saveMessage(chatId, userInput, 'user', 'text', null, {
          projectContext: this.projectRoot
        });
      }

      const response = await this.openai.chat.completions.create({
        model: 'openai/gpt-5',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        temperature: 0.1,
        max_tokens: 20000
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from AI')
      }

      // Log the raw AI response for debugging
      console.log('Raw AI response:', content)

      // Try to parse the AI response as JSON
      let aiResponse
      try {
        aiResponse = JSON.parse(content)
      } catch (parseError) {
        console.error('JSON parse error:', parseError.message)
        console.error('Content that failed to parse:', content)
        
        // Try to fix common JSON syntax errors
        let fixedContent = content
          .replace(/(\w+):/g, '"$1":') // Add quotes around unquoted keys
          .replace(/,\s*}/g, '}') // Remove trailing commas before closing braces
          .replace(/,\s*]/g, ']') // Remove trailing commas before closing brackets
        
        try {
          aiResponse = JSON.parse(fixedContent)
          console.log('Successfully fixed and parsed JSON')
        } catch (fixError) {
          // Try to extract JSON from the response if it's wrapped in text
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            try {
              const extractedJson = jsonMatch[0]
                .replace(/(\w+):/g, '"$1":') // Fix unquoted keys
                .replace(/,\s*}/g, '}') // Remove trailing commas
                .replace(/,\s*]/g, ']') // Remove trailing commas
              aiResponse = JSON.parse(extractedJson)
              console.log('Successfully extracted and fixed JSON from wrapped response')
            } catch (extractError) {
              throw new Error(`Failed to parse AI response as JSON. Raw content: ${content.substring(0, 200)}...`)
            }
          } else {
            // Check if response was truncated
            if (content.length > 7000) {
              throw new Error(`AI response appears to be truncated (${content.length} chars). Response too long. Try breaking the task into smaller steps.`)
            }
            throw new Error(`AI response is not valid JSON. Expected JSON format but got: ${content.substring(0, 200)}...`)
          }
        }
      }

      // Validate the parsed JSON structure
      if (!aiResponse || typeof aiResponse !== 'object') {
        throw new Error('AI response is not a valid object')
      }

      if (!aiResponse.action) {
        throw new Error('AI response missing required "action" field')
      }

      // Execute the tool calls
      if (aiResponse.action === 'tool_call') {
        if (!aiResponse.tool || !aiResponse.parameters) {
          throw new Error('tool_call action missing required "tool" or "parameters" fields')
        }
        // Emit single task start
        await this.emitWebSocketMessage('task_start', {
          tasks: [{
            tool: aiResponse.tool,
            explanation: aiResponse.explanation,
            status: 'running'
          }]
        })
        const result = await this.executeToolCall(aiResponse)
        // Emit single task completion
        await this.emitWebSocketMessage('task_complete', {
          tool: aiResponse.tool,
          success: result.success
        })
        return result
      } else if (aiResponse.action === 'multi_tool_call') {
        if (!aiResponse.calls || !Array.isArray(aiResponse.calls)) {
          throw new Error('multi_tool_call action missing required "calls" array')
        }
        // Emit all tasks start with first one running
        const tasks = aiResponse.calls.map((call, index) => ({
          tool: call.tool,
          explanation: call.explanation,
          status: index === 0 ? 'running' : 'pending'
        }))
        await this.emitWebSocketMessage('tasks_start', { tasks })
        
        return await this.executeMultiToolCall(aiResponse, chatId)
      } else {
        throw new Error(`Invalid AI response action: ${aiResponse.action}. Expected 'tool_call' or 'multi_tool_call'`)
      }
    } catch (error) {
      console.error('Error processing request:', error)
      return {
        success: false,
        error: error.message,
        result: null
      }
    }
  } 

  async executeToolCall(toolCall) {
    try {
      const { tool, parameters, explanation } = toolCall
      console.log(`Executing tool: ${tool}`)
      await new Promise(resolve => setImmediate(resolve)) // Allow logs to flush
      console.log(`Explanation: ${explanation}`)
      await new Promise(resolve => setImmediate(resolve)) // Allow logs to flush
      console.log('Parameters:', parameters)
      await new Promise(resolve => setImmediate(resolve)) // Allow logs to flush

      let result
      switch (tool) {
        // File Operations
        case 'list_files':
          result = await this.tools.list_files(parameters.path)
          break
        case 'read_file':
          result = await this.tools.read_file(parameters.path)
          break
        case 'stream_read_file':
          result = await this.tools.stream_read_file(parameters.path, parameters.start, parameters.end)
          break
        case 'write_file':
          result = await this.tools.write_file(parameters.path, parameters.content)
          break
        case 'create_file':
          result = await this.tools.create_file(parameters.path, parameters.content)
          break
        case 'append_file':
          result = await this.tools.append_file(parameters.path, parameters.content)
          break
        case 'delete_file':
          result = await this.tools.delete_file(parameters.path)
          break
        case 'rename_file':
          result = await this.tools.rename_file(parameters.oldPath, parameters.newPath)
          break
        case 'copy_file':
          result = await this.tools.copy_file(parameters.src, parameters.dest)
          break
        case 'set_file_permissions':
          result = await this.tools.set_file_permissions(parameters.path, parameters.mode)
          break
        case 'stat_file':
          result = await this.tools.stat_file(parameters.path)
          break
        case 'tail_file':
          result = await this.tools.tail_file(parameters.path, parameters.lines)
          break
        case 'apply_patch':
          result = await this.tools.apply_patch(parameters.patch)
          break

        // Search & Navigation
        case 'search_code':
          result = await this.tools.search_code(parameters.query, parameters.options)
          // If search returns no results, suggest alternative approaches
          if (result && result.totalResults === 0) {
            console.log(`Search for "${parameters.query}" returned no results. Consider trying alternative search terms or listing files.`)
          }
          break
        case 'find_symbol':
          result = await this.tools.find_symbol(parameters.name)
          break
        case 'get_outline':
          result = await this.tools.get_outline(parameters.path)
          break
        case 'find_references':
          result = await this.tools.find_references(parameters.symbol)
          break

        // Dependency Management
        case 'get_project_config':
          result = await this.tools.get_project_config()
          break
        case 'list_dependencies':
          result = await this.tools.list_dependencies()
          break
        case 'get_dependency_tree':
          result = await this.tools.get_dependency_tree()
          break
        case 'check_latest_version':
          result = await this.tools.check_latest_version(parameters.pkg)
          break
        case 'bump_dependency':
          result = await this.tools.bump_dependency(parameters.pkg, parameters.version)
          break
        case 'install_dependencies':
          result = await this.tools.install_dependencies()
          break
        case 'remove_dependency':
          result = await this.tools.remove_dependency(parameters.pkg)
          break
        case 'pin_dependencies':
          result = await this.tools.pin_dependencies()
          break

        // AST Refactoring
        case 'parse_ast':
          result = await this.tools.parse_ast(parameters.path)
          break
        case 'ast_edit':
          result = await this.tools.ast_edit(parameters.path, parameters.edits)
          break
        case 'refactor_symbol':
          result = await this.tools.refactor_symbol(parameters.oldName, parameters.newName, parameters.options)
          break
        case 'extract_method':
          result = await this.tools.extract_method(parameters.path, parameters.range, parameters.name, parameters.options)
          break
        case 'inline_function':
          result = await this.tools.inline_function(parameters.path, parameters.symbol)
          break
        case 'change_function_signature':
          result = await this.tools.change_function_signature(parameters.path, parameters.symbol, parameters.newSig, parameters.options)
          break
        case 'apply_codemod':
          result = await this.tools.apply_codemod(parameters.script, parameters.paths, parameters.options)
          break
        case 'update_imports':
          result = await this.tools.update_imports(parameters.path, parameters.options)
          break
        case 'organize_imports':
          result = await this.tools.organize_imports(parameters.options)
          break
        case 'find_ts_references':
          result = await this.tools.find_ts_references(parameters.path, parameters.position, parameters.options)
          break
        case 'move_paths':
          result = await this.tools.move_paths(parameters.moves, parameters.options)
          break

        // Semantic Search
        case 'semantic_search':
          result = await this.tools.semantic_search(parameters.query, parameters.options)
          break
        case 'generate_embeddings':
          result = await this.tools.generate_embeddings(parameters.fileTypes)
          break
        case 'find_similar_code':
          result = await this.tools.find_similar_code(parameters.code, parameters.options)
          break

        // Session Memory
        case 'record_edit':
          result = await this.tools.record_edit(parameters.filePath, parameters.operation, parameters.details)
          break
        case 'record_patch':
          result = await this.tools.record_patch(parameters.patch, parameters.filePath, parameters.result)
          break
        case 'record_reasoning':
          result = await this.tools.record_reasoning(parameters.context, parameters.decision, parameters.factors)
          break
        case 'get_edit_history':
          result = await this.tools.get_edit_history(parameters.options)
          break
        case 'get_patch_history':
          result = await this.tools.get_patch_history(parameters.options)
          break
        case 'rollback_edit':
          result = await this.tools.rollback_edit(parameters.editId)
          break
        case 'rollback_patch':
          result = await this.tools.rollback_patch(parameters.patchId)
          break
        case 'get_session_summary':
          result = await this.tools.get_session_summary()
          break
        case 'clear_memory':
          result = await this.tools.clear_memory()
          break

        // Safe Sandbox
        case 'validate_path':
          result = await this.tools.validate_path(parameters.filePath, parameters.operation)
          break
        case 'validate_content':
          result = await this.tools.validate_content(parameters.content, parameters.filePath)
          break
        case 'validate_command':
          result = await this.tools.validate_command(parameters.command, parameters.args)
          break
        case 'get_sandbox_config':
          result = await this.tools.get_sandbox_config()
          break

        // Automated Testing
        case 'run_tests':
          result = await this.tools.run_tests(parameters.options)
          break
        case 'run_linting':
          result = await this.tools.run_linting(parameters.options)
          break
        case 'run_type_check':
          result = await this.tools.run_type_check(parameters.options)
          break

        // Terminal & System Tools
        case 'run_command':
          result = await this.tools.run_command(parameters.command, parameters.cwd)
          break
        case 'stream_command':
          result = await this.tools.stream_command(parameters.command, parameters.cwd)
          break
        case 'kill_process':
          result = await this.tools.kill_process(parameters.pid)
          break
        case 'add_dependency':
          result = await this.tools.add_dependency(parameters.pkg, parameters.version)
          break
        case 'get_running_processes':
          result = await this.tools.get_running_processes()
          break

        // AST Refactoring Tools
        case 'parse_ast':
          result = await this.tools.astRefactoring.parse_ast(parameters.filePath)
          break
        case 'ast_edit':
          result = await this.tools.astRefactoring.ast_edit(parameters.filePath, parameters.edits)
          break
        case 'refactor_symbol':
          result = await this.tools.astRefactoring.refactor_symbol(parameters.oldName, parameters.newName, parameters.options)
          break
        case 'extract_method':
          result = await this.tools.astRefactoring.extract_method(parameters.filePath, parameters.range, parameters.name, parameters.options)
          break
        case 'inline_function':
          result = await this.tools.astRefactoring.inline_function(parameters.filePath, parameters.symbol)
          break
        case 'change_function_signature':
          result = await this.tools.astRefactoring.change_function_signature(parameters.filePath, parameters.symbol, parameters.newSig, parameters.options)
          break
        case 'apply_codemod':
          result = await this.tools.astRefactoring.apply_codemod(parameters.script, parameters.paths, parameters.options)
          break
        case 'update_imports':
          result = await this.tools.astRefactoring.update_imports(parameters.filePath, parameters.options)
          break
        case 'organize_imports':
          result = await this.tools.astRefactoring.organize_imports(parameters.options)
          break
        case 'find_references':
          result = await this.tools.astRefactoring.find_references(parameters.filePath, parameters.position, parameters.options)
          break
        case 'move_paths':
          result = await this.tools.astRefactoring.move_paths(parameters.moves, parameters.options)
          break

        // Additional tools that might be missing
        case 'cleanup':
          result = await this.tools.cleanup()
          break

        default:
          throw new Error(`Unknown tool: ${tool}`)
      }

      return { success: true, tool: tool, explanation: explanation, result: result }
    } catch (error) {
      return { success: false, tool: toolCall.tool, explanation: toolCall.explanation, error: error.message, result: null }
    }
  }

  async executeMultiToolCall(multiToolCall, chatId = null) {
    const results = []
    const totalTasks = multiToolCall.calls.length
    
    // Create initial tasks array
    const tasks = multiToolCall.calls.map((call, index) => ({
      tool: call.tool,
      explanation: call.explanation,
      status: 'pending'
    }))
    
    // Save initial todoList message to MongoDB
    let todoListMessage = null
    if (chatId) {
      todoListMessage = await this.saveTodoListMessage(chatId, tasks)
      console.log('📝 Saved initial todoList message to MongoDB:', todoListMessage?._id)
    }
    
    for (let i = 0; i < multiToolCall.calls.length; i++) {
      const toolCall = multiToolCall.calls[i]
      
      // Update task status to running in MongoDB
      if (chatId && todoListMessage) {
        await this.updateTodoListMessage(chatId, todoListMessage._id, i, 'running')
        console.log(`📝 Updated todoList message - task ${i + 1} running`)
        
        // Emit WebSocket message to notify frontend
        await this.emitWebSocketMessage('todoList_updated', {
          messageId: todoListMessage._id,
          taskIndex: i,
          status: 'running'
        })
      }
      
      const result = await this.executeToolCall(toolCall)
      results.push(result)
      
      // Update task status to done/failed in MongoDB
      if (chatId && todoListMessage) {
        const finalStatus = result.success ? 'done' : 'failed'
        await this.updateTodoListMessage(chatId, todoListMessage._id, i, finalStatus)
        console.log(`📝 Updated todoList message - task ${i + 1} ${finalStatus}`)
        
        // Emit WebSocket message to notify frontend
        await this.emitWebSocketMessage('todoList_updated', {
          messageId: todoListMessage._id,
          taskIndex: i,
          status: finalStatus
        })
      }
      
      // If a search failed, log a helpful message
      if (toolCall.tool === 'search_code' && result.success && result.result && result.result.totalResults === 0) {
        console.log(`⚠️  Search for "${toolCall.parameters.query}" found no results. Consider trying different search terms or listing files in the directory.`)
        await new Promise(resolve => setImmediate(resolve)) // Allow logs to flush
      }
    }
    
    console.log('📝 All tasks completed in todoList message')
    
    return { success: results.every(r => r.success), results: results }
  }
}

module.exports = AIAgent 