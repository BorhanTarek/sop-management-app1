import { useState, useEffect } from 'react';
import { Plus, ChevronRight, ChevronDown, Folder, FolderOpen, Edit, Trash2, Loader } from 'lucide-react';
import { categoryService } from '../../services/services';

function CategoryModal({ cat, parentId, allCats, onClose, onSaved }) {
  const isEdit = !!cat;
  const [form, setForm] = useState({
    name: cat?.name || '',
    description: cat?.description || '',
    icon: cat?.icon || '',
    parentId: cat?.parentId || parentId || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const flatCats = [];
  const flatten = (nodes, depth = 0) => nodes.forEach(n => {
    flatCats.push({ ...n, depth });
    if (n.children) flatten(n.children, depth + 1);
  });
  flatten(allCats);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (isEdit) await categoryService.update(cat.id, form);
      else await categoryService.create(form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving category');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Category' : 'New Category'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 12 }}>{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Icon (emoji)</label>
              <input className="form-control" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🚌" />
            </div>
            <div className="form-group">
              <label className="form-label">Parent Category</label>
              <select className="form-control" value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}>
                <option value="">— Root level —</option>
                {flatCats.filter(c => c.id !== cat?.id).map(c => (
                  <option key={c.id} value={c.id}>{'  '.repeat(c.depth)}{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader size={14} className="spin" /> : null}
              {isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CatNode({ node, allCats, onEdit, onDelete, onAddChild, depth = 0 }) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = node.children?.length > 0;

  return (
    <div className="cat-node">
      <div className="cat-node-header" onClick={() => setOpen(!open)}>
        {hasChildren
          ? (open ? <ChevronDown size={14} className="cat-node-icon" /> : <ChevronRight size={14} className="cat-node-icon" />)
          : <span style={{ width: 14, display: 'inline-block' }} />
        }
        <span style={{ fontSize: '1rem' }}>{node.icon || '📁'}</span>
        <span className="cat-node-name">{node.name}</span>
        {node._count?.sops > 0 && <span className="cat-node-count">{node._count.sops} SOPs</span>}
        <div className="cat-node-actions" onClick={e => e.stopPropagation()}>
          <button className="btn btn-ghost btn-sm" onClick={() => onAddChild(node.id)} title="Add child"><Plus size={12} /></button>
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(node)} title="Edit"><Edit size={12} /></button>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(node.id)} title="Delete"><Trash2 size={12} /></button>
        </div>
      </div>
      {open && hasChildren && (
        <div className="cat-children">
          {node.children.map(child => (
            <CatNode key={child.id} node={child} allCats={allCats}
              onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = () => {
    setLoading(true);
    categoryService.tree().then(r => setTree(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? Its sub-categories will be moved up.')) return;
    await categoryService.delete(id);
    load();
  };

  const flatAll = [];
  const flatten = (nodes) => nodes.forEach(n => { flatAll.push(n); if (n.children) flatten(n.children); });
  flatten(tree);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p style={{ marginTop: 4, fontSize: '0.85rem' }}>Organize SOPs into hierarchical folders</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ type: 'create', parentId: null })}>
          <Plus size={15} /> Add Root Category
        </button>
      </div>

      <div className="card">
        {loading
          ? <div className="loading-spinner" />
          : tree.length === 0
            ? <div className="empty-state"><div className="empty-state-icon">📂</div><h3>No categories yet</h3><p>Create your first category to organize SOPs</p></div>
            : <div className="cat-tree">
                {tree.map(node => (
                  <CatNode
                    key={node.id}
                    node={node}
                    allCats={flatAll}
                    onEdit={(n) => setModal({ type: 'edit', cat: n })}
                    onDelete={handleDelete}
                    onAddChild={(parentId) => setModal({ type: 'create', parentId })}
                  />
                ))}
              </div>
        }
      </div>

      {modal && (
        <CategoryModal
          cat={modal.type === 'edit' ? modal.cat : null}
          parentId={modal.parentId}
          allCats={flatAll}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
