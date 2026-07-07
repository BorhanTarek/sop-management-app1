import { useState } from 'react';
import { ShieldCheck, PenLine, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import SignaturePad from './SignaturePad';
import { signatureService } from '../../services/services';
import { useAuthStore } from '../../store/authStore';
import mobilityLogo from '../../assets/Logo-Mobility-Cairo.png';
import ratpLogo from '../../assets/RDMC LOGO.jpg';

/**
 * Full-screen blocking modal shown when onboarding is incomplete:
 * - user.hasChangedPassword === false OR user.hasSetSignature === false
 * Cannot be dismissed without completing the required steps.
 */
export default function SignatureSetupModal() {
  const { user, setOnboardingComplete } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Onboarding needs
  const needsPassword = user?.hasChangedPassword === false;
  const needsSignature = user?.hasSetSignature === false;

  // Wizard state: start at step 1 if password needs changing, else step 2
  const [step, setStep] = useState(needsPassword ? 1 : 2);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (needsSignature) {
      setStep(2);
    } else {
      handleSaveOnlyPassword();
    }
  };

  const handleSaveOnlyPassword = async () => {
    setSaving(true);
    setError('');
    try {
      await signatureService.saveOnboarding(newPassword, null);
      setSuccess(true);
      setTimeout(() => {
        setOnboardingComplete();
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async (signatureData) => {
    setSaving(true);
    setError('');
    try {
      const passwordToSubmit = needsPassword ? newPassword : null;
      await signatureService.saveOnboarding(passwordToSubmit, signatureData);
      setSuccess(true);
      setTimeout(() => {
        setOnboardingComplete();
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to complete onboarding. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(8, 40, 35, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        boxShadow: '0 32px 64px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: 540,
        overflow: 'hidden',
        animation: 'slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {/* Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-dark))',
          padding: '20px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {step === 1 ? <Lock size={20} color="#fff" /> : <PenLine size={22} color="#fff" />}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>
                {step === 1 ? 'Password Setup' : 'Signature Setup'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem' }}>
                Required before accessing the portal
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={mobilityLogo} alt="Mobility Cairo" style={{ height: 28, objectFit: 'contain' }} />
            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.2)' }} />
            <img src={ratpLogo} alt="RATP Dev" style={{ height: 20, objectFit: 'contain', borderRadius: 2 }} />
          </div>
        </div>

        {/* Progress step bar if both are needed */}
        {needsPassword && needsSignature && !success && (
          <div style={{
            display: 'flex',
            background: 'var(--bg-hover)',
            borderBottom: '1px solid var(--border)',
            padding: '12px 28px',
            gap: 16
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: '0.78rem', fontWeight: 700,
              color: step === 1 ? 'var(--brand-primary)' : 'var(--text-muted)'
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                background: step === 1 ? 'var(--brand-primary)' : 'var(--border)',
                color: step === 1 ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem'
              }}>1</span>
              Password Reset
            </div>
            <div style={{ width: 40, height: 1, background: 'var(--border)', alignSelf: 'center' }} />
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: '0.78rem', fontWeight: 700,
              color: step === 2 ? 'var(--brand-primary)' : 'var(--text-muted)'
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                background: step === 2 ? 'var(--brand-primary)' : 'var(--border)',
                color: step === 2 ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem'
              }}>2</span>
              Digital Signature
            </div>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '28px' }}>
          {success ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '32px 16px', gap: 12,
              background: 'rgba(16, 185, 129, 0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}>
              <div style={{
                width: 56, height: 56,
                background: 'rgba(16,185,129,0.15)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShieldCheck size={28} style={{ color: '#10b981' }} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#10b981' }}>Onboarding Complete!</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Redirecting to your portal...</div>
            </div>
          ) : step === 1 ? (
            /* Step 1: Change Password Form */
            <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                background: 'var(--bg-hover)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                marginBottom: 8,
              }}>
                <Lock size={20} style={{ color: 'var(--brand-primary)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                    Mandatory Password Reset
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    For security reasons, you must change your default password on your first login before you can access the SOP portal.
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                  }}
                  required
                />
              </div>

              {error && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ef4444', fontSize: '0.78rem', fontWeight: 500,
                }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  marginTop: 8,
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontWeight: 700,
                }}
              >
                {needsSignature ? 'Continue to Signature' : 'Save & Proceed'}
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            /* Step 2: Signature Pad */
            <>
              {needsPassword && (
                <button
                  onClick={() => setStep(1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    marginBottom: 16,
                    padding: 0
                  }}
                >
                  <ArrowLeft size={14} /> Back to Password
                </button>
              )}

              <SignaturePad
                onSave={handleSaveAll}
                saving={saving}
                label="Draw your official signature below. This will be recorded on shift documentation."
              />
              {error && (
                <div style={{
                  marginTop: 12, padding: '10px 14px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ef4444', fontSize: '0.78rem', fontWeight: 500,
                }}>
                  ⚠️ {error}
                </div>
              )}
            </>
          )}

          {/* Footer note */}
          {!success && (
            <p style={{ marginTop: 16, fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Onboarding settings are mandatory before accessing dashboard functions.
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
