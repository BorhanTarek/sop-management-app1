import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, ClipboardCheck, Loader, Eye, EyeOff } from 'lucide-react';
import { safetyNoticeService } from '../../services/services';
import { getRoleLabel } from '../../utils/roleHelper';

const ROLES = ['admin', 'station_manager', 'station_master', 'transport_manager', 'driver', 'occ'];

export default function SafetyNoticesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const load = () => {
    setLoading(true);
    safetyNoticeService.list()
      .then(r => setData(r.data))
      .catch(err => console.error('Failed to load Safety Notices:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this safety notice permanently?')) return;
    try {
      await safetyNoticeService.delete(id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleTogglePublish = async (wi) => {
    try {
      const formData = new FormData();
      formData.append('isPublished', !wi.isPublished);
      await safetyNoticeService.update(wi.id, formData);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const filteredData = data.filter(wi => {
    const matchesSearch = wi.title.toLowerCase().includes(search.toLowerCase()) || 
                          wi.content.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === '' || 
                         (statusFilter === 'published' && wi.isPublished) || 
                         (statusFilter === 'draft' && !wi.isPublished);
    const matchesRole = roleFilter === '' || 
                        (wi.permittedRoles && wi.permittedRoles.includes(roleFilter));
    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Safety Notices</h1>
          <p style={{ marginTop: 4, fontSize: '0.85rem' }}>
            Release safety directives, alerts, and guidelines for driver and operator acknowledgment
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/safety-notices/new')}>
          <Plus size={15} /> New Safety Notice
        </button>
      </div>

      <div className="filters-row">
        <div className="search-bar">
          <Search size={14} />
          <input 
            className="form-control" 
            placeholder="Search safety notices…" 
            value={search}
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <select 
          className="filter-select" 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select 
          className="filter-select" 
          value={roleFilter} 
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">All Target Roles</option>
          {ROLES.map(r => (
            <option key={r} value={r}>{getRoleLabel(r)}</option>
          ))}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Created At</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Acknowledgments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 40 }}>
                    <Loader size={22} className="spin" style={{ color: 'var(--brand-accent)' }} />
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📢</div>
                      <h3>No safety notices found</h3>
                      <p>Create a new safety notice to get started</p>
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => navigate('/admin/safety-notices/new')}
                      >
                        <Plus size={13} /> New Safety Notice
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map(wi => (
                  <tr key={wi.id}>
                    <td>
                      <span className="cell-primary" style={{ fontWeight: 600 }}>{wi.title}</span>
                      {wi.permittedRoles && wi.permittedRoles.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                          {wi.permittedRoles.map(role => (
                            <span 
                              key={role} 
                              style={{ 
                                fontSize: '0.62rem', 
                                fontWeight: 700,
                                padding: '1px 6px', 
                                background: 'rgba(26,158,150,0.06)', 
                                color: 'var(--brand-accent)',
                                border: '1px solid rgba(26,158,150,0.15)', 
                                borderRadius: 99,
                                textTransform: 'capitalize'
                              }}
                            >
                              {getRoleLabel(role)}
                            </span>
                          ))}
                        </div>
                      )}
                      <div style={{ 
                        fontSize: '0.72rem', 
                        color: 'var(--text-muted)', 
                        marginTop: 6,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 350
                      }}>
                        {wi.content}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {new Date(wi.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${wi.isPublished ? 'badge-published' : 'badge-draft'}`}>
                        {wi.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => navigate(`/admin/safety-notices/${wi.id}/logs`)}
                        style={{
                          background: 'rgba(26,158,150,0.08)',
                          color: 'var(--brand-accent)',
                          padding: '3px 10px',
                          borderRadius: 99,
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: '1px solid rgba(26,158,150,0.2)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                        title="View acknowledgment logs"
                      >
                        <ClipboardCheck size={12} /> {wi.ackCount || 0} Acks
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          onClick={() => handleTogglePublish(wi)} 
                          title={wi.isPublished ? 'Unpublish to Draft' : 'Publish to Live'}
                          style={{ color: wi.isPublished ? 'var(--warning)' : 'var(--success)' }}
                        >
                          {wi.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          onClick={() => navigate(`/admin/safety-notices/${wi.id}/edit`)} 
                          title="Edit"
                        >
                          <Edit size={13} />
                        </button>
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => handleDelete(wi.id)} 
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
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
