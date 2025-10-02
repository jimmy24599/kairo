import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat, readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectName: string } }
) {
  try {
    const { projectName } = params
    const projectsRoot = process.env.PROJECT_ROOT || process.cwd()
    const projectPath = join(projectsRoot, projectName)
    
    const scanDirectory = async (dirPath: string, relativePath: string = ''): Promise<any[]> => {
      const items = await readdir(dirPath)
      const result: any[] = []
      
      for (const item of items) {
        const fullPath = join(dirPath, item)
        const relativeItemPath = relativePath ? join(relativePath, item) : item
        const stats = await stat(fullPath)
        
        if (stats.isDirectory()) {
          // Skip only build directories, but show node_modules
          if (item === '.next' || item === 'dist' || item === 'build' || item === '.git' || (item.startsWith('.') && item !== '.git')) {
            continue
          }
          
          // For node_modules, only show top-level packages to avoid overwhelming the UI
          let children = []
          if (item === 'node_modules') {
            const nodeModulesItems = await readdir(fullPath)
            for (const pkg of nodeModulesItems.slice(0, 20)) { // Limit to first 20 packages
              const pkgPath = join(fullPath, pkg)
              const pkgStats = await stat(pkgPath)
              if (pkgStats.isDirectory()) {
                children.push({
                  name: pkg,
                  type: 'directory',
                  path: join(relativeItemPath, pkg),
                  children: [] // Don't show nested structure for node_modules
                })
              }
            }
          } else {
            children = await scanDirectory(fullPath, relativeItemPath)
          }
          
          result.push({
            name: item,
            type: 'directory',
            path: relativeItemPath,
            children: children
          })
        } else {
          result.push({
            name: item,
            type: 'file',
            path: relativeItemPath
          })
        }
      }
      
      return result.sort((a, b) => {
        // Directories first, then files
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
    }
    
    const files = await scanDirectory(projectPath)
    
    return NextResponse.json({
      success: true,
      files
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectName: string } }
) {
  try {
    const { projectName } = params
    const { filePath, content } = await request.json()
    
    const projectsRoot = process.env.PROJECT_ROOT || process.cwd()
    const fullPath = join(projectsRoot, projectName, filePath)
    
    const fs = require('fs').promises
    await fs.writeFile(fullPath, content, 'utf-8')
    
    return NextResponse.json({
      success: true,
      message: 'File saved successfully'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
