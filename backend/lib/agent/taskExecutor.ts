import { spawn } from 'child_process'
import { Task, AgentResponse, AgentContext } from './types'
import { AIService } from './aiService'

export class TaskExecutor {
  private projectRoot: string
  private aiService: AIService

  constructor(projectRoot: string, context: AgentContext) {
    this.projectRoot = projectRoot
    this.aiService = new AIService(context)
  }

  async executeTask(task: Task): Promise<{ success: boolean; output: string; error?: string; fileChanges?: { file: string; linesAdded: number; linesRemoved: number } }> {
    switch (task.type) {
      case 'command':
        return await this.executeCommand(task.command!)
      case 'install':
        return await this.installPackage(task.command!)
      case 'create':
        return await this.createFile(task.filePath!, task.content!)
      case 'modify':
        return await this.modifyFile(task.filePath!, task.content!)
      case 'delete':
        return await this.deleteFile(task.filePath!)
      default:
        return { success: false, output: '', error: `Unknown task type: ${task.type}` }
    }
  }

  private async executeCommand(command: string): Promise<{ success: boolean; output: string; error?: string }> {
    return new Promise((resolve) => {
      const [cmd, ...args] = command.split(' ')
      const process = spawn(cmd, args, {
        cwd: this.projectRoot,
        shell: true
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
          output,
          error: error || undefined
        })
      })
    })
  }

  private async installPackage(packageName: string): Promise<{ success: boolean; output: string; error?: string }> {
    const command = `npm install ${packageName}`
    return await this.executeCommand(command)
  }

  private async createFile(filePath: string, content: string): Promise<{ success: boolean; output: string; error?: string }> {
    try {
      const fs = require('fs').promises
      const path = require('path')
      
      const fullPath = path.join(this.projectRoot, filePath)
      const dir = path.dirname(fullPath)
      
      // Create directory if it doesn't exist
      await fs.mkdir(dir, { recursive: true })
      
      // If content is empty or basic, generate it with AI
      let finalContent = content
      if (!content || content.trim().length < 10) {
        try {
          finalContent = await this.aiService.generateCode({
            id: 'generate-code',
            type: 'create',
            description: `Create ${filePath}`,
            status: 'pending',
            priority: 'medium',
            dependencies: [],
            filePath,
            content: '',
            createdAt: new Date()
          }, `Creating file: ${filePath}`)
        } catch (aiError) {
          console.error('AI code generation failed:', aiError)
          // Use basic template if AI fails
          finalContent = this.getBasicTemplate(filePath)
        }
      }
      
      // Write file
      await fs.writeFile(fullPath, finalContent, 'utf-8')
      
      return {
        success: true,
        output: `Created file: ${filePath}`
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private getBasicTemplate(filePath: string): string {
    if (filePath.endsWith('.tsx')) {
      return `import React from 'react'

export default function Component() {
  return (
    <div>
      <h1>New Component</h1>
    </div>
  )
}`
    } else if (filePath.endsWith('.ts')) {
      return `// New TypeScript file
export const example = 'Hello World'`
    } else if (filePath.endsWith('.js')) {
      return `// New JavaScript file
const example = 'Hello World'
module.exports = { example }`
    } else if (filePath.endsWith('.css')) {
      return `/* New CSS file */
body {
  margin: 0;
  padding: 0;
}`
    }
    return `// New file: ${filePath}`
  }

  private async modifyFile(filePath: string, content: string): Promise<{ success: boolean; output: string; error?: string; fileChanges?: { file: string; linesAdded: number; linesRemoved: number } }> {
    try {
      const fs = require('fs').promises
      const path = require('path')
      
      const fullPath = path.join(this.projectRoot, filePath)
      
      // Read existing content to calculate changes
      let existingContent = ''
      let linesRemoved = 0
      try {
        existingContent = await fs.readFile(fullPath, 'utf-8')
        linesRemoved = existingContent.split('\n').length
      } catch (readError) {
        // File doesn't exist, so no lines to remove
        linesRemoved = 0
      }
      
      // Write new content
      await fs.writeFile(fullPath, content, 'utf-8')
      
      // Calculate lines added
      const linesAdded = content.split('\n').length
      
      return {
        success: true,
        output: `Modified file: ${filePath}`,
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
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async deleteFile(filePath: string): Promise<{ success: boolean; output: string; error?: string }> {
    try {
      const fs = require('fs').promises
      const path = require('path')
      
      const fullPath = path.join(this.projectRoot, filePath)
      await fs.unlink(fullPath)
      
      return {
        success: true,
        output: `Deleted file: ${filePath}`
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async runDevServer(): Promise<{ success: boolean; output: string; error?: string }> {
    return await this.executeCommand('npm run dev')
  }

  async buildProject(): Promise<{ success: boolean; output: string; error?: string }> {
    return await this.executeCommand('npm run build')
  }

  async runTests(): Promise<{ success: boolean; output: string; error?: string }> {
    return await this.executeCommand('npm test')
  }
}
