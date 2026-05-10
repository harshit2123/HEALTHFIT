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
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  SNACKS: 'Snacks',
  DINNER: 'Dinner',
}
const MEAL_ICONS: Record<MealType, string> = {
  BREAKFAST: '☀️',
  LUNCH: '🌤️',
  SNACKS: '🍎',
  DINNER: '🌙',
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

  function handleDateShift(days: number) {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    setDate(d.toISOString().slice(0, 10))
  }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['calories', date] })
  }

  return (
    <div style={page}>
      <header style={pageHeader} className="sf-animate-in">
        <h1 style={pageTitle}>Calorie Tracker</h1>
        <p style={pageSub}>Track meals optimised for Indian diets</p>
      </header>

      {/* Date navigator */}
      <div style={dateNav} className="sf-animate-in">
        <button onClick={() => handleDateShift(-1)} style={navBtn}>‹</button>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          style={dateInput}
        />
        {!isToday && <button onClick={() => handleDateShift(1)} style={navBtn}>›</button>}
        {isToday ? (
          <span style={todayChip}>Today</span>
        ) : (
          <button onClick={() => setDate(new Date().toISOString().slice(0, 10))} style={{ ...navBtn, padding: '0.4rem 0.75rem', fontSize: '0.72rem' }}>
            Today
          </button>
        )}
      </div>

      {/* Daily summary */}
      <section className="sf-card sf-animate-in" style={summaryCard}>
        <div style={summaryTop}>
          <div>
            <p style={bigCal}>
              <span className="sf-stat">{Math.round(consumed)}</span>
              <span style={calTarget}>{target ? ` / ${target}` : ''} kcal</span>
            </p>
            {remaining !== null && (
              <p style={{ ...remainingText, color: remaining < 0 ? 'var(--danger)' : 'var(--neon)' }}>
                {remaining < 0
                  ? `${Math.abs(Math.round(remaining))} over target`
                  : `${Math.round(remaining)} remaining`}
              </p>
            )}
            {!target && (
              <p style={noTargetHint}>Set age / height / weight in profile for daily target</p>
            )}
          </div>
        </div>

        {target && (
          <div className="sf-progress-track" style={{ marginTop: '0.75rem' }}>
            <div
              className={percent > 100 ? '' : 'sf-progress-fill'}
              style={{
                width: `${percent}%`,
                height: '100%',
                borderRadius: '2px',
                background: percent > 100
                  ? 'linear-gradient(90deg, var(--danger), #ff6644)'
                  : percent > 80
                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                    : 'linear-gradient(90deg, var(--neon-dark), var(--neon))',
                transition: 'width 0.6s var(--ease-out)',
              }}
            />
          </div>
        )}

        {/* Macro grid */}
        <div style={macroGrid}>
          <MacroCell label="Protein" value={daily?.summary.proteinG ?? 0} unit="g" color="var(--neon)" />
          <MacroCell label="Carbs" value={daily?.summary.carbsG ?? 0} unit="g" color="var(--text-primary)" />
          <MacroCell label="Fat" value={daily?.summary.fatG ?? 0} unit="g" color="var(--text-secondary)" />
          <MacroCell label="Fiber" value={daily?.summary.fiberG ?? 0} unit="g" color="var(--text-muted)" />
        </div>
      </section>

      {/* Meal sections */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3, 4].map((i) => <div key={i} style={skeletonCard} />)}
        </div>
      ) : (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {MEAL_ORDER.map((meal) => {
            const mealLogs = daily?.logs.filter((l) => l.mealType === meal) ?? []
            const mealCalories = daily?.summary.byMeal[meal]?.calories ?? 0
            return (
              <MealSection
                key={meal}
                meal={meal}
                logs={mealLogs}
                mealCalories={mealCalories}
                onAdd={() => setLogDialog(meal)}
                onEdit={(log) => setEditLog(log)}
                onDelete={(log) => {
                  if (confirm('Delete this entry?')) {
                    calorieApi.deleteLog(log.id)
                      .then(() => refresh())
                      .catch(() => alert('Failed to delete. Please try again.'))
                  }
                }}
              />
            )
          })}
        </section>
      )}

      {/* Diet suggestions */}
      <section style={{ marginTop: '0.5rem' }} className="sf-animate-in">
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

function MealSection({
  meal,
  logs,
  mealCalories,
  onAdd,
  onEdit,
  onDelete,
}: {
  meal: MealType
  logs: CalorieLog[]
  mealCalories: number
  onAdd: () => void
  onEdit: (log: CalorieLog) => void
  onDelete: (log: CalorieLog) => void
}) {
  return (
    <div className="sf-card" style={mealCard}>
      <div style={mealHeader}>
        <div>
          <h3 style={mealTitle}>
            <span style={{ marginRight: '0.5rem' }}>{MEAL_ICONS[meal]}</span>
            {MEAL_LABELS[meal]}
          </h3>
          {logs.length > 0 && (
            <p style={mealMeta}>
              {Math.round(mealCalories)} kcal · {logs.length} item{logs.length === 1 ? '' : 's'}
            </p>
          )}
        </div>
        <button onClick={onAdd} className="sf-btn-primary" style={addBtn}>+ Add</button>
      </div>

      {logs.length > 0 && (
        <ul style={logList}>
          {logs.map((log) => (
            <li key={log.id} style={logItem}>
              <div>
                <p style={logName}>{log.foodName}</p>
                <p style={logMacros}>
                  {log.servingSize} · P {Math.round(Number(log.proteinG))}g · C {Math.round(Number(log.carbsG))}g · F {Math.round(Number(log.fatG))}g
                </p>
              </div>
              <div style={logRight}>
                <span style={logCal}>{Math.round(Number(log.calories))} kcal</span>
                <button onClick={() => onEdit(log)} style={editBtn}>Edit</button>
                <button onClick={() => onDelete(log)} style={deleteBtn}>×</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MacroCell({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div style={macroCell}>
      <p style={macroLabel}>{label}</p>
      <p style={{ margin: '0.125rem 0 0', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', lineHeight: 1, color }}>
        {Math.round(value)}<span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: '1px' }}>{unit}</span>
      </p>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────

const page: CSSProperties = { maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }
const pageHeader: CSSProperties = {}
const pageTitle: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.01em', color: 'var(--text-primary)', margin: 0 }
const pageSub: CSSProperties = { margin: '0.25rem 0 0', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--text-muted)' }
const dateNav: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem' }
const navBtn: CSSProperties = { padding: '0.5rem 0.75rem', background: 'var(--bg-card)', border: '1px solid var(--neon-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }
const dateInput: CSSProperties = { padding: '0.5rem 0.625rem', background: 'var(--bg-card)', border: '1px solid var(--neon-border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', colorScheme: 'dark' }
const todayChip: CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--neon)', background: 'var(--neon-dim)', border: '1px solid var(--neon-border)', borderRadius: '100px', padding: '3px 10px' }
const summaryCard: CSSProperties = { padding: '1.25rem' }
const summaryTop: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }
const bigCal: CSSProperties = { margin: 0, display: 'flex', alignItems: 'baseline', gap: '4px' }
const calTarget: CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-muted)' }
const remainingText: CSSProperties = { margin: '0.25rem 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em' }
const noTargetHint: CSSProperties = { margin: '0.25rem 0 0', fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--text-muted)' }
const macroGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '1rem' }
const macroCell: CSSProperties = { padding: '0.5rem', background: 'var(--bg-muted)', border: '1px solid var(--neon-border)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }
const macroLabel: CSSProperties = { margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }
const skeletonCard: CSSProperties = { height: '80px', background: 'var(--bg-card)', border: '1px solid var(--neon-border)', borderRadius: 'var(--radius-md)', animation: 'skeleton-pulse 1.5s ease-in-out infinite' }
const mealCard: CSSProperties = { padding: '1rem 1.25rem' }
const mealHeader: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const mealTitle: CSSProperties = { margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }
const mealMeta: CSSProperties = { margin: '0.25rem 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }
const addBtn: CSSProperties = { fontSize: '0.72rem', padding: '0.35rem 0.875rem' }
const logList: CSSProperties = { listStyle: 'none', padding: 0, margin: '0.75rem 0 0' }
const logItem: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderTop: '1px solid var(--neon-border)', fontSize: '0.875rem' }
const logName: CSSProperties = { margin: 0, fontFamily: 'var(--font-body)', fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.825rem' }
const logMacros: CSSProperties = { margin: '0.125rem 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }
const logRight: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem' }
const logCal: CSSProperties = { fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }
const editBtn: CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neon)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', padding: '0.25rem', letterSpacing: '0.04em' }
const deleteBtn: CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', padding: '0.25rem', lineHeight: 1 }
