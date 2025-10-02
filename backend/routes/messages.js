const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Chat = require('../models/Chat');

// Create a new message
router.post('/', async (req, res) => {
  try {
    const { chatId, content, role, messageType, stepData, metadata } = req.body;
    
    // Validate required fields
    if (!chatId || !content || !role) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: chatId, content, role' 
      });
    }
    
    // Create the message
    const message = new Message({
      chatId,
      content,
      role,
      messageType: messageType || 'text',
      stepData: stepData || null,
      metadata: {
        timestamp: new Date(),
        projectContext: metadata?.projectContext || null,
        agentProcessing: metadata?.agentProcessing || false,
        ...metadata
      }
    });
    
    await message.save();
    
    // Update chat's last message time and message count
    await Chat.findByIdAndUpdate(chatId, {
      lastMessageAt: new Date(),
      $inc: { messageCount: 1 }
    });
    
    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ success: false, error: 'Failed to create message' });
  }
});

// Update a message (useful for step messages)
router.put('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const updateData = req.body;
    
    const message = await Message.findByIdAndUpdate(
      messageId,
      updateData,
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    
    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ success: false, error: 'Failed to update message' });
  }
});

// Get messages for a specific chat
router.get('/chat/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const messages = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('content role messageType stepData metadata createdAt todoListTasks');
    
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

// Delete a message
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findByIdAndDelete(messageId);
    
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    
    // Update chat's message count
    await Chat.findByIdAndUpdate(message.chatId, {
      $inc: { messageCount: -1 }
    });
    
    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, error: 'Failed to delete message' });
  }
});

module.exports = router;

