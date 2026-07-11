import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Loader, ChevronRight } from 'lucide-react';
import { sopService, categoryService, userService } from '../../services/services';
import { useAuthStore } from '../../store/authStore';
import StepBuilder from '../../components/sop/StepBuilder';

const DOC_TYPES = ['SOP', 'Safety Notice', 'Work Instruction'];
const PERMITTED_ROLES = ['station_manager', 'station_master', 'transport_manager', 'driver', 'occ'];

/* StepBuilder is imported from ../../components/sop/StepBuilder */

/* ── Category / Sub-category Selector ───────────────── */
const findPath = (nodes, targetId, currentPath = []) => {
  for (const node of nodes) {
    if (node.id === targetId) return [...currentPath, node.id];
    if (node.children && node.children.length > 0) {
      const found = findPath(node.children, targetId, [...currentPath, node.id]);
      if (found) return found;
    }
  }
  return null;
};

const findNodeById = (nodes, id) => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

function CategorySelector({ tree, categoryId, onChange }) {
  const [path, setPath] = useState([]);

  // Initialize path from categoryId
  useEffect(() => {
    if (!categoryId || tree.length === 0) {
      setPath([]);
      return;
    }
    const foundPath = findPath(tree, categoryId);
    if (foundPath) {
      setPath(foundPath);
    } else {
      setPath([]);
    }
  }, [categoryId, tree]);

  // Find node by path helper
  const getNodeByPath = (pathArray) => {
    let currentNodes = tree;
    let lastNode = null;
    for (const id of pathArray) {
      const found = currentNodes.find(n => n.id === id);
      if (!found) return null;
      lastNode = found;
      currentNodes = found.children || [];
    }
    return lastNode;
  };

  // Handle dropdown change at a specific level
  const handleLevelChange = (levelIndex, selectedValue) => {
    const newPath = path.slice(0, levelIndex);
    if (selectedValue) {
      newPath.push(selectedValue);
    }
    setPath(newPath);
    // Notify parent of the most specific selected category
    const finalValue = newPath[newPath.length - 1] || '';
    onChange(finalValue);
  };

  // Build the levels to render
  const levels = [];
  
  // Always render level 0 (root categories)
  levels.push({
    label: 'Category',
    options: tree,
    value: path[0] || ''
  });

  // Render sub-category levels
  for (let i = 0; i < path.length; i++) {
    const currentNode = getNodeByPath(path.slice(0, i + 1));
    if (currentNode && currentNode.children && currentNode.children.length > 0) {
      levels.push({
        label: i === 0 ? 'Sub-Category' : 'Sub-Sub-Category',
        options: currentNode.children,
        value: path[i + 1] || ''
      });
    }
  }

  // Render breadcrumbs
  const getBreadcrumbString = () => {
    return path.map(id => {
      const node = findNodeById(tree, id);
      return node ? node.name : '';
    }).filter(Boolean).join(' > ');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {levels.map((level, idx) => (
        <div key={idx} className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {idx > 0 && <ChevronRight size={12} style={{ color: 'var(--brand-accent)' }} />}
            {level.label}
          </label>
          <select
            className="form-control"
            value={level.value}
            onChange={e => handleLevelChange(idx, e.target.value)}
            style={idx > 0 ? { borderColor: 'rgba(26,158,150,0.4)' } : undefined}
          >
            <option value="">{idx === 0 ? '— Select Category —' : '— Select Sub-Category —'}</option>
            {level.options.map(c => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ''}{c.name}
              </option>
            ))}
          </select>
        </div>
      ))}

      {path.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--brand-accent)' }}>
            {getBreadcrumbString()}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────── */
export default function SOPCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tree, setTree]   = useState([]);   // raw tree (with children)
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [form, setForm] = useState({
    title: '', referenceCode: '', categoryId: '', ownerId: '',
    docType: 'SOP', tags: '', permittedRoles: [],
  });
  const [steps, setSteps] = useState([
    { id: 1, title: '', body: '', stepType: 'action', refCode: '', sortOrder: 0, yesBranch: [], noBranch: [] }
  ]);

  useEffect(() => {
    categoryService.tree().then(r => setTree(r.data));
    userService.list({}).then(r => setUsers(r.data));
  }, []);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const togglePermittedRole = (role) => {
    setForm(f => ({
      ...f,
      permittedRoles: f.permittedRoles.includes(role)
        ? f.permittedRoles.filter(r => r !== role)
        : [...f.permittedRoles, role],
    }));
  };

  // Resolve display label for selected category
  const resolveLabel = () => {
    if (!form.categoryId) return null;
    const flat = [];
    const flatten = (nodes) => nodes.forEach(n => { flat.push(n); if (n.children) flatten(n.children); });
    flatten(tree);
    return flat.find(c => c.id === form.categoryId)?.name;
  };

  // Serialize branch arrays to JSON string before sending to API.
  // KEY RULE: Decision steps never have a top-level refCode — WI codes live
  // on each individual branch sub-step inside yesBranch / noBranch.
  const prepareStepsForAPI = (rawSteps) =>
    rawSteps
      .filter(s => s.title?.trim())
      .map(s => ({
        ...s,
        // Decision steps: WI code is null at the question level — WI codes live
        // on each individual branch sub-step inside yesBranch / noBranch.
        refCode: s.stepType === 'decision' ? null : (s.refCode || null),
        branchData: s.stepType === 'decision'
          ? JSON.stringify({ yesBranch: s.yesBranch || [], noBranch: s.noBranch || [] })
          : null,
        attentionPoints: s.attentionPoints || [],
        safetyPoints: s.safetyPoints || [],
      }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await sopService.create({
        ...form,
        ownerId: form.ownerId || user?.id,
        steps: prepareStepsForAPI(steps),
      });
      navigate('/admin/sops');
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating SOP');
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}><ArrowLeft size={15} /></button>
          <div>
            <h1>Create New SOP</h1>
            <p style={{ marginTop: 4, fontSize: '0.85rem' }}>Fill in the details below</p>
          </div>
        </div>
        <button form="sop-form" type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <Loader size={14} className="spin" /> : <Save size={14} />}
          Save as Draft
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 20 }}>
          {error}
        </div>
      )}

      <form id="sop-form" onSubmit={submit}>
        <div className="grid-2" style={{ marginBottom: 20 }}>

          {/* ── Left: Document Info ── */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Document Info</h3>

            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-control" value={form.title}
                onChange={e => setField('title', e.target.value)}
                required placeholder="e.g. Door Failure Procedure" />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Reference Code</label>
                <input className="form-control" value={form.referenceCode}
                  onChange={e => setField('referenceCode', e.target.value)}
                  placeholder="TAC-RTM-002-1-1" />
              </div>
              <div className="form-group">
                <label className="form-label">Document Type</label>
                <select className="form-control" value={form.docType}
                  onChange={e => setField('docType', e.target.value)}>
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Audience / Permitted Roles</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PERMITTED_ROLES.map(r => (
                  <button key={r} type="button"
                    style={{
                      padding: '5px 14px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                      border: `1.5px solid ${form.permittedRoles.includes(r) ? 'var(--brand-accent)' : 'var(--border)'}`,
                      background: form.permittedRoles.includes(r) ? 'rgba(26,158,150,0.1)' : 'transparent',
                      color: form.permittedRoles.includes(r) ? 'var(--brand-accent)' : 'var(--text-muted)',
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

            {/* ── Category + Sub-Category ── */}
            <CategorySelector
              tree={tree}
              categoryId={form.categoryId}
              onChange={(id) => setField('categoryId', id)}
            />

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Owner</label>
              <select className="form-control" value={form.ownerId}
                onChange={e => setField('ownerId', e.target.value)}>
                <option value="">— Assign to me —</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input className="form-control" value={form.tags}
                onChange={e => setField('tags', e.target.value)}
                placeholder="safety, driver, door" />
            </div>
          </div>

          {/* ── Right: Preview ── */}
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Preview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Document Type</div>
              <span className="badge badge-sop">{form.docType}</span>

              {form.referenceCode && <>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>Reference Code</div>
                <code style={{ color: 'var(--brand-accent)', fontSize: '0.85rem' }}>{form.referenceCode}</code>
              </>}

              {form.categoryId && <>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>Category</div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{resolveLabel()}</span>
              </>}

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>Status</div>
              <span className="badge badge-draft">Draft · v1.0</span>

              {form.permittedRoles.length > 0 && <>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>Target Audience</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                  {form.permittedRoles.map(r => (
                    <span key={r} style={{ padding: '2px 8px', borderRadius: 99, fontSize: '0.7rem', background: 'rgba(26,158,150,0.1)', color: 'var(--brand-accent)' }}>
                      {r.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </>}

              {steps.filter(s => s.title).length > 0 && <>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>Steps defined</div>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--brand-accent)' }}>
                  {steps.filter(s => s.title).length}
                </span>
              </>}
            </div>
          </div>
        </div>

        {/* ── Steps Builder ── */}
        <div className="card">
          <div className="card-header">
            <h3>Procedure Steps</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {steps.filter(s => s.title).length} step(s) defined
            </span>
          </div>
          <StepBuilder steps={steps} setSteps={setSteps} />
        </div>
      </form>
    </div>
  );
}
