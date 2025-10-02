const fs = require('fs-extra')
const path = require('path')

class SessionMemory {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
    this.memoryFile = path.join(projectRoot, '.session-memory.json')
    this.memory = {
      edits: [],
      patches: [],
      reasoning: [],
      context: {},
      timestamp: Date.now()
    }
    this.loadMemory()
  }

  /**
   * Record a file edit
   * @param {string} filePath - Path to the edited file
   * @param {string} operation - Type of operation (create, modify, delete)
   * @param {Object} details - Edit details
   * @returns {Object} Record result
   */
  async recordEdit(filePath, operation, details = {}) {
    try {
      const edit = {
        id: this.generateId(),
        filePath,
        operation,
        details,
        timestamp: Date.now(),
        backup: null
      }

      // Create backup for modifications
      if (operation === 'modify' && await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf-8')
        edit.backup = content
      }

      this.memory.edits.push(edit)
      await this.saveMemory()

      return {
        success: true,
        editId: edit.id,
        message: 'Edit recorded successfully'
      }
    } catch (error) {
      throw new Error(`Failed to record edit: ${error.message}`)
    }
  }

  /**
   * Record a patch application
   * @param {string} patch - Patch content
   * @param {string} filePath - Target file path
   * @param {Object} result - Patch result
   * @returns {Object} Record result
   */
  async recordPatch(patch, filePath, result) {
    try {
      const patchRecord = {
        id: this.generateId(),
        patch,
        filePath,
        result,
        timestamp: Date.now(),
        rollback: null
      }

      // Create rollback patch if successful
      if (result.success && await fs.pathExists(filePath)) {
        const currentContent = await fs.readFile(filePath, 'utf-8')
        patchRecord.rollback = this.generateRollbackPatch(patch, currentContent)
      }

      this.memory.patches.push(patchRecord)
      await this.saveMemory()

      return {
        success: true,
        patchId: patchRecord.id,
        message: 'Patch recorded successfully'
      }
    } catch (error) {
      throw new Error(`Failed to record patch: ${error.message}`)
    }
  }

  /**
   * Record reasoning context
   * @param {string} context - Reasoning context
   * @param {string} decision - Decision made
   * @param {Object} factors - Factors considered
   * @returns {Object} Record result
   */
  async recordReasoning(context, decision, factors = {}) {
    try {
      const reasoning = {
        id: this.generateId(),
        context,
        decision,
        factors,
        timestamp: Date.now()
      }

      this.memory.reasoning.push(reasoning)
      await this.saveMemory()

      return {
        success: true,
        reasoningId: reasoning.id,
        message: 'Reasoning recorded successfully'
      }
    } catch (error) {
      throw new Error(`Failed to record reasoning: ${error.message}`)
    }
  }

  /**
   * Get edit history
   * @param {Object} options - Query options
   * @returns {Object} Edit history
   */
  async getEditHistory(options = {}) {
    const {
      filePath = null,
      operation = null,
      limit = 50,
      since = null
    } = options

    let edits = [...this.memory.edits]

    // Filter by file path
    if (filePath) {
      edits = edits.filter(edit => edit.filePath === filePath)
    }

    // Filter by operation
    if (operation) {
      edits = edits.filter(edit => edit.operation === operation)
    }

    // Filter by timestamp
    if (since) {
      edits = edits.filter(edit => edit.timestamp >= since)
    }

    // Sort by timestamp (newest first) and limit
    edits.sort((a, b) => b.timestamp - a.timestamp)
    edits = edits.slice(0, limit)

    return {
      success: true,
      edits,
      total: this.memory.edits.length
    }
  }

  /**
   * Get patch history
   * @param {Object} options - Query options
   * @returns {Object} Patch history
   */
  async getPatchHistory(options = {}) {
    const {
      filePath = null,
      limit = 50,
      since = null
    } = options

    let patches = [...this.memory.patches]

    // Filter by file path
    if (filePath) {
      patches = patches.filter(patch => patch.filePath === filePath)
    }

    // Filter by timestamp
    if (since) {
      patches = patches.filter(patch => patch.timestamp >= since)
    }

    // Sort by timestamp (newest first) and limit
    patches.sort((a, b) => b.timestamp - a.timestamp)
    patches = patches.slice(0, limit)

    return {
      success: true,
      patches,
      total: this.memory.patches.length
    }
  }

  /**
   * Rollback an edit
   * @param {string} editId - Edit ID to rollback
   * @returns {Object} Rollback result
   */
  async rollbackEdit(editId) {
    try {
      const edit = this.memory.edits.find(e => e.id === editId)
      if (!edit) {
        throw new Error('Edit not found')
      }

      if (edit.operation === 'modify' && edit.backup) {
        await fs.writeFile(edit.filePath, edit.backup)
        
        // Record the rollback
        await this.recordEdit(edit.filePath, 'rollback', {
          originalEditId: editId,
          reason: 'User requested rollback'
        })

        return {
          success: true,
          message: 'Edit rolled back successfully'
        }
      } else if (edit.operation === 'create') {
        await fs.remove(edit.filePath)
        
        // Record the rollback
        await this.recordEdit(edit.filePath, 'rollback', {
          originalEditId: editId,
          reason: 'User requested rollback'
        })

        return {
          success: true,
          message: 'File creation rolled back successfully'
        }
      } else {
        throw new Error('Cannot rollback this type of edit')
      }
    } catch (error) {
      throw new Error(`Failed to rollback edit: ${error.message}`)
    }
  }

  /**
   * Rollback a patch
   * @param {string} patchId - Patch ID to rollback
   * @returns {Object} Rollback result
   */
  async rollbackPatch(patchId) {
    try {
      const patch = this.memory.patches.find(p => p.id === patchId)
      if (!patch) {
        throw new Error('Patch not found')
      }

      if (patch.rollback) {
        // Apply rollback patch
        const result = await this.applyPatch(patch.rollback, patch.filePath)
        
        if (result.success) {
          // Record the rollback
          await this.recordPatch(patch.rollback, patch.filePath, {
            success: true,
            message: 'Rollback applied successfully',
            originalPatchId: patchId
          })

          return {
            success: true,
            message: 'Patch rolled back successfully'
          }
        } else {
          throw new Error('Failed to apply rollback patch')
        }
      } else {
        throw new Error('No rollback available for this patch')
      }
    } catch (error) {
      throw new Error(`Failed to rollback patch: ${error.message}`)
    }
  }

  /**
   * Get session summary
   * @returns {Object} Session summary
   */
  async getSessionSummary() {
    const recentEdits = this.memory.edits.slice(-10)
    const recentPatches = this.memory.patches.slice(-10)
    const recentReasoning = this.memory.reasoning.slice(-10)

    return {
      success: true,
      summary: {
        totalEdits: this.memory.edits.length,
        totalPatches: this.memory.patches.length,
        totalReasoning: this.memory.reasoning.length,
        recentEdits,
        recentPatches,
        recentReasoning,
        sessionStart: this.memory.timestamp,
        sessionDuration: Date.now() - this.memory.timestamp
      }
    }
  }

  /**
   * Clear session memory
   * @returns {Object} Clear result
   */
  async clearMemory() {
    try {
      this.memory = {
        edits: [],
        patches: [],
        reasoning: [],
        context: {},
        timestamp: Date.now()
      }
      await this.saveMemory()

      return {
        success: true,
        message: 'Session memory cleared successfully'
      }
    } catch (error) {
      throw new Error(`Failed to clear memory: ${error.message}`)
    }
  }

  // Helper methods

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  generateRollbackPatch(originalPatch, currentContent) {
    // Simple rollback patch generation
    // In a real implementation, you would use proper diff algorithms
    return `--- rollback
+++ rollback
@@ -1,${currentContent.split('\n').length} +1,0 @@
-${currentContent.split('\n').map(line => `-${line}`).join('\n')}`
  }

  async applyPatch(patch, filePath) {
    // Simple patch application
    // In a real implementation, you would use proper patch libraries
    try {
      const lines = patch.split('\n')
      const content = lines
        .filter(line => line.startsWith('-'))
        .map(line => line.substring(1))
        .join('\n')
      
      await fs.writeFile(filePath, content)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async loadMemory() {
    try {
      if (await fs.pathExists(this.memoryFile)) {
        const memoryData = await fs.readFile(this.memoryFile, 'utf-8')
        this.memory = { ...this.memory, ...JSON.parse(memoryData) }
      }
    } catch (error) {
      console.log('Error loading session memory:', error.message)
    }
  }

  async saveMemory() {
    try {
      await fs.writeFile(this.memoryFile, JSON.stringify(this.memory, null, 2))
    } catch (error) {
      console.log('Error saving session memory:', error.message)
    }
  }
}

module.exports = { SessionMemory }
