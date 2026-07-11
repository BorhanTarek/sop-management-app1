import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Loader, Plus, Trash2, Sun, Download,
  AlertTriangle, Train, Wrench, Shield, Users, FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { driverFormService } from '../../services/services';
import ratpLogo from '../../assets/RDMC LOGO.jpg';
import mobilityLogo from '../../assets/Logo-Mobility-Cairo.png';

// ── Isolated Switches config ──────────────────────────────────────────────────
const SWITCH_KEYS = ['atcbs', 'dis', 'pibs', 'vsos', 'dmcb', 'eos', 'eebs', 'rbcs', 'hbcs', 'gbccos', 'zvrbs'];
const SWITCH_LABELS = {
  atcbs: 'ATCBS', dis: 'DIS', pibs: 'PIBS', vsos: 'VSOS', dmcb: 'DMCB', eos: 'EOS',
  eebs: 'EEBS', rbcs: 'RBCS', hbcs: 'HBCS', gbccos: 'GBCCOS', zvrbs: 'ZVRBS'
};

// ── Isolated Brakes matrix config ─────────────────────────────────────────────
const SR_COLS = ['dtcL', 'mc1L', 'mc2L', 'mciL', 'mciR', 'mc2R', 'mc1R', 'dtcR'];
const SR_COL_LABELS = ['DTC', 'MC1', 'MC2', 'MCI', 'MCI', 'MC2', 'MC1', 'DTC'];
const BRAKE_COLS = ['mL', 'n1L', 'n2L', 'tL', 'tR', 'n2R', 'n1R', 'mR'];
const BRAKE_COL_LABELS = ['M', 'N1', 'N2', 'T', 'T', 'N2', 'N1', 'M'];

function initSrMatrix() {
  const matrix = {};
  for (const col of SR_COLS) {
    matrix[col] = { sr1: false, sr2: false };
  }
  return matrix;
}

function initBrakeMatrix() {
  const matrix = {};
  for (const col of BRAKE_COLS) {
    matrix[col] = { bick: false, bcos: false };
  }
  return matrix;
}

// ── Section Wrapper ───────────────────────────────────────────────────────────
function Section({ title, titleAr, icon: Icon, color = 'var(--brand-primary)', children, collapsible = false }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          background: color, padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: collapsible ? 'pointer' : 'default'
        }}
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {Icon && <Icon size={16} style={{ color: '#fff' }} />}
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>{title}</div>
            {titleAr && <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', direction: 'rtl' }}>{titleAr}</div>}
          </div>
        </div>
        {collapsible && (open ? <ChevronUp size={14} style={{ color: '#fff' }} /> : <ChevronDown size={14} style={{ color: '#fff' }} />)}
      </div>
      {open && <div style={{ padding: '16px 20px' }}>{children}</div>}
    </div>
  );
}

// ── Field helpers ─────────────────────────────────────────────────────────────
function FieldRow({ children, cols = 2 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, marginBottom: 12 }}>
      {children}
    </div>
  );
}
function Field({ label, labelAr, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
        {label}{labelAr && <span style={{ direction: 'rtl', marginRight: 6, color: 'var(--text-muted)' }}>{labelAr}</span>}
      </label>
      {children}
    </div>
  );
}
const inp = {
  className: 'form-control',
  style: { height: 36, fontSize: '0.82rem' }
};
const ta = {
  className: 'form-control',
  style: { fontSize: '0.82rem', resize: 'vertical', minHeight: 60 }
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function DriverServiceFormPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // ── State ──────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [activeSection, setActiveSection] = useState(null);

  // Driver Details
  const [driverName, setDriverName] = useState(user?.fullName || '');
  const [driverId, setDriverId] = useState(user?.email || '');
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().slice(0, 10));
  const [shiftStartTime, setShiftStartTime] = useState('');
  const [shiftEndTime, setShiftEndTime] = useState('');
  const [shiftCode, setShiftCode] = useState('');
  const [trainType, setTrainType] = useState('');
  const [overtimeHours, setOvertimeHours] = useState('');
  const [safetyNotice, setSafetyNotice] = useState('');

  // Cycle Details rows
  const [cycleRows, setCycleRows] = useState([
    { trip: '', units: '', departure: '', departureTime: '', arrival: '', arrivalTime: '', remarks: '' }
  ]);

  // Cabin Personnel (fixed 4 rows)
  const [cabinRows, setCabinRows] = useState([
    { nameId: '', driving: '', trip: '', departure: '', arrival: '' },
    { nameId: '', driving: '', trip: '', departure: '', arrival: '' },
    { nameId: '', driving: '', trip: '', departure: '', arrival: '' },
    { nameId: '', driving: '', trip: '', departure: '', arrival: '' },
  ]);

  // Degraded Ops
  const [signalRows, setSignalRows] = useState([{ origin: '', trip: '', signal: '', destination: '', formNumber: '' }]);
  const [reverseRows, setReverseRows] = useState([{ origin: '', trip: '', signal: '', destination: '', formNumber: '' }]);

  // DRI SOPs
  const [driSopsApplied, setDriSopsApplied] = useState('');
  const [ecoActuated, setEcoActuated] = useState('');
  const [remarks, setRemarks] = useState('');

  // Damage
  const [damageMainline, setDamageMainline] = useState('');
  const [damageDepot, setDamageDepot] = useState('');
  const [damageTime, setDamageTime] = useState('');
  const [rollingstockDamage, setRollingstockDamage] = useState('');
  const [infraDamageSignaling, setInfraDamageSignaling] = useState('');
  const [infraDamageTrack, setInfraDamageTrack] = useState('');
  const [infraDamageOthers, setInfraDamageOthers] = useState('');

  // CCP
  const [ccpInstruction, setCcpInstruction] = useState('');
  const [ccpEcoActuated, setCcpEcoActuated] = useState('');
  const [ccpConfirmation, setCcpConfirmation] = useState(false);
  const [passengersInformed, setPassengersInformed] = useState(false);

  // Troubleshooting
  const [troubleshootingUnits, setTroubleshootingUnits] = useState('');
  const [troSopsApplied, setTroSopsApplied] = useState('');
  const [isolatedSwitches, setIsolatedSwitches] = useState(() => Object.fromEntries(SWITCH_KEYS.map(k => [k, false])));
  const [actionOnCBs, setActionOnCBs] = useState('');
  const [isolatedDoors, setIsolatedDoors] = useState('');
  const [compressorsOutOfService, setCompressorsOutOfService] = useState('');
  const [vvvfsOutOfService, setVvvfsOutOfService] = useState('');
  const [sivsOutOfService, setSivsOutOfService] = useState('');

  // Isolated Brakes
  const [srMatrix, setSrMatrix] = useState(initSrMatrix);
  const [brakeMatrix, setBrakeMatrix] = useState(initBrakeMatrix);

  // Train Movement
  const [activeBrakingBogiesFrom, setActiveBrakingBogiesFrom] = useState('');
  const [activeBrakingBogiesTo, setActiveBrakingBogiesTo] = useState('');
  const [speedRestrictions, setSpeedRestrictions] = useState('');
  const [pressureGaugeReading, setPressureGaugeReading] = useState('');
  const [trainService, setTrainService] = useState('');

  // ── Cycle row helpers ───────────────────────────────────────────────────────
  const updateCycleRow = (i, field, val) => setCycleRows(rows => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const addCycleRow = () => setCycleRows(r => [...r, { trip: '', units: '', departure: '', departureTime: '', arrival: '', arrivalTime: '', remarks: '' }]);
  const removeCycleRow = i => setCycleRows(r => r.filter((_, idx) => idx !== i));

  const updateCabinRow = (i, field, val) => setCabinRows(rows => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  const updateSignalRow = (i, field, val) => setSignalRows(rows => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const addSignalRow = () => setSignalRows(r => [...r, { origin: '', trip: '', signal: '', destination: '', formNumber: '' }]);

  const updateReverseRow = (i, field, val) => setReverseRows(rows => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const addReverseRow = () => setReverseRows(r => [...r, { origin: '', trip: '', signal: '', destination: '', formNumber: '' }]);

  const toggleSwitch = key => setIsolatedSwitches(s => ({ ...s, [key]: !s[key] }));
  const toggleSrBrake = (col, row) => setSrMatrix(m => ({
    ...m, [col]: { ...m[col], [row]: !m[col][row] }
  }));
  const toggleBrake = (col, row) => setBrakeMatrix(m => ({
    ...m, [col]: { ...m[col], [row]: !m[col][row] }
  }));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!driverName.trim()) { alert('Driver name is required'); return; }
    setSubmitting(true);
    try {
      const payload = {
        shiftDate, driverName, driverId,
        shiftStartTime, shiftEndTime, shiftCode, trainType, overtimeHours, safetyNotice,
        cycleDetails: cycleRows,
        cabinPersonnel: cabinRows,
        degradedOps: { signalsBypassing: signalRows, movingInReverse: reverseRows },
        driSopsApplied, ecoActuated, remarks,
        damageMainline, damageDepot, damageTime,
        rollingstockDamage, infraDamageSignaling, infraDamageTrack, infraDamageOthers,
        ccpInstruction, ccpEcoActuated,
        ccpConfirmation: ccpConfirmation ? 'confirmed' : '',
        passengersInformed: passengersInformed ? 'informed' : '',
        troubleshootingUnits, troSopsApplied,
        isolatedSwitches,
        actionOnCBs, isolatedDoors, compressorsOutOfService, vvvfsOutOfService, sivsOutOfService,
        isolatedBrakes: { srMatrix, brakeMatrix },
        activeBrakingBogiesFrom, activeBrakingBogiesTo,
        speedRestrictions, pressureGaugeReading, trainService
      };
      const res = await driverFormService.submit(payload);
      setSubmittedData(res.data);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── PDF Print ──────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const d = submittedData || {};
    const win = window.open('', '_blank', 'width=900,height=1100');
    if (!win) { alert('Please allow popups'); return; }
    const cycleHtml = (d.cycleDetails || cycleRows).map(r =>
      `<tr><td>${r.trip||''}</td><td>${r.units||''}</td><td>${r.departure||''}</td><td>${r.departureTime||''}</td><td>${r.arrival||''}</td><td>${r.arrivalTime||''}</td><td>${r.remarks||''}</td></tr>`
    ).join('');
    win.document.write(`<!DOCTYPE html><html><head><title>Driver Service Form</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:11px;color:#000;padding:20px;}
      h1{font-size:16px;font-weight:bold;color:#00A591;border-bottom:2px solid #00A591;padding-bottom:6px;}
      h2{font-size:12px;font-weight:bold;background:#00A591;color:#fff;padding:6px 10px;margin:12px 0 6px;}
      table{width:100%;border-collapse:collapse;margin-bottom:10px;}
      td,th{border:1px solid #ccc;padding:5px 8px;font-size:10px;}
      th{background:#e8f8f5;font-weight:bold;}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
      .field{display:flex;flex-direction:column;}
      .label{font-weight:bold;font-size:9px;color:#00A591;}
      .val{border:1px solid #ccc;padding:4px 6px;min-height:18px;font-size:10px;}
      .sig{border:1px solid #ccc;min-height:50px;display:flex;align-items:center;justify-content:center;}
      @media print{body{padding:10px}}
    </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div><div style="font-size:10px;color:#888">RATP Development Mobility Cairo – Operation and Maintenance</div>
      <h1 style="margin:4px 0">Driver Service Form — نموذج حلقة قائد القطار</h1>
      <div style="font-size:9px">Ref: L3-330PE000TRS0024-B &nbsp;|&nbsp; Date: ${d.shiftDate||shiftDate}</div></div>
    </div>
    <h2>Driver Details / بيانات قائد القطار</h2>
    <div class="grid">
      <div class="field"><span class="label">Name / الاسم</span><div class="val">${d.driverName||driverName}</div></div>
      <div class="field"><span class="label">ID / الرقم الوظيفي</span><div class="val">${d.driverId||driverId}</div></div>
      <div class="field"><span class="label">Shift Start / وقت بداية الوردية</span><div class="val">${d.shiftStartTime||shiftStartTime}</div></div>
      <div class="field"><span class="label">Shift End / وقت نهاية الوردية</span><div class="val">${d.shiftEndTime||shiftEndTime}</div></div>
      <div class="field"><span class="label">Shift Code / رمز الوردية</span><div class="val">${d.shiftCode||shiftCode}</div></div>
      <div class="field"><span class="label">Train Type / نوع القطار</span><div class="val">${d.trainType||trainType||'—'}</div></div>
      <div class="field"><span class="label">Overtime Hours / ساعات العمل الإضافي</span><div class="val">${d.overtimeHours||overtimeHours}</div></div>
    </div>
    <h2>Safety Notice / إشعارات السلامة</h2>
    <div class="val" style="min-height:40px">${d.safetyNotice||safetyNotice}</div>
    <h2>Cycle Details / بيانات الحلقة</h2>
    <table><thead><tr><th>Trip/الرحلة</th><th>Units/الوحدات</th><th>Departure/القيام</th><th>Dep.Time/وقت القيام</th><th>Arrival/الوصول</th><th>Arr.Time/وقت الوصول</th><th>Remarks/ملاحظات</th></tr></thead><tbody>${cycleHtml}</tbody></table>
    <h2>Train Movement Status / حالة حركة القطار</h2>
    <div class="grid">
      <div class="field"><span class="label">Active Braking Bogies</span><div class="val">${d.activeBrakingBogiesFrom||activeBrakingBogiesFrom} → ${d.activeBrakingBogiesTo||activeBrakingBogiesTo}</div></div>
      <div class="field"><span class="label">Speed Restrictions</span><div class="val">${d.speedRestrictions||speedRestrictions}</div></div>
      <div class="field"><span class="label">Pressure Gauge Reading</span><div class="val">${d.pressureGaugeReading||pressureGaugeReading}</div></div>
      <div class="field"><span class="label">Service Type</span><div class="val">${d.trainService||trainService}</div></div>
    </div>
    <h2>Signatures / التوقيعات</h2>
    <div class="grid">
      <div><div class="label">Driver Signature / توقيع قائد القطار</div>
        ${(d.user?.signatureData||user?.signatureData) ? `<img src="${d.user?.signatureData||user?.signatureData}" style="max-height:50px;max-width:180px;border:1px solid #ccc;padding:4px"/>` : '<div class="sig">No Signature</div>'}
      </div>
      <div><div class="label">Mainline Supervisor Signature / توقيع مشرف الخط</div><div class="sig"></div></div>
    </div>
    <div style="margin-top:20px;font-size:9px;color:#888;border-top:1px solid #ccc;padding-top:8px">
      Submitted: ${new Date(d.submittedAt||Date.now()).toLocaleString('en-GB')} &nbsp;|&nbsp; Form ID: ${d.id||'DRAFT'} &nbsp;|&nbsp; Confidentiality: Private
    </div>
    <script>window.onload=()=>setTimeout(()=>window.print(),300)</script>
    </body></html>`);
    win.document.close();
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted && submittedData) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        <div style={{ background: 'var(--brand-primary)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/browse')} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
              <ArrowLeft size={16} />
            </button>
            <h2 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>Driver Service Form</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={mobilityLogo} alt="Mobility" style={{ height: 28, objectFit: 'contain' }} />
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)' }} />
            <img src={ratpLogo} alt="RATP" style={{ height: 20, objectFit: 'contain', borderRadius: 2 }} />
          </div>
        </div>
        <div style={{ maxWidth: 520, margin: '32px auto', padding: '0 16px' }}>
          <div className="card" style={{ padding: '36px 24px', textAlign: 'center', border: '2px solid var(--brand-primary)', boxShadow: '0 8px 32px rgba(0,165,145,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,165,145,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Form Successfully Submitted!</h2>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                Your Driver Service Form for <strong>{submittedData.shiftDate}</strong> has been recorded.
              </p>
            </div>
            <div style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['Driver', submittedData.driverName], ['Driver ID', submittedData.driverId], ['Shift Date', submittedData.shiftDate], ['Shift Code', submittedData.shiftCode || '—'], ['Train Type', submittedData.trainType || '—'], ['Submitted', new Date(submittedData.submittedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })], ['Form ID', submittedData.id?.slice(0, 8) + '...']].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{v}</div>
                  </div>
                ))}
              </div>
              {submittedData.user?.signatureData && (
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 6 }}>Driver Digital Signature</div>
                  <img src={submittedData.user.signatureData} alt="Signature" style={{ maxHeight: 40, maxWidth: 140, objectFit: 'contain', background: '#fff', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px' }} />
                  <div style={{ fontSize: '0.65rem', color: '#22c55e', fontWeight: 700, marginTop: 4 }}>✓ Digitally Verified</div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button onClick={handlePrint} className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Download size={15} /> Download PDF
              </button>
              <button onClick={() => navigate('/browse')} className="btn btn-primary" style={{ flex: 1 }}>
                Back to Portal
              </button>
            </div>
            <button onClick={() => { setSubmitted(false); setSubmittedData(null); }} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Submit Another Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Table style helpers ────────────────────────────────────────────────────
  const thStyle = { background: '#00A591', color: '#fff', padding: '7px 10px', fontSize: '0.72rem', fontWeight: 700, textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)' };
  const tdStyle = { padding: '5px 6px', fontSize: '0.78rem', border: '1px solid var(--border)' };
  const cellInput = { width: '100%', border: 'none', background: 'transparent', fontSize: '0.78rem', outline: 'none', padding: '2px 4px', color: 'var(--text-primary)' };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Topbar */}
      <div style={{ background: 'var(--brand-primary)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/browse')} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>Driver Service Form</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', direction: 'rtl' }}>نموذج حلقة قائد القطار</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem' }}>L3-330PE000TRS0024-B</div>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)' }} />
          <img src={mobilityLogo} alt="Mobility" style={{ height: 28, objectFit: 'contain' }} />
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.2)' }} />
          <img src={ratpLogo} alt="RATP" style={{ height: 20, objectFit: 'contain', borderRadius: 2 }} />
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 860, margin: '24px auto', padding: '0 16px 40px' }}>

        {/* ── 1. Driver Details ─────────────────────────────────────────────── */}
        <Section title="Driver Details" titleAr="بيانات قائد القطار" icon={Train} color="#00A591">
          <FieldRow cols={3}>
            <Field label="Day & Date" labelAr="التاريخ والوقت">
              <input {...inp} type="date" value={shiftDate} onChange={e => setShiftDate(e.target.value)} />
            </Field>
            <Field label="Shift Start Time" labelAr="وقت بداية الوردية">
              <input {...inp} type="time" value={shiftStartTime} onChange={e => setShiftStartTime(e.target.value)} />
            </Field>
            <Field label="Shift End Time" labelAr="وقت نهاية الوردية">
              <input {...inp} type="time" value={shiftEndTime} onChange={e => setShiftEndTime(e.target.value)} />
            </Field>
          </FieldRow>
          <FieldRow cols={2}>
            <Field label="Name / الاسم">
              <input {...inp} value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Full name" required />
            </Field>
            <Field label="ID Number / الرقم الوظيفي">
              <input {...inp} value={driverId} onChange={e => setDriverId(e.target.value)} placeholder="Employee ID / Email" />
            </Field>
          </FieldRow>
          <FieldRow cols={3}>
            <Field label="Shift Code / رمز الوردية">
              <input {...inp} value={shiftCode} onChange={e => setShiftCode(e.target.value)} placeholder="e.g. A1" />
            </Field>
            <Field label="Train Type / نوع القطار">
              <select {...inp} value={trainType} onChange={e => setTrainType(e.target.value)}>
                <option value="">Select Train Type</option>
                <option value="Rotem">Rotem</option>
                <option value="Mitsubishi">Mitsubishi</option>
              </select>
            </Field>
            <Field label="Overtime Hours / ساعات العمل الإضافي">
              <input {...inp} value={overtimeHours} onChange={e => setOvertimeHours(e.target.value)} placeholder="e.g. 2" />
            </Field>
          </FieldRow>
        </Section>

        {/* ── 2. Safety Notice ─────────────────────────────────────────────── */}
        <Section title="Safety Notice" titleAr="إشعارات السلامة" icon={Shield} color="#e85d04">
          <textarea {...ta} rows={4} value={safetyNotice} onChange={e => setSafetyNotice(e.target.value)}
            placeholder="Enter any relevant safety notices for this shift..." style={{ ...ta.style, border: '2px dashed #e85d04', borderRadius: 8 }} />
        </Section>

        {/* ── 3. Cycle Details ─────────────────────────────────────────────── */}
        <Section title="Cycle Details" titleAr="بيانات الحلقة" icon={Train} color="#0077b6">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
              <thead>
                <tr>
                  {['Trip/الرحلة', 'Units/الوحدات', 'Departure/القيام', 'Dep. Time/وقت القيام', 'Arrival/الوصول', 'Arr. Time/وقت الوصول', 'Remarks/ملاحظات', ''].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cycleRows.map((row, i) => (
                  <tr key={i}>
                    {['trip', 'units', 'departure', 'departureTime', 'arrival', 'arrivalTime', 'remarks'].map(field => (
                      <td key={field} style={tdStyle}>
                        <input style={cellInput} value={row[field]} onChange={e => updateCycleRow(i, field, e.target.value)} />
                      </td>
                    ))}
                    <td style={{ ...tdStyle, textAlign: 'center', width: 32 }}>
                      {cycleRows.length > 1 && (
                        <button type="button" onClick={() => removeCycleRow(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0 }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addCycleRow} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--brand-primary)', background: 'none', border: '1px dashed var(--brand-primary)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>
            <Plus size={13} /> Add Row
          </button>
        </Section>

        {/* ── 4. Persons Admitted in Cabin ──────────────────────────────────── */}
        <Section title="Persons Admitted Inside the Cabin" titleAr="أشخاص تم التصريح لهم بدخول كابينة القيادة" icon={Users} color="#7b2d8b" collapsible>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Name and ID / الاسم والرقم', 'Driving / قيادة القطار', 'Trip / الرحلة', 'Departure / القيام', 'Arrival / الوصول'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cabinRows.map((row, i) => (
                  <tr key={i}>
                    <td style={tdStyle}><input style={cellInput} value={row.nameId} onChange={e => updateCabinRow(i, 'nameId', e.target.value)} placeholder="Name / ID" /></td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        {['Yes/نعم', 'No/لا'].map(opt => (
                          <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', cursor: 'pointer' }}>
                            <input type="radio" name={`cabin-driving-${i}`} value={opt} checked={row.driving === opt} onChange={e => updateCabinRow(i, 'driving', e.target.value)} />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </td>
                    <td style={tdStyle}><input style={cellInput} value={row.trip} onChange={e => updateCabinRow(i, 'trip', e.target.value)} /></td>
                    <td style={tdStyle}><input style={cellInput} type="time" value={row.departure} onChange={e => updateCabinRow(i, 'departure', e.target.value)} /></td>
                    <td style={tdStyle}><input style={cellInput} type="time" value={row.arrival} onChange={e => updateCabinRow(i, 'arrival', e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── 5. Degraded Operations ────────────────────────────────────────── */}
        <Section title="Degraded Operations Situations" titleAr="مواقف تشغيلية استثنائية" icon={AlertTriangle} color="#d62828" collapsible>
          {[
            { label: 'Authorized Signals Bypassing / تصريح بتجاوز سيمافور', rows: signalRows, update: updateSignalRow, add: addSignalRow },
            { label: 'Authorized Moving in Reverse / تصريح بالتدفيع', rows: reverseRows, update: updateReverseRow, add: addReverseRow },
          ].map(({ label, rows, update, add }) => (
            <div key={label} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>{label}</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Origin/البداية', 'Trip/الرحلة', 'Signal/سيمافور', 'Destination/الوجهة', 'Form Number/رقم أمر الحركة'].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i}>
                        {['origin', 'trip', 'signal', 'destination', 'formNumber'].map(f => (
                          <td key={f} style={tdStyle}><input style={cellInput} value={row[f]} onChange={e => update(i, f, e.target.value)} /></td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={add} style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#d62828', background: 'none', border: '1px dashed #d62828', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                <Plus size={12} /> Add Row
              </button>
            </div>
          ))}

          <FieldRow cols={2}>
            <Field label="DRI SOPs Applied / إجراءات التشغيل القياسية التي تم تطبيقها">
              <textarea {...ta} rows={2} value={driSopsApplied} onChange={e => setDriSopsApplied(e.target.value)} />
            </Field>
            <Field label="ECO Actuated / إيكو تم تفعيله">
              <textarea {...ta} rows={2} value={ecoActuated} onChange={e => setEcoActuated(e.target.value)} />
            </Field>
          </FieldRow>
          <Field label="Remarks / ملاحظات">
            <textarea {...ta} rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} />
          </Field>
        </Section>

        {/* ── 6. Observation of Damage ──────────────────────────────────────── */}
        <Section title="Observation of Damage" titleAr="ملاحظة الأضرار" icon={AlertTriangle} color="#f48c06" collapsible>
          <FieldRow cols={3}>
            <Field label="Mainline / الخط الرئيسي">
              <input {...inp} value={damageMainline} onChange={e => setDamageMainline(e.target.value)} />
            </Field>
            <Field label="Depot / الورشة">
              <input {...inp} value={damageDepot} onChange={e => setDamageDepot(e.target.value)} />
            </Field>
            <Field label="Time / الوقت">
              <input {...inp} type="time" value={damageTime} onChange={e => setDamageTime(e.target.value)} />
            </Field>
          </FieldRow>
          <Field label="Rollingstock Damage Description / وصف ضرر الوحدات المتحركة">
            <textarea {...ta} rows={3} value={rollingstockDamage} onChange={e => setRollingstockDamage(e.target.value)} />
          </Field>
          <div style={{ marginTop: 10, marginBottom: 6, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Infrastructure Damage Description / وصف ضرر البنية التحتية</div>
          <FieldRow cols={3}>
            <Field label="Signaling / إشارات">
              <textarea {...ta} rows={2} value={infraDamageSignaling} onChange={e => setInfraDamageSignaling(e.target.value)} />
            </Field>
            <Field label="Track / السكة">
              <textarea {...ta} rows={2} value={infraDamageTrack} onChange={e => setInfraDamageTrack(e.target.value)} />
            </Field>
            <Field label="Others / أخرى">
              <textarea {...ta} rows={2} value={infraDamageOthers} onChange={e => setInfraDamageOthers(e.target.value)} />
            </Field>
          </FieldRow>
          <FieldRow cols={2}>
            <Field label="CCP Instruction / تعليمات غرفة التحكم المركزي">
              <textarea {...ta} rows={2} value={ccpInstruction} onChange={e => setCcpInstruction(e.target.value)} />
            </Field>
            <Field label="ECO Actuated / إيكو تم تفعيله">
              <textarea {...ta} rows={2} value={ccpEcoActuated} onChange={e => setCcpEcoActuated(e.target.value)} />
            </Field>
          </FieldRow>
          <div style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginTop: 8, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <strong>Movement Condition:</strong> Before train movement the driver must report to and confirm with the CCP, the driving mode selected, the actions taken, the active braking and traction bogies, doors status, compressors status and the pressure gauge reading, and the passengers service status.
          </div>
          <FieldRow cols={2} style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8 }}>
              <input type="checkbox" id="ccpConf" checked={ccpConfirmation} onChange={e => setCcpConfirmation(e.target.checked)} style={{ width: 18, height: 18 }} />
              <label htmlFor="ccpConf" style={{ fontSize: '0.82rem', cursor: 'pointer' }}>CCP Confirmation / تأكيد غرفة التحكم المركزي</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8 }}>
              <input type="checkbox" id="passInformed" checked={passengersInformed} onChange={e => setPassengersInformed(e.target.checked)} style={{ width: 18, height: 18 }} />
              <label htmlFor="passInformed" style={{ fontSize: '0.82rem', cursor: 'pointer' }}>Passengers Informed / الإذاعة على الركاب</label>
            </div>
          </FieldRow>
        </Section>

        {/* ── 7. Troubleshooting ───────────────────────────────────────────── */}
        <Section title="Troubleshooting" titleAr="التعامل مع الأعطال" icon={Wrench} color="#3a86ff" collapsible>
          <FieldRow cols={2}>
            <Field label="Units / الوحدات">
              <input {...inp} value={troubleshootingUnits} onChange={e => setTroubleshootingUnits(e.target.value)} />
            </Field>
            <Field label="TRO SOPs Applied / إجراءات التعامل مع الأعطال التي تم تطبيقها">
              <input {...inp} value={troSopsApplied} onChange={e => setTroSopsApplied(e.target.value)} />
            </Field>
          </FieldRow>

          {/* Isolated Switches */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Isolated Switches in S-OPS / مفاتيح تم عزلها باللوحة المبرمشة</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SWITCH_KEYS.map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSwitch(key)}
                  style={{
                    padding: '6px 14px', borderRadius: 6, fontSize: '0.8rem', fontWeight: 700,
                    border: `2px solid ${isolatedSwitches[key] ? '#3a86ff' : 'var(--border)'}`,
                    background: isolatedSwitches[key] ? '#3a86ff' : 'transparent',
                    color: isolatedSwitches[key] ? '#fff' : 'var(--text-secondary)',
                    cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                >{SWITCH_LABELS[key]}</button>
              ))}
            </div>
          </div>

          <FieldRow cols={2}>
            <Field label="Action on CBs / فواطع تم فحصها/ردها">
              <textarea {...ta} rows={2} value={actionOnCBs} onChange={e => setActionOnCBs(e.target.value)} />
            </Field>
            <Field label="Isolated Doors / أبواب تم عزلها">
              <textarea {...ta} rows={2} value={isolatedDoors} onChange={e => setIsolatedDoors(e.target.value)} />
            </Field>
          </FieldRow>
          <FieldRow cols={3}>
            <Field label="Compressors out of Service / كباسات الهواء خارج الخدمة">
              <input {...inp} value={compressorsOutOfService} onChange={e => setCompressorsOutOfService(e.target.value)} />
            </Field>
            <Field label="VVVFs out of Service / محولات الجر خارج الخدمة">
              <input {...inp} value={vvvfsOutOfService} onChange={e => setVvvfsOutOfService(e.target.value)} />
            </Field>
            <Field label="SIVs out of Service / المحولات المساعدة خارج الخدمة">
              <input {...inp} value={sivsOutOfService} onChange={e => setSivsOutOfService(e.target.value)} />
            </Field>
          </FieldRow>
        </Section>

        {/* ── 8. Isolated Brakes ───────────────────────────────────────────── */}
        <Section title="Isolated Brakes" titleAr="الفرامل المعزولة" icon={Shield} color="#2d6a4f" collapsible>
          {/* Table 1: SR Toggles */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>SR Toggles / مفاتيح عزل الـ SR</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: '0.72rem', minWidth: 640, width: '100%' }}>
                <thead>
                  <tr>
                    {SR_COL_LABELS.map((h, i) => (
                      <th key={i} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['sr1', 'sr2'].map(row => (
                    <tr key={row}>
                      {SR_COLS.map((col, ci) => {
                        const isIsolated = srMatrix[col][row];
                        return (
                          <td key={col} style={{ ...tdStyle, textAlign: 'center', padding: '4px' }}>
                            <button
                              type="button"
                              onClick={() => toggleSrBrake(col, row)}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                minHeight: 38,
                                padding: '4px 2px',
                                borderRadius: 6,
                                border: `2px solid ${isIsolated ? '#ef4444' : 'var(--border)'}`,
                                background: isIsolated ? '#ef4444' : 'transparent',
                                color: isIsolated ? '#ffffff' : 'var(--text-secondary)',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                outline: 'none',
                                boxShadow: isIsolated ? '0 2px 6px rgba(239,68,68,0.25)' : 'none'
                              }}
                            >
                              <span style={{ fontSize: '0.8rem' }}>{row.toUpperCase()}</span>
                              <span style={{ fontSize: '0.55rem', opacity: isIsolated ? 0.9 : 0.7, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.2 }}>
                                {isIsolated ? 'Isolated' : 'Normal'}
                              </span>
                            </button>
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
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Brake Module Toggles / مفاتيح عزل الفرامل</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: '0.72rem', minWidth: 640, width: '100%' }}>
                <thead>
                  <tr>
                    {BRAKE_COL_LABELS.map((h, i) => (
                      <th key={i} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['bick', 'bcos'].map(row => (
                    <tr key={row}>
                      {BRAKE_COLS.map((col, ci) => {
                        const isIsolated = brakeMatrix[col][row];
                        return (
                          <td key={col} style={{ ...tdStyle, textAlign: 'center', padding: '4px' }}>
                            <button
                              type="button"
                              onClick={() => toggleBrake(col, row)}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                minHeight: 38,
                                padding: '4px 2px',
                                borderRadius: 6,
                                border: `2px solid ${isIsolated ? '#2d6a4f' : 'var(--border)'}`,
                                background: isIsolated ? '#2d6a4f' : 'transparent',
                                color: isIsolated ? '#ffffff' : 'var(--text-secondary)',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                outline: 'none',
                                boxShadow: isIsolated ? '0 2px 6px rgba(45,106,79,0.25)' : 'none'
                              }}
                            >
                              <span style={{ fontSize: '0.8rem' }}>{row === 'bick' ? 'Bick' : 'BCOS'}</span>
                              <span style={{ fontSize: '0.55rem', opacity: isIsolated ? 0.9 : 0.7, marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.2 }}>
                                {isIsolated ? 'Isolated' : 'Normal'}
                              </span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* ── 9. Train Movement Status ─────────────────────────────────────── */}
        <Section title="Train Movement Status" titleAr="حالة حركة القطار" icon={Train} color="#023e8a">
          <FieldRow cols={2}>
            <Field label="Active Braking Bogies / عدد البوابي القادرة على الفرامل — From/من">
              <input {...inp} value={activeBrakingBogiesFrom} onChange={e => setActiveBrakingBogiesFrom(e.target.value)} placeholder="From" />
            </Field>
            <Field label="To">
              <input {...inp} value={activeBrakingBogiesTo} onChange={e => setActiveBrakingBogiesTo(e.target.value)} placeholder="To" />
            </Field>
          </FieldRow>
          <FieldRow cols={2}>
            <Field label="Speed Restrictions / حدود السرعة">
              <input {...inp} value={speedRestrictions} onChange={e => setSpeedRestrictions(e.target.value)} placeholder="km/h" />
            </Field>
            <Field label="Pressure Gauge Reading / قراءة عداد ضغط الهواء">
              <input {...inp} value={pressureGaugeReading} onChange={e => setPressureGaugeReading(e.target.value)} placeholder="bar" />
            </Field>
          </FieldRow>
          <Field label="Service Type / نوع الخدمة">
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              {[['with_passengers', 'With Passengers / بركاب'], ['empty', 'Empty / فارغ'], ['rescue', 'Rescue Operation / قطار إنقاذ']].map(([val, lbl]) => (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', border: `2px solid ${trainService === val ? '#023e8a' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', background: trainService === val ? 'rgba(2,62,138,0.07)' : 'transparent', fontSize: '0.82rem', fontWeight: 600 }}>
                  <input type="radio" name="trainService" value={val} checked={trainService === val} onChange={e => setTrainService(e.target.value)} style={{ width: 16, height: 16 }} />
                  {lbl}
                </label>
              ))}
            </div>
          </Field>
        </Section>

        {/* ── Signature & Submit ───────────────────────────────────────────── */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Driver Signature / توقيع قائد القطار</div>
              {user?.signatureData ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-hover)' }}>
                  <img src={user.signatureData} alt="Signature" style={{ maxHeight: 36, maxWidth: 120, objectFit: 'contain' }} />
                  <span style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 700 }}>✓ Digitally Verified</span>
                </div>
              ) : (
                <div style={{ padding: '10px 14px', border: '1px dashed var(--border)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  No signature set. Please set your digital signature in your profile.
                </div>
              )}
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Mainline Supervisor Signature / توقيع مشرف الخط</div>
              <div style={{ padding: '10px 14px', border: '1px dashed var(--border)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Supervisor will countersign the printed copy.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ padding: '12px 36px', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}
            >
              {submitting ? <Loader size={18} className="spin" /> : <CheckCircle2 size={18} />}
              {submitting ? 'Submitting...' : 'Submit Driver Service Form'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
