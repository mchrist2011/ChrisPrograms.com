const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10 // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for gaming content
    cb(null, true);
  }
});

// Upload files
router.post('/upload', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const files = req.files;
    const uploadedFiles = [];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    for (const file of files) {
      try {
        // Generate unique filename
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${req.user.id}/${uuidv4()}.${fileExtension}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('game-files')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          continue;
        }

        // Save file metadata to database
        const { data: fileRecord, error: dbError } = await supabase
          .from('files')
          .insert([{
            original_name: file.originalname,
            file_name: fileName,
            file_size: file.size,
            mime_type: file.mimetype,
            uploaded_by: req.user.id,
            storage_path: uploadData.path,
            is_public: true
          }])
          .select(`
            *,
            users:uploaded_by (username)
          `)
          .single();

        if (!dbError && fileRecord) {
          uploadedFiles.push(fileRecord);
        }
      } catch (fileError) {
        console.error('File processing error:', fileError);
        continue;
      }
    }

    if (uploadedFiles.length === 0) {
      return res.status(500).json({ error: 'All file uploads failed' });
    }

    res.json({ 
      files: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get all files
router.get('/', async (req, res) => {
  try {
    const { data: files, error } = await supabase
      .from('files')
      .select(`
        *,
        users:uploaded_by (username, email)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ files: files || [] });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Download file
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get file info
    const { data: file, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if user can access file
    if (!file.is_public && file.uploaded_by !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get signed download URL
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('game-files')
      .createSignedUrl(file.storage_path, 3600); // 1 hour expiry

    if (urlError) {
      return res.status(500).json({ error: 'Failed to generate download URL' });
    }

    // Increment download count
    await supabase
      .from('files')
      .update({ download_count: file.download_count + 1 })
      .eq('id', id);

    res.json({ 
      downloadUrl: signedUrl.signedUrl,
      fileName: file.original_name
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Delete file (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get file info first
    const { data: file, error: fetchError } = await supabase
      .from('files')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (fetchError || !file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('game-files')
      .remove([file.storage_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', id);

    if (dbError) {
      return res.status(500).json({ error: dbError.message });
    }

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;