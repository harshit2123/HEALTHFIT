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
import type { CSSProperties } from 'react'

const NAV_ITEMS = [
  { to: '/client', label: 'Home', end: true },
  { to: '/client/calories', label: 'Food' },
  { to: '/client/workouts', label: 'Workouts' },
  { to: '/client/goals', label: 'Goals' },
  { to: '/client/progress', label: 'Progress' },
  { to: '/client/profile', label: 'Me' },
]

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

  const initial = user?.name?.[0]?.toUpperCase() ?? 'U'

  return (
    <div style={shell}>
      {/* Desktop sidebar */}
      <aside className="desktop-sidebar" style={sidebar}>
        <div style={logoWrap}>
          <img src="/logo-icon.png" alt="Spacefit" style={logoImg} />
          <span style={logoText}><span style={{ color: '#fff' }}>SPACE</span><span style={{ color: 'var(--neon)' }}>FIT</span></span>
        </div>

        <SubscriptionBadge sub={sub} />

        <nav style={navWrap}>
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} to={item.to} end={item.end}>
              {item.label}
            </SidebarLink>
          ))}
        </nav>

        <div style={sidebarFooter}>
          <div style={userRow}>
            <div style={avatarSm}>{initial}</div>
            <div>
              <p style={userName}>{user?.name}</p>
              <p style={userRole}>
                {user?.accountType === 'B2C' ? 'Personal' : 'Member'}
              </p>
            </div>
          </div>
          <button onClick={logout} className="sf-btn-ghost" style={logoutBtn}>
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="mobile-topbar sf-glass" style={topbar}>
        <div style={{ ...logoWrap, marginBottom: 0 }}>
          <img src="/logo-icon.png" alt="Spacefit" style={logoImg} />
          <span style={logoText}><span style={{ color: '#fff' }}>SPACE</span><span style={{ color: 'var(--neon)' }}>FIT</span></span>
        </div>
        <Link to="/client/profile" style={avatarLink} aria-label="Profile">
          {initial}
        </Link>
      </header>

      {/* Main content */}
      <main className="client-main" style={main}>
        <Outlet />
      </main>

      <BottomNav />
      <FAB onClick={() => setQuickAddOpen(true)} />
      <QuickAddSheet open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />

      <style>{`
        .desktop-sidebar { display: none !important; }
        .mobile-topbar { display: flex !important; }
        @media (min-width: 1024px) {
          .desktop-sidebar { display: flex !important; }
          .mobile-topbar { display: none !important; }
          .client-main { margin-left: 240px !important; padding: 2rem !important; padding-bottom: 2rem !important; }
        }
      `}</style>
    </div>
  )
}

function SidebarLink({
  to,
  end,
  children,
}: {
  to: string
  end?: boolean
  children: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }): CSSProperties => ({
        display: 'flex',
        alignItems: 'center',
        padding: '0.55rem 1rem',
        borderRadius: 'var(--radius-sm)',
        textDecoration: 'none',
        fontFamily: 'var(--font-body)',
        fontSize: '0.875rem',
        fontWeight: isActive ? 600 : 400,
        color: isActive ? 'var(--neon)' : 'var(--text-secondary)',
        background: isActive ? 'var(--neon-dim)' : 'transparent',
        borderLeft: isActive ? '2px solid var(--neon)' : '2px solid transparent',
        transition: 'all 0.2s ease',
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
    return <div style={subSkeleton} />
  }

  const isExpiringSoon = sub.daysRemaining !== null && sub.daysRemaining <= 7

  if (sub.tier === 'PREMIUM') {
    return (
      <div style={subCard('var(--gold-dim)', 'var(--gold-border)')}>
        <span className="sf-badge sf-badge-gold">Premium</span>
        <p style={subDays}>{sub.daysRemaining} days left</p>
      </div>
    )
  }

  if (sub.tier === 'TRIAL') {
    return (
      <div style={subCard(
        isExpiringSoon ? 'rgba(245,158,11,0.08)' : 'var(--neon-dim)',
        isExpiringSoon ? 'rgba(245,158,11,0.25)' : 'var(--neon-border)'
      )}>
        <span className={`sf-badge ${isExpiringSoon ? 'sf-badge-danger' : 'sf-badge-neon'}`}>Trial</span>
        <p style={subDays}>{sub.daysRemaining} days left</p>
        <Link to="/client/upgrade" className="sf-btn-primary" style={upgradeBtn}>Upgrade</Link>
      </div>
    )
  }

  if (sub.type === 'B2B') {
    return (
      <div style={subCard('var(--neon-dim)', 'var(--neon-border)')}>
        <p style={subPlanName}>{sub.planName}</p>
        <p style={subDays}>{sub.daysRemaining} days left</p>
      </div>
    )
  }

  return (
    <div style={subCard('var(--bg-muted)', 'var(--neon-border)')}>
      <p style={subPlanName}>Free</p>
      <Link to="/client/upgrade" className="sf-btn-primary" style={upgradeBtn}>Upgrade</Link>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────

const shell: CSSProperties = {
  minHeight: '100svh',
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
}

const sidebar: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  bottom: 0,
  width: '240px',
  borderRight: '1px solid var(--neon-border)',
  padding: '1.5rem 1rem',
  background: 'var(--bg-secondary)',
  overflowY: 'auto',
  flexDirection: 'column',
  gap: '1.25rem',
  zIndex: 10,
}

const logoWrap: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '1.5rem',
}

const logoImg: CSSProperties = {
  width: '32px',
  height: '32px',
  flexShrink: 0,
}

const logoText: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 900,
  fontSize: '1.15rem',
  letterSpacing: '0.1em',
  fontStyle: 'italic',
  lineHeight: 1,
}

const navWrap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  marginTop: '0.5rem',
}

const sidebarFooter: CSSProperties = {
  marginTop: 'auto',
  paddingTop: '1.25rem',
  borderTop: '1px solid var(--neon-border)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
}

const userRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
}

const avatarSm: CSSProperties = {
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  background: 'var(--neon)',
  color: '#050505',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-display)',
  fontWeight: 800,
  fontSize: '0.875rem',
  flexShrink: 0,
}

const userName: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
}

const userRole: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  color: 'var(--text-muted)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const logoutBtn: CSSProperties = {
  fontSize: '0.75rem',
  padding: '0.4rem 0.875rem',
}

const topbar: CSSProperties = {
  position: 'sticky',
  top: 0,
  padding: '0.75rem 1rem',
  paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  zIndex: 20,
  borderBottom: '1px solid rgba(0,255,46,0.08)',
}

const avatarLink: CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  background: 'var(--bg-card)',
  border: '1.5px solid var(--neon-border)',
  color: 'var(--neon)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-display)',
  fontWeight: 800,
  fontSize: '1rem',
  textDecoration: 'none',
}

const main: CSSProperties = {
  padding: '1rem 1rem',
  paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
  minHeight: '100svh',
  maxWidth: '100%',
}

function subCard(bg: string, border: string): CSSProperties {
  return {
    padding: '0.75rem',
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  }
}

const subSkeleton: CSSProperties = {
  height: '64px',
  background: 'var(--bg-muted)',
  borderRadius: 'var(--radius-md)',
  animation: 'skeleton-pulse 1.5s ease-in-out infinite',
}

const subDays: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  color: 'var(--text-muted)',
  letterSpacing: '0.06em',
}

const subPlanName: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
}

const upgradeBtn: CSSProperties = {
  fontSize: '0.7rem',
  padding: '0.35rem 0.75rem',
  textDecoration: 'none',
  marginTop: '0.25rem',
  alignSelf: 'flex-start',
}
