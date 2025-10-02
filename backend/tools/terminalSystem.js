const { spawn, exec } = require('child_process')
const path = require('path')
const fs = require('fs-extra')

class TerminalSystemTools {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
    this.runningProcesses = new Map() // Track running processes by PID
  }

  /**
   * Run a shell command in the project directory
   * @param {string} command - Command to execute
   * @param {string} cwd - Working directory (defaults to project root)
   * @returns {Promise<{success: boolean, output: string, error?: string, exitCode: number}>}
   */
  async run_command(command, cwd = null) {
    try {
      const workingDir = cwd || this.projectRoot
      
      return new Promise((resolve) => {
        exec(command, { 
          cwd: workingDir,
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        }, (error, stdout, stderr) => {
          if (error) {
            resolve({
              success: false,
              output: stdout,
              error: stderr || error.message,
              exitCode: error.code || 1
            })
          } else {
            resolve({
              success: true,
              output: stdout,
              error: null,
              exitCode: 0
            })
          }
        })
      })
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error.message,
        exitCode: 1
      }
    }
  }

  /**
   * Stream command output line by line (for long-running processes)
   * @param {string} command - Command to execute
   * @param {string} cwd - Working directory (defaults to project root)
   * @returns {Promise<{success: boolean, pid: number, output: string[], error?: string}>}
   */
  async stream_command(command, cwd = null) {
    try {
      const workingDir = cwd || this.projectRoot
      const output = []
      
      return new Promise((resolve) => {
        const child = spawn('sh', ['-c', command], {
          cwd: workingDir,
          stdio: ['pipe', 'pipe', 'pipe']
        })

        const pid = child.pid
        this.runningProcesses.set(pid, child)

        child.stdout.on('data', (data) => {
          const lines = data.toString().split('\n').filter(line => line.trim())
          output.push(...lines)
        })

        child.stderr.on('data', (data) => {
          const lines = data.toString().split('\n').filter(line => line.trim())
          output.push(...lines)
        })

        child.on('close', (code) => {
          this.runningProcesses.delete(pid)
          resolve({
            success: code === 0,
            pid,
            output,
            error: code !== 0 ? `Process exited with code ${code}` : null,
            exitCode: code
          })
        })

        child.on('error', (error) => {
          this.runningProcesses.delete(pid)
          resolve({
            success: false,
            pid,
            output,
            error: error.message,
            exitCode: 1
          })
        })

        // For streaming, we resolve immediately with the PID
        // The actual output will be available when the process completes
        setTimeout(() => {
          if (this.runningProcesses.has(pid)) {
            resolve({
              success: true,
              pid,
              output: output.slice(0, 10), // Return first 10 lines for immediate feedback
              streaming: true,
              message: 'Process started, streaming output...'
            })
          }
        }, 100)
      })
    } catch (error) {
      return {
        success: false,
        output: [],
        error: error.message,
        exitCode: 1
      }
    }
  }

  /**
   * Kill a running process
   * @param {number} pid - Process ID to kill
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async kill_process(pid) {
    try {
      if (this.runningProcesses.has(pid)) {
        const process = this.runningProcesses.get(pid)
        process.kill('SIGTERM')
        this.runningProcesses.delete(pid)
        
        return {
          success: true,
          message: `Process ${pid} terminated successfully`
        }
      } else {
        // Try to kill process even if not tracked
        return new Promise((resolve) => {
          exec(`kill ${pid}`, (error) => {
            if (error) {
              resolve({
                success: false,
                message: `Failed to kill process ${pid}: ${error.message}`
              })
            } else {
              resolve({
                success: true,
                message: `Process ${pid} killed successfully`
              })
            }
          })
        })
      }
    } catch (error) {
      return {
        success: false,
        message: `Error killing process ${pid}: ${error.message}`
      }
    }
  }

  /**
   * Install dependencies based on project type
   * @returns {Promise<{success: boolean, output: string, error?: string}>}
   */
  async install_dependencies() {
    try {
      // Check for package.json (Node.js)
      const packageJsonPath = path.join(this.projectRoot, 'package.json')
      if (await fs.pathExists(packageJsonPath)) {
        return await this.run_command('npm install')
      }

      // Check for requirements.txt (Python)
      const requirementsPath = path.join(this.projectRoot, 'requirements.txt')
      if (await fs.pathExists(requirementsPath)) {
        return await this.run_command('pip install -r requirements.txt')
      }

      // Check for pyproject.toml (Python)
      const pyprojectPath = path.join(this.projectRoot, 'pyproject.toml')
      if (await fs.pathExists(pyprojectPath)) {
        return await this.run_command('pip install -e .')
      }

      // Check for Cargo.toml (Rust)
      const cargoPath = path.join(this.projectRoot, 'Cargo.toml')
      if (await fs.pathExists(cargoPath)) {
        return await this.run_command('cargo build')
      }

      // Check for go.mod (Go)
      const goModPath = path.join(this.projectRoot, 'go.mod')
      if (await fs.pathExists(goModPath)) {
        return await this.run_command('go mod download')
      }

      return {
        success: false,
        output: '',
        error: 'No recognized dependency file found (package.json, requirements.txt, pyproject.toml, Cargo.toml, go.mod)'
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error.message
      }
    }
  }

  /**
   * Add a single dependency
   * @param {string} pkg - Package name to install
   * @param {string} version - Optional version specifier
   * @returns {Promise<{success: boolean, output: string, error?: string}>}
   */
  async add_dependency(pkg, version = null) {
    try {
      // Check for package.json (Node.js)
      const packageJsonPath = path.join(this.projectRoot, 'package.json')
      if (await fs.pathExists(packageJsonPath)) {
        const versionSpec = version ? `@${version}` : ''
        return await this.run_command(`npm install ${pkg}${versionSpec}`)
      }

      // Check for requirements.txt (Python)
      const requirementsPath = path.join(this.projectRoot, 'requirements.txt')
      if (await fs.pathExists(requirementsPath)) {
        const versionSpec = version ? `==${version}` : ''
        return await this.run_command(`pip install ${pkg}${versionSpec}`)
      }

      // Check for pyproject.toml (Python)
      const pyprojectPath = path.join(this.projectRoot, 'pyproject.toml')
      if (await fs.pathExists(pyprojectPath)) {
        const versionSpec = version ? `==${version}` : ''
        return await this.run_command(`pip install ${pkg}${versionSpec}`)
      }

      // Check for Cargo.toml (Rust)
      const cargoPath = path.join(this.projectRoot, 'Cargo.toml')
      if (await fs.pathExists(cargoPath)) {
        return await this.run_command(`cargo add ${pkg}`)
      }

      // Check for go.mod (Go)
      const goModPath = path.join(this.projectRoot, 'go.mod')
      if (await fs.pathExists(goModPath)) {
        return await this.run_command(`go get ${pkg}`)
      }

      return {
        success: false,
        output: '',
        error: 'No recognized dependency file found (package.json, requirements.txt, pyproject.toml, Cargo.toml, go.mod)'
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error.message
      }
    }
  }

  /**
   * Remove a dependency
   * @param {string} pkg - Package name to remove
   * @returns {Promise<{success: boolean, output: string, error?: string}>}
   */
  async remove_dependency(pkg) {
    try {
      // Check for package.json (Node.js)
      const packageJsonPath = path.join(this.projectRoot, 'package.json')
      if (await fs.pathExists(packageJsonPath)) {
        return await this.run_command(`npm uninstall ${pkg}`)
      }

      // Check for requirements.txt (Python)
      const requirementsPath = path.join(this.projectRoot, 'requirements.txt')
      if (await fs.pathExists(requirementsPath)) {
        return await this.run_command(`pip uninstall ${pkg} -y`)
      }

      // Check for pyproject.toml (Python)
      const pyprojectPath = path.join(this.projectRoot, 'pyproject.toml')
      if (await fs.pathExists(pyprojectPath)) {
        return await this.run_command(`pip uninstall ${pkg} -y`)
      }

      // Check for Cargo.toml (Rust)
      const cargoPath = path.join(this.projectRoot, 'Cargo.toml')
      if (await fs.pathExists(cargoPath)) {
        return await this.run_command(`cargo remove ${pkg}`)
      }

      // Check for go.mod (Go)
      const goModPath = path.join(this.projectRoot, 'go.mod')
      if (await fs.pathExists(goModPath)) {
        return await this.run_command(`go mod edit -droprequire ${pkg}`)
      }

      return {
        success: false,
        output: '',
        error: 'No recognized dependency file found (package.json, requirements.txt, pyproject.toml, Cargo.toml, go.mod)'
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error.message
      }
    }
  }

  /**
   * Get list of running processes started by the agent
   * @returns {Array<{pid: number, command: string}>}
   */
  get_running_processes() {
    return Array.from(this.runningProcesses.entries()).map(([pid, process]) => ({
      pid,
      command: process.spawnargs.join(' ')
    }))
  }

  /**
   * Clean up all running processes
   */
  cleanup() {
    for (const [pid, process] of this.runningProcesses) {
      try {
        process.kill('SIGTERM')
      } catch (error) {
        console.error(`Error killing process ${pid}:`, error.message)
      }
    }
    this.runningProcesses.clear()
  }
}

module.exports = TerminalSystemTools

