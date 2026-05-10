import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { calorieApi, type MealType, type CalorieLog } from '../../../lib/clientApi'
import { LogMealDialog } from './LogMealDialog'
import { EditLogDialog } from './EditLogDialog'

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

  // FAB recent-food deeplink: open dialog pre-filled
  useEffect(() => {
    const logFoodId = searchParams.get('logFoodId')
    if (logFoodId) {
      setLogDialog('SNACKS') // default meal — user can change in dialog
      // We'd ideally pre-populate the dialog with foodId, but minimum-friction:
      // open SNACKS dialog and clear URL
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const { data: daily, isLoading } = useQuery({
    queryKey: ['calories', date],
    queryFn: () => calorieApi.getDaily(date),
  })

  const { data: targetData } = useQuery({
    queryKey: ['calorie-target'],
    queryFn: calorieApi.getDailyTarget,
  })

  const target = targetData?.dailyCalorieTarget
  const consumed = daily?.summary.calories ?? 0
  const remaining = target ? target - consumed : null
  const percent = target ? Math.min(100, (consumed / target) * 100) : 0

  function handleDateShift(days: number) {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    setDate(d.toISOString().slice(0, 10))
  }

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['calories', date] })
  }

  const isToday = date === new Date().toISOString().slice(0, 10)

  return (
    <div style={{ maxWidth: '720px' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Calorie tracker</h1>
        <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
          Track meals optimized for Indian diets
        </p>
      </header>

      {/* Date navigator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button onClick={() => handleDateShift(-1)} style={iconBtn}>‹</button>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
        />
        {!isToday && (
          <button onClick={() => handleDateShift(1)} style={iconBtn}>›</button>
        )}
        {isToday ? (
          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Today</span>
        ) : (
          <button onClick={() => setDate(new Date().toISOString().slice(0, 10))} style={{ ...iconBtn, padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
            Today
          </button>
        )}
      </div>

      {/* Daily summary */}
      <section style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <div>
            <p style={{ margin: 0, fontSize: '2.25rem', fontWeight: 700 }}>
              {Math.round(consumed)}
              <span style={{ fontSize: '1rem', color: '#9ca3af', fontWeight: 400 }}>
                {target ? ` / ${target}` : ''} kcal
              </span>
            </p>
            {remaining !== null && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: remaining < 0 ? '#dc2626' : '#10b981' }}>
                {remaining < 0
                  ? `${Math.abs(Math.round(remaining))} over target`
                  : `${Math.round(remaining)} remaining`}
              </p>
            )}
            {!target && (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                Set age/height/weight in profile for daily target
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {target && (
          <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${percent}%`,
                height: '100%',
                background: percent > 100 ? '#dc2626' : percent > 80 ? '#f59e0b' : '#10b981',
                transition: 'width 0.3s',
              }}
            />
          </div>
        )}

        {/* Macro pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
          <Macro label="Protein" value={daily?.summary.proteinG ?? 0} unit="g" color="#6366f1" />
          <Macro label="Carbs" value={daily?.summary.carbsG ?? 0} unit="g" color="#f59e0b" />
          <Macro label="Fat" value={daily?.summary.fatG ?? 0} unit="g" color="#dc2626" />
          <Macro label="Fiber" value={daily?.summary.fiberG ?? 0} unit="g" color="#10b981" />
        </div>
      </section>

      {/* Meals */}
      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {MEAL_ORDER.map((meal) => {
            const mealLogs = daily?.logs.filter((l) => l.mealType === meal) ?? []
            const mealCalories = daily?.summary.byMeal[meal]?.calories ?? 0
            return (
              <div key={meal} style={{ padding: '1rem 1.25rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>
                      <span style={{ marginRight: '0.5rem' }}>{MEAL_ICONS[meal]}</span>
                      {MEAL_LABELS[meal]}
                    </h3>
                    {mealLogs.length > 0 && (
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                        {Math.round(mealCalories)} kcal · {mealLogs.length} item{mealLogs.length === 1 ? '' : 's'}
                      </p>
                    )}
                  </div>
                  <button onClick={() => setLogDialog(meal)} style={btnPrimary}>
                    + Add
                  </button>
                </div>

                {mealLogs.length > 0 && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 0' }}>
                    {mealLogs.map((log) => (
                      <li
                        key={log.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem 0',
                          borderTop: '1px solid #f3f4f6',
                          fontSize: '0.875rem',
                        }}
                      >
                        <div>
                          <p style={{ margin: 0, fontWeight: 500 }}>{log.foodName}</p>
                          <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                            {log.servingSize} · P {Math.round(Number(log.proteinG))}g · C {Math.round(Number(log.carbsG))}g · F {Math.round(Number(log.fatG))}g
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600 }}>{Math.round(Number(log.calories))} kcal</span>
                          <button
                            onClick={() => setEditLog(log)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: '0.75rem', padding: '0.25rem' }}
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Delete this entry?')) {
                                await calorieApi.deleteLog(log.id)
                                refresh()
                              }
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1rem' }}
                            title="Delete"
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
          })}
        </section>
      )}

      {logDialog && (
        <LogMealDialog
          mealType={logDialog}
          loggedDate={date}
          onClose={() => setLogDialog(null)}
          onSuccess={() => {
            setLogDialog(null)
            refresh()
          }}
        />
      )}

      {editLog && (
        <EditLogDialog
          log={editLog}
          onClose={() => setEditLog(null)}
          onSuccess={() => {
            setEditLog(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}

function Macro({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div style={{ padding: '0.5rem', background: '#f9fafb', borderRadius: '6px', textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: '0.625rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
      <p style={{ margin: '0.125rem 0 0', fontWeight: 700, color }}>
        {Math.round(value)}
        <span style={{ fontSize: '0.625rem', color: '#9ca3af', fontWeight: 400 }}>{unit}</span>
      </p>
    </div>
  )
}

const iconBtn = {
  padding: '0.5rem 0.75rem',
  background: 'white',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1rem',
}

const btnPrimary = {
  padding: '0.4rem 0.75rem',
  background: '#10b981',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer' as const,
  fontSize: '0.75rem',
  fontWeight: 600,
}
