import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, Send, Archive, RotateCcw } from 'lucide-react';
import { sopService } from '../../services/services';

const STATUS_OPTS = ['', 'draft', 'published', 'archived'];
const DOC_TYPES   = ['', 'SOP', 'Safety Notice', 'Work Instruction'];

export default function SOPsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ sops: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', docType: '' });


  const load = () => {
    setLoading(true);
    sopService.list(filters).then(r => setData(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filters]);

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val }));

  const doAction = async (action, id) => {
    if (action === 'delete' && !confirm('Delete this SOP permanently?')) return;
    try {
      if (action === 'publish')  await sopService.publish(id);
      if (action === 'archive')  await sopService.archive(id);
      if (action === 'restore')  await sopService.restore(id);
      if (action === 'delete')   await sopService.delete(id);
      load();
    } catch (err) { alert(err.response?.data?.error || 'Action failed'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>SOPs</h1>
          <p style={{ marginTop: 4, fontSize: '0.85rem' }}>
            {data.total} document{data.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/sops/new')}>
          <Plus size={15} /> New SOP
        </button>
      </div>

      <div className="filters-row">
        <div className="search-bar">
          <Search size={14} />
          <input className="form-control" placeholder="Search SOPs…" value={filters.search}
            onChange={e => setFilter('search', e.target.value)} />
        </div>
        <select className="filter-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        <select className="filter-select" value={filters.docType} onChange={e => setFilter('docType', e.target.value)}>
          {DOC_TYPES.map(d => <option key={d} value={d}>{d || 'All Types'}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Title</th><th>Ref Code</th><th>Type</th>
                <th>Category</th><th>Version</th><th>Status</th><th>Owner</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><div className="loading-spinner" /></td></tr>
                : data.sops.length === 0
                  ? <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">📄</div><h3>No SOPs found</h3><p>Create your first SOP</p><button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/sops/new')}><Plus size={13} /> New SOP</button></div></td></tr>
                  : data.sops.map(sop => (
                    <tr key={sop.id}>
                      <td><span className="cell-primary truncate" style={{ maxWidth: 220, display: 'block' }}>{sop.title}</span></td>
                      <td><code style={{ fontSize: '0.72rem', color: 'var(--brand-accent)' }}>{sop.referenceCode || '—'}</code></td>
                      <td><span className="badge badge-sop">{sop.docType}</span></td>
                      <td>{sop.category?.name || '—'}</td>
                      <td><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>v{sop.currentVersion}</span></td>
                      <td><span className={`badge badge-${sop.status}`}>{sop.status}</span></td>
                      <td>{sop.owner?.fullName || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 3 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/sop/${sop.id}`)} title="View"><Eye size={13} /></button>
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/sops/${sop.id}/edit`)} title="Edit"><Edit size={13} /></button>

                          {sop.status === 'draft'     && <button className="btn btn-ghost btn-sm" onClick={() => doAction('publish', sop.id)} title="Publish" style={{ color: 'var(--success)' }}><Send size={13} /></button>}
                          {sop.status === 'published' && <button className="btn btn-ghost btn-sm" onClick={() => doAction('archive', sop.id)} title="Archive" style={{ color: 'var(--warning)' }}><Archive size={13} /></button>}
                          {sop.status === 'archived'  && <button className="btn btn-ghost btn-sm" onClick={() => doAction('restore', sop.id)} title="Restore" style={{ color: 'var(--info)' }}><RotateCcw size={13} /></button>}
                          <button className="btn btn-danger btn-sm" onClick={() => doAction('delete', sop.id)} title="Delete"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
}

