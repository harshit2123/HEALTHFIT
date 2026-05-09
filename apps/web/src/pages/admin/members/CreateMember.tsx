import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { adminApi } from '../../../lib/adminApi'

const inputStyle = { padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%', boxSizing: 'border-box' as const }

export function CreateMember() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    name: '',
    phone: '',
    age: '',
    gender: '',
    heightCm: '',
    currentWeightKg: '',
    fitnessLevel: '' as '' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
  })
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [autoAssigned, setAutoAssigned] = useState(false)

  const mutation = useMutation({
    mutationFn: adminApi.createMember,
    onSuccess: (data) => {
      setAutoAssigned(!!data.autoAssignedToTrainer)
      if (data.tempPassword) {
        setTempPassword(data.tempPassword)
      } else {
        navigate('/admin/members')
      }
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({
      email: form.email,
      name: form.name,
      phone: form.phone || undefined,
      age: form.age ? Number(form.age) : undefined,
      gender: form.gender || undefined,
      heightCm: form.heightCm ? Number(form.heightCm) : undefined,
      currentWeightKg: form.currentWeightKg ? Number(form.currentWeightKg) : undefined,
      fitnessLevel: form.fitnessLevel || undefined,
    })
  }

  if (tempPassword) {
    return (
      <div style={{ maxWidth: '480px' }}>
        <h1>Member created</h1>
        {autoAssigned && (
          <p style={{ padding: '0.75rem', background: '#ecfdf5', borderRadius: '6px', fontSize: '0.875rem', color: '#065f46' }}>
            ✓ Auto-assigned to you. This counts toward your conversions.
          </p>
        )}
        <p>Share this temporary password with the member. They should change it on first login.</p>
        <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '6px', fontFamily: 'monospace', fontSize: '1.125rem', margin: '1rem 0' }}>
          {tempPassword}
        </div>
        <button onClick={() => navigate('/admin/members')} style={{ padding: '0.625rem 1rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Done
        </button>
      </div>
    )
  }

  const errorData = mutation.error && typeof mutation.error === 'object' && 'response' in mutation.error
    ? (mutation.error as { response?: { data?: { error?: string } } }).response?.data?.error
    : null

  return (
    <div style={{ maxWidth: '520px' }}>
      <Link to="/admin/members" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to members</Link>
      <h1 style={{ marginTop: '1rem' }}>Add new member</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        <Field label="Name" required>
          <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} />
        </Field>
        <Field label="Email" required>
          <input style={inputStyle} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <Field label="Phone">
          <input style={inputStyle} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Age">
            <input style={inputStyle} type="number" min={13} max={120} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          </Field>
          <Field label="Gender">
            <select style={inputStyle} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">—</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Height (cm)">
            <input style={inputStyle} type="number" min={50} max={300} value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value })} />
          </Field>
          <Field label="Weight (kg)">
            <input style={inputStyle} type="number" step="0.1" min={20} max={500} value={form.currentWeightKg} onChange={(e) => setForm({ ...form, currentWeightKg: e.target.value })} />
          </Field>
        </div>
        <Field label="Fitness level">
          <select style={inputStyle} value={form.fitnessLevel} onChange={(e) => setForm({ ...form, fitnessLevel: e.target.value as typeof form.fitnessLevel })}>
            <option value="">—</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </Field>

        {mutation.isError && (
          <p style={{ color: '#dc2626', margin: 0 }}>
            {typeof errorData === 'string' ? errorData : 'Failed to create member'}
          </p>
        )}

        <button
          type="submit"
          disabled={mutation.isPending}
          style={{ padding: '0.75rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
        >
          {mutation.isPending ? 'Creating…' : 'Create member'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
        {label}
        {required && <span style={{ color: '#dc2626' }}> *</span>}
      </span>
      {children}
    </label>
  )
}
