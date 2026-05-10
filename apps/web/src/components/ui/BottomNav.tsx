import { NavLink } from 'react-router-dom'

interface NavItem {
  to: string
  label: string
  icon: string
  end?: boolean
}

const ITEMS: NavItem[] = [
  { to: '/client', label: 'Home', icon: '🏠', end: true },
  { to: '/client/calories', label: 'Food', icon: '🍽️' },
  { to: '/client/workouts', label: 'Workouts', icon: '💪' },
  { to: '/client/profile', label: 'Me', icon: '👤' },
]

/**
 * Mobile bottom tab nav. NN/g 5-item rule.
 * Hidden on desktop (≥1024px) where sidebar takes over.
 */
export function BottomNav() {
  return (
    <>
      <nav
        className="bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'calc(56px + env(safe-area-inset-bottom, 0))',
          paddingBottom: 'env(safe-area-inset-bottom, 0)',
          background: 'white',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 30,
        }}
      >
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.125rem',
              padding: '0.5rem',
              textDecoration: 'none',
              color: isActive ? '#10b981' : '#6b7280',
              fontSize: '0.625rem',
              fontWeight: isActive ? 600 : 500,
              minHeight: '48px',
              justifyContent: 'center',
            })}
          >
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <style>{`
        @media (min-width: 1024px) {
          .bottom-nav { display: none !important; }
        }
      `}</style>
    </>
  )
}
