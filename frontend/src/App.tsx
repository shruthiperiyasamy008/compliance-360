import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { InstitutionRegisterPage } from './pages/InstitutionRegisterPage';
import { InstitutionDashboard } from './pages/InstitutionDashboard';
import { NewApplicationPage } from './pages/NewApplicationPage';
import { MyApplicationsPage } from './pages/MyApplicationsPage';
import { ApplicationDetailPage } from './pages/ApplicationDetailPage';
import { InstitutionNotificationCenterPage } from './pages/InstitutionNotificationCenterPage';
import { InstitutionCompliancePage } from './pages/InstitutionCompliancePage';
import { InstitutionValidityPage } from './pages/InstitutionValidityPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminApplicationsPage } from './pages/AdminApplicationsPage';
import { AdminApplicationReviewPage } from './pages/AdminApplicationReviewPage';
import { AlertIntelligenceCentrePage } from './pages/AlertIntelligenceCentrePage';
import { UnifiedObligationClockPage } from './pages/UnifiedObligationClockPage';
import { AdminComplianceVerificationPage } from './pages/AdminComplianceVerificationPage';
import { AdminValidityRecordsPage } from './pages/AdminValidityRecordsPage';
import { IntelligenceCentrePage } from './pages/IntelligenceCentrePage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center text-xs text-[#A89580]">Verifying secure session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register-institution" element={<InstitutionRegisterPage />} />

          {/* Institution Portal */}
          <Route
            path="/institution/dashboard"
            element={
              <ProtectedRoute allowedRoles={['INSTITUTION_USER']}>
                <InstitutionDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/new-application"
            element={
              <ProtectedRoute allowedRoles={['INSTITUTION_USER']}>
                <NewApplicationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/applications"
            element={
              <ProtectedRoute allowedRoles={['INSTITUTION_USER']}>
                <MyApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/applications/:id"
            element={
              <ProtectedRoute allowedRoles={['INSTITUTION_USER']}>
                <ApplicationDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/notifications"
            element={
              <ProtectedRoute allowedRoles={['INSTITUTION_USER']}>
                <InstitutionNotificationCenterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/compliance"
            element={
              <ProtectedRoute allowedRoles={['INSTITUTION_USER']}>
                <InstitutionCompliancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/validity"
            element={
              <ProtectedRoute allowedRoles={['INSTITUTION_USER']}>
                <InstitutionValidityPage />
              </ProtectedRoute>
            }
          />

          {/* AICTE Admin Portal */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['AICTE_ADMIN', 'AICTE_OFFICER', 'EVC_COORDINATOR', 'AUDITOR']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute allowedRoles={['AICTE_ADMIN', 'AICTE_OFFICER', 'EVC_COORDINATOR', 'AUDITOR']}>
                <AdminApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications/:id"
            element={
              <ProtectedRoute allowedRoles={['AICTE_ADMIN', 'AICTE_OFFICER', 'EVC_COORDINATOR', 'AUDITOR']}>
                <AdminApplicationReviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/alerts"
            element={
              <ProtectedRoute allowedRoles={['AICTE_ADMIN', 'AICTE_OFFICER', 'EVC_COORDINATOR', 'AUDITOR']}>
                <AlertIntelligenceCentrePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/obligations"
            element={
              <ProtectedRoute allowedRoles={['AICTE_ADMIN', 'AICTE_OFFICER', 'EVC_COORDINATOR', 'AUDITOR']}>
                <UnifiedObligationClockPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/compliance"
            element={
              <ProtectedRoute allowedRoles={['AICTE_ADMIN', 'AICTE_OFFICER', 'EVC_COORDINATOR', 'AUDITOR']}>
                <AdminComplianceVerificationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/validity"
            element={
              <ProtectedRoute allowedRoles={['AICTE_ADMIN', 'AICTE_OFFICER', 'EVC_COORDINATOR', 'AUDITOR']}>
                <AdminValidityRecordsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/intelligence"
            element={
              <ProtectedRoute allowedRoles={['AICTE_ADMIN', 'AICTE_OFFICER']}>
                <IntelligenceCentrePage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
