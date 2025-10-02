const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

// Get todos for a specific chat, ordered by 'order'
router.get('/chat/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const todos = await Todo.find({ chatId })
      .sort({ order: 1 })
      .select('taskName order status subtask createdAt updatedAt');
    res.json({ success: true, data: todos });
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch todos' });
  }
});

// Get a specific todo by id
router.get('/:todoId', async (req, res) => {
  try {
    const { todoId } = req.params;
    const todo = await Todo.findById(todoId).select('taskName order status subtask createdAt updatedAt');
    if (!todo) return res.status(404).json({ success: false, error: 'Todo not found' });
    res.json({ success: true, data: todo });
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch todo' });
  }
});

module.exports = router;


