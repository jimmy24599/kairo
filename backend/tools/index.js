const { FileOperations } = require('./fileOperations')
const { SearchNavigation } = require('./searchNavigation')
const { DependencyManagement } = require('./dependencyManagement')
const { ASTRefactoring } = require('./astRefactoring')
const { SemanticSearch } = require('./semanticSearch')
const { SessionMemory } = require('./sessionMemory')
const { SafeSandbox } = require('./safeSandbox')
const { AutomatedTesting } = require('./automatedTesting')
const TerminalSystemTools = require('./terminalSystem')

class Tools {
  constructor(projectRoot) {
    this.fileOperations = new FileOperations(projectRoot)
    this.searchNavigation = new SearchNavigation(projectRoot)
    this.dependencyManagement = new DependencyManagement(projectRoot)
    this.astRefactoring = new ASTRefactoring(projectRoot)
    this.semanticSearch = new SemanticSearch(projectRoot)
    this.sessionMemory = new SessionMemory(projectRoot)
    this.safeSandbox = new SafeSandbox(projectRoot)
    this.automatedTesting = new AutomatedTesting(projectRoot)
    this.terminalSystem = new TerminalSystemTools(projectRoot)
  }

  // File Operations
  async list_files(path = '') {
    return await this.fileOperations.list_files(path)
  }

  async read_file(path) {
    return await this.fileOperations.read_file(path)
  }

  async stream_read_file(path, start, end) {
    return await this.fileOperations.stream_read_file(path, start, end)
  }

  async write_file(path, content) {
    return await this.fileOperations.write_file(path, content)
  }

  async create_file(path, content) {
    return await this.fileOperations.create_file(path, content)
  }

  async append_file(path, content) {
    return await this.fileOperations.append_file(path, content)
  }

  async delete_file(path) {
    return await this.fileOperations.delete_file(path)
  }

  async rename_file(oldPath, newPath) {
    return await this.fileOperations.rename_file(oldPath, newPath)
  }

  async copy_file(srcPath, destPath) {
    return await this.fileOperations.copy_file(srcPath, destPath)
  }

  async set_file_permissions(path, mode) {
    return await this.fileOperations.set_file_permissions(path, mode)
  }

  async stat_file(path) {
    return await this.fileOperations.stat_file(path)
  }

  async tail_file(path, lines) {
    return await this.fileOperations.tail_file(path, lines)
  }

  async apply_patch(patch) {
    return await this.fileOperations.apply_patch(patch)
  }

  // Search & Navigation
  async search_code(query, options = {}) {
    return await this.searchNavigation.search_code(query, options)
  }

  async find_symbol(name) {
    return await this.searchNavigation.find_symbol(name)
  }

  async get_outline(path) {
    return await this.searchNavigation.get_outline(path)
  }

  async find_references(symbol) {
    return await this.searchNavigation.find_references(symbol)
  }

  // Dependency Management
  async get_project_config() {
    return await this.dependencyManagement.get_project_config()
  }

  async list_dependencies() {
    return await this.dependencyManagement.list_dependencies()
  }

  async get_dependency_tree() {
    return await this.dependencyManagement.get_dependency_tree()
  }

  async check_latest_version(pkg) {
    return await this.dependencyManagement.check_latest_version(pkg)
  }

  async bump_dependency(pkg, version) {
    return await this.dependencyManagement.bump_dependency(pkg, version)
  }

  async install_dependencies() {
    return await this.dependencyManagement.install_dependencies()
  }

  async remove_dependency(pkg) {
    return await this.dependencyManagement.remove_dependency(pkg)
  }

  async pin_dependencies() {
    return await this.dependencyManagement.pin_dependencies()
  }

  // AST Refactoring
  async parse_ast(filePath) {
    return await this.astRefactoring.parse_ast(filePath)
  }

  async ast_edit(filePath, edits) {
    return await this.astRefactoring.ast_edit(filePath, edits)
  }

  async refactor_symbol(oldName, newName, options = {}) {
    return await this.astRefactoring.refactor_symbol(oldName, newName, options)
  }

  async extract_method(filePath, range, name, options = {}) {
    return await this.astRefactoring.extract_method(filePath, range, name, options)
  }

  async inline_function(filePath, symbol) {
    return await this.astRefactoring.inline_function(filePath, symbol)
  }

  async change_function_signature(filePath, symbol, newSig, options = {}) {
    return await this.astRefactoring.change_function_signature(filePath, symbol, newSig, options)
  }

  async apply_codemod(script, paths, options = {}) {
    return await this.astRefactoring.apply_codemod(script, paths, options)
  }

  async update_imports(filePath, options = {}) {
    return await this.astRefactoring.update_imports(filePath, options)
  }

  async organize_imports(options = {}) {
    return await this.astRefactoring.organize_imports(options)
  }

  async find_ts_references(filePath, position, options = {}) {
    return await this.astRefactoring.find_references(filePath, position, options)
  }

  async move_paths(moves, options = {}) {
    return await this.astRefactoring.move_paths(moves, options)
  }

  // Semantic Search
  async semantic_search(query, options) {
    return await this.semanticSearch.semantic_search(query, options)
  }

  async generate_embeddings(fileTypes) {
    return await this.semanticSearch.generate_embeddings(fileTypes)
  }

  async find_similar_code(code, options) {
    return await this.semanticSearch.find_similar_code(code, options)
  }

  // Session Memory
  async record_edit(filePath, operation, details) {
    return await this.sessionMemory.recordEdit(filePath, operation, details)
  }

  async record_patch(patch, filePath, result) {
    return await this.sessionMemory.recordPatch(patch, filePath, result)
  }

  async record_reasoning(context, decision, factors) {
    return await this.sessionMemory.recordReasoning(context, decision, factors)
  }

  async get_edit_history(options) {
    return await this.sessionMemory.getEditHistory(options)
  }

  async get_patch_history(options) {
    return await this.sessionMemory.getPatchHistory(options)
  }

  async rollback_edit(editId) {
    return await this.sessionMemory.rollbackEdit(editId)
  }

  async rollback_patch(patchId) {
    return await this.sessionMemory.rollbackPatch(patchId)
  }

  async get_session_summary() {
    return await this.sessionMemory.getSessionSummary()
  }

  async clear_memory() {
    return await this.sessionMemory.clearMemory()
  }

  // Safe Sandbox
  async validate_path(filePath, operation) {
    return await this.safeSandbox.validatePath(filePath, operation)
  }

  async validate_content(content, filePath) {
    return await this.safeSandbox.validateContent(content, filePath)
  }

  async validate_command(command, args) {
    return await this.safeSandbox.validateCommand(command, args)
  }

  async get_sandbox_config() {
    return this.safeSandbox.getConfiguration()
  }

  // Automated Testing
  async run_tests(options) {
    return await this.automatedTesting.runTests(options)
  }

  async run_linting(options) {
    return await this.automatedTesting.runLinting(options)
  }

  async run_build(options) {
    return await this.automatedTesting.runBuild(options)
  }

  async run_type_check(options) {
    return await this.automatedTesting.runTypeCheck(options)
  }

  // Terminal & System Tools
  async run_command(command, cwd) {
    return await this.terminalSystem.run_command(command, cwd)
  }

  async stream_command(command, cwd) {
    return await this.terminalSystem.stream_command(command, cwd)
  }

  async kill_process(pid) {
    return await this.terminalSystem.kill_process(pid)
  }

  async install_dependencies() {
    return await this.terminalSystem.install_dependencies()
  }

  async add_dependency(pkg, version) {
    return await this.terminalSystem.add_dependency(pkg, version)
  }

  async remove_dependency(pkg) {
    return await this.terminalSystem.remove_dependency(pkg)
  }

  get_running_processes() {
    return this.terminalSystem.get_running_processes()
  }

  cleanup() {
    this.terminalSystem.cleanup()
  }
}

module.exports = { Tools }
