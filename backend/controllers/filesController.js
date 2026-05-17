const { query } = require('../config/db');
const { processFile } = require('../services/fileProcessor');
const { getAIResponse } = require('../services/cerebrasAI');
const fs = require('fs');
const path = require('path');

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const file = req.file;
    const result = await query(
      'INSERT INTO uploaded_files (user_id, filename, original_name, mime_type, size, storage_path) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, file.filename, file.originalname, file.mimetype, file.size, file.path]
    );

    await query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'file_uploaded', JSON.stringify({ file_id: result.insertId, name: file.originalname })]
    );

    res.status(201).json({
      file: {
        id: result.insertId,
        filename: file.filename,
        original_name: file.originalname,
        mime_type: file.mimetype,
        size: file.size
      }
    });
  } catch (err) {
    next(err);
  }
};

const getFiles = async (req, res, next) => {
  try {
    const files = await query(
      'SELECT id, filename, original_name, mime_type, size, created_at FROM uploaded_files WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ files });
  } catch (err) {
    next(err);
  }
};

const getFile = async (req, res, next) => {
  try {
    const files = await query(
      'SELECT id, filename, original_name, mime_type, size, storage_path, created_at FROM uploaded_files WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (files.length === 0) {
      return res.status(404).json({ error: 'File not found.' });
    }
    res.json({ file: files[0] });
  } catch (err) {
    next(err);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const files = await query(
      'SELECT storage_path FROM uploaded_files WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (files.length > 0) {
      try {
        if (fs.existsSync(files[0].storage_path)) {
          fs.unlinkSync(files[0].storage_path);
        }
      } catch (e) {}
      await query('DELETE FROM csv_datasets WHERE file_id = ?', [req.params.id]);
      await query('DELETE FROM uploaded_files WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    }
    res.json({ message: 'File deleted.' });
  } catch (err) {
    next(err);
  }
};

const askFile = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const files = await query(
      'SELECT id, filename, original_name, mime_type, storage_path FROM uploaded_files WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (files.length === 0) {
      return res.status(404).json({ error: 'File not found.' });
    }

    const file = files[0];
    const processed = await processFile(file.storage_path, file.mime_type);

    if (!processed.success) {
      return res.status(400).json({ error: processed.error || 'Failed to process file.' });
    }

    const textPreview = processed.text.substring(0, 3000);
    const context = `File: ${file.original_name}\nContent:\n${textPreview}\n\nUser question: ${question}`;

    const memories = await query('SELECT content, category FROM memories WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [req.user.id]);
    const aiResponse = await getAIResponse({
      message: context,
      memories,
      fileContext: `The user is asking about their file "${file.original_name}". Here is the content:\n${textPreview}`
    });

    res.json({
      answer: aiResponse.message,
      emotion: aiResponse.emotion
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadFile, getFiles, getFile, deleteFile, askFile };
