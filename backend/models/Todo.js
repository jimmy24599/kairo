const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  taskName: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'done', 'failed'],
    default: 'pending',
    index: true
  },
  subtask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subtask',
    index: true,
    default: null
  }
}, {
  timestamps: true
});

// Remove the unique constraint to allow multiple todo lists per chat
// We'll group todos by creation time instead

module.exports = mongoose.model('Todo', todoSchema);


