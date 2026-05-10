import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { CSSProperties } from 'react'
import { workoutApi, type Workout } from '../../../lib/clientApi'
import { LogWorkoutDialog } from './LogWorkoutDialog'

export function WorkoutsPage() {
  const queryClient = useQueryClient()
  const [logOpen, setLogOpen] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  const { data: todayWorkouts } = useQuery({
    queryKey: ['workouts', 'day', today],
    queryFn: () => workoutApi.getDay(today),
  })
  const { data: history } = useQuery({
    queryKey: ['workouts', 'list'],
    queryFn: () => workoutApi.list(1, 10),
  })
  const { data: weekly } = useQuery({
    queryKey: ['workouts', 'weekly'],
    queryFn: workoutApi.weeklyStats,
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['workouts'] })
    queryClient.invalidateQueries({ queryKey: ['streak'] })
  }

  return (
    <div style={page}>

      {/* ── Header ── */}
      <header className="sf-animate-in">
        <h1 style={pageTitle}>Train</h1>
        <p style={pageSub}>Sets · Reps · PRs</p>
      </header>

      {/* ── Weekly stats ── */}
      <div style={statsGrid} className="sf-animate-in">
        <StatTile
          label="This Week"
          value={weekly?.count ?? 0}
          unit="sessions"
          color="var(--neon)"
          icon="📅"
        />
        <StatTile
          label="Minutes"
          value={weekly?.totalMinutes ?? 0}
          unit="min"
          color="var(--energy)"
          icon="⏱️"
        />
        <StatTile
          label="Calories"
          value={weekly?.totalCalories ?? 0}
          unit="kcal"
          color="var(--gold)"
          icon="🔥"
        />
      </div>

      {/* ── Log CTA ── */}
      <button
        onClick={() => setLogOpen(true)}
        className="sf-animate-in"
        style={logBtn}
      >
        <span style={logBtnIcon}>⚡</span>
        <span style={logBtnText}>Log Workout</span>
        <span style={logBtnArrow}>→</span>
      </button>

      {/* ── Today ── */}
      <section className="sf-animate-in">
        <p style={sectionLabel}>Today</p>
        {!todayWorkouts || todayWorkouts.length === 0 ? (
          <div style={emptyState}>
            <span style={{ fontSize: '2rem' }}>🏋️</span>
            <p style={emptyText}>No workout logged yet today</p>
            <p style={emptyHint}>Tap Log Workout to start</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {todayWorkouts.map((w, i) => (
              <WorkoutCard key={w.id} workout={w} animDelay={i * 60} />
            ))}
          </div>
        )}
      </section>

      {/* ── History ── */}
      <section className="sf-animate-in">
        <p style={sectionLabel}>Recent</p>
        {!history || history.workouts.length === 0 ? (
          <p style={emptyText}>No workouts yet. Log your first to get going.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {history.workouts.map((w, i) => (
              <WorkoutCard key={w.id} workout={w} animDelay={i * 50} />
            ))}
          </div>
        )}
      </section>

      {logOpen && (
        <LogWorkoutDialog
          onClose={() => setLogOpen(false)}
          onSuccess={() => { setLogOpen(false); refresh() }}
        />
      )}
    </div>
  )
}

function StatTile({ label, value, unit, color, icon }: {
  label: string; value: number; unit: string; color: string; icon: string
}) {
  return (
    <div className="sf-stat-tile">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '1rem' }}>{icon}</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.52rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>{label}</span>
      </div>
      <p style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 900,
        fontSize: '1.8rem',
        lineHeight: 1,
        letterSpacing: '0.02em',
        color,
        textShadow: `0 0 12px ${color}40`,
        animation: 'countUp 0.5s var(--ease-out) both',
      }}>
        {value}
      </p>
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.58rem',
        color: 'var(--text-muted)',
        letterSpacing: '0.06em',
        marginTop: '2px',
      }}>{unit}</p>
    </div>
  )
}

function WorkoutCard({ workout, animDelay }: { workout: Workout; animDelay?: number }) {
  const totalSets = workout.exercises.reduce((s, e) => s + e.sets.length, 0)
  const hasPR     = workout.exercises.some((e) => e.sets.some((s) => s.isPR))
  const date      = new Date(workout.loggedDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
  })

  return (
    <div
      className="sf-card sf-animate-in"
      style={{
        padding: '1rem',
        animationDelay: animDelay ? `${animDelay}ms` : '0ms',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
            <p style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '1.05rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
            }}>
              {workout.workoutType}
            </p>
            {hasPR && (
              <span className="sf-badge sf-badge-gold" style={{ fontSize: '0.55rem' }}>
                🏆 PR
              </span>
            )}
          </div>
          <p style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.04em',
          }}>
            {date} · {workout.durationMin} min · {totalSets} sets
          </p>
        </div>

        <div style={workoutMetaBadge}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--energy)' }}>
            {workout.durationMin}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            min
          </span>
        </div>
      </div>

      {/* Exercise chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
        {workout.exercises.slice(0, 5).map((e) => (
          <span
            key={e.id}
            style={{
              padding: '2px 8px',
              background: 'var(--bg-muted)',
              border: '1px solid var(--neon-border)',
              borderRadius: '100px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              color: 'var(--text-secondary)',
              letterSpacing: '0.04em',
            }}
          >
            {e.exerciseName}
          </span>
        ))}
        {workout.exercises.length > 5 && (
          <span style={{
            padding: '2px 8px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color: 'var(--text-muted)',
          }}>
            +{workout.exercises.length - 5} more
          </span>
        )}
      </div>
    </div>
  )
}

/* ── Styles ── */
const page: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  maxWidth: '480px',
  margin: '0 auto',
  width: '100%',
}
const pageTitle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 900,
  fontSize: '2.2rem',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--text-primary)',
}
const pageSub: CSSProperties = {
  margin: '2px 0 0',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}
const statsGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '0.5rem',
}
const logBtn: CSSProperties = {
  width: '100%',
  padding: '1rem 1.25rem',
  background: 'linear-gradient(135deg, rgba(0,255,46,0.12) 0%, rgba(0,255,46,0.04) 100%)',
  border: '1px solid var(--neon-border-md)',
  borderRadius: 'var(--radius-lg)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  transition: 'all 0.25s var(--ease-out)',
  boxShadow: 'none',
}
const logBtnIcon: CSSProperties = {
  fontSize: '1.4rem',
  lineHeight: 1,
}
const logBtnText: CSSProperties = {
  flex: 1,
  textAlign: 'left',
  fontFamily: 'var(--font-display)',
  fontWeight: 800,
  fontSize: '1.1rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--neon)',
}
const logBtnArrow: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '1rem',
  color: 'var(--neon)',
}
const sectionLabel: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: '0.5rem',
}
const emptyState: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '2rem 1rem',
  gap: '0.375rem',
  background: 'var(--bg-card)',
  border: '1px solid var(--neon-border)',
  borderRadius: 'var(--radius-lg)',
}
const emptyText: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  color: 'var(--text-secondary)',
}
const emptyHint: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.62rem',
  color: 'var(--text-muted)',
  letterSpacing: '0.06em',
}
const workoutMetaBadge: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '1px',
  flexShrink: 0,
}
