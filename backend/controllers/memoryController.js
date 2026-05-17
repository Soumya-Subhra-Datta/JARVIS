const { query } = require('../config/db');

const getMemories = async (req, res, next) => {
  try {
    const memories = await query(
      'SELECT id, content, category, created_at FROM memories WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ memories });
  } catch (err) {
    next(err);
  }
};

const addMemory = async (req, res, next) => {
  try {
    const { content, category } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required.' });
    }
    const result = await query(
      'INSERT INTO memories (user_id, content, category) VALUES (?, ?, ?)',
      [req.user.id, content, category || 'general']
    );
    await query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'memory_added', JSON.stringify({ memory_id: result.insertId })]
    );
    res.status(201).json({
      memory: { id: result.insertId, content, category: category || 'general' }
    });
  } catch (err) {
    next(err);
  }
};

const deleteMemory = async (req, res, next) => {
  try {
    await query('DELETE FROM memories WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Memory deleted.' });
  } catch (err) {
    next(err);
  }
};

const clearMemories = async (req, res, next) => {
  try {
    await query('DELETE FROM memories WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'All memories cleared.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMemories, addMemory, deleteMemory, clearMemories };
