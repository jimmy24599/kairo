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

  async generateSubtasksForTodos(chatId, ws = null) {
    const fs = require('fs-extra')
    const path = require('path')
    const summaryPath = path.join(this.projectRoot, 'agent_summary.json')
    let summary = null
    if (await fs.pathExists(summaryPath)) {
      try { summary = JSON.parse(await fs.readFile(summaryPath, 'utf-8')) } catch {}
    }

    // Get todos for this chat that don't have subtasks yet (created in the last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const todos = await Todo.find({ 
      chatId, 
      createdAt: { $gte: tenMinutesAgo },
      $or: [
        { subtask: { $exists: false } },
        { subtask: null }
      ]
    }).sort({ order: 1 })
    
    console.log(`Found ${todos.length} todos without subtasks for chatId: ${chatId}`)
    if (todos.length === 0) {
      console.log('No todos found without subtasks, checking all todos for this chat...')
      const allTodos = await Todo.find({ chatId }).sort({ order: 1 })
      console.log(`Total todos for chatId ${chatId}:`, allTodos.length)
      allTodos.forEach(todo => {
        console.log(`Todo ${todo.order}: ${todo.taskName} (subtask: ${todo.subtask})`)
      })
      return []
    }

    const toolsBrief = [
      { name: 'list_files', desc: 'List files in a directory', parameters: { path: 'directory path (relative or absolute)' } },
      { name: 'read_file', desc: 'Read file content', parameters: { path: 'file path' } },
      { name: 'write_file', desc: 'Overwrite file with content', parameters: { path: 'file path', content: 'string content' } },
      { name: 'create_file', desc: 'Create a new file with content', parameters: { path: 'file path', content: 'string content' } },
      { name: 'delete_file', desc: 'Delete a file', parameters: { path: 'file path' } },
      { name: 'rename_file', desc: 'Rename a file or move it', parameters: { oldPath: 'source path', newPath: 'destination path' } },
      { name: 'copy_file', desc: 'Copy a file', parameters: { src: 'source path', dest: 'destination path' } },
      { name: 'search_code', desc: 'Search code by pattern or query', parameters: { query: 'string query', options: 'optional search options' } },
      { name: 'find_symbol', desc: 'Find symbol definitions', parameters: { name: 'symbol name' } },
      { name: 'get_outline', desc: 'Get file structure outline', parameters: { path: 'file path' } },
      { name: 'find_references', desc: 'Find references via search navigation', parameters: { symbol: 'symbol name' } },
      { name: 'get_project_config', desc: 'Read project config summary', parameters: {} },
      { name: 'list_dependencies', desc: 'List dependencies from package.json', parameters: {} },
      { name: 'install_dependencies', desc: 'Install npm dependencies', parameters: {} },
      { name: 'add_dependency', desc: 'Add a dependency', parameters: { pkg: 'package name', version: 'version (optional)' } },
      { name: 'remove_dependency', desc: 'Remove a dependency', parameters: { pkg: 'package name' } },
      { name: 'run_command', desc: 'Run a shell command', parameters: { command: 'command string', cwd: 'working directory (optional)' } },
      { name: 'run_tests', desc: 'Run test suite', parameters: { options: 'runner options (optional)' } },
      { name: 'run_linting', desc: 'Run linter', parameters: { options: 'linter options (optional)' } },
      // AST & Refactoring tools
      { name: 'parse_ast', desc: 'Parse and return AST metadata for a file', parameters: { path: 'file path' } },
      { name: 'ast_edit', desc: 'Apply AST-safe code edits', parameters: { path: 'file path', edits: 'array of edit operations' } },
      { name: 'refactor_symbol', desc: 'Type-aware rename symbol across project (TS when available)', parameters: { oldName: 'current name', newName: 'new name', options: 'refactor options (optional)' } },
      { name: 'extract_method', desc: 'Extract selected lines into a new function (type-aware when TS)', parameters: { path: 'file path', range: '[startLine, endLine]', name: 'new function name', options: 'refactor options (optional)' } },
      { name: 'inline_function', desc: 'Inline a function into call sites (best-effort)', parameters: { path: 'file path', symbol: 'function name' } },
      { name: 'change_function_signature', desc: 'Change a function signature and update calls (TS when available)', parameters: { path: 'file path', symbol: 'function name', newSig: 'signature object', options: 'refactor options (optional)' } },
      { name: 'apply_codemod', desc: 'Run a jscodeshift codemod across files', parameters: { script: 'codemod JS source', paths: 'array of file/dir globs (optional)', options: 'codemod options (optional)' } },
      { name: 'update_imports', desc: 'Organize/optimize imports in a file or project', parameters: { path: 'file path or null', options: 'organize options (optional)' } },
      { name: 'organize_imports', desc: 'Organize/optimize imports across project', parameters: { options: 'organize options (optional)' } },
      { name: 'find_ts_references', desc: 'Find references using TypeScript language service', parameters: { path: 'file path', position: 'offset or [line, col]', options: 'lookup options (optional)' } },
      { name: 'move_paths', desc: 'Move/rename files or folders and update imports (TS aware)', parameters: { moves: '[{ oldPath, newPath }]', options: 'move options (optional)' } }
    ]

    const results = []
    for (const todo of todos) {
      const sys = `You are a senior engineer. Generate 3-5 concise, ordered subtasks to accomplish the given TODO. Use ONLY the provided tools. No tests/builds unless explicitly required.

IMPORTANT FORMATTING RULES:
- Keep subtasks simple and focused
- For code generation, use shorter, essential code only
- Use \\n for line breaks in JSON strings
- Write functional code, not full components unless necessary
- Ensure proper indentation and syntax

CRITICAL: Return ONLY the JSON object. Do not include any explanatory text, comments, or markdown formatting. Start your response directly with { and end with }.

Return ONLY a JSON object with this exact structure:
{
  "subtasks": [
    {
      "name": "Task description",
      "tool": "tool_name",
      "parameters": {
        "path": "file/path",
        "content": "concise\\ncode\\nonly"
      }
    }
  ]
}`

      const msgs = [
        { role: 'system', content: sys },
        { role: 'user', content: `SUMMARY:\n${summary ? JSON.stringify(summary.llm || summary.structure) : 'N/A'}` },
        { role: 'user', content: `TODO:\n${todo.taskName}` },
        { role: 'user', content: `TOOLS:\n${toolsBrief.map(t => `${t.name}: ${t.desc} | params: ${Object.keys(t.parameters || {}).join(', ')}`).join('\n')}` }
      ]

      const resp = await this.openai.chat.completions.create({
        model: this.modelTodo,
        messages: msgs,
        response_format: { type: 'json_object' },
        max_completion_tokens: 2000
      })

      const content = (resp.choices?.[0]?.message?.content || '').trim()
      console.log('Subtask generation response:', content)
      
      let parsed
      try { 
        // Extract JSON from the response (handle text before JSON and markdown blocks)
        let jsonContent = content
        
        // Remove markdown code blocks if present
        if (jsonContent.includes('```json')) {
          const jsonStart = jsonContent.indexOf('```json') + 7
          const jsonEnd = jsonContent.lastIndexOf('```')
          if (jsonEnd > jsonStart) {
            jsonContent = jsonContent.substring(jsonStart, jsonEnd).trim()
          }
        } else if (jsonContent.includes('```')) {
          const jsonStart = jsonContent.indexOf('```') + 3
          const jsonEnd = jsonContent.lastIndexOf('```')
          if (jsonEnd > jsonStart) {
            jsonContent = jsonContent.substring(jsonStart, jsonEnd).trim()
          }
        } else {
          // Look for JSON object starting with {
          const jsonStart = jsonContent.indexOf('{')
          if (jsonStart > 0) {
            jsonContent = jsonContent.substring(jsonStart).trim()
          }
        }
        
        parsed = JSON.parse(jsonContent)
      } catch (e) { 
        console.error('Failed to parse subtasks JSON:', e)
        console.error('Raw content:', content)
        
        // Check if the response was truncated
        if (content.includes('"subtasks"') && !content.endsWith('}')) {
          console.error('Response appears to be truncated. Attempting to fix...')
          // Try to complete the JSON by adding missing closing brackets
          let fixedContent = content
          
          // Find the last complete subtask and truncate there
          const lastCompleteSubtask = fixedContent.lastIndexOf('},')
          if (lastCompleteSubtask > 0) {
            fixedContent = fixedContent.substring(0, lastCompleteSubtask + 1)
          }
          
          const openBraces = (fixedContent.match(/\{/g) || []).length
          const closeBraces = (fixedContent.match(/\}/g) || []).length
          const openBrackets = (fixedContent.match(/\[/g) || []).length
          const closeBrackets = (fixedContent.match(/\]/g) || []).length
          
          // Add missing closing brackets
          for (let i = 0; i < (openBrackets - closeBrackets); i++) {
            fixedContent += ']'
          }
          for (let i = 0; i < (openBraces - closeBraces); i++) {
            fixedContent += '}'
          }
          
          try {
            // Extract JSON from fixed content
            let jsonContent = fixedContent
            if (jsonContent.includes('```json')) {
              const jsonStart = jsonContent.indexOf('```json') + 7
              const jsonEnd = jsonContent.lastIndexOf('```')
              if (jsonEnd > jsonStart) {
                jsonContent = jsonContent.substring(jsonStart, jsonEnd).trim()
              }
            } else if (jsonContent.includes('```')) {
              const jsonStart = jsonContent.indexOf('```') + 3
              const jsonEnd = jsonContent.lastIndexOf('```')
              if (jsonEnd > jsonStart) {
                jsonContent = jsonContent.substring(jsonStart, jsonEnd).trim()
              }
            } else {
              const jsonStart = jsonContent.indexOf('{')
              if (jsonStart > 0) {
                jsonContent = jsonContent.substring(jsonStart).trim()
              }
            }
            
            parsed = JSON.parse(jsonContent)
            console.log('Successfully fixed truncated JSON')
          } catch (fixError) {
            console.error('Failed to fix truncated JSON:', fixError)
            throw new Error(`Failed to parse subtasks JSON (truncated): ${e.message}`)
          }
        } else {
          throw new Error(`Failed to parse subtasks JSON: ${e.message}`)
        }
      }
      
      const arr = Array.isArray(parsed) ? parsed : parsed?.subtasks
      if (!Array.isArray(arr)) {
        console.error('Model did not return subtasks array:', parsed)
        throw new Error('Model did not return subtasks[]')
      }

      const map = new Map()
      for (let i = 0; i < arr.length; i++) {
        const it = arr[i]
        map.set(i.toString(), {
          name: it.name || it.text || `Subtask ${i + 1}`,
          tool: it.tool || 'read_file',
          parameters: it.parameters || {},
          status: 'pending'
        })
      }

      const doc = await Subtask.findOneAndUpdate(
        { chatId, todoId: todo._id },
        { chatId, todoId: todo._id, tasksName: map },
        { new: true, upsert: true }
      )
      // Link Subtask to Todo
      try {
        await Todo.updateOne({ _id: todo._id }, { $set: { subtask: doc._id } })
      } catch (e) {
        console.error('Failed to link subtask to todo:', e.message)
      }
      results.push(doc)
    }

    return results
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

    // Step 1: Generate or load project summary (structure + key files)
    console.log('=== STEP 1: PROJECT SUMMARY (STRUCTURE DISCOVERY) ===')
    this.maybeSend(ws, { type: 'agent_reasoning', thought: 'Preparing/Loading project summary (structure, key files) to understand the codebase...' })

    const summary = await this.generateOrLoadProjectSummary(userInput, projectFiles, ws, projectName)
    console.log('Project summary prepared:', summary?.meta)

    // Step 2: Analyze project structure (lightweight, leveraging summary)
    console.log('=== STEP 2: ANALYZING PROJECT STRUCTURE ===')
    const projectAnalysis = await this.analyzeProject(projectFiles, ws)
    console.log('Project analysis:', projectAnalysis)

    // Step 3: Generate overview todo list based on user request and project summary
    console.log('=== STEP 3: GENERATING OVERVIEW TODO LIST ===')
    this.maybeSend(ws, { type: 'agent_reasoning', thought: 'Creating a concise, execution-ready overview plan (no tests/builds) based on your request and project summary...' })

    let todoList
    try {
      todoList = await this.generateOverviewTodos(userInput, ws, chatId)
      console.log('Generated todo list:', todoList)
    } catch (err) {
      console.error('Failed to generate todo list:', err)
      if (ws) {
        ws.send(JSON.stringify({
          type: 'error',
          scope: 'todo_generation',
          message: `Failed to generate todo list: ${err.message}`
        }))
      }
      if (chatId) {
        await this.saveMessage(chatId, `Error: Failed to generate todo list: ${err.message}`, 'agent', 'text', null, { projectContext: projectName })
      }
      return {
        complete: true,
        success: false,
        summary: `Failed to generate todo list: ${err.message}`,
        todoList: []
      }
    }

    // Save todo list to database
    if (chatId) {
      const todoStepData = {
        tasks: todoList,
        currentThought: 'Task plan created successfully',
        progress: {
          completed: 0,
          total: todoList.length,
          percent: 0
        }
      }
      console.log('Saving initial todo message with stepData:', todoStepData)
      await this.saveMessage(chatId, 'Generated task plan', 'agent', 'todo', todoStepData, {
        projectContext: projectName
      });
    }

    // Send todo list to frontend
    this.maybeSend(ws, { type: 'todo', tasks: todoList, currentThought: 'Task plan created successfully', progress: { completed: 0, total: todoList.length, percent: 0 } })
    // Notify frontend that todos have been updated
    this.maybeSend(ws, { type: 'todos_updated', chatId })

    // Step 4: Generate subtasks and execute via tools pipeline
    console.log('=== STEP 4: GENERATING SUBTASKS ===')
    console.log(`Generating subtasks for chatId: ${chatId}`)
    try {
      await this.generateSubtasksForTodos(chatId, ws)
    } catch (e) {
      console.error('Error generating subtasks:', e)
    }

    console.log('=== STEP 5: EXECUTING SUBTASKS PIPELINE ===')
    const pipeResult = await this.executeSubtasksPipeline(chatId, ws)

    // Step 6: Generate final summary message
    try {
      await this.generateAndSaveFinalSummary(chatId, userInput, ws)
    } catch (e) {
      console.error('Error generating final summary:', e)
    }

    return {
      complete: true,
      success: pipeResult.success,
      summary: pipeResult.summary,
      todoList: pipeResult.todos
    }
  }

  async analyzeProject(projectFiles, ws = null) {
    console.log('Starting project analysis...')
    
    const analysis = {
      projectType: 'unknown',
      framework: 'unknown',
      hasPackageJson: false,
      packageJson: null,
      keyFiles: [],
      structure: {
        hasAppDir: false,
        hasPagesDir: false,
        hasSrcDir: false,
        hasComponentsDir: false,
        hasPublicDir: false
      }
    }

    try {
      // Check for package.json
      const packageJsonFile = projectFiles.find(f => f.path === 'package.json')
      if (packageJsonFile) {
        console.log('Found package.json, reading it...')
        analysis.hasPackageJson = true
        
        try {
          const packageJsonContent = await this.tools.read_file('package.json')
          analysis.packageJson = JSON.parse(packageJsonContent)
          
          // Determine project type based on dependencies
          if (analysis.packageJson.dependencies) {
            if (analysis.packageJson.dependencies.next) {
              analysis.framework = 'nextjs'
              analysis.projectType = 'nextjs'
            } else if (analysis.packageJson.dependencies.react) {
              analysis.framework = 'react'
              analysis.projectType = 'react'
            } else if (analysis.packageJson.dependencies.vue) {
              analysis.framework = 'vue'
              analysis.projectType = 'vue'
            }
          }
          
          console.log('Project type detected:', analysis.projectType)
          console.log('Framework:', analysis.framework)
        } catch (error) {
          console.error('Error reading package.json:', error)
        }
      }

      // Analyze project structure
      const filePaths = projectFiles.map(f => f.path)
      
      analysis.structure.hasAppDir = filePaths.some(p => p.startsWith('app/'))
      analysis.structure.hasPagesDir = filePaths.some(p => p.startsWith('pages/'))
      analysis.structure.hasSrcDir = filePaths.some(p => p.startsWith('src/'))
      analysis.structure.hasComponentsDir = filePaths.some(p => p.includes('components/'))
      analysis.structure.hasPublicDir = filePaths.some(p => p.startsWith('public/'))

      // Identify key files
      analysis.keyFiles = projectFiles.filter(f => {
        const path = f.path.toLowerCase()
        return path.includes('layout') || 
               path.includes('page') || 
               path.includes('index') || 
               path.includes('app') ||
               path.includes('main') ||
               path.includes('config')
      }).map(f => f.path)

      console.log('Project structure analysis:', analysis.structure)
      console.log('Key files found:', analysis.keyFiles)

      this.maybeSend(ws, { type: 'agent_reasoning', thought: `Project analysis complete. Detected ${analysis.projectType} project with ${analysis.keyFiles.length} key files.` })

      return analysis

    } catch (error) {
      console.error('Error during project analysis:', error)
      return analysis
    }
  }

  async generateOrLoadProjectSummary(userInput, projectFiles, ws, projectName) {
    const fs = require('fs-extra')
    const path = require('path')
    try {
      const summaryPath = path.join(this.projectRoot, 'agent_summary.json')
      if (await fs.pathExists(summaryPath)) {
        const existing = await fs.readFile(summaryPath, 'utf-8')
        const parsed = JSON.parse(existing)
        this.maybeSend(ws, { type: 'agent_reasoning', thought: 'Loaded existing project summary from agent_summary.json' })
        return parsed
      }

      // Build lightweight structure overview
      const files = projectFiles
        .filter(f => !f.path.includes('node_modules/'))
        .map(f => f.path)

      const structure = {
        totalFiles: files.length,
        directories: Array.from(new Set(files.map(p => p.split('/')[0]))),
        hasAppDir: files.some(p => p.startsWith('app/')),
        hasComponentsDir: files.some(p => p.includes('/components/')),
        hasBackendDir: files.some(p => p.startsWith('backend/')),
        languages: Array.from(new Set(files.map(p => path.extname(p)).filter(Boolean)))
      }

      // Pick candidate key files
      const keyFiles = files.filter(p => /\b(app|components|backend)\b/.test(p) && /page|layout|index|server|route|api/i.test(p)).slice(0, 50)

      const sys = `You are a senior engineer. Given a list of file paths and a user request, infer the project type(s), primary framework(s), and which files are the likely main entry points to read on future runs. Respond as compact JSON with these keys: projectType (string), frameworks (string[]), primaryLanguages (string[]), mainAreas (string[]), keyFiles (string[]), notes (string). No prose.`

      const msg = [
        { role: 'system', content: sys },
        { role: 'user', content: `USER REQUEST:\n${userInput}` },
        { role: 'user', content: `STRUCTURE:
${JSON.stringify(structure)}` },
        { role: 'user', content: `FILES (truncated to ${keyFiles.length}):\n${keyFiles.join('\n')}` }
      ]

      const response = await this.openai.chat.completions.create({
        model: this.modelTodo,
        messages: msg,
        response_format: { type: 'json_object' },
        max_completion_tokens: 800
      })

      const content = (response.choices?.[0]?.message?.content || '').trim()
      let parsed
      try {
        parsed = JSON.parse(content)
      } catch (e) {
        parsed = {
          projectType: 'unknown',
          frameworks: [],
          primaryLanguages: structure.languages,
          mainAreas: structure.directories,
          keyFiles: keyFiles,
          notes: 'LLM summary parse failed; storing heuristic summary.'
        }
      }

      const summary = {
        meta: {
          generatedAt: new Date().toISOString(),
          projectName: projectName || null
        },
        requestSample: userInput.slice(0, 300),
        structure,
        llm: parsed
      }

      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf-8')
      this.maybeSend(ws, { type: 'agent_reasoning', thought: 'Generated project summary and saved to agent_summary.json' })
      return summary
    } catch (error) {
      console.error('generateOrLoadProjectSummary error:', error)
      return null
    }
  }

  async generateOverviewTodos(userInput, ws = null, chatId = null) {
    try {
      // Load project summary from agent_summary.json
      const fs = require('fs-extra')
      const path = require('path')
      const summaryPath = path.join(this.projectRoot, 'agent_summary.json')
      
      let projectSummary = {}
      if (await fs.pathExists(summaryPath)) {
        const summaryContent = await fs.readFile(summaryPath, 'utf-8')
        projectSummary = JSON.parse(summaryContent)
      }

      const systemPrompt = `You are an expert software developer and project manager. Your task is to create a concise, execution-ready todo list based on the user's request and project analysis.

Guidelines:
- Create 2-5 high-level tasks that directly address the user's request
- Each task should be actionable and specific
- Focus on the main deliverables, not testing or build processes
- Use clear, concise language
- Order tasks logically (dependencies first)
- Consider the existing project structure and technology stack

Project Summary:
${JSON.stringify(projectSummary, null, 2)}

User Request: "${userInput}"

Return ONLY a JSON array of task objects with this structure:
[
  {
    "id": 1,
    "text": "Task description",
    "status": "pending"
  }
]`

      const response = await this.openai.chat.completions.create({
        model: this.modelTodo,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })

      const content = response.choices[0].message.content.trim()
      console.log('LLM response for todo generation:', content)
      
      // Parse the JSON response
      let todoList
      try {
        // Remove markdown code blocks if present
        let cleanContent = content
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }
        
        todoList = JSON.parse(cleanContent)
      } catch (parseError) {
        console.error('Failed to parse todo list JSON:', parseError)
        console.error('Raw content:', content)
        // Fallback: create a simple todo list
        todoList = [
          { id: 1, text: "Analyze user requirements and project structure", status: "pending" },
          { id: 2, text: "Implement the requested functionality", status: "pending" },
          { id: 3, text: "Test and refine the implementation", status: "pending" }
        ]
      }

      // Save todos to database and create tasks mapping
      const tasksMap = new Map()
      if (chatId && todoList.length > 0) {
        console.log(`Saving ${todoList.length} todos for chatId: ${chatId}`)
        for (let i = 0; i < todoList.length; i++) {
          const todo = todoList[i]
          const taskName = todo.text || todo.taskName || todo.name || `Task ${i + 1}`
          const todoDoc = new Todo({
            chatId: chatId,
            taskName: taskName,
            order: i + 1,
            status: 'pending'
          })
          await todoDoc.save()
          console.log(`Saved todo ${i + 1}: ${taskName} with _id: ${todoDoc._id}`)
          todoList[i]._id = todoDoc._id
          // Map order to ObjectId for the message
          tasksMap.set((i + 1).toString(), todoDoc._id)
        }

        // Save message with type 'todo' and tasks mapping
        const message = new Message({
          chatId,
          content: `Generated ${todoList.length} tasks for: ${userInput}`,
          role: 'agent',
          messageType: 'todo',
          tasks: tasksMap,
          metadata: {
            timestamp: new Date(),
            projectContext: null,
            agentProcessing: false
          }
        })
        await message.save()

        // Send WebSocket message about todos being updated
        this.maybeSend(ws, { type: 'todos_updated', chatId })
      }

      return todoList
    } catch (error) {
      console.error('Error generating overview todos:', error)
      // Return a fallback todo list
      return [
        { id: 1, text: "Analyze user requirements", status: "pending" },
        { id: 2, text: "Implement requested functionality", status: "pending" },
        { id: 3, text: "Test and refine implementation", status: "pending" }
      ]
    }
  }

  async executeSubtasksPipeline(chatId, ws = null) {
    // Get todos for this chat that have subtasks
    const todos = await Todo.find({ 
      chatId, 
      subtask: { $exists: true, $ne: null } 
    }).sort({ order: 1 })
    const results = []
    let hasErrors = false

    for (const todo of todos) {
      // Mark todo as running
      await Todo.updateOne({ _id: todo._id }, { $set: { status: 'running' } })
      this.maybeSend(ws, { type: 'todo_status', todoId: todo._id, status: 'running' })
      const subDoc = await Subtask.findOne({ chatId, todoId: todo._id })
      if (!subDoc || !subDoc.tasksName) {
        console.log(`No subtasks found for todo ${todo._id}`)
        continue
      }
      
      // Handle both Map and Object formats
      let tasksMap
      if (subDoc.tasksName instanceof Map) {
        tasksMap = subDoc.tasksName
      } else {
        // Convert object to Map
        tasksMap = new Map(Object.entries(subDoc.tasksName))
      }
      
      const orderedEntries = Array.from(tasksMap.entries()).sort((a, b) => Number(a[0]) - Number(b[0]))

      let allDone = true
      for (const [order, task] of orderedEntries) {
        // Update status -> running
        task.status = 'running'
        await Subtask.updateOne({ _id: subDoc._id }, { $set: { [`tasksName.${order}.status`]: 'running' } })
        this.maybeSend(ws, { type: 'subtask_status', todoId: todo._id, order: Number(order), status: 'running' })

        // Try execution with one retry on failure
        const execOnce = async () => {
          try {
            const result = await this.executeToolWithRetry(task.tool, task.parameters || {}, ws, 1)
            return result.success
          } catch (e) {
            return false
          }
        }

        let ok = await execOnce()
        if (!ok) ok = await execOnce()

        if (ok) {
          task.status = 'done'
          await Subtask.updateOne({ _id: subDoc._id }, { $set: { [`tasksName.${order}.status`]: 'done' } })
          this.maybeSend(ws, { type: 'subtask_status', todoId: todo._id, order: Number(order), status: 'done' })
        } else {
          // Mark skipped after two failures
          task.status = 'skipped'
          await Subtask.updateOne({ _id: subDoc._id }, { $set: { [`tasksName.${order}.status`]: 'skipped' } })
          this.maybeSend(ws, { type: 'subtask_status', todoId: todo._id, order: Number(order), status: 'skipped' })
          allDone = false
          hasErrors = true
        }
      }

      // Update todo status based on subtasks outcome
      const finalStatus = allDone ? 'done' : 'failed'
      await Todo.updateOne({ _id: todo._id }, { $set: { status: finalStatus } })
      this.maybeSend(ws, { type: 'todo_status', todoId: todo._id, status: finalStatus })
      results.push({ id: todo._id, name: todo.taskName, status: finalStatus })
    }

    return {
      success: !hasErrors,
      summary: hasErrors ? 'Completed with some failures or skips' : 'All todos executed successfully',
      todos: results
    }
  }

  async generateAndSaveFinalSummary(chatId, userInput, ws = null) {
    const fs = require('fs-extra')
    const path = require('path')
    const summaryPath = path.join(this.projectRoot, 'agent_summary.json')
    let projectSummary = null
    if (await fs.pathExists(summaryPath)) {
      try { projectSummary = JSON.parse(await fs.readFile(summaryPath, 'utf-8')) } catch {}
    }

    // Get all todos for this chat
    const todos = await Todo.find({ 
      chatId
    }).sort({ order: 1 })
    const subtasks = await Subtask.find({ chatId })

    const sys = `You are a helpful assistant. Summarize succinctly what changes were made to the project in human language. 2-5 sentences max, no code fences, no bullets.`
    const messages = [
      { role: 'system', content: sys },
      { role: 'user', content: `USER REQUEST:\n${userInput}` },
      { role: 'user', content: `PROJECT SUMMARY:\n${projectSummary ? JSON.stringify(projectSummary.llm || projectSummary.structure) : 'N/A'}` },
      { role: 'user', content: `TODOS EXECUTED:\n${todos.map(t => `[#${t.order}] ${t.taskName} -> ${t.status}`).join('\n')}` },
      { role: 'user', content: `SUBTASKS SNAPSHOT:\n${subtasks.map(s => {
        const entries = Array.from(s.tasksName?.entries?.() || [])
        const short = entries.slice(0, 5).map(([k, v]) => `${k}: ${v.name} (${v.tool}) -> ${v.status}`).join('; ')
        return `${s.todoId}: ${short}${entries.length > 5 ? ' ...' : ''}`
      }).join('\n')}` }
    ]

    const resp = await this.openai.chat.completions.create({
      model: this.modelTodo,
      messages,
      max_completion_tokens: 300
    })

    const content = (resp.choices?.[0]?.message?.content || '').trim()
    if (chatId) {
      await this.saveMessage(chatId, content, 'agent', 'summary', null, { projectContext: null })
    }
    this.maybeSend(ws, { type: 'summary', content })
    return content
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
        case 'write_file':
          return await this.tools.write_file(parameters.path, parameters.content)
        case 'create_file':
          return await this.tools.create_file(parameters.path, parameters.content)
        case 'delete_file':
          return await this.tools.delete_file(parameters.path)
        case 'rename_file':
          return await this.tools.rename_file(parameters.oldPath, parameters.newPath)
        case 'copy_file':
          return await this.tools.copy_file(parameters.src, parameters.dest)
        // Search & Navigation
        case 'search_code':
          return await this.tools.search_code(parameters.query ?? parameters.pattern ?? '', parameters.options ?? {})
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
        case 'install_dependencies':
          return await this.tools.install_dependencies()
        case 'add_dependency':
          return await this.tools.add_dependency(parameters.pkg, parameters.version)
        case 'remove_dependency':
          return await this.tools.remove_dependency(parameters.pkg)
        // System Tools
        case 'run_command':
          return await this.tools.run_command(parameters.command, parameters.cwd)
        case 'run_tests':
          return await this.tools.run_tests(parameters.options)
        case 'run_linting':
          return await this.tools.run_linting(parameters.options)
        // AST Refactoring
        case 'parse_ast':
          return await this.tools.parse_ast(parameters.path)
        case 'ast_edit':
          return await this.tools.ast_edit(parameters.path, parameters.edits ?? parameters)
        case 'refactor_symbol':
          return await this.tools.refactor_symbol(parameters.oldName, parameters.newName, parameters.options || {})
        case 'extract_method':
          return await this.tools.extract_method(parameters.path, parameters.range, parameters.name, parameters.options || {})
        case 'inline_function':
          return await this.tools.inline_function(parameters.path, parameters.symbol)
        case 'change_function_signature':
          return await this.tools.change_function_signature(parameters.path, parameters.symbol, parameters.newSig || parameters.signature || {}, parameters.options || {})
        case 'apply_codemod':
          return await this.tools.apply_codemod(parameters.script, parameters.paths || [], parameters.options || {})
        case 'update_imports':
          return await this.tools.update_imports(parameters.path || null, parameters.options || {})
        case 'organize_imports':
          return await this.tools.organize_imports(parameters.options || {})
        case 'find_ts_references':
          return await this.tools.find_ts_references(parameters.path, parameters.position, parameters.options || {})
        case 'move_paths':
          return await this.tools.move_paths(parameters.moves || [], parameters.options || {})
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
