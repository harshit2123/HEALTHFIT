import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { PortalRouter } from './components/PortalRouter'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PwaInstallBanner } from './components/PwaInstallBanner'

// Pages (stubs — built out per phase)
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { UnauthorizedPage } from './pages/UnauthorizedPage'

// Portals
import { MasterAdminPortal } from './pages/master/MasterAdminPortal'
import { AdminPortal } from './pages/admin/AdminPortal'
import { ClientPortal } from './pages/client/ClientPortal'

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate)

  // Restore session from localStorage on app load
  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Auto-redirect to correct portal based on role */}
        <Route path="/portal" element={<PortalRouter />} />

        {/* Master Admin — SaaS operations dashboard */}
        <Route element={<ProtectedRoute allowedRoles={['MASTER_ADMIN']} />}>
          <Route path="/master/*" element={<MasterAdminPortal />} />
        </Route>

        {/* Admin Portal — Gym owner + Trainer */}
        <Route element={<ProtectedRoute allowedRoles={['ORG_OWNER', 'TRAINER']} />}>
          <Route path="/admin/*" element={<AdminPortal />} />
        </Route>

        {/* Client Portal — Org member + Individual user */}
        <Route element={<ProtectedRoute allowedRoles={['ORG_MEMBER', 'INDIVIDUAL_USER']} />}>
          <Route path="/client/*" element={<ClientPortal />} />
        </Route>
      </Routes>
      <PwaInstallBanner />
    </BrowserRouter>
  )
}
