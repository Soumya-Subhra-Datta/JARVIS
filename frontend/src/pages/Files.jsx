import { useState, useEffect, useRef } from 'react';
import { filesApi } from '../api/api';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';
import { FiUpload, FiTrash2, FiFile, FiDownload, FiMessageSquare } from 'react-icons/fi';

export default function Files() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [askModal, setAskModal] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { loadFiles(); }, []);

  const loadFiles = async () => {
    try {
      const res = await filesApi.getFiles();
      setFiles(res.data.files || []);
    } catch (err) {} finally { setLoading(false); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await filesApi.uploadFile(formData);
      toast.success('File uploaded');
      loadFiles();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this file?')) return;
    try {
      await filesApi.deleteFile(id);
      toast.success('File deleted');
      loadFiles();
    } catch (err) {}
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAsking(true);
    try {
      const res = await filesApi.askFile(askModal.id, question);
      setAnswer(res.data.answer);
    } catch (err) {
      toast.error('Failed to ask about file');
    } finally { setAsking(false); }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left">
          <span className="page-title">Files</span>
        </div>
        <div className="topbar-right">
          <input type="file" ref={fileRef} onChange={handleUpload} style={{ display: 'none' }} accept=".txt,.csv,.json,.pdf,.docx,.doc" />
          <button className="btn btn-primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <FiUpload /> {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="empty-state"><p>Loading files...</p></div>
        ) : files.length === 0 ? (
          <div className="empty-state">
            <FiFile className="empty-state-icon" />
            <p>No files uploaded. Supported: TXT, CSV, JSON, PDF, DOCX</p>
          </div>
        ) : (
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Uploaded</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map(f => (
                    <tr key={f.id}>
                      <td><span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FiFile /> {f.original_name}</span></td>
                      <td className="text-muted">{f.mime_type}</td>
                      <td className="text-muted">{formatSize(f.size)}</td>
                      <td className="text-muted">{new Date(f.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-8">
                          <button className="btn btn-sm btn-secondary" onClick={() => setAskModal(f)}><FiMessageSquare size={12} /> Ask</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(f.id)}><FiTrash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={!!askModal} onClose={() => { setAskModal(null); setAnswer(''); setQuestion(''); }} title={`Ask about: ${askModal?.original_name || ''}`}>
        <div className="form-group">
          <textarea className="form-textarea" value={question} onChange={e => setQuestion(e.target.value)} placeholder="What would you like to know about this file?" rows={3} />
        </div>
        <button className="btn btn-primary w-full mb-16" onClick={handleAsk} disabled={asking || !question.trim()}>
          {asking ? 'Thinking...' : 'Ask'}
        </button>
        {answer && (
          <div className="card" style={{ background: 'var(--bg-primary)' }}>
            <div className="text-sm">{answer}</div>
          </div>
        )}
      </Modal>
    </div>
  );
}
