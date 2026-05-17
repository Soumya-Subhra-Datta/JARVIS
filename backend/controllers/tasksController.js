const { query } = require('../config/db');

const getTasks = async (req, res, next) => {
  try {
    const tasks = await query(
      'SELECT id, title, description, priority, due_date, status, created_at FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, due_date } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }
    const result = await query(
      'INSERT INTO tasks (user_id, title, description, priority, due_date) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, title, description || null, priority || 'medium', due_date || null]
    );
    await query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'task_created', JSON.stringify({ task_id: result.insertId, title })]
    );
    res.status(201).json({
      task: { id: result.insertId, title, description, priority, due_date, status: 'pending' }
    });
  } catch (err) {
    next(err);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { title, description, priority, due_date, status } = req.body;
    await query(
      'UPDATE tasks SET title = COALESCE(?, title), description = COALESCE(?, description), priority = COALESCE(?, priority), due_date = COALESCE(?, due_date), status = COALESCE(?, status) WHERE id = ? AND user_id = ?',
      [title, description, priority, due_date, status, req.params.id, req.user.id]
    );
    res.json({ message: 'Task updated.' });
  } catch (err) {
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    await query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
