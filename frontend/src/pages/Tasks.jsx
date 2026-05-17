import { useState, useEffect } from 'react';
import { tasksApi } from '../api/api';
import Modal from '../components/UI/Modal';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiCheckCircle, FiCircle } from 'react-icons/fi';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '' });

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    try {
      const res = await tasksApi.getTasks();
      setTasks(res.data.tasks || []);
    } catch (err) {} finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', priority: 'medium', due_date: '' });
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date || ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    try {
      if (editing) {
        await tasksApi.updateTask(editing.id, form);
        toast.success('Task updated');
      } else {
        await tasksApi.createTask(form);
        toast.success('Task created');
      }
      setShowModal(false);
      loadTasks();
    } catch (err) { toast.error('Failed to save task'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksApi.deleteTask(id);
      toast.success('Task deleted');
      loadTasks();
    } catch (err) {}
  };

  const toggleStatus = async (task) => {
    try {
      await tasksApi.updateTask(task.id, { status: task.status === 'completed' ? 'pending' : 'completed' });
      loadTasks();
    } catch (err) {}
  };

  const filtered = tasks.filter(t => {
    if (filter === 'pending') return t.status === 'pending';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left">
          <span className="page-title">Tasks</span>
        </div>
        <div className="topbar-right">
          <select className="form-select" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 130 }}>
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <button className="btn btn-primary" onClick={openCreate}><FiPlus /> New Task</button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="empty-state"><p>Loading tasks...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <FiCheckCircle className="empty-state-icon" />
            <p>{filter === 'all' ? 'No tasks. Create one!' : 'No tasks match this filter'}</p>
            <button className="btn btn-primary mt-16" onClick={openCreate}>Create Task</button>
          </div>
        ) : (
          <div className="card">
            {filtered.map(task => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0', borderBottom: '1px solid var(--border-color)',
                opacity: task.status === 'completed' ? 0.6 : 1
              }}>
                <button className="btn btn-icon btn-secondary btn-sm" onClick={() => toggleStatus(task)}>
                  {task.status === 'completed' ? <FiCheckCircle style={{ color: 'var(--success)' }} /> : <FiCircle />}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 14,
                    textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                  }}>{task.title}</div>
                  {task.description && <div className="text-xs text-muted">{task.description}</div>}
                </div>
                <span className={`priority-${task.priority}`} style={{ fontSize: 11, textTransform: 'uppercase' }}>{task.priority}</span>
                {task.due_date && <span className="text-xs text-muted">{new Date(task.due_date).toLocaleDateString()}</span>}
                <button className="btn btn-icon btn-secondary btn-sm" onClick={() => openEdit(task)}><FiEdit2 size={14} /></button>
                <button className="btn btn-icon btn-secondary btn-sm" onClick={() => handleDelete(task.id)}><FiTrash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Task' : 'New Task'}>
        <div className="form-group">
          <label className="form-label">Title</label>
          <input type="text" className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Task title" />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description" rows={3} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Priority</label>
            <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Due Date</label>
            <input type="date" className="form-input" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
          </div>
        </div>
        <button className="btn btn-primary w-full" onClick={handleSave}>{editing ? 'Update Task' : 'Create Task'}</button>
      </Modal>
    </div>
  );
}
