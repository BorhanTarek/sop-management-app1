import { useState, useEffect } from 'react';
import { X, PenLine, User, ShieldCheck, Clock } from 'lucide-react';
import SignaturePad from './SignaturePad';
import { signatureService } from '../../services/services';
import { useAuthStore } from '../../store/authStore';

/**
 * Slide-in Account Settings modal.
 * Allows the user to view their profile info and update their signature.
 *
 * Props:
 *  - isOpen — boolean
 *  - onClose — callback to dismiss the modal
 */
export default function AccountSettingsModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const [currentSignature, setCurrentSignature] = useState(null);
  const [signatureSetAt, setSignatureSetAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingSignature, setLoadingSignature] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPad, setShowPad] = useState(false);

  // Fetch current signature when modal opens
  useEffect(() => {
    if (!isOpen) {
      // Reset UI state when closed
      setShowPad(false);
      setError('');
      setSuccessMsg('');
      return;
    }
    setLoadingSignature(true);
    signatureService.get()
      .then(res => {
        setCurrentSignature(res.data.user.signatureData || null);
        setSignatureSetAt(res.data.user.signatureSetAt || null);
      })
      .catch(err => console.error('Failed to load signature:', err))
      .finally(() => setLoadingSignature(false));
  }, [isOpen]);

  const handleUpdate = async (base64) => {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      await signatureService.save(base64);
      setCurrentSignature(base64);
      setSignatureSetAt(new Date().toISOString());
      setSuccessMsg('Signature updated successfully!');
      setShowPad(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to update signature. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const initials = user?.fullName
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 8000,
          background: 'rgba(8,40,35,0.5)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Side Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '100%', maxWidth: 480,
        zIndex: 8001,
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-dark))',
          padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <User size={20} color="#fff" />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>Account Settings</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>Profile & Signature Management</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Profile Card */}
          <div style={{
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 56, height: 56,
              background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-dark))',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', fontWeight: 800, color: '#fff',
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{user?.fullName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {user?.roles?.map(role => (
                  <span key={role} style={{
                    padding: '2px 8px', borderRadius: 99,
                    fontSize: '0.65rem', fontWeight: 700, textTransform: 'capitalize',
                    background: 'rgba(0,165,145,0.12)', color: 'var(--brand-primary)',
                    border: '1px solid rgba(0,165,145,0.2)',
                  }}>
                    {role.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PenLine size={16} style={{ color: 'var(--brand-primary)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  Digital Signature
                </span>
              </div>
              {!showPad && (
                <button
                  onClick={() => { setShowPad(true); setError(''); setSuccessMsg(''); }}
                  style={{
                    padding: '6px 14px', borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem', fontWeight: 700,
                    background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-dark))',
                    color: '#fff', border: 'none', cursor: 'pointer',
                  }}
                >
                  {currentSignature ? 'Update Signature' : 'Set Signature'}
                </button>
              )}
            </div>

            {/* Current signature preview */}
            {loadingSignature ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Loading signature...
              </div>
            ) : currentSignature ? (
              <div style={{
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                background: '#fff', padding: 8, marginBottom: showPad ? 16 : 0,
              }}>
                <img
                  src={currentSignature}
                  alt="Current Signature"
                  style={{ maxHeight: 100, width: '100%', objectFit: 'contain' }}
                />
                {signatureSetAt && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4, marginTop: 6,
                    fontSize: '0.65rem', color: 'var(--text-muted)',
                  }}>
                    <Clock size={10} />
                    Last updated: {new Date(signatureSetAt).toLocaleString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                )}
              </div>
            ) : (
              !showPad && (
                <div style={{
                  textAlign: 'center', padding: '24px 0',
                  color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic',
                }}>
                  No signature set yet.
                </div>
              )
            )}

            {/* New signature pad */}
            {showPad && (
              <div style={{ marginTop: currentSignature ? 0 : 0 }}>
                <SignaturePad
                  onSave={handleUpdate}
                  saving={saving}
                  label="Draw your new signature below to replace the current one."
                />
                <button
                  onClick={() => { setShowPad(false); setError(''); }}
                  style={{
                    marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)',
                    background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Feedback messages */}
            {successMsg && (
              <div style={{
                marginTop: 12, padding: '10px 14px',
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 'var(--radius-sm)', color: '#10b981', fontSize: '0.78rem',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <ShieldCheck size={14} /> {successMsg}
              </div>
            )}
            {error && (
              <div style={{
                marginTop: 12, padding: '10px 14px',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 'var(--radius-sm)', color: '#ef4444', fontSize: '0.78rem',
              }}>
                ⚠️ {error}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
}
