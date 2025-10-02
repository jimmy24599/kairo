const fs = require('fs-extra')
const path = require('path')
const crypto = require('crypto')

class SemanticSearch {
  constructor(projectRoot) {
    this.projectRoot = projectRoot
    this.embeddingsCache = new Map()
    this.cacheFile = path.join(projectRoot, '.semantic-cache.json')
    this.loadCache()
  }

  /**
   * Semantic search using embeddings
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Object} Search results
   */
  async semantic_search(query, options = {}) {
    try {
      const {
        limit = 10,
        threshold = 0.7,
        fileTypes = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c'],
        includeContent = true
      } = options

      // Get all relevant files
      const files = await this.getRelevantFiles(fileTypes)
      
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query)
      
      // Search through files
      const results = []
      
      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8')
          const chunks = this.chunkContent(content, file)
          
          for (const chunk of chunks) {
            const similarity = await this.calculateSimilarity(queryEmbedding, chunk.embedding)
            
            if (similarity >= threshold) {
              results.push({
                file: path.relative(this.projectRoot, file),
                content: includeContent ? chunk.content : undefined,
                similarity,
                line: chunk.line,
                context: chunk.context
              })
            }
          }
        } catch (error) {
          console.log(`Error processing file ${file}:`, error.message)
        }
      }
      
      // Sort by similarity and limit results
      results.sort((a, b) => b.similarity - a.similarity)
      
      return {
        success: true,
        query,
        results: results.slice(0, limit),
        totalFiles: files.length,
        threshold
      }
    } catch (error) {
      throw new Error(`Semantic search failed: ${error.message}`)
    }
  }

  /**
   * Generate embeddings for all files in project
   * @param {Array} fileTypes - File extensions to process
   * @returns {Object} Generation result
   */
  async generate_embeddings(fileTypes = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c']) {
    try {
      const files = await this.getRelevantFiles(fileTypes)
      let processed = 0
      let errors = 0
      
      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8')
          const chunks = this.chunkContent(content, file)
          
          for (const chunk of chunks) {
            if (!this.embeddingsCache.has(chunk.hash)) {
              chunk.embedding = await this.generateEmbedding(chunk.content)
              this.embeddingsCache.set(chunk.hash, chunk.embedding)
            }
          }
          
          processed++
        } catch (error) {
          console.log(`Error processing file ${file}:`, error.message)
          errors++
        }
      }
      
      // Save cache
      await this.saveCache()
      
      return {
        success: true,
        processed,
        errors,
        totalEmbeddings: this.embeddingsCache.size
      }
    } catch (error) {
      throw new Error(`Embedding generation failed: ${error.message}`)
    }
  }

  /**
   * Find similar code blocks
   * @param {string} code - Code to find similar blocks for
   * @param {Object} options - Search options
   * @returns {Object} Similar code results
   */
  async find_similar_code(code, options = {}) {
    try {
      const {
        limit = 5,
        threshold = 0.8,
        fileTypes = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c']
      } = options

      const codeEmbedding = await this.generateEmbedding(code)
      const files = await this.getRelevantFiles(fileTypes)
      const results = []
      
      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8')
          const chunks = this.chunkContent(content, file)
          
          for (const chunk of chunks) {
            const similarity = await this.calculateSimilarity(codeEmbedding, chunk.embedding)
            
            if (similarity >= threshold) {
              results.push({
                file: path.relative(this.projectRoot, file),
                content: chunk.content,
                similarity,
                line: chunk.line,
                context: chunk.context
              })
            }
          }
        } catch (error) {
          console.log(`Error processing file ${file}:`, error.message)
        }
      }
      
      results.sort((a, b) => b.similarity - a.similarity)
      
      return {
        success: true,
        results: results.slice(0, limit),
        totalFiles: files.length
      }
    } catch (error) {
      throw new Error(`Similar code search failed: ${error.message}`)
    }
  }

  // Helper methods

  async getRelevantFiles(fileTypes) {
    const files = []
    
    const walkDir = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await walkDir(fullPath)
        } else if (entry.isFile() && fileTypes.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath)
        }
      }
    }
    
    await walkDir(this.projectRoot)
    return files
  }

  chunkContent(content, filePath) {
    const lines = content.split('\n')
    const chunks = []
    const chunkSize = 10 // lines per chunk
    const overlap = 2 // overlapping lines
    
    for (let i = 0; i < lines.length; i += chunkSize - overlap) {
      const chunkLines = lines.slice(i, i + chunkSize)
      const chunkContent = chunkLines.join('\n')
      
      // Skip very short chunks
      if (chunkContent.trim().length < 50) continue
      
      const hash = crypto.createHash('md5').update(chunkContent).digest('hex')
      
      chunks.push({
        content: chunkContent,
        line: i + 1,
        hash,
        context: this.getContext(lines, i, chunkSize),
        embedding: this.embeddingsCache.get(hash) || null
      })
    }
    
    return chunks
  }

  getContext(lines, startLine, chunkSize) {
    const contextStart = Math.max(0, startLine - 5)
    const contextEnd = Math.min(lines.length, startLine + chunkSize + 5)
    return lines.slice(contextStart, contextEnd).join('\n')
  }

  async generateEmbedding(text) {
    // Simple embedding generation using text features
    // In a real implementation, you would use OpenAI embeddings or similar
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
    
    // Create a simple bag-of-words embedding
    const embedding = new Array(100).fill(0)
    const wordFreq = {}
    
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1
    })
    
    // Convert to vector using hash-based indexing
    Object.entries(wordFreq).forEach(([word, freq]) => {
      const hash = crypto.createHash('md5').update(word).digest('hex')
      const index = parseInt(hash.substring(0, 2), 16) % 100
      embedding[index] += freq
    })
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0)
  }

  async calculateSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2) return 0
    
    // Cosine similarity
    let dotProduct = 0
    let magnitude1 = 0
    let magnitude2 = 0
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i]
      magnitude1 += embedding1[i] * embedding1[i]
      magnitude2 += embedding2[i] * embedding2[i]
    }
    
    magnitude1 = Math.sqrt(magnitude1)
    magnitude2 = Math.sqrt(magnitude2)
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0
    
    return dotProduct / (magnitude1 * magnitude2)
  }

  async loadCache() {
    try {
      if (await fs.pathExists(this.cacheFile)) {
        const cacheData = await fs.readFile(this.cacheFile, 'utf-8')
        const cache = JSON.parse(cacheData)
        this.embeddingsCache = new Map(cache.embeddings || [])
      }
    } catch (error) {
      console.log('Error loading semantic cache:', error.message)
    }
  }

  async saveCache() {
    try {
      const cacheData = {
        embeddings: Array.from(this.embeddingsCache.entries()),
        timestamp: Date.now()
      }
      await fs.writeFile(this.cacheFile, JSON.stringify(cacheData, null, 2))
    } catch (error) {
      console.log('Error saving semantic cache:', error.message)
    }
  }
}

module.exports = { SemanticSearch }
