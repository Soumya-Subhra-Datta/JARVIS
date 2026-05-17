const { query } = require('../config/db');

const getLogs = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const logs = await query(
      'SELECT id, action, details, created_at FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [req.user.id, parseInt(limit) || 50]
    );
    res.json({ logs });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLogs };
