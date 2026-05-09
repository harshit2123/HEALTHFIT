import { Routes, Route, NavLink, Navigate, Outlet, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { clientApi } from '../../lib/clientApi'
import { ClientDashboard } from './ClientDashboard'
import { WorkoutsPage } from './workouts/WorkoutsPage'
import { CaloriesPage } from './calories/CaloriesPage'
import { GoalsPage } from './goals/GoalsPage'
import { AnalyticsPage } from './analytics/AnalyticsPage'
import { ProfilePage } from './profile/ProfilePage'
import { UpgradePage } from './subscription/UpgradePage'

export function ClientPortal() {
  return (
    <Routes>
      <Route element={<ClientLayout />}>
        <Route index element={<ClientDashboard />} />
        <Route path="workouts" element={<WorkoutsPage />} />
        <Route path="calories" element={<CaloriesPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="upgrade" element={<UpgradePage />} />
        <Route path="*" element={<Navigate to="/client" replace />} />
      </Route>
    </Routes>
  )
}

function ClientLayout() {
  const { user, logout } = useAuthStore()
  const { data: sub } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: clientApi.getSubscription,
  })

  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    textDecoration: 'none',
    color: isActive ? '#10b981' : '#374151',
    background: isActive ? '#ecfdf5' : 'transparent',
    fontWeight: isActive ? 600 : 400,
    display: 'block',
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <aside style={{ borderRight: '1px solid #e5e7eb', padding: '1.5rem 1rem', background: '#fafafa' }}>
        <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem' }}>Spacefit</h2>

        <SubscriptionBadge sub={sub} />

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '1.5rem' }}>
          <NavLink to="/client" end style={linkStyle}>Dashboard</NavLink>
          <NavLink to="/client/workouts" style={linkStyle}>Workouts</NavLink>
          <NavLink to="/client/calories" style={linkStyle}>Calories</NavLink>
          <NavLink to="/client/goals" style={linkStyle}>Goals</NavLink>
          <NavLink to="/client/analytics" style={linkStyle}>Health analytics</NavLink>
          <NavLink to="/client/profile" style={linkStyle}>Profile</NavLink>
        </nav>

        <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>{user?.name}</p>
          <p style={{ margin: '0.25rem 0', fontSize: '0.75rem', color: '#9ca3af' }}>
            {user?.accountType === 'B2C' ? 'Personal' : 'Member'}
          </p>
          <button onClick={logout} style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', fontSize: '0.875rem', cursor: 'pointer' }}>Logout</button>
        </div>
      </aside>
      <main style={{ padding: '2rem', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}

function SubscriptionBadge({ sub }: { sub: ReturnType<typeof useQuery<Awaited<ReturnType<typeof clientApi.getSubscription>>>>['data'] | undefined }) {
  if (!sub) {
    return (
      <div style={{ padding: '0.75rem', background: '#f3f4f6', borderRadius: '6px', fontSize: '0.75rem', color: '#6b7280' }}>
        Loading subscription…
      </div>
    )
  }

  const isExpiringSoon = sub.daysRemaining !== null && sub.daysRemaining <= 7

  if (sub.type === 'B2B') {
    return (
      <div style={{ padding: '0.75rem', background: isExpiringSoon ? '#fef3c7' : '#eef2ff', borderRadius: '6px', fontSize: '0.75rem' }}>
        <p style={{ margin: 0, fontWeight: 600, color: isExpiringSoon ? '#92400e' : '#3730a3' }}>{sub.planName}</p>
        <p style={{ margin: '0.25rem 0 0', color: isExpiringSoon ? '#92400e' : '#6b7280' }}>
          {sub.daysRemaining} days remaining
        </p>
      </div>
    )
  }

  // B2C
  if (sub.tier === 'TRIAL') {
    return (
      <div style={{ padding: '0.75rem', background: isExpiringSoon ? '#fef3c7' : '#ecfdf5', borderRadius: '6px', fontSize: '0.75rem' }}>
        <p style={{ margin: 0, fontWeight: 600, color: isExpiringSoon ? '#92400e' : '#065f46' }}>Free Trial</p>
        <p style={{ margin: '0.25rem 0 0', color: isExpiringSoon ? '#92400e' : '#6b7280' }}>
          {sub.daysRemaining} days remaining
        </p>
        <Link
          to="/client/upgrade"
          style={{ display: 'block', textAlign: 'center', marginTop: '0.5rem', padding: '0.4rem 0.75rem', fontSize: '0.75rem', background: '#10b981', color: 'white', borderRadius: '4px', textDecoration: 'none', fontWeight: 600 }}
        >
          Upgrade to Premium
        </Link>
      </div>
    )
  }

  if (sub.tier === 'FREE') {
    return (
      <div style={{ padding: '0.75rem', background: '#f3f4f6', borderRadius: '6px', fontSize: '0.75rem' }}>
        <p style={{ margin: 0, fontWeight: 600 }}>Free</p>
        <p style={{ margin: '0.25rem 0 0', color: '#6b7280' }}>Limited features</p>
        <Link
          to="/client/upgrade"
          style={{ display: 'block', textAlign: 'center', marginTop: '0.5rem', padding: '0.4rem 0.75rem', fontSize: '0.75rem', background: '#10b981', color: 'white', borderRadius: '4px', textDecoration: 'none', fontWeight: 600 }}
        >
          Upgrade to Premium
        </Link>
      </div>
    )
  }

  if (sub.tier === 'PREMIUM') {
    return (
      <div style={{ padding: '0.75rem', background: '#fef3c7', borderRadius: '6px', fontSize: '0.75rem' }}>
        <p style={{ margin: 0, fontWeight: 600, color: '#92400e' }}>Premium</p>
        <p style={{ margin: '0.25rem 0 0', color: '#6b7280' }}>{sub.daysRemaining} days remaining</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '0.75rem', background: '#f3f4f6', borderRadius: '6px', fontSize: '0.75rem' }}>
      <p style={{ margin: 0, fontWeight: 600 }}>Free</p>
    </div>
  )
}
