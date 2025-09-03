const express = require('express');
const { supabase } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// AI response generator
function generateAIResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  // Programming-specific responses
  if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('development')) {
    return "I can help with programming questions! Whether it's JavaScript, Python, web development, or debugging - I'm here to assist with your coding journey.";
  }
  
  if (lowerMessage.includes('javascript') || lowerMessage.includes('js')) {
    return "JavaScript is awesome! I can help with vanilla JS, React, Node.js, or any JavaScript framework. What specific help do you need?";
  }
  
  if (lowerMessage.includes('python')) {
    return "Python is great for beginners and experts alike! I can help with syntax, libraries, web development with Django/Flask, or data science projects.";
  }
  
  if (lowerMessage.includes('html') || lowerMessage.includes('css')) {
    return "Web development fundamentals! I can help with HTML structure, CSS styling, responsive design, and modern web practices.";
  }
  
  if (lowerMessage.includes('git') || lowerMessage.includes('github')) {
    return "Version control is essential! I can help with Git commands, GitHub workflows, branching strategies, and collaboration best practices.";
  }
  
  if (lowerMessage.includes('database') || lowerMessage.includes('sql')) {
    return "Database development is crucial! I can help with SQL queries, database design, PostgreSQL, MySQL, or NoSQL databases like MongoDB.";
  }
  
  if (lowerMessage.includes('react') || lowerMessage.includes('vue') || lowerMessage.includes('angular')) {
    return "Modern frameworks are powerful! I can help with component architecture, state management, routing, and best practices for your chosen framework.";
  }
  
  if (lowerMessage.includes('api') || lowerMessage.includes('backend')) {
    return "Backend development is my specialty! I can help with REST APIs, GraphQL, authentication, database integration, and server architecture.";
  }
  
  if (lowerMessage.includes('error') || lowerMessage.includes('bug') || lowerMessage.includes('debug')) {
    return "Debugging is part of programming! Describe the error you're encountering and I'll help you troubleshoot and find a solution.";
  }
  
  // Gaming-specific responses
  if (lowerMessage.includes('game') || lowerMessage.includes('download')) {
    return "I can help you find compressed games and gaming resources! Check out our featured sites for safe downloads and gaming tools.";
  }
  
  if (lowerMessage.includes('gta') || lowerMessage.includes('grand theft auto')) {
    return "GTA series is very popular! You can find compressed versions of GTA V, San Andreas, and Vice City on our partner sites.";
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! Welcome to ChrisPrograms! I'm Chris AI, your programming and gaming assistant. How can I help you today?";
  }
  
  // Default responses
  const responses = [
    "I can help with programming, development, gaming, and tech support. What would you like to work on?",
    "Whether you need coding help, game recommendations, or technical troubleshooting - I'm here to assist!",
    "ChrisPrograms offers resources for developers and gamers alike. How can I help you today?",
    "I'm your programming and gaming assistant! Ask me about code, development tools, games, or any tech questions.",
    "From web development to game downloads, I'm here to help with all your programming and gaming needs!",
    "Let me help you with coding, debugging, game resources, or any technical challenges you're facing."
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