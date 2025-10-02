import { Task, AgentContext, AgentResponse } from './types'
import { FileSystemManager } from './fileSystem'
import { TaskExecutor } from './taskExecutor'
import { AIService } from './aiService'

export class TaskManager {
  private tasks: Task[] = []
  private context: AgentContext
  private fileSystem: FileSystemManager
  private executor: TaskExecutor
  private aiService: AIService

  constructor(context: AgentContext, fileSystem: FileSystemManager, executor: TaskExecutor) {
    this.context = context
    this.fileSystem = fileSystem
    this.executor = executor
    this.aiService = new AIService(context)
  }

  async parseUserInput(userInput: string): Promise<Task[]> {
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
        // For other requests, use AI for intelligent parsing
        return await this.aiService.parseUserRequest(userInput)
      }
    } catch (error) {
      console.error('AI parsing failed, using fallback:', error)
      // Fallback to basic parsing if AI fails
      return this.fallbackParsing(userInput)
    }
  }

  private async parseModificationRequest(userInput: string): Promise<Task[]> {
    const tasks: Task[] = []
    
    // Analyze the request to determine which files to modify
    const lowerInput = userInput.toLowerCase()
    
    // Check for common modification patterns
    if (lowerInput.includes('navigation') || lowerInput.includes('nav') || lowerInput.includes('header')) {
      // Look for layout or main page files
      const layoutFile = this.context.files.find(f => f.path.includes('layout.tsx'))
      const pageFile = this.context.files.find(f => f.path.includes('page.tsx'))
      
      if (layoutFile) {
        try {
          const existingContent = await this.aiService.analyzeExistingFile(layoutFile.path)
          const task = await this.aiService.generateModificationTask(userInput, existingContent, layoutFile.path)
          tasks.push(task)
        } catch (error) {
          console.error('Error creating modification task:', error)
        }
      } else if (pageFile) {
        try {
          const existingContent = await this.aiService.analyzeExistingFile(pageFile.path)
          const task = await this.aiService.generateModificationTask(userInput, existingContent, pageFile.path)
          tasks.push(task)
        } catch (error) {
          console.error('Error creating modification task:', error)
        }
      }
    }
    
    // If no specific modification tasks were created, fall back to AI parsing
    if (tasks.length === 0) {
      return await this.aiService.parseUserRequest(userInput)
    }
    
    return tasks
  }

  private fallbackParsing(userInput: string): Task[] {
    const tasks: Task[] = []
    const lines = userInput.toLowerCase().split('\n')
    
    for (const line of lines) {
      if (line.includes('create') || line.includes('add') || line.includes('make')) {
        if (line.includes('file') || line.includes('.tsx') || line.includes('.ts') || line.includes('.js')) {
          tasks.push({
            id: this.generateId(),
            type: 'create',
            description: line.trim(),
            status: 'pending',
            priority: 'medium',
            dependencies: [],
            createdAt: new Date()
          })
        }
      }
      
      if (line.includes('install') || line.includes('add package')) {
        const packageMatch = line.match(/(?:install|add)\s+([a-zA-Z0-9@\-_\/]+)/)
        if (packageMatch) {
          tasks.push({
            id: this.generateId(),
            type: 'install',
            description: `Install package: ${packageMatch[1]}`,
            status: 'pending',
            priority: 'high',
            dependencies: [],
            command: packageMatch[1],
            createdAt: new Date()
          })
        }
      }
      
      if (line.includes('run') || line.includes('start') || line.includes('dev')) {
        tasks.push({
          id: this.generateId(),
          type: 'command',
          description: 'Start development server',
          status: 'pending',
          priority: 'medium',
          dependencies: [],
          command: 'npm run dev',
          createdAt: new Date()
        })
      }
    }
    
    return tasks
  }

  async executeTasks(tasks: Task[]): Promise<AgentResponse> {
    const response: AgentResponse = {
      success: true,
      message: 'Tasks completed successfully',
      tasks: [],
      filesCreated: [],
      filesModified: [],
      errors: []
    }

    // Sort tasks by priority and dependencies
    const sortedTasks = this.sortTasksByDependencies(tasks)
    
    for (const task of sortedTasks) {
      try {
        task.status = 'in-progress'
        
        const result = await this.executor.executeTask(task)
        
        if (result.success) {
          task.status = 'completed'
          task.completedAt = new Date()
          
          if (task.type === 'create') {
            response.filesCreated.push(task.filePath!)
          } else if (task.type === 'modify') {
            response.filesModified.push(task.filePath!)
          }
        } else {
          task.status = 'failed'
          task.error = result.error
          response.errors.push(result.error || 'Unknown error')
          response.success = false
        }
        
        response.tasks.push(task)
        
        // Update context after each task
        this.context = await this.fileSystem.buildContext()
        
      } catch (error) {
        task.status = 'failed'
        task.error = error instanceof Error ? error.message : 'Unknown error'
        response.errors.push(task.error)
        response.success = false
        response.tasks.push(task)
      }
    }
    
    return response
  }

  private sortTasksByDependencies(tasks: Task[]): Task[] {
    const sorted: Task[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()
    
    const visit = (task: Task) => {
      if (visiting.has(task.id)) {
        throw new Error(`Circular dependency detected: ${task.id}`)
      }
      
      if (visited.has(task.id)) {
        return
      }
      
      visiting.add(task.id)
      
      // Visit dependencies first
      for (const depId of task.dependencies) {
        const depTask = tasks.find(t => t.id === depId)
        if (depTask) {
          visit(depTask)
        }
      }
      
      visiting.delete(task.id)
      visited.add(task.id)
      sorted.push(task)
    }
    
    // Sort by priority first
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const sortedByPriority = tasks.sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    )
    
    for (const task of sortedByPriority) {
      visit(task)
    }
    
    return sorted
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  getTasks(): Task[] {
    return this.tasks
  }

  getContext(): AgentContext {
    return this.context
  }
}
