const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');

// Get all chats
router.get('/', async (req, res) => {
  try {
    const chats = await Chat.find({ status: 'active' })
      .sort({ lastMessageAt: -1 })
      .select('_id name description projectName createdAt lastMessageAt messageCount');
    
    res.json({ success: true, data: chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch chats' });
  }
});

// Create a new chat
router.post('/', async (req, res) => {
  try {
    const { name, description, projectName } = req.body;
    
    const chat = new Chat({
      name: name || 'New Chat',
      description: description || '',
      projectName: projectName || null
    });
    
    await chat.save();
    
    res.json({ success: true, data: chat });
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ success: false, error: 'Failed to create chat' });
  }
});

// Get a specific chat with messages
router.get('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    
    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .select('content role messageType stepData metadata createdAt');
    
    res.json({ 
      success: true, 
      data: { 
        chat, 
        messages 
      } 
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch chat' });
  }
});

// Update chat name
router.put('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { name, description } = req.body;
    
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      { 
        name: name || chat.name,
        description: description || chat.description,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    
    res.json({ success: true, data: chat });
  } catch (error) {
    console.error('Error updating chat:', error);
    res.status(500).json({ success: false, error: 'Failed to update chat' });
  }
});

// Delete a chat (soft delete)
router.delete('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      { status: 'deleted' },
      { new: true }
    );
    
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    
    res.json({ success: true, data: chat });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ success: false, error: 'Failed to delete chat' });
  }
});

module.exports = router;

