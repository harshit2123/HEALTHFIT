import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CSSProperties } from 'react'
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

const RANGE_OPTIONS = [
  { days: 7, label: '7D' },
  { days: 30, label: '30D' },
  { days: 90, label: '3M' },
]

const CHART_TOOLTIP_STYLE = {
  background: '#111411',
  border: '1px solid rgba(0,255,46,0.2)',
  borderRadius: '8px',
  fontSize: '0.75rem',
  color: '#fff',
}

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

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['analytics'] })
    queryClient.invalidateQueries({ queryKey: ['weight-history'] })
    queryClient.invalidateQueries({ queryKey: ['latest-metric'] })
    queryClient.invalidateQueries({ queryKey: ['goal-progress'] })
  }

  return (
    <div style={page}>
      <header className="sf-animate-in">
        <h1 style={pageTitle}>Progress</h1>
        <p style={pageSub}>Trends + insights from your activity</p>
      </header>

      {/* Range tabs */}
      <div style={rangeTabs} className="sf-animate-in">
        {RANGE_OPTIONS.map(({ days: d, label }) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            style={rangeTab(days === d)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Insights */}
      {analytics && analytics.insights.length > 0 && (
        <section style={sectionWrap} className="sf-animate-in">
          <p style={sectionLabel}>Insights</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {analytics.insights.map((insight, idx) => (
              <div key={idx} style={insightCard}>{insight}</div>
            ))}
          </div>
        </section>
      )}

      {/* Weight */}
      <section style={sectionWrap} className="sf-animate-in">
        <div style={sectionHeaderRow}>
          <p style={sectionLabel}>Weight</p>
          <button onClick={() => setLogWeightOpen(true)} className="sf-btn-primary" style={logWeightBtn}>
            + Log weight
          </button>
        </div>

        {latest && (
          <div style={statsGrid}>
            <StatCard label="Current" value={latest.weightKg ? `${Number(latest.weightKg).toFixed(1)}` : '—'} unit="kg" />
            <StatCard label="BMI" value={latest.bmi ? Number(latest.bmi).toFixed(1) : '—'} />
            <StatCard label="Last logged" value={new Date(latest.metricDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
          </div>
        )}

        {weightHistory && weightHistory.length >= 2 ? (
          <div className="sf-card" style={chartCard}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c211c" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
                  stroke="rgba(255,255,255,0.15)"
                  tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
                  stroke="rgba(255,255,255,0.15)"
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(v: number) => [`${v} kg`, 'Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weightKg"
                  stroke="#00FF2E"
                  strokeWidth={2}
                  dot={{ fill: '#00FF2E', r: 3, strokeWidth: 0 }}
                  activeDot={{ fill: '#00FF2E', r: 5, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={emptyChart}>Log weight 2+ times to see chart</div>
        )}
      </section>

      {/* Calorie trend */}
      <section style={sectionWrap} className="sf-animate-in">
        <p style={sectionLabel}>Daily calories</p>
        {analytics && analytics.activity.length > 0 ? (
          <div className="sf-card" style={{ ...chartCard, height: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.activity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c211c" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9 }}
                  stroke="rgba(255,255,255,0.15)"
                  tickFormatter={(d) => new Date(d).getDate().toString()}
                  interval={Math.floor(analytics.activity.length / 10)}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
                  stroke="rgba(255,255,255,0.15)"
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(v: number) => [`${Math.round(v)} kcal`, 'Calories']}
                  labelFormatter={(d) => new Date(d).toLocaleDateString('en-IN')}
                />
                <Bar dataKey="calories" fill="#00FF2E" fillOpacity={0.8} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={emptyChart}>No calorie data yet</div>
        )}
      </section>

      {/* Heatmap */}
      <section style={sectionWrap} className="sf-animate-in">
        <p style={sectionLabel}>Workout heatmap (12 weeks)</p>
        {analytics && analytics.heatmap.length > 0 ? (
          <Heatmap data={analytics.heatmap} />
        ) : (
          <div style={emptyChart}>No workouts yet</div>
        )}
      </section>

      {logWeightOpen && (
        <LogWeightDialog
          onClose={() => setLogWeightOpen(false)}
          onSuccess={() => { setLogWeightOpen(false); refresh() }}
        />
      )}
    </div>
  )
}

function StatCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="sf-card" style={statCard}>
      <p className="sf-label">{label}</p>
      <p className="sf-stat" style={{ marginTop: '0.25rem', fontSize: '1.4rem' }}>
        {value}
        {unit && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '2px', fontFamily: 'var(--font-mono)' }}>{unit}</span>}
      </p>
    </div>
  )
}

function Heatmap({ data }: { data: Array<{ date: string; count: number }> }) {
  const weeks: Array<Array<{ date: string; count: number }>> = []
  let currentWeek: Array<{ date: string; count: number }> = []
  for (const day of data) {
    currentWeek.push(day)
    if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = [] }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek)

  function heatColor(count: number): string {
    if (count === 0) return 'var(--bg-muted)'
    if (count === 1) return 'rgba(0,255,46,0.3)'
    if (count === 2) return 'rgba(0,255,46,0.6)'
    return 'var(--neon)'
  }

  return (
    <div className="sf-card" style={heatmapWrap}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${weeks.length}, 1fr)`, gap: '2px' }}>
        {weeks.map((week, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} workout${day.count === 1 ? '' : 's'}`}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  background: heatColor(day.count),
                  borderRadius: '2px',
                  minHeight: '10px',
                  transition: 'background 0.2s ease',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function LogWeightDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [weight, setWeight] = useState('')
  const [waist, setWaist] = useState('')
  const [chest, setChest] = useState('')
  const [hips, setHips] = useState('')

  const mutation = useMutation({ mutationFn: healthApi.log, onSuccess })

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
      <div style={dialogBox} onClick={(e) => e.stopPropagation()}>
        <header style={dialogHeader}>
          <h2 style={dialogTitle}>Log weight + measurements</h2>
          <button onClick={onClose} style={closeBtn}>×</button>
        </header>
        <form onSubmit={submit} style={dialogForm}>
          <label style={formLabel}>
            <span style={formLabelText}>Weight (kg) *</span>
            <input type="number" step="0.1" min={20} max={500} value={weight} onChange={(e) => setWeight(e.target.value)} required style={formInput} />
          </label>
          <p style={optionalHeading}>Optional measurements</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <label style={formLabel}>
              <span style={formLabelText}>Waist cm</span>
              <input type="number" step="0.5" value={waist} onChange={(e) => setWaist(e.target.value)} style={formInput} />
            </label>
            <label style={formLabel}>
              <span style={formLabelText}>Chest cm</span>
              <input type="number" step="0.5" value={chest} onChange={(e) => setChest(e.target.value)} style={formInput} />
            </label>
            <label style={formLabel}>
              <span style={formLabelText}>Hips cm</span>
              <input type="number" step="0.5" value={hips} onChange={(e) => setHips(e.target.value)} style={formInput} />
            </label>
          </div>
          {mutation.isError && <p style={{ color: 'var(--danger)', margin: 0, fontSize: '0.875rem' }}>Failed to log</p>}
          <button type="submit" disabled={mutation.isPending} className="sf-btn-primary" style={{ width: '100%' }}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────

const page: CSSProperties = { maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }
const pageTitle: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.01em', color: 'var(--text-primary)', margin: 0 }
const pageSub: CSSProperties = { margin: '0.25rem 0 0', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--text-muted)' }
const rangeTabs: CSSProperties = { display: 'flex', gap: '0.375rem' }
const rangeTab = (active: boolean): CSSProperties => ({
  padding: '0.4rem 1rem',
  background: active ? 'var(--neon)' : 'var(--bg-card)',
  color: active ? '#050505' : 'var(--text-secondary)',
  border: `1px solid ${active ? 'var(--neon)' : 'var(--neon-border)'}`,
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.72rem',
  fontWeight: active ? 700 : 400,
  letterSpacing: '0.06em',
  transition: 'all 0.2s ease',
})
const sectionWrap: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.625rem' }
const sectionLabel: CSSProperties = { margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }
const sectionHeaderRow: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const logWeightBtn: CSSProperties = { fontSize: '0.72rem', padding: '0.35rem 0.875rem' }
const statsGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }
const statCard: CSSProperties = { padding: '0.875rem', textAlign: 'center' }
const chartCard: CSSProperties = { padding: '0.875rem', height: '200px', background: 'transparent' }
const emptyChart: CSSProperties = { padding: '1.5rem', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--neon-border)', borderRadius: 'var(--radius-md)' }
const heatmapWrap: CSSProperties = { padding: '0.875rem', overflowX: 'auto' }
const insightCard: CSSProperties = { padding: '0.75rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--neon-border)', borderLeft: '3px solid var(--neon)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-secondary)' }

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }
const dialogBox: CSSProperties = { background: 'var(--bg-secondary)', border: '1px solid var(--neon-border)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflow: 'auto' }
const dialogHeader: CSSProperties = { padding: '1rem 1.25rem', borderBottom: '1px solid var(--neon-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }
const dialogTitle: CSSProperties = { margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)' }
const closeBtn: CSSProperties = { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }
const dialogForm: CSSProperties = { padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }
const formLabel: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.25rem' }
const formLabelText: CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }
const formInput: CSSProperties = { padding: '0.5rem 0.625rem', background: 'var(--bg-muted)', border: '1px solid var(--neon-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', outline: 'none', width: '100%', boxSizing: 'border-box', marginTop: '0.125rem', colorScheme: 'dark' }
const optionalHeading: CSSProperties = { margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }
