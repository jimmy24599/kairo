const { Tools } = require('./tools') 
const OpenAI = require('openai') 
const Message = require('./models/Message') 
const Chat = require('./models/Chat') 
const Todo = require('./models/Todo')
const Subtask = require('./models/Subtask')

class Agent {
  constructor(projectRoot) {
  console.log('Agent constructor - API Key check:') 
    console.log('OPENROUTER_API_KEY exists:', !!process.env.OPENROUTER_API_KEY)
    console.log('OPENROUTER_API_KEY length:', process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.length : 0)
    console.log('OPENROUTER_BASE_URL:', process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1')
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
    })
  this.tools = new Tools(projectRoot) 
  this.projectRoot = projectRoot 
    this.maxIterations = 10
    // Separate models for planning vs execution
    this.modelTodo = process.env.OPENROUTER_TODO_MODEL || 'openai/gpt-4o-mini'
    this.modelExecute = process.env.OPENROUTER_EXECUTE_MODEL || 'openai/gpt-4o'
    // Enable WebSocket emits for real-time updates
    this.wsEnabled = true
  }

  maybeSend(ws, payload) {
    if (this.wsEnabled && ws) {
      try { ws.send(JSON.stringify(payload)) } catch {}
    }
  }

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
      
      // Update chat's last message time and message count
      await Chat.findByIdAndUpdate(chatId, {
        lastMessageAt: new Date(),
        $inc: { messageCount: 1 }
      });
      
      return message; 
    } catch (error) { 
      console.error('Error saving message:', error);
      return null;
    }
  }

  async updateStepMessage(chatId, tool, result) {
    try {
      if (!chatId) return null;
      
      // Find the most recent step message for this tool
      const stepMessage = await Message.findOne({
        chatId,
        messageType: 'step',
        'stepData.tool': tool,
        'stepData.status': 'active'
      }).sort({ createdAt: -1 });
      
      if (stepMessage) {
        // Update the step message with completion status
        stepMessage.stepData.status = result.success ? 'completed' : 'error';
        stepMessage.stepData.linesAdded = result.linesAdded || 0;
        stepMessage.stepData.linesRemoved = result.linesRemoved || 0;
        stepMessage.stepData.filePath = result.filePath || null;
        stepMessage.stepData.error = result.error || null;
        await stepMessage.save();
        return stepMessage;
      }
      return null;
    } catch (error) {
      console.error('Error updating step message:', error);
      return null;
    }
  } 
  async processRequest(userInput, projectFiles = [], ws = null, chatId = null, projectName = null) {
    console.log('=== AGENT REQUEST START ===')
    console.log('User input:', userInput)
    console.log('Project root:', this.projectRoot)
    console.log('Project files count:', projectFiles.length)
    console.log('Chat ID:', chatId)
    console.log('============================')
    
    // Save user message to database
    if (chatId) {
      await this.saveMessage(chatId, userInput, 'user', 'text', null, {
        projectContext: projectName
      });
    }

    const systemPrompt = `You are an AI coding assistant with access to powerful development tools. CRITICAL: You MUST respond with ONLY valid JSON. Do NOT provide natural language explanations. Use tools to complete tasks.

Available Tools:
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
- parse_ast(path) → return language AST
- ast_edit(path, edits) → perform AST-safe edits
- refactor_symbol(oldName, newName, options?) → safe rename across files
- extract_method(path, range, name, options?) → extract code block to function
- inline_function(path, symbol) → inline a function
- change_function_signature(path, symbol, newSig, options?) → update calls/imports
- apply_codemod(script, paths?, options?) → run JS/Python codemod
- update_imports(path?, options?) → fix/optimize imports in file
- organize_imports(options?) → organize imports across project
- find_ts_references(path, position, options?) → find TypeScript references
- move_paths(moves, options?) → move/rename files and update imports

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
- run_build(options?) → run build process
- run_type_check(options?) → run type checking

Terminal & System Tools:
- run_command(command, cwd?) → run any shell command in the project directory
- stream_command(command, cwd?) → stream stdout/stderr line by line (useful for long-running dev servers/tests)
- kill_process(pid) → stop a running process started by the agent (like a server)
- add_dependency(pkg, version?) → install a single dependency
- get_running_processes() → get list of running processes

Project Root: ${this.projectRoot}
Current Files: ${projectFiles.map(f => f.path).join(', ')}

You work in an iterative loop:
1. Analyze the user's request
2. Use tools to gather information or make changes
3. Based on tool results, decide if you need more information or if the task is complete
4. Continue until the task is fully completed

When you need to use a tool, respond with a JSON object containing:
{ "tool": "tool_name", "explanation": "What you're doing and why", "parameters": { "param1": "value1", "param2": "value2" } }

When the task is complete, respond with:
{ "complete": true, "summary": "Summary of what was accomplished" }

Use the most appropriate tool for the task. Be specific and helpful.`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userInput }
    ]

    let iteration = 0
    let isComplete = false
    let toolsUsed = 0

    while (!isComplete && iteration < this.maxIterations) {
      iteration++
      console.log(`Iteration ${iteration}/${this.maxIterations}, Tools used: ${toolsUsed}`)
      
      try {
        // Send status update
        if (ws) {
          ws.send(JSON.stringify({
            type: 'iteration',
            iteration,
            maxIterations: this.maxIterations
          }))
        }

        const response = await this.openai.chat.completions.create({
          model: this.modelExecute,
          messages: messages,
          temperature: 0.1
        })

        const content = response.choices[0].message.content
        console.log('=== AI RESPONSE ===')
        console.log('Raw content:', content)
        console.log('Content length:', content.length)
        console.log('==================')

        // Add AI response to messages
        messages.push({ role: 'assistant', content: content })

        // Parse the JSON response with retry logic
        let parsedResponse
        try {
          parsedResponse = JSON.parse(content)
          console.log('=== PARSED RESPONSE ===')
          console.log('Successfully parsed JSON:', JSON.stringify(parsedResponse, null, 2))
          console.log('Has tool field:', !!parsedResponse.tool)
          console.log('Has complete field:', !!parsedResponse.complete)
          console.log('========================')
        } catch (error) {
          // JSON parsing failed - ask AI to reformat
          console.log('=== JSON PARSING FAILED ===')
          console.log('Error:', error.message)
          console.log('Content that failed to parse:', content)
          console.log('============================')
          messages.push({
            role: 'user',
            content: 'ERROR: Your response was not valid JSON. You provided natural language instead of JSON. You MUST respond with ONLY valid JSON using the tool format. Example: {"tool": "read_file", "explanation": "Reading file", "parameters": {"path": "app/page.tsx"}}. Do NOT provide explanations without using tools.'
          })
          continue
        }

        // Check if task is complete - but only allow completion after at least one tool has been used
        if (parsedResponse.complete && toolsUsed > 0) {
          console.log('=== TASK COMPLETION ===')
          console.log('AI marked complete after using', toolsUsed, 'tools')
          console.log('Summary:', parsedResponse.summary)
          console.log('=======================')
          isComplete = true
          if (ws) {
            ws.send(JSON.stringify({ type: 'complete', summary: parsedResponse.summary }))
          }
          // Save summary message to database
          if (chatId) {
            await this.saveMessage(chatId, `✅ **Task Completed**: ${parsedResponse.summary}`, 'assistant', 'summary', null, { projectContext: projectName });
          }
          return {
            success: true,
            complete: true,
            summary: parsedResponse.summary,
            iterations: iteration
          }
        } else if (parsedResponse.complete && toolsUsed === 0) {
          // AI trying to complete without using any tools - force tool usage
          console.log('=== PREMATURE COMPLETION BLOCKED ===')
          console.log('AI tried to complete without using any tools')
          console.log('Tools used so far:', toolsUsed)
          console.log('Forcing tool usage...')
          console.log('===============================')
          messages.push({
            role: 'user',
            content: 'ERROR: You cannot mark the task as complete without using tools. You MUST use tools to complete tasks. Start with: {"tool": "read_file", "explanation": "Reading the current file", "parameters": {"path": "app/page.tsx"}}. Do NOT provide explanations without using tools.'
          })
          continue
        }

        // Handle single tool execution
        if (parsedResponse.tool) {
          console.log('=== SINGLE TOOL EXECUTION ===')
          console.log('Tool:', parsedResponse.tool)
          console.log('Explanation:', parsedResponse.explanation)
          console.log('Parameters:', parsedResponse.parameters)
          console.log('=============================')

          // Single tool execution
          const { tool, explanation, parameters } = parsedResponse

          // Send tool execution status IMMEDIATELY
          if (ws) {
            console.log('Sending tool_execution message to frontend')
            ws.send(JSON.stringify({ type: 'tool_execution', tool, explanation, parameters }))
          }

          // Save step message to database
          if (chatId) {
            await this.saveMessage(chatId, explanation, 'assistant', 'step', { tool, explanation, parameters, status: 'active' }, { projectContext: projectName });
          }

          // Execute the tool with retry logic
          const result = await this.executeToolWithRetry(tool, parameters, ws)
          toolsUsed++

          // Add a small delay to make processing visible
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Add tool result to messages for next iteration
          const toolResultMessage = `Tool: ${tool}
Parameters: ${JSON.stringify(parameters, null, 2)}
Result: ${JSON.stringify(result, null, 2)}`
          messages.push({ role: 'user', content: toolResultMessage })

          // Send tool result
          if (ws) {
            console.log(`=== COMPLETED TOOL: ${tool} ===`)
            console.log('Result success:', result.success)
            console.log('Sending tool_result message to frontend')
            ws.send(JSON.stringify({ type: 'tool_result', tool, result }))
          }

          // Update step message in database
          if (chatId) {
            await this.updateStepMessage(chatId, tool, result);
          }
        } else {
          // No tool specified - this is an error, not completion
          console.log('=== NO TOOL SPECIFIED ===')
          console.log('Response keys:', Object.keys(parsedResponse))
          console.log('Full response:', parsedResponse)
          console.log('This is an error - AI should use tools!')
          console.log('=========================')
          if (ws) {
            ws.send(JSON.stringify({ type: 'error', message: 'No tool specified in response. Please use tools to complete the task.' }))
          }
          // Ask AI to use tools
          messages.push({
            role: 'user',
            content: 'ERROR: You must use tools to complete this task. Respond with JSON like: {"tool": "read_file", "explanation": "Reading file", "parameters": {"path": "app/page.tsx"}}. Do NOT provide explanations without using tools.'
          })
          continue // Try again
        }
      } catch (error) {
        if (ws) {
          ws.send(JSON.stringify({ type: 'error', message: error.message }))
        }
        return { success: false, error: error.message, iterations: iteration }
      }
    }

    // Max iterations reached
    if (ws) {
      ws.send(JSON.stringify({ type: 'complete', summary: `Task completed after ${iteration} iterations (max reached)` }))
    }
    return {
      success: true,
      complete: true,
      summary: `Task completed after ${iteration} iterations (max reached)`,
      iterations: iteration
    }
  }

  async executeToolWithRetry(tool, parameters, ws = null, maxRetries = 3) {
    let lastError = null
    
    console.log(`=== EXECUTING TOOL: ${tool} ===`)
    console.log('Parameters:', JSON.stringify(parameters, null, 2))
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Tool ${tool} attempt ${attempt}/${maxRetries}`)
        const result = await this.executeTool(tool, parameters)
        console.log(`Tool ${tool} result:`, JSON.stringify(result, null, 2))
        
        return result
      } catch (error) {
        lastError = error
        console.log(`Tool ${tool} attempt ${attempt} failed:`, error.message)
        
        this.maybeSend(ws, { type: 'tool_retry', tool, attempt, maxRetries, error: error.message })
        
        // Don't retry for certain types of errors
        if (this.isNonRetryableError(error)) {
          break
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }
    
    return {
      success: false,
      error: lastError.message,
      attempts: maxRetries
    }
  }

  isNonRetryableError(error) {
    const nonRetryablePatterns = [
      'Unknown tool',
      'File not found',
      'Permission denied',
      'Invalid parameters',
      'Syntax error'
    ]
    
    return nonRetryablePatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern.toLowerCase())
    )
  }

  async executeTool(tool, parameters) {
    try {
      switch (tool) {
        // File Operations
        case 'list_files':
          return await this.tools.list_files(parameters.path)
        case 'read_file':
          return await this.tools.read_file(parameters.path)
        case 'stream_read_file':
          return await this.tools.stream_read_file(parameters.path, parameters.start, parameters.end)
        case 'write_file':
          return await this.tools.write_file(parameters.path, parameters.content)
        case 'create_file':
          return await this.tools.create_file(parameters.path, parameters.content)
        case 'append_file':
          return await this.tools.append_file(parameters.path, parameters.content)
        case 'delete_file':
          return await this.tools.delete_file(parameters.path)
        case 'rename_file':
          return await this.tools.rename_file(parameters.oldPath, parameters.newPath)
        case 'copy_file':
          return await this.tools.copy_file(parameters.src, parameters.dest)
        case 'set_file_permissions':
          return await this.tools.set_file_permissions(parameters.path, parameters.mode)
        case 'stat_file':
          return await this.tools.stat_file(parameters.path)
        case 'tail_file':
          return await this.tools.tail_file(parameters.path, parameters.lines)
        case 'apply_patch':
          return await this.tools.apply_patch(parameters.patch)

        // Search & Navigation
        case 'search_code':
          return await this.tools.search_code(parameters.query, parameters.options)
        case 'find_symbol':
          return await this.tools.find_symbol(parameters.name)
        case 'get_outline':
          return await this.tools.get_outline(parameters.path)
        case 'find_references':
          return await this.tools.find_references(parameters.symbol)

        // Dependency Management
        case 'get_project_config':
          return await this.tools.get_project_config()
        case 'list_dependencies':
          return await this.tools.list_dependencies()
        case 'get_dependency_tree':
          return await this.tools.get_dependency_tree()
        case 'check_latest_version':
          return await this.tools.check_latest_version(parameters.pkg)
        case 'bump_dependency':
          return await this.tools.bump_dependency(parameters.pkg, parameters.version)
        case 'install_dependencies':
          return await this.tools.install_dependencies()
        case 'remove_dependency':
          return await this.tools.remove_dependency(parameters.pkg)
        case 'pin_dependencies':
          return await this.tools.pin_dependencies()

        // AST Refactoring
        case 'parse_ast':
          return await this.tools.parse_ast(parameters.path)
        case 'ast_edit':
          return await this.tools.ast_edit(parameters.path, parameters.edits)
        case 'refactor_symbol':
          return await this.tools.refactor_symbol(parameters.oldName, parameters.newName, parameters.options)
        case 'extract_method':
          return await this.tools.extract_method(parameters.path, parameters.range, parameters.name, parameters.options)
        case 'inline_function':
          return await this.tools.inline_function(parameters.path, parameters.symbol)
        case 'change_function_signature':
          return await this.tools.change_function_signature(parameters.path, parameters.symbol, parameters.newSig, parameters.options)
        case 'apply_codemod':
          return await this.tools.apply_codemod(parameters.script, parameters.paths, parameters.options)
        case 'update_imports':
          return await this.tools.update_imports(parameters.path, parameters.options)
        case 'organize_imports':
          return await this.tools.organize_imports(parameters.options)
        case 'find_ts_references':
          return await this.tools.find_ts_references(parameters.path, parameters.position, parameters.options)
        case 'move_paths':
          return await this.tools.move_paths(parameters.moves, parameters.options)

        // Semantic Search
        case 'semantic_search':
          return await this.tools.semantic_search(parameters.query, parameters.options)
        case 'generate_embeddings':
          return await this.tools.generate_embeddings(parameters.fileTypes)
        case 'find_similar_code':
          return await this.tools.find_similar_code(parameters.code, parameters.options)

        // Session Memory
        case 'record_edit':
          return await this.tools.record_edit(parameters.filePath, parameters.operation, parameters.details)
        case 'record_patch':
          return await this.tools.record_patch(parameters.patch, parameters.filePath, parameters.result)
        case 'record_reasoning':
          return await this.tools.record_reasoning(parameters.context, parameters.decision, parameters.factors)
        case 'get_edit_history':
          return await this.tools.get_edit_history(parameters.options)
        case 'get_patch_history':
          return await this.tools.get_patch_history(parameters.options)
        case 'rollback_edit':
          return await this.tools.rollback_edit(parameters.editId)
        case 'rollback_patch':
          return await this.tools.rollback_patch(parameters.patchId)
        case 'get_session_summary':
          return await this.tools.get_session_summary()
        case 'clear_memory':
          return await this.tools.clear_memory()

        // Safe Sandbox
        case 'validate_path':
          return await this.tools.validate_path(parameters.filePath, parameters.operation)
        case 'validate_content':
          return await this.tools.validate_content(parameters.content, parameters.filePath)
        case 'validate_command':
          return await this.tools.validate_command(parameters.command, parameters.args)
        case 'get_sandbox_config':
          return await this.tools.get_sandbox_config()

        // Automated Testing
        case 'run_tests':
          return await this.tools.run_tests(parameters.options)
        case 'run_linting':
          return await this.tools.run_linting(parameters.options)
        case 'run_build':
          return await this.tools.run_build(parameters.options)
        case 'run_type_check':
          return await this.tools.run_type_check(parameters.options)

        // Terminal & System Tools
        case 'run_command':
          return await this.tools.run_command(parameters.command, parameters.cwd)
        case 'stream_command':
          return await this.tools.stream_command(parameters.command, parameters.cwd)
        case 'kill_process':
          return await this.tools.kill_process(parameters.pid)
        case 'add_dependency':
          return await this.tools.add_dependency(parameters.pkg, parameters.version)
        case 'get_running_processes':
          return await this.tools.get_running_processes()

        default:
          throw new Error(`Unknown tool: ${tool}`)
      }
    } catch (error) {
      console.error(`Error executing tool ${tool}:`, error)
      return { success: false, error: error.message }
    }
  }
}

module.exports = Agent