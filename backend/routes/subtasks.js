const express = require('express');
const router = express.Router();
const Subtask = require('../models/Subtask');

// Get subtasks document for a todo
router.get('/todo/:todoId', async (req, res) => {
  try {
    const { todoId } = req.params;
    const doc = await Subtask.findOne({ todoId }).select('todoId chatId tasksName createdAt updatedAt');
    if (!doc) return res.status(404).json({ success: false, error: 'Subtasks not found' });
    res.json({ success: true, data: doc });
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch subtasks' });
  }
});

// Get subtasks by subtask document id
router.get('/:subtaskId', async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const doc = await Subtask.findById(subtaskId).select('todoId chatId tasksName createdAt updatedAt');
    if (!doc) return res.status(404).json({ success: false, error: 'Subtasks not found' });
    res.json({ success: true, data: doc });
  } catch (error) {
    console.error('Error fetching subtasks by id:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch subtasks by id' });
  }
});

module.exports = router;


