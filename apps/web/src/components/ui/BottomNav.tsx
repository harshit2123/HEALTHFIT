import { NavLink } from 'react-router-dom'

interface NavItem {
  to: string
  label: string
  end?: boolean
  svgPath: string
}

const ITEMS: NavItem[] = [
  {
    to: '/client',
    label: 'Home',
    end: true,
    svgPath:
      'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  },
  {
    to: '/client/calories',
    label: 'Food',
    svgPath:
      'M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-8.17-15.03-8.17-15.03 0h15.03zM1.02 17h15v2h-15z',
  },
  {
    to: '/client/workouts',
    label: 'Train',
    svgPath:
      'M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z',
  },
  {
    to: '/client/progress',
    label: 'Progress',
    svgPath:
      'M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z',
  },
  {
    to: '/client/goals',
    label: 'Goals',
    svgPath:
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z',
  },
]

export function BottomNav() {
  return (
    <>
      <nav className="sf-bottom-nav sf-glass-strong">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `sf-nav-item${isActive ? ' sf-nav-item--active' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <span className="sf-nav-icon-wrap">
                  {isActive && <span className="sf-nav-active-glow" />}
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill={isActive ? 'var(--neon)' : 'var(--text-muted)'}
                    style={{
                      transition: 'fill 0.25s ease, filter 0.25s ease',
                      filter: isActive
                        ? 'drop-shadow(0 0 6px rgba(0,255,46,0.7))'
                        : 'none',
                      transform: isActive ? 'scale(1.12)' : 'scale(1)',
                      transitionProperty: 'fill, filter, transform',
                    }}
                  >
                    <path d={item.svgPath} />
                  </svg>
                </span>
                <span
                  className="sf-nav-label"
                  style={{
                    color: isActive ? 'var(--neon)' : 'var(--text-muted)',
                    fontWeight: isActive ? 700 : 400,
                    textShadow: isActive
                      ? '0 0 8px rgba(0,255,46,0.5)'
                      : 'none',
                  }}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <style>{`
        .sf-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: calc(64px + env(safe-area-inset-bottom, 0px));
          padding-bottom: env(safe-area-inset-bottom, 0px);
          border-top: 1px solid rgba(0,255,46,0.10);
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 50;
        }

        .sf-nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 8px 4px;
          text-decoration: none;
          min-height: 52px;
          justify-content: center;
          position: relative;
          transition: transform 0.2s var(--ease-spring);
        }
        .sf-nav-item:active { transform: scale(0.9); }

        .sf-nav-icon-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 28px;
        }

        .sf-nav-active-glow {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,255,46,0.18) 0%, transparent 70%);
          animation: fadeIn 0.3s ease;
        }

        .sf-nav-label {
          font-family: var(--font-mono);
          font-size: 0.55rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: color 0.25s ease, text-shadow 0.25s ease, font-weight 0.25s ease;
        }

        @media (min-width: 1024px) {
          .sf-bottom-nav { display: none !important; }
        }
      `}</style>
    </>
  )
}
