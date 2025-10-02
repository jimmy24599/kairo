const fs = require('fs-extra')
const path = require('path')

class SafeSandbox {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
    this.allowedPaths = new Set()
    this.restrictedPaths = new Set()
    this.allowedExtensions = new Set([
      '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.hpp',
      '.css', '.scss', '.sass', '.less', '.html', '.htm', '.xml', '.json',
      '.md', '.txt', '.yml', '.yaml', '.toml', '.ini', '.cfg', '.conf',
      '.sql', '.sh', '.bat', '.ps1', '.dockerfile', '.gitignore', '.env'
    ])
    this.restrictedExtensions = new Set([
      '.exe', '.dll', '.so', '.dylib', '.bin', '.app', '.deb', '.rpm',
      '.zip', '.tar', '.gz', '.7z', '.rar', '.iso', '.img'
    ])
    this.maxFileSize = 10 * 1024 * 1024 // 10MB
    this.initializeSandbox()
  }

  /**
   * Initialize sandbox with safe defaults
   */
  initializeSandbox() {
    // Allow project root and subdirectories
    this.allowedPaths.add(this.projectRoot)
    
    // Restrict system directories
    this.restrictedPaths.add('/')
    this.restrictedPaths.add('/bin')
    this.restrictedPaths.add('/sbin')
    this.restrictedPaths.add('/usr')
    this.restrictedPaths.add('/etc')
    this.restrictedPaths.add('/var')
    this.restrictedPaths.add('/tmp')
    this.restrictedPaths.add('/home')
    this.restrictedPaths.add('/root')
    
    // Restrict common system files
    this.restrictedPaths.add('/etc/passwd')
    this.restrictedPaths.add('/etc/shadow')
    this.restrictedPaths.add('/etc/hosts')
    this.restrictedPaths.add('/proc')
    this.restrictedPaths.add('/sys')
  }

  /**
   * Validate file path for safety
   * @param {string} filePath - Path to validate
   * @param {string} operation - Operation type (read, write, delete)
   * @returns {Object} Validation result
   */
  async validatePath(filePath, operation = 'read') {
    try {
      const fullPath = path.resolve(this.projectRoot, filePath)
      
      // Check if path is within project root
      if (!fullPath.startsWith(this.projectRoot)) {
        return {
          safe: false,
          error: 'Path is outside project root',
          reason: 'SECURITY_VIOLATION'
        }
      }

      // Check for restricted paths
      for (const restrictedPath of this.restrictedPaths) {
        if (fullPath.startsWith(restrictedPath)) {
          return {
            safe: false,
            error: 'Path is in restricted directory',
            reason: 'RESTRICTED_PATH'
          }
        }
      }

      // Check file extension
      const ext = path.extname(filePath).toLowerCase()
      if (this.restrictedExtensions.has(ext)) {
        return {
          safe: false,
          error: 'File extension is restricted',
          reason: 'RESTRICTED_EXTENSION'
        }
      }

      // Check file size for read operations
      if (operation === 'read' && await fs.pathExists(fullPath)) {
        const stats = await fs.stat(fullPath)
        if (stats.size > this.maxFileSize) {
          return {
            safe: false,
            error: 'File size exceeds maximum allowed size',
            reason: 'FILE_TOO_LARGE'
          }
        }
      }

      // Check for dangerous patterns
      if (this.containsDangerousPatterns(filePath)) {
        return {
          safe: false,
          error: 'Path contains dangerous patterns',
          reason: 'DANGEROUS_PATTERN'
        }
      }

      return {
        safe: true,
        path: fullPath,
        reason: 'VALIDATED'
      }
    } catch (error) {
      return {
        safe: false,
        error: `Path validation failed: ${error.message}`,
        reason: 'VALIDATION_ERROR'
      }
    }
  }

  /**
   * Validate file content for safety
   * @param {string} content - Content to validate
   * @param {string} filePath - File path for context
   * @returns {Object} Validation result
   */
  async validateContent(content, filePath) {
    try {
      // Check content size
      if (content.length > this.maxFileSize) {
        return {
          safe: false,
          error: 'Content size exceeds maximum allowed size',
          reason: 'CONTENT_TOO_LARGE'
        }
      }

      // Check for dangerous patterns
      if (this.containsDangerousContent(content)) {
        return {
          safe: false,
          error: 'Content contains dangerous patterns',
          reason: 'DANGEROUS_CONTENT'
        }
      }

      // Check for executable code in non-code files
      const ext = path.extname(filePath).toLowerCase()
      if (!this.allowedExtensions.has(ext) && this.containsExecutableCode(content)) {
        return {
          safe: false,
          error: 'File contains executable code but has non-code extension',
          reason: 'EXECUTABLE_IN_NON_CODE_FILE'
        }
      }

      return {
        safe: true,
        reason: 'CONTENT_VALIDATED'
      }
    } catch (error) {
      return {
        safe: false,
        error: `Content validation failed: ${error.message}`,
        reason: 'VALIDATION_ERROR'
      }
    }
  }

  /**
   * Validate command for safety
   * @param {string} command - Command to validate
   * @param {Array} args - Command arguments
   * @returns {Object} Validation result
   */
  async validateCommand(command, args = []) {
    try {
      const allowedCommands = new Set([
        'npm', 'yarn', 'pip', 'python', 'node', 'git',
        'ls', 'cat', 'grep', 'find', 'head', 'tail'
      ])

      const restrictedCommands = new Set([
        'rm', 'del', 'format', 'fdisk', 'mkfs', 'dd',
        'sudo', 'su', 'chmod', 'chown', 'passwd',
        'shutdown', 'reboot', 'halt', 'poweroff'
      ])

      // Check if command is allowed
      if (!allowedCommands.has(command)) {
        return {
          safe: false,
          error: 'Command is not allowed',
          reason: 'COMMAND_NOT_ALLOWED'
        }
      }

      // Check if command is restricted
      if (restrictedCommands.has(command)) {
        return {
          safe: false,
          error: 'Command is restricted',
          reason: 'COMMAND_RESTRICTED'
        }
      }

      // Check arguments for dangerous patterns
      const allArgs = [command, ...args].join(' ')
      if (this.containsDangerousPatterns(allArgs)) {
        return {
          safe: false,
          error: 'Command arguments contain dangerous patterns',
          reason: 'DANGEROUS_ARGUMENTS'
        }
      }

      return {
        safe: true,
        reason: 'COMMAND_VALIDATED'
      }
    } catch (error) {
      return {
        safe: false,
        error: `Command validation failed: ${error.message}`,
        reason: 'VALIDATION_ERROR'
      }
    }
  }

  /**
   * Add allowed path
   * @param {string} path - Path to allow
   */
  addAllowedPath(path) {
    this.allowedPaths.add(path)
  }

  /**
   * Add restricted path
   * @param {string} path - Path to restrict
   */
  addRestrictedPath(path) {
    this.restrictedPaths.add(path)
  }

  /**
   * Set maximum file size
   * @param {number} size - Maximum file size in bytes
   */
  setMaxFileSize(size) {
    this.maxFileSize = size
  }

  /**
   * Get sandbox configuration
   * @returns {Object} Sandbox configuration
   */
  getConfiguration() {
    return {
      projectRoot: this.projectRoot,
      allowedPaths: Array.from(this.allowedPaths),
      restrictedPaths: Array.from(this.restrictedPaths),
      allowedExtensions: Array.from(this.allowedExtensions),
      restrictedExtensions: Array.from(this.restrictedExtensions),
      maxFileSize: this.maxFileSize
    }
  }

  // Helper methods

  containsDangerousPatterns(text) {
    const dangerousPatterns = [
      /\.\.\//g,  // Directory traversal
      /\.\.\\/g,  // Windows directory traversal
      /\/etc\/passwd/g,  // System files
      /\/etc\/shadow/g,
      /\/proc\//g,
      /\/sys\//g,
      /rm\s+-rf/g,  // Dangerous commands
      /format\s+c:/g,
      /del\s+\/s/g,
      /sudo\s+/g,
      /su\s+/g
    ]

    return dangerousPatterns.some(pattern => pattern.test(text))
  }

  containsDangerousContent(content) {
    const dangerousPatterns = [
      /eval\s*\(/g,  // Code injection
      /Function\s*\(/g,
      /setTimeout\s*\(/g,
      /setInterval\s*\(/g,
      /require\s*\(/g,  // Module injection
      /import\s*\(/g,
      /exec\s*\(/g,  // Command execution
      /system\s*\(/g,
      /shell_exec\s*\(/g,
      /passthru\s*\(/g
    ]

    return dangerousPatterns.some(pattern => pattern.test(content))
  }

  containsExecutableCode(content) {
    const executablePatterns = [
      /<script/g,  // HTML/JS
      /javascript:/g,
      /vbscript:/g,
      /onload\s*=/g,
      /onclick\s*=/g,
      /#!/g,  // Shebang
      /@echo/g,  // Batch commands
      /echo\s+/g
    ]

    return executablePatterns.some(pattern => pattern.test(content))
  }
}

module.exports = { SafeSandbox }
