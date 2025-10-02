const { Tools } = require('./tools')
const OpenAI = require('openai')
const Message = require('./models/Message')
const Chat = require('./models/Chat')

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
    this.modelTodo = process.env.OPENAI_TODO_MODEL || 'gpt-4o-mini'
    this.modelExecute = process.env.OPENAI_EXECUTE_MODEL || 'gpt-5'
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

    // Step 1: Analyze project structure
    console.log('=== STEP 1: ANALYZING PROJECT STRUCTURE ===')
    if (ws) {
      ws.send(JSON.stringify({
        type: 'agent_reasoning',
        thought: 'Analyzing project structure and understanding the codebase...'
      }))
    }

    const projectAnalysis = await this.analyzeProject(projectFiles, ws)
    console.log('Project analysis:', projectAnalysis)

    // Step 2: Generate todo list based on user request and project analysis
    console.log('=== STEP 2: GENERATING TODO LIST ===')
    if (ws) {
      ws.send(JSON.stringify({
        type: 'agent_reasoning',
        thought: 'Creating a detailed plan based on your request and project structure...'
      }))
    }

    let todoList
    try {
      todoList = await this.generateTodoList(userInput, projectAnalysis, ws)
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
    if (ws) {
      ws.send(JSON.stringify({
        type: 'todo',
        tasks: todoList,
        currentThought: 'Task plan created successfully',
        progress: {
          completed: 0,
          total: todoList.length,
          percent: 0
        }
      }))
    }

    // Step 3: Execute each task in the todo list
    console.log('=== STEP 3: EXECUTING TASKS ===')
    const executionResult = await this.executeTodoList(todoList, projectFiles, ws, chatId, projectName)
    
    return {
      complete: true,
      success: executionResult.success,
      summary: executionResult.summary,
      todoList: executionResult.finalTodoList
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

      if (ws) {
        ws.send(JSON.stringify({
          type: 'agent_reasoning',
          thought: `Project analysis complete. Detected ${analysis.projectType} project with ${analysis.keyFiles.length} key files.`
        }))
      }

      return analysis

    } catch (error) {
      console.error('Error during project analysis:', error)
      return analysis
    }
  }

  async generateTodoList(userInput, projectAnalysis, ws = null) {
    console.log('Generating todo list based on user request and project analysis...')
    
    const systemPrompt = `You are an expert project manager and developer.

MUST: Return ONLY a valid JSON object with a top-level key "tasks" whose value is an array. No prose, no markdown fences, no comments. If you cannot comply, return {"tasks": []}.

Create a compact todo list based on the user's request and project analysis.

PROJECT ANALYSIS:
- Project Type: ${projectAnalysis.projectType}
- Framework: ${projectAnalysis.framework}
- Has Package.json: ${projectAnalysis.hasPackageJson}
- Key Files: ${projectAnalysis.keyFiles.join(', ')}
- Structure: ${JSON.stringify(projectAnalysis.structure)}

USER REQUEST: ${userInput}

CRITICAL RULES:
1. Output ONLY: {"tasks": [...]} ; no extra text
2. Create 3-4 actionable tasks ordered logically
3. Each task MUST be: { "id": number, "text": string (<= 90 chars), "status": "pending", "subtasks": [] }
4. Consider the project/framework and exact user request
5. Use Next.js App Router conventions when applicable
6. Keep output under 600 characters total

RESPONSE FORMAT: Return ONLY a valid JSON array with this structure:
[
  {
    "id": 1,
    "text": "Task description",
    "status": "pending",
    "subtasks": []
  }
]

EXAMPLE for creating a new page in Next.js:
[
  {
    "id": 1,
    "text": "Create newProperties directory structure",
    "status": "pending",
    "subtasks": []
  },
  {
    "id": 2,
    "text": "Create page.tsx with proper Next.js App Router structure",
    "status": "pending",
    "subtasks": []
  },
  {
    "id": 3,
    "text": "Add beautiful UI components with Tailwind CSS",
    "status": "pending",
    "subtasks": []
  }
]`

    try {
      const response = await this.openai.chat.completions.create({
        model: this.modelTodo,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create a todo list for: ${userInput}` }
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 800
      })

      const choice = response.choices?.[0]
      const content = (choice?.message?.content || '').trim()
      console.log('Todo list LLM choice:', JSON.stringify({
        id: response.id,
        model: response.model,
        created: response.created,
        finish_reason: choice?.finish_reason,
        usage: response.usage,
        has_tool_calls: !!choice?.message?.tool_calls,
        num_tool_calls: choice?.message?.tool_calls?.length || 0
      }, null, 2))
      console.log('Todo list LLM message object:', JSON.stringify(choice?.message, null, 2))
      console.log('Todo list LLM response content length:', content.length)
      console.log('Todo list LLM response (trimmed):', content)
      
      // Must be a JSON object with tasks array
      const cleanedContent = content
      console.log('Todo list content (pre-parse):', cleanedContent)
      if (!cleanedContent) {
        throw new Error('Empty content from model')
      }
      
      let todoList
      try {
        const parsed = JSON.parse(cleanedContent)
        if (Array.isArray(parsed)) {
          // Accept legacy array format
          todoList = parsed
        } else if (parsed && Array.isArray(parsed.tasks)) {
          todoList = parsed.tasks
        } else {
          throw new Error('JSON must be an array or an object with tasks[]')
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.error('Content that failed to parse:', cleanedContent)
        throw new Error('Failed to parse todo list JSON')
      }
      
      // Validate the structure
      if (!Array.isArray(todoList)) {
        throw new Error('Response is not an array')
      }
      
      // Ensure each task has the required fields
      const validatedTodoList = todoList.map((task, index) => ({
        id: task.id || index + 1,
        text: task.text || `Task ${index + 1}`,
        status: 'pending',
        subtasks: task.subtasks || []
      }))
      
      console.log('Generated and validated todo list:', validatedTodoList)
      return validatedTodoList

    } catch (error) {
      console.error('Error generating todo list:', error)
      throw error
    }
  }

  async executeTodoList(todoList, projectFiles, ws, chatId, projectName) {
    console.log('Starting todo list execution...')
    let currentTodoList = [...todoList]
    let completedTasks = 0
    let hasErrors = false

    for (let i = 0; i < currentTodoList.length; i++) {
      const task = currentTodoList[i]
      console.log(`=== EXECUTING TASK ${i + 1}/${currentTodoList.length}: ${task.text} ===`)
      
      // Update task status to active
      currentTodoList[i].status = 'active'
      await this.updateTodoProgress(currentTodoList, completedTasks, ws, chatId, `Working on: ${task.text}`)

      try {
        // Generate subtasks for this main task
        const subtasks = await this.generateSubtasks(task, projectFiles, ws)
        console.log(`Generated ${subtasks.length} subtasks for: ${task.text}`)
        
        // Update task with subtasks
        currentTodoList[i].subtasks = subtasks
        await this.updateTodoProgress(currentTodoList, completedTasks, ws, chatId, `Generated ${subtasks.length} subtasks for: ${task.text}`)

        // Execute each subtask
        let allSubtasksCompleted = true
        for (let j = 0; j < subtasks.length; j++) {
          const subtask = subtasks[j]
          console.log(`  Executing subtask ${j + 1}/${subtasks.length}: ${subtask.text}`)
          
          // Update subtask status to active
          currentTodoList[i].subtasks[j].status = 'active'
          await this.updateTodoProgress(currentTodoList, completedTasks, ws, chatId, `Executing: ${subtask.text}`)

          try {
            // Execute the subtask using the specified tool
            const result = await this.executeSubtask(subtask, ws)
            console.log(`  Subtask result:`, result)
            
            // Update subtask status based on result
            if (result.success) {
              currentTodoList[i].subtasks[j].status = 'completed'
              console.log(`  ✅ Subtask completed: ${subtask.text}`)
            } else {
              currentTodoList[i].subtasks[j].status = 'error'
              allSubtasksCompleted = false
              hasErrors = true
              console.log(`  ❌ Subtask failed: ${subtask.text} - ${result.error}`)
            }
          } catch (error) {
            console.error(`  ❌ Subtask execution error:`, error)
            currentTodoList[i].subtasks[j].status = 'error'
            allSubtasksCompleted = false
            hasErrors = true
          }

          await this.updateTodoProgress(currentTodoList, completedTasks, ws, chatId, `Completed subtask: ${subtask.text}`)
          
          // Small delay between subtasks
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        // Mark main task as done if all subtasks completed
        if (allSubtasksCompleted) {
          currentTodoList[i].status = 'completed'
          completedTasks++
          console.log(`✅ Main task completed: ${task.text}`)
        } else {
          currentTodoList[i].status = 'error'
          hasErrors = true
          console.log(`❌ Main task failed: ${task.text}`)
        }

        await this.updateTodoProgress(currentTodoList, completedTasks, ws, chatId, `Completed task: ${task.text}`)

      } catch (error) {
        console.error(`❌ Task execution error:`, error)
        currentTodoList[i].status = 'error'
        hasErrors = true
        await this.updateTodoProgress(currentTodoList, completedTasks, ws, chatId, `Error in task: ${task.text}`)
      }

      // Small delay between main tasks
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const summary = hasErrors 
      ? `Completed ${completedTasks}/${currentTodoList.length} tasks with some errors`
      : `Successfully completed all ${currentTodoList.length} tasks`

    console.log('=== TODO LIST EXECUTION COMPLETE ===')
    console.log('Summary:', summary)
    console.log('Final todo list:', currentTodoList)

    return {
      success: !hasErrors,
      summary: summary,
      finalTodoList: currentTodoList
    }
  }

  async generateSubtasks(mainTask, projectFiles, ws) {
    console.log(`Generating subtasks for: ${mainTask.text}`)
    
    const systemPrompt = `You are an expert developer.

MUST: Return ONLY a valid JSON object with a top-level key "subtasks" whose value is an array. No prose, no markdown fences, no comments. If you cannot comply, return {"subtasks": []}.

Break down the main task into specific, actionable subtasks that use available tools.

MAIN TASK: ${mainTask.text}

AVAILABLE TOOLS:
- list_files: List files in a directory
- read_file: Read content of a file
- write_file: Write content to an existing file
- create_file: Create a new file with content
- search_code: Search for code patterns in files
- run_command: Execute shell commands
- install_dependencies: Install npm packages
- ast_edit: Edit code using AST (for refactoring)

PROJECT FILES: ${projectFiles.map(f => f.path).join(', ')}

CRITICAL RULES:
1. Output ONLY: {"subtasks": [...]} ; no extra text
2. Create 2-4 specific subtasks
3. Each subtask MUST be: { "id": number, "text": string (<= 100 chars), "tool": string, "parameters": object, "status": "pending" }
4. For UI work on the home page, prefer a single write_file that writes COMPLETE content to app/page.tsx. Include the full file content in parameters.content.
5. Avoid tests, dependency installs, or unrelated commands. Do not modify tailwind.config.js unless absolutely required by the task.
6. Order subtasks logically (dependencies first). Use actual file paths from the project.
7. Keep output under 800 characters total

RESPONSE FORMAT: Return ONLY a valid JSON array:
[
  {
    "id": 1,
    "text": "Specific subtask description",
    "tool": "tool_name",
    "parameters": {
      "param1": "value1",
      "param2": "value2"
    },
    "status": "pending"
  }
]

EXAMPLE for creating a new page:
[
  {
    "id": 1,
    "text": "Create newProperties directory",
    "tool": "run_command",
    "parameters": {
      "command": "mkdir -p app/newProperties"
    },
    "status": "pending"
  },
  {
    "id": 2,
    "text": "Create page.tsx file with Next.js structure",
    "tool": "create_file",
    "parameters": {
      "path": "app/newProperties/page.tsx",
      "content": "import { Metadata } from 'next'\\n\\nexport const metadata: Metadata = {\\n  title: 'New Properties'\\n}\\n\\nexport default function NewPropertiesPage() {\\n  return (\\n    <div>\\n      <h1>New Properties</h1>\\n    </div>\\n  )\\n}"
    },
    "status": "pending"
  }
]`

    try {
      const response = await this.openai.chat.completions.create({
        model: this.modelTodo,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate subtasks for: ${mainTask.text}` }
        ],
        response_format: { type: 'json_object' },
        max_completion_tokens: 1000
      })

      const choice = response.choices?.[0]
      const content = (choice?.message?.content || '').trim()
      console.log('Subtasks LLM choice:', JSON.stringify({
        id: response.id,
        model: response.model,
        created: response.created,
        finish_reason: choice?.finish_reason,
        usage: response.usage,
        has_tool_calls: !!choice?.message?.tool_calls,
        num_tool_calls: choice?.message?.tool_calls?.length || 0
      }, null, 2))
      console.log('Subtasks LLM message object:', JSON.stringify(choice?.message, null, 2))
      console.log('Subtasks LLM response content length:', content.length)
      console.log('Subtasks LLM response (trimmed):', content)
      
      // Must be a JSON object with subtasks array (also accept bare array for resilience)
      const cleanedContent = content
      if (!cleanedContent) {
        throw new Error('Empty content from model')
      }
      
      let subtasks
      try {
        const parsed = JSON.parse(cleanedContent)
        if (Array.isArray(parsed)) {
          subtasks = parsed
        } else if (parsed && Array.isArray(parsed.subtasks)) {
          subtasks = parsed.subtasks
        } else {
          throw new Error('JSON must be an array or an object with subtasks[]')
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.error('Content that failed to parse:', cleanedContent)
        throw new Error('Failed to parse subtasks JSON')
      }
      
      // Validate the structure
      if (!Array.isArray(subtasks)) {
        throw new Error('Response is not an array')
      }
      
      // Ensure each subtask has the required fields
      const validatedSubtasks = subtasks.map((subtask, index) => ({
        id: subtask.id || index + 1,
        text: subtask.text || `Subtask ${index + 1}`,
        tool: subtask.tool || 'run_command',
        parameters: subtask.parameters || {},
        status: 'pending'
      }))
      
      console.log('Generated and validated subtasks:', validatedSubtasks)
      return validatedSubtasks

    } catch (error) {
      console.error('Error generating subtasks:', error)
      throw error
    }
  }

  async executeSubtask(subtask, ws) {
    console.log(`Executing subtask: ${subtask.text}`)
    console.log(`Tool: ${subtask.tool}`)
    console.log(`Parameters:`, subtask.parameters)
    
    try {
      // Send tool execution start
      if (ws) {
        ws.send(JSON.stringify({
          type: 'tool_code',
          tool: subtask.tool,
          parameters: subtask.parameters,
          explanation: subtask.text
        }))
      }

      // Execute the tool
      const result = await this.executeToolWithRetry(subtask.tool, subtask.parameters, ws)
      
      // Send tool execution result
      if (ws) {
        ws.send(JSON.stringify({
          type: 'tool_result',
          tool: subtask.tool,
          result: result
        }))
      }

      return result

    } catch (error) {
      console.error('Error executing subtask:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  async updateTodoProgress(todoList, completedTasks, ws, chatId, currentThought) {
    const progress = {
      completed: completedTasks,
      total: todoList.length,
      percent: Math.round((completedTasks / todoList.length) * 100)
    }

    // Send to frontend
    if (ws) {
      ws.send(JSON.stringify({
        type: 'updateTodo',
        tasks: todoList,
        currentThought: currentThought,
        progress: progress
      }))
    }

    // Update existing todo message in database instead of creating new ones
    if (chatId) {
      try {
        // Find the most recent todo message for this chat
        const Message = require('./models/Message')
        const existingTodoMessage = await Message.findOne({
          chatId: chatId,
          messageType: 'todo'
        }).sort({ createdAt: -1 })

        if (existingTodoMessage) {
          // Update the existing message
          existingTodoMessage.content = currentThought
          existingTodoMessage.stepData = {
            tasks: todoList,
            currentThought: currentThought,
            progress: progress
          }
          existingTodoMessage.metadata.timestamp = new Date()
          console.log('Updating todo message with stepData:', existingTodoMessage.stepData)
          await existingTodoMessage.save()
        } else {
          // Create new message if none exists
          await this.saveMessage(chatId, currentThought, 'agent', 'todo', {
            tasks: todoList,
            currentThought: currentThought,
            progress: progress
          }, {
            agentProcessing: true
          });
        }
      } catch (error) {
        console.error('Error updating todo message:', error)
        // Fallback to creating new message
        await this.saveMessage(chatId, currentThought, 'agent', 'todo', {
          tasks: todoList,
          currentThought: currentThought,
          progress: progress
        }, {
          agentProcessing: true
        });
      }
    }
  }

  async executeTask(taskDescription, projectFiles = [], ws = null, chatId = null, projectName = null) {
    const systemPrompt = `You are an expert Next.js developer creating beautiful, modern web applications.

CRITICAL: Respond with ONLY valid JSON. No explanations.

AVAILABLE TOOLS: list_files, read_file, write_file, create_file, search_code, run_command, install_dependencies, ast_edit

PROJECT: ${this.projectRoot}
FILES: ${projectFiles.filter(f => !f.path.includes('node_modules')).map(f => f.path).join(', ')}

TECH STACK: Next.js 14+ App Router + TypeScript + Tailwind CSS

CONSTRAINTS:
1) DO NOT run tests, install dependencies, or modify tailwind.config.js unless explicitly required.
2) Focus on writing high-quality UI code directly to app/page.tsx using write_file.

CRITICAL CODE QUALITY STANDARDS:
1. NEXT.JS STRUCTURE: Always create app/pageName/page.tsx for new pages
2. IMPORTS: Use proper Next.js imports: import { Metadata } from 'next'
3. TYPESCRIPT: Export default function with proper types
4. UI/UX EXCELLENCE: Create stunning, modern interfaces with:
   - Beautiful gradients: bg-gradient-to-br from-slate-50 to-slate-100
   - Modern shadows: shadow-xl, shadow-2xl
   - Perfect spacing: p-8, py-12, mb-8, gap-8
   - Typography: text-4xl font-bold, text-xl text-slate-600
   - Responsive design: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
   - Modern colors: slate-800, slate-600, blue-600, emerald-500
   - Hover effects: hover:shadow-lg, hover:scale-105
   - Smooth transitions: transition-all duration-300
5. ACCESSIBILITY: Use semantic HTML and proper ARIA labels
6. COMPONENT NAMING: Use PageNamePage for page components

FORMAT: {"tool": "tool_name", "explanation": "brief", "parameters": {...}}
COMPLETE: {"complete": true, "summary": "done"}`

    console.log('=== TASK EXECUTION START ===')
    console.log('Task description:', taskDescription)
    console.log('Project root:', this.projectRoot)
    console.log('Project files count:', projectFiles.length)
    console.log('Chat ID:', chatId)
    console.log('============================')

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: taskDescription }
    ]

    let iteration = 0
    let toolsUsed = 0
    const toolResults = []

    while (iteration < this.maxIterations) {
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
          max_completion_tokens: 2000
        })

        const content = response.choices[0].message.content
        console.log('=== AI RESPONSE ===')
        console.log('Raw content:', content)
        console.log('Content length:', content.length)
        console.log('==================')
        
        // Add AI response to messages
        messages.push({ role: 'assistant', content: content })
        
        // Parse the JSON response
        let parsedResponse
        try {
          parsedResponse = JSON.parse(content)
          console.log('=== PARSED RESPONSE ===')
          console.log('Successfully parsed JSON:', JSON.stringify(parsedResponse, null, 2))
          console.log('Has tool field:', !!parsedResponse.tool)
          console.log('Has tools field:', !!parsedResponse.tools)
          console.log('Has complete field:', !!parsedResponse.complete)
          console.log('========================')
        } catch (error) {
          console.log('=== JSON PARSING FAILED ===')
          console.log('Error:', error.message)
          console.log('Content that failed to parse:', content)
          console.log('============================')
          messages.push({ 
            role: 'user', 
            content: 'ERROR: Your response was not valid JSON. You MUST respond with ONLY valid JSON using the tool format. When creating files, provide COMPLETE, HIGH-QUALITY code with beautiful UI/UX. Example: {"tool": "create_file", "explanation": "Create beautiful page", "parameters": {"path": "app/page/page.tsx", "content": "import { Metadata } from \'next\'\\n\\nexport const metadata: Metadata = {\\n  title: \'Page Title\'\\n}\\n\\nexport default function Page() {\\n  return (\\n    <div className=\\"min-h-screen bg-gradient-to-br from-slate-50 to-slate-100\\">\\n      <div className=\\"container mx-auto px-4 py-12\\">\\n        <h1 className=\\"text-4xl font-bold text-slate-800\\">Page Title</h1>\\n      </div>\\n    </div>\\n  )\\n}"}}' 
          })
          continue
        }

        // Check if task is complete
        if (parsedResponse.complete) {
          console.log('=== TASK COMPLETED ===')
          console.log('Summary:', parsedResponse.summary)
          console.log('======================')
          
          if (ws) {
            ws.send(JSON.stringify({
              type: 'complete',
              summary: parsedResponse.summary
            }))
          }
          
          return {
            complete: true,
            success: true,
            summary: parsedResponse.summary,
            iterations: iteration
          }
        }

        // Handle single tool execution
        if (parsedResponse.tool) {
          const { tool, explanation, parameters } = parsedResponse
          
          // Guard: reject disallowed tools for UI generation
          const disallowed = ['run_tests', 'install_dependencies']
          if (disallowed.includes(tool)) {
            messages.push({ role: 'user', content: 'ERROR: Disallowed tool for this task. Use write_file to update app/page.tsx with complete UI code.' })
            continue
          }

          console.log(`=== EXECUTING TOOL: ${tool} ===`)
          console.log('Explanation:', explanation)
          console.log('Parameters:', JSON.stringify(parameters, null, 2))
          
          if (ws) {
            ws.send(JSON.stringify({
              type: 'tool_execution',
              tool,
              explanation,
              parameters
            }))
          }

          // Execute the tool
          const result = await this.executeToolWithRetry(tool, parameters, ws)
          toolResults.push({ tool, result })
          toolsUsed++

          // Add a small delay to make processing visible
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Send tool result
          if (ws) {
            console.log(`=== COMPLETED TOOL: ${tool} ===`)
            console.log('Result success:', result.success)
            console.log('Sending tool_result message to frontend')
            ws.send(JSON.stringify({
              type: 'tool_result',
              tool,
              result
            }))
          }

          // Add tool result to messages for next iteration
          const toolResultMessage = `Tool: ${tool}
Parameters: ${JSON.stringify(parameters, null, 2)}
Result: ${JSON.stringify(result, null, 2)}`

          messages.push({ role: 'user', content: toolResultMessage })
        }

        // Handle multiple tools execution
        if (parsedResponse.tools && Array.isArray(parsedResponse.tools)) {
          console.log(`=== MULTI-TOOL EXECUTION ===`)
          console.log('Number of tools to execute:', parsedResponse.tools.length)
          console.log('Tools:', parsedResponse.tools.map(t => t.tool))
          console.log('============================')

          for (const toolCall of parsedResponse.tools) {
            const { tool, explanation, parameters } = toolCall
            
            console.log(`=== STARTING TOOL: ${tool} ===`)
            console.log('Explanation:', explanation)
            console.log('Parameters:', JSON.stringify(parameters, null, 2))
            console.log('Sending tool_execution message to frontend')
            
            if (ws) {
              ws.send(JSON.stringify({
                type: 'tool_execution',
                tool,
                explanation,
                parameters
              }))
            }

            // Execute the tool with retry logic
            let result = await this.executeToolWithRetry(tool, parameters, ws)
            toolResults.push({ tool, result })
            toolsUsed++

            // Add a small delay to make processing visible
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Send tool result
            if (ws) {
              console.log(`=== COMPLETED TOOL: ${tool} ===`)
              console.log('Result success:', result.success)
              console.log('Sending tool_result message to frontend')
              ws.send(JSON.stringify({
                type: 'tool_result',
                tool,
                result
              }))
            }
          }

          // Add all tool results to messages for next iteration
          const toolResultsMessage = `Tool Results:
${toolResults.map(tr => `Tool: ${tr.tool}
Result: ${JSON.stringify(tr.result, null, 2)}`).join('\n\n')}`

          messages.push({ role: 'user', content: toolResultsMessage })
        }

      } catch (error) {
        console.error('Error in iteration:', error)
        messages.push({ 
          role: 'user', 
          content: `Error occurred: ${error.message}. Please continue with the task.` 
        })
      }
    }

    return {
      complete: true,
      success: false,
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
        
        if (ws) {
          ws.send(JSON.stringify({
            type: 'tool_retry',
            tool,
            attempt,
            maxRetries,
            error: error.message
          }))
        }
        
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

  // Extracts the first complete top-level JSON array from text. Returns the array substring or null.
  _extractFirstJsonArray(text) {
    if (!text) return null
    const start = text.indexOf('[')
    if (start === -1) return null
    let depth = 0
    let inString = false
    let stringChar = null
    let escaped = false
    for (let i = start; i < text.length; i++) {
      const ch = text[i]
      if (inString) {
        if (escaped) {
          escaped = false
        } else if (ch === '\\') {
          escaped = true
        } else if (ch === stringChar) {
          inString = false
          stringChar = null
        }
        continue
      }

      if (ch === '"' || ch === '\'') {
        inString = true
        stringChar = ch
        continue
      }

      if (ch === '[') depth++
      if (ch === ']') {
        depth--
        if (depth === 0) {
          return text.slice(start, i + 1)
        }
      }
    }
    return null
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
        case 'ast_edit':
          return await this.tools.ast_edit(parameters.path, parameters.edits ?? parameters)
        case 'refactor_symbol':
          return await this.tools.refactor_symbol(parameters.oldName, parameters.newName)
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
