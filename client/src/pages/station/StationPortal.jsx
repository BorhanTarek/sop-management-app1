import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Play, Clock, CheckCircle, AlertTriangle, LogOut, Loader, ChevronRight, Activity } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { stationService, sessionService } from '../../services/services';

function ShiftCard({ station, onStart }) {
  const today = new Date().toISOString().slice(0, 10);
  const sessions = station.sessions || [];
  const openingSession = sessions.find(s => s.procedureType === 'opening');
  const closingSession = sessions.find(s => s.procedureType === 'closing');

  const hasOpening = station.stationSops?.some(ss => ss.procedureType === 'opening');
  const hasClosing = station.stationSops?.some(ss => ss.procedureType === 'closing');

  const getStatusBadge = (session) => {
    if (!session) return null;
    if (session.status === 'completed') return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 99, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
        <CheckCircle size={11} /> Completed
      </span>
    );
    if (session.status === 'in_progress') return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 99, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
        <Activity size={11} /> In Progress
      </span>
    );
    return null;
  };

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      padding: 28,
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    }}>
      {/* Station Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-dark))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(26,158,150,0.35)',
          flexShrink: 0,
        }}>
          <MapPin size={22} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Cairo Metro · {station.lineCode} · {station.stationCode}
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {station.name}
          </div>
          {station.nameAr && (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', direction: 'rtl' }}>{station.nameAr}</div>
          )}
        </div>
      </div>

      {/* Shift Date Banner */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 20, fontSize: '0.8rem', color: 'var(--text-secondary)',
      }}>
        <Clock size={14} style={{ color: 'var(--brand-accent)' }} />
        Shift Date: <strong style={{ color: 'var(--text-primary)' }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
      </div>

      {/* Procedure Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Opening Procedure */}
        <div style={{
          background: openingSession?.status === 'completed' ? 'rgba(34,197,94,0.04)' : 'var(--bg-card)',
          border: `1.5px solid ${openingSession?.status === 'completed' ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
          borderRadius: 14, padding: '18px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: 'rgba(34,197,94,0.1)', border: '1.5px solid rgba(34,197,94,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {openingSession?.status === 'completed'
                ? <CheckCircle size={20} color="#22c55e" />
                : <Play size={18} color="#22c55e" />
              }
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Opening Procedure</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {openingSession?.status === 'completed'
                  ? `Completed at ${new Date(openingSession.completedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                  : openingSession?.status === 'in_progress'
                    ? 'Session in progress — resume below'
                    : hasOpening ? 'Tap to begin shift opening checklist' : 'No opening SOP configured'
                }
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {getStatusBadge(openingSession)}
            {hasOpening && openingSession?.status !== 'completed' && (
              <button
                onClick={() => onStart(station.id, 'opening', openingSession?.id)}
                style={{
                  padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem',
                  background: openingSession?.status === 'in_progress' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.12)',
                  color: openingSession?.status === 'in_progress' ? '#f59e0b' : '#22c55e',
                  border: `1.5px solid ${openingSession?.status === 'in_progress' ? 'rgba(245,158,11,0.35)' : 'rgba(34,197,94,0.35)'}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s ease',
                }}
              >
                {openingSession?.status === 'in_progress' ? 'Resume' : 'Start'} <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Closing Procedure */}
        <div style={{
          background: closingSession?.status === 'completed' ? 'rgba(34,197,94,0.04)' : 'var(--bg-card)',
          border: `1.5px solid ${closingSession?.status === 'completed' ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
          borderRadius: 14, padding: '18px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: 'rgba(99,102,241,0.1)', border: '1.5px solid rgba(99,102,241,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {closingSession?.status === 'completed'
                ? <CheckCircle size={20} color="#22c55e" />
                : <Play size={18} color="#818cf8" />
              }
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Closing Procedure</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {closingSession?.status === 'completed'
                  ? `Completed at ${new Date(closingSession.completedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                  : closingSession?.status === 'in_progress'
                    ? 'Session in progress — resume below'
                    : hasClosing ? 'Tap to begin shift closing checklist' : 'No closing SOP configured'
                }
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {getStatusBadge(closingSession)}
            {hasClosing && closingSession?.status !== 'completed' && (
              <button
                onClick={() => onStart(station.id, 'closing', closingSession?.id)}
                style={{
                  padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem',
                  background: closingSession?.status === 'in_progress' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.12)',
                  color: closingSession?.status === 'in_progress' ? '#f59e0b' : '#818cf8',
                  border: `1.5px solid ${closingSession?.status === 'in_progress' ? 'rgba(245,158,11,0.35)' : 'rgba(99,102,241,0.35)'}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s ease',
                }}
              >
                {closingSession?.status === 'in_progress' ? 'Resume' : 'Start'} <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StationPortal() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    stationService.myStations()
      .then(r => setStations(r.data))
      .catch(() => setError('Failed to load your station assignments.'))
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async (stationId, procedureType, existingSessionId) => {
    setStarting(`${stationId}-${procedureType}`);
    setError('');
    try {
      if (existingSessionId) {
        // Resume existing in-progress session
        navigate(`/station/session/${existingSessionId}`);
        return;
      }
      const res = await sessionService.start(stationId, procedureType);
      navigate(`/station/session/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start session');
    } finally {
      setStarting(null);
    }
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f1923 0%, #0d2a1e 50%, #0f1923 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(26,158,150,0.35)',
          }}>
            <MapPin size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Cairo Metro Line 3 · Station Portal
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
              {greeting}, {user?.fullName?.split(' ')[0]}
            </div>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.7)', borderRadius: 8,
            padding: '7px 14px', fontSize: '0.78rem', cursor: 'pointer',
          }}
        >
          <LogOut size={13} /> Sign Out
        </button>
      </div>

      {/* Date & Time Banner */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '10px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <Clock size={13} style={{ color: 'var(--brand-accent)' }} />
          {new Date().toLocaleString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 16px' }}>
        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontSize: '0.85rem'
          }}>
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Loader size={28} className="spin" style={{ color: 'var(--brand-accent)' }} />
          </div>
        ) : stations.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 60,
            background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 20,
          }}>
            <MapPin size={36} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>No Stations Assigned</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Contact your administrator to be assigned to a station.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {stations.map(station => (
              <ShiftCard
                key={station.id}
                station={station}
                onStart={handleStart}
                starting={starting}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
