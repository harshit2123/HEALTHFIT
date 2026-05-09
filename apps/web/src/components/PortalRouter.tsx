import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getPortalPath } from '../lib/auth'

// Redirects authenticated users to their correct portal based on role
export function PortalRouter() {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={getPortalPath(user.role)} replace />
}
