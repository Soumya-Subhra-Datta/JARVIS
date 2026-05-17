import { useState, useEffect } from 'react';
import { memoryApi } from '../api/api';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiCpu, FiAlertCircle } from 'react-icons/fi';

export default function Memory() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ content: '', category: 'general' });

  useEffect(() => { loadMemories(); }, []);

  const loadMemories = async () => {
    try {
      const res = await memoryApi.getMemories();
      setMemories(res.data.memories || []);
    } catch (err) {} finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!form.content.trim()) { toast.error('Content is required'); return; }
    try {
      await memoryApi.addMemory(form);
      toast.success('Memory saved');
      setShowModal(false);
      setForm({ content: '', category: 'general' });
      loadMemories();
    } catch (err) { toast.error('Failed to save memory'); }
  };

  const handleDelete = async (id) => {
    try {
      await memoryApi.deleteMemory(id);
      toast.success('Memory deleted');
      loadMemories();
    } catch (err) {}
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all memories? This cannot be undone.')) return;
    try {
      await memoryApi.clearMemories();
      toast.success('All memories cleared');
      loadMemories();
    } catch (err) {}
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'preference': return '⭐';
      case 'note': return '📝';
      case 'fact': return '💡';
      default: return '🧠';
    }
  };

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left">
          <span className="page-title">Memory</span>
        </div>
        <div className="topbar-right">
          <button className="btn btn-secondary" onClick={handleClearAll} disabled={memories.length === 0}>
            <FiAlertCircle /> Clear All
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <FiPlus /> Add Memory
          </button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="empty-state"><p>Loading memories...</p></div>
        ) : memories.length === 0 ? (
          <div className="empty-state">
            <FiCpu className="empty-state-icon" />
            <p>No memories saved. JARVIS remembers things you teach it!</p>
            <button className="btn btn-primary mt-16" onClick={() => setShowModal(true)}>Add Your First Memory</button>
          </div>
        ) : (
          <div className="grid-3">
            {memories.map(m => (
              <div key={m.id} className="card">
                <div className="flex justify-between items-center mb-8">
                  <span style={{ fontSize: 20 }}>{getCategoryIcon(m.category)}</span>
                  <button className="btn btn-icon btn-secondary btn-sm" onClick={() => handleDelete(m.id)}>
                    <FiTrash2 size={14} />
                  </button>
                </div>
                <p className="text-sm" style={{ lineHeight: 1.5 }}>{m.content}</p>
                <div className="flex justify-between items-center mt-8">
                  <span className="text-xs text-muted" style={{ textTransform: 'capitalize' }}>{m.category}</span>
                  <span className="text-xs text-muted">{new Date(m.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Memory">
        <div className="form-group">
          <label className="form-label">What should JARVIS remember?</label>
          <textarea
            className="form-textarea"
            value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
            placeholder="e.g., User prefers concise answers, User is working on a React project..."
            rows={4}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            <option value="general">General</option>
            <option value="preference">Preference</option>
            <option value="note">Note</option>
            <option value="fact">Fact/Knowledge</option>
          </select>
        </div>
        <button className="btn btn-primary w-full" onClick={handleAdd}>Save Memory</button>
      </Modal>
    </div>
  );
}
