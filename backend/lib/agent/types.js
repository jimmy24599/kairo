// Task types and interfaces for the AI agent

class Task {
  constructor(data = {}) {
    this.id = data.id || this.generateId()
    this.type = data.type || 'create' // 'create', 'modify', 'delete', 'command', 'install'
    this.description = data.description || ''
    this.status = data.status || 'pending' // 'pending', 'in_progress', 'completed', 'failed'
    this.priority = data.priority || 'medium' // 'low', 'medium', 'high'
    this.dependencies = data.dependencies || []
    this.filePath = data.filePath || ''
    this.content = data.content || ''
    this.command = data.command || ''
    this.createdAt = data.createdAt || new Date()
    this.completedAt = data.completedAt || null
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9)
  }
}

class AgentContext {
  constructor(data = {}) {
    this.projectRoot = data.projectRoot || ''
    this.files = data.files || []
    this.dependencies = data.dependencies || []
    this.devDependencies = data.devDependencies || []
    this.scripts = data.scripts || {}
    this.framework = data.framework || 'unknown'
    this.language = data.language || 'unknown'
  }
}

class AgentResponse {
  constructor(data = {}) {
    this.success = data.success || false
    this.message = data.message || ''
    this.tasks = data.tasks || []
    this.filesCreated = data.filesCreated || []
    this.filesModified = data.filesModified || []
    this.errors = data.errors || []
  }
}

module.exports = {
  Task,
  AgentContext,
  AgentResponse
}