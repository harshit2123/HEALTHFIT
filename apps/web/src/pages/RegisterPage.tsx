import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authApi, persistAuth } from '../lib/api'
import { getPortalPath } from '../lib/auth'

const inputStyle = { padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px' }
const formStyle = { display: 'flex', flexDirection: 'column' as const, gap: '1rem', marginTop: '1rem' }

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
        <h1>Join Spacefit</h1>
        <p>How will you use Spacefit?</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          <button
            onClick={() => setAccountType('B2B')}
            style={{ padding: '1.5rem', border: '2px solid #6366f1', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', background: 'white' }}
          >
            <strong>I manage a gym</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
              Manage members, send WhatsApp reminders, track revenue
            </p>
          </button>
          <button
            onClick={() => setAccountType('B2C')}
            style={{ padding: '1.5rem', border: '2px solid #10b981', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', background: 'white' }}
          >
            <strong>I want to track my fitness</strong>
            <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
              30-day free trial — no card required
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
    <RegisterB2CForm onBack={() => setAccountType(null)} />
  )
}

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
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '480px', margin: '4rem auto' }}>
      <button onClick={onBack} style={{ marginBottom: '1rem', cursor: 'pointer', background: 'none', border: 'none' }}>← Back</button>
      <h1>Set up your gym</h1>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h3 style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase' }}>About you</h3>
        <input style={inputStyle} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} />
        <input style={inputStyle} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input style={inputStyle} type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
        <input style={inputStyle} type="tel" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

        <h3 style={{ margin: '1rem 0 0', fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase' }}>About your gym</h3>
        <input style={inputStyle} placeholder="Gym name" value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} required minLength={2} />
        <input style={inputStyle} type="tel" placeholder="Gym phone (optional)" value={form.orgPhone} onChange={(e) => setForm({ ...form, orgPhone: e.target.value })} />
        <input style={inputStyle} placeholder="Gym address (optional)" value={form.orgAddress} onChange={(e) => setForm({ ...form, orgAddress: e.target.value })} />

        {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: '0.75rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          {loading ? 'Creating…' : 'Create gym account'}
        </button>
      </form>
    </main>
  )
}

function RegisterB2CForm({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', age: '', heightCm: '', currentWeightKg: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const payload = {
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone || undefined,
        age: form.age ? Number(form.age) : undefined,
        heightCm: form.heightCm ? Number(form.heightCm) : undefined,
        currentWeightKg: form.currentWeightKg ? Number(form.currentWeightKg) : undefined,
      }
      const result = await authApi.registerB2C(payload)
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
      <button onClick={onBack} style={{ marginBottom: '1rem', cursor: 'pointer', background: 'none', border: 'none' }}>← Back</button>
      <h1>Create your account</h1>
      <p style={{ color: '#10b981', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>30-day free trial · no card needed</p>
      <form onSubmit={handleSubmit} style={formStyle}>
        <input style={inputStyle} placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} />
        <input style={inputStyle} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input style={inputStyle} type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
        <input style={inputStyle} type="tel" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

        <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>Optional — helps us personalize your goals</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
          <input style={inputStyle} type="number" placeholder="Age" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} min={13} max={120} />
          <input style={inputStyle} type="number" placeholder="Height (cm)" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} min={50} max={300} />
          <input style={inputStyle} type="number" placeholder="Weight (kg)" value={form.currentWeightKg} onChange={(e) => setForm({ ...form, currentWeightKg: e.target.value })} min={20} max={500} step="0.1" />
        </div>

        {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: '0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          {loading ? 'Creating…' : 'Start free trial'}
        </button>
      </form>
    </main>
  )
}
