import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Search, FileText, Settings } from 'lucide-react';
import { categoryService, sopService } from '../../services/services';
import { useAuthStore } from '../../store/authStore';

export default function BrowsePage() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuthStore();
  const [tree, setTree] = useState([]);
  const [path, setPath] = useState([]); // breadcrumb stack of category nodes
  const [sops, setSops] = useState(null); // null = not viewing SOPs yet
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { categoryService.tree().then(r => setTree(r.data)).finally(() => setLoading(false)); }, []);

  const currentLevel = path.length === 0 ? tree : path[path.length - 1].children || [];

  const handleCatClick = (node) => {
    const hasChildren = node.children?.length > 0;
    if (hasChildren) {
      setPath(p => [...p, node]);
      setSops(null);
    } else {
      // Leaf category — load SOPs
      setPath(p => [...p, node]);
      setSops(null);
      sopService.list({ categoryId: node.id, status: 'published' })
        .then(r => setSops(r.data.sops));
    }
  };

  const goBack = () => {
    if (path.length === 0) return;
    const newPath = path.slice(0, -1);
    setPath(newPath);
    setSops(null);
  };

  const filtered = (search
    ? currentLevel.filter(n => n.name.toLowerCase().includes(search.toLowerCase()))
    : currentLevel);

  const filteredSops = search && sops
    ? sops.filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
    : sops;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-dark))',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        {path.length > 0 && (
          <button onClick={goBack} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
            <ArrowLeft size={16} />
          </button>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontWeight: 600 }}>GREEN LINE · SOP PORTAL</div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>
            {path.length === 0 ? 'All Departments' : path[path.length - 1].name}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin() && (
            <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', color: '#fff', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Settings size={13} /> Admin
            </button>
          )}
          <button onClick={() => { logout(); navigate('/login'); }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', color: '#fff', fontSize: '0.78rem', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: 34 }}
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Breadcrumbs */}
        {path.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ cursor: 'pointer', color: 'var(--brand-accent)' }} onClick={() => { setPath([]); setSops(null); }}>Home</span>
            {path.map((p, i) => (
              <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ChevronRight size={12} />
                <span style={{ cursor: i < path.length - 1 ? 'pointer' : 'default', color: i < path.length - 1 ? 'var(--brand-accent)' : 'var(--text-primary)' }}
                  onClick={() => { if (i < path.length - 1) { setPath(path.slice(0, i + 1)); setSops(null); } }}>
                  {p.name}
                </span>
              </span>
            ))}
          </div>
        )}

        {loading ? <div className="loading-spinner" /> : (
          <>
            {/* Category buttons */}
            {!sops && (
              <div className="browse-grid" style={{ padding: 0 }}>
                {filtered.length === 0
                  ? <div className="empty-state"><div className="empty-state-icon">📂</div><h3>No items here</h3></div>
                  : filtered.map(node => (
                    <button key={node.id} className="browse-btn" onClick={() => handleCatClick(node)}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{node.icon && `${node.icon} `}{node.name}</span>
                        <ChevronRight size={18} style={{ opacity: 0.7 }} />
                      </div>
                    </button>
                  ))
                }
              </div>
            )}

            {/* SOPs list */}
            {sops !== null && (
              <div className="browse-grid" style={{ padding: 0 }}>
                {(filteredSops || []).length === 0
                  ? <div className="empty-state"><div className="empty-state-icon">📄</div><h3>No published SOPs</h3><p>Check back later</p></div>
                  : (filteredSops || []).map(sop => (
                    <button key={sop.id} className="browse-btn" onClick={() => navigate(`/sop/${sop.id}`)}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ textAlign: 'left' }}>
                          <div>{sop.title}</div>
                          <div style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: 2 }}>{sop.docType} · v{sop.currentVersion}</div>
                        </div>
                        <ChevronRight size={18} style={{ opacity: 0.7 }} />
                      </div>
                    </button>
                  ))
                }
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
