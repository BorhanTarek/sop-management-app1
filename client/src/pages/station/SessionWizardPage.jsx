import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, MapPin, Award, RotateCcw, AlertTriangle, ShieldAlert, Loader } from 'lucide-react';
import { sessionService } from '../../services/services';
import { useAuthStore } from '../../store/authStore';

/* ── Minimal action step card ─────────────────────────────────────────── */
function StepCard({ step }) {
  const isSafety = step.stepType === 'safety_critical';
  const border = isSafety ? '#dc2626' : step.stepType === 'reference' ? '#818cf8' : '#0d9488';
  return (
    <div style={{
      borderRadius: 10, overflow: 'hidden',
      border: `2px solid ${border}`,
      boxShadow: isSafety ? '0 4px 16px rgba(220,38,38,0.2)' : '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      {isSafety && (
        <div style={{
          background: '#dc2626', padding: '6px 16px',
          display: 'flex', alignItems: 'center', gap: 7,
          fontSize: '0.68rem', fontWeight: 800, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          <ShieldAlert size={13} /> Safety Critical Action
        </div>
      )}
      <div style={{
        background: isSafety ? 'rgba(220,38,38,0.06)' : 'var(--bg-card)',
        padding: '18px 22px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{step.title}</div>
        {step.body && (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>{step.body}</div>
        )}
      </div>
    </div>
  );
}

/* ── Main wizard page ─────────────────────────────────────────────────── */
export default function SessionWizardPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Wizard position state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentBranch, setCurrentBranch] = useState(null); // 'yes' | 'no' | null
  const [currentBranchIndex, setCurrentBranchIndex] = useState(0);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [stepLogs, setStepLogs] = useState([]);

  useEffect(() => {
    sessionService.get(sessionId)
      .then(r => {
        setSession(r.data);
        setStepLogs(r.data.stepLogs || []);
        if (r.data.status === 'completed') setCompleted(true);
      })
      .catch(() => setError('Session not found or access denied.'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader size={28} className="spin" style={{ color: 'var(--brand-accent)' }} />
    </div>
  );

  if (error || !session) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <AlertTriangle size={36} style={{ color: '#ef4444' }} />
      <p style={{ color: 'var(--text-muted)' }}>{error || 'Session not found'}</p>
      <button className="btn btn-secondary" onClick={() => navigate('/station')}>Back to Portal</button>
    </div>
  );

  const steps = session.sop?.steps || [];
  const mainStep = steps[currentIndex];
  const progressPercent = steps.length > 0 ? Math.round((currentIndex / steps.length) * 100) : 0;

  // Compute active step
  const getActiveStep = () => {
    if (!mainStep) return null;
    if (currentBranch && mainStep.stepType === 'decision') {
      try {
        const bd = JSON.parse(mainStep.branchData || '{}');
        const branchSteps = currentBranch === 'yes' ? (bd.yesBranch || []) : (bd.noBranch || []);
        return branchSteps[currentBranchIndex] || null;
      } catch { return null; }
    }
    return mainStep;
  };

  const activeStep = getActiveStep();
  const isDecisionQuestion = activeStep?.stepType === 'decision' && currentBranch === null;
  const canProceed = isDecisionQuestion ? !!selectedDecision : true;

  const handleAcknowledge = async () => {
    if (!canProceed || submitting) return;
    setSubmitting(true);
    try {
      const logData = {
        stepId: activeStep.id || String(activeStep.stepNumber),
        stepTitle: activeStep.title,
        stepType: activeStep.stepType,
        branchChoice: isDecisionQuestion ? selectedDecision : undefined,
      };
      const logRes = await sessionService.acknowledge(sessionId, logData);
      setStepLogs(prev => [...prev, logRes.data]);

      // Advance state
      if (mainStep.stepType === 'decision' && currentBranch === null) {
        try {
          const bd = JSON.parse(mainStep.branchData || '{}');
          const branchSteps = selectedDecision === 'yes' ? (bd.yesBranch || []) : (bd.noBranch || []);
          if (branchSteps.length > 0) {
            setCurrentBranch(selectedDecision);
            setCurrentBranchIndex(0);
          } else { advanceMain(); }
        } catch { advanceMain(); }
      } else if (currentBranch) {
        try {
          const bd = JSON.parse(mainStep.branchData || '{}');
          const branchSteps = currentBranch === 'yes' ? (bd.yesBranch || []) : (bd.noBranch || []);
          if (currentBranchIndex + 1 < branchSteps.length) {
            setCurrentBranchIndex(p => p + 1);
          } else { advanceMain(); }
        } catch { advanceMain(); }
      } else {
        advanceMain();
      }
    } catch (err) {
      console.error('Acknowledge error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const advanceMain = async () => {
    if (currentIndex + 1 < steps.length) {
      setCurrentIndex(p => p + 1);
      setCurrentBranch(null);
      setCurrentBranchIndex(0);
      setSelectedDecision(null);
    } else {
      // Complete the session
      try {
        await sessionService.complete(sessionId);
        setCompleted(true);
      } catch (err) { console.error(err); }
    }
  };

  const typeLabel = session.procedureType === 'opening' ? 'Opening Procedure' : 'Closing Procedure';
  const typeColor = session.procedureType === 'opening' ? '#22c55e' : '#818cf8';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-dark))',
        padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <button onClick={() => navigate('/station')} style={{
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: '50%', width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer',
        }}>
          <ArrowLeft size={15} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={11} /> {session.station?.name} · {session.station?.stationCode}
          </div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>{typeLabel}</div>
        </div>
        <span style={{
          background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.72rem',
          fontWeight: 700, padding: '4px 12px', borderRadius: 99, letterSpacing: '0.05em',
        }}>
          {session.sop?.title}
        </span>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
        {completed ? (
          /* Completion Screen */
          <div style={{
            background: 'var(--bg-surface)',
            border: '2px solid var(--brand-primary)',
            borderRadius: 20, padding: 36, textAlign: 'center',
            boxShadow: '0 8px 32px rgba(26,158,150,0.2)',
            animation: 'badgePop 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(26,158,150,0.1)', color: 'var(--brand-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Award size={32} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Procedure Completed!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 8 }}>
              {typeLabel} for <strong>{session.station?.name}</strong> has been fully acknowledged and logged.
            </p>

            {/* Audit Log */}
            <div style={{ marginTop: 24, textAlign: 'left' }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>
                Audit Log — {stepLogs.length} steps acknowledged
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-base)' }}>
                {stepLogs.map((log, i) => (
                  <div key={i} style={{
                    padding: '9px 14px', borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: '0.78rem',
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.stepTitle || `Step ${i + 1}`}</span>
                      {log.branchChoice && (
                        <span style={{ marginLeft: 8, fontSize: '0.68rem', background: log.branchChoice === 'yes' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: log.branchChoice === 'yes' ? '#22c55e' : '#ef4444', padding: '1px 6px', borderRadius: 4 }}>
                          {log.branchChoice.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      {new Date(log.acknowledgedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24 }}>
              <button onClick={() => navigate('/station')} className="btn btn-primary" style={{ padding: '10px 24px' }}>
                Back to Station Portal
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 18px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 8, color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: typeColor, display: 'inline-block' }} />
                  {typeLabel}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--brand-accent)' }}>{progressPercent}% Complete</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--brand-primary)', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* Step Container */}
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 18, padding: 24,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              animation: 'badgePop 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                <span style={{ background: 'rgba(26,158,150,0.1)', color: 'var(--brand-accent)', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
                  Main Step {currentIndex + 1} of {steps.length}
                </span>
                {currentBranch && (
                  <span style={{
                    background: currentBranch === 'yes' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    color: currentBranch === 'yes' ? '#22c55e' : '#ef4444',
                    fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                    border: `1px solid ${currentBranch === 'yes' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  }}>
                    {currentBranch.toUpperCase()} Path · Sub-step {currentBranchIndex + 1}
                  </span>
                )}
              </div>

              {/* Decision prompt */}
              {isDecisionQuestion ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 20 }}>
                  <div style={{
                    width: 56, height: 56, transform: 'rotate(45deg)',
                    border: '3px solid #f59e0b', borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(245,158,11,0.05)',
                  }}>
                    <span style={{ transform: 'rotate(-45deg)', fontSize: '1.4rem', fontWeight: 900, color: '#f59e0b' }}>?</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{activeStep?.title}</h3>
                    {activeStep?.body && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 6 }}>{activeStep.body}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 14, width: '100%', maxWidth: 340 }}>
                    <button onClick={() => setSelectedDecision('yes')} style={{
                      flex: 1, padding: '16px', borderRadius: 12, fontWeight: 700, cursor: 'pointer',
                      border: `2px solid ${selectedDecision === 'yes' ? '#22c55e' : 'var(--border)'}`,
                      background: selectedDecision === 'yes' ? 'rgba(34,197,94,0.08)' : 'var(--bg-card)',
                      color: selectedDecision === 'yes' ? '#22c55e' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                    }}>
                      <CheckCircle size={18} style={{ display: 'block', margin: '0 auto 6px' }} />
                      YES
                    </button>
                    <button onClick={() => setSelectedDecision('no')} style={{
                      flex: 1, padding: '16px', borderRadius: 12, fontWeight: 700, cursor: 'pointer',
                      border: `2px solid ${selectedDecision === 'no' ? '#ef4444' : 'var(--border)'}`,
                      background: selectedDecision === 'no' ? 'rgba(239,68,68,0.08)' : 'var(--bg-card)',
                      color: selectedDecision === 'no' ? '#ef4444' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                    }}>
                      <XCircle size={18} style={{ display: 'block', margin: '0 auto 6px' }} />
                      NO
                    </button>
                  </div>
                </div>
              ) : (
                activeStep && <StepCard step={activeStep} />
              )}

              {/* Acknowledge & Continue */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
                <button
                  disabled={!canProceed || submitting}
                  onClick={handleAcknowledge}
                  style={{
                    padding: '11px 28px', borderRadius: 9, fontWeight: 700, fontSize: '0.9rem',
                    background: canProceed ? 'var(--brand-primary)' : 'var(--border)',
                    color: canProceed ? '#fff' : 'var(--text-secondary)',
                    border: 'none', cursor: canProceed ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s ease',
                    boxShadow: canProceed ? '0 4px 16px rgba(26,158,150,0.3)' : 'none',
                  }}
                >
                  {submitting ? <Loader size={14} className="spin" /> : null}
                  Acknowledge & Continue
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
