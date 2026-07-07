import { useState, useEffect, useRef } from 'react';
import {
  Search, RefreshCw, Filter, ChevronDown, ChevronUp,
  Clock, User, MapPin, BookOpen, CheckCircle, XCircle,
  AlertTriangle, Download, FileText, Eye
} from 'lucide-react';
import { sessionService, sopService } from '../../services/services';
import mobilityLogo from '../../assets/Logo-Mobility-Cairo.png';
import ratpLogo from '../../assets/RDMC LOGO.jpg';

const STATUS_COLORS = {
  completed:   { bg: 'rgba(16,185,129,0.1)',  color: '#10b981', label: 'Completed'  },
  in_progress: { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6', label: 'In Progress' },
  abandoned:   { bg: 'rgba(239,68,68,0.08)',  color: '#ef4444', label: 'Abandoned'  },
};

const STEP_TYPE_COLORS = {
  action:          { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  label: 'Action'          },
  safety_critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'Safety Critical' },
  decision:        { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Decision'         },
  reference:       { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'Reference'        },
};

function formatDateTime(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDuration(startedAt, completedAt) {
  if (!startedAt || !completedAt) return null;
  const ms = new Date(completedAt) - new Date(startedAt);
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function StepTypeBadge({ type }) {
  const info = STEP_TYPE_COLORS[type] || { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: type || 'step' };
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700,
      background: info.bg, color: info.color, whiteSpace: 'nowrap'
    }}>{info.label}</span>
  );
}

function SessionRow({ session, index }) {
  const [expanded, setExpanded] = useState(false);
  const statusInfo = STATUS_COLORS[session.status] || STATUS_COLORS.abandoned;
  const duration = formatDuration(session.startedAt, session.completedAt);
  const roles = session.user?.roles?.map(r => r.role?.name || r).join(', ') || '—';

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=900,height=700');
    const steps = session.stepLogs || [];
    const sig = session.user?.signatureData;
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8"/>
      <title>SOP Wizard Log – ${session.sop?.title}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 28px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0d6245; padding-bottom: 12px; margin-bottom: 16px; }
        .title { font-size: 16px; font-weight: 800; color: #0d6245; }
        .logos { display: flex; gap: 12px; align-items: center; }
        .logos img { height: 32px; object-fit: contain; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 16px; background: #f8fafb; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; }
        .meta-item label { display: block; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 2px; }
        .meta-item span { font-size: 11px; font-weight: 600; color: #1e293b; }
        .steps-title { font-size: 12px; font-weight: 800; color: #0d6245; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #0d6245; color: #fff; padding: 7px 10px; text-align: left; font-size: 10px; font-weight: 700; }
        td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-size: 10px; vertical-align: middle; }
        tr:nth-child(even) td { background: #f8fafb; }
        .badge { padding: 2px 8px; border-radius: 20px; font-size: 9px; font-weight: 700; }
        .sig-section { margin-top: 20px; display: flex; justify-content: flex-end; }
        .sig-box { text-align: center; }
        .sig-box img { width: 180px; height: 60px; object-fit: contain; border-bottom: 1px solid #334155; display: block; margin-bottom: 4px; }
        .sig-box p { font-size: 9px; color: #64748b; }
        @media print { body { padding: 14px; } }
      </style>
    </head><body>
      <div class="header">
        <div>
          <div class="title">SOP Wizard Execution Log</div>
          <div style="font-size:10px;color:#475569;margin-top:4px;">Cairo Metro Line 3 – Green Line Operations</div>
        </div>
        <div class="logos">
          <img src="${mobilityLogo}" alt="Mobility Cairo"/>
          <img src="${ratpLogo}" alt="RATP Dev"/>
        </div>
      </div>
      <div class="meta-grid">
        <div class="meta-item"><label>SOP Title</label><span>${session.sop?.title || '—'}</span></div>
        <div class="meta-item"><label>Reference Code</label><span>${session.sop?.referenceCode || '—'}</span></div>
        <div class="meta-item"><label>User</label><span>${session.user?.fullName || '—'}</span></div>
        <div class="meta-item"><label>Department</label><span>${session.user?.department || '—'}</span></div>
        <div class="meta-item"><label>Station</label><span>${session.station?.name || '—'} (${session.station?.stationCode || '—'})</span></div>
        <div class="meta-item"><label>Procedure</label><span style="text-transform:capitalize">${session.procedureType || '—'}</span></div>
        <div class="meta-item"><label>Started</label><span>${formatDateTime(session.startedAt)}</span></div>
        <div class="meta-item"><label>Completed</label><span>${formatDateTime(session.completedAt)}</span></div>
        <div class="meta-item"><label>Status</label><span>${session.status}</span></div>
        <div class="meta-item"><label>Duration</label><span>${duration || '—'}</span></div>
      </div>
      <div class="steps-title">Step-by-Step Execution Log (${steps.length} steps acknowledged)</div>
      <table>
        <thead><tr><th>#</th><th>Step Title</th><th>Type</th><th>Branch Choice</th><th>Acknowledged At</th></tr></thead>
        <tbody>${steps.map((s, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${s.stepTitle || '—'}</td>
            <td>${s.stepType || '—'}</td>
            <td>${s.branchChoice || '—'}</td>
            <td>${formatDateTime(s.acknowledgedAt)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${sig ? `<div class="sig-section"><div class="sig-box">
        <img src="${sig}" alt="Signature"/>
        <p>${session.user?.fullName || ''} – ${formatDateTime(session.completedAt)}</p>
      </div></div>` : ''}
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  return (
    <>
      <tr
        style={{ cursor: 'pointer', background: expanded ? 'var(--bg-hover)' : 'transparent' }}
        onClick={() => setExpanded(v => !v)}
      >
        <td>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>#{index + 1}</span>
        </td>
        <td>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            {session.sop?.title || '—'}
          </div>
          {session.sop?.referenceCode && (
            <code style={{ fontSize: '0.7rem', color: 'var(--brand-accent)' }}>{session.sop.referenceCode}</code>
          )}
        </td>
        <td>
          <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{session.user?.fullName || '—'}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{session.user?.email || ''}</div>
        </td>
        <td>
          <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{session.station?.name || '—'}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{session.station?.stationCode}</div>
        </td>
        <td>
          <span style={{
            padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize',
            background: statusInfo.bg, color: statusInfo.color
          }}>{statusInfo.label}</span>
        </td>
        <td>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{formatDateTime(session.startedAt)}</div>
          {duration && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>⏱ {duration}</div>}
        </td>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              background: 'var(--bg-hover)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700,
              color: 'var(--text-secondary)'
            }}>
              {session.stepLogs?.length ?? 0} steps
            </span>
            {expanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} />
                       : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
          </div>
        </td>
        <td onClick={e => e.stopPropagation()}>
          <button
            className="btn btn-ghost btn-sm"
            title="Export PDF"
            onClick={handlePrint}
            style={{ padding: '4px 8px' }}
          >
            <Download size={13} />
          </button>
        </td>
      </tr>

      {/* Expanded step-by-step detail */}
      {expanded && (
        <tr>
          <td colSpan={8} style={{ padding: 0, background: 'var(--bg-hover)', borderBottom: '2px solid var(--border)' }}>
            <div style={{ padding: '16px 24px' }}>
              {/* User mini-profile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                  {session.user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{session.user?.fullName}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{session.user?.email} · {session.user?.department || 'No department'}</div>
                </div>
                {session.user?.signatureData && (
                  <img src={session.user.signatureData} alt="Signature"
                    style={{ height: 36, maxWidth: 120, objectFit: 'contain', borderBottom: '1px solid var(--border)' }} />
                )}
              </div>

              {/* Step logs table */}
              {session.stepLogs?.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-surface)' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>#</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Step Title</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Type</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Branch Choice</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Acknowledged At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.stepLogs.map((step, i) => (
                        <tr key={step.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '7px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem' }}>{i + 1}</td>
                          <td style={{ padding: '7px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{step.stepTitle || '—'}</td>
                          <td style={{ padding: '7px 12px' }}><StepTypeBadge type={step.stepType} /></td>
                          <td style={{ padding: '7px 12px' }}>
                            {step.branchChoice ? (
                              <span style={{
                                padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700,
                                background: step.branchChoice === 'yes' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)',
                                color: step.branchChoice === 'yes' ? '#10b981' : '#ef4444'
                              }}>
                                {step.branchChoice.toUpperCase()}
                              </span>
                            ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                          <td style={{ padding: '7px 12px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {formatDateTime(step.acknowledgedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No steps logged for this session.
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function SOPLogsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', dateFrom: '', dateTo: '' });
  const [applied, setApplied] = useState({});

  const load = (params = {}) => {
    setLoading(true);
    sessionService.sopLogs(params)
      .then(r => setSessions(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApply = () => {
    const params = {};
    if (filters.search)   params.search   = filters.search;
    if (filters.status)   params.status   = filters.status;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo)   params.dateTo   = filters.dateTo;
    setApplied(params);
    load(params);
  };

  const handleReset = () => {
    setFilters({ search: '', status: '', dateFrom: '', dateTo: '' });
    setApplied({});
    load();
  };

  const stats = {
    total:       sessions.length,
    completed:   sessions.filter(s => s.status === 'completed').length,
    inProgress:  sessions.filter(s => s.status === 'in_progress').length,
    abandoned:   sessions.filter(s => s.status === 'abandoned').length,
    totalSteps:  sessions.reduce((acc, s) => acc + (s.stepLogs?.length || 0), 0),
  };

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={22} style={{ color: 'var(--brand-primary)' }} />
            SOPs Wizard Logs
          </h1>
          <p style={{ marginTop: 4, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Full step-by-step audit trail of every wizard guide session
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => load(applied)}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Sessions', value: stats.total, icon: BookOpen, color: 'var(--brand-primary)' },
          { label: 'Completed',      value: stats.completed, icon: CheckCircle, color: '#10b981' },
          { label: 'In Progress',    value: stats.inProgress, icon: Clock, color: '#3b82f6' },
          { label: 'Abandoned',      value: stats.abandoned, icon: XCircle, color: '#ef4444' },
          { label: 'Steps Logged',   value: stats.totalSteps, icon: AlertTriangle, color: '#f59e0b' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: `color-mix(in srgb, ${color} 12%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={17} style={{ color }} />
            </div>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5 }}>Search User or SOP</label>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-control"
                style={{ paddingLeft: 30 }}
                placeholder="Search by name or SOP title…"
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleApply()}
              />
            </div>
          </div>

          <div style={{ flex: '0 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5 }}>Status</label>
            <select className="filter-select" style={{ width: '100%' }} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>

          <div style={{ flex: '0 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5 }}>From Date</label>
            <input type="date" className="form-control" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
          </div>

          <div style={{ flex: '0 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5 }}>To Date</label>
            <input type="date" className="form-control" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
          </div>

          <div style={{ display: 'flex', gap: 8, paddingBottom: 1 }}>
            <button className="btn btn-primary btn-sm" onClick={handleApply}>
              <Filter size={13} /> Apply
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>SOP Title</th>
                <th>User</th>
                <th>Station</th>
                <th>Status</th>
                <th>Started</th>
                <th>Steps</th>
                <th style={{ width: 48 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48 }}><div className="loading-spinner" /></td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><FileText size={32} /></div>
                    <h3>No wizard sessions found</h3>
                    <p>Sessions are recorded when a station master uses the Wizard Guide to run through an SOP procedure.</p>
                  </div>
                </td></tr>
              ) : (
                sessions.map((session, i) => (
                  <SessionRow key={session.id} session={session} index={i} />
                ))
              )}
            </tbody>
          </table>
        </div>
        {sessions.length > 0 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Showing {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
