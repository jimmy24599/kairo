const { Task } = require('./types')
const { FileSystemManager } = require('./fileSystem')
const { TaskExecutor } = require('./taskExecutor')
const { AIService } = require('./aiService')

class TaskManager {
  constructor(context, fileSystem, executor) {
    this.tasks = []
    this.context = context
    this.fileSystem = fileSystem
    this.executor = executor
    this.aiService = new AIService(context)
  }

  async parseUserInput(userInput) {
    try {
      // First, try to understand if this is a modification request
      const modificationKeywords = ['add', 'modify', 'change', 'update', 'edit', 'fix', 'improve']
      const isModification = modificationKeywords.some(keyword => 
        userInput.toLowerCase().includes(keyword)
      )

      if (isModification) {
        // For modification requests, analyze existing files first
        return await this.parseModificationRequest(userInput)
      } else {
        // For general requests, use AI service to parse
        return await this.aiService.parseUserRequest(userInput)
      }
    } catch (error) {
      console.error('Error parsing user input:', error)
      // Fallback to simple task creation
      return [new Task({
        type: 'modify',
        description: `Process user request: ${userInput}`,
        priority: 'high',
        filePath: 'app/page.tsx',
        content: ''
      })]
    }
  }

  async parseModificationRequest(userInput) {
    try {
      // Analyze the request to identify target files
      const targetFiles = await this.identifyTargetFiles(userInput)
      
      if (targetFiles.length === 0) {
        // No specific files identified, use general parsing
        return await this.aiService.parseUserRequest(userInput)
      }

      const tasks = []
      
      for (const filePath of targetFiles) {
        try {
          // Read existing file content
          const existingContent = await this.aiService.analyzeExistingFile(filePath)
          
          // Generate modification task
          const task = await this.aiService.generateModificationTask(userInput, existingContent, filePath)
          tasks.push(task)
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error)
          // Create a simple modification task as fallback
          tasks.push(new Task({
            type: 'modify',
            description: `Modify ${filePath}: ${userInput}`,
            priority: 'high',
            filePath,
            content: ''
          }))
        }
      }
      
      return tasks
    } catch (error) {
      console.error('Error parsing modification request:', error)
      return await this.aiService.parseUserRequest(userInput)
    }
  }

  async identifyTargetFiles(userInput) {
    const targetFiles = []
    const lowerInput = userInput.toLowerCase()
    
    // Common file patterns
    if (lowerInput.includes('layout') || lowerInput.includes('navigation') || lowerInput.includes('header')) {
      targetFiles.push('app/layout.tsx')
    }
    
    if (lowerInput.includes('page') || lowerInput.includes('home') || lowerInput.includes('landing')) {
      targetFiles.push('app/page.tsx')
    }
    
    if (lowerInput.includes('component')) {
      targetFiles.push('components/')
    }
    
    if (lowerInput.includes('style') || lowerInput.includes('css')) {
      targetFiles.push('app/globals.css')
    }
    
    // If no specific files identified, default to main page
    if (targetFiles.length === 0) {
      targetFiles.push('app/page.tsx')
    }
    
    return targetFiles
  }

  async executeTasks(tasks) {
    const results = []
    
    for (const task of tasks) {
      try {
        const result = await this.executor.executeTask(task)
        results.push({
          task,
          result
        })
      } catch (error) {
        results.push({
          task,
          result: {
            success: false,
            error: error.message
          }
        })
      }
    }
    
    return results
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9)
  }
}

module.exports = { TaskManager }