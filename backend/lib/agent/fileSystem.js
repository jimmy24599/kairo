const { readFile, writeFile, mkdir, readdir, stat } = require('fs/promises')
const { join, dirname, extname } = require('path')

class FileSystemManager {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
  }

  async scanProject() {
    const files = []
    
    const scanDirectory = async (dirPath, relativePath = '') => {
      try {
        const items = await readdir(dirPath)
      
        for (const item of items) {
          const fullPath = join(dirPath, item)
          const relativeItemPath = join(relativePath, item)
          const stats = await stat(fullPath)
          
          if (stats.isDirectory()) {
            // Skip node_modules and other build directories
            if (item === 'node_modules' || item === '.next' || item === 'dist' || item === 'build') {
              continue
            }
            
            files.push({
              name: item,
              path: relativeItemPath,
              type: 'directory',
              size: stats.size,
              modified: stats.mtime
            })
            
            // Recursively scan subdirectories
            await scanDirectory(fullPath, relativeItemPath)
          } else {
            files.push({
              name: item,
              path: relativeItemPath,
              type: 'file',
              size: stats.size,
              modified: stats.mtime,
              extension: extname(item)
            })
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${dirPath}:`, error)
      }
    }
    
    await scanDirectory(this.projectRoot)
    return files
  }

  async buildContext() {
    const files = await this.scanProject()
    const context = {
      projectRoot: this.projectRoot,
      files,
      dependencies: [],
      devDependencies: [],
      scripts: {},
      framework: 'unknown',
      language: 'unknown'
    }
    
    // Try to detect framework and language
    const packageJsonPath = join(this.projectRoot, 'package.json')
    try {
      const packageJsonContent = await readFile(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(packageJsonContent)
      
      context.dependencies = Object.keys(packageJson.dependencies || {})
      context.devDependencies = Object.keys(packageJson.devDependencies || {})
      context.scripts = packageJson.scripts || {}
      
      // Detect framework
      if (context.dependencies.includes('next')) {
        context.framework = 'nextjs'
        context.language = 'typescript'
      } else if (context.dependencies.includes('react')) {
        context.framework = 'react'
        context.language = 'javascript'
      } else if (context.dependencies.includes('vue')) {
        context.framework = 'vue'
        context.language = 'javascript'
      } else if (context.dependencies.includes('angular')) {
        context.framework = 'angular'
        context.language = 'typescript'
      }
    } catch (error) {
      console.log('No package.json found or error reading it')
    }
    
    return context
  }

  async readFile(filePath) {
    const fullPath = join(this.projectRoot, filePath)
    return await readFile(fullPath, 'utf-8')
  }

  async writeFile(filePath, content) {
    const fullPath = join(this.projectRoot, filePath)
    const dir = dirname(fullPath)
    
    // Ensure directory exists
    await mkdir(dir, { recursive: true })
    
    return await writeFile(fullPath, content, 'utf-8')
  }

  async createFile(filePath, content) {
    return await this.writeFile(filePath, content)
  }

  async modifyFile(filePath, content) {
    return await this.writeFile(filePath, content)
  }

  async deleteFile(filePath) {
    const fullPath = join(this.projectRoot, filePath)
    const { unlink } = require('fs/promises')
    return await unlink(fullPath)
  }

  async fileExists(filePath) {
    const fullPath = join(this.projectRoot, filePath)
    try {
      await stat(fullPath)
      return true
    } catch {
      return false
    }
  }

  async getFileStats(filePath) {
    const fullPath = join(this.projectRoot, filePath)
    return await stat(fullPath)
  }
}

module.exports = { FileSystemManager }