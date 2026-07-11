import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import SignatureSetupModal from './components/signature/SignatureSetupModal';

import LoginPage from './pages/auth/LoginPage';
import AdminLayout from './components/layout/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import UsersPage from './pages/admin/UsersPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import SOPsPage from './pages/admin/SOPsPage';
import SOPCreatePage from './pages/admin/SOPCreatePage';
import SOPEditPage from './pages/admin/SOPEditPage';
import SOPLogsPage from './pages/admin/SOPLogsPage';
import BrowsePage from './pages/viewer/BrowsePage';
import SOPViewPage from './pages/viewer/SOPViewPage';
import StationPortal from './pages/station/StationPortal';
import SessionWizardPage from './pages/station/SessionWizardPage';
import ComplianceDashboard from './pages/admin/ComplianceDashboard';
import SafetyNoticesPage from './pages/admin/SafetyNoticesPage';
import SafetyNoticeCreatePage from './pages/admin/SafetyNoticeCreatePage';
import SafetyNoticeEditPage from './pages/admin/SafetyNoticeEditPage';
import SafetyNoticeLogsPage from './pages/admin/SafetyNoticeLogsPage';
import SafetyNoticesBrowsePage from './pages/viewer/SafetyNoticesBrowsePage';
import OpeningClosingFormPage from './pages/admin/OpeningClosingFormPage';
import OpeningClosingSubmitPage from './pages/viewer/OpeningClosingSubmitPage';
import DriverServiceFormPage from './pages/viewer/DriverServiceFormPage';
import DriverFormsAdminPage from './pages/admin/DriverFormsAdminPage';
import DriverFormsAnalysisPage from './pages/admin/DriverFormsAnalysisPage';

/**
 * SignatureGate — wraps all authenticated content.
 * If the logged-in user has not yet set their signature,
 * renders the mandatory full-screen SignatureSetupModal on top.
 */
function SignatureGate({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return null;
  // Gate authenticated users who haven't set their signature OR haven't changed their password
  if (user && (user.hasSetSignature === false || user.hasChangedPassword === false)) {
    return (
      <>
        {children}
        <SignatureSetupModal />
      </>
    );
  }
  return children;
}

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuthStore();
  if (loading) return <div className="loading-spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !user.roles?.includes('admin') && !user.roles?.includes('station_manager') && !user.roles?.includes('transport_manager')) {
    return <Navigate to="/browse" replace />;
  }
  return children;
}

function StationMasterRoute({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return <div className="loading-spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.roles?.includes('station_master') && !user.roles?.includes('admin') && !user.roles?.includes('station_manager')) {
    return <Navigate to="/browse" replace />;
  }
  return children;
}

function SmartRedirect() {
  const { user, loading } = useAuthStore();
  if (loading) return <div className="loading-spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  const roles = user.roles || [];
  if ((roles.includes('admin') || roles.includes('station_manager') || roles.includes('transport_manager')) && !roles.includes('station_master')) {
    return <Navigate to="/admin" replace />;
  }
  if (roles.includes('station_master') && !roles.includes('admin') && !roles.includes('station_manager') && !roles.includes('transport_manager')) {
    return <Navigate to="/station" replace />;
  }
  return <Navigate to="/browse" replace />;
}

export default function App() {
  const { loadUser } = useAuthStore();
  useEffect(() => { loadUser(); }, []);

  return (
    <BrowserRouter>
      <SignatureGate>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Smart redirect from root */}
          <Route path="/" element={<SmartRedirect />} />

          {/* Admin Dashboard */}
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="sops" element={<SOPsPage />} />
            <Route path="sops/logs" element={<SOPLogsPage />} />
            <Route path="sops/new" element={<SOPCreatePage />} />
            <Route path="sops/:id/edit" element={<SOPEditPage />} />
            <Route path="compliance" element={<ComplianceDashboard />} />
            <Route path="safety-notices" element={<SafetyNoticesPage />} />
            <Route path="safety-notices/new" element={<SafetyNoticeCreatePage />} />
            <Route path="safety-notices/:id/edit" element={<SafetyNoticeEditPage />} />
            <Route path="safety-notices/:id/logs" element={<SafetyNoticeLogsPage />} />
            <Route path="opening-closing" element={<OpeningClosingFormPage />} />
            <Route path="driver-forms" element={<DriverFormsAdminPage />} />
            <Route path="driver-analysis" element={<DriverFormsAnalysisPage />} />
          </Route>

          {/* Station Master Portal */}
          <Route path="/station" element={<StationMasterRoute><StationPortal /></StationMasterRoute>} />
          <Route path="/station/session/:sessionId" element={<StationMasterRoute><SessionWizardPage /></StationMasterRoute>} />

          {/* Viewer Portal */}
          <Route path="/browse" element={<ProtectedRoute><BrowsePage /></ProtectedRoute>} />
          <Route path="/sop/:id" element={<ProtectedRoute><SOPViewPage /></ProtectedRoute>} />
          <Route path="/safety-notices" element={<ProtectedRoute><SafetyNoticesBrowsePage /></ProtectedRoute>} />
          <Route path="/opening-closing" element={<StationMasterRoute><OpeningClosingSubmitPage /></StationMasterRoute>} />
          <Route path="/driver-form" element={<ProtectedRoute><DriverServiceFormPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SignatureGate>
    </BrowserRouter>
  );
}
