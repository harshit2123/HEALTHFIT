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
          <span style={logoText}>fit</span>
          <span style={logoDot} />
        </div>

        <h1 style={heading}>Welcome back</h1>
        <p style={sub}>Sign in to your account</p>

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
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem',
  background: 'var(--bg-primary)',
}

const card: CSSProperties = {
  width: '100%',
  maxWidth: '400px',
  padding: '2rem 2rem 1.75rem',
  background: 'var(--bg-card)',
  border: '1px solid var(--neon-border)',
  borderRadius: 'var(--radius-xl)',
}

const logoWrap: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: '3px',
  marginBottom: '1.75rem',
}

const logoText: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 800,
  fontSize: '2rem',
  color: 'var(--text-primary)',
  letterSpacing: '-0.02em',
  lineHeight: 1,
}

const logoDot: CSSProperties = {
  width: '7px',
  height: '7px',
  borderRadius: '50%',
  background: 'var(--neon)',
  boxShadow: '0 0 10px var(--neon)',
  display: 'inline-block',
  marginBottom: '5px',
  flexShrink: 0,
}

const heading: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 800,
  fontSize: '1.6rem',
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
  margin: 0,
}

const sub: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.8rem',
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
