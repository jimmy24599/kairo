import { readFile, writeFile, mkdir, readdir, stat } from 'fs/promises'
import { join, dirname, extname } from 'path'
import { ProjectFile, AgentContext, CodeAnalysis } from './types'

export class FileSystemManager {
  private projectRoot: string

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
  }

  async scanProject(): Promise<ProjectFile[]> {
    const files: ProjectFile[] = []
    
    const scanDirectory = async (dirPath: string, relativePath: string = ''): Promise<void> => {
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
            path: relativeItemPath,
            content: '',
            type: 'directory'
          })
          
          await scanDirectory(fullPath, relativeItemPath)
        } else {
          const content = await readFile(fullPath, 'utf-8')
          const analysis = this.analyzeCode(content, extname(item))
          
          files.push({
            path: relativeItemPath,
            content,
            type: 'file',
            dependencies: analysis.dependencies,
            imports: analysis.imports,
            exports: analysis.exports
          })
        }
      }
      } catch (error) {
        console.error(`Error scanning directory ${dirPath}:`, error)
        // Continue with other directories if one fails
      }
    }
    
    try {
      await scanDirectory(this.projectRoot)
    } catch (error) {
      console.error(`Error scanning project root ${this.projectRoot}:`, error)
      // Return empty array if we can't scan the project
    }
    return files
  }

  async createFile(filePath: string, content: string): Promise<void> {
    const fullPath = join(this.projectRoot, filePath)
    const dir = dirname(fullPath)
    
    // Create directory if it doesn't exist
    try {
      await mkdir(dir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
    
    await writeFile(fullPath, content, 'utf-8')
  }

  async modifyFile(filePath: string, content: string): Promise<void> {
    const fullPath = join(this.projectRoot, filePath)
    await writeFile(fullPath, content, 'utf-8')
  }

  async readFile(filePath: string): Promise<string> {
    const fullPath = join(this.projectRoot, filePath)
    return await readFile(fullPath, 'utf-8')
  }

  private analyzeCode(content: string, extension: string): CodeAnalysis {
    const analysis: CodeAnalysis = {
      imports: [],
      exports: [],
      dependencies: [],
      functions: [],
      classes: [],
      variables: [],
      complexity: 0
    }

    // Basic regex-based analysis (in production, use proper AST parsers)
    if (extension === '.ts' || extension === '.tsx' || extension === '.js' || extension === '.jsx') {
      // Extract imports
      const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g
      let match
      while ((match = importRegex.exec(content)) !== null) {
        analysis.imports.push(match[1])
      }

      // Extract exports
      const exportRegex = /export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type)\s+(\w+)/g
      while ((match = exportRegex.exec(content)) !== null) {
        analysis.exports.push(match[1])
      }

      // Extract functions
      const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g
      while ((match = functionRegex.exec(content)) !== null) {
        analysis.functions.push(match[1])
      }

      // Extract classes
      const classRegex = /(?:export\s+)?class\s+(\w+)/g
      while ((match = classRegex.exec(content)) !== null) {
        analysis.classes.push(match[1])
      }

      // Calculate complexity (simple line count for now)
      analysis.complexity = content.split('\n').length
    }

    return analysis
  }

  async buildContext(): Promise<AgentContext> {
    const files = await this.scanProject()
    let packageJson: any = null
    
    try {
      const packageContent = await this.readFile('package.json')
      packageJson = JSON.parse(packageContent)
    } catch (error) {
      // package.json doesn't exist
    }

    const context: AgentContext = {
      projectRoot: this.projectRoot,
      files,
      packageJson,
      dependencies: packageJson?.dependencies ? Object.keys(packageJson.dependencies) : [],
      devDependencies: packageJson?.devDependencies ? Object.keys(packageJson.devDependencies) : [],
      scripts: packageJson?.scripts || {},
      framework: this.detectFramework(files, packageJson),
      language: this.detectLanguage(files)
    }

    return context
  }

  private detectFramework(files: ProjectFile[], packageJson: any): AgentContext['framework'] {
    if (packageJson?.dependencies?.next) return 'next'
    if (packageJson?.dependencies?.react) return 'react'
    if (packageJson?.dependencies?.vue) return 'vue'
    if (packageJson?.dependencies?.['@angular/core']) return 'angular'
    return 'unknown'
  }

  private detectLanguage(files: ProjectFile[]): AgentContext['language'] {
    const hasTS = files.some(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx'))
    const hasJS = files.some(f => f.path.endsWith('.js') || f.path.endsWith('.jsx'))
    const hasPy = files.some(f => f.path.endsWith('.py'))
    
    if (hasTS) return 'typescript'
    if (hasJS) return 'javascript'
    if (hasPy) return 'python'
    return 'unknown'
  }
}
