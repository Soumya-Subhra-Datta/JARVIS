import { useState, useEffect } from 'react';
import { settingsApi, chatApi, memoryApi } from '../api/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    assistant_name: 'JARVIS',
    assistant_personality: 'Professional and friendly',
    voice_output: true,
    theme: 'dark',
    system_prompt: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const res = await settingsApi.getSettings();
      setSettings(res.data.settings);
    } catch (err) {} finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.updateSettings(settings);
      toast.success('Settings saved');
    } catch (err) { toast.error('Failed to save settings'); } finally { setSaving(false); }
  };

  const handleClearChats = async () => {
    if (!confirm('Clear all chat history? This cannot be undone.')) return;
    try {
      const sessions = await chatApi.getSessions();
      for (const s of sessions.data.sessions || []) {
        await chatApi.deleteSession(s.id);
      }
      toast.success('Chat history cleared');
    } catch (err) { toast.error('Failed to clear chats'); }
  };

  const handleClearMemories = async () => {
    if (!confirm('Clear all memories? This cannot be undone.')) return;
    try {
      await memoryApi.clearMemories();
      toast.success('Memories cleared');
    } catch (err) { toast.error('Failed to clear memories'); }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone!')) return;
    toast.error('Account deletion is not implemented in this demo');
  };

  if (loading) return <div className="page-content"><div className="empty-state"><p>Loading settings...</p></div></div>;

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left">
          <span className="page-title">Settings</span>
        </div>
        <div className="topbar-right">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: 700 }}>
        <div className="card">
          <div className="settings-section">
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>AI Assistant</h3>
            <div className="form-group">
              <label className="form-label">Assistant Name</label>
              <input type="text" className="form-input" value={settings.assistant_name} onChange={e => setSettings({ ...settings, assistant_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Personality</label>
              <select className="form-select" value={settings.assistant_personality} onChange={e => setSettings({ ...settings, assistant_personality: e.target.value })}>
                <option>Professional and friendly</option>
                <option>Casual and humorous</option>
                <option>Formal and precise</option>
                <option>Enthusiastic and motivational</option>
                <option>Minimalist and efficient</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">System Prompt (advanced)</label>
              <textarea className="form-textarea" value={settings.system_prompt} onChange={e => setSettings({ ...settings, system_prompt: e.target.value })} placeholder="Custom system prompt for AI behavior..." rows={4} />
            </div>
          </div>

          <div className="settings-section">
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>Preferences</h3>
            <div className="settings-row">
              <span style={{ fontSize: 14 }}>Voice Output</span>
              <div className={`toggle ${settings.voice_output ? 'active' : ''}`} onClick={() => setSettings({ ...settings, voice_output: !settings.voice_output })} />
            </div>
            <div className="settings-row">
              <span style={{ fontSize: 14 }}>Theme</span>
              <select className="form-select" value={settings.theme} onChange={e => setSettings({ ...settings, theme: e.target.value })} style={{ width: 150 }}>
                <option value="dark">Dark</option>
                <option value="light">Light (coming soon)</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>Data Management</h3>
            <div className="settings-row">
              <div>
                <div style={{ fontSize: 14 }}>Clear Chat History</div>
                <div className="text-xs text-muted">Delete all conversations</div>
              </div>
              <button className="btn btn-sm btn-danger" onClick={handleClearChats}>Clear</button>
            </div>
            <div className="settings-row">
              <div>
                <div style={{ fontSize: 14 }}>Clear Memories</div>
                <div className="text-xs text-muted">Delete everything JARVIS remembers</div>
              </div>
              <button className="btn btn-sm btn-danger" onClick={handleClearMemories}>Clear</button>
            </div>
            <div className="settings-row">
              <div>
                <div style={{ fontSize: 14, color: 'var(--danger)' }}>Delete Account</div>
                <div className="text-xs text-muted">Permanently delete your account and all data</div>
              </div>
              <button className="btn btn-sm btn-danger" onClick={handleDeleteAccount}>Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
