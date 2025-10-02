const fs = require('fs-extra')
const path = require('path')
const { spawn } = require('child_process')
const recast = require('recast')
const babelParser = require('@babel/parser')
const t = require('@babel/types')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const fg = require('fast-glob')
const os = require('os')
let Diff
try { Diff = require('diff') } catch (_) { Diff = null }
// Type-aware refactoring engine for JS/TS
let tsMorph
try {
  // Lazy load to avoid requiring in environments/projects that don't need it
  tsMorph = require('ts-morph')
} catch (_) {
  tsMorph = null
}

class ASTRefactoring {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
    this._tsProject = null
    this._defaultOptions = {
      dryRun: false,
      includeGlobs: ['**/*.{ts,tsx,js,jsx}'],
      excludeGlobs: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**'],
      tsconfigPath: null,
      printer: 'recast',
      concurrency: Math.max(1, (os.cpus()?.length || 2) - 1),
      backupDir: null
    }
  }

  /**
   * Parse AST for a file
   * @param {string} filePath - Path to the file
   * @returns {Object} AST representation
   */
  async parse_ast(filePath) {
    try {
      const fullPath = path.resolve(this.projectRoot, filePath)
      
      if (!await fs.pathExists(fullPath)) {
        throw new Error(`File not found: ${filePath}`)
      }

      const content = await fs.readFile(fullPath, 'utf-8')
      const language = this.detectLanguage(filePath)
      
      if (language === 'javascript' || language === 'typescript') {
        return await this.parseJavaScriptAST(content, filePath)
      } else if (language === 'python') {
        return await this.parsePythonAST(content, filePath)
      } else {
        return {
          error: `AST parsing not supported for ${language}`,
          language,
          filePath
        }
      }
    } catch (error) {
      throw new Error(`Failed to parse AST for ${filePath}: ${error.message}`)
    }
  }

  /**
   * Perform AST-safe edits
   * @param {string} filePath - Path to the file
   * @param {Array} edits - Array of AST edit operations
   * @returns {Object} Edit result
   */
  async ast_edit(filePath, edits) {
    try {
      const fullPath = path.resolve(this.projectRoot, filePath)
      
      if (!await fs.pathExists(fullPath)) {
        throw new Error(`File not found: ${filePath}`)
      }

      const content = await fs.readFile(fullPath, 'utf-8')
      const language = this.detectLanguage(filePath)

      // Normalize edits: allow simple parameter objects (e.g., { import: '...', insert: '...' })
      if (!Array.isArray(edits)) {
        const params = edits || {}
        const derived = []
        if (typeof params.import === 'string' && params.import.trim()) {
          derived.push({ type: 'addImportFromString', value: params.import.trim() })
        }
        if (typeof params.insert === 'string' && params.insert.trim()) {
          derived.push({ type: 'insertAfterImports', content: params.insert })
        }
        if (derived.length === 0) {
          throw new Error('Invalid edits: expected an array of edit operations or an object with keys like { import, insert }.')
        }
        edits = derived
      }
      
      let result
      if (language === 'javascript' || language === 'typescript') {
        result = await this.applyJavaScriptEdits(content, edits, filePath)
      } else if (language === 'python') {
        result = await this.applyPythonEdits(content, edits, filePath)
      } else {
        throw new Error(`AST editing not supported for ${language}`)
      }

      // Write the modified content back
      if (result.success) {
        await fs.writeFile(fullPath, result.content)
      }

      return result
    } catch (error) {
      throw new Error(`Failed to apply AST edits to ${filePath}: ${error.message}`)
    }
  }

  /**
   * Safe rename across files (update imports/refs)
   * @param {string} oldName - Old symbol name
   * @param {string} newName - New symbol name
   * @returns {Object} Refactoring result
   */
  async refactor_symbol(oldName, newName, options = {}) {
    try {
      const opts = this._resolveOptions(options)
      // Prefer ts-morph based rename when available for correctness
      if (await this._ensureTsProject(opts)) {
        const results = await this._renameWithTsMorph(oldName, newName, opts)
        return results
      }
      // Fallback to naive per-file replace
      const files = await this._globFiles(opts)
      const results = []
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8')
        const before = content
        const result = await this.renameSymbolInFile(file, oldName, newName)
        if (opts.dryRun) {
          const after = await fs.readFile(file, 'utf-8')
          // revert if dry-run
          await fs.writeFile(file, before)
          const diff = this._fileDiff(before, after, file)
          results.push({ file, success: true, dryRun: true, diff })
        } else {
          results.push({ file, success: result.success, changes: result.changes, error: result.error })
        }
      }
      return { success: results.every(r => r.success), oldName, newName, filesAffected: results.length, results }
    } catch (error) {
      throw new Error(`Failed to refactor symbol ${oldName}: ${error.message}`)
    }
  }

  /**
   * Extract code block to function
   * @param {string} filePath - Path to the file
   * @param {Array} range - [start, end] line numbers
   * @param {string} name - Function name
   * @returns {Object} Extraction result
   */
  async extract_method(filePath, range, name, options = {}) {
    try {
      const opts = this._resolveOptions(options)
      // Use TS Language Service refactor when available to extract to function
      const projectAvailable = await this._ensureTsProject(opts)
      if (projectAvailable) {
        const result = await this._extractWithLanguageService(filePath, range, name, opts)
        return result
      }
      // Fallback naive extraction (no type-awareness)
      const fullPath = path.resolve(this.projectRoot, filePath)
      const content = await fs.readFile(fullPath, 'utf-8')
      const lines = content.split('\n')
      const [start, end] = range
      const extractedCode = lines.slice(start - 1, end).join('\n')
      const signature = this.generateFunctionSignature(extractedCode, name)
      const newFunction = `${signature} {\n${this.indentCode(extractedCode, 2)}\n}`
      const functionCall = this.generateFunctionCall(name, extractedCode)
      const newLines = [ ...lines.slice(0, start - 1), functionCall, ...lines.slice(end) ]
      newLines.push('', newFunction)
      await fs.writeFile(fullPath, newLines.join('\n'))
      if (opts.dryRun) {
        // no-op revert
        await fs.writeFile(fullPath, content)
        return { success: true, dryRun: true }
      }
      return { success: true, extractedCode, newFunction, functionCall, linesExtracted: end - start + 1 }
    } catch (error) {
      throw new Error(`Failed to extract method from ${filePath}: ${error.message}`)
    }
  }

  /**
   * Inline a function
   * @param {string} filePath - Path to the file
   * @param {string} symbol - Function symbol to inline
   * @returns {Object} Inlining result
   */
  async inline_function(filePath, symbol) {
    try {
      const fullPath = path.resolve(this.projectRoot, filePath)
      const content = await fs.readFile(fullPath, 'utf-8')
      
      // Find the function definition
      const functionDef = await this.findFunctionDefinition(content, symbol)
      if (!functionDef) {
        throw new Error(`Function ${symbol} not found`)
      }
      
      // Find all calls to this function
      const calls = await this.findFunctionCalls(content, symbol)
      
      // Replace each call with the function body
      let newContent = content
      for (const call of calls) {
        const inlinedCode = this.inlineFunctionCall(functionDef, call)
        newContent = newContent.replace(call.match, inlinedCode)
      }
      
      // Remove the function definition
      newContent = newContent.replace(functionDef.match, '')
      
      await fs.writeFile(fullPath, newContent)
      
      return {
        success: true,
        functionName: symbol,
        callsInlined: calls.length,
        functionBody: functionDef.body
      }
    } catch (error) {
      throw new Error(`Failed to inline function ${symbol} in ${filePath}: ${error.message}`)
    }
  }

  /**
   * Change function signature
   * @param {string} filePath - Path to the file
   * @param {string} symbol - Function symbol
   * @param {Object} newSig - New signature
   * @returns {Object} Signature change result
   */
  async change_function_signature(filePath, symbol, newSig, options = {}) {
    try {
      const opts = this._resolveOptions(options)
      const projectAvailable = await this._ensureTsProject(opts)
      if (projectAvailable) {
        const result = await this._changeSignatureWithLanguageService(filePath, symbol, newSig, opts)
        return result
      }
      // Fallback best-effort textual change
      const fullPath = path.resolve(this.projectRoot, filePath)
      const content = await fs.readFile(fullPath, 'utf-8')
      const functionDef = await this.findFunctionDefinition(content, symbol)
      if (!functionDef) throw new Error(`Function ${symbol} not found`)
      const newSignature = this.buildFunctionSignature(symbol, newSig)
      const updatedContent = content.replace(functionDef.signature, newSignature)
      if (opts.dryRun) {
        const diff = this._fileDiff(content, updatedContent, fullPath)
        return { success: true, dryRun: true, file: fullPath, diff }
      }
      await fs.writeFile(fullPath, updatedContent)
      return { success: true, functionName: symbol, oldSignature: functionDef.signature, newSignature, callsUpdated: 0 }
    } catch (error) {
      throw new Error(`Failed to change signature for ${symbol} in ${filePath}: ${error.message}`)
    }
  }

  /**
   * Apply codemod script
   * @param {string} script - Codemod script content
   * @param {Array} paths - Optional file paths to apply to
   * @returns {Object} Codemod result
   */
  async apply_codemod(script, paths = [], options = {}) {
    try {
      const opts = this._resolveOptions(options)
      // Standardize codemods using jscodeshift for parallelism, globs, and dry runs
      const codemodPath = path.join(this.projectRoot, '.temp-codemod.js')
      await fs.writeFile(codemodPath, script)
      const targetPaths = paths.length > 0 ? paths : await this._globFiles(opts)
      const targetsArg = targetPaths.length > 0 ? targetPaths : [this.projectRoot]
      const result = await this._runJscodeshift(codemodPath, targetsArg, { dry: opts.dryRun, cpUs: opts.concurrency })
      await fs.remove(codemodPath)
      return result
    } catch (error) {
      throw new Error(`Failed to apply codemod: ${error.message}`)
    }
  }

  /**
   * Fix/optimize imports across project
   * @param {string} filePath - Optional specific file path
   * @returns {Object} Import optimization result
   */
  async update_imports(filePath = null, options = {}) {
    try {
      const opts = this._resolveOptions(options)
      const files = filePath ? [filePath] : await this._globFiles(opts)
      const results = []
      
      if (await this._ensureTsProject(opts)) {
        // Organize imports via ts language service for correctness
        const project = this._tsProject
        const tasks = files.map(f => async () => {
          try {
            const sf = project.getSourceFile(f) || project.addSourceFileAtPathIfExists(f)
            if (!sf) return { file: f, success: false, error: 'Not a source file' }
            const before = sf.getFullText()
            const edits = project.getLanguageService().organizeImports({ type: 'file', fileName: sf.getFilePath() }, {}, {})
            await this._applyTsTextChanges({ edits })
            const after = await fs.readFile(f, 'utf-8')
            // Optional Babel pass to merge duplicates
            const dedup = await this._mergeDuplicateImports(after, opts)
            if (dedup.changed) {
              if (!opts.dryRun) await fs.writeFile(f, dedup.code, 'utf-8')
            }
            if (opts.dryRun) {
              // revert
              await fs.writeFile(f, before, 'utf-8')
              const diff = this._fileDiff(before, dedup.changed ? dedup.code : after, f)
              return { file: f, success: true, dryRun: true, diff }
            }
            return { file: f, success: true }
          } catch (e) {
            return { file: f, success: false, error: e.message }
          }
        })
        const parallel = await this._runWithConcurrency(tasks, opts.concurrency)
        results.push(...parallel)
      } else {
        for (const file of files) {
          try {
            const before = await fs.readFile(file, 'utf-8')
            const result = await this.optimizeImportsInFile(file)
            if (opts.dryRun) {
              const after = await fs.readFile(file, 'utf-8')
              await fs.writeFile(file, before, 'utf-8')
              const diff = this._fileDiff(before, after, file)
              results.push({ file, success: true, dryRun: true, diff })
            } else {
              results.push({ file, success: result.success, changes: result.changes, error: result.error })
            }
          } catch (error) {
            results.push({ file, success: false, error: error.message })
          }
        }
      }
      
      return {
        success: results.some(r => r.success),
        filesProcessed: results.length,
        results
      }
    } catch (error) {
      throw new Error(`Failed to update imports: ${error.message}`)
    }
  }

  // Helper methods

  async _runWithConcurrency(tasks, concurrency = 4) {
    const results = []
    for (let i = 0; i < tasks.length; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency)
      const batchResults = await Promise.all(batch)
      results.push(...batchResults)
    }
    return results
  }

  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase()
    const languageMap = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.pyx': 'python'
    }
    return languageMap[ext] || 'unknown'
  }

  async parseJavaScriptAST(content, filePath) {
    try {
      const ast = this.parseJavaScriptContent(content)
      return {
        success: true,
        language: 'javascript',
        filePath,
        ast,
        nodeCount: this.countNodes(ast)
      }
    } catch (error) {
      return {
        success: false,
        language: 'javascript',
        filePath,
        error: error.message
      }
    }
  }

  async parsePythonAST(content, filePath) {
    try {
      // Use Python's ast module via subprocess
      const result = await this.runPythonAST(content)
      return {
        success: true,
        language: 'python',
        filePath,
        ast: result.ast,
        nodeCount: result.nodeCount
      }
    } catch (error) {
      return {
        success: false,
        language: 'python',
        filePath,
        error: error.message
      }
    }
  }

  parseJavaScriptContent(content) {
    return recast.parse(content, {
      parser: {
        parse(source) {
          return babelParser.parse(source, {
            sourceType: 'module',
            plugins: [
              'jsx',
              'typescript',
              'classProperties',
              ['decorators', { decoratorsBeforeExport: true }],
              'dynamicImport',
              'exportDefaultFrom',
              'exportNamespaceFrom',
              'topLevelAwait'
            ]
          })
        }
      }
    })
  }

  async runPythonAST(content) {
    return new Promise((resolve, reject) => {
      const script = `
import ast
import json
import sys

try:
    tree = ast.parse(sys.stdin.read())
    result = {
        'ast': ast.dump(tree, indent=2),
        'nodeCount': len(list(ast.walk(tree)))
    }
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'error': str(e)}))
`
      
      const process = spawn('python3', ['-c', script])
      let output = ''
      let error = ''
      
      process.stdin.write(content)
      process.stdin.end()
      
      process.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      process.stderr.on('data', (data) => {
        error += data.toString()
      })
      
      process.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output)
            if (result.error) {
              reject(new Error(result.error))
            } else {
              resolve(result)
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse Python AST: ${parseError.message}`))
          }
        } else {
          reject(new Error(`Python AST parsing failed: ${error}`))
        }
      })
    })
  }

  countNodes(ast) {
    let count = 0
    const countRecursive = (node) => {
      count++
      if (node.body && Array.isArray(node.body)) {
        node.body.forEach(countRecursive)
      }
    }
    countRecursive(ast)
    return count
  }

  async applyJavaScriptEdits(content, edits, filePath) {
    if (!Array.isArray(edits)) {
      throw new Error('edits must be an array of operations')
    }

    const ast = this.parseJavaScriptContent(content)
    const b = recast.types.builders

    const addImportFromString = (program, importLine) => {
      // naive parse of import line
      // e.g. "import ContactForm from '../components/ContactForm';"
      const m = importLine.match(/^import\s+([^;]+)\s+from\s+['\"]([^'\"]+)['\"];?$/)
      if (!m) return false
      const spec = m[1].trim()
      const source = m[2]
      const specifiers = []
      // default import
      const defaultMatch = spec.match(/^([A-Za-z_$][\w$]*)\s*(,\s*{(.+)}\s*)?$/)
      if (defaultMatch) {
        const defaultName = defaultMatch[1]
        specifiers.push(b.importDefaultSpecifier(b.identifier(defaultName)))
        const namedGroup = defaultMatch[3]
        if (namedGroup) {
          namedGroup.split(',').map(s => s.trim()).filter(Boolean).forEach(n => {
            const [imported, local] = n.includes(' as ')
              ? n.split(/\s+as\s+/).map(x => x.trim())
              : [n, n]
            specifiers.push(b.importSpecifier(b.identifier(imported), b.identifier(local)))
          })
        }
      } else if (spec.startsWith('{')) {
        const names = spec.replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean)
        names.forEach(n => {
          const [imported, local] = n.includes(' as ')
            ? n.split(/\s+as\s+/).map(x => x.trim())
            : [n, n]
          specifiers.push(b.importSpecifier(b.identifier(imported), b.identifier(local)))
        })
      }
      const decl = b.importDeclaration(specifiers, b.stringLiteral(source))
      program.body.unshift(decl)
      return true
    }

    const insertAfterImports = (program, code) => {
      const printed = typeof code === 'string' ? code : ''
      const insertion = recast.parse('\n' + printed + '\n', {
        parser: { parse: (src) => babelParser.parse(src, { sourceType: 'module', plugins: ['jsx', 'typescript'] }) }
      })
      // find first non-import index
      let idx = 0
      while (idx < program.body.length && program.body[idx].type === 'ImportDeclaration') idx++
      program.body.splice(idx, 0, ...insertion.program.body)
      return true
    }

    const program = ast.program || ast

    for (const edit of edits) {
      switch (edit.type) {
        case 'addImportFromString':
          if (!addImportFromString(program, edit.value)) {
            throw new Error('Failed to parse import string for addImportFromString')
          }
          break
        case 'addImport': {
          const { defaultImport, named = [], source } = edit
          if (!source) throw new Error('addImport requires source')
          const specifiers = []
          if (defaultImport) specifiers.push(t.importDefaultSpecifier(t.identifier(defaultImport)))
          named.forEach(n => specifiers.push(t.importSpecifier(t.identifier(n), t.identifier(n))))
          program.body.unshift(t.importDeclaration(specifiers, t.stringLiteral(source)))
          break
        }
        case 'insertAfterImports':
          insertAfterImports(program, edit.content || '')
          break
        case 'replaceText': {
          // Fallback textual replace
          const before = recast.print(ast).code
          const search = edit.search
          const replace = edit.replace
          if (typeof search !== 'string' || typeof replace !== 'string') {
            throw new Error('replaceText requires string search and replace')
          }
          const updated = before.replace(search, replace)
          // reparse to keep AST valid
          const nextAst = this.parseJavaScriptContent(updated)
          ast.program = nextAst.program
          break
        }
        default:
          throw new Error(`Unknown edit type: ${edit.type}`)
      }
    }

    const newContent = recast.print(ast, { quote: 'single' }).code
    return { success: true, content: newContent, editsApplied: edits.length }
  }

  async applyPythonEdits(content, edits, filePath) {
    // Use LibCST via a Python subprocess to preserve formatting/comments
    return await this._applyPythonEditsWithLibCST(content, edits, filePath)
  }

  async findFilesWithSymbol(symbol) {
    const files = await this.findJavaScriptFiles()
    const filesWithSymbol = []
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8')
      if (content.includes(symbol)) {
        filesWithSymbol.push(file)
      }
    }
    
    return filesWithSymbol
  }

  async findJavaScriptFiles() {
    const files = []
    const walkDir = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await walkDir(fullPath)
        } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
          files.push(fullPath)
        }
      }
    }
    
    await walkDir(this.projectRoot)
    return files
  }

  async renameSymbolInFile(filePath, oldName, newName) {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const changes = []
      
      // Simple regex-based replacement (in real implementation, use AST)
      const escapedOldName = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`\\b${escapedOldName}\\b`, 'g')
      const newContent = content.replace(regex, (match, offset) => {
        changes.push({
          type: 'rename',
          oldName,
          newName,
          offset,
          line: content.substring(0, offset).split('\n').length
        })
        return newName
      })
      
      if (changes.length > 0) {
        await fs.writeFile(filePath, newContent)
      }
      
      return {
        success: true,
        changes
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  generateFunctionSignature(code, name) {
    // Analyze code to determine parameters
    const variables = this.extractVariables(code)
    const parameters = variables.filter(v => !this.isLocalVariable(v, code))
    
    return `function ${name}(${parameters.join(', ')})`
  }

  generateFunctionCall(name, code) {
    const variables = this.extractVariables(code)
    const parameters = variables.filter(v => !this.isLocalVariable(v, code))
    
    return `${name}(${parameters.join(', ')});`
  }

  extractVariables(code) {
    // Simple variable extraction (in real implementation, use AST)
    const matches = code.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g)
    return [...new Set(matches || [])]
  }

  isLocalVariable(variable, code) {
    // Check if variable is declared locally
    return code.includes(`let ${variable}`) || 
           code.includes(`const ${variable}`) || 
           code.includes(`var ${variable}`)
  }

  indentCode(code, spaces) {
    return code.split('\n').map(line => ' '.repeat(spaces) + line).join('\n')
  }

  async findFunctionDefinition(content, symbol) {
    // Find function definition (simplified)
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.includes(`function ${symbol}`) || line.includes(`const ${symbol} =`)) {
        return {
          match: line,
          signature: line,
          body: this.extractFunctionBody(content, i),
          line: i + 1
        }
      }
    }
    return null
  }

  async findFunctionCalls(content, symbol) {
    const calls = []
    const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escapedSymbol}\\s*\\([^)]*\\)`, 'g')
    let match
    
    while ((match = regex.exec(content)) !== null) {
      calls.push({
        match: match[0],
        offset: match.index,
        line: content.substring(0, match.index).split('\n').length
      })
    }
    
    return calls
  }

  extractFunctionBody(content, startLine) {
    const lines = content.split('\n')
    let braceCount = 0
    let inFunction = false
    const bodyLines = []
    
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i]
      
      if (line.includes('{')) {
        inFunction = true
        braceCount++
      }
      
      if (inFunction) {
        bodyLines.push(line)
        
        if (line.includes('{')) braceCount++
        if (line.includes('}')) braceCount--
        
        if (braceCount === 0) break
      }
    }
    
    return bodyLines.join('\n')
  }

  inlineFunctionCall(functionDef, call) {
    // Extract function body and replace parameters
    const body = functionDef.body
    // This is a simplified implementation
    return body
  }

  buildFunctionSignature(name, signature) {
    const params = signature.parameters ? signature.parameters.join(', ') : ''
    const returnType = signature.returnType ? `: ${signature.returnType}` : ''
    return `function ${name}(${params})${returnType}`
  }

  updateFunctionCall(call, newSig) {
    // Update function call with new parameters
    // This is a simplified implementation
    return call.match
  }

  async runCodemodOnFile(codemodPath, filePath) {
    return new Promise((resolve, reject) => {
      const process = spawn('node', [codemodPath, filePath])
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
          changes: output,
          error: code !== 0 ? error : null
        })
      })
    })
  }

  async optimizeImportsInFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const lines = content.split('\n')
      const importLines = []
      const otherLines = []
      
      // Separate import lines from other code
      for (const line of lines) {
        if (line.trim().startsWith('import ') || line.trim().startsWith('export ')) {
          importLines.push(line)
        } else {
          otherLines.push(line)
        }
      }
      
      // Sort and deduplicate imports
      const optimizedImports = this.optimizeImportList(importLines)
      
      // Reconstruct file
      const newContent = [...optimizedImports, '', ...otherLines].join('\n')
      
      if (newContent !== content) {
        await fs.writeFile(filePath, newContent)
      }
      
      return {
        success: true,
        changes: {
          originalImports: importLines.length,
          optimizedImports: optimizedImports.length,
          removed: importLines.length - optimizedImports.length
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  optimizeImportList(importLines) {
    // Remove duplicates and sort imports
    const uniqueImports = [...new Set(importLines)]
    return uniqueImports.sort()
  }

  // Public: organize imports (alias of update_imports with broader options)
  async organize_imports(options = {}) {
    return await this.update_imports(null, options)
  }

  // Public: find references at a location using TS language service
  async find_references(filePath, position, options = {}) {
    const opts = this._resolveOptions(options)
    if (!(await this._ensureTsProject(opts))) {
      throw new Error('TypeScript project not available')
    }
    const abs = path.resolve(this.projectRoot, filePath)
    const project = this._tsProject
    let sf = project.getSourceFile(abs)
    if (!sf) sf = project.addSourceFileAtPath(abs)
    const text = sf.getFullText()
    let pos
    if (Array.isArray(position)) {
      // [line, column]
      pos = this._getPositionFromLineCol(text, position[0], position[1])
    } else if (typeof position === 'number') {
      pos = position
    } else {
      throw new Error('position must be a number or [line, column] array')
    }
    const ls = project.getLanguageService().compilerObject
    const locations = ls.findRenameLocations(abs, pos, false, false, true) || []
    return locations.map(loc => ({ file: loc.fileName, start: loc.textSpan.start, length: loc.textSpan.length }))
  }

  // Public: move files/folders and update imports across project
  async move_paths(moves, options = {}) {
    const opts = this._resolveOptions(options)
    if (!(await this._ensureTsProject(opts))) {
      throw new Error('TypeScript project not available for move_paths')
    }
    const project = this._tsProject
    // Normalize moves to absolute paths
    const normalized = []
    for (const m of moves) {
      const oldAbs = path.resolve(this.projectRoot, m.oldPath)
      const newAbs = path.resolve(this.projectRoot, m.newPath)
      normalized.push({ oldPath: oldAbs, newPath: newAbs })
    }
    // Collect edits for all moves using TS LS
    const allEdits = { edits: [] }
    const ls = project.getLanguageService().compilerObject
    for (const m of normalized) {
      const edits = ls.getEditsForFileRename(m.oldPath, m.newPath, {}, {})
      if (edits && edits.edits) allEdits.edits.push(...edits.edits)
    }
    // Prepare diffs
    const fileToBeforeAfter = new Map()
    for (const e of allEdits.edits) {
      const abs = e.fileName
      const before = await fs.readFile(abs, 'utf-8').catch(() => '')
      let after = before
      const changes = [...e.textChanges].sort((a, b) => (b.span.start - a.span.start))
      for (const ch of changes) {
        const start = ch.span.start
        const end = ch.span.start + ch.span.length
        after = after.slice(0, start) + ch.newText + after.slice(end)
      }
      fileToBeforeAfter.set(abs, { before, after })
    }

    const diffs = []
    for (const [file, { before, after }] of fileToBeforeAfter.entries()) {
      diffs.push({ file, diff: this._fileDiff(before, after, file) })
    }

    if (opts.dryRun) {
      return { success: true, dryRun: true, diffs, moves: normalized }
    }
    // Backups
    if (opts.backupDir) {
      for (const [file, { before }] of fileToBeforeAfter.entries()) {
        const outPath = path.join(opts.backupDir, path.relative(this.projectRoot, file))
        await fs.ensureDir(path.dirname(outPath))
        await fs.writeFile(outPath, before, 'utf-8')
      }
    }
    // Apply edits
    await this._applyTsTextChanges(allEdits)
    // Move files/folders on disk
    for (const m of normalized) {
      await fs.ensureDir(path.dirname(m.newPath))
      await fs.move(m.oldPath, m.newPath, { overwrite: true })
    }
    await project.save()
    return { success: true, filesUpdated: fileToBeforeAfter.size, moved: normalized.length }
  }

  // Helper: merge duplicate sources within a file using Babel
  async _mergeDuplicateImports(code, options) {
    const ast = babelParser.parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] })
    const sourceToImports = new Map()
    traverse(ast, {
      ImportDeclaration(path) {
        const src = path.node.source.value
        if (!sourceToImports.has(src)) sourceToImports.set(src, [])
        sourceToImports.get(src).push(path)
      }
    })
    let changed = false
    for (const [src, paths] of sourceToImports.entries()) {
      if (paths.length <= 1) continue
      const first = paths[0]
      const specSet = new Map()
      let defaultImported = null
      for (const p of paths) {
        for (const s of p.node.specifiers) {
          if (t.isImportDefaultSpecifier(s)) {
            if (!defaultImported) defaultImported = s.local.name
            else changed = true // duplicate default skip
          } else if (t.isImportSpecifier(s)) {
            const key = `${s.imported.name}::${s.local.name}`
            if (!specSet.has(key)) specSet.set(key, s)
            else changed = true
          }
        }
      }
      // Build merged declaration
      const mergedSpecifiers = []
      if (defaultImported) mergedSpecifiers.push(t.importDefaultSpecifier(t.identifier(defaultImported)))
      for (const s of specSet.values()) {
        mergedSpecifiers.push(t.importSpecifier(t.identifier(s.imported.name), t.identifier(s.local.name)))
      }
      const merged = t.importDeclaration(mergedSpecifiers, t.stringLiteral(src))
      first.replaceWith(merged)
      for (let i = 1; i < paths.length; i++) paths[i].remove()
    }
    if (changed) {
      if (options.printer === 'babel') {
        const out = generate(ast, { retainLines: true }, code)
        return { changed: true, code: out.code }
      }
      const printed = recast.print(ast, { quote: 'single' }).code
      return { changed: true, code: printed }
    }
    return { changed: false, code }
  }

  _resolveOptions(override = {}) {
    return { ...this._defaultOptions, ...(override || {}) }
  }

  async _globFiles(options) {
    const { includeGlobs, excludeGlobs } = options || this._defaultOptions
    const entries = await fg(includeGlobs, { cwd: this.projectRoot, ignore: excludeGlobs, absolute: true })
    return entries
  }

  // =========================
  // TypeScript/JavaScript: ts-morph + TS Language Service helpers
  // =========================
  async _ensureTsProject(options = {}) {
    try {
      if (!tsMorph) return false
      if (this._tsProject) return true
      const tsconfigPath = options.tsconfigPath || (await this._findTsConfig(this.projectRoot))
      if (tsconfigPath) {
        this._tsProject = new tsMorph.Project({ tsConfigFilePath: tsconfigPath })
      } else {
        // Fallback to ad-hoc project adding files manually
        this._tsProject = new tsMorph.Project({ skipAddingFilesFromTsConfig: true })
        this._tsProject.addSourceFilesAtPaths(path.join(this.projectRoot, '**/*.{ts,tsx,js,jsx}'))
        this._tsProject.resolveSourceFileDependencies()
      }
      return true
    } catch (_) {
      return false
    }
  }

  async _findTsConfig(startDir) {
    let dir = startDir
    const root = path.parse(startDir).root
    while (true) {
      const candidate = path.join(dir, 'tsconfig.json')
      if (await fs.pathExists(candidate)) return candidate
      if (dir === root) break
      dir = path.dirname(dir)
    }
    return null
  }

  async _renameWithTsMorph(oldName, newName, options = {}) {
    const project = this._tsProject
    await project.save()
    const sourceFiles = project.getSourceFiles()
    let renameCount = 0
    let declarationNode = null
    for (const sf of sourceFiles) {
      const identifiers = sf.getDescendantsOfKind(tsMorph.SyntaxKind.Identifier)
      for (const id of identifiers) {
        if (id.getText() === oldName) {
          const sym = id.getSymbol() || id.getDefinitions()[0]?.getDeclarationNode()?.getSymbol()
          if (sym && sym.getDeclarations().length > 0) {
            declarationNode = sym.getDeclarations()[0]
            break
          }
        }
      }
      if (declarationNode) break
    }
    if (!declarationNode) {
      // As a fallback, try renaming first identifier occurrence
      for (const sf of sourceFiles) {
        const id = sf.getFirstDescendant(node => node.getText && node.getText() === oldName)
        if (id && id.rename) {
          id.rename(newName)
          renameCount++
        }
      }
    } else {
      // Use rename on declaration to update all references across project
      if (declarationNode.rename) {
        declarationNode.rename(newName)
        renameCount++
      }
    }
    await project.save()
    const changedFiles = project.getSourceFiles().filter(sf => sf.isSaved === false || sf.isDirty?.())
    // Persist changes to disk to ensure non-ts files also reflect updates
    for (const sf of project.getSourceFiles()) {
      if (sf.isSaved === false || sf.isDirty?.()) await sf.save()
    }
    if (options.dryRun) {
      // In dry-run, collect diffs and revert
      const diffs = []
      for (const sf of changedFiles) {
        const file = sf.getFilePath()
        const after = sf.getFullText()
        const before = await fs.readFile(file, 'utf-8').catch(() => '')
        diffs.push({ file, diff: this._fileDiff(before, after, file) })
      }
      // Revert by discarding changes (re-load from disk)
      project.reset()
      await this._ensureTsProject(options)
      return { success: true, dryRun: true, oldName, newName, diffs }
    }
    return { success: renameCount > 0, oldName, newName, filesAffected: changedFiles.length, results: changedFiles.map(sf => ({ file: sf.getFilePath(), success: true })) }
  }

  async _extractWithLanguageService(filePath, range, name, options = {}) {
    const abs = path.resolve(this.projectRoot, filePath)
    const project = this._tsProject
    let sf = project.getSourceFile(abs)
    if (!sf) sf = project.addSourceFileAtPath(abs)
    const text = sf.getFullText()
    const [startLine, endLine] = range
    const startPos = this._getPositionFromLineCol(text, startLine, 1)
    const endPos = this._getPositionFromLineCol(text, endLine, text.length)
    const length = Math.max(0, endPos - startPos)

    // Access underlying TS LanguageService to request refactor
    const ls = project.getLanguageService().compilerObject
    const fileName = sf.getFilePath()
    const formatOptions = {}
    const userPreferences = {}
    const applicable = ls.getApplicableRefactors(fileName, { pos: startPos, end: startPos + length }, userPreferences, undefined)
    const extractRefactor = (applicable || []).find(r => /Extract/.test(r.name))
    if (!extractRefactor) {
      throw new Error('No extract refactor available at the selected range')
    }
    const action = extractRefactor.actions[0]
    const edits = ls.getEditsForRefactor(fileName, formatOptions, { pos: startPos, end: startPos + length }, extractRefactor.name, action.name, userPreferences)
    if (!edits || !edits.edits) throw new Error('Language service did not return edits for extraction')
    // Apply edits
    await this._applyTsTextChanges(edits)
    // If a name is provided and the language service didn't prompt naming, we can post-rename the newly created symbol
    // Best-effort: find newly introduced function declaration named like 'newFunction' and rename
    if (options.dryRun) {
      // compute after
      const before = await fs.readFile(abs, 'utf-8')
      await this._applyTsTextChanges(edits)
      const after = await fs.readFile(abs, 'utf-8')
      // revert
      await fs.writeFile(abs, before, 'utf-8')
      return { success: true, dryRun: true, file: abs, diff: this._fileDiff(before, after, abs) }
    }
    await this._applyTsTextChanges(edits)
    await project.save()
    return { success: true, refactor: extractRefactor.name, action: action.name }
  }

  async _changeSignatureWithLanguageService(filePath, symbol, newSig, options = {}) {
    const abs = path.resolve(this.projectRoot, filePath)
    const project = this._tsProject
    let sf = project.getSourceFile(abs)
    if (!sf) sf = project.addSourceFileAtPath(abs)

    // Try to locate the function declaration
    const func = sf.getFunctions().find(f => f.getName() === symbol) || sf.getVariableDeclaration(symbol)?.getInitializerIfKind(tsMorph.SyntaxKind.ArrowFunction)
    if (!func) throw new Error(`Function ${symbol} not found in ${filePath}`)

    // Attempt to use an available refactor if exposed by the language service
    const ls = project.getLanguageService().compilerObject
    const fileName = sf.getFilePath()
    const nameNode = func.getNameNode ? func.getNameNode() : func
    const pos = (nameNode && nameNode.getStart) ? nameNode.getStart() : func.getStart()
    const applicable = ls.getApplicableRefactors(fileName, { pos, end: pos }, {}, undefined)
    const changeSig = (applicable || []).find(r => /Signature|parameter|parameterize/i.test(r.description || r.name))
    if (changeSig) {
      const action = changeSig.actions[0]
      const edits = ls.getEditsForRefactor(fileName, {}, { pos, end: pos }, changeSig.name, action.name, {})
      if (edits && edits.edits) {
        if (options.dryRun) {
          const before = await fs.readFile(abs, 'utf-8')
          await this._applyTsTextChanges(edits)
          const after = await fs.readFile(abs, 'utf-8')
          await fs.writeFile(abs, before, 'utf-8')
          return { success: true, dryRun: true, file: abs, diff: this._fileDiff(before, after, abs) }
        }
        await this._applyTsTextChanges(edits)
        await project.save()
        return { success: true, functionName: symbol, appliedRefactor: changeSig.name }
      }
    }
    // Fallback: directly update parameters/return type using ts-morph
    if (newSig && typeof newSig === 'object') {
      if (Array.isArray(newSig.parameters)) {
        const params = func.getParameters()
        // Remove existing params
        for (let i = params.length - 1; i >= 0; i--) params[i].remove()
        // Add new params
        for (const p of newSig.parameters) {
          if (typeof p === 'string') func.addParameter({ name: p })
          else func.addParameter({ name: p.name, type: p.type, initializer: p.initializer })
        }
      }
      if (newSig.returnType) {
        if (func.setReturnType) func.setReturnType(newSig.returnType)
      }
      await project.save()
      return { success: true, functionName: symbol, appliedRefactor: 'ts-morph-manual' }
    }
    throw new Error('Unable to change signature with language service or manual update')
  }

  async _applyTsTextChanges(edits) {
    // edits: { edits: Array<{ fileName, textChanges: [{span:{start,length}, newText}]}> }
    for (const fileEdit of edits.edits) {
      const abs = fileEdit.fileName
      const original = await fs.readFile(abs, 'utf-8').catch(() => '')
      let updated = original
      // Apply in reverse order to preserve positions
      const changes = [...fileEdit.textChanges].sort((a, b) => (b.span.start - a.span.start))
      for (const ch of changes) {
        const start = ch.span.start
        const end = ch.span.start + ch.span.length
        updated = updated.slice(0, start) + ch.newText + updated.slice(end)
      }
      if (updated !== original) await fs.writeFile(abs, updated, 'utf-8')
    }
  }

  _getPositionFromLineCol(text, targetLine, targetCol) {
    // targetLine and targetCol are 1-based
    let line = 1
    let col = 1
    for (let i = 0; i < text.length; i++) {
      if (line === targetLine && col === targetCol) return i
      const ch = text[i]
      if (ch === '\n') { line++; col = 1 } else { col++ }
    }
    return text.length
  }

  // =========================
  // jscodeshift codemod runner
  // =========================
  async _runJscodeshift(transformPath, targets, options = {}) {
    const bin = path.join(process.cwd(), 'node_modules', '.bin', 'jscodeshift')
    const args = [
      transformPath,
      '--parser=babel',
      '--extensions=js,jsx,ts,tsx',
      '--ignore-pattern=**/node_modules/**',
      '--quote=single'
    ]
    if (options.dry) args.push('--dry')
    if (options.print) args.push('--print')
    if (options.cpUs) args.push(`-j=${options.cpUs}`)
    args.push(...targets)
    return new Promise((resolve) => {
      const proc = spawn(bin, args, { cwd: this.projectRoot })
      let stdout = ''
      let stderr = ''
      proc.stdout.on('data', d => { stdout += d.toString() })
      proc.stderr.on('data', d => { stderr += d.toString() })
      proc.on('close', (code) => {
        resolve({ success: code === 0, filesProcessed: undefined, results: [{ file: '(multiple via jscodeshift)', success: code === 0, changes: stdout, error: code === 0 ? null : stderr }], dryRun: !!options.dry })
      })
    })
  }

  // =========================
  // Python: LibCST-powered edits
  // =========================
  async _applyPythonEditsWithLibCST(content, edits, filePath) {
    const script = `
import json, sys
try:
    import libcst as cst
    import libcst.matchers as m
except Exception as e:
    print(json.dumps({ 'error': 'LibCST not available: ' + str(e) }))
    sys.exit(0)

class RenameTransformer(cst.CSTTransformer):
    def __init__(self, mapping):
        self.old = mapping.get('oldName')
        self.new = mapping.get('newName')
    def leave_Name(self, original_node, updated_node):
        if original_node.value == self.old:
            return updated_node.with_changes(value=self.new)
        return updated_node

class ImportUpdater(cst.CSTTransformer):
    def __init__(self, ops):
        self.ops = ops
    def leave_Module(self, original_node, updated_node):
        body = list(updated_node.body)
        for op in self.ops:
            if op.get('type') == 'addImport':
                module = op.get('module')
                names = op.get('names') or []
                aliases = []
                for n in names:
                    if isinstance(n, dict):
                        aliases.append(cst.ImportAlias(name=cst.Name(n['name']), asname=cst.AsName(cst.Name(n['asname'])) if n.get('asname') else None))
                    else:
                        aliases.append(cst.ImportAlias(name=cst.Name(n)))
                if aliases:
                    imp = cst.SimpleStatementLine([cst.ImportFrom(module=cst.Name(module) if module and module.isidentifier() else cst.Attribute.from_value(module) if module else None, names=tuple(aliases))])
                else:
                    imp = cst.SimpleStatementLine([cst.Import(names=[cst.ImportAlias(name=cst.Name(module))])])
                body.insert(0, imp)
        return updated_node.with_changes(body=tuple(body))

def apply_edits(src, ops):
    module = cst.parse_module(src)
    for op in ops:
        if op.get('type') == 'renameSymbol':
            module = module.visit(RenameTransformer(op))
        elif op.get('type') in ('addImport',):
            module = module.visit(ImportUpdater([op]))
        elif op.get('type') == 'replaceText':
            # Fallback textual replacement
            src = src.replace(op.get('search',''), op.get('replace',''))
            module = cst.parse_module(src)
        else:
            pass
    return module.code

try:
    data = sys.stdin.read()
    payload = json.loads(data)
    code = payload['code']
    ops = payload['edits']
    out = apply_edits(code, ops)
    print(json.dumps({ 'success': True, 'content': out }))
except Exception as e:
    print(json.dumps({ 'success': False, 'error': str(e) }))
`
    return new Promise((resolve, reject) => {
      const proc = spawn('python3', ['-c', script])
      let stdout = ''
      let stderr = ''
      proc.stdout.on('data', d => { stdout += d.toString() })
      proc.stderr.on('data', d => { stderr += d.toString() })
      proc.on('close', (code) => {
        try {
          const res = JSON.parse(stdout || '{}')
          if (res && res.content) {
            resolve({ success: true, content: res.content })
          } else if (res && res.error) {
            resolve({ success: false, error: res.error })
          } else {
            resolve({ success: code === 0, content: null, error: stderr || 'Unknown Python LibCST error' })
          }
        } catch (e) {
          resolve({ success: false, error: `Failed to parse LibCST response: ${e.message}. Raw: ${stdout}` })
        }
      })
      proc.stdin.write(JSON.stringify({ code: content, edits }))
      proc.stdin.end()
    })
  }
}

module.exports = { ASTRefactoring }
