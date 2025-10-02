const mongoose = require('mongoose');

const subtaskItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tool: { type: String, required: true },
  parameters: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['pending', 'running', 'done', 'failed', 'skipped'], default: 'pending' }
}, { _id: false });

const subtaskSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
  todoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Todo', required: true, index: true },
  tasksName: { type: Map, of: subtaskItemSchema, required: true }
}, { timestamps: true });


module.exports = mongoose.model('Subtask', subtaskSchema);


