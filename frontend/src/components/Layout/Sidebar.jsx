import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiGrid, FiMessageSquare, FiMic, FiFileText, FiCheckSquare,
  FiFolder, FiBarChart2, FiCpu, FiSettings, FiUser, FiLogOut, FiActivity
} from 'react-icons/fi';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: FiGrid },
  { path: '/chat', label: 'AI Chat', icon: FiMessageSquare },
  { path: '/voice', label: 'Voice Assistant', icon: FiMic },
  { path: '/notes', label: 'Notes', icon: FiFileText },
  { path: '/tasks', label: 'Tasks', icon: FiCheckSquare },
  { path: '/files', label: 'Files', icon: FiFolder },
  { path: '/csv', label: 'CSV Analyzer', icon: FiBarChart2 },
  { path: '/memory', label: 'Memory', icon: FiCpu },
  { path: '/logs', label: 'Activity Logs', icon: FiActivity },
  { path: '/settings', label: 'Settings', icon: FiSettings },
  { path: '/profile', label: 'Profile', icon: FiUser },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">AI</div>
        <span className="sidebar-title">JARVIS</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <item.icon className="nav-icon" />
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={handleLogout}>
          <FiLogOut className="nav-icon" />
          <span className="nav-label">Logout</span>
        </button>
        <div className="sidebar-footer-text">
          JARVIS v1.0
        </div>
      </div>
    </aside>
  );
}
