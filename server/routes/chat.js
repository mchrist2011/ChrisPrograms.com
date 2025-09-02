const express = require('express');
const { supabase } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// AI response generator
function generateAIResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  // Gaming-specific responses
  if (lowerMessage.includes('game') || lowerMessage.includes('download')) {
    return "I can help you find the best compressed games! Check out our featured sites like Compressed Game Hub for safe downloads.";
  }
  
  if (lowerMessage.includes('gta') || lowerMessage.includes('grand theft auto')) {
    return "GTA series is very popular! You can find compressed versions of GTA V, San Andreas, and Vice City on our partner sites.";
  }
  
  if (lowerMessage.includes('programming') || lowerMessage.includes('code')) {
    return "Great! I can help with programming questions. ChrisPrograms offers resources for Python, JavaScript, and web development.";
  }
  
  if (lowerMessage.includes('error') || lowerMessage.includes('problem')) {
    return "I'm here to help solve your gaming or programming issues! Please describe the specific error you're encountering.";
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! Welcome to ChrisPrograms! I'm Chris AI, your gaming and programming assistant. How can I help you today?";
  }
  
  // Default responses
  const responses = [
    "That's an interesting question! As your ChrisPrograms assistant, I'm here to help with gaming, downloads, and programming.",
    "I can assist with game recommendations, troubleshooting, and finding the best compressed downloads.",
    "Thanks for using ChrisPrograms! What specific gaming or programming help do you need?",
    "I'm designed to help with all things gaming and coding. Feel free to ask about downloads, errors, or programming questions!",
    "Let me help you with that! ChrisPrograms has extensive resources for gamers and developers.",
    "Great question! I'm here 24/7 to assist with gaming, programming, and technical support."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Get chat messages
router.get('/messages', authenticateToken, async (req, res) => {
  try {
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        users:user_id (username, email)
      `)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ messages: messages || [] });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message
router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { message, isAI = false } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Insert user message
    const { data: newMessage, error } = await supabase
      .from('chat_messages')
      .insert([{
        user_id: req.user.id,
        message: message.trim(),
        is_ai: isAI
      }])
      .select(`
        *,
        users:user_id (username, email)
      `)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Generate AI response if this is a user message
    if (!isAI) {
      setTimeout(async () => {
        try {
          const aiResponse = generateAIResponse(message);
          await supabase
            .from('chat_messages')
            .insert([{
              user_id: req.user.id,
              message: aiResponse,
              is_ai: true
            }]);
        } catch (aiError) {
          console.error('AI response error:', aiError);
        }
      }, 1000 + Math.random() * 2000); // Random delay 1-3 seconds
    }

    res.status(201).json({ message: newMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Delete message (admin only)
router.delete('/messages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin or message owner
    const { data: message } = await supabase
      .from('chat_messages')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;