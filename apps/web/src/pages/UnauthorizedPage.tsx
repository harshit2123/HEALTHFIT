import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getPortalPath } from '../lib/auth'

export function UnauthorizedPage() {
  const { user, logout } = useAuthStore()

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center', marginTop: '4rem' }}>
      <h1>Access denied</h1>
      <p>You don't have permission to view this page.</p>
      {user && (
        <Link to={getPortalPath(user.role)}>Go to your dashboard</Link>
      )}
      {!user && (
        <Link to="/login">Login</Link>
      )}
      <br />
      <button onClick={logout} style={{ marginTop: '1rem', cursor: 'pointer' }}>Logout</button>
    </main>
  )
}
