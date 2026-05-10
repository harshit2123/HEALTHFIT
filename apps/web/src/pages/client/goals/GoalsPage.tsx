import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { goalApi, type Goal, type GoalType } from '../../../lib/clientApi'

const GOAL_LABELS: Record<GoalType, { label: string; emoji: string; defaultUnit: string }> = {
  LOSE_WEIGHT: { label: 'Lose weight', emoji: '⚖️', defaultUnit: 'kg' },
  GAIN_MUSCLE: { label: 'Gain muscle', emoji: '💪', defaultUnit: 'kg' },
  BUILD_ENDURANCE: { label: 'Build endurance', emoji: '🏃', defaultUnit: 'minutes' },
  IMPROVE_FLEXIBILITY: { label: 'Improve flexibility', emoji: '🧘', defaultUnit: 'sessions' },
  CUSTOM: { label: 'Custom goal', emoji: '🎯', defaultUnit: 'count' },
}

export function GoalsPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)

  const { data: active } = useQuery({
    queryKey: ['goals', 'ACTIVE'],
    queryFn: () => goalApi.list('ACTIVE'),
  })

  const { data: completed } = useQuery({
    queryKey: ['goals', 'COMPLETED'],
    queryFn: () => goalApi.list('COMPLETED'),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['goals'] })

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Goals</h1>
        <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
          Set targets. Track progress automatically.
        </p>
      </header>

      <button
        onClick={() => setCreateOpen(true)}
        style={{
          width: '100%',
          padding: '0.875rem',
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
        + Set new goal
      </button>

      {active && active.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h2 style={sectionHeading}>Active</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {active.map((g) => (
              <GoalCard key={g.id} goal={g} onUpdate={refresh} />
            ))}
          </div>
        </section>
      )}

      {(!active || active.length === 0) && (
        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 1rem', fontSize: '0.875rem' }}>
          No active goals. Set your first.
        </p>
      )}

      {completed && completed.length > 0 && (
        <section>
          <h2 style={sectionHeading}>Completed</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {completed.map((g) => (
              <GoalCard key={g.id} goal={g} onUpdate={refresh} />
            ))}
          </div>
        </section>
      )}

      {createOpen && <CreateGoalDialog onClose={() => setCreateOpen(false)} onSuccess={() => { setCreateOpen(false); refresh() }} />}
    </div>
  )
}

function GoalCard({ goal, onUpdate }: { goal: Goal; onUpdate: () => void }) {
  const meta = GOAL_LABELS[goal.goalType]
  const { data: progress } = useQuery({
    queryKey: ['goal-progress', goal.id],
    queryFn: () => goalApi.getProgress(goal.id),
    enabled: goal.status === 'ACTIVE',
  })

  const completeMutation = useMutation({
    mutationFn: () => goalApi.update(goal.id, { status: 'COMPLETED' }),
    onSuccess: onUpdate,
  })

  const abandonMutation = useMutation({
    mutationFn: () => goalApi.update(goal.id, { status: 'ABANDONED' }),
    onSuccess: onUpdate,
  })

  const paceColor =
    progress?.pace === 'ahead' ? '#10b981' : progress?.pace === 'behind' ? '#dc2626' : '#6366f1'

  return (
    <div style={{ padding: '1rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
        <div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>
            {meta.emoji} {meta.label}
          </p>
          <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
            {Number(goal.startingValue)} → {Number(goal.targetValue)} {goal.targetUnit}
          </p>
        </div>
        {goal.status === 'COMPLETED' && (
          <span style={{ padding: '0.125rem 0.5rem', background: '#dcfce7', color: '#166534', borderRadius: '999px', fontSize: '0.625rem', fontWeight: 700 }}>
            ✓ Completed
          </span>
        )}
      </div>

      {goal.status === 'ACTIVE' && progress && (
        <>
          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <div style={{ flex: 1, height: '6px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progress.percentComplete}%`,
                  height: '100%',
                  background: paceColor,
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: paceColor, minWidth: '40px', textAlign: 'right' }}>
              {Math.round(progress.percentComplete)}%
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: '#9ca3af' }}>
            <span>
              {progress.currentValue !== null ? `Now: ${progress.currentValue} ${goal.targetUnit}` : '—'}
            </span>
            <span>{progress.daysRemaining} days left</span>
            <span style={{ color: paceColor, fontWeight: 600 }}>
              {progress.pace === 'ahead' ? '↑ ahead' : progress.pace === 'behind' ? '↓ behind' : 'on track'}
            </span>
          </div>

          {goal.reason && (
            <p style={{ margin: '0.625rem 0 0', fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
              "{goal.reason}"
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              style={{ padding: '0.4rem 0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              Mark complete
            </button>
            <button
              onClick={() => {
                if (confirm('Abandon this goal?')) abandonMutation.mutate()
              }}
              style={{ padding: '0.4rem 0.75rem', background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              Abandon
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function CreateGoalDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [goalType, setGoalType] = useState<GoalType>('LOSE_WEIGHT')
  const [targetValue, setTargetValue] = useState('')
  const [startingValue, setStartingValue] = useState('')
  const [weeks, setWeeks] = useState('12')
  const [reason, setReason] = useState('')

  const meta = GOAL_LABELS[goalType]

  const mutation = useMutation({
    mutationFn: goalApi.create,
    onSuccess,
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + Number(weeks) * 7)
    mutation.mutate({
      goalType,
      targetValue: Number(targetValue),
      startingValue: Number(startingValue),
      targetUnit: meta.defaultUnit,
      targetDate: targetDate.toISOString(),
      reason: reason || undefined,
    })
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={dialog} onClick={(e) => e.stopPropagation()}>
        <header style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem' }}>New goal</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>×</button>
        </header>

        <form onSubmit={submit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Goal type">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.375rem' }}>
              {(Object.keys(GOAL_LABELS) as GoalType[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setGoalType(k)}
                  style={{
                    padding: '0.625rem 0.5rem',
                    background: goalType === k ? '#ecfdf5' : 'white',
                    border: goalType === k ? '2px solid #10b981' : '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {GOAL_LABELS[k].emoji} {GOAL_LABELS[k].label}
                </button>
              ))}
            </div>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <Field label={`Starting (${meta.defaultUnit})`}>
              <input
                type="number"
                step="0.1"
                value={startingValue}
                onChange={(e) => setStartingValue(e.target.value)}
                required
                style={input}
              />
            </Field>
            <Field label={`Target (${meta.defaultUnit})`}>
              <input
                type="number"
                step="0.1"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                required
                style={input}
              />
            </Field>
          </div>

          <Field label="Timeline">
            <select value={weeks} onChange={(e) => setWeeks(e.target.value)} style={input}>
              <option value="4">4 weeks</option>
              <option value="8">8 weeks</option>
              <option value="12">12 weeks (3 months)</option>
              <option value="24">24 weeks (6 months)</option>
              <option value="52">1 year</option>
            </select>
          </Field>

          <Field label="Why (optional)">
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Wedding in March, feel better, etc."
              style={input}
            />
          </Field>

          {mutation.isError && <p style={{ color: '#dc2626', margin: 0, fontSize: '0.875rem' }}>Failed to create goal</p>}

          <button
            type="submit"
            disabled={mutation.isPending}
            style={{ padding: '0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            {mutation.isPending ? 'Creating…' : 'Set goal'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151' }}>{label}</span>
      {children}
    </label>
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
  padding: '0.625rem',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  width: '100%',
  boxSizing: 'border-box',
  fontSize: '0.875rem',
}
