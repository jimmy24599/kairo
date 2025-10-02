class AIAgent { constructor(projectRoot) { 
    this.projectRoot = projectRoot 
    this.tools = new Tools(projectRoot) 
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
} 
async processRequest(userInput) { 
    try { 
        // Get project context 
        const projectFiles = await this.tools.list_files() 
        // Create system prompt with available tools 
        const systemPrompt = You are an AI coding assistant with access to file operations and search tools. You can use these tools: File Operations: - list_files(path?) → list files/folders under path - read_file(path) → return full file contents - stream_read_file(path, start?, end?) → stream large files / ranges - write_file(path, content) → overwrite file - create_file(path, content) → create new file - append_file(path, content) → append to file - delete_file(path) → delete file - rename_file(oldPath, newPath) → move/rename file - copy_file(src, dest) → duplicate a file - set_file_permissions(path, mode) → change permissions - stat_file(path) → file metadata (size, mtime, hash) - tail_file(path, lines?) → read last N lines - apply_patch(patch) → apply unified diff to files Search & Navigation: - search_code(query, options?) → text/code search across repo - find_symbol(name) → locate function/class/variable definition - get_outline(path) → get file structure (functions, classes, imports) - find_references(symbol) → find all usages of a symbol Dependency Management: - get_project_config() → return package.json/pyproject/manifest - list_dependencies() → dependency list with versions - get_dependency_tree() → resolved dependency graph - check_latest_version(pkg) → fetch latest version - bump_dependency(pkg, version) → update package version - install_dependencies() → npm install / pip install -r - remove_dependency(pkg) → uninstall package - pin_dependencies() → lockfile generation/update AST Refactoring: - parse_ast(path) → return language AST - ast_edit(path, edits) → perform AST-safe edits - refactor_symbol(oldName, newName) → safe rename across files - extract_method(path, range, name) → extract code block to function - inline_function(path, symbol) → inline a function - change_function_signature(path, symbol, newSig) → update calls/imports - apply_codemod(script, paths?) → run JS/Python codemod - update_imports(path?) → fix/optimize imports across project Project Root: ${this.projectRoot} Current Files: ${projectFiles.map(f => f.path).join(', ')} When the user asks you to do something, respond with a JSON object containing: { "action": "tool_call", "tool": "tool_name", "parameters": {...}, "explanation": "What you're doing and why" } Or if you need to make multiple tool calls: { "action": "multi_tool_call", "calls": [ {"tool": "tool_name", "parameters": {...}, "explanation": "..."}, {"tool": "tool_name", "parameters": {...}, "explanation": "..."} ] } Always explain what you're doing and why. 
        const response = await this.openai.chat.completions.create({ 
            model: 'gpt-4o', 
            messages: [ { 
                role: 'system',
                content: systemPrompt 
            }, 
            {
                role: 'user', 
                content: userInput } 
            ], 
            temperature: 0.1, 
            max_tokens: 2000 
        }) 
        const content = response.choices[0]?.message?.content 
        if (!content) 
            throw new Error('No response from AI') 
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
        console.log(Executing tool: ${tool}) 
        console.log(Explanation: ${explanation}) 
        console.log(Parameters:, parameters) 
        let result switch (tool) 
        { 
            // File Operations 
            case 'list_files': result = await this.tools.list_files(parameters.path) 
            break 
            case 'read_file': result = await this.tools.read_file(parameters.path) 
            break 
            case 'stream_read_file': result = await this.tools.stream_read_file(parameters.path, parameters.start, parameters.end) 
            break 
            case 'write_file': result = await this.tools.write_file(parameters.path, parameters.content) 
            break 
            case 'create_file': result = await this.tools.create_file(parameters.path, parameters.content) 
            break 
            case 'append_file': result = await this.tools.append_file(parameters.path, parameters.content) 
            break 
            case 'delete_file': result = await this.tools.delete_file(parameters.path) 
            break 
            case 'rename_file': result = await this.tools.rename_file(parameters.oldPath, parameters.newPath) 
            break 
            case 'copy_file': result = await this.tools.copy_file(parameters.src, parameters.dest) 
            break 
            case 'set_file_permissions': result = await this.tools.set_file_permissions(parameters.path, parameters.mode) 
            break 
            case 'stat_file': result = await this.tools.stat_file(parameters.path) 
            break 
            case 'tail_file': result = await this.tools.tail_file(parameters.path, parameters.lines) 
            break 
            case 'apply_patch': result = await this.tools.apply_patch(parameters.patch) 
            break 
            // Search & Navigation 
            case 'search_code': result = await this.tools.search_code(parameters.query, parameters.options) 
            break 
            case 'find_symbol': result = await this.tools.find_symbol(parameters.name) 
            break 
            case 'get_outline': result = await this.tools.get_outline(parameters.path) 
            break 
            case 'find_references': result = await this.tools.find_references(parameters.symbol) 
            break 
            // Dependency Management 
            case 'get_project_config': result = await this.tools.get_project_config() 
            break 
            case 'list_dependencies': result = await this.tools.list_dependencies() 
            break 
            case 'get_dependency_tree': result = await this.tools.get_dependency_tree() 
            break 
            case 'check_latest_version': result = await this.tools.check_latest_version(parameters.pkg) 
            break 
            case 'bump_dependency': result = await this.tools.bump_dependency(parameters.pkg, parameters.version) 
            break 
            case 'install_dependencies': result = await this.tools.install_dependencies() 
            break 
            case 'remove_dependency': result = await this.tools.remove_dependency(parameters.pkg) 
            break 
            case 'pin_dependencies': result = await this.tools.pin_dependencies() 
            break 
            // AST Refactoring 
            case 'parse_ast': result = await this.tools.parse_ast(parameters.path) 
            break 
            case 'ast_edit': result = await this.tools.ast_edit(parameters.path, parameters.edits)
            break 
            case 'refactor_symbol': result = await this.tools.refactor_symbol(parameters.oldName, parameters.newName) 
            break 
            case 'extract_method': result = await this.tools.extract_method(parameters.path, parameters.range, parameters.name) 
            break 
            case 'inline_function': result = await this.tools.inline_function(parameters.path, parameters.symbol) 
            break 
            case 'change_function_signature': result = await this.tools.change_function_signature(parameters.path, parameters.symbol, parameters.newSig) 
            break 
            case 'apply_codemod': result = await this.tools.apply_codemod(parameters.script, parameters.paths) 
            break 
            case 'update_imports': result = await this.tools.update_imports(parameters.path) 
            break 
            default: throw new Error(Unknown tool: ${tool}) } 
            return { success: true, tool: tool, explanation: explanation, result: result } 
        } catch (error) { 
            return { success: false, tool: toolCall.tool, explanation: toolCall.explanation, error: error.message, result: null } 
        } 
    } 
    async executeMultiToolCall(multiToolCall) { 
        const results = [] for (const toolCall of multiToolCall.calls) { 
            const result = await this.executeToolCall(toolCall) 
            results.push(result) 
        } return { success: results.every(r => r.success), results: results } } } 
        
module.exports = { AIAgent }