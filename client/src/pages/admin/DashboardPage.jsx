import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, FolderTree, TrendingUp, Plus, Eye, Edit, Clock } from 'lucide-react';
import { sopService, userService, categoryService } from '../../services/services';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ sops: 0, published: 0, draft: 0, users: 0, categories: 0 });
  const [recentSops, setRecentSops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      sopService.list({ limit: 5 }),
      userService.list({}),
      categoryService.tree(),
    ]).then(([sopRes, userRes, catRes]) => {
      const sops = sopRes.data.sops || [];
      const total = sopRes.data.total || 0;
      const published = sops.filter(s => s.status === 'published').length;
      const draft = sops.filter(s => s.status === 'draft').length;
      setStats({
        sops: total,
        published,
        draft,
        users: userRes.data.length,
        categories: catRes.data.length,
      });
      setRecentSops(sops.slice(0, 5));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total SOPs',   value: stats.sops,       icon: FileText,   cls: 'teal'   },
    { label: 'Published',    value: stats.published,  icon: TrendingUp, cls: 'green'  },
    { label: 'Drafts',       value: stats.draft,      icon: Clock,      cls: 'yellow' },
    { label: 'Users',        value: stats.users,      icon: Users,      cls: 'blue'   },
    { label: 'Categories',   value: stats.categories, icon: FolderTree, cls: 'teal'   },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p style={{ marginTop: 4, fontSize: '0.85rem' }}>Welcome back — here's what's happening</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/sops/new')}>
          <Plus size={15} /> New SOP
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${cls}`}><Icon size={20} /></div>
            <div className="stat-value">{loading ? '—' : value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Recent SOPs */}
        <div className="card">
          <div className="card-header">
            <h3>Recent SOPs</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/sops')}>View all</button>
          </div>
          {loading ? <div className="loading-spinner" /> : (
            recentSops.length === 0
              ? <div className="empty-state"><div className="empty-state-icon">📄</div><h3>No SOPs yet</h3><p>Create your first SOP to get started</p><button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/sops/new')}><Plus size={13} /> Create SOP</button></div>
              : <div className="activity-list">
                  {recentSops.map(sop => (
                    <div key={sop.id} className="activity-item">
                      <div className={`activity-dot ${sop.status}`} />
                      <div className="activity-text">
                        <strong>{sop.title}</strong>
                        <br />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {sop.docType} · v{sop.currentVersion} · {sop.category?.name || 'Uncategorized'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/sop/${sop.id}`)} title="View"><Eye size={13} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/sops/${sop.id}/edit`)} title="Edit"><Edit size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header"><h3>Quick Actions</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: '+ Create New SOP',        path: '/admin/sops/new',    cls: 'btn-primary' },
              { label: '+ Add Category',           path: '/admin/categories',  cls: 'btn-secondary' },
              { label: '+ Invite User',            path: '/admin/users',       cls: 'btn-secondary' },
              { label: '⬡ Browse Viewer Portal',  path: '/browse',            cls: 'btn-secondary' },
            ].map(({ label, path, cls }) => (
              <button key={path} className={`btn ${cls}`} onClick={() => navigate(path)}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
