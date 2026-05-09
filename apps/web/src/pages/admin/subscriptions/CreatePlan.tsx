import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../../lib/adminApi'

const inputStyle = { padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%', boxSizing: 'border-box' as const }

const PRESETS = [
  { name: 'Monthly Basic', durationDays: 30, priceInr: 1500 },
  { name: 'Quarterly', durationDays: 90, priceInr: 4000 },
  { name: 'Half-yearly', durationDays: 180, priceInr: 7000 },
  { name: 'Annual', durationDays: 365, priceInr: 12000 },
]

export function CreatePlan() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: '',
    description: '',
    priceInr: '',
    durationDays: '',
    memberCapacity: '',
  })

  const mutation = useMutation({
    mutationFn: adminApi.createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      navigate('/admin/subscriptions')
    },
  })

  function applyPreset(preset: typeof PRESETS[number]) {
    setForm({
      ...form,
      name: preset.name,
      durationDays: String(preset.durationDays),
      priceInr: String(preset.priceInr),
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({
      name: form.name,
      description: form.description || undefined,
      priceInr: Number(form.priceInr),
      durationDays: Number(form.durationDays),
      memberCapacity: form.memberCapacity ? Number(form.memberCapacity) : undefined,
    })
  }

  return (
    <div style={{ maxWidth: '560px' }}>
      <Link to="/admin/subscriptions" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.875rem' }}>
        ← Back to plans
      </Link>
      <h1 style={{ marginTop: '1rem' }}>Create subscription plan</h1>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => applyPreset(p)}
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '999px', cursor: 'pointer' }}
          >
            {p.name} · ₹{p.priceInr.toLocaleString('en-IN')}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        <Field label="Plan name" required>
          <input style={inputStyle} placeholder="e.g. Monthly Premium" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} />
        </Field>
        <Field label="Description">
          <input style={inputStyle} placeholder="What's included?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Price (INR)" required>
            <input style={inputStyle} type="number" min={0} step="100" placeholder="2500" value={form.priceInr} onChange={(e) => setForm({ ...form, priceInr: e.target.value })} required />
          </Field>
          <Field label="Duration (days)" required>
            <input style={inputStyle} type="number" min={1} placeholder="30" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} required />
          </Field>
        </div>
        <Field label="Member capacity (optional)">
          <input style={inputStyle} type="number" min={1} placeholder="Unlimited if blank" value={form.memberCapacity} onChange={(e) => setForm({ ...form, memberCapacity: e.target.value })} />
        </Field>

        {mutation.isError && <p style={{ color: '#dc2626', margin: 0 }}>Failed to create plan</p>}

        <button type="submit" disabled={mutation.isPending} style={{ padding: '0.75rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
          {mutation.isPending ? 'Creating…' : 'Create plan'}
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
