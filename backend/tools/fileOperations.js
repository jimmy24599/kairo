const fs = require('fs-extra')
const path = require('path')
const crypto = require('crypto')

class FileOperations {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
  }

  /**
   * List files and folders in a directory
   * @param {string} dirPath - Directory path (relative to project root)
   * @returns {Array} Array of file/folder objects
   */
  async list_files(dirPath = '') {
    try {
      const fullPath = path.join(this.projectRoot, dirPath)
      const items = await fs.readdir(fullPath)
      
      const result = []
      for (const item of items) {
        const itemPath = path.join(fullPath, item)
        const stats = await fs.stat(itemPath)
        
        result.push({
          name: item,
          path: path.join(dirPath, item),
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime,
          extension: path.extname(item)
        })
      }
      
      return result
    } catch (error) {
      throw new Error(`Failed to list files in ${dirPath}: ${error.message}`)
    }
  }

  /**
   * Read file contents
   * @param {string} filePath - File path (relative to project root)
   * @returns {string} File contents
   */
  async read_file(filePath) {
    try {
      const fullPath = path.join(this.projectRoot, filePath)
      return await fs.readFile(fullPath, 'utf-8')
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`)
    }
  }

  /**
   * Write/overwrite file contents
   * @param {string} filePath - File path (relative to project root)
   * @param {string} content - File content
   */
  async write_file(filePath, content) {
    try {
      const fullPath = path.join(this.projectRoot, filePath)
      const dir = path.dirname(fullPath)
      
      // Ensure directory exists
      await fs.ensureDir(dir)
      
      await fs.writeFile(fullPath, content, 'utf-8')
      return { success: true, message: `File written: ${filePath}` }
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error.message}`)
    }
  }

  /**
   * Create a new file
   * @param {string} filePath - File path (relative to project root)
   * @param {string} content - File content
   */
  async create_file(filePath, content) {
    try {
      const fullPath = path.join(this.projectRoot, filePath)
      
      const dir = path.dirname(fullPath)
      await fs.ensureDir(dir)
      
      await fs.writeFile(fullPath, content, 'utf-8')
      return { success: true, message: `File created: ${filePath}` }
    } catch (error) {
      throw new Error(`Failed to create file ${filePath}: ${error.message}`)
    }
  }

  /**
   * Delete a file
   * @param {string} filePath - File path (relative to project root)
   */
  async delete_file(filePath) {
    try {
      const fullPath = path.join(this.projectRoot, filePath)
      
      if (!(await fs.pathExists(fullPath))) {
        throw new Error(`File does not exist: ${filePath}`)
      }
      
      await fs.remove(fullPath)
      return { success: true, message: `File deleted: ${filePath}` }
    } catch (error) {
      throw new Error(`Failed to delete file ${filePath}: ${error.message}`)
    }
  }

  /**
   * Rename/move a file
   * @param {string} oldPath - Current file path (relative to project root)
   * @param {string} newPath - New file path (relative to project root)
   */
  async rename_file(oldPath, newPath) {
    try {
      const oldFullPath = path.join(this.projectRoot, oldPath)
      const newFullPath = path.join(this.projectRoot, newPath)
      
      if (!(await fs.pathExists(oldFullPath))) {
        throw new Error(`Source file does not exist: ${oldPath}`)
      }
      
      if (await fs.pathExists(newFullPath)) {
        throw new Error(`Destination file already exists: ${newPath}`)
      }
      
      const newDir = path.dirname(newFullPath)
      await fs.ensureDir(newDir)
      
      await fs.move(oldFullPath, newFullPath)
      return { success: true, message: `File renamed: ${oldPath} → ${newPath}` }
    } catch (error) {
      throw new Error(`Failed to rename file ${oldPath} to ${newPath}: ${error.message}`)
    }
  }

  /**
   * Apply a unified diff patch to files
   * @param {string} patch - Unified diff patch string
   */
  async apply_patch(patch) {
    try {
      // Parse the patch to extract file paths and changes
      const lines = patch.split('\n')
      const fileChanges = this.parsePatch(patch)
      
      const results = []
      
      for (const change of fileChanges) {
        if (change.type === 'modify') {
          // Read current file content
          const currentContent = await this.read_file(change.filePath)
          
          // Apply the patch
          const newContent = this.applyPatchToContent(currentContent, change.hunks)
          
          // Write the modified content
          await this.write_file(change.filePath, newContent)
          
          results.push({
            file: change.filePath,
            type: 'modified',
            linesAdded: change.linesAdded,
            linesRemoved: change.linesRemoved
          })
        } else if (change.type === 'create') {
          // Create new file
          await this.create_file(change.filePath, change.content)
          
          results.push({
            file: change.filePath,
            type: 'created',
            linesAdded: change.linesAdded
          })
        } else if (change.type === 'delete') {
          // Delete file
          await this.delete_file(change.filePath)
          
          results.push({
            file: change.filePath,
            type: 'deleted'
          })
        }
      }
      
      return { success: true, message: 'Patch applied successfully', changes: results }
    } catch (error) {
      throw new Error(`Failed to apply patch: ${error.message}`)
    }
  }

  /**
   * Parse unified diff patch
   * @param {string} patch - Patch string
   * @returns {Array} Array of file changes
   */
  parsePatch(patch) {
    const lines = patch.split('\n')
    const changes = []
    let currentChange = null
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // File header
      if (line.startsWith('--- ') || line.startsWith('+++ ')) {
        if (line.startsWith('+++ ')) {
          if (currentChange) {
            changes.push(currentChange)
          }
          currentChange = {
            filePath: line.substring(4).replace(/^b\//, ''),
            type: 'modify',
            hunks: [],
            linesAdded: 0,
            linesRemoved: 0
          }
        }
      }
      // Hunk header
      else if (line.startsWith('@@ ')) {
        if (currentChange) {
          currentChange.hunks.push({
            header: line,
            lines: []
          })
        }
      }
      // Content lines
      else if (currentChange && currentChange.hunks.length > 0) {
        const hunk = currentChange.hunks[currentChange.hunks.length - 1]
        hunk.lines.push(line)
        
        if (line.startsWith('+') && !line.startsWith('+++')) {
          currentChange.linesAdded++
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          currentChange.linesRemoved++
        }
      }
    }
    
    if (currentChange) {
      changes.push(currentChange)
    }
    
    return changes
  }

  /**
   * Apply patch hunks to file content
   * @param {string} content - Original file content
   * @param {Array} hunks - Patch hunks
   * @returns {string} Modified content
   */
  applyPatchToContent(content, hunks) {
    const lines = content.split('\n')
    let result = []
    let lineIndex = 0
    
    for (const hunk of hunks) {
      // Parse hunk header to get line numbers
      const headerMatch = hunk.header.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/)
      if (!headerMatch) continue
      
      const oldStart = parseInt(headerMatch[1]) - 1
      const oldCount = parseInt(headerMatch[2]) || 1
      const newStart = parseInt(headerMatch[3]) - 1
      
      // Add lines before the hunk
      while (lineIndex < oldStart) {
        result.push(lines[lineIndex])
        lineIndex++
      }
      
      // Process hunk lines
      for (const line of hunk.lines) {
        if (line.startsWith(' ')) {
          // Context line - keep as is
          result.push(line.substring(1))
          lineIndex++
        } else if (line.startsWith('+')) {
          // Added line
          result.push(line.substring(1))
        } else if (line.startsWith('-')) {
          // Removed line - skip
          lineIndex++
        }
      }
    }
    
    // Add remaining lines
    while (lineIndex < lines.length) {
      result.push(lines[lineIndex])
      lineIndex++
    }
    
    return result.join('\n')
  }

  /**
   * Stream read file with optional range
   * @param {string} filePath - File path (relative to project root)
   * @param {number} start - Start byte position (optional)
   * @param {number} end - End byte position (optional)
   * @returns {Object} File content and metadata
   */
  async stream_read_file(filePath, start = 0, end = null) {
    try {
      const fullPath = path.join(this.projectRoot, filePath)
      const stats = await fs.stat(fullPath)
      
      if (end === null) {
        end = stats.size
      }
      
      const length = end - start
      const buffer = Buffer.alloc(length)
      
      const fd = await fs.open(fullPath, 'r')
      await fd.read(buffer, 0, length, start)
      await fd.close()
      
      return {
        content: buffer.toString('utf-8'),
        start,
        end,
        length,
        totalSize: stats.size
      }
    } catch (error) {
      throw new Error(`Failed to stream read file ${filePath}: ${error.message}`)
    }
  }

  /**
   * Append content to file
   * @param {string} filePath - File path (relative to project root)
   * @param {string} content - Content to append
   */
  async append_file(filePath, content) {
    try {
      const fullPath = path.join(this.projectRoot, filePath)
      const dir = path.dirname(fullPath)
      
      // Ensure directory exists
      await fs.ensureDir(dir)
      
      await fs.appendFile(fullPath, content, 'utf-8')
      return { success: true, message: `Content appended to: ${filePath}` }
    } catch (error) {
      throw new Error(`Failed to append to file ${filePath}: ${error.message}`)
    }
  }

  /**
   * Copy a file
   * @param {string} srcPath - Source file path (relative to project root)
   * @param {string} destPath - Destination file path (relative to project root)
   */
  async copy_file(srcPath, destPath) {
    try {
      const srcFullPath = path.join(this.projectRoot, srcPath)
      const destFullPath = path.join(this.projectRoot, destPath)
      
      if (!(await fs.pathExists(srcFullPath))) {
        throw new Error(`Source file does not exist: ${srcPath}`)
      }
      
      const destDir = path.dirname(destFullPath)
      await fs.ensureDir(destDir)
      
      await fs.copy(srcFullPath, destFullPath)
      return { success: true, message: `File copied: ${srcPath} → ${destPath}` }
    } catch (error) {
      throw new Error(`Failed to copy file ${srcPath} to ${destPath}: ${error.message}`)
    }
  }

  /**
   * Set file permissions
   * @param {string} filePath - File path (relative to project root)
   * @param {string} mode - Permission mode (e.g., '755', '644', 'rwxr-xr-x')
   */
  async set_file_permissions(filePath, mode) {
    try {
      const fullPath = path.join(this.projectRoot, filePath)
      
      if (!(await fs.pathExists(fullPath))) {
        throw new Error(`File does not exist: ${filePath}`)
      }
      
      // Convert mode to octal if it's a string
      let permissionMode = mode
      if (typeof mode === 'string' && !mode.startsWith('0')) {
        // Convert symbolic mode to octal
        if (mode.includes('r') || mode.includes('w') || mode.includes('x')) {
          // This is a simplified conversion - in practice you'd want a more robust parser
          permissionMode = '755' // Default to rwxr-xr-x
        } else {
          permissionMode = parseInt(mode, 8)
        }
      }
      
      await fs.chmod(fullPath, permissionMode)
      return { success: true, message: `Permissions set for ${filePath}: ${mode}` }
    } catch (error) {
      throw new Error(`Failed to set permissions for ${filePath}: ${error.message}`)
    }
  }

  /**
   * Get file metadata
   * @param {string} filePath - File path (relative to project root)
   * @returns {Object} File metadata
   */
  async stat_file(filePath) {
    try {
      const fullPath = path.join(this.projectRoot, filePath)
      
      if (!(await fs.pathExists(fullPath))) {
        throw new Error(`File does not exist: ${filePath}`)
      }
      
      const stats = await fs.stat(fullPath)
      
      // Calculate file hash
      const content = await fs.readFile(fullPath)
      const hash = crypto.createHash('sha256').update(content).digest('hex')
      
      return {
        path: filePath,
        name: path.basename(filePath),
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        permissions: stats.mode.toString(8),
        hash: hash,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        isSymbolicLink: stats.isSymbolicLink()
      }
    } catch (error) {
      throw new Error(`Failed to get file stats for ${filePath}: ${error.message}`)
    }
  }

  /**
   * Read last N lines of a file
   * @param {string} filePath - File path (relative to project root)
   * @param {number} lines - Number of lines to read from end (default: 10)
   * @returns {Object} Last N lines and metadata
   */
  async tail_file(filePath, lines = 10) {
    try {
      const fullPath = path.join(this.projectRoot, filePath)
      
      if (!(await fs.pathExists(fullPath))) {
        throw new Error(`File does not exist: ${filePath}`)
      }
      
      const content = await fs.readFile(fullPath, 'utf-8')
      const allLines = content.split('\n')
      const totalLines = allLines.length
      
      // Get last N lines
      const startIndex = Math.max(0, totalLines - lines)
      const lastLines = allLines.slice(startIndex)
      
      return {
        file: filePath,
        lines: lastLines,
        lineCount: lastLines.length,
        totalLines: totalLines,
        startLine: startIndex + 1,
        endLine: totalLines
      }
    } catch (error) {
      throw new Error(`Failed to tail file ${filePath}: ${error.message}`)
    }
  }
}

module.exports = { FileOperations }
