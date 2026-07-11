import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ClipboardCheck, Loader, MapPin, Sun, Moon, Download, Calendar, Clock, User, Mail, Award, RotateCcw } from 'lucide-react';
import { stationService, checklistService } from '../../services/services';
import { useAuthStore } from '../../store/authStore';
import ratpLogo from '../../assets/RDMC LOGO.jpg';
import mobilityLogo from '../../assets/Logo-Mobility-Cairo.png';

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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState(null);

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
      const res = await checklistService.submit(payload);
      setSubmittedRecord(res.data);
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      alert(lang === 'ar' ? 'فشل إرسال البيانات' : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setIsSubmitted(false);
    setSubmittedRecord(null);
  };

  const downloadPDF = (log) => {
    if (!log) return;
    const dateStr = new Date(log.submittedAt).toLocaleDateString('en-GB');
    const timeStr = new Date(log.submittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    // Calculate compliance status
    const targetTimeStr = log.procedureType === 'opening'
      ? (log.station?.openingTime || '05:00')
      : (log.station?.closingTime || '23:00');
    
    const subDate = new Date(log.submittedAt);
    const subHours = subDate.getHours();
    const subMins = subDate.getMinutes();
    const [targetHours, targetMins] = targetTimeStr.split(':').map(Number);
    const subTotalMin = subHours * 60 + subMins;
    const targetTotalMin = targetHours * 60 + targetMins;
    const diffMin = subTotalMin - targetTotalMin;
    const isCompliant = Math.abs(diffMin) <= 5;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert("Please allow popups to download/print PDF.");
      return;
    }

    const itemsHtml = log.items && log.items.length > 0
      ? log.items.map(item => `
        <tr>
          <td style="padding: 10px 16px; border-bottom: 1px solid #e2f0ec; font-size: 13px; color: #082823; font-weight: 500; text-align: left;">${item.taskText}</td>
          <td style="padding: 10px 16px; border-bottom: 1px solid #e2f0ec; font-size: 13px; font-weight: bold; text-align: left; color: ${item.value === 'true' || item.value === true ? '#22c55e' : item.value === 'false' || item.value === false ? '#ef4444' : '#082823'}">
            ${item.value === 'true' || item.value === true ? '✓ Completed / مكتمل' : item.value === 'false' || item.value === false ? '✗ Uncompleted / غير مكتمل' : item.value}
          </td>
        </tr>
      `).join('')
      : `<tr><td colspan="2" style="padding: 20px; text-align: center; color: #888; font-style: italic;">No checklist details / لا توجد بنود</td></tr>`;

    const signatureHtml = log.user?.signatureData
      ? `
        <div style="text-align: center; border: 1px solid #d2eae4; background: #f9fdfc; padding: 16px; border-radius: 8px; width: 240px; margin-left: auto;">
          <p style="font-size: 12px; font-weight: bold; margin: 0 0 8px 0; color: #2d4d48;">User Digital Signature / توقيع المستخدم</p>
          <img src="${log.user.signatureData}" alt="Signature" style="max-height: 70px; max-width: 200px; background: #ffffff; border: 1px solid #e2f0ec; padding: 4px; border-radius: 4px;" />
          <p style="font-size: 11px; color: #22c55e; font-weight: bold; margin: 6px 0 0 0;">✓ System Verified Digitally</p>
          <p style="font-size: 9px; color: #688883; margin: 2px 0 0 0;">${new Date(log.submittedAt).toLocaleString('en-GB')}</p>
        </div>
      `
      : `
        <div style="border: 1px dashed #ccc; padding: 20px; border-radius: 8px; text-align: center; width: 240px; margin-left: auto;">
          <p style="color: #888; font-style: italic; margin: 0; font-size: 12px;">No digital signature on file / لا يوجد توقيع رقمي</p>
        </div>
      `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Compliance Log - ${log.station?.name || 'Station'}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #082823;
            margin: 0;
            padding: 40px;
            line-height: 1.5;
            background: #ffffff;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            border-bottom: 3px solid #00A591;
            padding-bottom: 20px;
          }
          .header-title {
            font-size: 24px;
            font-weight: bold;
            color: #00A591;
            margin: 0;
          }
          .header-subtitle {
            font-size: 14px;
            color: #688883;
            margin: 4px 0 0 0;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: #f4fcf9;
            border: 1px solid #d2eae4;
            border-radius: 8px;
          }
          .meta-table td {
            padding: 12px 16px;
            font-size: 14px;
            border-bottom: 1px solid #d2eae4;
          }
          .meta-table tr:last-child td {
            border-bottom: none;
          }
          .meta-label {
            font-weight: bold;
            color: #2d4d48;
            width: 25%;
          }
          .meta-value {
            color: #082823;
            text-align: left;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
            border: 1px solid #e2f0ec;
            border-radius: 8px;
            overflow: hidden;
          }
          .items-table th {
            font-weight: bold;
            text-align: left;
          }
          .items-table tr:nth-child(even) td {
            background: #fafdfc;
          }
          .footer-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 50px;
            page-break-inside: avoid;
          }
          .compliance-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 99px;
            font-size: 12px;
            font-weight: bold;
          }
          .badge-compliant {
            background: rgba(34,197,94,0.15);
            color: #22c55e;
            border: 1px solid rgba(34,197,94,0.3);
          }
          .badge-noncompliant {
            background: rgba(239,68,68,0.15);
            color: #ef4444;
            border: 1px solid rgba(239,68,68,0.3);
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="text-align: left;">
              <h1 class="header-title">CAIRO METRO LINE 3</h1>
              <p class="header-subtitle">Station Operations Compliance Report / تقرير مطابقة تشغيل المحطة</p>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <span style="font-weight: bold; font-size: 18px; color: #00A591;">RATP DEV</span>
            </td>
          </tr>
        </table>

        <table class="meta-table">
          <tr>
            <td class="meta-label">Station / المحطة:</td>
            <td class="meta-value">${log.station?.name || ''} (${log.station?.stationCode || ''})</td>
            <td class="meta-label">Procedure / الإجراء:</td>
            <td class="meta-value" style="text-transform: capitalize; font-weight: bold;">
              ${log.procedureType === 'opening' ? '☀️ Opening / فتح' : '🌙 Closing / إغلاق'}
            </td>
          </tr>
          <tr>
            <td class="meta-label">Station Master / مدير المحطة:</td>
            <td class="meta-value">${log.user?.fullName || ''}</td>
            <td class="meta-label">Shift Date / تاريخ الوردية:</td>
            <td class="meta-value">${log.shiftDate}</td>
          </tr>
          <tr>
            <td class="meta-label">Submitted At / وقت التقديم:</td>
            <td class="meta-value">${dateStr} @ ${timeStr}</td>
            <td class="meta-label">Compliance / المطابقة:</td>
            <td class="meta-value">
              <span class="compliance-badge ${isCompliant ? 'badge-compliant' : 'badge-noncompliant'}">
                ${isCompliant ? 'Compliant / مطابق' : 'Non-Compliant / غير مطابق'}
              </span>
            </td>
          </tr>
        </table>

        <h2 style="font-size: 18px; color: #2d4d48; margin-bottom: 12px; border-bottom: 2px solid #e2f0ec; padding-bottom: 6px; text-align: left;">
          Checklist Items / بنود قائمة التحقق
        </h2>
        <table class="items-table">
          <thead>
            <tr>
              <th style="background: #00A591; color: #ffffff; text-align: left; padding: 10px 16px; font-size: 13px; text-transform: uppercase;">Task / المهمة</th>
              <th style="background: #00A591; color: #ffffff; text-align: left; padding: 10px 16px; font-size: 13px; text-transform: uppercase; width: 30%;">Status / الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="footer-container">
          <div style="font-size: 11px; color: #688883; text-align: left;">
            <p style="margin: 0 0 4px 0;">This report is digitally generated by RATP Dev Mobility Cairo Compliance System.</p>
            <p style="margin: 0;">Report ID: ${log.id}</p>
          </div>
          ${signatureHtml}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <Loader size={32} className="spin" style={{ color: 'var(--brand-accent)' }} />
      </div>
    );
  }

  const isRtl = lang === 'ar';

  if (isSubmitted && submittedRecord) {
    const isOpening = submittedRecord.procedureType === 'opening';
    const accentColor = isOpening ? '#10b981' : '#6366f1';
    const accentAlpha = isOpening ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.12)';
    
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
              {isRtl ? 'حالة التقديم' : 'Submission Status'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={mobilityLogo} alt="Mobility Cairo Logo" style={{ height: 30, objectFit: 'contain' }} />
            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.2)' }} />
            <img src={ratpLogo} alt="RATP Dev Logo" style={{ height: 20, objectFit: 'contain', borderRadius: 2 }} />
          </div>
        </div>

        {/* Success summary container */}
        <div style={{ maxWidth: 540, margin: '24px auto', width: '100%', padding: '0 16px' }}>
          <div className="card" style={{
            padding: '36px 24px',
            textAlign: 'center',
            border: `2px solid ${accentColor}`,
            boxShadow: `0 8px 32px ${isOpening ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16
          }}>
            {/* Action Icon */}
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: accentAlpha,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor
            }}>
              {isOpening ? <Sun size={36} /> : <Moon size={36} />}
            </div>

            {/* Main title */}
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                {isOpening 
                  ? (isRtl ? 'تم فتح المحطة بنجاح!' : 'Station Successfully Opened!')
                  : (isRtl ? 'تم إغلاق المحطة بنجاح!' : 'Station Successfully Closed!')
                }
              </h2>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto', lineHeight: 1.55 }}>
                {isOpening
                  ? (isRtl 
                    ? `تم التحقق من جميع بنود الفتح وإقرارها لمحطة ${submittedRecord.station?.name}. تم تسجيل السجل بنجاح لضمان مطابقة السلامة.`
                    : `All opening checklist items for ${submittedRecord.station?.name || 'the station'} have been successfully verified and submitted.`)
                  : (isRtl
                    ? `تم التحقق من جميع بنود الإغلاق وإقرارها لمحطة ${submittedRecord.station?.name}. تم تسجيل السجل بنجاح لضمان مطابقة السلامة.`
                    : `All closing checklist items for ${submittedRecord.station?.name || 'the station'} have been successfully verified and submitted.`)
                }
              </p>
            </div>

            {/* Checklist details list */}
            <div style={{ width: '100%', marginTop: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div style={{ background: 'var(--bg-hover)', padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-secondary)', textAlign: isRtl ? 'right' : 'left' }}>
                {isRtl ? 'بنود قائمة التحقق المكتملة' : 'Completed Checklist Items'}
              </div>
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {submittedRecord.items?.map((item, i) => (
                  <div key={item.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < submittedRecord.items.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg-card)' }}>
                    <div style={{ textAlign: isRtl ? 'right' : 'left', flex: 1, paddingRight: 10 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.taskText}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 800,
                        background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e'
                      }}>
                        {isRtl ? 'مكتمل' : '✓ Completed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submission metadata & digital signature */}
            <div style={{
              width: '100%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              textAlign: isRtl ? 'right' : 'left'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2 }}>{isRtl ? 'مدير المحطة' : 'Station Master'}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{submittedRecord.user?.fullName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2 }}>{isRtl ? 'كود المستخدم' : 'Email/Code'}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{submittedRecord.user?.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2 }}>{isRtl ? 'المحطة' : 'Station'}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{submittedRecord.station?.stationCode} — {submittedRecord.station?.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2 }}>{isRtl ? 'تاريخ ووقت التقديم' : 'Submission Time'}</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {new Date(submittedRecord.submittedAt).toLocaleDateString('en-GB')} @ {new Date(submittedRecord.submittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </div>
                </div>
              </div>

              {submittedRecord.user?.signatureData && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {isRtl ? 'التوقيع الرقمي للمستخدم' : 'User Digital Signature'}
                  </div>
                  <img
                    src={submittedRecord.user.signatureData}
                    alt="User Signature"
                    style={{
                      maxHeight: 48,
                      maxWidth: 160,
                      objectFit: 'contain',
                      background: '#ffffff',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '2px 8px'
                    }}
                  />
                  <div style={{ fontSize: '0.65rem', color: '#22c55e', fontWeight: 700 }}>
                    {isRtl ? '✓ تم التحقق من الهوية رقمياً' : '✓ Digitally Verified'}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button 
                onClick={() => downloadPDF(submittedRecord)} 
                className="btn btn-secondary" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 42 }}
              >
                <Download size={15} /> {isRtl ? 'تحميل إيصال PDF' : 'Download PDF Receipt'}
              </button>
              <button 
                onClick={() => navigate('/browse')} 
                className="btn btn-primary" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 42 }}
              >
                {isRtl ? 'العودة للمحطة' : 'Back to Portal'}
              </button>
            </div>
            
            <button 
              onClick={handleRestart} 
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
                marginTop: 4
              }}
            >
              {isRtl ? 'تقديم نموذج جديد' : 'Submit Another Form'}
            </button>
          </div>
        </div>
      </div>
    );
  }

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

