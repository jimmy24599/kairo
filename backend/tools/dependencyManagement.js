const fs = require('fs-extra')
const path = require('path')
const { spawn } = require('child_process')

class DependencyManagement {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
  }

  /**
   * Get project configuration (package.json, pyproject.toml, etc.)
   * @returns {Object} Project configuration
   */
  async get_project_config() {
    try {
      const configFiles = [
        'package.json',
        'pyproject.toml',
        'requirements.txt',
        'Pipfile',
        'composer.json',
        'Cargo.toml',
        'go.mod',
        'pom.xml',
        'build.gradle'
      ]

      const foundConfigs = []

      for (const configFile of configFiles) {
        const configPath = path.join(this.projectRoot, configFile)
        if (await fs.pathExists(configPath)) {
          const content = await fs.readFile(configPath, 'utf-8')
          
          let parsedContent
          try {
            if (configFile.endsWith('.json')) {
              parsedContent = JSON.parse(content)
            } else if (configFile.endsWith('.toml')) {
              // Simple TOML parsing for basic structure
              parsedContent = this.parseToml(content)
            } else {
              // For text files like requirements.txt
              parsedContent = { content: content.split('\n').filter(line => line.trim()) }
            }
          } catch (error) {
            parsedContent = { content, error: 'Failed to parse' }
          }

          foundConfigs.push({
            file: configFile,
            path: configPath,
            content: parsedContent,
            type: this.getConfigType(configFile)
          })
        }
      }

      return {
        projectRoot: this.projectRoot,
        configs: foundConfigs,
        primaryConfig: foundConfigs.find(c => c.type === 'primary') || foundConfigs[0]
      }
    } catch (error) {
      throw new Error(`Failed to get project config: ${error.message}`)
    }
  }

  /**
   * List dependencies with versions
   * @returns {Object} Dependencies list
   */
  async list_dependencies() {
    try {
      const config = await this.get_project_config()
      const primaryConfig = config.primaryConfig

      if (!primaryConfig) {
        return { dependencies: [], devDependencies: [], error: 'No configuration file found' }
      }

      const dependencies = []
      const devDependencies = []

      if (primaryConfig.file === 'package.json') {
        const pkg = primaryConfig.content
        
        // Production dependencies
        if (pkg.dependencies) {
          for (const [name, version] of Object.entries(pkg.dependencies)) {
            dependencies.push({
              name,
              version,
              type: 'production',
              manager: 'npm'
            })
          }
        }

        // Development dependencies
        if (pkg.devDependencies) {
          for (const [name, version] of Object.entries(pkg.devDependencies)) {
            devDependencies.push({
              name,
              version,
              type: 'development',
              manager: 'npm'
            })
          }
        }
      } else if (primaryConfig.file === 'requirements.txt') {
        const lines = primaryConfig.content.content
        for (const line of lines) {
          if (line.trim() && !line.startsWith('#')) {
            const [name, version] = this.parseRequirementLine(line)
            dependencies.push({
              name,
              version,
              type: 'production',
              manager: 'pip'
            })
          }
        }
      } else if (primaryConfig.file === 'pyproject.toml') {
        const pyproject = primaryConfig.content
        if (pyproject.dependencies) {
          for (const dep of pyproject.dependencies) {
            const [name, version] = this.parseRequirementLine(dep)
            dependencies.push({
              name,
              version,
              type: 'production',
              manager: 'pip'
            })
          }
        }
      }

      return {
        dependencies,
        devDependencies,
        total: dependencies.length + devDependencies.length,
        manager: this.detectPackageManager()
      }
    } catch (error) {
      throw new Error(`Failed to list dependencies: ${error.message}`)
    }
  }

  /**
   * Get resolved dependency tree
   * @returns {Object} Dependency tree
   */
  async get_dependency_tree() {
    try {
      const manager = this.detectPackageManager()
      
      if (manager === 'npm') {
        return await this.getNpmDependencyTree()
      } else if (manager === 'pip') {
        return await this.getPipDependencyTree()
      } else {
        return { error: `Dependency tree not supported for ${manager}` }
      }
    } catch (error) {
      throw new Error(`Failed to get dependency tree: ${error.message}`)
    }
  }

  /**
   * Check latest version of a package
   * @param {string} pkg - Package name
   * @returns {Object} Latest version info
   */
  async check_latest_version(pkg) {
    try {
      const manager = this.detectPackageManager()
      
      if (manager === 'npm') {
        return await this.checkNpmLatestVersion(pkg)
      } else if (manager === 'pip') {
        return await this.checkPipLatestVersion(pkg)
      } else {
        return { error: `Version check not supported for ${manager}` }
      }
    } catch (error) {
      throw new Error(`Failed to check latest version for ${pkg}: ${error.message}`)
    }
  }

  /**
   * Bump dependency version
   * @param {string} pkg - Package name
   * @param {string} version - New version
   * @returns {Object} Update result
   */
  async bump_dependency(pkg, version) {
    try {
      const config = await this.get_project_config()
      const primaryConfig = config.primaryConfig

      if (!primaryConfig) {
        throw new Error('No configuration file found')
      }

      if (primaryConfig.file === 'package.json') {
        return await this.bumpNpmDependency(pkg, version)
      } else if (primaryConfig.file === 'requirements.txt') {
        return await this.bumpPipDependency(pkg, version)
      } else {
        return { error: `Bump not supported for ${primaryConfig.file}` }
      }
    } catch (error) {
      throw new Error(`Failed to bump dependency ${pkg}: ${error.message}`)
    }
  }

  /**
   * Install dependencies
   * @returns {Object} Installation result
   */
  async install_dependencies() {
    try {
      const manager = this.detectPackageManager()
      
      if (manager === 'npm') {
        return await this.runNpmInstall()
      } else if (manager === 'pip') {
        return await this.runPipInstall()
      } else {
        return { error: `Install not supported for ${manager}` }
      }
    } catch (error) {
      throw new Error(`Failed to install dependencies: ${error.message}`)
    }
  }

  /**
   * Remove dependency
   * @param {string} pkg - Package name
   * @returns {Object} Removal result
   */
  async remove_dependency(pkg) {
    try {
      const manager = this.detectPackageManager()
      
      if (manager === 'npm') {
        return await this.removeNpmDependency(pkg)
      } else if (manager === 'pip') {
        return await this.removePipDependency(pkg)
      } else {
        return { error: `Remove not supported for ${manager}` }
      }
    } catch (error) {
      throw new Error(`Failed to remove dependency ${pkg}: ${error.message}`)
    }
  }

  /**
   * Pin dependencies (lockfile generation/update)
   * @returns {Object} Pin result
   */
  async pin_dependencies() {
    try {
      const manager = this.detectPackageManager()
      
      if (manager === 'npm') {
        return await this.pinNpmDependencies()
      } else if (manager === 'pip') {
        return await this.pinPipDependencies()
      } else {
        return { error: `Pin not supported for ${manager}` }
      }
    } catch (error) {
      throw new Error(`Failed to pin dependencies: ${error.message}`)
    }
  }

  // Helper methods

  detectPackageManager() {
    const packageJson = path.join(this.projectRoot, 'package.json')
    const requirementsTxt = path.join(this.projectRoot, 'requirements.txt')
    const pyprojectToml = path.join(this.projectRoot, 'pyproject.toml')
    
    if (fs.existsSync(packageJson)) return 'npm'
    if (fs.existsSync(requirementsTxt) || fs.existsSync(pyprojectToml)) return 'pip'
    
    return 'unknown'
  }

  getConfigType(filename) {
    const primaryConfigs = ['package.json', 'pyproject.toml', 'requirements.txt']
    return primaryConfigs.includes(filename) ? 'primary' : 'secondary'
  }

  parseToml(content) {
    // Simple TOML parser for basic structure
    const lines = content.split('\n')
    const result = {}
    let currentSection = null

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentSection = trimmed.slice(1, -1)
        result[currentSection] = {}
      } else if (trimmed.includes('=') && currentSection) {
        const [key, value] = trimmed.split('=', 2)
        result[currentSection][key.trim()] = value.trim().replace(/^["']|["']$/g, '')
      }
    }

    return result
  }

  parseRequirementLine(line) {
    // Parse requirement line like "package==1.0.0" or "package>=1.0.0"
    const match = line.match(/^([a-zA-Z0-9_-]+)([><=!]+)(.+)$/)
    if (match) {
      return [match[1], match[2] + match[3]]
    }
    return [line.trim(), 'latest']
  }

  async getNpmDependencyTree() {
    return new Promise((resolve, reject) => {
      const process = spawn('npm', ['ls', '--json'], { cwd: this.projectRoot })
      let output = ''
      let error = ''

      process.stdout.on('data', (data) => {
        output += data.toString()
      })

      process.stderr.on('data', (data) => {
        error += data.toString()
      })

      process.on('close', (code) => {
        try {
          const tree = JSON.parse(output)
          resolve({
            manager: 'npm',
            tree,
            error: error || null
          })
        } catch (parseError) {
          resolve({
            manager: 'npm',
            error: `Failed to parse dependency tree: ${parseError.message}`,
            rawOutput: output
          })
        }
      })
    })
  }

  async getPipDependencyTree() {
    return new Promise((resolve, reject) => {
      const process = spawn('pip', ['show'], { cwd: this.projectRoot })
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
          manager: 'pip',
          packages: this.parsePipShow(output),
          error: error || null
        })
      })
    })
  }

  parsePipShow(output) {
    const packages = []
    const sections = output.split('\n\n')
    
    for (const section of sections) {
      if (section.trim()) {
        const lines = section.split('\n')
        const pkg = {}
        
        for (const line of lines) {
          if (line.includes(':')) {
            const [key, value] = line.split(':', 2)
            pkg[key.trim().toLowerCase()] = value.trim()
          }
        }
        
        if (pkg.name) {
          packages.push(pkg)
        }
      }
    }
    
    return packages
  }

  async checkNpmLatestVersion(pkg) {
    return new Promise((resolve, reject) => {
      const process = spawn('npm', ['view', pkg, 'version'], { cwd: this.projectRoot })
      let output = ''
      let error = ''

      process.stdout.on('data', (data) => {
        output += data.toString()
      })

      process.stderr.on('data', (data) => {
        error += data.toString()
      })

      process.on('close', (code) => {
        if (code === 0) {
          resolve({
            package: pkg,
            latestVersion: output.trim(),
            manager: 'npm'
          })
        } else {
          resolve({
            package: pkg,
            error: error || 'Package not found',
            manager: 'npm'
          })
        }
      })
    })
  }

  async checkPipLatestVersion(pkg) {
    return new Promise((resolve, reject) => {
      const process = spawn('pip', ['index', 'versions', pkg], { cwd: this.projectRoot })
      let output = ''
      let error = ''

      process.stdout.on('data', (data) => {
        output += data.toString()
      })

      process.stderr.on('data', (data) => {
        error += data.toString()
      })

      process.on('close', (code) => {
        if (code === 0) {
          const versions = output.trim().split('\n')
          resolve({
            package: pkg,
            latestVersion: versions[0] || 'unknown',
            allVersions: versions,
            manager: 'pip'
          })
        } else {
          resolve({
            package: pkg,
            error: error || 'Package not found',
            manager: 'pip'
          })
        }
      })
    })
  }

  async bumpNpmDependency(pkg, version) {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json')
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
      
      let updated = false
      if (packageJson.dependencies && packageJson.dependencies[pkg]) {
        packageJson.dependencies[pkg] = version
        updated = true
      }
      if (packageJson.devDependencies && packageJson.devDependencies[pkg]) {
        packageJson.devDependencies[pkg] = version
        updated = true
      }
      
      if (updated) {
        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
        return {
          success: true,
          package: pkg,
          newVersion: version,
          manager: 'npm'
        }
      } else {
        return {
          success: false,
          error: `Package ${pkg} not found in dependencies`,
          manager: 'npm'
        }
      }
    } catch (error) {
      throw new Error(`Failed to bump npm dependency: ${error.message}`)
    }
  }

  async bumpPipDependency(pkg, version) {
    try {
      const requirementsPath = path.join(this.projectRoot, 'requirements.txt')
      if (await fs.pathExists(requirementsPath)) {
        const content = await fs.readFile(requirementsPath, 'utf-8')
        const lines = content.split('\n')
        
        let updated = false
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith(pkg + '==') || lines[i].startsWith(pkg + '>=') || lines[i].startsWith(pkg + '>')) {
            lines[i] = `${pkg}==${version}`
            updated = true
            break
          }
        }
        
        if (updated) {
          await fs.writeFile(requirementsPath, lines.join('\n'))
          return {
            success: true,
            package: pkg,
            newVersion: version,
            manager: 'pip'
          }
        } else {
          return {
            success: false,
            error: `Package ${pkg} not found in requirements.txt`,
            manager: 'pip'
          }
        }
      } else {
        return {
          success: false,
          error: 'requirements.txt not found',
          manager: 'pip'
        }
      }
    } catch (error) {
      throw new Error(`Failed to bump pip dependency: ${error.message}`)
    }
  }

  async runNpmInstall() {
    return new Promise((resolve, reject) => {
      const process = spawn('npm', ['install'], { cwd: this.projectRoot })
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
          error: code !== 0 ? error : null,
          manager: 'npm'
        })
      })
    })
  }

  async runPipInstall() {
    return new Promise((resolve, reject) => {
      const process = spawn('pip', ['install', '-r', 'requirements.txt'], { cwd: this.projectRoot })
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
          error: code !== 0 ? error : null,
          manager: 'pip'
        })
      })
    })
  }

  async removeNpmDependency(pkg) {
    return new Promise((resolve, reject) => {
      const process = spawn('npm', ['uninstall', pkg], { cwd: this.projectRoot })
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
          package: pkg,
          output,
          error: code !== 0 ? error : null,
          manager: 'npm'
        })
      })
    })
  }

  async removePipDependency(pkg) {
    return new Promise((resolve, reject) => {
      const process = spawn('pip', ['uninstall', pkg, '-y'], { cwd: this.projectRoot })
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
          package: pkg,
          output,
          error: code !== 0 ? error : null,
          manager: 'pip'
        })
      })
    })
  }

  async pinNpmDependencies() {
    return new Promise((resolve, reject) => {
      const process = spawn('npm', ['install'], { cwd: this.projectRoot })
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
          error: code !== 0 ? error : null,
          manager: 'npm',
          lockfile: 'package-lock.json'
        })
      })
    })
  }

  async pinPipDependencies() {
    return new Promise((resolve, reject) => {
      const process = spawn('pip', ['freeze'], { cwd: this.projectRoot })
      let output = ''
      let error = ''

      process.stdout.on('data', (data) => {
        output += data.toString()
      })

      process.stderr.on('data', (data) => {
        error += data.toString()
      })

      process.on('close', (code) => {
        if (code === 0) {
          // Write requirements-lock.txt
          const lockfilePath = path.join(this.projectRoot, 'requirements-lock.txt')
          fs.writeFile(lockfilePath, output)
          
          resolve({
            success: true,
            output,
            manager: 'pip',
            lockfile: 'requirements-lock.txt'
          })
        } else {
          resolve({
            success: false,
            error,
            manager: 'pip'
          })
        }
      })
    })
  }
}

module.exports = { DependencyManagement }
