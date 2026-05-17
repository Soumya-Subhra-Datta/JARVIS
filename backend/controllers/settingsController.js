const { query } = require('../config/db');

const getSettings = async (req, res, next) => {
  try {
    const settings = await query(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [req.user.id]
    );
    if (settings.length === 0) {
      const result = await query(
        'INSERT INTO user_settings (user_id) VALUES (?)',
        [req.user.id]
      );
      return res.json({
        settings: {
          assistant_name: 'JARVIS',
          assistant_personality: 'Professional and friendly',
          voice_output: true,
          theme: 'dark',
          system_prompt: null
        }
      });
    }
    const s = settings[0];
    res.json({
      settings: {
        assistant_name: s.assistant_name || 'JARVIS',
        assistant_personality: s.assistant_personality || 'Professional and friendly',
        voice_output: Boolean(s.voice_output),
        theme: s.theme || 'dark',
        system_prompt: s.system_prompt || null
      }
    });
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { assistant_name, assistant_personality, voice_output, theme, system_prompt } = req.body;
    await query(
      `UPDATE user_settings SET 
        assistant_name = COALESCE(?, assistant_name),
        assistant_personality = COALESCE(?, assistant_personality),
        voice_output = COALESCE(?, voice_output),
        theme = COALESCE(?, theme),
        system_prompt = COALESCE(?, system_prompt)
      WHERE user_id = ?`,
      [assistant_name, assistant_personality, voice_output, theme, system_prompt, req.user.id]
    );
    res.json({ message: 'Settings updated.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, updateSettings };
