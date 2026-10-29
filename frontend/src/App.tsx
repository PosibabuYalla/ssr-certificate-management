import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { AdminLayout } from './components/layout/AdminLayout'
import { Spinner } from './components/ui/spinner'

// Pages
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import CertificatesPage from './pages/admin/CertificatesPage'
import CreateCertificatePage from './pages/admin/CreateCertificatePage'
import StudentsPage from './pages/admin/StudentsPage'
import TemplatesPage from './pages/admin/TemplatesPage'
import CoursesPage from './pages/admin/CoursesPage'
import VerificationRecordsPage from './pages/admin/VerificationRecordsPage'
import SettingsPage from './pages/admin/SettingsPage'
import VerifyPage from './pages/public/VerifyPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!admin) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function RootRedirect() {
  const { admin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Spinner size="lg" />
      </div>
    )
  }

  return <Navigate to={admin ? '/admin/dashboard' : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify/:certificateId" element={<VerifyPage />} />

      {/* Admin (protected) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="certificates/new" element={<CreateCertificatePage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="verification-records" element={<VerificationRecordsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
