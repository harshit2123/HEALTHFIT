import { useState } from 'react'
import { Routes, Route, NavLink, Navigate, Outlet, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { clientApi } from '../../lib/clientApi'
import { BottomNav } from '../../components/ui/BottomNav'
import { FAB } from '../../components/ui/FAB'
import { QuickAddSheet } from '../../components/ui/QuickAddSheet'
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
        <Route path="calories" element={<CaloriesPage />} />
        <Route path="workouts" element={<WorkoutsPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="progress" element={<AnalyticsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="upgrade" element={<UpgradePage />} />
        <Route path="*" element={<Navigate to="/client" replace />} />
      </Route>
    </Routes>
  )
}

function ClientLayout() {
  const { user, logout } = useAuthStore()
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  const { data: sub } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: clientApi.getSubscription,
  })

  return (
    <div className="client-shell" style={{ minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Desktop sidebar */}
      <aside
        className="desktop-sidebar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '240px',
          borderRight: '1px solid #e5e7eb',
          padding: '1.5rem 1rem',
          background: '#fafafa',
          overflowY: 'auto',
        }}
      >
        <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem' }}>Spacefit</h2>
        <SubscriptionBadge sub={sub} />
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '1.5rem' }}>
          <SidebarLink to="/client" end>Home</SidebarLink>
          <SidebarLink to="/client/calories">Food</SidebarLink>
          <SidebarLink to="/client/workouts">Workouts</SidebarLink>
          <SidebarLink to="/client/goals">Goals</SidebarLink>
          <SidebarLink to="/client/progress">Progress</SidebarLink>
          <SidebarLink to="/client/profile">Me</SidebarLink>
        </nav>
        <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>{user?.name}</p>
          <p style={{ margin: '0.25rem 0', fontSize: '0.75rem', color: '#9ca3af' }}>
            {user?.accountType === 'B2C' ? 'Personal' : 'Member'}
          </p>
          <button
            onClick={logout}
            style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', fontSize: '0.875rem', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header
        className="mobile-topbar"
        style={{
          position: 'sticky',
          top: 0,
          padding: '0.75rem 1rem',
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 20,
        }}
      >
        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Spacefit</h2>
        <Link
          to="/client/profile"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '999px',
            background: '#10b981',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          {user?.name?.[0]?.toUpperCase() ?? 'U'}
        </Link>
      </header>

      {/* Main content */}
      <main
        className="client-main"
        style={{
          padding: '1.25rem',
          paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0))',
        }}
      >
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* FAB */}
      <FAB onClick={() => setQuickAddOpen(true)} />

      {/* Quick add sheet */}
      <QuickAddSheet open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />

      <style>{`
        .desktop-sidebar { display: none; }
        .mobile-topbar { display: flex; }
        @media (min-width: 1024px) {
          .desktop-sidebar { display: block; }
          .mobile-topbar { display: none; }
          .client-main { margin-left: 240px; padding: 2rem; padding-bottom: 2rem; }
        }
      `}</style>
    </div>
  )
}

function SidebarLink({ to, end, children }: { to: string; end?: boolean; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        padding: '0.5rem 1rem',
        borderRadius: '6px',
        textDecoration: 'none',
        color: isActive ? '#10b981' : '#374151',
        background: isActive ? '#ecfdf5' : 'transparent',
        fontWeight: isActive ? 600 : 400,
        display: 'block',
        fontSize: '0.875rem',
      })}
    >
      {children}
    </NavLink>
  )
}

function SubscriptionBadge({
  sub,
}: {
  sub: Awaited<ReturnType<typeof clientApi.getSubscription>> | undefined
}) {
  if (!sub) {
    return (
      <div style={{ padding: '0.75rem', background: '#f3f4f6', borderRadius: '6px', fontSize: '0.75rem', color: '#6b7280' }}>
        Loading…
      </div>
    )
  }

  const isExpiringSoon = sub.daysRemaining !== null && sub.daysRemaining <= 7

  if (sub.type === 'B2B') {
    return (
      <div
        style={{
          padding: '0.75rem',
          background: isExpiringSoon ? '#fef3c7' : '#eef2ff',
          borderRadius: '6px',
          fontSize: '0.75rem',
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, color: isExpiringSoon ? '#92400e' : '#3730a3' }}>{sub.planName}</p>
        <p style={{ margin: '0.25rem 0 0', color: isExpiringSoon ? '#92400e' : '#6b7280' }}>
          {sub.daysRemaining} days remaining
        </p>
      </div>
    )
  }

  if (sub.tier === 'TRIAL') {
    return (
      <div
        style={{
          padding: '0.75rem',
          background: isExpiringSoon ? '#fef3c7' : '#ecfdf5',
          borderRadius: '6px',
          fontSize: '0.75rem',
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, color: isExpiringSoon ? '#92400e' : '#065f46' }}>Free Trial</p>
        <p style={{ margin: '0.25rem 0 0', color: isExpiringSoon ? '#92400e' : '#6b7280' }}>
          {sub.daysRemaining} days remaining
        </p>
        <Link
          to="/client/upgrade"
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: '0.5rem',
            padding: '0.4rem 0.75rem',
            fontSize: '0.75rem',
            background: '#10b981',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Upgrade
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
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: '0.5rem',
            padding: '0.4rem 0.75rem',
            fontSize: '0.75rem',
            background: '#10b981',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Upgrade
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

  return null
}
