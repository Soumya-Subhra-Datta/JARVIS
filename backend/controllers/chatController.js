const { query } = require('../config/db');
const { getAIResponse } = require('../services/cerebrasAI');
const { commandParser } = require('../services/commandParser');
const { searchWeb } = require('../services/searchService');

const sendMessage = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    let session_id = sessionId;

    if (!session_id) {
      const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
      const result = await query(
        'INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)',
        [userId, title]
      );
      session_id = result.insertId;
    }

    await query(
      'INSERT INTO chat_messages (session_id, user_id, role, content) VALUES (?, ?, ?, ?)',
      [session_id, userId, 'user', message]
    );

    const parsed = commandParser(message);
    let aiResponse;
    let intentAction = null;

    if (parsed.intent === 'create_note') {
      const noteData = parsed.data;
      await query(
        'INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)',
        [userId, noteData.title || 'Quick Note', noteData.content]
      );
      intentAction = { type: 'note_created', data: noteData };
    } else if (parsed.intent === 'create_task') {
      const taskData = parsed.data;
      await query(
        'INSERT INTO tasks (user_id, title, priority, due_date) VALUES (?, ?, ?, ?)',
        [userId, taskData.title, taskData.priority || 'medium', taskData.due_date || null]
      );
      intentAction = { type: 'task_created', data: taskData };
    } else if (parsed.intent === 'search_web') {
      const searchResults = await searchWeb(parsed.data.query);
      if (searchResults.success) {
        let context = 'Web search results:\n';
        searchResults.results.forEach((r, i) => {
          context += `${i + 1}. ${r.title}\n   ${r.link}\n   ${r.snippet}\n\n`;
        });
        const memories = await query('SELECT content, category FROM memories WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [userId]);
        const history = await query('SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT 10', [session_id]);
        aiResponse = await getAIResponse({
          message: `Based on these web search results, answer: ${message}\n\nSearch results:\n${context}`,
          memories,
          chatHistory: history.reverse()
        });
        intentAction = { type: 'web_search', data: { query: parsed.data.query, results: searchResults.results.length } };
      } else {
        aiResponse = {
          message: searchResults.message || 'Web search is currently unavailable.',
          emotion: 'neutral'
        };
      }
    } else if (parsed.intent === 'open_website') {
      const siteData = parsed.data;
      aiResponse = {
        message: `Opening ${siteData.site} for you.`,
        emotion: 'happy'
      };
      intentAction = { type: 'open_website', data: siteData };
      await query(
        'INSERT INTO chat_messages (session_id, user_id, role, content) VALUES (?, ?, ?, ?)',
        [session_id, userId, 'assistant', JSON.stringify({ text: aiResponse.message, emotion: aiResponse.emotion, action: intentAction, url: siteData.url })]
      );
      await query(
        'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
        [userId, 'command_executed', JSON.stringify({ intent: 'open_website', data: siteData })]
      );
      return res.json({
        message: aiResponse.message,
        emotion: aiResponse.emotion,
        sessionId: session_id,
        action: { type: 'open_website', url: siteData.url, site: siteData.site }
      });
    }

    if (!aiResponse) {
      const memories = await query('SELECT content, category FROM memories WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [userId]);
      const history = await query('SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT 10', [session_id]);
      aiResponse = await getAIResponse({
        message,
        memories,
        chatHistory: history.reverse()
      });
    }

    await query(
      'INSERT INTO chat_messages (session_id, user_id, role, content) VALUES (?, ?, ?, ?)',
      [session_id, userId, 'assistant', JSON.stringify(aiResponse)]
    );

    await query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [userId, 'chat_message', JSON.stringify({ session_id, intent: parsed.intent })]
    );

    if (intentAction) {
      await query(
        'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
        [userId, intentAction.type, JSON.stringify(intentAction.data)]
      );
    }

    res.json({
      message: aiResponse.message,
      emotion: aiResponse.emotion,
      sessionId: session_id,
      action: intentAction
    });
  } catch (err) {
    next(err);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const sessions = await query(
      'SELECT id, title, created_at, updated_at FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
};

const createSession = async (req, res, next) => {
  try {
    const { title } = req.body;
    const result = await query(
      'INSERT INTO chat_sessions (user_id, title) VALUES (?, ?)',
      [req.user.id, title || 'New Chat']
    );
    res.status(201).json({
      session: { id: result.insertId, user_id: req.user.id, title: title || 'New Chat' }
    });
  } catch (err) {
    next(err);
  }
};

const getSession = async (req, res, next) => {
  try {
    const sessions = await query(
      'SELECT id, title, created_at, updated_at FROM chat_sessions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (sessions.length === 0) {
      return res.status(404).json({ error: 'Session not found.' });
    }
    const messages = await query(
      'SELECT id, role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json({ session: sessions[0], messages });
  } catch (err) {
    next(err);
  }
};

const updateSession = async (req, res, next) => {
  try {
    const { title } = req.body;
    await query(
      'UPDATE chat_sessions SET title = ? WHERE id = ? AND user_id = ?',
      [title, req.params.id, req.user.id]
    );
    res.json({ message: 'Session updated.' });
  } catch (err) {
    next(err);
  }
};

const deleteSession = async (req, res, next) => {
  try {
    await query('DELETE FROM chat_messages WHERE session_id = ? AND user_id = ?', [req.params.id, req.user.id]);
    await query('DELETE FROM chat_sessions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Session deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendMessage, getSessions, createSession, getSession, updateSession, deleteSession };
