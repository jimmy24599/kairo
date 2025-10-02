const { FileSystemManager } = require('./fileSystem')
const { TaskExecutor } = require('./taskExecutor')
const { TaskManager } = require('./taskManager')

class CapacityAgent {
  constructor(projectRoot) {
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

  async initialize() {
    // Build initial context
    this.context = await this.fileSystem.buildContext()
    this.executor = new TaskExecutor(this.context.projectRoot, this.context)
    this.taskManager = new TaskManager(this.context, this.fileSystem, this.executor)
  }

  async parseUserInput(userInput) {
    return await this.taskManager.parseUserInput(userInput)
  }

  async executeTask(task) {
    return await this.executor.executeTask(task)
  }

  async processUserRequest(userInput) {
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
      const results = []
      const filesCreated = []
      const filesModified = []
      const errors = []

      for (const task of tasks) {
        try {
          const result = await this.executor.executeTask(task)
          results.push(result)
          
          if (result.success) {
            if (task.type === 'create') {
              filesCreated.push(task.filePath)
            } else if (task.type === 'modify') {
              filesModified.push(task.filePath)
            }
          } else {
            errors.push(result.error || 'Task execution failed')
          }
        } catch (error) {
          errors.push(error.message)
        }
      }

      return {
        success: errors.length === 0,
        message: errors.length === 0 ? 'Tasks completed successfully' : 'Some tasks failed',
        tasks: tasks.map(task => ({
          ...task,
          status: 'completed'
        })),
        filesCreated,
        filesModified,
        errors
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error processing request',
        tasks: [],
        filesCreated: [],
        filesModified: [],
        errors: [error.message]
      }
    }
  }

  async createFile(filePath, content) {
    try {
      await this.fileSystem.createFile(filePath, content)
      
      // Update context
      this.context = await this.fileSystem.buildContext()
      
      return {
        success: true,
        message: `File created: ${filePath}`,
        tasks: [{
          id: this.generateId(),
          type: 'create',
          description: `Create file: ${filePath}`,
          status: 'completed',
          priority: 'high',
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
        errors: [error.message]
      }
    }
  }

  async modifyFile(filePath, content) {
    try {
      await this.fileSystem.modifyFile(filePath, content)
      
      // Update context
      this.context = await this.fileSystem.buildContext()
      
      return {
        success: true,
        message: `File modified: ${filePath}`,
        tasks: [{
          id: this.generateId(),
          type: 'modify',
          description: `Modify file: ${filePath}`,
          status: 'completed',
          priority: 'high',
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
        errors: [error.message]
      }
    }
  }

  async installPackage(packageName) {
    try {
      const result = await this.executor.executeTask({
        id: this.generateId(),
        type: 'install',
        description: `Install package: ${packageName}`,
        status: 'pending',
        priority: 'high',
        dependencies: [],
        command: packageName,
        createdAt: new Date()
      })
      
      if (result.success) {
        // Update context after installation
        this.context = await this.fileSystem.buildContext()
      }
      
      return {
        success: result.success,
        message: result.success ? `Package installed: ${packageName}` : 'Failed to install package',
        tasks: [{
          id: this.generateId(),
          type: 'install',
          description: `Install package: ${packageName}`,
          status: result.success ? 'completed' : 'failed',
          priority: 'high',
          dependencies: [],
          command: packageName,
          createdAt: new Date(),
          completedAt: new Date()
        }],
        filesCreated: [],
        filesModified: [],
        errors: result.success ? [] : [result.error || 'Installation failed']
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error installing package',
        tasks: [],
        filesCreated: [],
        filesModified: [],
        errors: [error.message]
      }
    }
  }

  async runCommand(command) {
    try {
      const result = await this.executor.executeTask({
        id: this.generateId(),
        type: 'command',
        description: `Run command: ${command}`,
        status: 'pending',
        priority: 'medium',
        dependencies: [],
        command,
        createdAt: new Date()
      })
      
      return {
        success: result.success,
        message: result.success ? `Command executed: ${command}` : 'Command failed',
        tasks: [{
          id: this.generateId(),
          type: 'command',
          description: `Run command: ${command}`,
          status: result.success ? 'completed' : 'failed',
          priority: 'medium',
          dependencies: [],
          command,
          createdAt: new Date(),
          completedAt: new Date()
        }],
        filesCreated: [],
        filesModified: [],
        errors: result.success ? [] : [result.error || 'Command execution failed']
      }
    } catch (error) {
      return {
        success: false,
        message: 'Error running command',
        tasks: [],
        filesCreated: [],
        filesModified: [],
        errors: [error.message]
      }
    }
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9)
  }

  getContext() {
    return this.context
  }

  getFramework() {
    return this.context.framework
  }

  getLanguage() {
    return this.context.language
  }
}

module.exports = { CapacityAgent }