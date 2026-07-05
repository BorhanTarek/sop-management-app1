import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, Loader, Clock, UserCheck } from 'lucide-react';
import { safetyNoticeService, getImageUrl } from '../../services/services';
import mobilityLogo from '../../assets/Logo-Mobility-Cairo.png';
import ratpLogo from '../../assets/RDMC LOGO.jpg';
import { translations } from '../../utils/translations';

export default function SafetyNoticesBrowsePage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWi, setSelectedWi] = useState(null);
  const [zoomImage, setZoomImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Language state
  const [lang, setLang] = useState(localStorage.getItem('portal_lang') || 'en');

  const toggleLang = () => {
    const next = lang === 'en' ? 'ar' : 'en';
    setLang(next);
    localStorage.setItem('portal_lang', next);
  };

  const load = () => {
    setLoading(true);
    safetyNoticeService.list()
      .then(r => setData(r.data))
      .catch(err => {
        setError('Failed to load safety notices.');
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAcknowledge = async (wiId) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await safetyNoticeService.acknowledge(wiId);
      const res = await safetyNoticeService.list();
      setData(res.data);
      const updatedWi = res.data.find(w => w.id === wiId);
      if (updatedWi) setSelectedWi(updatedWi);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to acknowledge');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: lang === 'ar' ? 'Cairo, system-ui, sans-serif' : 'inherit' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-dark))',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/browse')} style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '50%', width: 34, height: 34,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer',
            transform: lang === 'ar' ? 'rotate(180deg)' : 'none'
          }}>
            <ArrowLeft size={16} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={mobilityLogo} alt="Mobility Cairo Logo" style={{ height: 36, objectFit: 'contain' }} />
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.2)' }} />
            <img src={ratpLogo} alt="RATP Dev Logo" style={{ height: 24, objectFit: 'contain', borderRadius: 2 }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={toggleLang} style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 'var(--radius-sm)', padding: '6px 12px',
            color: '#fff', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer'
          }}>
            {lang === 'en' ? 'العربية' : 'English'}
          </button>

          <span style={{
            background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.78rem',
            fontWeight: 700, padding: '4px 12px', borderRadius: 99, letterSpacing: '0.05em',
          }}>
            {translations[lang].safetyNoticesTitle}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
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
        ) : data.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 60,
            background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 20,
          }}>
            <Clock size={36} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>{translations[lang].noSafetyNotices}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              {translations[lang].noSafetyNoticesDesc}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.map(wi => (
              <div 
                key={wi.id}
                onClick={() => setSelectedWi(wi)}
                style={{
                  background: 'var(--bg-surface)',
                  border: `1.5px solid ${wi.isAcknowledged ? 'var(--border)' : 'rgba(26,158,150,0.3)'}`,
                  borderRadius: 16,
                  padding: 20,
                  cursor: 'pointer',
                  boxShadow: wi.isAcknowledged ? 'none' : '0 4px 14px rgba(26,158,150,0.08)',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--brand-primary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.borderColor = wi.isAcknowledged ? 'var(--border)' : 'rgba(26,158,150,0.3)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{wi.title}</h3>
                    <p style={{ 
                      fontSize: '0.8rem', 
                      color: 'var(--text-secondary)', 
                      marginTop: 6,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {wi.content}
                    </p>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 10 }}>
                      {translations[lang].released}: {new Date(wi.createdAt).toLocaleDateString('en-GB')}
                    </div>
                  </div>

                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background: wi.isAcknowledged ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                    color: wi.isAcknowledged ? '#22c55e' : '#ef4444',
                    border: `1px solid ${wi.isAcknowledged ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    borderRadius: 99,
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap'
                  }}>
                    {wi.isAcknowledged ? (
                      <><CheckCircle size={11} /> {translations[lang].acknowledged}</>
                    ) : (
                      <><AlertTriangle size={11} /> {translations[lang].actionRequired}</>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail view Modal */}
      {selectedWi && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedWi(null)}>
          <div className="modal" style={{ maxWidth: 800, width: '90%', maxHeight: '95vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{selectedWi.title}</h3>
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => setSelectedWi(null)}
                style={{ fontSize: '1.2rem', padding: 4 }}
              >
                ✕
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {selectedWi.imageUrl && (
                <div 
                  onClick={() => setZoomImage(true)}
                  style={{ 
                    position: 'relative', 
                    borderRadius: 10, 
                    overflow: 'hidden', 
                    border: '1px solid var(--border)', 
                    background: '#0a0b0d', 
                    display: 'flex', 
                    justifyContent: 'center',
                    padding: 8,
                    cursor: 'zoom-in'
                  }}
                >
                  {selectedWi.imageUrl.toLowerCase().endsWith('.pdf') ? (
                    <iframe 
                      src={getImageUrl(selectedWi.imageUrl)} 
                      style={{ width: '100%', height: 480, border: 'none', pointerEvents: 'none' }} 
                      title="Safety Notice PDF Preview"
                    />
                  ) : (
                    <img 
                      src={getImageUrl(selectedWi.imageUrl)} 
                      alt="Safety Notice Illustration"
                      style={{ width: '100%', height: 'auto', maxHeight: 650, objectFit: 'contain' }}
                    />
                  )}
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setZoomImage(true); }}
                    style={{
                      position: 'absolute',
                      bottom: 16,
                      right: lang === 'ar' ? 'auto' : 16,
                      left: lang === 'ar' ? 16 : 'auto',
                      background: 'rgba(0,0,0,0.75)',
                      color: '#fff',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      border: '1px solid rgba(255,255,255,0.25)',
                      cursor: 'zoom-in',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                      transition: 'all 0.1s ease',
                      zIndex: 5
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--brand-primary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.75)'}
                  >
                    🔍 {translations[lang].viewFullScreen}
                  </button>
                </div>
              )}

              <div style={{ 
                fontSize: '0.88rem', 
                color: 'var(--text-secondary)', 
                lineHeight: 1.6, 
                whiteSpace: 'pre-wrap', 
                background: 'var(--bg-input)',
                padding: 16,
                borderRadius: 10,
                border: '1px solid var(--border)',
                textAlign: lang === 'ar' ? 'right' : 'left'
              }}>
                {selectedWi.content}
              </div>

              {selectedWi.isAcknowledged ? (
                <div style={{
                  background: 'rgba(34,197,94,0.06)',
                  border: '1px solid rgba(34,197,94,0.25)',
                  color: '#22c55e',
                  borderRadius: 10,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.82rem',
                  fontWeight: 600
                }}>
                  <UserCheck size={16} /> 
                  <span>{translations[lang].safetyNoticeAckSuccess}</span>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#f87171',
                  borderRadius: 10,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.82rem',
                  lineHeight: 1.4
                }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} /> 
                  <span>{translations[lang].safetyNoticeCritical}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!selectedWi.isAcknowledged && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-surface)' }}>
                <button
                  onClick={() => handleAcknowledge(selectedWi.id)}
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ padding: '10px 24px', width: '100%', justifyContent: 'center' }}
                >
                  {submitting ? <Loader size={14} className="spin" /> : null}
                  {translations[lang].confirmAcknowledgeNotice}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Zoom Overlay */}
      {zoomImage && selectedWi && (
        <div 
          onClick={() => setZoomImage(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.96)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
            animation: 'fadeIn 0.12s ease'
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setZoomImage(false); }}
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#fff',
              width: 44,
              height: 44,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              cursor: 'pointer',
              zIndex: 2010,
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
          >
            ✕
          </button>
          {selectedWi.imageUrl.toLowerCase().endsWith('.pdf') ? (
            <iframe 
              src={getImageUrl(selectedWi.imageUrl)} 
              style={{ width: '92vw', height: '90vh', border: 'none', borderRadius: 8, background: '#fff' }} 
              title="Fullscreen Safety Notice PDF"
            />
          ) : (
            <img 
              src={getImageUrl(selectedWi.imageUrl)} 
              alt="Zoomed Directive"
              style={{
                maxWidth: '96vw',
                maxHeight: '96vh',
                objectFit: 'contain',
                borderRadius: 8,
                boxShadow: '0 12px 48px rgba(0,0,0,0.9)'
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
