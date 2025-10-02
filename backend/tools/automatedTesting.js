const fs = require('fs-extra')
const path = require('path')
const { spawn } = require('child_process')

class AutomatedTesting {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
  }

  /**
   * Run tests for the project
   * @param {Object} options - Test options
   * @returns {Object} Test results
   */
  async runTests(options = {}) {
    try {
      const {
        testFramework = 'auto',
        testPath = null,
        coverage = false,
        verbose = false
      } = options

      // Detect test framework
      const framework = testFramework === 'auto' ? await this.detectTestFramework() : testFramework

      if (!framework) {
        return {
          success: false,
          error: 'No test framework detected',
          suggestions: [
            'Install a test framework like Jest, Mocha, or pytest',
            'Create test files with appropriate naming conventions',
            'Configure test scripts in package.json or setup files'
          ]
        }
      }

      // Run tests based on framework
      let result
      switch (framework) {
        case 'jest':
          result = await this.runJestTests({ testPath, coverage, verbose })
          break
        case 'mocha':
          result = await this.runMochaTests({ testPath, coverage, verbose })
          break
        case 'pytest':
          result = await this.runPytestTests({ testPath, coverage, verbose })
          break
        case 'npm':
          result = await this.runNpmTests({ testPath, verbose })
          break
        default:
          result = await this.runGenericTests({ testPath, verbose })
      }

      return {
        success: true,
        framework,
        ...result
      }
    } catch (error) {
      throw new Error(`Test execution failed: ${error.message}`)
    }
  }

  /**
   * Run linting for the project
   * @param {Object} options - Lint options
   * @returns {Object} Lint results
   */
  async runLinting(options = {}) {
    try {
      const {
        linter = 'auto',
        fix = false,
        files = null
      } = options

      // Detect linter
      const detectedLinter = linter === 'auto' ? await this.detectLinter() : linter

      if (!detectedLinter) {
        return {
          success: false,
          error: 'No linter detected',
          suggestions: [
            'Install a linter like ESLint, Prettier, or flake8',
            'Configure linting rules in appropriate config files',
            'Add lint scripts to package.json or setup files'
          ]
        }
      }

      // Run linter based on type
      let result
      switch (detectedLinter) {
        case 'eslint':
          result = await this.runESLint({ fix, files })
          break
        case 'prettier':
          result = await this.runPrettier({ fix, files })
          break
        case 'flake8':
          result = await this.runFlake8({ files })
          break
        case 'black':
          result = await this.runBlack({ fix, files })
          break
        default:
          result = await this.runGenericLinter({ linter: detectedLinter, fix, files })
      }

      return {
        success: true,
        linter: detectedLinter,
        ...result
      }
    } catch (error) {
      throw new Error(`Linting failed: ${error.message}`)
    }
  }

  /**
   * Run build process
   * @param {Object} options - Build options
   * @returns {Object} Build results
   */
  async runBuild(options = {}) {
    try {
      const {
        buildCommand = 'auto',
        environment = 'production'
      } = options

      // Detect build command
      const command = buildCommand === 'auto' ? await this.detectBuildCommand() : buildCommand

      if (!command) {
        return {
          success: false,
          error: 'No build command detected',
          suggestions: [
            'Add build scripts to package.json',
            'Create build configuration files',
            'Set up build tools like Webpack, Vite, or Make'
          ]
        }
      }

      // Run build command
      const result = await this.executeCommand(command, { cwd: this.projectRoot })

      return {
        success: result.exitCode === 0,
        command,
        ...result
      }
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`)
    }
  }

  /**
   * Run type checking
   * @param {Object} options - Type check options
   * @returns {Object} Type check results
   */
  async runTypeCheck(options = {}) {
    try {
      const {
        typeChecker = 'auto',
        files = null
      } = options

      // Detect type checker
      const checker = typeChecker === 'auto' ? await this.detectTypeChecker() : typeChecker

      if (!checker) {
        return {
          success: false,
          error: 'No type checker detected',
          suggestions: [
            'Install TypeScript for JavaScript/TypeScript projects',
            'Install mypy for Python projects',
            'Configure type checking in your build process'
          ]
        }
      }

      // Run type checker
      let result
      switch (checker) {
        case 'typescript':
          result = await this.runTypeScriptCheck({ files })
          break
        case 'mypy':
          result = await this.runMypyCheck({ files })
          break
        default:
          result = await this.runGenericTypeCheck({ checker, files })
      }

      return {
        success: result.exitCode === 0,
        checker,
        ...result
      }
    } catch (error) {
      throw new Error(`Type checking failed: ${error.message}`)
    }
  }

  // Framework detection methods

  async detectTestFramework() {
    try {
      // Check package.json for test scripts
      const packageJsonPath = path.join(this.projectRoot, 'package.json')
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
        
        if (packageJson.devDependencies) {
          if (packageJson.devDependencies.jest) return 'jest'
          if (packageJson.devDependencies.mocha) return 'mocha'
        }
        
        if (packageJson.scripts && packageJson.scripts.test) {
          return 'npm'
        }
      }

      // Check for Python test files
      const pythonTestFiles = await this.findFiles(['test_*.py', '*_test.py'])
      if (pythonTestFiles.length > 0) {
        return 'pytest'
      }

      // Check for Jest config
      const jestConfigs = ['jest.config.js', 'jest.config.json', 'jest.config.ts']
      for (const config of jestConfigs) {
        if (await fs.pathExists(path.join(this.projectRoot, config))) {
          return 'jest'
        }
      }

      // Check for Mocha config
      const mochaConfigs = ['.mocharc.js', '.mocharc.json', 'mocha.opts']
      for (const config of mochaConfigs) {
        if (await fs.pathExists(path.join(this.projectRoot, config))) {
          return 'mocha'
        }
      }

      return null
    } catch (error) {
      return null
    }
  }

  async detectLinter() {
    try {
      // Check package.json for linter dependencies
      const packageJsonPath = path.join(this.projectRoot, 'package.json')
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
        
        if (packageJson.devDependencies) {
          if (packageJson.devDependencies.eslint) return 'eslint'
          if (packageJson.devDependencies.prettier) return 'prettier'
        }
      }

      // Check for Python linters
      const requirementsPath = path.join(this.projectRoot, 'requirements.txt')
      if (await fs.pathExists(requirementsPath)) {
        const requirements = await fs.readFile(requirementsPath, 'utf-8')
        if (requirements.includes('flake8')) return 'flake8'
        if (requirements.includes('black')) return 'black'
      }

      // Check for config files
      const eslintConfigs = ['.eslintrc.js', '.eslintrc.json', '.eslintrc.yml']
      for (const config of eslintConfigs) {
        if (await fs.pathExists(path.join(this.projectRoot, config))) {
          return 'eslint'
        }
      }

      const prettierConfigs = ['.prettierrc', '.prettierrc.js', '.prettierrc.json']
      for (const config of prettierConfigs) {
        if (await fs.pathExists(path.join(this.projectRoot, config))) {
          return 'prettier'
        }
      }

      return null
    } catch (error) {
      return null
    }
  }

  async detectBuildCommand() {
    try {
      // Check package.json for build scripts
      const packageJsonPath = path.join(this.projectRoot, 'package.json')
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
        
        if (packageJson.scripts) {
          if (packageJson.scripts.build) return 'npm run build'
          if (packageJson.scripts['build:prod']) return 'npm run build:prod'
        }
      }

      // Check for Makefile
      if (await fs.pathExists(path.join(this.projectRoot, 'Makefile'))) {
        return 'make'
      }

      // Check for build tools
      const buildConfigs = ['webpack.config.js', 'vite.config.js', 'rollup.config.js']
      for (const config of buildConfigs) {
        if (await fs.pathExists(path.join(this.projectRoot, config))) {
          return 'npm run build'
        }
      }

      return null
    } catch (error) {
      return null
    }
  }

  async detectTypeChecker() {
    try {
      // Check for TypeScript
      const packageJsonPath = path.join(this.projectRoot, 'package.json')
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
        
        if (packageJson.devDependencies && packageJson.devDependencies.typescript) {
          return 'typescript'
        }
      }

      // Check for Python type checking
      const requirementsPath = path.join(this.projectRoot, 'requirements.txt')
      if (await fs.pathExists(requirementsPath)) {
        const requirements = await fs.readFile(requirementsPath, 'utf-8')
        if (requirements.includes('mypy')) return 'mypy'
      }

      // Check for TypeScript files
      const tsFiles = await this.findFiles(['*.ts', '*.tsx'])
      if (tsFiles.length > 0) {
        return 'typescript'
      }

      return null
    } catch (error) {
      return null
    }
  }

  // Test execution methods

  async runJestTests(options) {
    const args = ['test']
    if (options.testPath) args.push(options.testPath)
    if (options.coverage) args.push('--coverage')
    if (options.verbose) args.push('--verbose')
    
    return await this.executeCommand('npx', ['jest', ...args])
  }

  async runMochaTests(options) {
    const args = []
    if (options.testPath) args.push(options.testPath)
    if (options.verbose) args.push('--reporter', 'spec')
    
    return await this.executeCommand('npx', ['mocha', ...args])
  }

  async runPytestTests(options) {
    const args = []
    if (options.testPath) args.push(options.testPath)
    if (options.verbose) args.push('-v')
    if (options.coverage) args.push('--cov')
    
    return await this.executeCommand('pytest', args)
  }

  async runNpmTests(options) {
    const args = ['test']
    if (options.verbose) args.push('--verbose')
    
    return await this.executeCommand('npm', args)
  }

  async runGenericTests(options) {
    return await this.executeCommand('npm', ['test'])
  }

  // Linting execution methods

  async runESLint(options) {
    const args = []
    if (options.fix) args.push('--fix')
    if (options.files) args.push(...options.files)
    else args.push('.')
    
    return await this.executeCommand('npx', ['eslint', ...args])
  }

  async runPrettier(options) {
    const args = []
    if (options.fix) args.push('--write')
    else args.push('--check')
    if (options.files) args.push(...options.files)
    else args.push('.')
    
    return await this.executeCommand('npx', ['prettier', ...args])
  }

  async runFlake8(options) {
    const args = []
    if (options.files) args.push(...options.files)
    else args.push('.')
    
    return await this.executeCommand('flake8', args)
  }

  async runBlack(options) {
    const args = []
    if (options.fix) args.push('.')
    else args.push('--check', '.')
    if (options.files) args.push(...options.files)
    
    return await this.executeCommand('black', args)
  }

  async runGenericLinter(options) {
    const args = []
    if (options.fix) args.push('--fix')
    if (options.files) args.push(...options.files)
    
    return await this.executeCommand(options.linter, args)
  }

  // Type checking execution methods

  async runTypeScriptCheck(options) {
    const args = ['--noEmit']
    if (options.files) args.push(...options.files)
    
    return await this.executeCommand('npx', ['tsc', ...args])
  }

  async runMypyCheck(options) {
    const args = []
    if (options.files) args.push(...options.files)
    else args.push('.')
    
    return await this.executeCommand('mypy', args)
  }

  async runGenericTypeCheck(options) {
    return await this.executeCommand(options.checker, options.files || [])
  }

  // Helper methods

  async findFiles(patterns) {
    const files = []
    
    const walkDir = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await walkDir(fullPath)
        } else if (entry.isFile()) {
          for (const pattern of patterns) {
            if (entry.name.match(pattern.replace('*', '.*'))) {
              files.push(fullPath)
              break
            }
          }
        }
      }
    }
    
    await walkDir(this.projectRoot)
    return files
  }

  async executeCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        cwd: options.cwd || this.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      })
      
      let stdout = ''
      let stderr = ''
      
      process.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      
      process.stderr.on('data', (data) => {
        stderr += data.toString()
      })
      
      process.on('close', (code) => {
        resolve({
          exitCode: code,
          stdout,
          stderr,
          success: code === 0
        })
      })
      
      process.on('error', (error) => {
        reject(error)
      })
    })
  }
}

module.exports = { AutomatedTesting }
