import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, UserCheck, Loader } from 'lucide-react';
import { userService } from '../../services/services';

const ROLES = ['admin', 'editor', 'viewer'];

function UserModal({ user, onClose, onSaved }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    password: '',
    department: user?.department || '',
    roleNames: user?.roles || ['viewer'],
    isActive: user?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = (role) => setForm(f => ({
    ...f,
    roleNames: f.roleNames.includes(role)
      ? f.roleNames.filter(r => r !== role)
      : [...f.roleNames, role]
  }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (isEdit) await userService.update(user.id, form);
      else await userService.create(form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving user');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
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
            <label className="form-label">Email *</label>
            <input type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required disabled={isEdit} />
          </div>
          {!isEdit && (
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input type="password" className="form-control" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Roles</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {ROLES.map(r => (
                <button key={r} type="button"
                  className={`btn btn-sm ${form.roleNames.includes(r) ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => toggle(r)}>
                  {r}
                </button>
              ))}
            </div>
          </div>
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
  const [modal, setModal] = useState(null); // null | 'create' | user object

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

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Users</h1><p style={{ marginTop: 4, fontSize: '0.85rem' }}>Manage system access and roles</p></div>
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
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Department</th>
                <th>Roles</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><div className="loading-spinner" /></td></tr>
                : users.length === 0
                  ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">👤</div><h3>No users found</h3></div></td></tr>
                  : users.map(u => (
                    <tr key={u.id}>
                      <td><span className="cell-primary">{u.fullName}</span></td>
                      <td>{u.email}</td>
                      <td>{u.department || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(u.roles || []).map(r => <span key={r} className={`badge badge-${r}`}>{r}</span>)}
                        </div>
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
