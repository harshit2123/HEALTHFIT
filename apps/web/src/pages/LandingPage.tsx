import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'

const FEATURES = [
  { icon: '⚡', title: 'Smart Calorie Tracking', desc: 'Indian food database with AI-powered parsing' },
  { icon: '💪', title: 'Workout Logging', desc: 'Sets, reps, PRs — all in one tap' },
  { icon: '🎯', title: 'Goal Engine', desc: 'Auto progress tracking toward your targets' },
  { icon: '🥗', title: 'Diet Suggestions', desc: 'Macro gap analysis for Indian diets' },
]

export function LandingPage() {
  return (
    <div style={pageWrap}>

      {/* ── Nav ── */}
      <nav style={nav}>
        <div style={navLogo}>
          <img src="/logo-icon.png" alt="Spacefit" style={logoImg} />
          <span style={logoText}><span style={{ color: '#fff' }}>SPACE</span><span style={{ color: 'var(--neon)' }}>FIT</span></span>
        </div>
        <div style={navLinks}>
          <Link to="/login" style={navLink}>Log in</Link>
          <Link to="/register" className="sf-btn-primary" style={{ fontSize: '0.78rem', padding: '0.5rem 1.125rem' }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={heroSection} className="sf-animate-in">
        <div style={heroBg} />

        <div style={heroContent}>
          <div className="sf-badge sf-badge-neon" style={{ marginBottom: '0.5rem' }}>
            ⚡ Built for Indian athletes
          </div>

          <h1 style={heroHeading}>
            Train harder.<br />
            <span style={{ color: 'var(--neon)', textShadow: '0 0 30px rgba(0,255,46,0.35)' }}>
              Eat smarter.
            </span>
          </h1>

          <p style={heroSub}>
            The fitness tracker that actually understands dal, roti, and paneer.
            AI-powered nutrition logging meets serious workout tracking.
          </p>

          <div style={heroActions}>
            <Link to="/register" className="sf-btn-primary" style={heroCTA}>
              Start free →
            </Link>
            <Link to="/login" className="sf-btn-ghost" style={{ fontSize: '0.85rem' }}>
              Sign in
            </Link>
          </div>
        </div>

        {/* Floating stats */}
        <div style={heroStats}>
          {[
            { val: '2,450', unit: 'kcal today', color: 'var(--neon)' },
            { val: '🔥 12', unit: 'day streak', color: 'var(--energy)' },
            { val: '154g', unit: 'protein',     color: 'var(--gold)' },
          ].map((s, i) => (
            <div
              key={s.unit}
              style={{ ...statPill, animationDelay: `${i * 0.4}s` }}
            >
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: s.color }}>
                {s.val}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {s.unit}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={featuresSection}>
        <p style={featSectionLabel}>What you get</p>
        <div style={featGrid}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="sf-card sf-animate-in"
              style={{ ...featCard, animationDelay: `${i * 80}ms` }}
            >
              <span style={featIcon}>{f.icon}</span>
              <h3 style={featTitle}>{f.title}</h3>
              <p style={featDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA strip ── */}
      <section style={ctaStrip} className="sf-animate-in">
        <div style={ctaGlow} />
        <h2 style={ctaHeading}>Ready to level up?</h2>
        <p style={ctaSub}>Free to start. No credit card required.</p>
        <Link to="/register" className="sf-btn-primary" style={ctaBtn}>
          Create account →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer style={footer}>
        <div style={navLogo}>
          <img src="/logo-icon.png" alt="Spacefit" style={{ ...logoImg, width: '24px', height: '24px' }} />
          <span style={{ ...logoText, fontSize: '0.875rem' }}><span style={{ color: '#fff' }}>SPACE</span><span style={{ color: 'var(--neon)' }}>FIT</span></span>
        </div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
          © 2026
        </p>
      </footer>
    </div>
  )
}

/* ── Styles ── */
const pageWrap: CSSProperties = { minHeight: '100svh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }

const nav: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '1rem 1.25rem',
  borderBottom: '1px solid rgba(0,255,46,0.06)',
  position: 'sticky', top: 0,
  background: 'rgba(8,10,8,0.88)',
  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
  zIndex: 40,
}

const navLogo: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem' }

const logoImg: CSSProperties = {
  width: '32px', height: '32px',
}

const logoText: CSSProperties = {
  fontFamily: 'var(--font-display)', fontWeight: 900,
  fontSize: '1.1rem', letterSpacing: '0.1em', fontStyle: 'italic',
}

const navLinks: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.75rem' }

const navLink: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: '0.875rem',
  color: 'var(--text-secondary)', textDecoration: 'none',
}

const heroSection: CSSProperties = {
  position: 'relative', flex: 1,
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '3rem 1.25rem 2.5rem', overflow: 'hidden', textAlign: 'center',
}

const heroBg: CSSProperties = {
  position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)',
  width: '480px', height: '480px',
  background: 'radial-gradient(circle, rgba(0,255,46,0.07) 0%, transparent 65%)',
  pointerEvents: 'none', borderRadius: '50%',
}

const heroContent: CSSProperties = {
  position: 'relative', zIndex: 1,
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem',
  maxWidth: '500px',
}

const heroHeading: CSSProperties = {
  fontFamily: 'var(--font-display)', fontWeight: 900,
  fontSize: 'clamp(2.8rem, 10vw, 5rem)',
  lineHeight: 1.0, letterSpacing: '0.02em', textTransform: 'uppercase',
  color: 'var(--text-primary)',
}

const heroSub: CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: '0.975rem', lineHeight: 1.65,
  color: 'var(--text-secondary)', maxWidth: '400px',
}

const heroActions: CSSProperties = { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }

const heroCTA: CSSProperties = {
  fontSize: '0.9rem', padding: '0.875rem 2rem',
  boxShadow: '0 0 32px rgba(0,255,46,0.22)',
}

const heroStats: CSSProperties = {
  display: 'flex', gap: '0.625rem', marginTop: '2rem',
  flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 1,
}

const statPill: CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
  padding: '0.875rem 1.25rem',
  background: 'var(--bg-card)', border: '1px solid var(--neon-border)', borderRadius: 'var(--radius-lg)',
  animation: 'float 4s ease-in-out infinite',
}

const featuresSection: CSSProperties = {
  padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem',
}

const featSectionLabel: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.18em',
  textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center',
}

const featGrid: CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.625rem',
  maxWidth: '520px', margin: '0 auto', width: '100%',
}

const featCard: CSSProperties = { padding: '1.125rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }
const featIcon: CSSProperties = { fontSize: '1.4rem', lineHeight: 1, marginBottom: '0.125rem' }
const featTitle: CSSProperties = {
  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9rem',
  letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)',
}
const featDesc: CSSProperties = { fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }

const ctaStrip: CSSProperties = {
  position: 'relative', margin: '0 1.25rem 2rem', padding: '2rem',
  background: 'linear-gradient(135deg, rgba(0,255,46,0.08) 0%, rgba(0,255,46,0.02) 100%)',
  border: '1px solid var(--neon-border-md)', borderRadius: 'var(--radius-xl)',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
  textAlign: 'center', overflow: 'hidden',
}

const ctaGlow: CSSProperties = {
  position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)',
  width: '200px', height: '120px',
  background: 'radial-gradient(circle, rgba(0,255,46,0.12) 0%, transparent 70%)',
  pointerEvents: 'none',
}

const ctaHeading: CSSProperties = {
  fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2rem',
  letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)', position: 'relative',
}
const ctaSub: CSSProperties = { fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-muted)', position: 'relative' }
const ctaBtn: CSSProperties = { fontSize: '0.875rem', padding: '0.75rem 1.75rem', position: 'relative' }

const footer: CSSProperties = {
  padding: '1.25rem', borderTop: '1px solid rgba(0,255,46,0.06)',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
}
