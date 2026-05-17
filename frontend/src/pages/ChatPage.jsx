import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatApi } from '../api/api';
import ChatBubble from '../components/UI/ChatBubble';
import AnimatedOrb from '../components/UI/AnimatedOrb';
import { FiSend, FiPlus, FiTrash2, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiState, setAiState] = useState('idle');
  const [currentSession, setCurrentSession] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  useEffect(() => { loadSessions(); }, []);
  useEffect(() => { if (sessionId) loadSession(sessionId); }, [sessionId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadSessions = async () => {
    try {
      const res = await chatApi.getSessions();
      setSessions(res.data.sessions || []);
    } catch (err) {}
  };

  const loadSession = async (id) => {
    try {
      const res = await chatApi.getSession(id);
      setCurrentSession(res.data.session);
      const parsedMessages = (res.data.messages || []).map(msg => ({
        ...msg,
        displayContent: parseContent(msg.content)
      }));
      setMessages(parsedMessages);
    } catch (err) {
      toast.error('Failed to load session');
      navigate('/chat');
    }
  };

  const parseContent = (content) => {
    try {
      const parsed = JSON.parse(content);
      return parsed.text || parsed.message || content;
    } catch {
      return content;
    }
  };

  const createSession = async () => {
    try {
      const res = await chatApi.createSession('New Chat');
      setSessions(prev => [res.data.session, ...prev]);
      navigate(`/chat/${res.data.session.id}`);
    } catch (err) {}
  };

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    try {
      await chatApi.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (sessionId === id) {
        navigate('/chat');
        setMessages([]);
        setCurrentSession(null);
      }
    } catch (err) {}
  };

  const renameSession = async (id) => {
    try {
      await chatApi.updateSession(id, { title: editTitle });
      setSessions(prev => prev.map(s => s.id === id ? { ...s, title: editTitle } : s));
      setEditingId(null);
    } catch (err) {}
  };

  const startEdit = (session, e) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setAiState('thinking');

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', displayContent: userMsg, content: userMsg, created_at: new Date().toISOString() }]);

    setLoading(true);
    const popup = window.open('', '_blank');
    try {
      const res = await chatApi.sendMessage({ message: userMsg, sessionId: currentSession?.id });
      const newSessionId = res.data.sessionId;
      if (!currentSession || currentSession.id !== newSessionId) {
        navigate(`/chat/${newSessionId}`);
      }
      loadSessions();
      if (res.data.action?.type === 'open_website' && res.data.action.url) {
        if (popup && !popup.closed) {
          popup.location.href = res.data.action.url;
        } else {
          window.open(res.data.action.url, '_blank');
        }
      }
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        displayContent: res.data.message,
        content: res.data.message,
        created_at: new Date().toISOString()
      }]);
      setAiState(res.data.emotion || 'neutral');
      setTimeout(() => setAiState('idle'), 2000);
    } catch (err) {
      toast.error('Failed to send message');
      setAiState('idle');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!sessionId) {
    return (
      <div>
        <div className="topbar">
          <div className="topbar-left">
            <span className="page-title">AI Chat</span>
          </div>
        </div>
        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', gap: 20 }}>
          <AnimatedOrb emotion="idle" />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>JARVIS Assistant</h2>
          <p className="text-muted">Select a conversation or start a new one</p>
          <button className="btn btn-primary" onClick={createSession}>
            <FiPlus /> New Chat
          </button>
          {sessions.length > 0 && (
            <div className="card" style={{ width: '100%', maxWidth: 400 }}>
              <div className="card-header"><span className="card-title">Recent Chats</span></div>
              {sessions.map(s => (
                <div key={s.id} className="chat-session-item" onClick={() => navigate(`/chat/${s.id}`)}>
                  <span className="truncate" style={{ fontSize: 13, flex: 1 }}>{s.title}</span>
                  <span className="text-xs text-muted">{new Date(s.updated_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header flex items-center justify-between">
          <span style={{ fontSize: 13, fontWeight: 600 }}>Conversations</span>
          <button className="btn btn-sm btn-primary" onClick={createSession}><FiPlus /></button>
        </div>
        <div className="chat-session-list">
          {sessions.map(s => (
            <div
              key={s.id}
              className={`chat-session-item ${currentSession?.id === s.id ? 'active' : ''}`}
              onClick={() => navigate(`/chat/${s.id}`)}
            >
              {editingId === s.id ? (
                <div className="flex items-center gap-8" style={{ flex: 1 }} onClick={e => e.stopPropagation()}>
                  <input
                    className="form-input"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    style={{ fontSize: 12, padding: '4px 8px' }}
                    autoFocus
                  />
                  <FiCheck size={14} style={{ cursor: 'pointer', color: 'var(--success)' }} onClick={() => renameSession(s.id)} />
                  <FiX size={14} style={{ cursor: 'pointer' }} onClick={() => setEditingId(null)} />
                </div>
              ) : (
                <>
                  <span className="chat-session-title">{s.title}</span>
                  <div className="chat-session-actions">
                    <FiEdit2 size={12} style={{ cursor: 'pointer' }} onClick={(e) => startEdit(s, e)} />
                    <FiTrash2 size={12} style={{ cursor: 'pointer', color: 'var(--danger)' }} onClick={(e) => deleteSession(s.id, e)} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <AnimatedOrb emotion={aiState} size="small" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{currentSession?.title || 'Chat'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{aiState === 'thinking' ? 'JARVIS is thinking...' : 'JARVIS is ready'}</div>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map(msg => (
            <ChatBubble key={msg.id} role={msg.role} content={msg.displayContent} timestamp={msg.created_at} />
          ))}
          {loading && (
            <div className="chat-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="animated-orb thinking" style={{ width: 30, height: 30 }}>
                <div className="ring" style={{ width: 20, height: 20 }}></div>
                <div className="core" style={{ width: 10, height: 10 }}></div>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          <textarea
            ref={chatInputRef}
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message or give a command..."
            rows={1}
          />
          <div className="chat-actions">
            <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={loading || !input.trim()}>
              <FiSend />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
