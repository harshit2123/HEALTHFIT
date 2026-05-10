import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi, persistAuth } from '../lib/api'
import { getPortalPath } from '../lib/auth'

const inputStyle = {
  padding: '0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  width: '100%',
  boxSizing: 'border-box' as const,
  fontSize: '1rem',
}

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
      <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '480px', margin: '4rem auto' }}>
        <h1 style={{ margin: 0 }}>Join Spacefit</h1>
        <p style={{ color: '#6b7280', margin: '0.5rem 0 0' }}>How will you use Spacefit?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          <button
            onClick={() => setAccountType('B2C')}
            style={{
              padding: '1.5rem',
              border: '2px solid #10b981',
              borderRadius: '12px',
              cursor: 'pointer',
              textAlign: 'left',
              background: 'white',
            }}
          >
            <strong style={{ fontSize: '1rem' }}>I want to track my fitness</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
              30-day free trial · no card required
            </p>
          </button>
          <button
            onClick={() => setAccountType('B2B')}
            style={{
              padding: '1.5rem',
              border: '2px solid #6366f1',
              borderRadius: '12px',
              cursor: 'pointer',
              textAlign: 'left',
              background: 'white',
            }}
          >
            <strong style={{ fontSize: '1rem' }}>I manage a gym</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
              Manage members, send WhatsApp reminders, track revenue
            </p>
          </button>
        </div>
        <p style={{ marginTop: '2rem', fontSize: '0.875rem' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </main>
    )
  }

  return accountType === 'B2B' ? (
    <RegisterB2BForm onBack={() => setAccountType(null)} />
  ) : (
    <RegisterB2CFlow onBack={() => setAccountType(null)} />
  )
}

// =====================================================
// B2C — 4 micro-screens (goal → stats → account → done)
// =====================================================

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
    <main style={{ padding: '1.5rem', fontFamily: 'sans-serif', maxWidth: '480px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem' }}>
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              background: s <= step ? '#10b981' : '#e5e7eb',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      <button
        onClick={() => (step === 1 ? onBack() : setStep((step - 1) as 1 | 2 | 3))}
        disabled={step === 4}
        style={{
          background: 'none',
          border: 'none',
          color: '#6b7280',
          cursor: 'pointer',
          fontSize: '0.875rem',
          padding: 0,
          alignSelf: 'flex-start',
          marginBottom: '1.5rem',
        }}
      >
        ← Back
      </button>

      <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>
        Step {step} of 4
      </p>

      {step === 1 && (
        <>
          <h1 style={{ margin: '0.5rem 0 0' }}>What's your goal?</h1>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 1.5rem' }}>Pick what fits best — you can change later.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {GOAL_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  setGoal(opt.key)
                  setStep(2)
                }}
                style={{
                  padding: '1rem',
                  border: goal === opt.key ? '2px solid #10b981' : '2px solid #e5e7eb',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <span style={{ fontSize: '1.75rem' }}>{opt.emoji}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{opt.label}</p>
                  <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>{opt.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1 style={{ margin: '0.5rem 0 0' }}>Quick stats</h1>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 1.5rem' }}>
            Helps personalize. All optional.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Field label="Age">
              <input
                style={inputStyle}
                type="number"
                min={13}
                max={120}
                value={stats.age}
                onChange={(e) => setStats({ ...stats, age: e.target.value })}
              />
            </Field>
            <Field label="Height (cm)">
              <input
                style={inputStyle}
                type="number"
                min={50}
                max={300}
                value={stats.heightCm}
                onChange={(e) => setStats({ ...stats, heightCm: e.target.value })}
              />
            </Field>
            <Field label="Weight (kg)">
              <input
                style={inputStyle}
                type="number"
                step="0.1"
                min={20}
                max={500}
                value={stats.currentWeightKg}
                onChange={(e) => setStats({ ...stats, currentWeightKg: e.target.value })}
              />
            </Field>
          </div>
          <button
            onClick={() => setStep(3)}
            style={{
              marginTop: '1.5rem',
              padding: '0.875rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            Continue
          </button>
          <button
            onClick={() => setStep(3)}
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: 'transparent',
              color: '#6b7280',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Skip for now
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <h1 style={{ margin: '0.5rem 0 0' }}>Create account</h1>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 1.5rem' }}>30-day free trial starts now.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <input
              style={inputStyle}
              placeholder="Your name"
              value={account.name}
              onChange={(e) => setAccount({ ...account, name: e.target.value })}
              required
              minLength={2}
              autoFocus
            />
            <input
              style={inputStyle}
              type="email"
              placeholder="Email"
              value={account.email}
              onChange={(e) => setAccount({ ...account, email: e.target.value })}
              required
            />
            <input
              style={inputStyle}
              type="password"
              placeholder="Password (min 8 chars)"
              value={account.password}
              onChange={(e) => setAccount({ ...account, password: e.target.value })}
              required
              minLength={8}
            />
            <input
              style={inputStyle}
              type="tel"
              placeholder="Phone (optional)"
              value={account.phone}
              onChange={(e) => setAccount({ ...account, phone: e.target.value })}
            />
            {error && <p style={{ color: '#dc2626', margin: 0, fontSize: '0.875rem' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.875rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                marginTop: '0.5rem',
              }}
            >
              {loading ? 'Creating account…' : 'Start free trial'}
            </button>
          </form>
        </>
      )}

      {step === 4 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
          <h1 style={{ margin: 0 }}>You're in!</h1>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>Setting up your dashboard…</p>
        </div>
      )}
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>{label}</span>
      {children}
    </label>
  )
}

// =====================================================
// B2B — keep existing single-form flow (admin sign-up, info matters)
// =====================================================

function RegisterB2BForm({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    orgName: '',
    orgPhone: '',
    orgAddress: '',
  })
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
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '480px', margin: '4rem auto' }}>
      <button
        onClick={onBack}
        style={{ marginBottom: '1rem', cursor: 'pointer', background: 'none', border: 'none', color: '#6b7280' }}
      >
        ← Back
      </button>
      <h1 style={{ marginTop: '1rem' }}>Set up your gym</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        <h3 style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
          About you
        </h3>
        <input style={inputStyle} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} />
        <input style={inputStyle} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input style={inputStyle} type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
        <input style={inputStyle} type="tel" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

        <h3 style={{ margin: '1rem 0 0', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
          About your gym
        </h3>
        <input style={inputStyle} placeholder="Gym name" value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} required minLength={2} />
        <input style={inputStyle} type="tel" placeholder="Gym phone (optional)" value={form.orgPhone} onChange={(e) => setForm({ ...form, orgPhone: e.target.value })} />
        <input style={inputStyle} placeholder="Gym address (optional)" value={form.orgAddress} onChange={(e) => setForm({ ...form, orgAddress: e.target.value })} />

        {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.875rem',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginTop: '0.5rem',
          }}
        >
          {loading ? 'Creating…' : 'Create gym account'}
        </button>
      </form>
    </main>
  )
}
