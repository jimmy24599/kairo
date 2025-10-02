// Load environment variables
require('dotenv').config()

// Debug environment variables
console.log('Environment check:')
console.log('OPENROUTER_API_KEY exists:', !!process.env.OPENROUTER_API_KEY)
console.log('OPENROUTER_API_KEY length:', process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.length : 0)
console.log('OPENROUTER_BASE_URL:', process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1')
console.log('PROJECT_ROOT:', process.env.PROJECT_ROOT)
console.log('Current working directory:', process.cwd())
console.log('MONGODB_URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/Kairo')

const express = require('express')
const cors = require('cors')
const WebSocket = require('ws')
const http = require('http')
const path = require('path')
const fs = require('fs-extra')

// Import database connection
const connectDB = require('./config/database')

// Helper function to get all project files recursively
async function getAllProjectFiles(projectRoot) {
  const files = []
  
  async function scanDirectory(dirPath, relativePath = '') {
    try {
      const items = await fs.readdir(dirPath)
      
      for (const item of items) {
        // Skip node_modules and other common directories
        if (item === 'node_modules' || item === '.git' || item === '.next' || item === 'dist' || item === 'build') {
          continue
        }
        
        const fullPath = path.join(dirPath, item)
        const itemRelativePath = path.join(relativePath, item)
        const stats = await fs.stat(fullPath)
        
        if (stats.isDirectory()) {
          await scanDirectory(fullPath, itemRelativePath)
        } else {
          files.push({
            name: item,
            path: itemRelativePath,
            type: 'file',
            size: stats.size,
            modified: stats.mtime,
            extension: path.extname(item)
          })
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error.message)
    }
  }
  
  await scanDirectory(projectRoot)
  return files
}

// Import routes
const chatRoutes = require('./routes/chats')
const messageRoutes = require('./routes/messages')
const todoRoutes = require('./routes/todos')
const subtaskRoutes = require('./routes/subtasks')

// Import our AI agent
const NewAIAgent = require('./agent_new')

const app = express()
const server = http.createServer(app)

// Middleware
app.use(cors())
app.use(express.json())

// WebSocket server
const wss = new WebSocket.Server({ server })

// Store active connections
const connections = new Map()

// Store active agent instances for stopping
const activeAgents = new Map()

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const connectionId = Date.now().toString()
  connections.set(connectionId, ws)
  
  console.log(`New WebSocket connection: ${connectionId}`)
  
  ws.on('message', async (message) => {
    try {
      console.log('📨 Received WebSocket message:', message.toString())
      const data = JSON.parse(message)
      console.log('📨 Parsed WebSocket data:', data)
      await handleWebSocketMessage(connectionId, data)
    } catch (error) {
      console.error('WebSocket message error:', error)
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }))
    }
  })
  
  ws.on('close', () => {
    console.log(`WebSocket connection closed: ${connectionId}`)
    connections.delete(connectionId)
  })
})

// Handle WebSocket messages
async function handleWebSocketMessage(connectionId, data) {
  const ws = connections.get(connectionId)
  if (!ws) return
  
  try {
    switch (data.action) {
      case 'process_request':
        await handleProcessRequest(ws, data)
        break
      case 'get_projects':
        await handleGetProjects(ws)
        break
      case 'get_project_files':
        await handleGetProjectFiles(ws, data)
        break
      case 'get_file_content':
        await handleGetFileContent(ws, data)
        break
      case 'save_file':
        await handleSaveFile(ws, data)
        break
      case 'stop_agent':
        await handleStopAgent(ws, data)
        break
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown action: ${data.action}`
        }))
    }
  } catch (error) {
    console.error('Error handling WebSocket message:', error)
    ws.send(JSON.stringify({
      type: 'error',
      message: error.message
    }))
  }
}

// Handle process request
async function handleProcessRequest(ws, data) {
  console.log('🔍 handleProcessRequest called with data:', data)
  const { userInput, projectName, chatId } = data
  
  if (!userInput) {
    console.log('❌ No user input provided')
    ws.send(JSON.stringify({
      type: 'error',
      message: 'No user input provided'
    }))
    return
  }
  
  try {
    // Send start message
    ws.send(JSON.stringify({
      type: 'start',
      message: 'Starting agent process...'
    }))
    
    // Initialize agent with project context
    const projectRoot = projectName 
      ? path.join(process.env.PROJECT_ROOT || process.cwd(), 'AI-Projects', projectName)
      : process.env.PROJECT_ROOT || process.cwd()
    
    const agent = new NewAIAgent(projectRoot, ws)
    
    // Store agent instance for potential stopping
    const connectionId = Array.from(connections.entries()).find(([id, connection]) => connection === ws)?.[0]
    if (connectionId) {
      activeAgents.set(connectionId, agent)
    }
    
    // Get project files for context (recursively)
    const projectFiles = await getAllProjectFiles(projectRoot)
    
    // Process the request with iterative loop and real-time updates
    console.log('Processing request:', userInput)
    console.log('Project root:', projectRoot)
    console.log('Project files:', projectFiles.length)
    const result = await agent.processRequest(userInput, chatId)
    console.log('Agent result:', result)
    
    // Send final result if not already sent
    if (!result.complete) {
      ws.send(JSON.stringify({
        type: 'result',
        message: result.success ? 'Request completed successfully' : 'Request failed',
        result: result
      }))
    }
    
    // Send complete message
    ws.send(JSON.stringify({
      type: 'complete',
      summary: result.summary || 'Task completed successfully'
    }))
    
    // Remove agent from active agents
    if (connectionId) {
      activeAgents.delete(connectionId)
    }
    
  } catch (error) {
    console.error('Process request error:', error)
    ws.send(JSON.stringify({
      type: 'error',
      message: `Error processing request: ${error.message}`
    }))
    
    // Remove agent from active agents on error
    const connectionId = Array.from(connections.entries()).find(([id, connection]) => connection === ws)?.[0]
    if (connectionId) {
      activeAgents.delete(connectionId)
    }
  }
}

// Handle stop agent
async function handleStopAgent(ws, data) {
  console.log('🛑 handleStopAgent called')
  
  try {
    // Find the connection ID for this WebSocket
    const connectionId = Array.from(connections.entries()).find(([id, connection]) => connection === ws)?.[0]
    
    if (connectionId && activeAgents.has(connectionId)) {
      const agent = activeAgents.get(connectionId)
      
      // Stop the agent if it has a stop method
      if (agent && typeof agent.stop === 'function') {
        await agent.stop()
      }
      
      // Remove from active agents
      activeAgents.delete(connectionId)
      
      // Send stop confirmation
      ws.send(JSON.stringify({
        type: 'stopped',
        message: 'Agent stopped successfully'
      }))
      
      console.log('🛑 Agent stopped for connection:', connectionId)
    } else {
      // No active agent found
      ws.send(JSON.stringify({
        type: 'error',
        message: 'No active agent to stop'
      }))
    }
  } catch (error) {
    console.error('Stop agent error:', error)
    ws.send(JSON.stringify({
      type: 'error',
      message: `Error stopping agent: ${error.message}`
    }))
  }
}

// Handle get projects
async function handleGetProjects(ws) {
  try {
    const projectsDir = path.join(process.env.PROJECT_ROOT || process.cwd(), 'AI-Projects')
    console.log('📁 Backend: Looking for projects in:', projectsDir)
    
    const projects = await fs.readdir(projectsDir)
    console.log('📁 Backend: Found items in AI-Projects:', projects)
    
    const projectList = projects.filter(item => {
      const itemPath = path.join(projectsDir, item)
      const isDir = fs.statSync(itemPath).isDirectory()
      console.log(`📁 Backend: ${item} is directory: ${isDir}`)
      return isDir
    })
    
    console.log('📁 Backend: Filtered project list:', projectList)
    
    ws.send(JSON.stringify({
      type: 'projects',
      projects: projectList
    }))
  } catch (error) {
    console.error('📁 Backend: Error getting projects:', error)
    ws.send(JSON.stringify({
      type: 'error',
      message: `Error getting projects: ${error.message}`
    }))
  }
}

// Handle get project files
async function handleGetProjectFiles(ws, data) {
  try {
    const { projectName } = data
    const projectPath = path.join(process.env.PROJECT_ROOT || process.cwd(), 'AI-Projects', projectName)
    
    const files = await getProjectFiles(projectPath)
    
    ws.send(JSON.stringify({
      type: 'project_files',
      files: files
    }))
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'error',
      message: `Error getting project files: ${error.message}`
    }))
  }
}

// Handle get file content
async function handleGetFileContent(ws, data) {
  try {
    const { projectName, filePath } = data
    const fullPath = path.join(process.env.PROJECT_ROOT || process.cwd(), 'AI-Projects', projectName, filePath)
    
    const content = await fs.readFile(fullPath, 'utf-8')
    
    ws.send(JSON.stringify({
      type: 'file_content',
      content: content,
      filePath: filePath
    }))
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'error',
      message: `Error reading file: ${error.message}`
    }))
  }
}

// Handle save file
async function handleSaveFile(ws, data) {
  try {
    const { projectName, filePath, content } = data
    const fullPath = path.join(process.env.PROJECT_ROOT || process.cwd(), 'AI-Projects', projectName, filePath)
    
    await fs.ensureDir(path.dirname(fullPath))
    await fs.writeFile(fullPath, content, 'utf-8')
    
    ws.send(JSON.stringify({
      type: 'file_saved',
      message: 'File saved successfully',
      filePath: filePath
    }))
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'error',
      message: `Error saving file: ${error.message}`
    }))
  }
}

// Helper function to get project files recursively
async function getProjectFiles(dir, basePath = '') {
  const files = []
  const items = await fs.readdir(dir)
  
  for (const item of items) {
    const itemPath = path.join(dir, item)
    const relativePath = path.join(basePath, item)
    const stat = await fs.stat(itemPath)
    
    if (stat.isDirectory()) {
      // Skip certain directories
      if (['.git', '.next', 'node_modules', 'dist', 'build'].includes(item)) {
        continue
      }
      
      const children = await getProjectFiles(itemPath, relativePath)
      files.push({
        name: item,
        type: 'directory',
        path: relativePath,
        children: children
      })
    } else {
      files.push({
        name: item,
        type: 'file',
        path: relativePath
      })
    }
  }
  
  return files
}

// REST API endpoints for non-WebSocket operations
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Agent Backend is running' })
})

// Chat and Message routes
app.use('/api/chats', chatRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/todos', todoRoutes)
app.use('/api/subtasks', subtaskRoutes)

// Connect to MongoDB
connectDB()

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`AI Agent Backend running on port ${PORT}`)
  console.log(`WebSocket server ready for connections`)
})