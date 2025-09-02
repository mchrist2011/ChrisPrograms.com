const express = require('express');
const { supabase } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get admin statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [usersResult, filesResult, messagesResult] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('files').select('id', { count: 'exact', head: true }),
      supabase.from('chat_messages').select('id', { count: 'exact', head: true })
    ]);

    // Get storage usage
    const { data: storageData } = await supabase.storage
      .from('game-files')
      .list('', { limit: 1000 });

    let totalStorageSize = 0;
    if (storageData) {
      totalStorageSize = storageData.reduce((total, file) => total + (file.metadata?.size || 0), 0);
    }

    res.json({
      users: usersResult.count || 0,
      files: filesResult.count || 0,
      messages: messagesResult.count || 0,
      storageUsed: Math.round(totalStorageSize / 1024 / 1024), // MB
      serverUptime: process.uptime()
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, is_admin, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ users: users || [] });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Toggle user admin status
router.patch('/users/:id/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;

    // Prevent removing admin from self
    if (id === req.user.id && !isAdmin) {
      return res.status(400).json({ error: 'Cannot remove admin status from yourself' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ is_admin: isAdmin })
      .eq('id', id)
      .select('id, username, email, is_admin')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Delete user's files from storage first
    const { data: userFiles } = await supabase
      .from('files')
      .select('storage_path')
      .eq('uploaded_by', id);

    if (userFiles && userFiles.length > 0) {
      const filePaths = userFiles.map(f => f.storage_path);
      await supabase.storage
        .from('game-files')
        .remove(filePaths);
    }

    // Delete user (cascade will handle related records)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get system logs (simplified)
router.get('/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // In a real application, you'd have a proper logging system
    const logs = [
      { timestamp: new Date(), level: 'INFO', message: 'Server started successfully' },
      { timestamp: new Date(Date.now() - 60000), level: 'INFO', message: 'Database connected' },
      { timestamp: new Date(Date.now() - 120000), level: 'INFO', message: 'Storage bucket initialized' }
    ];

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

module.exports = router;