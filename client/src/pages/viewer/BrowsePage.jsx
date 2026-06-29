import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Search, Settings, Loader } from 'lucide-react';
import { categoryService, sopService } from '../../services/services';
import { useAuthStore } from '../../store/authStore';
import ratpLogo from '../../assets/RDMC LOGO.jpg';
import mobilityLogo from '../../assets/Logo-Mobility-Cairo.png';

export default function BrowsePage() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuthStore();
  const [tree, setTree] = useState([]);
  const [path, setPath] = useState([]); // breadcrumb stack of category nodes
  const [sops, setSops] = useState(null); // null = not viewing SOPs yet
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load category tree on mount
  useEffect(() => {
    categoryService.tree()
      .then(r => setTree(r.data))
      .finally(() => setLoading(false));
  }, []);

  // Global search effect (debounced to 250ms to prevent database spamming)
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const delayDebounce = setTimeout(() => {
      // Query sops globally (without categoryId) for case-insensitive matches in all titles
      sopService.list({ search: search.trim(), status: 'published' })
        .then(r => setSearchResults(r.data.sops))
        .catch(err => console.error('Search error:', err))
        .finally(() => setSearching(false));
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [search]);

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

  // Check if we are currently displaying global search results
  const isSearchingGlobally = search.trim() !== '';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      
      {/* ─── Brand Portal Header with Logos ──────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-dark))',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {path.length > 0 && !isSearchingGlobally && (
            <button onClick={goBack} style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '50%', width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer'
            }}>
              <ArrowLeft size={16} />
            </button>
          )}
          
          {/* RATP and Mobility Cairo logos side-by-side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={mobilityLogo} alt="Mobility Cairo Logo" style={{ height: 36, objectFit: 'contain' }} />
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.2)' }} />
            <img src={ratpLogo} alt="RATP Dev Logo" style={{ height: 24, objectFit: 'contain', borderRadius: 2 }} />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isAdmin() && (
            <button onClick={() => navigate('/admin')} style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 'var(--radius-sm)', padding: '6px 12px',
              color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              <Settings size={13} /> Admin
            </button>
          )}
          <button onClick={() => { logout(); navigate('/login'); }} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 'var(--radius-sm)', padding: '6px 12px',
            color: '#fff', fontSize: '0.78rem', cursor: 'pointer'
          }}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        
        {/* Search Input */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: 34, paddingRight: isSearchingGlobally ? 36 : 12 }}
            placeholder="Search all SOPs by title…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {searching && (
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
              <Loader size={14} className="spin" style={{ color: 'var(--brand-accent)' }} />
            </div>
          )}
        </div>

        {/* ─── View 1: Global Search Results ─────────────────────── */}
        {isSearchingGlobally ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                Search Results for "{search}"
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {searchResults.length} matched
              </span>
            </div>

            <div className="browse-grid" style={{ padding: 0 }}>
              {searchResults.length === 0 && !searching ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <h3>No SOPs found</h3>
                  <p>Try searching for different keywords</p>
                </div>
              ) : (
                searchResults.map(sop => (
                  <button key={sop.id} className="browse-btn" onClick={() => navigate(`/sop/${sop.id}`)}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600 }}>{sop.title}</div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: 3 }}>
                          {sop.docType} · v{sop.currentVersion} {sop.referenceCode && `· ${sop.referenceCode}`}
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ opacity: 0.7 }} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          
          /* ─── View 2: Standard Category Folder Tree Navigation ─── */
          <>
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
                {/* Category buttons list */}
                {!sops && (
                  <div className="browse-grid" style={{ padding: 0 }}>
                    {currentLevel.length === 0
                      ? <div className="empty-state"><div className="empty-state-icon">📂</div><h3>No sub-categories here</h3></div>
                      : currentLevel.map(node => (
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

                {/* SOPs list within selected category folder */}
                {sops !== null && (
                  <div className="browse-grid" style={{ padding: 0 }}>
                    {sops.length === 0
                      ? <div className="empty-state"><div className="empty-state-icon">📄</div><h3>No published SOPs</h3><p>Check back later</p></div>
                      : sops.map(sop => (
                        <button key={sop.id} className="browse-btn" onClick={() => navigate(`/sop/${sop.id}`)}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ textAlign: 'left' }}>
                              <div style={{ fontWeight: 600 }}>{sop.title}</div>
                              <div style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: 3 }}>{sop.docType} · v{sop.currentVersion}</div>
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
          </>
        )}
      </div>
    </div>
  );
}
