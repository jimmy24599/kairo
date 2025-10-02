const { Tools } = require('./tools')
const OpenAI = require('openai')

class AIAgent {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
    this.tools = new Tools(projectRoot)
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  } 
  async processRequest(userInput) {
    try {
      // Get project context
      const projectFiles = await this.tools.list_files()
      
      // Create system prompt with available tools
      const systemPrompt = `You are an AI coding assistant with access to powerful development tools. You can use these tools:

File Operations:
- list_files(path?) → list files/folders under path
- read_file(path) → return full file contents
- stream_read_file(path, start?, end?) → stream large files / ranges
- write_file(path, content) → overwrite file
- create_file(path, content) → create new file
- append_file(path, content) → append to file
- delete_file(path) → delete file
- rename_file(oldPath, newPath) → move/rename file
- copy_file(src, dest) → duplicate a file
- set_file_permissions(path, mode) → change permissions
- stat_file(path) → file metadata (size, mtime, hash)
- tail_file(path, lines?) → read last N lines
- apply_patch(patch) → apply unified diff to files

Search & Navigation:
- search_code(query, options?) → text/code search across repo
- find_symbol(name) → locate function/class/variable definition
- get_outline(path) → get file structure (functions, classes, imports)
- find_references(symbol) → find all usages of a symbol

Dependency Management:
- get_project_config() → return package.json/pyproject/manifest
- list_dependencies() → dependency list with versions
- get_dependency_tree() → resolved dependency graph
- check_latest_version(pkg) → fetch latest version
- bump_dependency(pkg, version) → update package version
- install_dependencies() → npm install / pip install -r
- remove_dependency(pkg) → uninstall package
- pin_dependencies() → lockfile generation/update

AST Refactoring:
- parse_ast(path) → return language AST
- ast_edit(path, edits) → perform AST-safe edits
- refactor_symbol(oldName, newName, options?) → safe rename across files
- extract_method(path, range, name, options?) → extract code block to function
- inline_function(path, symbol) → inline a function
- change_function_signature(path, symbol, newSig, options?) → update calls/imports
- apply_codemod(script, paths?, options?) → run JS/Python codemod
- update_imports(path?, options?) → fix/optimize imports in file
- organize_imports(options?) → organize imports across project
- find_ts_references(path, position, options?) → find TypeScript references
- move_paths(moves, options?) → move/rename files and update imports

Semantic Search:
- semantic_search(query, options?) → embeddings-based code search
- generate_embeddings(fileTypes?) → generate embeddings for files
- find_similar_code(code, options?) → find similar code blocks

Session Memory:
- record_edit(filePath, operation, details) → record file edit
- record_patch(patch, filePath, result) → record patch application
- record_reasoning(context, decision, factors) → record reasoning
- get_edit_history(options?) → get edit history
- get_patch_history(options?) → get patch history
- rollback_edit(editId) → rollback an edit
- rollback_patch(patchId) → rollback a patch
- get_session_summary() → get session summary
- clear_memory() → clear session memory

Safe Sandbox:
- validate_path(filePath, operation) → validate file path safety
- validate_content(content, filePath) → validate content safety
- validate_command(command, args) → validate command safety
- get_sandbox_config() → get sandbox configuration

Automated Testing:
- run_tests(options?) → run project tests
- run_linting(options?) → run code linting
- run_build(options?) → run build process
- run_type_check(options?) → run type checking

Terminal & System Tools:
- run_command(command, cwd?) → run any shell command in the project directory
- stream_command(command, cwd?) → stream stdout/stderr line by line (useful for long-running dev servers/tests)
- kill_process(pid) → stop a running process started by the agent (like a server)
- add_dependency(pkg, version?) → install a single dependency
- get_running_processes() → get list of running processes
- cleanup() → cleanup resources and processes

Project Root: ${this.projectRoot}
Current Files: ${projectFiles.map(f => f.path).join(', ')}

When the user asks you to do something, respond with a JSON object containing:
{ "action": "tool_call", "tool": "tool_name", "parameters": {...}, "explanation": "What you're doing and why" }

Or if you need to make multiple tool calls:
{ "action": "multi_tool_call", "calls": [ {"tool": "tool_name", "parameters": {...}, "explanation": "..."}, {"tool": "tool_name", "parameters": {...}, "explanation": "..."} ] }

Always explain what you're doing and why.`

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userInput
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from AI')
      }

      // Parse the AI response
      const aiResponse = JSON.parse(content)

      // Execute the tool calls
      if (aiResponse.action === 'tool_call') {
        return await this.executeToolCall(aiResponse)
      } else if (aiResponse.action === 'multi_tool_call') {
        return await this.executeMultiToolCall(aiResponse)
      } else {
        throw new Error('Invalid AI response format')
      }
    } catch (error) {
      console.error('Error processing request:', error)
      return {
        success: false,
        error: error.message,
        result: null
      }
    }
  } 

  async executeToolCall(toolCall) {
    try {
      const { tool, parameters, explanation } = toolCall
      console.log(`Executing tool: ${tool}`)
      console.log(`Explanation: ${explanation}`)
      console.log('Parameters:', parameters)

      let result
      switch (tool) {
        // File Operations
        case 'list_files':
          result = await this.tools.list_files(parameters.path)
          break
        case 'read_file':
          result = await this.tools.read_file(parameters.path)
          break
        case 'stream_read_file':
          result = await this.tools.stream_read_file(parameters.path, parameters.start, parameters.end)
          break
        case 'write_file':
          result = await this.tools.write_file(parameters.path, parameters.content)
          break
        case 'create_file':
          result = await this.tools.create_file(parameters.path, parameters.content)
          break
        case 'append_file':
          result = await this.tools.append_file(parameters.path, parameters.content)
          break
        case 'delete_file':
          result = await this.tools.delete_file(parameters.path)
          break
        case 'rename_file':
          result = await this.tools.rename_file(parameters.oldPath, parameters.newPath)
          break
        case 'copy_file':
          result = await this.tools.copy_file(parameters.src, parameters.dest)
          break
        case 'set_file_permissions':
          result = await this.tools.set_file_permissions(parameters.path, parameters.mode)
          break
        case 'stat_file':
          result = await this.tools.stat_file(parameters.path)
          break
        case 'tail_file':
          result = await this.tools.tail_file(parameters.path, parameters.lines)
          break
        case 'apply_patch':
          result = await this.tools.apply_patch(parameters.patch)
          break

        // Search & Navigation
        case 'search_code':
          result = await this.tools.search_code(parameters.query, parameters.options)
          break
        case 'find_symbol':
          result = await this.tools.find_symbol(parameters.name)
          break
        case 'get_outline':
          result = await this.tools.get_outline(parameters.path)
          break
        case 'find_references':
          result = await this.tools.find_references(parameters.symbol)
          break

        // Dependency Management
        case 'get_project_config':
          result = await this.tools.get_project_config()
          break
        case 'list_dependencies':
          result = await this.tools.list_dependencies()
          break
        case 'get_dependency_tree':
          result = await this.tools.get_dependency_tree()
          break
        case 'check_latest_version':
          result = await this.tools.check_latest_version(parameters.pkg)
          break
        case 'bump_dependency':
          result = await this.tools.bump_dependency(parameters.pkg, parameters.version)
          break
        case 'install_dependencies':
          result = await this.tools.install_dependencies()
          break
        case 'remove_dependency':
          result = await this.tools.remove_dependency(parameters.pkg)
          break
        case 'pin_dependencies':
          result = await this.tools.pin_dependencies()
          break

        // AST Refactoring
        case 'parse_ast':
          result = await this.tools.parse_ast(parameters.path)
          break
        case 'ast_edit':
          result = await this.tools.ast_edit(parameters.path, parameters.edits)
          break
        case 'refactor_symbol':
          result = await this.tools.refactor_symbol(parameters.oldName, parameters.newName, parameters.options)
          break
        case 'extract_method':
          result = await this.tools.extract_method(parameters.path, parameters.range, parameters.name, parameters.options)
          break
        case 'inline_function':
          result = await this.tools.inline_function(parameters.path, parameters.symbol)
          break
        case 'change_function_signature':
          result = await this.tools.change_function_signature(parameters.path, parameters.symbol, parameters.newSig, parameters.options)
          break
        case 'apply_codemod':
          result = await this.tools.apply_codemod(parameters.script, parameters.paths, parameters.options)
          break
        case 'update_imports':
          result = await this.tools.update_imports(parameters.path, parameters.options)
          break
        case 'organize_imports':
          result = await this.tools.organize_imports(parameters.options)
          break
        case 'find_ts_references':
          result = await this.tools.find_ts_references(parameters.path, parameters.position, parameters.options)
          break
        case 'move_paths':
          result = await this.tools.move_paths(parameters.moves, parameters.options)
          break

        // Semantic Search
        case 'semantic_search':
          result = await this.tools.semantic_search(parameters.query, parameters.options)
          break
        case 'generate_embeddings':
          result = await this.tools.generate_embeddings(parameters.fileTypes)
          break
        case 'find_similar_code':
          result = await this.tools.find_similar_code(parameters.code, parameters.options)
          break

        // Session Memory
        case 'record_edit':
          result = await this.tools.record_edit(parameters.filePath, parameters.operation, parameters.details)
          break
        case 'record_patch':
          result = await this.tools.record_patch(parameters.patch, parameters.filePath, parameters.result)
          break
        case 'record_reasoning':
          result = await this.tools.record_reasoning(parameters.context, parameters.decision, parameters.factors)
          break
        case 'get_edit_history':
          result = await this.tools.get_edit_history(parameters.options)
          break
        case 'get_patch_history':
          result = await this.tools.get_patch_history(parameters.options)
          break
        case 'rollback_edit':
          result = await this.tools.rollback_edit(parameters.editId)
          break
        case 'rollback_patch':
          result = await this.tools.rollback_patch(parameters.patchId)
          break
        case 'get_session_summary':
          result = await this.tools.get_session_summary()
          break
        case 'clear_memory':
          result = await this.tools.clear_memory()
          break

        // Safe Sandbox
        case 'validate_path':
          result = await this.tools.validate_path(parameters.filePath, parameters.operation)
          break
        case 'validate_content':
          result = await this.tools.validate_content(parameters.content, parameters.filePath)
          break
        case 'validate_command':
          result = await this.tools.validate_command(parameters.command, parameters.args)
          break
        case 'get_sandbox_config':
          result = await this.tools.get_sandbox_config()
          break

        // Automated Testing
        case 'run_tests':
          result = await this.tools.run_tests(parameters.options)
          break
        case 'run_linting':
          result = await this.tools.run_linting(parameters.options)
          break
        case 'run_build':
          result = await this.tools.run_build(parameters.options)
          break
        case 'run_type_check':
          result = await this.tools.run_type_check(parameters.options)
          break

        // Terminal & System Tools
        case 'run_command':
          result = await this.tools.run_command(parameters.command, parameters.cwd)
          break
        case 'stream_command':
          result = await this.tools.stream_command(parameters.command, parameters.cwd)
          break
        case 'kill_process':
          result = await this.tools.kill_process(parameters.pid)
          break
        case 'add_dependency':
          result = await this.tools.add_dependency(parameters.pkg, parameters.version)
          break
        case 'get_running_processes':
          result = await this.tools.get_running_processes()
          break

        // Additional tools that might be missing
        case 'cleanup':
          result = await this.tools.cleanup()
          break

        default:
          throw new Error(`Unknown tool: ${tool}`)
      }

      return { success: true, tool: tool, explanation: explanation, result: result }
    } catch (error) {
      return { success: false, tool: toolCall.tool, explanation: toolCall.explanation, error: error.message, result: null }
    }
  }

  async executeMultiToolCall(multiToolCall) {
    const results = []
    for (const toolCall of multiToolCall.calls) {
      const result = await this.executeToolCall(toolCall)
      results.push(result)
    }
    return { success: results.every(r => r.success), results: results }
  }
}

module.exports = { AIAgent }