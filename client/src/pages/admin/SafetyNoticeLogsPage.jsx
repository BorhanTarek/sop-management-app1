import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader, Calendar, User, Mail, ShieldAlert, Download } from 'lucide-react';
import { safetyNoticeService } from '../../services/services';

export default function SafetyNoticeLogsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [logs, setLogs] = useState([]);
  const [wi, setWi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      safetyNoticeService.get(id),
      safetyNoticeService.logs(id)
    ])
      .then(([wiRes, logsRes]) => {
        setWi(wiRes.data);
        setLogs(logsRes.data);
      })
      .catch(err => {
        setError('Failed to load audit logs.');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Full Name', 'Username/Email', 'Roles', 'Acknowledged At'];
    const rows = logs.map(log => [
      log.user.fullName,
      log.user.email,
      (log.user.roles || []).join(', '),
      new Date(log.acknowledgedAt).toLocaleString('en-GB')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `safety_notice_logs_${id}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Loader size={30} className="spin" style={{ color: 'var(--brand-accent)' }} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm" 
            onClick={() => navigate('/admin/safety-notices')}
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1>Acknowledgment Audit Logs</h1>
            <p style={{ marginTop: 4, fontSize: '0.85rem' }}>
              Compliance record for: <strong style={{ color: 'var(--brand-accent)' }}>{wi?.title}</strong>
            </p>
          </div>
        </div>
        {logs.length > 0 && (
          <button className="btn btn-primary" onClick={handleExportCSV}>
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>

      {error && (
        <div style={{ 
          background: 'rgba(239,68,68,0.1)', 
          border: '1px solid rgba(239,68,68,0.3)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '10px 14px', 
          color: 'var(--danger)', 
          fontSize: '0.85rem', 
          marginBottom: 20 
        }}>
          {error}
        </div>
      )}

      {/* Overview stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={18} style={{ color: '#6366f1' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Created Date</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 6, color: '#6366f1' }}>
            {new Date(wi?.createdAt).toLocaleDateString('en-GB')}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <User size={18} style={{ color: 'var(--brand-primary)' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Acknowledged</span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: 4, color: 'var(--brand-accent)', lineHeight: 1 }}>
            {logs.length}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldAlert size={18} style={{ color: wi?.isPublished ? '#22c55e' : '#f59e0b' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 6, color: wi?.isPublished ? '#22c55e' : '#f59e0b', textTransform: 'capitalize' }}>
            {wi?.isPublished ? 'Published Live' : 'Draft'}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Operator / Driver</th>
                <th>Username</th>
                <th>Roles</th>
                <th>Acknowledged Time & Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state" style={{ padding: '40px 0' }}>
                      <div className="empty-state-icon">📋</div>
                      <h3>No acknowledgments logged yet</h3>
                      <p>Safety Notices will show logs once users acknowledge them in the portal.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                          {log.user.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                        </div>
                        <span className="cell-primary" style={{ fontWeight: 600 }}>{log.user.fullName}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                        <span>{log.user.email}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(log.user.roles || []).map(role => (
                          <span 
                            key={role} 
                            style={{
                              padding: '2px 8px', 
                              borderRadius: 99, 
                              fontSize: '0.68rem', 
                              fontWeight: 700,
                              background: 'rgba(99,102,241,0.1)', 
                              color: '#818cf8',
                              border: '1px solid rgba(99,102,241,0.2)',
                              textTransform: 'uppercase'
                            }}
                          >
                            {role.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {new Date(log.acknowledgedAt).toLocaleString('en-GB', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
