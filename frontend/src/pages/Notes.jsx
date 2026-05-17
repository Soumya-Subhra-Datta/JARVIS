import { useState, useEffect } from 'react';
import { notesApi } from '../api/api';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });

  useEffect(() => { loadNotes(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadNotes(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadNotes = async (q) => {
    try {
      const res = await notesApi.getNotes(q);
      setNotes(res.data.notes || []);
    } catch (err) {} finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '' });
    setShowModal(true);
  };

  const openEdit = (note) => {
    setEditing(note);
    setForm({ title: note.title, content: note.content || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      if (editing) {
        await notesApi.updateNote(editing.id, form);
        toast.success('Note updated');
      } else {
        await notesApi.createNote(form);
        toast.success('Note created');
      }
      setShowModal(false);
      loadNotes(search);
    } catch (err) {
      toast.error('Failed to save note');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this note?')) return;
    try {
      await notesApi.deleteNote(id);
      toast.success('Note deleted');
      loadNotes(search);
    } catch (err) {}
  };

  const truncate = (text, len = 100) => {
    if (!text) return '';
    return text.length > len ? text.substring(0, len) + '...' : text;
  };

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left">
          <span className="page-title">Notes</span>
        </div>
        <div className="topbar-right">
          <div className="search-input">
            <FiSearch className="search-icon" size={14} />
            <input
              type="text"
              className="form-input"
              placeholder="Search notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 200 }}
            />
          </div>
          <button className="btn btn-primary" onClick={openCreate}><FiPlus /> New Note</button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="empty-state"><p>Loading notes...</p></div>
        ) : notes.length === 0 ? (
          <div className="empty-state">
            <FiFileText className="empty-state-icon" />
            <p>{search ? 'No notes match your search' : 'No notes yet'}</p>
            <button className="btn btn-primary mt-16" onClick={openCreate}>Create Your First Note</button>
          </div>
        ) : (
          <div className="grid-3">
            {notes.map(note => (
              <div key={note.id} className="card" style={{ cursor: 'pointer' }} onClick={() => openEdit(note)}>
                <div className="flex justify-between items-center mb-8">
                  <h3 style={{ fontSize: 15, fontWeight: 600 }} className="truncate">{note.title}</h3>
                  <button className="btn btn-icon btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}>
                    <FiTrash2 size={14} />
                  </button>
                </div>
                <p className="text-muted text-sm">{truncate(note.content)}</p>
                <div className="text-xs text-muted mt-8">
                  {new Date(note.updated_at || note.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Note' : 'New Note'}>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input type="text" className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Note title" />
        </div>
        <div className="form-group">
          <label className="form-label">Content</label>
          <textarea className="form-textarea" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your note..." rows={6} />
        </div>
        <button className="btn btn-primary w-full" onClick={handleSave}>
          {editing ? 'Update Note' : 'Create Note'}
        </button>
      </Modal>
    </div>
  );
}

function FiFileText(props) { return <svg {...props} stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>; }
