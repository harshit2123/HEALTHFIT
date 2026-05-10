import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Workouts</h1>
        <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
          Track sets, reps, and PRs
        </p>
      </header>

      {/* Weekly summary */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          marginBottom: '1.25rem',
        }}
      >
        <Stat label="This week" value={weekly?.count ?? 0} unit="workouts" />
        <Stat label="Minutes" value={weekly?.totalMinutes ?? 0} />
        <Stat label="Calories" value={weekly?.totalCalories ?? 0} unit="kcal" />
      </section>

      {/* CTA */}
      <button
        onClick={() => setLogOpen(true)}
        style={{
          width: '100%',
          padding: '1rem',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.875rem',
          marginBottom: '1.5rem',
        }}
      >
        + Log workout
      </button>

      {/* Today */}
      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={sectionHeading}>Today</h2>
        {!todayWorkouts || todayWorkouts.length === 0 ? (
          <p style={{ color: '#9ca3af', padding: '1rem 0', fontSize: '0.875rem' }}>
            No workout logged yet today.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {todayWorkouts.map((w) => (
              <WorkoutCard key={w.id} workout={w} />
            ))}
          </div>
        )}
      </section>

      {/* History */}
      <section>
        <h2 style={sectionHeading}>Recent</h2>
        {!history || history.workouts.length === 0 ? (
          <p style={{ color: '#9ca3af', padding: '1rem 0', fontSize: '0.875rem' }}>
            No workouts yet. Log your first to get going.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {history.workouts.map((w) => (
              <WorkoutCard key={w.id} workout={w} />
            ))}
          </div>
        )}
      </section>

      {logOpen && (
        <LogWorkoutDialog
          onClose={() => setLogOpen(false)}
          onSuccess={() => {
            setLogOpen(false)
            refresh()
          }}
        />
      )}
    </div>
  )
}

function Stat({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div
      style={{
        padding: '0.875rem',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.625rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ margin: '0.25rem 0 0', fontSize: '1.25rem', fontWeight: 700 }}>
        {value}
        {unit && <span style={{ fontSize: '0.625rem', color: '#9ca3af', fontWeight: 400, marginLeft: '0.25rem' }}>{unit}</span>}
      </p>
    </div>
  )
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const totalSets = workout.exercises.reduce((s, e) => s + e.sets.length, 0)
  const hasPR = workout.exercises.some((e) => e.sets.some((s) => s.isPR))
  const date = new Date(workout.loggedDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <div
      style={{
        padding: '0.875rem 1rem',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>
            {workout.workoutType}
            {hasPR && (
              <span
                style={{
                  marginLeft: '0.5rem',
                  padding: '0.125rem 0.4rem',
                  background: '#fef3c7',
                  color: '#92400e',
                  borderRadius: '999px',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                }}
              >
                🏆 PR
              </span>
            )}
          </p>
          <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
            {date} · {workout.durationMin} min · {totalSets} sets
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
        {workout.exercises.slice(0, 4).map((e) => (
          <span
            key={e.id}
            style={{
              padding: '0.125rem 0.5rem',
              background: '#f3f4f6',
              borderRadius: '999px',
              fontSize: '0.75rem',
            }}
          >
            {e.exerciseName}
          </span>
        ))}
        {workout.exercises.length > 4 && (
          <span style={{ padding: '0.125rem 0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
            +{workout.exercises.length - 4} more
          </span>
        )}
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
