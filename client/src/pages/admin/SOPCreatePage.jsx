import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowUp, ArrowDown, Save, ArrowLeft, Loader, ChevronRight } from 'lucide-react';
import { sopService, categoryService, userService } from '../../services/services';
import { useAuthStore } from '../../store/authStore';

const DOC_TYPES  = ['SOP', 'Safety Notice', 'Work Instruction'];
const STEP_TYPES = ['action', 'decision', 'reference'];

/* ── Step Builder ────────────────────────────────────── */
function StepBuilder({ steps, setSteps }) {
  const addStep = () => setSteps(s => [
    ...s,
    { id: Date.now(), title: '', body: '', stepType: 'action', refCode: '', sortOrder: s.length }
  ]);
  const update = (idx, key, val) => setSteps(s => s.map((st, i) => i === idx ? { ...st, [key]: val } : st));
  const remove = (idx) => setSteps(s => s.filter((_, i) => i !== idx));
  const move = (idx, dir) => {
    const arr = [...steps]; const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]]; setSteps(arr);
  };
  return (
    <div className="step-builder">
      {steps.map((step, idx) => (
        <div key={step.id || idx} className={`step-item${step.stepType === 'decision' ? ' decision' : ''}`}>
          <div className="step-num">{idx + 1}</div>
          <div className="step-content">
            <div className="grid-2" style={{ marginBottom: 6 }}>
              <input className="form-control" placeholder="Step title *" value={step.title}
                onChange={e => update(idx, 'title', e.target.value)} />
              <select className="form-control" value={step.stepType} onChange={e => update(idx, 'stepType', e.target.value)}>
                {STEP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid-2">
              <input className="form-control" placeholder="Description (optional)" value={step.body || ''}
                onChange={e => update(idx, 'body', e.target.value)} />
              <input className="form-control" placeholder="Ref code e.g. WI-RTM-H11" value={step.refCode || ''}
                onChange={e => update(idx, 'refCode', e.target.value)} />
            </div>
          </div>
          <div className="step-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(idx, -1)}><ArrowUp size={12} /></button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(idx, 1)}><ArrowDown size={12} /></button>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(idx)}><Trash2 size={12} /></button>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-secondary" onClick={addStep} style={{ alignSelf: 'flex-start' }}>
        <Plus size={14} /> Add Step
      </button>
    </div>
  );
}

/* ── Category / Sub-category Selector ───────────────── */
function CategorySelector({ tree, categoryId, onChange }) {
  // Find which root category contains the current selection
  const findRoot = (nodes, targetId) => {
    for (const node of nodes) {
      if (node.id === targetId) return node.parentId ? null : node.id;
      if (node.children?.length) {
        const found = findRoot(node.children, targetId);
        if (found !== undefined) return node.id; // this root contains it
      }
    }
    return undefined;
  };

  const initialRoot = categoryId
    ? (tree.find(r => r.id === categoryId)
        ? categoryId
        : tree.find(r => r.children?.some(c => c.id === categoryId))?.id || '')
    : '';

  const [selectedRoot, setSelectedRoot] = useState(initialRoot);
  const [selectedSub, setSelectedSub]   = useState(
    categoryId && categoryId !== initialRoot ? categoryId : ''
  );

  const rootCategories = tree; // top-level only
  const subCategories  = tree.find(r => r.id === selectedRoot)?.children || [];

  const handleRootChange = (rootId) => {
    setSelectedRoot(rootId);
    setSelectedSub('');
    // If root has no children, use root as the categoryId
    const root = tree.find(r => r.id === rootId);
    const kids = root?.children || [];
    onChange(kids.length === 0 ? rootId : '');
  };

  const handleSubChange = (subId) => {
    setSelectedSub(subId);
    onChange(subId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Row 1: Category */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Category</label>
        <select
          className="form-control"
          value={selectedRoot}
          onChange={e => handleRootChange(e.target.value)}
        >
          <option value="">— Select Category —</option>
          {rootCategories.map(c => (
            <option key={c.id} value={c.id}>
              {c.icon ? `${c.icon} ` : ''}{c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Row 2: Sub-Category (only shown if root has children) */}
      {selectedRoot && subCategories.length > 0 && (
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ChevronRight size={12} style={{ color: 'var(--brand-accent)' }} />
            Sub-Category
          </label>
          <select
            className="form-control"
            value={selectedSub}
            onChange={e => handleSubChange(e.target.value)}
            style={{ borderColor: 'rgba(26,158,150,0.4)' }}
          >
            <option value="">— Select Sub-Category —</option>
            {subCategories.map(c => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ''}{c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Breadcrumb display */}
      {selectedRoot && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--brand-accent)' }}>
            {tree.find(r => r.id === selectedRoot)?.name}
          </span>
          {selectedSub && (
            <>
              <ChevronRight size={11} />
              <span style={{ color: 'var(--text-primary)' }}>
                {subCategories.find(c => c.id === selectedSub)?.name}
              </span>
            </>
          )}
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
    docType: 'SOP', tags: '',
  });
  const [steps, setSteps] = useState([
    { id: 1, title: '', body: '', stepType: 'action', refCode: '', sortOrder: 0 }
  ]);

  useEffect(() => {
    categoryService.tree().then(r => setTree(r.data));
    userService.list({}).then(r => setUsers(r.data));
  }, []);

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Resolve display label for selected category
  const resolveLabel = () => {
    if (!form.categoryId) return null;
    const flat = [];
    const flatten = (nodes) => nodes.forEach(n => { flat.push(n); if (n.children) flatten(n.children); });
    flatten(tree);
    return flat.find(c => c.id === form.categoryId)?.name;
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await sopService.create({
        ...form,
        ownerId: form.ownerId || user?.id,
        steps: steps.filter(s => s.title.trim()),
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
