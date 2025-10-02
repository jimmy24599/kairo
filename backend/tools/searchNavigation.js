const fs = require('fs-extra')
const path = require('path')

class SearchNavigation {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
  }

  /**
   * Search for text/code across the repository
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Array} Array of search results
   */
  async search_code(query, options = {}) {
    try {
      const {
        caseSensitive = false,
        wholeWord = false,
        regex = false,
        fileExtensions = ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.h', '.css', '.html', '.json', '.md'],
        excludeDirs = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage']
      } = options

      const results = []
      const searchPattern = this.createSearchPattern(query, { caseSensitive, wholeWord, regex })

      await this.searchInDirectory(this.projectRoot, searchPattern, results, {
        fileExtensions,
        excludeDirs,
        caseSensitive
      })

      return {
        query,
        totalResults: results.length,
        results: results
      }
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`)
    }
  }

  /**
   * Find symbol definition (function/class/variable)
   * @param {string} name - Symbol name to find
   * @returns {Array} Array of symbol definitions
   */
  async find_symbol(name) {
    try {
      const results = []
      
      // Search for different symbol patterns
      const patterns = [
        // Function definitions
        new RegExp(`(function\\s+${this.escapeRegex(name)}\\s*\\()`, 'g'),
        new RegExp(`(const\\s+${this.escapeRegex(name)}\\s*=)`, 'g'),
        new RegExp(`(let\\s+${this.escapeRegex(name)}\\s*=)`, 'g'),
        new RegExp(`(var\\s+${this.escapeRegex(name)}\\s*=)`, 'g'),
        new RegExp(`(class\\s+${this.escapeRegex(name)}\\s*[\\{<])`, 'g'),
        new RegExp(`(interface\\s+${this.escapeRegex(name)}\\s*[\\{<])`, 'g'),
        new RegExp(`(type\\s+${this.escapeRegex(name)}\\s*=)`, 'g'),
        new RegExp(`(enum\\s+${this.escapeRegex(name)}\\s*\\{)`, 'g'),
        // Arrow functions
        new RegExp(`(${this.escapeRegex(name)}\\s*:\\s*\\w+\\s*=>)`, 'g'),
        new RegExp(`(${this.escapeRegex(name)}\\s*=\\s*\\()`, 'g'),
        // Method definitions
        new RegExp(`(${this.escapeRegex(name)}\\s*\\([^)]*\\)\\s*\\{)`, 'g'),
        new RegExp(`(${this.escapeRegex(name)}\\s*\\([^)]*\\)\\s*=>)`, 'g')
      ]

      await this.searchSymbolsInDirectory(this.projectRoot, patterns, name, results)

      return {
        symbol: name,
        totalDefinitions: results.length,
        definitions: results
      }
    } catch (error) {
      throw new Error(`Symbol search failed: ${error.message}`)
    }
  }

  /**
   * Get file structure outline (functions, classes, imports)
   * @param {string} filePath - File path to analyze
   * @returns {Object} File outline structure
   */
  async get_outline(filePath) {
    try {
      const fullPath = path.join(this.projectRoot, filePath)
      
      // Check if it's a directory
      const stats = await fs.stat(fullPath)
      if (stats.isDirectory()) {
        throw new Error(`Cannot get outline for directory: ${filePath}. Use list_files instead.`)
      }
      
      const content = await fs.readFile(fullPath, 'utf-8')
      
      const outline = {
        file: filePath,
        imports: [],
        exports: [],
        functions: [],
        classes: [],
        interfaces: [],
        types: [],
        variables: [],
        constants: []
      }

      const lines = content.split('\n')
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        const lineNumber = i + 1

        // Imports
        if (line.startsWith('import ') || line.startsWith('const ') && line.includes('require(')) {
          outline.imports.push({
            line: lineNumber,
            content: line
          })
        }

        // Exports
        if (line.startsWith('export ')) {
          outline.exports.push({
            line: lineNumber,
            content: line
          })
        }

        // Function definitions
        const functionMatch = line.match(/^(export\s+)?(async\s+)?function\s+(\w+)/)
        if (functionMatch) {
          outline.functions.push({
            name: functionMatch[3],
            line: lineNumber,
            type: 'function',
            async: !!functionMatch[2],
            exported: !!functionMatch[1]
          })
        }

        // Arrow functions
        const arrowFunctionMatch = line.match(/^(export\s+)?(const|let|var)\s+(\w+)\s*=\s*(async\s+)?\(/)
        if (arrowFunctionMatch) {
          outline.functions.push({
            name: arrowFunctionMatch[3],
            line: lineNumber,
            type: 'arrow_function',
            async: !!arrowFunctionMatch[4],
            exported: !!arrowFunctionMatch[1]
          })
        }

        // Class definitions
        const classMatch = line.match(/^(export\s+)?class\s+(\w+)/)
        if (classMatch) {
          outline.classes.push({
            name: classMatch[2],
            line: lineNumber,
            exported: !!classMatch[1]
          })
        }

        // Interface definitions
        const interfaceMatch = line.match(/^(export\s+)?interface\s+(\w+)/)
        if (interfaceMatch) {
          outline.interfaces.push({
            name: interfaceMatch[2],
            line: lineNumber,
            exported: !!interfaceMatch[1]
          })
        }

        // Type definitions
        const typeMatch = line.match(/^(export\s+)?type\s+(\w+)/)
        if (typeMatch) {
          outline.types.push({
            name: typeMatch[2],
            line: lineNumber,
            exported: !!typeMatch[1]
          })
        }

        // Variable declarations
        const varMatch = line.match(/^(export\s+)?(const|let|var)\s+(\w+)/)
        if (varMatch && !line.includes('=') || line.includes('=') && !line.includes('(')) {
          const category = varMatch[2] === 'const' ? 'constants' : 'variables'
          outline[category].push({
            name: varMatch[3],
            line: lineNumber,
            type: varMatch[2],
            exported: !!varMatch[1]
          })
        }
      }

      return outline
    } catch (error) {
      throw new Error(`Failed to get outline for ${filePath}: ${error.message}`)
    }
  }

  /**
   * Find all references/usages of a symbol
   * @param {string} symbol - Symbol name to find references for
   * @returns {Array} Array of symbol references
   */
  async find_references(symbol) {
    try {
      const results = []
      
      // Create search pattern for symbol usage
      const usagePattern = new RegExp(`\\b${this.escapeRegex(symbol)}\\b`, 'g')
      
      await this.searchReferencesInDirectory(this.projectRoot, usagePattern, symbol, results)

      return {
        symbol,
        totalReferences: results.length,
        references: results
      }
    } catch (error) {
      throw new Error(`Reference search failed: ${error.message}`)
    }
  }

  // Helper methods

  createSearchPattern(query, options) {
    const { caseSensitive, wholeWord, regex } = options
    
    if (regex) {
      return new RegExp(query, caseSensitive ? 'g' : 'gi')
    }
    
    const escapedQuery = this.escapeRegex(query)
    const pattern = wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery
    
    return new RegExp(pattern, caseSensitive ? 'g' : 'gi')
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  async searchInDirectory(dirPath, pattern, results, options) {
    const { fileExtensions, excludeDirs, caseSensitive } = options
    
    try {
      const items = await fs.readdir(dirPath)
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item)
        const relativePath = path.relative(this.projectRoot, itemPath)
        const stat = await fs.stat(itemPath)
        
        if (stat.isDirectory()) {
          if (!excludeDirs.includes(item)) {
            await this.searchInDirectory(itemPath, pattern, results, options)
          }
        } else {
          const ext = path.extname(item)
          if (fileExtensions.includes(ext)) {
            await this.searchInFile(itemPath, relativePath, pattern, results, caseSensitive)
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  async searchInFile(filePath, relativePath, pattern, results, caseSensitive) {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const lines = content.split('\n')
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const matches = [...line.matchAll(pattern)]
        
        for (const match of matches) {
          results.push({
            file: relativePath,
            line: i + 1,
            column: match.index + 1,
            content: line.trim(),
            match: match[0]
          })
        }
      }
    } catch (error) {
      // Skip files we can't read
    }
  }

  async searchSymbolsInDirectory(dirPath, patterns, symbolName, results) {
    try {
      const items = await fs.readdir(dirPath)
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item)
        const relativePath = path.relative(this.projectRoot, itemPath)
        const stat = await fs.stat(itemPath)
        
        if (stat.isDirectory()) {
          if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
            await this.searchSymbolsInDirectory(itemPath, patterns, symbolName, results)
          }
        } else {
          const ext = path.extname(item)
          if (['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.h'].includes(ext)) {
            await this.searchSymbolsInFile(itemPath, relativePath, patterns, symbolName, results)
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  async searchSymbolsInFile(filePath, relativePath, patterns, symbolName, results) {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const lines = content.split('\n')
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        for (const pattern of patterns) {
          const matches = [...line.matchAll(pattern)]
          
          for (const match of matches) {
            results.push({
              file: relativePath,
              line: i + 1,
              column: match.index + 1,
              content: line.trim(),
              type: this.getSymbolType(line, symbolName)
            })
          }
        }
      }
    } catch (error) {
      // Skip files we can't read
    }
  }

  async searchReferencesInDirectory(dirPath, pattern, symbolName, results) {
    try {
      const items = await fs.readdir(dirPath)
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item)
        const relativePath = path.relative(this.projectRoot, itemPath)
        const stat = await fs.stat(itemPath)
        
        if (stat.isDirectory()) {
          if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
            await this.searchReferencesInDirectory(itemPath, pattern, symbolName, results)
          }
        } else {
          const ext = path.extname(item)
          if (['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.h'].includes(ext)) {
            await this.searchReferencesInFile(itemPath, relativePath, pattern, symbolName, results)
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  async searchReferencesInFile(filePath, relativePath, pattern, symbolName, results) {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const lines = content.split('\n')
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const matches = [...line.matchAll(pattern)]
        
        for (const match of matches) {
          // Skip if this is a definition (not a reference)
          if (!this.isDefinition(line, symbolName)) {
            results.push({
              file: relativePath,
              line: i + 1,
              column: match.index + 1,
              content: line.trim(),
              type: this.getReferenceType(line, symbolName)
            })
          }
        }
      }
    } catch (error) {
      // Skip files we can't read
    }
  }

  getSymbolType(line, symbolName) {
    if (line.includes('function ' + symbolName)) return 'function'
    if (line.includes('class ' + symbolName)) return 'class'
    if (line.includes('interface ' + symbolName)) return 'interface'
    if (line.includes('type ' + symbolName)) return 'type'
    if (line.includes('enum ' + symbolName)) return 'enum'
    if (line.includes('const ' + symbolName)) return 'const'
    if (line.includes('let ' + symbolName)) return 'let'
    if (line.includes('var ' + symbolName)) return 'var'
    return 'unknown'
  }

  getReferenceType(line, symbolName) {
    if (line.includes(symbolName + '(')) return 'function_call'
    if (line.includes('.' + symbolName)) return 'property_access'
    if (line.includes('import') && line.includes(symbolName)) return 'import'
    if (line.includes('export') && line.includes(symbolName)) return 'export'
    return 'reference'
  }

  isDefinition(line, symbolName) {
    const definitionPatterns = [
      new RegExp(`(function\\s+${this.escapeRegex(symbolName)}\\s*\\()`),
      new RegExp(`(class\\s+${this.escapeRegex(symbolName)}\\s*[\\{<])`),
      new RegExp(`(interface\\s+${this.escapeRegex(symbolName)}\\s*[\\{<])`),
      new RegExp(`(type\\s+${this.escapeRegex(symbolName)}\\s*=)`),
      new RegExp(`(enum\\s+${this.escapeRegex(symbolName)}\\s*\\{)`),
      new RegExp(`(const\\s+${this.escapeRegex(symbolName)}\\s*=)`),
      new RegExp(`(let\\s+${this.escapeRegex(symbolName)}\\s*=)`),
      new RegExp(`(var\\s+${this.escapeRegex(symbolName)}\\s*=)`)
    ]
    
    return definitionPatterns.some(pattern => pattern.test(line))
  }
}

module.exports = { SearchNavigation }
