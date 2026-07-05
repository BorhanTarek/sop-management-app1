import { useState, useEffect } from 'react';
import { Activity, CheckCircle, Clock, AlertTriangle, Filter, RefreshCw, MapPin, User, Loader } from 'lucide-react';
import { sessionService, stationService } from '../../services/services';

function statusStyle(status) {
  if (status === 'completed') return {
    bg: 'rgba(34,197,94,0.1)', color: '#22c55e', border: 'rgba(34,197,94,0.25)', label: '✓ Completed'
  };
  if (status === 'in_progress') return {
    bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)', label: '⚡ In Progress'
  };
  return {
    bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: 'rgba(148,163,184,0.25)', label: '— Abandoned'
  };
}

function isLate(session) {
  if (!session || session.status !== 'completed') return false;
  const started = new Date(session.startedAt);
  const typeHour = session.procedureType === 'opening' ? 6 : 22;
  const threshold = new Date(started);
  threshold.setHours(typeHour, 30, 0, 0);
  return started > threshold;
}

export default function ComplianceDashboard() {
  const [sessions, setSessions] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ stationId: '', date: new Date().toISOString().slice(0, 10), status: '' });

  const load = () => {
    setLoading(true);
    const params = {};
    if (filter.stationId) params.stationId = filter.stationId;
    if (filter.date) params.date = filter.date;
    if (filter.status) params.status = filter.status;
    sessionService.list(params)
      .then(r => setSessions(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { stationService.list().then(r => setStations(r.data)); }, []);
  useEffect(() => { load(); }, [filter]);

  const stats = {
    total: sessions.length,
    completed: sessions.filter(s => s.status === 'completed').length,
    inProgress: sessions.filter(s => s.status === 'in_progress').length,
    late: sessions.filter(s => isLate(s)).length,
  };

  const durationStr = (s) => {
    if (!s.startedAt || !s.completedAt) return '—';
    const ms = new Date(s.completedAt) - new Date(s.startedAt);
    const m = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${m}m ${sec}s`;
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Compliance Dashboard</h1>
          <p style={{ marginTop: 4, fontSize: '0.85rem' }}>Live station shift execution audit for Cairo Metro Line 3</p>
        </div>
        <button className="btn btn-ghost" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Sessions', value: stats.total, icon: Activity, color: '#6366f1' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: '#22c55e' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: '#f59e0b' },
          { label: 'Late Starts', value: stats.late, icon: AlertTriangle, color: '#ef4444' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon size={18} style={{ color }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: 6, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-row" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Filter:</span>
        </div>
        <input
          type="date"
          className="filter-select"
          value={filter.date}
          onChange={e => setFilter(f => ({ ...f, date: e.target.value }))}
        />
        <select className="filter-select" value={filter.stationId} onChange={e => setFilter(f => ({ ...f, stationId: e.target.value }))}>
          <option value="">All Stations</option>
          {stations.map(s => <option key={s.id} value={s.id}>{s.stationCode} — {s.name}</option>)}
        </select>
        <select className="filter-select" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
          <option value="abandoned">Abandoned</option>
        </select>
      </div>

      {/* Sessions Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Station</th>
                <th>Operator</th>
                <th>Type</th>
                <th>Status</th>
                <th>Started At</th>
                <th>Duration</th>
                <th>Steps</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><Loader size={22} className="spin" style={{ color: 'var(--brand-accent)' }} /></td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">📋</div><h3>No sessions found</h3></div></td></tr>
              ) : sessions.map(s => {
                const ss = statusStyle(s.status);
                const late = isLate(s);
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={12} style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />
                        <div>
                          <div className="cell-primary">{s.station?.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.station?.stationCode}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{s.user?.fullName}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
                        background: s.procedureType === 'opening' ? 'rgba(34,197,94,0.1)' : 'rgba(99,102,241,0.1)',
                        color: s.procedureType === 'opening' ? '#22c55e' : '#818cf8',
                        border: `1px solid ${s.procedureType === 'opening' ? 'rgba(34,197,94,0.2)' : 'rgba(99,102,241,0.2)'}`,
                        textTransform: 'capitalize',
                      }}>
                        {s.procedureType}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
                          background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
                        }}>
                          {ss.label}
                        </span>
                        {late && (
                          <span title="Late start — exceeded expected shift start by 30 min" style={{
                            fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                            background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)',
                          }}>
                            ⚠ LATE
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <div>{new Date(s.startedAt).toLocaleDateString('en-GB')}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        {new Date(s.startedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{durationStr(s)}</td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 700,
                        background: 'rgba(26,158,150,0.08)', color: 'var(--brand-accent)',
                      }}>
                        {s.stepLogs?.length || 0} steps
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
