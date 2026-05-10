import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { goalApi, type Goal, type GoalType } from '../../../lib/clientApi'
import type { CSSProperties } from 'react'

const GOAL_LABELS: Record<GoalType, { label: string; icon: string; defaultUnit: string }> = {
  LOSE_WEIGHT:         { label: 'Lose Weight',         icon: '⚖️', defaultUnit: 'kg' },
  GAIN_MUSCLE:         { label: 'Gain Muscle',          icon: '💪', defaultUnit: 'kg' },
  BUILD_ENDURANCE:     { label: 'Endurance',            icon: '🏃', defaultUnit: 'minutes' },
  IMPROVE_FLEXIBILITY: { label: 'Flexibility',          icon: '🧘', defaultUnit: 'sessions' },
  CUSTOM:              { label: 'Custom Goal',          icon: '🎯', defaultUnit: 'count' },
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
    <div style={pageWrap}>
      <header style={pageHeader}>
        <div>
          <h1 style={heading}>Goals</h1>
          <p style={sub}>Set targets. Track progress automatically.</p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="sf-btn-primary" style={newGoalBtn}>
          + New goal
        </button>
      </header>

      {active && active.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <p style={sectionLabel}>Active</p>
          <div style={cardList}>
            {active.map((g) => <GoalCard key={g.id} goal={g} onUpdate={refresh} />)}
          </div>
        </section>
      )}

      {(!active || active.length === 0) && (
        <div style={emptyState}>
          <span style={emptyIcon}>◈</span>
          <p style={emptyText}>No active goals. Set your first target.</p>
        </div>
      )}

      {completed && completed.length > 0 && (
        <section>
          <p style={sectionLabel}>Completed</p>
          <div style={cardList}>
            {completed.map((g) => <GoalCard key={g.id} goal={g} onUpdate={refresh} />)}
          </div>
        </section>
      )}

      {createOpen && (
        <CreateGoalDialog
          onClose={() => setCreateOpen(false)}
          onSuccess={() => { setCreateOpen(false); refresh() }}
        />
      )}
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

  const pct = Math.min(Math.max(progress?.percentComplete ?? 0, 0), 100)
  const paceNeon = progress?.pace === 'ahead'
  const paceDanger = progress?.pace === 'behind'
  const barColor = paceNeon ? 'var(--neon)' : paceDanger ? 'var(--danger)' : 'rgba(255,255,255,0.5)'
  const paceLabel = paceNeon ? '↑ ahead' : paceDanger ? '↓ behind' : 'on track'

  return (
    <div style={cardWrap} className="sf-card">
      <div style={cardTop}>
        <div>
          <p style={goalName}>
            <span style={goalIcon}>{meta.icon}</span>
            {meta.label}
          </p>
          <p style={goalRange}>
            {Number(goal.startingValue)} → {Number(goal.targetValue)} {goal.targetUnit}
          </p>
        </div>
        {goal.status === 'COMPLETED' && (
          <span className="sf-badge-neon" style={{ fontSize: '0.6rem' }}>✓ Done</span>
        )}
      </div>

      {goal.status === 'ACTIVE' && progress && (
        <>
          <div style={progressRow}>
            <div className="sf-progress-track" style={{ flex: 1 }}>
              <div className="sf-progress-fill" style={{ width: `${pct}%`, background: barColor }} />
            </div>
            <span style={{ ...pctLabel, color: barColor }}>{Math.round(pct)}%</span>
          </div>

          <div style={statsRow}>
            <span style={statItem}>
              {progress.currentValue !== null ? `Now: ${progress.currentValue} ${goal.targetUnit}` : '—'}
            </span>
            <span style={statItem}>{progress.daysRemaining}d left</span>
            <span style={{ ...statItem, color: barColor, fontWeight: 700 }}>{paceLabel}</span>
          </div>

          {goal.reason && (
            <p style={reasonText}>"{goal.reason}"</p>
          )}

          <div style={actionRow}>
            <button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="sf-btn-primary"
              style={completeBtn}
            >
              Mark complete
            </button>
            <button
              onClick={() => { if (confirm('Abandon this goal?')) abandonMutation.mutate() }}
              className="sf-btn-ghost"
              style={abandonBtn}
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
      <div style={dialogWrap} onClick={(e) => e.stopPropagation()} className="sf-animate-in">
        <header style={dialogHeader}>
          <h2 style={dialogTitle}>New goal</h2>
          <button onClick={onClose} style={closeBtn}>×</button>
        </header>

        <form onSubmit={submit} style={formBody}>
          <Field label="Goal type">
            <div style={goalGrid}>
              {(Object.keys(GOAL_LABELS) as GoalType[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setGoalType(k)}
                  style={goalTypeBtn(goalType === k)}
                >
                  <span style={goalTypeBtnIcon}>{GOAL_LABELS[k].icon}</span>
                  <span>{GOAL_LABELS[k].label}</span>
                </button>
              ))}
            </div>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Field label={`Starting (${meta.defaultUnit})`}>
              <input
                type="number"
                step="0.1"
                value={startingValue}
                onChange={(e) => setStartingValue(e.target.value)}
                required
                style={inputStyle}
              />
            </Field>
            <Field label={`Target (${meta.defaultUnit})`}>
              <input
                type="number"
                step="0.1"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                required
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Timeline">
            <select value={weeks} onChange={(e) => setWeeks(e.target.value)} style={inputStyle}>
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
              placeholder="Wedding in March, feel better…"
              style={inputStyle}
            />
          </Field>

          {mutation.isError && (
            <p style={{ color: 'var(--danger)', margin: 0, fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}>
              Failed to create goal
            </p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="sf-btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
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
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <span style={fieldLabel}>{label}</span>
      {children}
    </label>
  )
}

// ─── styles ──────────────────────────────────────────────────────────────────

const pageWrap: CSSProperties = {
  maxWidth: '480px',
  margin: '0 auto',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
}

const pageHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
}

const heading: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontWeight: 900,
  fontSize: '2.2rem',
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
  color: 'var(--text-primary)',
}

const sub: CSSProperties = {
  margin: '2px 0 0',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}

const newGoalBtn: CSSProperties = { padding: '0.6rem 1.25rem', flexShrink: 0 }

const sectionLabel: CSSProperties = {
  margin: '0 0 0.625rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}

const cardList: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.75rem' }

const emptyState: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '3rem 1rem',
  textAlign: 'center',
}

const emptyIcon: CSSProperties = {
  fontSize: '2rem',
  color: 'var(--text-muted)',
  opacity: 0.4,
}

const emptyText: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  color: 'var(--text-muted)',
}

const cardWrap: CSSProperties = { padding: '1.25rem' }

const cardTop: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1rem',
}

const goalName: CSSProperties = {
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  fontSize: '1.1rem',
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
}

const goalIcon: CSSProperties = {
  color: 'var(--neon)',
  fontFamily: 'var(--font-mono)',
}

const goalRange: CSSProperties = {
  margin: '0.25rem 0 0',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.72rem',
  color: 'var(--text-muted)',
}

const progressRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginBottom: '0.5rem',
}

const pctLabel: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.75rem',
  fontWeight: 700,
  minWidth: '36px',
  textAlign: 'right',
}

const statsRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '0.5rem',
}

const statItem: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.62rem',
  color: 'var(--text-muted)',
}

const reasonText: CSSProperties = {
  margin: '0.625rem 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: '0.8rem',
  color: 'var(--text-secondary)',
  fontStyle: 'italic',
}

const actionRow: CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginTop: '1rem',
}

const completeBtn: CSSProperties = { padding: '0.5rem 1rem', fontSize: '0.8rem' }

const abandonBtn: CSSProperties = {
  padding: '0.5rem 1rem',
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
}

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
}

const dialogWrap: CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--neon-border)',
  borderRadius: 'var(--radius-xl)',
  width: '100%',
  maxWidth: '440px',
  maxHeight: '90vh',
  overflow: 'auto',
}

const dialogHeader: CSSProperties = {
  padding: '1.25rem 1.5rem',
  borderBottom: '1px solid var(--neon-border)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const dialogTitle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontWeight: 800,
  fontSize: '1.25rem',
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
}

const closeBtn: CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer',
  color: 'var(--text-muted)',
  lineHeight: 1,
  padding: '0.25rem',
}

const formBody: CSSProperties = {
  padding: '1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
}

const goalGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '0.5rem',
}

const goalTypeBtn = (active: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.625rem 0.75rem',
  background: active ? 'var(--neon-dim)' : 'var(--bg-muted)',
  border: active ? '1px solid var(--neon)' : '1px solid var(--neon-border)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: active ? 'var(--neon)' : 'var(--text-secondary)',
  textAlign: 'left',
  transition: 'all 0.15s',
})

const goalTypeBtnIcon: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  color: 'var(--neon)',
  opacity: 0.8,
}

const fieldLabel: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.62rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}

const inputStyle: CSSProperties = {
  padding: '0.625rem 0.875rem',
  background: 'var(--bg-muted)',
  border: '1px solid var(--neon-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  colorScheme: 'dark',
}
