const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  content: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'agent'],
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'step', 'summary', 'error', 'todo', 'todoList'],
    default: 'text'
  },
  // For step messages (AI agent tasks) and todo messages
  stepData: {
    // For step messages
    tool: String,
    explanation: String,
    parameters: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ['active', 'completed', 'error'],
      default: 'active'
    },
    linesAdded: Number,
    linesRemoved: Number,
    filePath: String,
    error: String,
    
    // For todo messages
    tasks: [{
      id: Number,
      text: String,
      status: {
        type: String,
        enum: ['pending', 'active', 'completed', 'error'],
        default: 'pending'
      },
      subtasks: [{
        id: Number,
        text: String,
        status: {
          type: String,
          enum: ['pending', 'active', 'completed', 'error'],
          default: 'pending'
        },
        tool: String,
        parameters: mongoose.Schema.Types.Mixed,
        result: mongoose.Schema.Types.Mixed
      }]
    }],
    currentThought: String,
    progress: {
      completed: Number,
      total: Number,
      percent: Number
    }
  },
  // For regular messages
  metadata: {
    timestamp: {
      type: Date,
      default: Date.now
    },
    projectContext: String, // The project that was active when message was sent
    agentProcessing: Boolean // Whether agent was processing when message was sent
  }
  ,
  // Optional top-level tasks mapping for ordered Todo references
  tasks: {
    type: Map,
    of: mongoose.Schema.Types.ObjectId,
    default: undefined
  },
  // For todoList messages - array of task objects
  todoListTasks: [{
    taskId: {
      type: Number,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'done', 'failed'],
      default: 'pending'
    },
    tool: {
      type: String,
    }
  }]
}, {
  timestamps: true
});

// Index for efficient querying

module.exports = mongoose.model('Message', messageSchema);
