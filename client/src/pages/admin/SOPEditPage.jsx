import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Send, Archive, Clock, Loader, RotateCcw, ChevronRight } from 'lucide-react';
import { sopService, categoryService, userService } from '../../services/services';
import StepBuilder from '../../components/sop/StepBuilder';

const DOC_TYPES = ['SOP', 'Safety Notice', 'Work Instruction'];
const PERMITTED_ROLES = ['station_manager', 'station_master', 'transport_manager', 'driver', 'occ'];

/* StepBuilder imported from ../../components/sop/StepBuilder */

/* ── Category / Sub-category Selector ───────────────── */
function CategorySelector({ tree, categoryId, onChange }) {
  const initialRoot = categoryId
    ? (tree.find(r => r.id === categoryId)
        ? categoryId
        : tree.find(r => r.children?.some(c => c.id === categoryId))?.id || '')
    : '';

  const [selectedRoot, setSelectedRoot] = useState(initialRoot);
  const [selectedSub, setSelectedSub]   = useState(
    categoryId && categoryId !== initialRoot ? categoryId : ''
  );

  // Re-sync when categoryId prop changes (e.g. after data loads)
  useEffect(() => {
    if (!categoryId) { setSelectedRoot(''); setSelectedSub(''); return; }
    const rootMatch = tree.find(r => r.id === categoryId);
    if (rootMatch) { setSelectedRoot(categoryId); setSelectedSub(''); }
    else {
      const parent = tree.find(r => r.children?.some(c => c.id === categoryId));
      if (parent) { setSelectedRoot(parent.id); setSelectedSub(categoryId); }
    }
  }, [categoryId, tree.length]);

  const subCategories = tree.find(r => r.id === selectedRoot)?.children || [];

  const handleRootChange = (rootId) => {
    setSelectedRoot(rootId);
    setSelectedSub('');
    const kids = tree.find(r => r.id === rootId)?.children || [];
    onChange(kids.length === 0 ? rootId : '');
  };

  const handleSubChange = (subId) => {
    setSelectedSub(subId);
    onChange(subId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Category</label>
        <select className="form-control" value={selectedRoot} onChange={e => handleRootChange(e.target.value)}>
          <option value="">— Select Category —</option>
          {tree.map(c => (
            <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
          ))}
        </select>
      </div>

      {selectedRoot && subCategories.length > 0 && (
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ChevronRight size={12} style={{ color: 'var(--brand-accent)' }} />
            Sub-Category
          </label>
          <select className="form-control" value={selectedSub}
            onChange={e => handleSubChange(e.target.value)}
            style={{ borderColor: 'rgba(26,158,150,0.4)' }}>
            <option value="">— Select Sub-Category —</option>
            {subCategories.map(c => (
              <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {selectedRoot && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--brand-accent)' }}>{tree.find(r => r.id === selectedRoot)?.name}</span>
          {selectedSub && <><ChevronRight size={11} /><span style={{ color: 'var(--text-primary)' }}>{subCategories.find(c => c.id === selectedSub)?.name}</span></>}
        </div>
      )}
    </div>
  );
}

function VersionHistory({ sopId }) {
  const [versions, setVersions] = useState([]);
  const [changelog, setChangelog] = useState([]);
  const [activeTab, setActiveTab] = useState('versions');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([sopService.versions(sopId), sopService.changelog(sopId)])
      .then(([v, c]) => { setVersions(v.data); setChangelog(c.data); })
      .finally(() => setLoading(false));
  }, [sopId]);

  const fmt = (d) => new Date(d).toLocaleString();

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="tabs">
        <div className={`tab${activeTab === 'versions' ? ' active' : ''}`} onClick={() => setActiveTab('versions')}>Version History</div>
        <div className={`tab${activeTab === 'changelog' ? ' active' : ''}`} onClick={() => setActiveTab('changelog')}>Change Log</div>
      </div>
      {loading ? <div className="loading-spinner" /> : (
        activeTab === 'versions'
          ? <div className="version-timeline">
              {versions.map(v => (
                <div key={v.id} className="version-item">
                  <div className={`version-dot${v.isCurrent ? ' current' : ''}`}>{v.version}</div>
                  <div className="version-meta">
                    <div className="version-tag"><Clock size={10} /> v{v.version} {v.isCurrent && '(current)'}</div>
                    <div className="version-by">by {v.createdBy?.fullName || 'System'} · {fmt(v.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          : <div className="version-timeline">
              {changelog.map(c => (
                <div key={c.id} className="version-item">
                  <div className="version-dot current">{c.versionTo}</div>
                  <div className="version-meta">
                    <div className="version-tag">v{c.versionFrom || '—'} → v{c.versionTo}</div>
                    <div className="version-summary">{c.changeSummary}</div>
                    <div className="version-by">by {c.changedBy?.fullName || 'System'} · {fmt(c.changedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
      )}
    </div>
  );
}

export default function SOPEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sop, setSop] = useState(null);
  const [tree, setTree]   = useState([]);   // category tree with children
  const [users, setUsers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [form, setForm]         = useState({});
  const [steps, setSteps]       = useState([]);
  const [bumpType, setBumpType] = useState('minor');
  const [changeSummary, setChangeSummary] = useState('');

  useEffect(() => {
    Promise.all([
      sopService.get(id),
      categoryService.tree(),
      userService.list({}),
    ]).then(([sopRes, catRes, userRes]) => {
      const s = sopRes.data;
      setSop(s);
      setForm({ title: s.title, referenceCode: s.referenceCode || '', categoryId: s.categoryId || '', ownerId: s.ownerId || '', docType: s.docType, tags: s.tags || '', permittedRoles: s.permittedRoles || [] });
      // Parse branchData JSON back to yesBranch/noBranch arrays for the StepBuilder
      setSteps((s.steps || []).map((st, i) => {
        let yesBranch = [], noBranch = [];
        if (st.branchData) {
          try { const bd = JSON.parse(st.branchData); yesBranch = bd.yesBranch || []; noBranch = bd.noBranch || []; } catch (_) {}
        }
        return {
          ...st,
          id: st.id || i,
          yesBranch,
          noBranch,
          attentionPoints: st.attentionPoints || [],
          safetyPoints: st.safetyPoints || [],
        };
      }));
      setTree(catRes.data);       // store as tree (with children)
      setUsers(userRes.data);
    }).finally(() => setLoading(false));
  }, [id]);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const togglePermittedRole = (role) => {
    setForm(f => ({
      ...f,
      permittedRoles: f.permittedRoles.includes(role)
        ? f.permittedRoles.filter(r => r !== role)
        : [...f.permittedRoles, role],
    }));
  };

  // Serialize branch arrays to JSON before sending to API.
  // KEY RULE: Decision steps never have a top-level refCode — WI codes live
  // on each individual branch sub-step inside yesBranch / noBranch.
  const prepareStepsForAPI = (rawSteps) =>
    rawSteps
      .filter(s => s.title?.trim())
      .map(s => ({
        ...s,
        // Decision steps: WI code is null at the question level — it's inside branchData sub-steps
        refCode: s.stepType === 'decision' ? null : (s.refCode || null),
        branchData: s.stepType === 'decision'
          ? JSON.stringify({ yesBranch: s.yesBranch || [], noBranch: s.noBranch || [] })
          : null,
        attentionPoints: s.attentionPoints || [],
        safetyPoints: s.safetyPoints || [],
      }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await sopService.update(id, { ...form, steps: prepareStepsForAPI(steps), bumpType, changeSummary });
      navigate('/admin/sops');
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving');
    } finally { setSaving(false); }
  };

  const doAction = async (action) => {
    try {
      if (action === 'publish') await sopService.publish(id);
      if (action === 'archive') await sopService.archive(id);
      navigate('/admin/sops');
    } catch (err) { alert(err.response?.data?.error || 'Action failed'); }
  };

  if (loading) return <div className="page"><div className="loading-spinner" /></div>;
  if (!sop) return <div className="page"><div className="empty-state"><h3>SOP not found</h3></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}><ArrowLeft size={15} /></button>
          <div>
            <h1 style={{ fontSize: '1.2rem' }}>{sop.title}</h1>
            <p style={{ marginTop: 4, fontSize: '0.78rem' }}>
              <span className={`badge badge-${sop.status}`}>{sop.status}</span>
              <span style={{ marginLeft: 8 }}>v{sop.currentVersion}</span>
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {sop.status === 'draft'     && <button className="btn btn-secondary" onClick={() => doAction('publish')} style={{ color: 'var(--success)', borderColor: 'var(--success)' }}><Send size={14} /> Publish</button>}
          {sop.status === 'published' && <button className="btn btn-secondary" onClick={() => doAction('archive')} style={{ color: 'var(--warning)' }}><Archive size={14} /> Archive</button>}
          <button form="sop-edit-form" type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <Loader size={14} className="spin" /> : <Save size={14} />} Save Changes
          </button>
        </div>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 20 }}>{error}</div>}

      <form id="sop-edit-form" onSubmit={save}>
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Document Info</h3>
            <div className="form-group"><label className="form-label">Title *</label><input className="form-control" value={form.title} onChange={e => setField('title', e.target.value)} required /></div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Reference Code</label><input className="form-control" value={form.referenceCode} onChange={e => setField('referenceCode', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Type</label><select className="form-control" value={form.docType} onChange={e => setField('docType', e.target.value)}>{DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            </div>
            <div className="form-group">
              <label className="form-label">Target Audience / Permitted Roles</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PERMITTED_ROLES.map(r => (
                  <button key={r} type="button"
                    style={{
                      padding: '5px 14px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                      border: `1.5px solid ${(form.permittedRoles || []).includes(r) ? 'var(--brand-accent)' : 'var(--border)'}`,
                      background: (form.permittedRoles || []).includes(r) ? 'rgba(26,158,150,0.1)' : 'transparent',
                      color: (form.permittedRoles || []).includes(r) ? 'var(--brand-accent)' : 'var(--text-muted)',
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => togglePermittedRole(r)}>
                    {r.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Select the roles that can view this procedure in the portal. Admin users can always view all SOPs.
              </div>
            </div>
            <CategorySelector
                tree={tree}
                categoryId={form.categoryId}
                onChange={(id) => setField('categoryId', id)}
              />
            <div className="form-group"><label className="form-label">Owner</label><select className="form-control" value={form.ownerId} onChange={e => setField('ownerId', e.target.value)}><option value="">— None —</option>{users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}</select></div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Version Control</h3>
            <div className="form-group">
              <label className="form-label">Bump Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['minor', 'major'].map(b => (
                  <button key={b} type="button" className={`btn btn-sm ${bumpType === b ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setBumpType(b)}>
                    {b === 'minor' ? `Minor (v${sop.currentVersion} → patch)` : `Major (new v)`}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Change Summary *</label>
              <textarea className="form-control" rows={3} value={changeSummary} onChange={e => setChangeSummary(e.target.value)} placeholder="Describe what changed in this version…" required />
            </div>
            <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Current: <strong style={{ color: 'var(--brand-accent)' }}>v{sop.currentVersion}</strong> → Next: <strong style={{ color: 'var(--success)' }}>v{bumpType === 'major' ? `${parseInt(sop.currentVersion)+1}.0` : `${sop.currentVersion.split('.')[0]}.${parseInt(sop.currentVersion.split('.')[1])+1}`}</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Procedure Steps</h3></div>
          <StepBuilder steps={steps} setSteps={setSteps} />
        </div>
      </form>

      <VersionHistory sopId={id} />
    </div>
  );
}
