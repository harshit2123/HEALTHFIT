import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'
import { analyticsApi, healthApi } from '../../../lib/clientApi'

export function AnalyticsPage() {
  const queryClient = useQueryClient()
  const [days, setDays] = useState(30)
  const [logWeightOpen, setLogWeightOpen] = useState(false)

  const { data: analytics } = useQuery({
    queryKey: ['analytics', days],
    queryFn: () => analyticsApi.get(days),
  })

  const { data: weightHistory } = useQuery({
    queryKey: ['weight-history', days],
    queryFn: () => healthApi.getWeightHistory(days),
  })

  const { data: latest } = useQuery({
    queryKey: ['latest-metric'],
    queryFn: healthApi.getLatest,
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] })
    queryClient.invalidateQueries({ queryKey: ['weight-history'] })
    queryClient.invalidateQueries({ queryKey: ['latest-metric'] })
    queryClient.invalidateQueries({ queryKey: ['goal-progress'] })
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Progress</h1>
        <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
          Trends + insights from your activity
        </p>
      </header>

      {/* Range tabs */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem' }}>
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            style={{
              padding: '0.4rem 0.75rem',
              background: days === d ? '#10b981' : 'white',
              color: days === d ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {d === 7 ? '7 days' : d === 30 ? '30 days' : '3 months'}
          </button>
        ))}
      </div>

      {/* Insights */}
      {analytics && analytics.insights.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={sectionHeading}>Insights</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {analytics.insights.map((insight, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '0.875rem',
                }}
              >
                {insight}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Weight + BMI */}
      <section style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
          <h2 style={sectionHeading}>Weight</h2>
          <button
            onClick={() => setLogWeightOpen(true)}
            style={{ padding: '0.3rem 0.625rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
          >
            + Log weight
          </button>
        </div>

        {latest && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Stat label="Current" value={latest.weightKg ? `${Number(latest.weightKg).toFixed(1)}` : '—'} unit="kg" />
            <Stat label="BMI" value={latest.bmi ? Number(latest.bmi).toFixed(1) : '—'} />
            <Stat label="Last logged" value={new Date(latest.metricDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
          </div>
        )}

        {weightHistory && weightHistory.length >= 2 ? (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0.75rem', height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                />
                <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip
                  contentStyle={{ fontSize: '0.75rem', borderRadius: '6px' }}
                  formatter={(v: number) => [`${v} kg`, 'Weight']}
                />
                <Line type="monotone" dataKey="weightKg" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem', fontSize: '0.875rem' }}>
            Log weight 2+ times to see chart.
          </p>
        )}
      </section>

      {/* Calorie trend */}
      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={sectionHeading}>Daily calories</h2>
        {analytics && analytics.activity.length > 0 ? (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '0.75rem', height: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.activity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9 }}
                  tickFormatter={(d) => new Date(d).getDate().toString()}
                  interval={Math.floor(analytics.activity.length / 10)}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ fontSize: '0.75rem', borderRadius: '6px' }}
                  formatter={(v: number) => [`${Math.round(v)} kcal`, 'Calories']}
                  labelFormatter={(d) => new Date(d).toLocaleDateString('en-IN')}
                />
                <Bar dataKey="calories" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem', fontSize: '0.875rem' }}>
            No data yet.
          </p>
        )}
      </section>

      {/* Workout heatmap */}
      <section>
        <h2 style={sectionHeading}>Workout heatmap (12 weeks)</h2>
        {analytics && analytics.heatmap.length > 0 ? (
          <Heatmap data={analytics.heatmap} />
        ) : (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem', fontSize: '0.875rem' }}>
            No workouts yet.
          </p>
        )}
      </section>

      {logWeightOpen && (
        <LogWeightDialog
          onClose={() => setLogWeightOpen(false)}
          onSuccess={() => {
            setLogWeightOpen(false)
            refresh()
          }}
        />
      )}
    </div>
  )
}

function Heatmap({ data }: { data: Array<{ date: string; count: number }> }) {
  // Group into weeks (7 columns × N rows)
  const weeks: Array<Array<{ date: string; count: number }>> = []
  let currentWeek: Array<{ date: string; count: number }> = []
  for (const day of data) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
        gap: '2px',
        padding: '0.75rem',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        overflow: 'auto',
      }}
    >
      {weeks.map((week, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {week.map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.count} workout${day.count === 1 ? '' : 's'}`}
              style={{
                width: '100%',
                aspectRatio: '1',
                background:
                  day.count === 0
                    ? '#f3f4f6'
                    : day.count === 1
                      ? '#a7f3d0'
                      : day.count === 2
                        ? '#34d399'
                        : '#10b981',
                borderRadius: '2px',
                minHeight: '12px',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div style={{ padding: '0.75rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: '0.625rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
      <p style={{ margin: '0.25rem 0 0', fontWeight: 700 }}>
        {value}
        {unit && <span style={{ fontSize: '0.625rem', color: '#9ca3af', fontWeight: 400, marginLeft: '0.25rem' }}>{unit}</span>}
      </p>
    </div>
  )
}

function LogWeightDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [chest, setChest] = useState('')
  const [hips, setHips] = useState('')

  const mutation = useMutation({
    mutationFn: healthApi.log,
    onSuccess,
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({
      weightKg: weight ? Number(weight) : undefined,
      waistCm: waist ? Number(waist) : undefined,
      chestCm: chest ? Number(chest) : undefined,
      hipsCm: hips ? Number(hips) : undefined,
    })
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={dialog} onClick={(e) => e.stopPropagation()}>
        <header style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem' }}>Log weight + measurements</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>×</button>
        </header>
        <form onSubmit={submit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
            Weight (kg) *
            <input type="number" step="0.1" min={20} max={500} value={weight} onChange={(e) => setWeight(e.target.value)} required style={input} />
          </label>
          <p style={{ margin: 0, fontSize: '0.625rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Optional measurements</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem' }}>
              Waist (cm)
              <input type="number" step="0.5" value={waist} onChange={(e) => setWaist(e.target.value)} style={input} />
            </label>
            <label style={{ fontSize: '0.75rem' }}>
              Chest (cm)
              <input type="number" step="0.5" value={chest} onChange={(e) => setChest(e.target.value)} style={input} />
            </label>
            <label style={{ fontSize: '0.75rem' }}>
              Hips (cm)
              <input type="number" step="0.5" value={hips} onChange={(e) => setHips(e.target.value)} style={input} />
            </label>
          </div>
          {mutation.isError && <p style={{ color: '#dc2626', margin: 0, fontSize: '0.875rem' }}>Failed to log</p>}
          <button type="submit" disabled={mutation.isPending} style={{ padding: '0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  )
}

const sectionHeading = {
  margin: '0 0 0.625rem',
  fontSize: '0.75rem',
  textTransform: 'uppercase' as const,
  color: '#9ca3af',
  fontWeight: 600,
  letterSpacing: '0.04em',
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
}

const dialog: React.CSSProperties = {
  background: 'white',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '440px',
  maxHeight: '90vh',
  overflow: 'auto',
}

const input: React.CSSProperties = {
  padding: '0.5rem',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  width: '100%',
  boxSizing: 'border-box',
  fontSize: '0.875rem',
  marginTop: '0.25rem',
}
