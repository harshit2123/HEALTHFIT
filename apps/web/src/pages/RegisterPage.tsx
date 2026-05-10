import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { useAuthStore } from '../store/authStore'
import { authApi, persistAuth } from '../lib/api'
import { getPortalPath } from '../lib/auth'

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const e = err as { response?: { data?: { error?: string | object } } }
    const errorField = e.response?.data?.error
    if (typeof errorField === 'string') return errorField
    if (typeof errorField === 'object') return 'Validation failed — check your inputs'
  }
  return 'Registration failed'
}

export function RegisterPage() {
  const [accountType, setAccountType] = useState<'B2B' | 'B2C' | null>(null)

  if (!accountType) {
    return (
      <div style={pageWrap}>
        <main style={card} className="sf-animate-in">
          <div style={logoWrap}>
            <span style={logoText}>fit</span>
            <span style={logoDot} />
          </div>
          <h1 style={heading}>Join Spacefit</h1>
          <p style={sub}>How will you use Spacefit?</p>

          <div style={optionList}>
            <button onClick={() => setAccountType('B2C')} style={optionCard}>
              <span style={optionIcon}>🏋️</span>
              <div style={optionInfo}>
                <p style={optionTitle}>Track my fitness</p>
                <p style={optionSub}>30-day free trial · no card required</p>
              </div>
              <span style={optionArrow}>→</span>
            </button>
            <button onClick={() => setAccountType('B2B')} style={optionCard}>
              <span style={optionIcon}>🏢</span>
              <div style={optionInfo}>
                <p style={optionTitle}>I manage a gym</p>
                <p style={optionSub}>Members · WhatsApp reminders · revenue</p>
              </div>
              <span style={optionArrow}>→</span>
            </button>
          </div>

          <p style={footerText}>
            Already have an account?{' '}
            <Link to="/login" style={footerLink}>Sign in</Link>
          </p>
        </main>
      </div>
    )
  }

  return accountType === 'B2B' ? (
    <RegisterB2BForm onBack={() => setAccountType(null)} />
  ) : (
    <RegisterB2CFlow onBack={() => setAccountType(null)} />
  )
}

// ─── B2C flow ────────────────────────────────────────────────────────────────

type B2CGoal = 'LOSE_WEIGHT' | 'GAIN_MUSCLE' | 'BUILD_ENDURANCE' | 'JUST_TRACK'

const GOAL_OPTIONS: Array<{ key: B2CGoal; label: string; emoji: string; subtitle: string }> = [
  { key: 'LOSE_WEIGHT', label: 'Lose weight', emoji: '⚖️', subtitle: '500 kcal deficit target' },
  { key: 'GAIN_MUSCLE', label: 'Gain muscle', emoji: '💪', subtitle: 'Surplus + high protein' },
  { key: 'BUILD_ENDURANCE', label: 'Build endurance', emoji: '🏃', subtitle: 'Cardio-focused' },
  { key: 'JUST_TRACK', label: 'Just track', emoji: '📊', subtitle: 'No specific target' },
]

function RegisterB2CFlow({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [goal, setGoal] = useState<B2CGoal | null>(null)
  const [stats, setStats] = useState({ age: '', heightCm: '', currentWeightKg: '' })
  const [account, setAccount] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (redirectTimer.current) clearTimeout(redirectTimer.current) }
  }, [])

  async function submit() {
    setError(null)
    setLoading(true)
    try {
      const result = await authApi.registerB2C({
        email: account.email,
        password: account.password,
        name: account.name,
        phone: account.phone || undefined,
        age: stats.age ? Number(stats.age) : undefined,
        heightCm: stats.heightCm ? Number(stats.heightCm) : undefined,
        currentWeightKg: stats.currentWeightKg ? Number(stats.currentWeightKg) : undefined,
        primaryGoal: goal ?? undefined,
      })
      persistAuth(result)
      login(result.accessToken, result.user)
      setStep(4)
      redirectTimer.current = setTimeout(() => navigate(getPortalPath(result.user.role)), 1500)
    } catch (err) {
      setError(extractErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <div style={pageWrap}>
      <main style={{ ...card, maxWidth: '480px' }} className="sf-animate-in">
        {/* Logo */}
        <div style={logoWrap}>
          <span style={logoText}>fit</span>
          <span style={logoDot} />
        </div>

        {/* Progress dots */}
        {step < 4 && (
          <div style={progressBar}>
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: '3px',
                  borderRadius: '2px',
                  background: s <= step ? 'var(--neon)' : 'var(--bg-muted)',
                  transition: 'background 0.3s ease',
                }}
              />
            ))}
          </div>
        )}

        {step < 4 && (
          <button
            onClick={() => (step === 1 ? onBack() : setStep((step - 1) as 1 | 2 | 3))}
            style={backBtn}
          >
            ← Back
          </button>
        )}

        {step < 4 && (
          <p style={stepIndicator}>Step {step} of 3</p>
        )}

        {step === 1 && (
          <>
            <h1 style={heading}>What's your goal?</h1>
            <p style={sub}>Pick what fits best — you can change later.</p>
            <div style={optionList}>
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setGoal(opt.key); setStep(2) }}
                  style={{
                    ...optionCard,
                    borderColor: goal === opt.key ? 'var(--neon-border-md)' : 'var(--neon-border)',
                    background: goal === opt.key ? 'var(--neon-dim)' : 'var(--bg-muted)',
                  }}
                >
                  <span style={optionIcon}>{opt.emoji}</span>
                  <div style={optionInfo}>
                    <p style={optionTitle}>{opt.label}</p>
                    <p style={optionSub}>{opt.subtitle}</p>
                  </div>
                  <span style={optionArrow}>→</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={heading}>Quick stats</h1>
            <p style={sub}>Helps personalise. All optional.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <FormField label="Age">
                <input style={inputStyle} type="number" min={13} max={120} value={stats.age} onChange={(e) => setStats({ ...stats, age: e.target.value })} />
              </FormField>
              <FormField label="Height (cm)">
                <input style={inputStyle} type="number" min={50} max={300} value={stats.heightCm} onChange={(e) => setStats({ ...stats, heightCm: e.target.value })} />
              </FormField>
              <FormField label="Weight (kg)">
                <input style={inputStyle} type="number" step="0.1" min={20} max={500} value={stats.currentWeightKg} onChange={(e) => setStats({ ...stats, currentWeightKg: e.target.value })} />
              </FormField>
            </div>
            <button onClick={() => setStep(3)} className="sf-btn-primary" style={wideBtn}>Continue</button>
            <button onClick={() => setStep(3)} style={skipBtn}>Skip for now</button>
          </>
        )}

        {step === 3 && (
          <>
            <h1 style={heading}>Create account</h1>
            <p style={sub}>30-day free trial starts now.</p>
            <form onSubmit={(e) => { e.preventDefault(); submit() }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <FormField label="Your name">
                <input style={inputStyle} placeholder="Name" value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} required minLength={2} autoFocus />
              </FormField>
              <FormField label="Email">
                <input style={inputStyle} type="email" placeholder="you@example.com" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} required />
              </FormField>
              <FormField label="Password">
                <input style={inputStyle} type="password" placeholder="Min 8 characters" value={account.password} onChange={(e) => setAccount({ ...account, password: e.target.value })} required minLength={8} />
              </FormField>
              <FormField label="Phone (optional)">
                <input style={inputStyle} type="tel" placeholder="+91..." value={account.phone} onChange={(e) => setAccount({ ...account, phone: e.target.value })} />
              </FormField>
              {error && <p style={errorText}>{error}</p>}
              <button type="submit" disabled={loading} className="sf-btn-primary" style={wideBtn}>
                {loading ? 'Creating account…' : 'Start free trial'}
              </button>
            </form>
          </>
        )}

        {step === 4 && (
          <div style={successWrap}>
            <div style={successIcon}>✓</div>
            <h1 style={{ ...heading, textAlign: 'center' }}>You're in!</h1>
            <p style={{ ...sub, textAlign: 'center' }}>Setting up your dashboard…</p>
          </div>
        )}
      </main>
    </div>
  )
}

// ─── B2B form ────────────────────────────────────────────────────────────────

function RegisterB2BForm({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', orgName: '', orgPhone: '', orgAddress: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await authApi.registerB2B(form)
      persistAuth(result)
      login(result.accessToken, result.user)
      navigate(getPortalPath(result.user.role))
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={pageWrap}>
      <main style={{ ...card, maxWidth: '480px' }} className="sf-animate-in">
        <div style={logoWrap}>
          <span style={logoText}>fit</span>
          <span style={logoDot} />
        </div>
        <button onClick={onBack} style={backBtn}>← Back</button>
        <h1 style={heading}>Set up your gym</h1>
        <p style={sub}>Create your admin account + gym profile.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
          <p style={formSection}>About you</p>
          <FormField label="Name">
            <input style={inputStyle} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} />
          </FormField>
          <FormField label="Email">
            <input style={inputStyle} type="email" placeholder="you@gym.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </FormField>
          <FormField label="Password">
            <input style={inputStyle} type="password" placeholder="Min 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
          </FormField>
          <FormField label="Phone (optional)">
            <input style={inputStyle} type="tel" placeholder="+91..." value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </FormField>

          <p style={formSection}>About your gym</p>
          <FormField label="Gym name">
            <input style={inputStyle} placeholder="e.g. Iron Temple" value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} required minLength={2} />
          </FormField>
          <FormField label="Gym phone (optional)">
            <input style={inputStyle} type="tel" placeholder="+91..." value={form.orgPhone} onChange={(e) => setForm({ ...form, orgPhone: e.target.value })} />
          </FormField>
          <FormField label="Gym address (optional)">
            <input style={inputStyle} placeholder="Address" value={form.orgAddress} onChange={(e) => setForm({ ...form, orgAddress: e.target.value })} />
          </FormField>

          {error && <p style={errorText}>{error}</p>}
          <button type="submit" disabled={loading} className="sf-btn-primary" style={wideBtn}>
            {loading ? 'Creating…' : 'Create gym account'}
          </button>
        </form>
      </main>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <span style={fieldLabelStyle}>{label}</span>
      {children}
    </label>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────

const pageWrap: CSSProperties = { minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1.5rem', background: 'var(--bg-primary)' }

const card: CSSProperties = { width: '100%', maxWidth: '400px', padding: '2rem 2rem 1.75rem', background: 'var(--bg-card)', border: '1px solid var(--neon-border)', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '0' }

const logoWrap: CSSProperties = { display: 'flex', alignItems: 'flex-end', gap: '3px', marginBottom: '1.5rem' }
const logoText: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }
const logoDot: CSSProperties = { width: '7px', height: '7px', borderRadius: '50%', background: 'var(--neon)', boxShadow: '0 0 10px var(--neon)', display: 'inline-block', marginBottom: '5px', flexShrink: 0 }

const heading: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }
const sub: CSSProperties = { fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 1.25rem' }

const progressBar: CSSProperties = { display: 'flex', gap: '0.25rem', marginBottom: '1.25rem' }
const stepIndicator: CSSProperties = { margin: '0 0 0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }

const backBtn: CSSProperties = { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.8rem', padding: '0', marginBottom: '0.75rem', alignSelf: 'flex-start' }

const optionList: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '0' }

const optionCard: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem', background: 'var(--bg-muted)', border: '1px solid var(--neon-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s ease, background 0.2s ease', width: '100%' }
const optionIcon: CSSProperties = { fontSize: '1.5rem', flexShrink: 0 }
const optionInfo: CSSProperties = { flex: 1 }
const optionTitle: CSSProperties = { margin: 0, fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }
const optionSub: CSSProperties = { margin: '0.125rem 0 0', fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--text-muted)' }
const optionArrow: CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--neon)', flexShrink: 0 }

const inputStyle: CSSProperties = { padding: '0.625rem 0.875rem', background: 'var(--bg-muted)', border: '1px solid var(--neon-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', outline: 'none', width: '100%', boxSizing: 'border-box', colorScheme: 'dark' }

const fieldLabelStyle: CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }

const errorText: CSSProperties = { margin: 0, fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--danger)' }

const wideBtn: CSSProperties = { width: '100%', marginTop: '0.25rem', padding: '0.75rem' }
const skipBtn: CSSProperties = { marginTop: '0.375rem', padding: '0.5rem', background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.8rem', textAlign: 'center' as const }

const formSection: CSSProperties = { margin: '0.5rem 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }

const successWrap: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.625rem', padding: '1.5rem 0' }
const successIcon: CSSProperties = { width: '56px', height: '56px', borderRadius: '50%', background: 'var(--neon)', color: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', boxShadow: '0 0 24px rgba(0,255,46,0.4)' }

const footerText: CSSProperties = { margin: '1.25rem 0 0', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--text-muted)' }
const footerLink: CSSProperties = { color: 'var(--neon)', textDecoration: 'none', fontWeight: 600 }
