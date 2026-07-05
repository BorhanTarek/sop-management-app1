import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, Users, FolderTree, FileText,
  LogOut, ChevronRight, Bell, Activity, BookOpen, ClipboardCheck
} from 'lucide-react';
import mobilityLogo from '../../assets/Logo-Mobility-Cairo.png';

const navItems = [
  { label: 'Dashboard',   path: '/admin',                  icon: LayoutDashboard, exact: true },
  { label: 'SOPs',        path: '/admin/sops',             icon: FileText },
  { label: 'Safety Notices', path: '/admin/safety-notices',   icon: BookOpen },
  { label: 'Opening & Closing', path: '/admin/opening-closing', icon: ClipboardCheck },
  { label: 'Categories',  path: '/admin/categories',       icon: FolderTree },
  { label: 'Users',       path: '/admin/users',            icon: Users },
  { label: 'Compliance',  path: '/admin/compliance',       icon: Activity },
];

export default function AdminLayout() {
  const { user, logout, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src={mobilityLogo} style={{ width: 26, height: 26, objectFit: 'contain', marginRight: 2 }} alt="Mobility Cairo Logo" />
          <div className="sidebar-logo-text">
            Green Line
            <small>SOP Management</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {navItems.map(({ label, path, icon: Icon, exact }) => (
            <NavLink
              key={path}
              to={path}
              end={exact}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}

          <div className="nav-section-label">Portal</div>
          <NavLink to="/browse" className="nav-item">
            <ChevronRight size={16} />
            View Portal
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={handleLogout} title="Logout">
            <div className="avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="name">{user?.fullName}</div>
              <div className="role">{user?.roles?.[0]}</div>
            </div>
            <LogOut size={14} style={{ color: 'var(--text-muted)' }} />
          </div>
        </div>
      </aside>

      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-breadcrumb">
          <span>Green Line</span>
          <span className="sep">/</span>
          <span className="cur">Admin</span>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/browse')}>
            View Portal
          </button>
          <button className="btn btn-ghost btn-sm" style={{ padding: '8px' }}>
            <Bell size={16} />
          </button>
          <div className="avatar" style={{ cursor: 'pointer' }}>{initials}</div>
        </div>
      </header>

      {/* Main content */}
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
