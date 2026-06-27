import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import LoginPage from './pages/auth/LoginPage';
import AdminLayout from './components/layout/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import UsersPage from './pages/admin/UsersPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import SOPsPage from './pages/admin/SOPsPage';
import SOPCreatePage from './pages/admin/SOPCreatePage';
import SOPEditPage from './pages/admin/SOPEditPage';
import BrowsePage from './pages/viewer/BrowsePage';
import SOPViewPage from './pages/viewer/SOPViewPage';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuthStore();
  if (loading) return <div className="loading-spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !user.roles?.includes('admin') && !user.roles?.includes('editor')) {
    return <Navigate to="/browse" replace />;
  }
  return children;
}

export default function App() {
  const { loadUser } = useAuthStore();
  useEffect(() => { loadUser(); }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Admin Dashboard */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="sops" element={<SOPsPage />} />
          <Route path="sops/new" element={<SOPCreatePage />} />
          <Route path="sops/:id/edit" element={<SOPEditPage />} />
        </Route>

        {/* Viewer Portal */}
        <Route path="/browse" element={<ProtectedRoute><BrowsePage /></ProtectedRoute>} />
        <Route path="/sop/:id" element={<ProtectedRoute><SOPViewPage /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to="/browse" replace />} />
        <Route path="*" element={<Navigate to="/browse" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
