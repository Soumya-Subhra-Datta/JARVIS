import { useState, useEffect, useRef } from 'react';
import { csvApi } from '../api/api';
import CsvPreview from '../components/CSV/CsvPreview';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';
import { FiUpload, FiTrash2, FiBarChart2, FiMessageSquare } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CsvAnalyzer() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [summary, setSummary] = useState(null);
  const [askModal, setAskModal] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => { loadDatasets(); }, []);

  const loadDatasets = async () => {
    try {
      const res = await csvApi.getDatasets();
      setDatasets(res.data.datasets || []);
    } catch (err) {} finally { setLoading(false); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await csvApi.uploadCsv(formData);
      toast.success('CSV uploaded and analyzed');
      loadDatasets();
      setActive(res.data.dataset);
      setSummary(res.data.dataset);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const loadSummary = async (id) => {
    try {
      const res = await csvApi.getSummary(id);
      setActive(res.data.dataset);
      setSummary(res.data.dataset);
    } catch (err) { toast.error('Failed to load summary'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this dataset?')) return;
    try {
      await csvApi.deleteDataset(id);
      toast.success('Dataset deleted');
      loadDatasets();
      if (active?.id === id) { setActive(null); setSummary(null); }
    } catch (err) {}
  };

  const handleAsk = async () => {
    if (!question.trim() || !active) return;
    setAsking(true);
    try {
      const res = await csvApi.askCsv(active.id, question);
      setAnswer(res.data.answer);
    } catch (err) { toast.error('Failed to ask'); } finally { setAsking(false); }
  };

  const getChartData = () => {
    if (!summary?.preview || !summary?.columns) return [];
    const numericCols = summary.columns.filter(c => summary.summary?.stats?.[c]?.mean !== undefined);
    if (numericCols.length === 0) return [];
    const col = numericCols[0];
    return (summary.preview || []).map((row, i) => ({
      name: row[summary.columns[0]] || `Row ${i + 1}`,
      value: parseFloat(row[col]) || 0
    }));
  };

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left">
          <span className="page-title">CSV Analyzer</span>
        </div>
        <div className="topbar-right">
          <input type="file" ref={fileRef} onChange={handleUpload} style={{ display: 'none' }} accept=".csv" />
          <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>
            <FiUpload /> Upload CSV
          </button>
        </div>
      </div>

      <div className="page-content">
        {!active && (
          <div className="grid-3 mb-16">
            {datasets.map(d => (
              <div key={d.id} className="card" style={{ cursor: 'pointer' }} onClick={() => loadSummary(d.id)}>
                <div className="flex justify-between items-center mb-8">
                  <FiBarChart2 size={20} style={{ color: 'var(--accent)' }} />
                  <button className="btn btn-icon btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }}>
                    <FiTrash2 size={14} />
                  </button>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600 }} className="truncate">{d.filename}</h3>
                <p className="text-xs text-muted">{d.row_count} rows | {new Date(d.created_at).toLocaleDateString()}</p>
              </div>
            ))}
            {datasets.length === 0 && (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <FiBarChart2 className="empty-state-icon" />
                <p>No datasets. Upload a CSV to analyze!</p>
              </div>
            )}
          </div>
        )}

        {active && summary && (
          <>
            <div className="flex items-center justify-between mb-16">
              <div>
                <h3 style={{ fontSize: 16 }}>{active.filename}</h3>
                <p className="text-xs text-muted">{active.rowCount} rows × {active.columns?.length} columns</p>
              </div>
              <div className="flex gap-8">
                <button className="btn btn-sm btn-secondary" onClick={() => setAskModal(true)}><FiMessageSquare /> Ask AI</button>
                <button className="btn btn-sm btn-secondary" onClick={() => { setActive(null); setSummary(null); }}>Close</button>
              </div>
            </div>

            <div className="grid-2 mb-16">
              <div className="card">
                <div className="card-title mb-8">Data Types</div>
                <div className="table-container">
                  <table>
                    <thead><tr><th>Column</th><th>Type</th><th>Missing</th></tr></thead>
                    <tbody>
                      {summary.columns?.map(col => (
                        <tr key={col}>
                          <td>{col}</td>
                          <td>{summary.summary?.dataTypes?.[col] || 'unknown'}</td>
                          <td className="text-danger">{summary.summary?.missingValues?.[col] || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-title mb-8">Statistics</div>
                {summary.columns?.filter(c => summary.summary?.stats?.[c]?.mean).map(col => (
                  <div key={col} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div className="text-sm" style={{ fontWeight: 600 }}>{col}</div>
                    <div className="text-xs text-muted">
                      Mean: {summary.summary.stats[col].mean} | Min: {summary.summary.stats[col].min} | Max: {summary.summary.stats[col].max}
                    </div>
                  </div>
                ))}
                {summary.columns?.filter(c => summary.summary?.stats?.[c]?.unique_values).map(col => (
                  <div key={col} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div className="text-sm" style={{ fontWeight: 600 }}>{col}</div>
                    <div className="text-xs text-muted">
                      Unique: {summary.summary.stats[col].unique_values} | Top: {summary.summary.stats[col].most_common}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {getChartData().length > 0 && (
              <div className="card mb-16">
                <div className="card-title mb-8">Chart Preview</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: '#8888aa', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#8888aa', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#16163a', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8, color: '#e0e0ff' }} />
                    <Bar dataKey="value" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="card">
              <div className="card-title mb-8">Data Preview</div>
              <CsvPreview columns={summary.columns} rows={summary.preview} />
            </div>
          </>
        )}
      </div>

      <Modal isOpen={askModal} onClose={() => { setAskModal(false); setAnswer(''); setQuestion(''); }} title={`Ask about ${active?.filename || 'CSV'}`}>
        <div className="form-group">
          <textarea className="form-textarea" value={question} onChange={e => setQuestion(e.target.value)} placeholder="e.g., What are the main trends?" rows={3} />
        </div>
        <button className="btn btn-primary w-full mb-16" onClick={handleAsk} disabled={asking || !question.trim()}>
          {asking ? 'Analyzing...' : 'Ask'}
        </button>
        {answer && <div className="card" style={{ background: 'var(--bg-primary)' }}><div className="text-sm">{answer}</div></div>}
      </Modal>
    </div>
  );
}
