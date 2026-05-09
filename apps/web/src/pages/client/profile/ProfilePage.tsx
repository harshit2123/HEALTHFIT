import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientApi } from '../../../lib/clientApi'

const inputStyle = {
  padding: '0.625rem',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  width: '100%',
  boxSizing: 'border-box' as const,
}

export function ProfilePage() {
  const queryClient = useQueryClient()
  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: clientApi.getProfile,
  })

  const [form, setForm] = useState({
    name: '',
    phone: '',
    age: '',
    gender: '',
    heightCm: '',
    currentWeightKg: '',
    fitnessLevel: '' as '' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
  })

  // Hydrate form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        phone: profile.phone || '',
        age: profile.profile?.age?.toString() || '',
        gender: profile.profile?.gender || '',
        heightCm: profile.profile?.heightCm?.toString() || '',
        currentWeightKg: profile.profile?.currentWeightKg?.toString() || '',
        fitnessLevel: (profile.profile?.fitnessLevel as typeof form.fitnessLevel) || '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const mutation = useMutation({
    mutationFn: clientApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
    },
  })

  if (isLoading) return <p>Loading…</p>

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({
      name: form.name,
      phone: form.phone || undefined,
      age: form.age ? Number(form.age) : undefined,
      gender: form.gender || undefined,
      heightCm: form.heightCm ? Number(form.heightCm) : undefined,
      currentWeightKg: form.currentWeightKg ? Number(form.currentWeightKg) : undefined,
      fitnessLevel: form.fitnessLevel || undefined,
    })
  }

  return (
    <div style={{ maxWidth: '560px' }}>
      <h1 style={{ margin: 0 }}>Your profile</h1>
      <p style={{ color: '#6b7280' }}>{profile?.email}</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        <Field label="Name" required>
          <input
            style={inputStyle}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            minLength={2}
          />
        </Field>

        <Field label="Phone">
          <input
            style={inputStyle}
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Age">
            <input
              style={inputStyle}
              type="number"
              min={13}
              max={120}
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
          </Field>
          <Field label="Gender">
            <select
              style={inputStyle}
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="">—</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field label="Height (cm)">
            <input
              style={inputStyle}
              type="number"
              min={50}
              max={300}
              value={form.heightCm}
              onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
            />
          </Field>
          <Field label="Weight (kg)">
            <input
              style={inputStyle}
              type="number"
              step="0.1"
              min={20}
              max={500}
              value={form.currentWeightKg}
              onChange={(e) => setForm({ ...form, currentWeightKg: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Fitness level">
          <select
            style={inputStyle}
            value={form.fitnessLevel}
            onChange={(e) =>
              setForm({ ...form, fitnessLevel: e.target.value as typeof form.fitnessLevel })
            }
          >
            <option value="">—</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </Field>

        {mutation.isError && <p style={{ color: '#dc2626', margin: 0 }}>Failed to save profile</p>}
        {mutation.isSuccess && <p style={{ color: '#10b981', margin: 0 }}>Profile saved</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          style={{
            padding: '0.75rem',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
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
