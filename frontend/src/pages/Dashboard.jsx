import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatApi, tasksApi, notesApi, filesApi, memoryApi } from '../api/api';
import StatsCard from '../components/Dashboard/StatsCard';
import AnimatedOrb from '../components/UI/AnimatedOrb';
import MicButton from '../components/Voice/MicButton';
import Modal from '../components/UI/Modal';
import { FiMessageSquare, FiCheckSquare, FiFileText, FiFolder, FiCpu, FiArrowRight, FiMic } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ chats: 0, tasks: 0, notes: 0, files: 0, memories: 0 });
  const [recentChats, setRecentChats] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceResponse, setVoiceResponse] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceLoading, setVoiceLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [chats, tasks, notes, files, memories] = await Promise.all([
          chatApi.getSessions(),
          tasksApi.getTasks(),
          notesApi.getNotes(),
          filesApi.getFiles(),
          memoryApi.getMemories()
        ]);
        setRecentChats(chats.data.sessions?.slice(0, 5) || []);
        setRecentTasks(tasks.data.tasks?.filter(t => t.status === 'pending').slice(0, 5) || []);
        setStats({
          chats: chats.data.sessions?.length || 0,
          tasks: tasks.data.tasks?.filter(t => t.status === 'pending').length || 0,
          notes: notes.data.notes?.length || 0,
          files: files.data.files?.length || 0,
          memories: memories.data.memories?.length || 0
        });
      } catch (err) {} finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left">
          <span className="page-title">Dashboard</span>
        </div>
        <div className="topbar-right">
          <div className="user-badge">
            <div className="avatar">{user?.name?.charAt(0) || 'U'}</div>
            <span>{user?.name || 'User'}</span>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="flex items-center justify-between mb-16">
          <div>
            <h2 style={{ fontSize: 20, marginBottom: 4 }}>Welcome back, {user?.name}!</h2>
            <p className="text-muted text-sm">Your AI assistant is ready and running.</p>
          </div>
          <AnimatedOrb emotion="idle" size="small" />
        </div>

        <div className="grid-4 mb-16">
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/chat')}>
            <StatsCard icon={<FiMessageSquare />} label="Chat Sessions" value={stats.chats} color="#00d4ff" />
          </div>
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/tasks')}>
            <StatsCard icon={<FiCheckSquare />} label="Pending Tasks" value={stats.tasks} color="#ffaa00" />
          </div>
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/notes')}>
            <StatsCard icon={<FiFileText />} label="Notes" value={stats.notes} color="#00ff88" />
          </div>
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/files')}>
            <StatsCard icon={<FiFolder />} label="Files" value={stats.files} color="#8866ff" />
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Chats</span>
              <button className="btn btn-sm btn-secondary" onClick={() => navigate('/chat')}>
                View All <FiArrowRight />
              </button>
            </div>
            {recentChats.length === 0 ? (
              <div className="empty-state">
                <p>No chats yet. Start a conversation!</p>
              </div>
            ) : (
              recentChats.map(chat => (
                <div
                  key={chat.id}
                  className="chat-session-item"
                  onClick={() => navigate(`/chat/${chat.id}`)}
                >
                  <FiMessageSquare size={14} className="text-muted" />
                  <span className="truncate" style={{ fontSize: 13 }}>{chat.title}</span>
                  <span className="text-xs text-muted">
                    {new Date(chat.updated_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Pending Tasks</span>
              <button className="btn btn-sm btn-secondary" onClick={() => navigate('/tasks')}>
                View All <FiArrowRight />
              </button>
            </div>
            {recentTasks.length === 0 ? (
              <div className="empty-state">
                <p>No pending tasks. All clear!</p>
              </div>
            ) : (
              recentTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div className="flex items-center gap-8">
                    <span className={`priority-${task.priority}`} style={{ fontSize: 10, textTransform: 'uppercase' }}>{task.priority}</span>
                    <span style={{ fontSize: 13 }}>{task.title}</span>
                  </div>
                  {task.due_date && <span className="text-xs text-muted">Due: {new Date(task.due_date).toLocaleDateString()}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <button className="floating-mic" onClick={() => setVoiceOpen(true)} title="Quick voice command">
        <FiMic size={22} />
      </button>

      <Modal isOpen={voiceOpen} onClose={() => { setVoiceOpen(false); setVoiceResponse(''); setVoiceTranscript(''); }} title="Quick Voice Command">
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <AnimatedOrb emotion={voiceLoading ? 'thinking' : 'idle'} size="small" />
          <div style={{ margin: '16px 0', minHeight: 48 }}>
            {voiceTranscript && <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>"{voiceTranscript}"</div>}
            {voiceResponse && <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{voiceResponse}</div>}
            {!voiceTranscript && !voiceResponse && <div className="text-muted text-sm">Tap mic and speak — auto-sends on pause</div>}
          </div>
          <MicButton
            onTranscript={setVoiceTranscript}
            onSend={async (text) => {
              setVoiceTranscript(text);
              setVoiceLoading(true);
              try {
                const res = await chatApi.sendMessage({ message: text });
                setVoiceResponse(res.data.message);
                if (res.data.action?.type === 'open_website' && res.data.action.url) {
                  window.open(res.data.action.url, '_blank');
                }
              } catch { toast.error('Voice command failed'); } finally { setVoiceLoading(false); }
            }}
            disabled={voiceLoading}
            autoSend
          />
        </div>
      </Modal>
    </div>
  );
}
