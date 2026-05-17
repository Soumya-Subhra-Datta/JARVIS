const { query } = require('../config/db');

const getNotes = async (req, res, next) => {
  try {
    const { search } = req.query;
    let sql = 'SELECT id, title, content, created_at, updated_at FROM notes WHERE user_id = ?';
    const params = [req.user.id];

    if (search) {
      sql += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY updated_at DESC';
    const notes = await query(sql, params);
    res.json({ notes });
  } catch (err) {
    next(err);
  }
};

const createNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }
    const result = await query(
      'INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)',
      [req.user.id, title, content || '']
    );
    await query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'note_created', JSON.stringify({ note_id: result.insertId, title })]
    );
    res.status(201).json({
      note: { id: result.insertId, title, content: content || '' }
    });
  } catch (err) {
    next(err);
  }
};

const updateNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    await query(
      'UPDATE notes SET title = COALESCE(?, title), content = COALESCE(?, content) WHERE id = ? AND user_id = ?',
      [title, content, req.params.id, req.user.id]
    );
    res.json({ message: 'Note updated.' });
  } catch (err) {
    next(err);
  }
};

const deleteNote = async (req, res, next) => {
  try {
    await query('DELETE FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Note deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotes, createNote, updateNote, deleteNote };
