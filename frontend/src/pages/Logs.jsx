import { useState, useEffect } from 'react';
import { logsApi } from '../api/api';
import { FiActivity } from 'react-icons/fi';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    try {
      const res = await logsApi.getLogs(100);
      setLogs(res.data.logs || []);
    } catch (err) {} finally { setLoading(false); }
  };

  const formatAction = (action) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const formatDetails = (details) => {
    try {
      const d = typeof details === 'string' ? JSON.parse(details) : details;
      return d?.title || d?.email || d?.name || d?.query || d?.intent || JSON.stringify(d);
    } catch { return details || ''; }
  };

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left">
          <span className="page-title">Activity Logs</span>
        </div>
        <div className="topbar-right">
          <button className="btn btn-sm btn-secondary" onClick={loadLogs}>Refresh</button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="empty-state"><p>Loading logs...</p></div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <FiActivity className="empty-state-icon" />
            <p>No activity logs yet. Start using JARVIS to see your activity!</p>
          </div>
        ) : (
          <div className="card">
            {logs.map(log => (
              <div key={log.id} className="log-entry">
                <span className="log-time">{new Date(log.created_at).toLocaleString()}</span>
                <span className="log-action">{formatAction(log.action)}</span>
                <span className="log-details">{formatDetails(log.details)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
