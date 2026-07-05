import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, UserCheck, Loader, MapPin } from 'lucide-react';
import { userService, stationService } from '../../services/services';

const ROLES = ['admin', 'station_manager', 'station_master', 'transport_manager', 'driver', 'occ'];

function UserModal({ user, onClose, onSaved }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    password: '',
    department: user?.department || '',
    roleNames: user?.roles || ['viewer'],
    isActive: user?.isActive ?? true,
    stationIds: user?.stationAssignments?.map(sa => sa.station?.id || sa.stationId) || [],
  });
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    stationService.list().then(r => setStations(r.data));
  }, []);

  const toggleRole = (role) => setForm(f => ({
    ...f,
    roleNames: f.roleNames.includes(role)
      ? f.roleNames.filter(r => r !== role)
      : [...f.roleNames, role],
  }));

  const toggleStation = (id) => setForm(f => ({
    ...f,
    stationIds: f.stationIds.includes(id)
      ? f.stationIds.filter(s => s !== id)
      : [...f.stationIds, id],
  }));

  const isStationMaster = form.roleNames.includes('station_master');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const payload = {
        ...form,
        stationIds: isStationMaster ? form.stationIds : [],
      };
      if (isEdit) await userService.update(user.id, payload);
      else await userService.create(payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving user');
    } finally { setLoading(false); }
  };

  const roleColor = { admin: '#ef4444', station_manager: '#f59e0b', station_master: '#0d9488', transport_manager: '#8b5cf6', driver: '#3b82f6', occ: '#10b981' };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit User' : 'Create User'}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 12 }}>{error}</div>}
        <form onSubmit={submit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-control" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Username *</label>
            <input type="text" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required disabled={isEdit} />
          </div>
          {!isEdit && (
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input type="password" className="form-control" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Roles</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ROLES.map(r => (
                <button key={r} type="button"
                  style={{
                    padding: '5px 14px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    border: `1.5px solid ${form.roleNames.includes(r) ? roleColor[r] : 'var(--border)'}`,
                    background: form.roleNames.includes(r) ? `${roleColor[r]}22` : 'transparent',
                    color: form.roleNames.includes(r) ? roleColor[r] : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => toggleRole(r)}>
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Station Assignment — only when station_master is selected */}
          {isStationMaster && (
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={13} style={{ color: 'var(--brand-accent)' }} />
                Assign Stations (Line 3)
              </label>
              <div style={{
                border: '1px solid var(--border)', borderRadius: 10, padding: 10,
                maxHeight: 180, overflowY: 'auto', background: 'var(--bg-card)',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                {stations.map(st => (
                  <label key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', cursor: 'pointer', borderRadius: 6, transition: 'background 0.1s ease', background: form.stationIds.includes(st.id) ? 'rgba(26,158,150,0.08)' : 'transparent' }}>
                    <input
                      type="checkbox"
                      checked={form.stationIds.includes(st.id)}
                      onChange={() => toggleStation(st.id)}
                      style={{ accentColor: 'var(--brand-primary)' }}
                    />
                    <span style={{ fontSize: '0.82rem', fontWeight: form.stationIds.includes(st.id) ? 700 : 400, color: form.stationIds.includes(st.id) ? 'var(--brand-accent)' : 'var(--text-secondary)' }}>
                      {st.stationCode} — {st.name}
                    </span>
                    {st.nameAr && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', direction: 'rtl' }}>{st.nameAr}</span>}
                  </label>
                ))}
              </div>
              {form.stationIds.length > 0 && (
                <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--brand-accent)' }}>
                  {form.stationIds.length} station{form.stationIds.length > 1 ? 's' : ''} selected
                </div>
              )}
            </div>
          )}

          {isEdit && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                <span className="form-label" style={{ margin: 0 }}>Active</span>
              </label>
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader size={14} className="spin" /> : <UserCheck size={14} />}
              {isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modal, setModal] = useState(null);

  const load = () => {
    setLoading(true);
    userService.list({ search, role: roleFilter })
      .then(r => setUsers(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, roleFilter]);

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    await userService.delete(id);
    load();
  };

  const roleColor = { admin: '#ef4444', station_manager: '#f59e0b', station_master: '#0d9488', transport_manager: '#8b5cf6', driver: '#3b82f6', occ: '#10b981' };

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Users</h1><p style={{ marginTop: 4, fontSize: '0.85rem' }}>Manage system access, roles, and station assignments</p></div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          <Plus size={15} /> Add User
        </button>
      </div>

      <div className="filters-row">
        <div className="search-bar">
          <Search size={14} />
          <input className="form-control" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Username</th><th>Department</th>
                <th>Roles</th><th>Stations</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><div className="loading-spinner" /></td></tr>
                : users.length === 0
                  ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">👤</div><h3>No users found</h3></div></td></tr>
                  : users.map(u => (
                    <tr key={u.id}>
                      <td><span className="cell-primary">{u.fullName}</span></td>
                      <td>{u.email}</td>
                      <td>{u.department || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(u.roles || []).map(r => (
                            <span key={r} style={{
                              padding: '2px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700,
                              background: `${roleColor[r] || '#6366f1'}22`, color: roleColor[r] || '#6366f1',
                              border: `1px solid ${roleColor[r] || '#6366f1'}44`,
                            }}>
                              {r.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        {(u.stationAssignments || []).length > 0 ? (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {u.stationAssignments.map(sa => (
                              <span key={sa.station?.id || sa.stationId} style={{
                                padding: '2px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600,
                                background: 'rgba(13,148,136,0.08)', color: '#0d9488',
                                border: '1px solid rgba(13,148,136,0.2)',
                                display: 'flex', alignItems: 'center', gap: 3,
                              }}>
                                <MapPin size={9} /> {sa.station?.stationCode || '—'}
                              </span>
                            ))}
                          </div>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                      </td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-published' : 'badge-archived'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setModal(u)} title="Edit"><Edit size={13} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)} title="Delete"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <UserModal
          user={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}


