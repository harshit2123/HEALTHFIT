import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { adminApi } from '../../../lib/adminApi'

const inputStyle = { padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%', boxSizing: 'border-box' as const }

export function CreateTrainer() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', name: '', phone: '' })
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: adminApi.createTrainer,
    onSuccess: (data) => {
      if (data.tempPassword) setTempPassword(data.tempPassword)
      else navigate('/admin/trainers')
    },
  })

  if (tempPassword) {
    return (
      <div style={{ maxWidth: '480px' }}>
        <h1>Trainer added</h1>
        <p>Share this temporary password with the trainer. They should change it on first login.</p>
        <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '6px', fontFamily: 'monospace', fontSize: '1.125rem', margin: '1rem 0' }}>
          {tempPassword}
        </div>
        <button onClick={() => navigate('/admin/trainers')} style={{ padding: '0.625rem 1rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Done</button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '480px' }}>
      <Link to="/admin/trainers" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to trainers</Link>
      <h1 style={{ marginTop: '1rem' }}>Add trainer</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate({ email: form.email, name: form.name, phone: form.phone || undefined })
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}
      >
        <input style={inputStyle} placeholder="Trainer name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} />
        <input style={inputStyle} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input style={inputStyle} type="tel" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        {mutation.isError && <p style={{ color: '#dc2626', margin: 0 }}>Failed to create trainer</p>}
        <button type="submit" disabled={mutation.isPending} style={{ padding: '0.75rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
          {mutation.isPending ? 'Adding…' : 'Add trainer'}
        </button>
      </form>
    </div>
  )
}
