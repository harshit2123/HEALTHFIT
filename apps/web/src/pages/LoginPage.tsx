import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { useAuthStore } from '../store/authStore'
import { authApi, persistAuth } from '../lib/api'
import { getPortalPath } from '../lib/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await authApi.login(email, password)
      persistAuth(result)
      login(result.accessToken, result.user)
      navigate(getPortalPath(result.user.role))
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Login failed')
          : 'Login failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={pageWrap}>
      <main style={card} className="sf-animate-in">
        {/* Logo */}
        <div style={logoWrap}>
          <img src="/logo-icon.png" alt="Spacefit" style={logoImg} />
          <span style={logoText}><span style={{ color: '#fff' }}>SPACE</span><span style={{ color: 'var(--neon)' }}>FIT</span></span>
        </div>

        <h1 style={heading}>Welcome back</h1>
        <p style={sub}>Sign in to continue</p>

        <form onSubmit={handleSubmit} style={form}>
          <label style={fieldWrap}>
            <span style={fieldLabel}>Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={input}
              autoComplete="email"
            />
          </label>

          <label style={fieldWrap}>
            <span style={fieldLabel}>Password</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={input}
              autoComplete="current-password"
            />
          </label>

          {error && <p style={errorText}>{error}</p>}

          <button type="submit" disabled={loading} className="sf-btn-primary" style={submitBtn}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={footerText}>
          New here?{' '}
          <Link to="/register" style={footerLink}>Create account</Link>
        </p>
      </main>
    </div>
  )
}

const pageWrap: CSSProperties = {
  minHeight: '100svh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem',
  background: 'var(--bg-primary)',
  position: 'relative',
}

const card: CSSProperties = {
  width: '100%',
  maxWidth: '400px',
  padding: '2rem',
  background: 'var(--bg-card)',
  border: '1px solid var(--neon-border)',
  borderRadius: 'var(--radius-xl)',
  boxShadow: '0 0 60px rgba(0,255,46,0.04)',
}

const logoWrap: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '1.75rem',
}

const logoImg: CSSProperties = {
  width: '40px',
  height: '40px',
}

const logoText: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 900,
  fontSize: '1.4rem',
  letterSpacing: '0.1em',
  fontStyle: 'italic',
  lineHeight: 1,
}

const heading: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 900,
  fontSize: '1.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--text-primary)',
  margin: 0,
}

const sub: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  margin: '0.25rem 0 1.5rem',
}

const form: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
}

const fieldWrap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.375rem',
}

const fieldLabel: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.62rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}

const input: CSSProperties = {
  padding: '0.625rem 0.875rem',
  background: 'var(--bg-muted)',
  border: '1px solid var(--neon-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  colorScheme: 'dark',
}

const errorText: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: '0.8rem',
  color: 'var(--danger)',
}

const submitBtn: CSSProperties = {
  width: '100%',
  marginTop: '0.25rem',
  padding: '0.75rem',
}

const footerText: CSSProperties = {
  margin: '1.25rem 0 0',
  textAlign: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
}

const footerLink: CSSProperties = {
  color: 'var(--neon)',
  textDecoration: 'none',
  fontWeight: 600,
}
