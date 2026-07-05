import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ClipboardCheck, Loader, MapPin } from 'lucide-react';
import { stationService, checklistService } from '../../services/services';
import { useAuthStore } from '../../store/authStore';
import ratpLogo from '../../assets/RDMC LOGO.jpg';
import mobilityLogo from '../../assets/Logo-Mobility-Cairo.png';
import { translations } from '../../utils/translations';

export default function OpeningClosingSubmitPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [lang] = useState(localStorage.getItem('portal_lang') || 'en');
  const [stations, setStations] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  const [selectedStation, setSelectedStation] = useState('');
  const [mode, setMode] = useState('opening'); // 'opening' | 'closing'
  const [answers, setAnswers] = useState({}); // { [taskId]: value }
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Load all active stations and active questions
    Promise.all([
      stationService.list(),
      checklistService.getTasks()
    ])
      .then(([resStations, resTasks]) => {
        setStations(resStations.data);
        if (resStations.data.length === 1) {
          setSelectedStation(resStations.data[0].id);
        }
        setTasks(resTasks.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const currentTasks = tasks.filter(t => t.procedureType === mode);

  const handleInputChange = (taskId, value) => {
    setAnswers(prev => ({
      ...prev,
      [taskId]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStation) {
      alert(lang === 'ar' ? 'يرجى اختيار المحطة أولاً' : 'Please select a station first.');
      return;
    }

    // Validate that all questions are answered/checked
    const uncompleted = currentTasks.filter(t => {
      const ans = answers[t.id];
      if (t.controlType === 'checkbox' || t.controlType === 'action') {
        return ans !== true && ans !== 'true'; // must be checked
      }
      if (t.controlType === 'dropdown') {
        return !ans || !ans.trim(); // must select an option
      }
      return false;
    });

    if (uncompleted.length > 0) {
      alert(lang === 'ar' 
        ? 'يرجى إكمال جميع حقول التحقق والإقرار قبل الإرسال' 
        : 'Please complete all checkmarks and inputs before submitting.'
      );
      return;
    }

    setSubmitting(true);

    const payload = {
      stationId: selectedStation,
      procedureType: mode,
      shiftDate: new Date().toISOString().slice(0, 10),
      isCompliant: true,
      items: currentTasks.map(t => ({
        taskId: t.id,
        taskText: t.text,
        controlType: t.controlType,
        value: answers[t.id]
      }))
    };

    try {
      await checklistService.submit(payload);
      alert(lang === 'ar' ? 'تم تقديم النموذج وحفظ السجل بنجاح' : 'Shift record submitted successfully!');
      navigate('/browse');
    } catch (err) {
      console.error(err);
      alert(lang === 'ar' ? 'فشل إرسال البيانات' : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <Loader size={32} className="spin" style={{ color: 'var(--brand-accent)' }} />
      </div>
    );
  }

  const isRtl = lang === 'ar';

  return (
    <div className="flex-col" dir={isRtl ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Topbar header */}
      <div style={{
        background: 'var(--brand-primary)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/browse')} style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '50%', width: 34, height: 34,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer',
            transform: isRtl ? 'rotate(180deg)' : 'none'
          }}>
            <ArrowLeft size={16} />
          </button>
          
          <h2 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>
            {isRtl ? 'فتح وإغلاق المحطة' : 'Station Opening & Closing'}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={mobilityLogo} alt="Mobility Cairo Logo" style={{ height: 30, objectFit: 'contain' }} />
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.2)' }} />
          <img src={ratpLogo} alt="RATP Dev Logo" style={{ height: 20, objectFit: 'contain', borderRadius: 2 }} />
        </div>
      </div>

      {/* Main Submission Form */}
      <div style={{ maxWidth: 500, margin: '24px auto', width: '100%', padding: '0 16px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Station Card selection */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '0.92rem', marginBottom: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
              {isRtl ? '1. معلومات المناوبة والمحطة' : '1. Shift & Station Info'}
            </h3>
            
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>
                {isRtl ? 'المحطة المعينة' : 'Select Station'}
              </label>
              {stations.length <= 1 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-hover)' }}>
                  <MapPin size={14} style={{ color: 'var(--brand-primary)' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    {stations[0]?.stationCode} — {stations[0]?.name}
                  </span>
                </div>
              ) : (
                <select
                  className="form-control"
                  value={selectedStation}
                  onChange={e => setSelectedStation(e.target.value)}
                  required
                >
                  <option value="">{isRtl ? 'اختر المحطة...' : 'Choose Station...'}</option>
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.stationCode} — {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Read-only Station Master Name and Code */}
            <div className="grid-2" style={{ marginTop: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>
                  {isRtl ? 'اسم مدير المحطة' : 'Station Master Name'}
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={user?.fullName || ''}
                  disabled
                  style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize: '0.8rem', height: 36 }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>
                  {isRtl ? 'كود مدير المحطة' : 'Station Master Code'}
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={user?.email || ''}
                  disabled
                  style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize: '0.8rem', height: 36 }}
                />
              </div>
            </div>

            {/* Read-only Date and Time */}
            <div className="grid-2" style={{ marginTop: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>
                  {isRtl ? 'التاريخ' : 'Date'}
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={new Date().toLocaleDateString('en-GB')}
                  disabled
                  style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize: '0.8rem', height: 36 }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.72rem' }}>
                  {isRtl ? 'الوقت الحالي' : 'Time'}
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  disabled
                  style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize: '0.8rem', height: 36 }}
                />
              </div>
            </div>

            {/* Mode selection pills */}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button
                type="button"
                onClick={() => { setMode('opening'); setAnswers({}); }}
                style={{
                  flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                  border: `1.5px solid ${mode === 'opening' ? 'var(--brand-primary)' : 'var(--border)'}`,
                  background: mode === 'opening' ? 'var(--brand-light)' : 'transparent',
                  color: mode === 'opening' ? 'var(--brand-dark)' : 'var(--text-muted)',
                  textAlign: 'center'
                }}
              >
                {isRtl ? '☀️ فتح المحطة' : '☀️ Open Station'}
              </button>
              <button
                type="button"
                onClick={() => { setMode('closing'); setAnswers({}); }}
                style={{
                  flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                  border: `1.5px solid ${mode === 'closing' ? 'var(--brand-primary)' : 'var(--border)'}`,
                  background: mode === 'closing' ? 'var(--brand-light)' : 'transparent',
                  color: mode === 'closing' ? 'var(--brand-dark)' : 'var(--text-muted)',
                  textAlign: 'center'
                }}
              >
                {isRtl ? '🌙 إغلاق المحطة' : '🌙 Close Station'}
              </button>
            </div>
          </div>

          {/* Form Questions Card */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '0.92rem', marginBottom: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {isRtl ? '2. قائمة التحقق والإجراءات' : '2. Checklist Questions'}
            </h3>

            {currentTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                {isRtl 
                  ? 'لا توجد أسئلة مدرجة في هذا النموذج حالياً' 
                  : 'There are no questions configured for this mode.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {currentTasks.map((t, index) => {
                  let options = [];
                  if (t.controlType === 'dropdown' && t.options) {
                    try {
                      options = JSON.parse(t.options);
                    } catch (e) {
                      options = [];
                    }
                  }

                  return (
                    <div key={t.id} style={{
                      borderBottom: index < currentTasks.length - 1 ? '1px solid var(--border)' : 'none',
                      paddingBottom: index < currentTasks.length - 1 ? 16 : 0
                    }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                        {t.text}
                      </div>

                      {/* Render Checkbox type */}
                      {t.controlType === 'checkbox' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            id={`q-${t.id}`}
                            checked={answers[t.id] === true || answers[t.id] === 'true'}
                            onChange={e => handleInputChange(t.id, e.target.checked)}
                            style={{ width: 18, height: 18, cursor: 'pointer' }}
                          />
                          <label htmlFor={`q-${t.id}`} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            {isRtl ? 'تأكيد وإقرار بالإجراء' : 'Confirm and verify task'}
                          </label>
                        </div>
                      )}

                      {/* Render Dropdown type */}
                      {t.controlType === 'dropdown' && (
                        <select
                          className="form-control"
                          value={answers[t.id] || ''}
                          onChange={e => handleInputChange(t.id, e.target.value)}
                          required
                          style={{ maxWidth: 280 }}
                        >
                          <option value="">{isRtl ? 'اختر الإجابة...' : 'Choose option...'}</option>
                          {options.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {/* Render Process Action instruction type */}
                      {t.controlType === 'action' && (
                        <div style={{
                          padding: '10px 12px', background: 'var(--bg-hover)',
                          borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                          display: 'flex', alignItems: 'flex-start', gap: 10
                        }}>
                          <input
                            type="checkbox"
                            id={`q-${t.id}`}
                            checked={answers[t.id] === true || answers[t.id] === 'true'}
                            onChange={e => handleInputChange(t.id, e.target.checked)}
                            style={{ width: 18, height: 18, cursor: 'pointer', marginTop: 2 }}
                          />
                          <label htmlFor={`q-${t.id}`} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.4 }}>
                            {isRtl ? 'أقر بأنني قمت بتنفيذ هذا الإجراء المذكور أعلاه كاملاً' : 'I acknowledge that I have executed the required process action.'}
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit action bar */}
          {currentTasks.length > 0 && (
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                padding: '14px', borderRadius: 'var(--radius-md)', fontSize: '0.95rem',
                fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              {submitting ? (
                <Loader size={18} className="spin" />
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  {isRtl ? 'تقديم نموذج الوردية وحفظ السجل' : 'Submit Checklist & Save Logs'}
                </>
              )}
            </button>
          )}

        </form>
      </div>
    </div>
  );
}
