import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { calorieApi } from '../../lib/clientApi'
import { BottomSheet } from './BottomSheet'

interface QuickAddSheetProps {
  open: boolean
  onClose: () => void
}

interface ActionTileProps {
  icon: string
  label: string
  onClick: () => void
  disabled?: boolean
  glowColor?: string
}

function ActionTile({ icon, label, onClick, disabled, glowColor = 'rgba(0,255,46,0.3)' }: ActionTileProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '1rem 0.5rem 0.875rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--neon-border)',
        borderRadius: 'var(--radius-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.4rem',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.2s var(--ease-out)',
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        const el = e.currentTarget as HTMLButtonElement
        el.style.borderColor = 'rgba(0,255,46,0.3)'
        el.style.boxShadow = glowColor ? `0 0 14px ${glowColor}` : 'none'
        el.style.transform = 'translateY(-2px) scale(1.02)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.borderColor = 'var(--neon-border)'
        el.style.boxShadow = 'none'
        el.style.transform = 'none'
      }}
    >
      <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{icon}</span>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.58rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
        textAlign: 'center',
      }}>
        {label}
      </span>
    </button>
  )
}

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

  return (
    <BottomSheet open={open} onClose={onClose} title="Quick Add">
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.5rem',
        marginBottom: '1.25rem',
      }}>
        <ActionTile icon="🔍" label="Search" onClick={() => goToFood('search')} />
        <ActionTile icon="✨" label="AI Parse" onClick={() => goToFood('ai')} glowColor="rgba(168,85,247,0.3)" />
        <ActionTile icon="💪" label="Workout" onClick={() => { onClose(); navigate('/client/workouts') }} glowColor="rgba(255,107,53,0.3)" />
        <ActionTile icon="⚖️" label="Weight" onClick={() => { onClose(); navigate('/client/progress') }} glowColor="rgba(201,168,76,0.3)" />
      </div>

      {suggestions && suggestions.recent.length > 0 && (
        <div>
          <p style={{
            margin: '0 0 0.625rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.58rem',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: 'var(--text-muted)',
          }}>
            Recently Eaten
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {suggestions.recent.slice(0, 6).map((food, i) => (
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
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--neon-border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.2s var(--ease-out)',
                  animation: `slideUp 0.35s var(--ease-out) ${i * 40}ms both`,
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.borderColor = 'var(--neon-border-md)'
                  el.style.background = 'var(--bg-card-2)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.borderColor = 'var(--neon-border)'
                  el.style.background = 'var(--bg-card)'
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                }}>
                  {food.name}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--neon)',
                }}>
                  +{Math.round(Number(food.caloriesPer100g))} kcal
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </BottomSheet>
  )
}
