const { FileSystemManager } = require('./fileSystem')
const { TaskExecutor } = require('./taskExecutor')
const { TaskManager } = require('./taskManager')
const { AgentContext, AgentResponse } = require('./types')

class CapacityAgent {
  private fileSystem: FileSystemManager
  private executor: TaskExecutor
  private taskManager: TaskManager
  private context: AgentContext

  constructor(projectRoot: string) {
    this.fileSystem = new FileSystemManager(projectRoot)
    this.context = {
      projectRoot,
      files: [],
      dependencies: [],
      devDependencies: [],
      scripts: {},
      framework: 'unknown',
      language: 'unknown'
    }
    this.executor = new TaskExecutor(projectRoot, this.context)
    this.taskManager = new TaskManager(this.context, this.fileSystem, this.executor)
  }

  async initialize(): Promise<void> {
    // Build initial context
    this.context = await this.fileSystem.buildContext()
    this.executor = new TaskExecutor(this.context.projectRoot, this.context)
    this.taskManager = new TaskManager(this.context, this.fileSystem, this.executor)
  }

  async parseUserInput(userInput: string) {
    return await this.taskManager.parseUserInput(userInput)
  }

  async executeTask(task: any) {
    return await this.executor.executeTask(task)
  }

  async processUserRequest(userInput: string): Promise<AgentResponse> {
    try {
      // Parse user input into tasks
      const tasks = await this.taskManager.parseUserInput(userInput)
      
      if (tasks.length === 0) {
        return {
          success: false,
          message: 'No actionable tasks found in your request',
          tasks: [],
          filesCreated: [],
          filesModified: [],
          errors: ['Could not parse user input into tasks']
        }
      }

      // Execute tasks
      const response = await this.taskManager.executeTasks(tasks)
      
      // Update context after execution
      this.context = await this.fileSystem.buildContext()
      
      return response
      
    } catch (error) {
      return {
        success: false,
        message: 'Error processing request',
        tasks: [],
        filesCreated: [],
        filesModified: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async createFile(filePath: string, content: string): Promise<AgentResponse> {
    try {
      await this.fileSystem.createFile(filePath, content)
      
      // Update context
      this.context = await this.fileSystem.buildContext()
      
      return {
        success: true,
        message: `File created: ${filePath}`,
        tasks: [{
          id: 'create-file',
          type: 'create',
          description: `Create file: ${filePath}`,
          status: 'completed',
          priority: 'medium',
          dependencies: [],
          filePath,
          content,
          createdAt: new Date(),
          completedAt: new Date()
        }],
        filesCreated: [filePath],
        filesModified: [],
        errors: []
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error creating file',
        tasks: [],
        filesCreated: [],
        filesModified: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async modifyFile(filePath: string, content: string): Promise<AgentResponse> {
    try {
      await this.fileSystem.modifyFile(filePath, content)
      
      // Update context
      this.context = await this.fileSystem.buildContext()
      
      return {
        success: true,
        message: `File modified: ${filePath}`,
        tasks: [{
          id: 'modify-file',
          type: 'modify',
          description: `Modify file: ${filePath}`,
          status: 'completed',
          priority: 'medium',
          dependencies: [],
          filePath,
          content,
          createdAt: new Date(),
          completedAt: new Date()
        }],
        filesCreated: [],
        filesModified: [filePath],
        errors: []
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error modifying file',
        tasks: [],
        filesCreated: [],
        filesModified: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async installPackage(packageName: string): Promise<AgentResponse> {
    try {
      const result = await this.executor.installPackage(packageName)
      
      if (result.success) {
        // Update context
        this.context = await this.fileSystem.buildContext()
        
        return {
          success: true,
          message: `Package installed: ${packageName}`,
          tasks: [{
            id: 'install-package',
            type: 'install',
            description: `Install package: ${packageName}`,
            status: 'completed',
            priority: 'high',
            dependencies: [],
            command: packageName,
            createdAt: new Date(),
            completedAt: new Date()
          }],
          filesCreated: [],
          filesModified: [],
          errors: []
        }
      } else {
        return {
          success: false,
          message: 'Error installing package',
          tasks: [],
          filesCreated: [],
          filesModified: [],
          errors: [result.error || 'Unknown error']
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error installing package',
        tasks: [],
        filesCreated: [],
        filesModified: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  async runCommand(command: string): Promise<AgentResponse> {
    try {
      const result = await this.executor.executeCommand(command)
      
      return {
        success: result.success,
        message: result.success ? 'Command executed successfully' : 'Command failed',
        tasks: [{
          id: 'run-command',
          type: 'command',
          description: `Run command: ${command}`,
          status: result.success ? 'completed' : 'failed',
          priority: 'medium',
          dependencies: [],
          command,
          error: result.error,
          createdAt: new Date(),
          completedAt: result.success ? new Date() : undefined
        }],
        filesCreated: [],
        filesModified: [],
        errors: result.error ? [result.error] : []
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error running command',
        tasks: [],
        filesCreated: [],
        filesModified: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  getContext(): AgentContext {
    return this.context
  }

  getProjectFiles(): string[] {
    return this.context.files.map(f => f.path)
  }

  getDependencies(): string[] {
    return this.context.dependencies
  }

  getFramework(): string {
    return this.context.framework
  }

  getLanguage(): string {
    return this.context.language
  }
}

module.exports = { CapacityAgent }
