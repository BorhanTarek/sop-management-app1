import React, { useState, useEffect } from 'react';
import { Filter, RefreshCw, MapPin, User, Loader, Calendar, ClipboardCheck, Clock, Activity, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { stationService, checklistService } from '../../services/services';

// Calculates whether a submission is within target limits (+- 5 mins)
function getComplianceStatus(log) {
  if (!log.submittedAt || !log.station) return { isCompliant: false, diffMin: 0 };
  
  const targetTimeStr = log.procedureType === 'opening'
    ? (log.station.openingTime || '05:00')
    : (log.station.closingTime || '23:00');
  
  // Parse submitted time
  const subDate = new Date(log.submittedAt);
  const subHours = subDate.getHours();
  const subMins = subDate.getMinutes();
  
  // Parse target time
  const [targetHours, targetMins] = targetTimeStr.split(':').map(Number);
  
  // Convert both to total minutes from midnight to compare
  const subTotalMin = subHours * 60 + subMins;
  const targetTotalMin = targetHours * 60 + targetMins;
  
  const diffMin = subTotalMin - targetTotalMin;
  
  // Compliance range: +- 5 mins
  const isCompliant = Math.abs(diffMin) <= 5;
  
  return { isCompliant, diffMin };
}

// Sub-component for individual Station Hours configuration card
function StationHoursCard({ station, openLog, closeLog, onSaved }) {
  const [openTime, setOpenTime] = useState(station.openingTime || '05:00');
  const [closeTime, setCloseTime] = useState(station.closingTime || '23:00');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state if station prop changes
  useEffect(() => {
    setOpenTime(station.openingTime || '05:00');
    setCloseTime(station.closingTime || '23:00');
  }, [station]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await stationService.update(station.id, {
        openingTime: openTime,
        closingTime: closeTime
      });
      setSavedSuccess(true);
      if (onSaved) {
        onSaved(station.id, openTime, closeTime);
      }
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to save operating hours settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--brand-dark)' }}>{station.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{station.stationCode}</div>
        </div>
        {station.nameAr && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right', direction: 'rtl', fontWeight: 600 }}>
            {station.nameAr}
          </div>
        )}
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: 4, fontWeight: 700 }}>
              Opening Time
            </label>
            <input
              type="time"
              className="form-control"
              value={openTime}
              onChange={e => setOpenTime(e.target.value)}
              style={{ padding: '6px 8px', fontSize: '0.8rem', height: 32 }}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.7rem', marginBottom: 4, fontWeight: 700 }}>
              Closing Time
            </label>
            <input
              type="time"
              className="form-control"
              value={closeTime}
              onChange={e => setCloseTime(e.target.value)}
              style={{ padding: '6px 8px', fontSize: '0.8rem', height: 32 }}
              required
            />
          </div>
        </div>

        {/* Actual Opening and Closing Log Display */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px',
          background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
          marginTop: 2
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Actual Opening:</span>
            {openLog ? (
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <span style={{ fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                  {new Date(openLog.submittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {new Date(openLog.submittedAt).toLocaleDateString('en-GB')}
                </span>
              </div>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.74rem' }}>Not opened</span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Actual Closing:</span>
            {closeLog ? (
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <span style={{ fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                  {new Date(closeLog.submittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {new Date(closeLog.submittedAt).toLocaleDateString('en-GB')}
                </span>
              </div>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.74rem' }}>Not closed</span>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary"
          style={{
            padding: '4px 10px', fontSize: '0.78rem', width: '100%', height: 32,
            justifyContent: 'center', borderRadius: 'var(--radius-sm)', fontWeight: 700,
            background: savedSuccess ? '#22c55e' : 'var(--brand-primary)',
            borderColor: savedSuccess ? '#22c55e' : 'var(--brand-primary)'
          }}
        >
          {saving ? 'Saving...' : savedSuccess ? 'Saved ✓' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}

export default function ComplianceDashboard() {
  const [checklistLogs, setChecklistLogs] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('opening'); // 'opening' | 'closing' | 'hours'
  const [filter, setFilter] = useState({ stationId: '', date: new Date().toISOString().slice(0, 10) });
  const [expandedLogId, setExpandedLogId] = useState(null);

  const load = () => {
    setLoading(true);
    
    Promise.all([
      checklistService.getLogs(),
      stationService.list()
    ])
      .then(([resChecklists, resStations]) => {
        setStations(resStations.data);
        
        // Filter checklist logs locally using filters
        let clData = resChecklists.data;
        if (filter.stationId) {
          clData = clData.filter(log => log.stationId === filter.stationId);
        }
        if (filter.date) {
          clData = clData.filter(log => log.shiftDate === filter.date);
        }
        setChecklistLogs(clData);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  // Handle instant state update locally when operating hours change
  const handleStationHoursUpdated = (stationId, openingTime, closingTime) => {
    // 1. Update station list state locally
    setStations(prev => prev.map(st => {
      if (st.id === stationId) {
        return { ...st, openingTime, closingTime };
      }
      return st;
    }));

    // 2. Update logs array locally so compliance values and stats count refresh instantly
    setChecklistLogs(prev => prev.map(log => {
      if (log.stationId === stationId) {
        return {
          ...log,
          station: {
            ...log.station,
            openingTime,
            closingTime
          }
        };
      }
      return log;
    }));
  };

  // Filter logs for the active tab (opening or closing)
  const displayedLogs = activeTab === 'opening'
    ? checklistLogs.filter(log => log.procedureType === 'opening')
    : activeTab === 'closing'
      ? checklistLogs.filter(log => log.procedureType === 'closing')
      : checklistLogs;

  // Export current checklist logs array to CSV file
  const exportLogs = () => {
    const logsToExport = activeTab === 'opening' || activeTab === 'closing' ? displayedLogs : checklistLogs;
    
    if (logsToExport.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      "Station Code",
      "Station Name",
      "Station Master Name",
      "Station Master Email",
      "Shift Date",
      "Procedure Type",
      "Compliance Status",
      "Submitted At"
    ];

    const rows = logsToExport.map(log => {
      const comp = getComplianceStatus(log);
      return [
        log.station?.stationCode || '',
        log.station?.name || '',
        log.user?.fullName || '',
        log.user?.email || '',
        log.shiftDate || '',
        log.procedureType || '',
        comp.isCompliant ? 'Compliant' : 'Non-Compliant',
        log.submittedAt ? new Date(log.submittedAt).toISOString() : ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `station_${activeTab}_logs_${filter.date || 'all'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prints the checklist log as a beautiful compliant PDF
  const downloadPDF = (log) => {
    const comp = getComplianceStatus(log);
    const dateStr = new Date(log.submittedAt).toLocaleDateString('en-GB');
    const timeStr = new Date(log.submittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert("Please allow popups to download/print PDF.");
      return;
    }
    
    const itemsHtml = log.items && log.items.length > 0
      ? log.items.map(item => {
          const valText = item.value === 'true' ? '✓ Completed' : item.value === 'false' ? '✗ Uncompleted' : item.value;
          const valColor = item.value === 'true' ? '#22c55e' : item.value === 'false' ? '#ef4444' : '#082823';
          return `
            <tr>
              <td style="padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #e2f0ec; text-align: left;">${item.taskText}</td>
              <td style="padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #e2f0ec; font-weight: bold; color: ${valColor}; text-align: left;">${valText}</td>
            </tr>
          `;
        }).join('')
      : '<tr><td colspan="2" style="text-align: center; color: #888; padding: 20px;">No items in this checklist.</td></tr>';

    const signatureHtml = log.user?.signatureData
      ? `
        <div style="text-align: center; border: 1px solid #d2eae4; background: #f9fdfc; padding: 16px; border-radius: 8px; width: 240px; margin-left: auto;">
          <p style="font-size: 12px; font-weight: bold; margin: 0 0 8px 0; color: #2d4d48;">Station Master Signature / توقيع مدير المحطة</p>
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
        <title>SOP Checklist Log - ${log.station?.name || 'Station'}</title>
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
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          .items-table th {
            background: #00A591;
            color: #ffffff;
            text-align: left;
            padding: 10px 16px;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
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
              <span class="compliance-badge ${comp.isCompliant ? 'badge-compliant' : 'badge-noncompliant'}">
                ${comp.isCompliant ? 'Compliant / مطابق' : 'Non-Compliant / غير مطابق'}
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

  // Calculate dynamic stats widgets values based on currently filtered logs
  const stats = {
    total: checklistLogs.length,
    openingCount: checklistLogs.filter(log => log.procedureType === 'opening').length,
    closingCount: checklistLogs.filter(log => log.procedureType === 'closing').length,
    late: checklistLogs.filter(log => {
      const comp = getComplianceStatus(log);
      return !comp.isCompliant; // Submissions outside +- 5 min target time
    }).length,
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Compliance Dashboard</h1>
          <p style={{ marginTop: 4, fontSize: '0.85rem' }}>Live station shift execution audit for Cairo Metro Line 3</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={exportLogs}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn btn-ghost" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Submissions', value: stats.total, icon: Activity, color: '#6366f1' },
          { label: 'Opening Completed', value: stats.openingCount, icon: CheckCircle, color: '#22c55e' },
          { label: 'Closing Completed', value: stats.closingCount, icon: Clock, color: '#818cf8' },
          { label: 'Late Submissions', value: stats.late, icon: AlertTriangle, color: '#ef4444' },
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
        {activeTab !== 'hours' && (
          <select className="filter-select" value={filter.stationId} onChange={e => setFilter(f => ({ ...f, stationId: e.target.value }))}>
            <option value="">All Stations</option>
            {stations.map(s => <option key={s.id} value={s.id}>{s.stationCode} — {s.name}</option>)}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        <button
          onClick={() => setActiveTab('opening')}
          style={{
            padding: '10px 20px',
            fontSize: '0.85rem',
            fontWeight: 700,
            borderBottom: activeTab === 'opening' ? '2.5px solid var(--brand-primary)' : 'none',
            color: activeTab === 'opening' ? 'var(--brand-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            background: 'transparent'
          }}
        >
          Opening Forms Logs
        </button>
        <button
          onClick={() => setActiveTab('closing')}
          style={{
            padding: '10px 20px',
            fontSize: '0.85rem',
            fontWeight: 700,
            borderBottom: activeTab === 'closing' ? '2.5px solid var(--brand-primary)' : 'none',
            color: activeTab === 'closing' ? 'var(--brand-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            background: 'transparent'
          }}
        >
          Closing Forms Logs
        </button>
        <button
          onClick={() => setActiveTab('hours')}
          style={{
            padding: '10px 20px',
            fontSize: '0.85rem',
            fontWeight: 700,
            borderBottom: activeTab === 'hours' ? '2.5px solid var(--brand-primary)' : 'none',
            color: activeTab === 'hours' ? 'var(--brand-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            background: 'transparent'
          }}
        >
          Station Operating Hours
        </button>
      </div>

      {/* Content Area */}
      {(activeTab === 'opening' || activeTab === 'closing') && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Station Master</th>
                  <th>Shift Date</th>
                  <th>Procedure</th>
                  <th>Compliance</th>
                  <th>Signature</th>
                  <th>Submitted At</th>
                  <th style={{ width: 180 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><Loader size={22} className="spin" style={{ color: 'var(--brand-accent)' }} /></td></tr>
                ) : displayedLogs.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">📋</div><h3>No form records found</h3></div></td></tr>
                ) : displayedLogs.map(log => {
                  const comp = getComplianceStatus(log);
                  return (
                    <React.Fragment key={log.id}>
                      <tr>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MapPin size={12} style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />
                            <div>
                              <div className="cell-primary">{log.station?.name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.station?.stationCode}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <User size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <div>
                              <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{log.user?.fullName}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          <div>{log.shiftDate}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 400 }}>
                            {new Date(log.submittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </div>
                        </td>
                        <td>
                          <span style={{
                            padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
                            background: log.procedureType === 'opening' ? 'rgba(34,197,94,0.1)' : 'rgba(99,102,241,0.1)',
                            color: log.procedureType === 'opening' ? '#22c55e' : '#818cf8',
                            border: `1px solid ${log.procedureType === 'opening' ? 'rgba(34,197,94,0.2)' : 'rgba(99,102,241,0.2)'}`,
                            textTransform: 'capitalize',
                          }}>
                            {log.procedureType}
                          </span>
                        </td>
                        {/* Compliance Status Column */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              display: 'inline-block', width: 9, height: 9, borderRadius: '50%',
                              background: comp.isCompliant ? '#22c55e' : '#ef4444',
                              boxShadow: `0 0 6px ${comp.isCompliant ? '#22c55e' : '#ef4444'}`,
                              flexShrink: 0
                            }} />
                            <span style={{
                              fontSize: '0.78rem', fontWeight: 700,
                              color: comp.isCompliant ? '#22c55e' : '#ef4444'
                            }}>
                              {comp.isCompliant ? 'Compliant' : 'Non-Compliant'}
                            </span>
                          </div>
                        </td>
                        {/* Signature Column */}
                        <td>
                          {log.user?.signatureData ? (
                            <img
                              src={log.user.signatureData}
                              alt="Signature"
                              style={{
                                maxHeight: 28,
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
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          <div>{new Date(log.submittedAt).toLocaleDateString('en-GB')}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                            {new Date(log.submittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                              style={{
                                padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
                                background: 'rgba(0,165,145,0.08)', color: 'var(--brand-primary)', border: '1px solid rgba(0,165,145,0.18)', cursor: 'pointer'
                              }}
                            >
                              {expandedLogId === log.id ? 'Hide' : 'Answers'}
                            </button>
                            <button
                              onClick={() => downloadPDF(log)}
                              style={{
                                padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
                                background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.18)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4
                              }}
                            >
                              <Download size={11} /> PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedLogId === log.id && (
                        <tr>
                          <td colSpan={8} style={{ background: 'var(--bg-hover)', padding: '16px 24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 600 }}>
                              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                                Submitted Form Field Details:
                              </div>
                              {log.items?.length === 0 ? (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No questions answered in this log.</div>
                              ) : log.items?.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, fontSize: '0.82rem', borderBottom: '1px dashed var(--border)', paddingBottom: 6 }}>
                                  <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{item.taskText}</span>
                                  <span style={{
                                    fontWeight: 700,
                                    color: item.value === 'true' ? '#22c55e' : item.value === 'false' ? '#ef4444' : 'var(--text-primary)',
                                    textTransform: 'capitalize',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {item.value === 'true' ? '✓ Completed' : item.value === 'false' ? '✗ Uncompleted' : item.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'hours' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
          marginTop: 8
        }}>
          {loading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40 }}>
              <Loader size={22} className="spin" style={{ color: 'var(--brand-accent)' }} />
            </div>
          ) : stations.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="empty-state">
                <div className="empty-state-icon">🚉</div>
                <h3>No stations found</h3>
              </div>
            </div>
          ) : (
            stations.map(st => {
              const openLog = checklistLogs.find(log => log.stationId === st.id && log.procedureType === 'opening' && log.shiftDate === filter.date);
              const closeLog = checklistLogs.find(log => log.stationId === st.id && log.procedureType === 'closing' && log.shiftDate === filter.date);
              return (
                <StationHoursCard
                  key={st.id}
                  station={st}
                  openLog={openLog}
                  closeLog={closeLog}
                  onSaved={handleStationHoursUpdated}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
