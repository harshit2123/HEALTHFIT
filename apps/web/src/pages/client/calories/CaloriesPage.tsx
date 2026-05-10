import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { CSSProperties } from 'react'
import { calorieApi, type MealType, type CalorieLog } from '../../../lib/clientApi'
import { LogMealDialog } from './LogMealDialog'
import { EditLogDialog } from './EditLogDialog'
import { DietSuggestionPanel } from '../../../components/ui/DietSuggestion'

const MEAL_ORDER: MealType[] = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']
const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Breakfast', LUNCH: 'Lunch', SNACKS: 'Snacks', DINNER: 'Dinner',
}
const MEAL_ICONS: Record<MealType, string> = {
  BREAKFAST: '🌅', LUNCH: '☀️', SNACKS: '🍎', DINNER: '🌙',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (dateStr === today.toISOString().slice(0, 10)) return 'Today'
  if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function CaloriesPage() {
  const queryClient = useQueryClient()
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [logDialog, setLogDialog] = useState<MealType | null>(null)
  const [editLog, setEditLog] = useState<CalorieLog | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const logFoodId = searchParams.get('logFoodId')
    if (logFoodId) {
      setLogDialog('SNACKS')
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setLogDialog, setSearchParams])

  const { data: daily, isLoading } = useQuery({
    queryKey: ['calories', date],
    queryFn: () => calorieApi.getDaily(date),
  })
  const { data: targetData } = useQuery({
    queryKey: ['calorie-target'],
    queryFn: calorieApi.getDailyTarget,
  })
  const { data: dietSuggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['diet-suggestions'],
    queryFn: calorieApi.getDietSuggestions,
  })

  const target = targetData?.dailyCalorieTarget
  const consumed = daily?.summary.calories ?? 0
  const remaining = target ? target - consumed : null
  const percent = target ? Math.min(100, (consumed / target) * 100) : 0
  const isToday = date === new Date().toISOString().slice(0, 10)
  const isOver = remaining !== null && remaining < 0

  function handleDateShift(days: number) {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    setDate(d.toISOString().slice(0, 10))
  }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['calories', date] })
  }

  const barColor = percent > 100
    ? 'linear-gradient(90deg, var(--danger), #ff6644)'
    : percent > 80
      ? 'linear-gradient(90deg, #d97706, var(--warning))'
      : 'linear-gradient(90deg, var(--neon-dark), var(--neon))'

  return (
    <div style={page}>

      {/* ── Header ── */}
      <header style={pageHeader} className="sf-animate-in">
        <div>
          <h1 style={pageTitle}>Nutrition</h1>
          <p style={pageSub}>Indian diet optimised tracking</p>
        </div>
      </header>

      {/* ── Date nav ── */}
      <div style={dateNav} className="sf-animate-in">
        <button onClick={() => handleDateShift(-1)} style={navArrowBtn} aria-label="Previous day">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/>
          </svg>
        </button>
        <div style={dateDisplay}>
          <span style={dateLabelText}>{formatDate(date)}</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            style={hiddenDateInput}
            aria-label="Select date"
          />
        </div>
        {!isToday ? (
          <button onClick={() => handleDateShift(1)} style={navArrowBtn} aria-label="Next day">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
            </svg>
          </button>
        ) : (
          <div style={{ width: '36px' }} />
        )}
        {!isToday && (
          <button
            onClick={() => setDate(new Date().toISOString().slice(0, 10))}
            className="sf-badge sf-badge-neon"
            style={{ cursor: 'pointer', border: 'none', background: 'var(--neon-dim)' }}
          >
            Today
          </button>
        )}
      </div>

      {/* ── Summary card ── */}
      <section className="sf-card sf-animate-in" style={summaryCard}>
        {/* Big number */}
        <div style={summaryTop}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '3.2rem',
                lineHeight: 1,
                letterSpacing: '0.02em',
                color: isOver ? 'var(--danger)' : 'var(--neon)',
                textShadow: isOver
                  ? '0 0 20px rgba(255,68,68,0.4)'
                  : '0 0 20px rgba(0,255,46,0.3)',
                animation: 'countUp 0.5s var(--ease-out) both',
              }}>
                {Math.round(consumed)}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}>
                {target ? `/ ${target} kcal` : 'kcal'}
              </span>
            </div>
            {remaining !== null && (
              <p style={{
                margin: '4px 0 0',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                letterSpacing: '0.04em',
                color: isOver ? 'var(--danger)' : 'var(--neon)',
              }}>
                {isOver
                  ? `${Math.abs(Math.round(remaining))} kcal over`
                  : `${Math.round(remaining)} kcal remaining`}
              </p>
            )}
            {!target && (
              <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Set profile to unlock target
              </p>
            )}
          </div>

          {/* Percent circle */}
          {target && (
            <div style={percentCircle(isOver, percent)}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem', color: isOver ? 'var(--danger)' : 'var(--neon)' }}>
                {Math.round(percent)}%
              </span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {target && (
          <div className="sf-progress-track" style={{ marginTop: '1rem' }}>
            <div style={{
              width: `${Math.min(percent, 100)}%`,
              height: '100%',
              borderRadius: '100px',
              background: barColor,
              boxShadow: percent > 100
                ? '0 0 8px rgba(255,68,68,0.5)'
                : '0 0 8px rgba(0,255,46,0.4)',
              transition: 'width 0.8s var(--ease-out)',
              animation: 'progressFill 0.8s var(--ease-out)',
            }} />
          </div>
        )}

        {/* Macro grid */}
        <div style={macroGrid}>
          {[
            { label: 'Protein', value: daily?.summary.proteinG ?? 0, color: 'var(--neon)' },
            { label: 'Carbs',   value: daily?.summary.carbsG ?? 0,   color: 'var(--text-primary)' },
            { label: 'Fat',     value: daily?.summary.fatG ?? 0,     color: 'var(--energy)' },
            { label: 'Fiber',   value: daily?.summary.fiberG ?? 0,   color: 'var(--gold)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={macroCell}>
              <p style={macroLabel}>{label}</p>
              <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', lineHeight: 1, color, letterSpacing: '0.02em' }}>
                {Math.round(value)}<span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 400 }}>g</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Meal sections ── */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="sf-skeleton" style={{ height: '72px' }} />
          ))}
        </div>
      ) : (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {MEAL_ORDER.map((meal, idx) => {
            const mealLogs = daily?.logs.filter((l) => l.mealType === meal) ?? []
            const mealCalories = daily?.summary.byMeal[meal]?.calories ?? 0
            return (
              <MealSection
                key={meal}
                meal={meal}
                logs={mealLogs}
                mealCalories={mealCalories}
                animDelay={idx * 60}
                onAdd={() => setLogDialog(meal)}
                onEdit={(log) => setEditLog(log)}
                onDelete={(log) => {
                  if (confirm('Delete this entry?')) {
                    calorieApi.deleteLog(log.id)
                      .then(() => refresh())
                      .catch(() => alert('Failed to delete.'))
                  }
                }}
              />
            )
          })}
        </section>
      )}

      {/* ── Diet suggestions ── */}
      <section style={{ marginTop: '0.25rem' }} className="sf-animate-in">
        <DietSuggestionPanel gaps={dietSuggestions ?? []} isLoading={suggestionsLoading} />
      </section>

      {logDialog && (
        <LogMealDialog
          mealType={logDialog}
          loggedDate={date}
          onClose={() => setLogDialog(null)}
          onSuccess={() => { setLogDialog(null); refresh() }}
        />
      )}
      {editLog && (
        <EditLogDialog
          log={editLog}
          onClose={() => setEditLog(null)}
          onSuccess={() => { setEditLog(null); refresh() }}
        />
      )}
    </div>
  )
}

function percentCircle(isOver: boolean, percent: number): CSSProperties {
  return {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: isOver
      ? 'rgba(255,68,68,0.08)'
      : percent > 80
        ? 'rgba(245,158,11,0.08)'
        : 'var(--neon-dim)',
    border: `1.5px solid ${isOver ? 'rgba(255,68,68,0.3)' : 'var(--neon-border)'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }
}

function MealSection({
  meal, logs, mealCalories, animDelay, onAdd, onEdit, onDelete,
}: {
  meal: MealType
  logs: CalorieLog[]
  mealCalories: number
  animDelay: number
  onAdd: () => void
  onEdit: (log: CalorieLog) => void
  onDelete: (log: CalorieLog) => void
}) {
  const hasLogs = logs.length > 0

  return (
    <div
      className="sf-card sf-animate-in"
      style={{ padding: '0.875rem 1rem', animationDelay: `${animDelay}ms` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-sm)',
            background: hasLogs ? 'var(--neon-dim)' : 'var(--bg-muted)',
            border: `1px solid ${hasLogs ? 'var(--neon-border-md)' : 'transparent'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            transition: 'all 0.2s ease',
          }}>
            {MEAL_ICONS[meal]}
          </div>
          <div>
            <h3 style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
            }}>
              {MEAL_LABELS[meal]}
            </h3>
            {hasLogs && (
              <p style={{
                margin: '1px 0 0',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                color: 'var(--neon)',
                letterSpacing: '0.04em',
              }}>
                {Math.round(mealCalories)} kcal · {logs.length} item{logs.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onAdd}
          className="sf-btn-primary"
          style={{ fontSize: '0.68rem', padding: '0.35rem 0.875rem', letterSpacing: '0.06em' }}
        >
          + Add
        </button>
      </div>

      {hasLogs && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 0', display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {logs.map((log, i) => (
            <li
              key={log.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0',
                borderTop: i === 0 ? 'none' : '1px solid rgba(0,255,46,0.06)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                <p style={{
                  margin: 0,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {log.foodName}
                </p>
                <p style={{
                  margin: '1px 0 0',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.58rem',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.04em',
                }}>
                  {log.servingSize} · P {Math.round(Number(log.proteinG))}g · C {Math.round(Number(log.carbsG))}g · F {Math.round(Number(log.fatG))}g
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                }}>
                  {Math.round(Number(log.calories))}
                </span>
                <button
                  onClick={() => onEdit(log)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--neon)', fontFamily: 'var(--font-mono)',
                    fontSize: '0.58rem', padding: '0.25rem 0.375rem',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    opacity: 0.8,
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(log)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: '1rem',
                    padding: '0.25rem', lineHeight: 1, width: '24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
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
const pageHeader: CSSProperties = {}
const pageTitle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 900,
  fontSize: '2.2rem',
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
  color: 'var(--text-primary)',
}
const pageSub: CSSProperties = {
  margin: '2px 0 0',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}
const dateNav: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}
const navArrowBtn: CSSProperties = {
  width: '36px',
  height: '36px',
  background: 'var(--bg-card)',
  border: '1px solid var(--neon-border)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}
const dateDisplay: CSSProperties = {
  flex: 1,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '36px',
  background: 'var(--bg-card)',
  border: '1px solid var(--neon-border)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
}
const dateLabelText: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  letterSpacing: '0.04em',
  pointerEvents: 'none',
}
const hiddenDateInput: CSSProperties = {
  position: 'absolute',
  inset: 0,
  opacity: 0,
  cursor: 'pointer',
  width: '100%',
  height: '100%',
}
const summaryCard: CSSProperties = { padding: '1.25rem' }
const summaryTop: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }
const macroGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '0.5rem',
  marginTop: '1rem',
}
const macroCell: CSSProperties = {
  padding: '0.5rem',
  background: 'var(--bg-muted)',
  border: '1px solid rgba(0,255,46,0.06)',
  borderRadius: 'var(--radius-sm)',
  textAlign: 'center',
}
const macroLabel: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.52rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}
