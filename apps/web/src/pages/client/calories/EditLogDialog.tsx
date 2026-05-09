import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { calorieApi, type CalorieLog, type MealType } from '../../../lib/clientApi'

interface Props {
  log: CalorieLog
  onClose: () => void
  onSuccess: () => void
}

const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  SNACKS: 'Snacks',
  DINNER: 'Dinner',
}

/**
 * Edit a logged meal entry. Two things are editable:
 * - Servings: rescales macros if log was linked to a food, otherwise just relabels
 * - Meal type: move between breakfast/lunch/snacks/dinner
 */
export function EditLogDialog({ log, onClose, onSuccess }: Props) {
  const [multiplier, setMultiplier] = useState('1')
  const [mealType, setMealType] = useState<MealType>(log.mealType)

  const mutation = useMutation({
    mutationFn: (data: { servingMultiplier?: number; mealType?: MealType }) =>
      calorieApi.updateLog(log.id, data),
    onSuccess,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const mult = Number(multiplier) || 1
    const updates: { servingMultiplier?: number; mealType?: MealType } = {}
    if (mult !== 1) updates.servingMultiplier = mult
    if (mealType !== log.mealType) updates.mealType = mealType
    if (Object.keys(updates).length === 0) {
      onClose()
      return
    }
    mutation.mutate(updates)
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <header
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.125rem' }}>Edit entry</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 500 }}>{log.foodName}</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
              Currently: {log.servingSize} · {Math.round(Number(log.calories))} kcal
            </p>
          </div>

          <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
            Adjust servings (1 = current amount)
            <input
              type="number"
              step="0.5"
              min="0.25"
              value={multiplier}
              onChange={(e) => setMultiplier(e.target.value)}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.625rem',
                marginTop: '0.25rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
            <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
              {multiplier === '1'
                ? 'No change'
                : `Will rescale to ~${Math.round(Number(log.calories) * (Number(multiplier) || 1))} kcal`}
            </span>
          </label>

          <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
            Move to meal
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as MealType)}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.625rem',
                marginTop: '0.25rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
              }}
            >
              {(Object.keys(MEAL_LABELS) as MealType[]).map((m) => (
                <option key={m} value={m}>
                  {MEAL_LABELS[m]}
                </option>
              ))}
            </select>
          </label>

          {mutation.isError && (
            <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>Failed to save changes</p>
          )}

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
              fontWeight: 600,
            }}
          >
            {mutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
  padding: '1rem',
}

const dialogStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '420px',
}
