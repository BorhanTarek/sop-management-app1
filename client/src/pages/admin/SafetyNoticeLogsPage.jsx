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

  // Prints the safety notice acknowledgment receipt as a PDF
  const downloadPDF = (log) => {
    const dateStr = new Date(log.acknowledgedAt).toLocaleDateString('en-GB');
    const timeStr = new Date(log.acknowledgedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert("Please allow popups to download/print PDF.");
      return;
    }
    
    const signatureHtml = log.user?.signatureData
      ? `
        <div style="text-align: center; border: 1px solid #d2eae4; background: #f9fdfc; padding: 16px; border-radius: 8px; width: 240px; margin-left: auto;">
          <p style="font-size: 12px; font-weight: bold; margin: 0 0 8px 0; color: #2d4d48;">User Digital Signature / توقيع المستخدم</p>
          <img src="${log.user.signatureData}" alt="Signature" style="max-height: 70px; max-width: 200px; background: #ffffff; border: 1px solid #e2f0ec; padding: 4px; border-radius: 4px;" />
          <p style="font-size: 11px; color: #22c55e; font-weight: bold; margin: 6px 0 0 0;">✓ System Verified Digitally</p>
          <p style="font-size: 9px; color: #688883; margin: 2px 0 0 0;">${new Date(log.acknowledgedAt).toLocaleString('en-GB')}</p>
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
        <title>Safety Notice Acknowledgment - ${wi?.title || 'Safety Notice'}</title>
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
          }
          .content-box {
            border: 1px solid #e2f0ec;
            background: #fafdfc;
            padding: 20px;
            border-radius: 8px;
            font-size: 14px;
            margin-bottom: 40px;
            text-align: left;
            white-space: pre-wrap;
          }
          .footer-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 50px;
            page-break-inside: avoid;
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
              <p class="header-subtitle">Safety Notice Acknowledgment Receipt / إيصال إقرار إشعار السلامة</p>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <span style="font-weight: bold; font-size: 18px; color: #00A591;">RATP DEV</span>
            </td>
          </tr>
        </table>

        <table class="meta-table">
          <tr>
            <td class="meta-label">Safety Notice Title / إشعار السلامة:</td>
            <td class="meta-value" colspan="3" style="font-weight: bold; color: #00A591; text-align: left;">${wi?.title || ''}</td>
          </tr>
          <tr>
            <td class="meta-label">Acknowledged By / بواسطة:</td>
            <td class="meta-value" style="text-align: left;">${log.user?.fullName || ''}</td>
            <td class="meta-label">Email / البريد الإلكتروني:</td>
            <td class="meta-value" style="text-align: left;">${log.user?.email || ''}</td>
          </tr>
          <tr>
            <td class="meta-label">Roles / الأدوار:</td>
            <td class="meta-value" style="text-align: left;">${(log.user?.roles || []).join(', ')}</td>
            <td class="meta-label">Acknowledged At / وقت الإقرار:</td>
            <td class="meta-value" style="text-align: left;">${dateStr} @ ${timeStr}</td>
          </tr>
        </table>

        <h2 style="font-size: 18px; color: #2d4d48; margin-bottom: 12px; border-bottom: 2px solid #e2f0ec; padding-bottom: 6px; text-align: left;">
          Document Details / تفاصيل الإشعار
        </h2>
        <div class="content-box">
          ${wi?.content || ''}
        </div>

        <div class="footer-container">
          <div style="font-size: 11px; color: #688883; text-align: left;">
            <p style="margin: 0 0 4px 0;">This acknowledgment receipt is digitally signed and registered in the compliance system.</p>
            <p style="margin: 0;">Log ID: ${log.id}</p>
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

  // Prints all acknowledgment logs as a clean paginated PDF report (max 15 logs per page)
  const downloadAllLogsPDF = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=900');
    if (!printWindow) {
      alert("Please allow popups to export PDF.");
      return;
    }

    const chunkSize = 15;
    const chunks = [];
    for (let i = 0; i < logs.length; i += chunkSize) {
      chunks.push(logs.slice(i, i + chunkSize));
    }

    const pagesHtml = chunks.map((chunk, pageIndex) => {
      const rowsHtml = chunk.map((log, index) => {
        const signatureImgHtml = log.user.signatureData
          ? `<img src="${log.user.signatureData}" alt="Signature" style="max-height: 25px; max-width: 70px; object-fit: contain;" />`
          : '<span style="font-size: 11px; color: #888; font-style: italic;">No Signature</span>';
        
        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #d2eae4; font-size: 12px; font-weight: bold; text-align: left;">${log.user.fullName}</td>
            <td style="padding: 10px; border-bottom: 1px solid #d2eae4; font-size: 12px; text-align: left;">${log.user.email}</td>
            <td style="padding: 10px; border-bottom: 1px solid #d2eae4; font-size: 11px; color: #666; text-align: left;">${(log.user.roles || []).join(', ')}</td>
            <td style="padding: 10px; border-bottom: 1px solid #d2eae4; text-align: center;">${signatureImgHtml}</td>
            <td style="padding: 10px; border-bottom: 1px solid #d2eae4; font-size: 12px; white-space: nowrap; text-align: left;">
              ${new Date(log.acknowledgedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </td>
          </tr>
        `;
      }).join('');

      const pageBreakStyle = pageIndex < chunks.length - 1 ? 'page-break-after: always;' : '';

      return `
        <div class="page-container" style="${pageBreakStyle} padding: 20px; box-sizing: border-box; min-height: 297mm;">
          <!-- Page Header -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border-bottom: 2px solid #00A591; padding-bottom: 10px;">
            <tr>
              <td style="text-align: left;">
                <h1 style="font-size: 18px; font-weight: bold; color: #00A591; margin: 0; text-align: left;">CAIRO METRO LINE 3</h1>
                <p style="font-size: 12px; color: #688883; margin: 2px 0 0 0; text-align: left;">Safety Notice Acknowledgment Report / تقرير إقرار إشعار السلامة</p>
              </td>
              <td style="text-align: right; font-size: 12px; color: #688883; vertical-align: middle;">
                <span style="font-weight: bold; color: #00A591; font-size: 14px;">RATP DEV</span><br/>
                Page / صفحة ${pageIndex + 1} of ${chunks.length}
              </td>
            </tr>
          </table>

          <div style="margin-bottom: 15px; font-size: 13px; color: #2d4d48; text-align: left;">
            Safety Notice Title / عنوان الإشعار: <strong>${wi?.title}</strong>
          </div>

          <!-- Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #00A591; color: #ffffff;">
                <th style="padding: 10px; font-size: 12px; text-transform: uppercase; text-align: left;">Operator / Driver</th>
                <th style="padding: 10px; font-size: 12px; text-transform: uppercase; text-align: left;">Username</th>
                <th style="padding: 10px; font-size: 12px; text-transform: uppercase; text-align: left;">Roles</th>
                <th style="padding: 10px; font-size: 12px; text-transform: uppercase; text-align: center; width: 150px;">Signature</th>
                <th style="padding: 10px; font-size: 12px; text-transform: uppercase; text-align: left;">Acknowledged Date</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Safety Notice Acknowledgment Audit Report</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #082823;
            margin: 0;
            padding: 0;
            background: #ffffff;
          }
          @media print {
            body {
              background: #ffffff;
            }
            .page-container {
              width: 100%;
              height: auto;
            }
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
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
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={downloadAllLogsPDF}>
              <Download size={14} /> Export PDF Report
            </button>
            <button className="btn btn-primary" onClick={handleExportCSV}>
              <Download size={14} /> Export CSV
            </button>
          </div>
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
                <th>Signature</th>
                <th>Acknowledged Time & Date</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
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
                    {/* Signature Preview Column */}
                    <td>
                      {log.user.signatureData ? (
                        <img
                          src={log.user.signatureData}
                          alt="Signature"
                          style={{
                            maxHeight: 24,
                            maxWidth: 80,
                            objectFit: 'contain',
                            background: '#ffffff',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '2px 4px',
                            display: 'block'
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          No Signature
                        </span>
                      )}
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
                    <td>
                      <button
                        onClick={() => downloadPDF(log)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          padding: '4px 8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '0.72rem',
                          background: 'rgba(99,102,241,0.08)',
                          color: '#6366f1',
                          borderColor: 'rgba(99,102,241,0.18)'
                        }}
                      >
                        <Download size={11} /> PDF
                      </button>
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
