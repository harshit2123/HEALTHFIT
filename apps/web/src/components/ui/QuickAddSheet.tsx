import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { calorieApi } from '../../lib/clientApi'
import { BottomSheet } from './BottomSheet'

interface QuickAddSheetProps {
  open: boolean
  onClose: () => void
}

/**
 * Quick-add bottom sheet from FAB.
 * 4 entry modes (Camera Phase 7+, Search, AI parse, Workout) + recent foods 1-tap log.
 */
export function QuickAddSheet({ open, onClose }: QuickAddSheetProps) {
  const navigate = useNavigate()

  const { data: suggestions } = useQuery({
    queryKey: ['food-suggestions'],
    queryFn: () => calorieApi.getSuggestions(6),
    enabled: open,
  })

  const goToFood = (mode?: 'search' | 'ai') => {
    onClose()
    navigate(`/client/calories${mode ? `?mode=${mode}` : ''}`)
  }

  const goToWorkout = () => {
    onClose()
    navigate('/client/workouts')
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Quick add">
      {/* Action grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.5rem',
          marginBottom: '1.25rem',
        }}
      >
        <ActionTile icon="🔍" label="Search food" onClick={() => goToFood('search')} />
        <ActionTile icon="✨" label="AI parse" onClick={() => goToFood('ai')} />
        <ActionTile icon="💪" label="Workout" onClick={goToWorkout} />
        <ActionTile
          icon="⚖️"
          label="Weight"
          onClick={() => {
            onClose()
            navigate('/client/progress')
          }}
        />
      </div>

      {/* Recent foods 1-tap log */}
      {suggestions && suggestions.recent.length > 0 && (
        <div>
          <p
            style={{
              margin: '0 0 0.5rem',
              fontSize: '0.625rem',
              textTransform: 'uppercase',
              color: '#9ca3af',
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            Recently eaten
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {suggestions.recent.slice(0, 6).map((food) => (
              <button
                key={food.id}
                onClick={() => {
                  onClose()
                  navigate(`/client/calories?logFoodId=${food.id}`)
                }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.625rem 0.75rem',
                  background: '#f9fafb',
                  border: '1px solid #f3f4f6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontWeight: 500, color: '#18181b' }}>{food.name}</span>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                  + {Math.round(Number(food.caloriesPer100g))} kcal
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </BottomSheet>
  )
}

interface ActionTileProps {
  icon: string
  label: string
  onClick: () => void
  disabled?: boolean
}

function ActionTile({ icon, label, onClick, disabled }: ActionTileProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0.875rem 0.5rem',
        background: disabled ? '#f3f4f6' : 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.375rem',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151' }}>{label}</span>
    </button>
  )
}
