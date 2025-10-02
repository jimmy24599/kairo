const { spawn } = require('child_process')
const { Task } = require('./types')
const { AIService } = require('./aiService')
const { FileSystemManager } = require('./fileSystem')

class TaskExecutor {
  constructor(projectRoot, context) {
    this.projectRoot = projectRoot
    this.aiService = new AIService(context)
    this.fileSystem = new FileSystemManager(projectRoot)
  }

  async executeTask(task) {
    switch (task.type) {
      case 'command':
        return await this.executeCommand(task.command)
      case 'install':
        return await this.installPackage(task.command)
      case 'create':
        return await this.createFile(task.filePath, task.content)
      case 'modify':
        return await this.modifyFile(task.filePath, task.content)
      case 'delete':
        return await this.deleteFile(task.filePath)
      default:
        return { success: false, output: '', error: `Unknown task type: ${task.type}` }
    }
  }

  async executeCommand(command) {
    return new Promise((resolve) => {
      const [cmd, ...args] = command.split(' ')
      const process = spawn(cmd, args, {
        cwd: this.projectRoot,
        stdio: 'pipe'
      })

      let output = ''
      let error = ''

      process.stdout.on('data', (data) => {
        output += data.toString()
      })

      process.stderr.on('data', (data) => {
        error += data.toString()
      })

      process.on('close', (code) => {
        resolve({
          success: code === 0,
          output: output.trim(),
          error: error.trim()
        })
      })
    })
  }

  async installPackage(packageName) {
    const command = `npm install ${packageName}`
    return await this.executeCommand(command)
  }

  async createFile(filePath, content) {
    try {
      await this.fileSystem.createFile(filePath, content)
      return {
        success: true,
        output: `File created: ${filePath}`,
        error: null
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error.message
      }
    }
  }

  async modifyFile(filePath, content) {
    try {
      // Read existing content to calculate changes
      let existingContent = ''
      let linesRemoved = 0
      try {
        existingContent = await this.fileSystem.readFile(filePath)
        linesRemoved = existingContent.split('\n').length
      } catch (readError) {
        linesRemoved = 0 // File doesn't exist, so no lines to remove
      }

      await this.fileSystem.modifyFile(filePath, content)
      const linesAdded = content.split('\n').length

      return {
        success: true,
        output: `Modified file: ${filePath}`,
        error: null,
        fileChanges: {
          file: filePath,
          linesAdded: linesAdded,
          linesRemoved: linesRemoved
        }
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error.message
      }
    }
  }

  async deleteFile(filePath) {
    try {
      await this.fileSystem.deleteFile(filePath)
      return {
        success: true,
        output: `File deleted: ${filePath}`,
        error: null
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error.message
      }
    }
  }
}

module.exports = { TaskExecutor }