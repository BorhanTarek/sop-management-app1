import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Loader, ChevronRight } from 'lucide-react';
import { sopService, categoryService, userService } from '../../services/services';
import { useAuthStore } from '../../store/authStore';
import StepBuilder from '../../components/sop/StepBuilder';

const DOC_TYPES = ['SOP', 'Safety Notice', 'Work Instruction'];

/* StepBuilder is imported from ../../components/sop/StepBuilder */

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
    { id: 1, title: '', body: '', stepType: 'action', refCode: '', sortOrder: 0, yesBranch: [], noBranch: [] }
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
