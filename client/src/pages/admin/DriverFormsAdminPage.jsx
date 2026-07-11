import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Trash2, Eye, EyeOff, Download, Search, Filter, RefreshCw,
  Train, AlertTriangle, CheckCircle2, Clock, Users, ChevronDown, ChevronUp,
  CalendarDays, TrendingUp, BarChart2, Wrench
} from 'lucide-react';
import { driverFormService } from '../../services/services';

const SWITCH_KEYS = ['atcbs', 'dis', 'pibs', 'vsos', 'dmcb', 'eos', 'eebs', 'rbcs', 'hbcs', 'gbccos', 'zvrbs'];
const SR_COLS = ['dtcL', 'mc1L', 'mc2L', 'mciL', 'mciR', 'mc2R', 'mc1R', 'dtcR'];
const SR_COL_LABELS = ['DTC', 'MC1', 'MC2', 'MCI', 'MCI', 'MC2', 'MC1', 'DTC'];
const BRAKE_COLS = ['mL', 'n1L', 'n2L', 'tL', 'tR', 'n2R', 'n1R', 'mR'];
const BRAKE_COL_LABELS = ['M', 'N1', 'N2', 'T', 'T', 'N2', 'N1', 'M'];

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, borderLeft: `3px solid ${color}` }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        <Icon size={18} />
      </div>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{sub}</div>}
      </div>
    </div>
  );
}

function ServiceBadge({ service }) {
  const map = {
    with_passengers: { label: 'With Passengers', color: '#22c55e', bg: '#f0fdf4' },
    empty: { label: 'Empty', color: '#6366f1', bg: '#eef2ff' },
    rescue: { label: 'Rescue', color: '#ef4444', bg: '#fef2f2' },
  };
  const s = map[service] || { label: service || '—', color: '#64748b', bg: '#f8fafc' };
  return (
    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, color: s.color, background: s.bg, border: `1px solid ${s.color}30` }}>
      {s.label}
    </span>
  );
}

function DetailRow({ label, labelAr, value }) {
  if (!value && value !== false) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
        {label}{labelAr && <span style={{ fontSize: '0.65rem', marginLeft: 4, direction: 'rtl', color: 'var(--text-muted)' }}>{labelAr}</span>}
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>{String(value)}</div>
    </div>
  );
}

function ExpandedForm({ form }) {
  const thStyle = { background: '#00A591', color: '#fff', padding: '6px 8px', fontSize: '0.68rem', fontWeight: 700, border: '1px solid rgba(255,255,255,0.15)' };
  const tdStyle = { padding: '4px 8px', fontSize: '0.72rem', border: '1px solid var(--border)' };

  return (
    <div style={{ padding: '16px 20px', background: 'var(--bg-hover)', borderTop: '2px solid var(--brand-primary)' }}>

      {/* Driver Details */}
      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--brand-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Train size={14} /> Driver Details / بيانات قائد القطار
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginBottom: 14, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <DetailRow label="Name" labelAr="الاسم" value={form.driverName} />
        <DetailRow label="Driver ID" labelAr="الرقم الوظيفي" value={form.driverId} />
        <DetailRow label="Shift Date" value={form.shiftDate} />
        <DetailRow label="Shift Code" value={form.shiftCode} />
        <DetailRow label="Train Type" value={form.trainType} />
        <DetailRow label="Shift Start" value={form.shiftStartTime} />
        <DetailRow label="Shift End" value={form.shiftEndTime} />
        <DetailRow label="Overtime Hours" value={form.overtimeHours} />
      </div>

      {/* Safety Notice */}
      {form.safetyNotice && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#e85d04', marginBottom: 6 }}>Safety Notice / إشعارات السلامة</div>
          <div style={{ padding: '10px 14px', background: '#fff8f0', border: '2px dashed #e85d04', borderRadius: 8, fontSize: '0.78rem' }}>{form.safetyNotice}</div>
        </div>
      )}

      {/* Cycle Details */}
      {form.cycleDetails?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0077b6', marginBottom: 6 }}>Cycle Details / بيانات الحلقة</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Trip', 'Units', 'Departure', 'Dep. Time', 'Arrival', 'Arr. Time', 'Remarks'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {form.cycleDetails.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-hover)' }}>
                  <td style={tdStyle}>{r.trip}</td>
                  <td style={tdStyle}>{r.units}</td>
                  <td style={tdStyle}>{r.departure}</td>
                  <td style={tdStyle}>{r.departureTime}</td>
                  <td style={tdStyle}>{r.arrival}</td>
                  <td style={tdStyle}>{r.arrivalTime}</td>
                  <td style={tdStyle}>{r.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Degraded Ops */}
      {form.degradedOps && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#d62828', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={13} /> Degraded Operations / مواقف تشغيلية استثنائية
          </div>
          {['signalsBypassing', 'movingInReverse'].map(key => (
            form.degradedOps[key]?.some(r => Object.values(r).some(v => v)) ? (
              <div key={key} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  {key === 'signalsBypassing' ? 'Authorized Signals Bypassing' : 'Authorized Moving in Reverse'}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Origin', 'Trip', 'Signal', 'Destination', 'Form Number'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {form.degradedOps[key].map((r, i) => (
                      <tr key={i}><td style={tdStyle}>{r.origin}</td><td style={tdStyle}>{r.trip}</td><td style={tdStyle}>{r.signal}</td><td style={tdStyle}>{r.destination}</td><td style={tdStyle}>{r.formNumber}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {form.driSopsApplied && <div><span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>DRI SOPs Applied:</span> {form.driSopsApplied}</div>}
            {form.ecoActuated && <div><span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>ECO Actuated:</span> {form.ecoActuated}</div>}
            {form.remarks && <div style={{ gridColumn: '1/-1' }}><span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Remarks:</span> {form.remarks}</div>}
          </div>
        </div>
      )}

      {/* Troubleshooting */}
      {(form.troubleshootingUnits || form.troSopsApplied || form.isolatedSwitches || form.actionOnCBs) && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#3a86ff', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wrench size={13} /> Troubleshooting / التعامل مع الأعطال
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
            {form.troubleshootingUnits && <div><span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Units:</span> {form.troubleshootingUnits}</div>}
            {form.troSopsApplied && <div><span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>TRO SOPs Applied:</span> {form.troSopsApplied}</div>}
            {form.isolatedSwitches && (
              <div style={{ gridColumn: '1/-1' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Isolated Switches: </span>
                {SWITCH_KEYS.filter(k => form.isolatedSwitches[k]).map(k => (
                  <span key={k} style={{ marginLeft: 4, padding: '1px 6px', background: '#3a86ff20', color: '#3a86ff', borderRadius: 4, fontSize: '0.68rem', fontWeight: 700 }}>{k.toUpperCase()}</span>
                ))}
              </div>
            )}
            {form.actionOnCBs && <div><span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Action on CBs:</span> {form.actionOnCBs}</div>}
            {form.isolatedDoors && <div><span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Isolated Doors:</span> {form.isolatedDoors}</div>}
            {form.sivsOutOfService && <div><span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>SIVs OOS:</span> {form.sivsOutOfService}</div>}
          </div>
        </div>
      )}

      {/* Isolated Brakes Matrix */}
      {form.isolatedBrakes && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#2d6a4f', marginBottom: 10 }}>Isolated Brakes / الفرامل المعزولة</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Table 1: SR Toggles */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>SR Toggles</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: '0.65rem', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, background: '#2d6a4f' }}></th>
                      {SR_COL_LABELS.map((col, idx) => <th key={idx} style={{ ...thStyle, background: '#2d6a4f' }}>{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {['sr1', 'sr2'].map(row => (
                      <tr key={row}>
                        <td style={{ ...tdStyle, fontWeight: 700, textAlign: 'center', background: '#e8f8f5', color: '#2d6a4f', width: 40 }}>{row.toUpperCase()}</td>
                        {SR_COLS.map(col => {
                          const checked = form.isolatedBrakes?.srMatrix?.[col]?.[row] || false;
                          return (
                            <td key={col} style={{ ...tdStyle, textAlign: 'center', background: checked ? '#fef2f2' : 'transparent' }}>
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <div style={{ width: 14, height: 14, border: `2px solid ${checked ? '#ef4444' : 'var(--border)'}`, borderRadius: 3, background: checked ? '#ef4444' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {checked && <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>✓</span>}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Brake Module Toggles */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>Brake Module Toggles</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: '0.65rem', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, background: '#2d6a4f' }}></th>
                      {BRAKE_COL_LABELS.map((col, idx) => <th key={idx} style={{ ...thStyle, background: '#2d6a4f' }}>{col}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {['bick', 'bcos'].map(row => (
                      <tr key={row}>
                        <td style={{ ...tdStyle, fontWeight: 700, textAlign: 'center', background: '#e8f8f5', color: '#2d6a4f', width: 40 }}>{row === 'bick' ? 'Bick' : 'BCOS'}</td>
                        {BRAKE_COLS.map(col => {
                          const checked = form.isolatedBrakes?.brakeMatrix?.[col]?.[row] || false;
                          return (
                            <td key={col} style={{ ...tdStyle, textAlign: 'center', background: checked ? '#f0fdf4' : 'transparent' }}>
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <div style={{ width: 14, height: 14, border: `2px solid ${checked ? '#2d6a4f' : 'var(--border)'}`, borderRadius: 3, background: checked ? '#2d6a4f' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {checked && <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>✓</span>}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Damage & CCP */}
      {(form.damageMainline || form.rollingstockDamage || form.infraDamageSignaling) && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#f48c06', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={13} /> Damage Observation / ملاحظة الأضرار
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
            {form.damageMainline && <div><span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Mainline:</span> {form.damageMainline}</div>}
            {form.damageDepot && <div><span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Depot:</span> {form.damageDepot}</div>}
            {form.damageTime && <div><span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Time:</span> {form.damageTime}</div>}
            {form.rollingstockDamage && <div style={{ gridColumn: '1/-1' }}><span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Rollingstock:</span> {form.rollingstockDamage}</div>}
            {form.infraDamageSignaling && <div><span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Signaling:</span> {form.infraDamageSignaling}</div>}
            {form.infraDamageTrack && <div><span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Track:</span> {form.infraDamageTrack}</div>}
            {form.infraDamageOthers && <div><span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Others:</span> {form.infraDamageOthers}</div>}
          </div>
        </div>
      )}

      {/* Train Movement */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#023e8a', marginBottom: 6 }}>Train Movement Status / حالة حركة القطار</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
          {form.activeBrakingBogiesFrom && <div><span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Braking Bogies From:</span> {form.activeBrakingBogiesFrom}</div>}
          {form.activeBrakingBogiesTo && <div><span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Braking Bogies To:</span> {form.activeBrakingBogiesTo}</div>}
          {form.speedRestrictions && <div><span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Speed Restrictions:</span> {form.speedRestrictions}</div>}
          {form.pressureGaugeReading && <div><span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Pressure Gauge:</span> {form.pressureGaugeReading}</div>}
          {form.trainService && <div style={{ gridColumn: '1/-1' }}><span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Service:</span> <ServiceBadge service={form.trainService} /></div>}
        </div>
      </div>

      {/* Driver Signature */}
      {form.user?.signatureData && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Driver Digital Signature</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={form.user.signatureData} alt="Driver Signature" style={{ maxHeight: 40, maxWidth: 160, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', background: '#fff' }} />
            <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 700 }}>✓ Digitally Verified</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DriverFormsAdminPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [expanded, setExpanded] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await driverFormService.list();
      setForms(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await driverFormService.delete(id);
      setForms(f => f.filter(x => x.id !== id));
      setDeleteConfirm(null);
    } catch { alert('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const handlePrint = (form) => {
    const win = window.open('', '_blank', 'width=900,height=1100');
    if (!win) { alert('Please allow popups'); return; }
    const cycleHtml = (form.cycleDetails || []).map(r =>
      `<tr><td>${r.trip||''}</td><td>${r.units||''}</td><td>${r.departure||''}</td><td>${r.departureTime||''}</td><td>${r.arrival||''}</td><td>${r.arrivalTime||''}</td><td>${r.remarks||''}</td></tr>`
    ).join('') || '<tr><td colspan="7">—</td></tr>';
    win.document.write(`<!DOCTYPE html><html><head><title>Driver Service Form — ${form.driverName}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:11px;color:#000;padding:20px;}
      h1{font-size:15px;font-weight:bold;color:#00A591;border-bottom:2px solid #00A591;padding-bottom:5px;}
      h2{font-size:11px;font-weight:bold;background:#00A591;color:#fff;padding:5px 10px;margin:10px 0 5px;}
      table{width:100%;border-collapse:collapse;margin-bottom:8px;}
      td,th{border:1px solid #ccc;padding:4px 7px;font-size:9px;}
      th{background:#e8f8f5;font-weight:bold;}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
      .field{display:flex;flex-direction:column;margin-bottom:4px;}
      .label{font-weight:bold;font-size:8px;color:#00A591;}
      .val{border:1px solid #ccc;padding:3px 5px;min-height:16px;font-size:9px;}
      @media print{body{padding:8px}}
    </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-size:9px;color:#888">RATP Development Mobility Cairo – Operation and Maintenance</div>
        <h1 style="margin:3px 0">Driver Service Form — نموذج حلقة قائد القطار</h1>
        <div style="font-size:8px">Ref: L3-330PE000TRS0024-B &nbsp;|&nbsp; Date: ${form.shiftDate}</div>
      </div>
    </div>
    <h2>Driver Details</h2>
    <div class="grid">
      <div class="field"><span class="label">Name</span><div class="val">${form.driverName}</div></div>
      <div class="field"><span class="label">ID</span><div class="val">${form.driverId}</div></div>
      <div class="field"><span class="label">Shift Start</span><div class="val">${form.shiftStartTime||'—'}</div></div>
      <div class="field"><span class="label">Shift End</span><div class="val">${form.shiftEndTime||'—'}</div></div>
      <div class="field"><span class="label">Shift Code</span><div class="val">${form.shiftCode||'—'}</div></div>
      <div class="field"><span class="label">Train Type</span><div class="val">${form.trainType||'—'}</div></div>
      <div class="field"><span class="label">Overtime Hours</span><div class="val">${form.overtimeHours||'—'}</div></div>
    </div>
    <h2>Cycle Details</h2>
    <table><thead><tr><th>Trip</th><th>Units</th><th>Departure</th><th>Dep.Time</th><th>Arrival</th><th>Arr.Time</th><th>Remarks</th></tr></thead><tbody>${cycleHtml}</tbody></table>
    <h2>Signatures</h2>
    <div class="grid">
      <div>
        <div class="label">Driver Signature</div>
        ${form.user?.signatureData ? `<img src="${form.user.signatureData}" style="max-height:45px;border:1px solid #ccc;padding:2px"/>` : '<div style="border:1px solid #ccc;min-height:40px"></div>'}
      </div>
      <div><div class="label">Supervisor Signature</div><div style="border:1px solid #ccc;min-height:40px"></div></div>
    </div>
    <div style="margin-top:16px;font-size:8px;color:#888;border-top:1px solid #ccc;padding-top:6px">
      Submitted: ${new Date(form.submittedAt).toLocaleString('en-GB')} &nbsp;|&nbsp; Form ID: ${form.id} &nbsp;|&nbsp; Confidentiality: Private
    </div>
    <script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
    </body></html>`);
    win.document.close();
  };

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filtered = forms.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.driverName?.toLowerCase().includes(q) || f.driverId?.toLowerCase().includes(q) || f.shiftCode?.toLowerCase().includes(q);
    const matchService = !filterService || f.trainService === filterService;
    const matchDate = !filterDate || f.shiftDate === filterDate;
    return matchSearch && matchService && matchDate;
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = forms.filter(f => f.shiftDate === today).length;
  const withPassengers = forms.filter(f => f.trainService === 'with_passengers').length;
  const withIncidents = forms.filter(f => f.damageMainline || f.rollingstockDamage || f.infraDamageSignaling || (f.isolatedSwitches && SWITCH_KEYS.some(k => f.isolatedSwitches[k]))).length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Driver Service Forms</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 4 }}>
            Review and manage all submitted driver service forms — نماذج حلقة قائد القطار
          </p>
        </div>
        <button onClick={load} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={FileText} label="Total Forms" value={forms.length} color="#00A591" />
        <StatCard icon={CalendarDays} label="Today's Forms" value={todayCount} color="#3a86ff" sub={today} />
        <StatCard icon={AlertTriangle} label="Forms with Incidents" value={withIncidents} color="#ef4444" />
        <StatCard icon={Users} label="With Passengers" value={withPassengers} color="#22c55e" />
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-control" style={{ paddingLeft: 30, height: 36 }} placeholder="Search by driver name, ID, shift code..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" style={{ height: 36, fontSize: '0.82rem', flex: '0 0 180px' }} value={filterService} onChange={e => setFilterService(e.target.value)}>
          <option value="">All Service Types</option>
          <option value="with_passengers">With Passengers</option>
          <option value="empty">Empty</option>
          <option value="rescue">Rescue Operation</option>
        </select>
        <input className="form-control" type="date" style={{ height: 36, fontSize: '0.82rem', flex: '0 0 160px' }} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        {(search || filterService || filterDate) && (
          <button onClick={() => { setSearch(''); setFilterService(''); setFilterDate(''); }} className="btn btn-secondary" style={{ height: 36, fontSize: '0.78rem' }}>
            Clear Filters
          </button>
        )}
        <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Showing {filtered.length} of {forms.length}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: 12 }} />
            <div>Loading driver service forms...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileText size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No forms found</div>
            <div style={{ fontSize: '0.82rem' }}>No driver service forms match your current filters.</div>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px 110px 130px 80px 80px', gap: 0, padding: '10px 16px', background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              <div>DRIVER</div>
              <div>SHIFT</div>
              <div>DATE</div>
              <div>SERVICE</div>
              <div>SUBMITTED</div>
              <div>DETAILS</div>
              <div>ACTIONS</div>
            </div>

            {filtered.map(form => (
              <div key={form.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <div
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px 110px 130px 80px 80px', gap: 0, padding: '12px 16px', alignItems: 'center' }}
                >
                  {/* Driver */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{form.driverName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{form.driverId}</div>
                  </div>
                  {/* Shift */}
                  <div>
                    <div style={{ fontSize: '0.82rem' }}>
                      {form.shiftCode || '—'}
                      {form.trainType && <span style={{ marginLeft: 6, padding: '1px 5px', background: 'rgba(0,165,145,0.1)', color: 'var(--brand-primary)', borderRadius: 4, fontSize: '0.62rem', fontWeight: 700 }}>{form.trainType}</span>}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {form.shiftStartTime || '—'} → {form.shiftEndTime || '—'}
                      {form.overtimeHours && <span style={{ marginLeft: 6, color: '#f48c06', fontWeight: 700 }}>+{form.overtimeHours}h OT</span>}
                    </div>
                  </div>
                  {/* Date */}
                  <div style={{ fontSize: '0.8rem' }}>{form.shiftDate}</div>
                  {/* Service */}
                  <div><ServiceBadge service={form.trainService} /></div>
                  {/* Submitted */}
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(form.submittedAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                    <div style={{ fontSize: '0.68rem' }}>by {form.user?.fullName}</div>
                  </div>
                  {/* Expand */}
                  <div>
                    <button
                      onClick={() => toggleExpand(form.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--brand-primary)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
                    >
                      {expanded[form.id] ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> View</>}
                    </button>
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handlePrint(form)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }} title="Download PDF">
                      <Download size={13} />
                    </button>
                    <button onClick={() => setDeleteConfirm(form)} style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 6, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }} title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expanded[form.id] && <ExpandedForm form={form} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ padding: 24, maxWidth: 420, width: '90%', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#ef4444' }}>
              <Trash2 size={22} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>Delete Form?</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
              This will permanently delete the driver service form for <strong>{deleteConfirm.driverName}</strong> on {deleteConfirm.shiftDate}. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.id)} disabled={deleting} className="btn btn-danger" style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none' }}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
