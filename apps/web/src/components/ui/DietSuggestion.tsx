import type { CSSProperties } from 'react'

export interface NutrientGap {
  nutrient: string
  unit: string
  current: number
  target: number
  foods: string[]
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

interface DietSuggestionProps {
  gap: NutrientGap
}

export function DietSuggestion({ gap }: DietSuggestionProps) {
  const percent = Math.min(100, (gap.current / gap.target) * 100)
  const deficit = Math.max(0, gap.target - gap.current)
  const surplus = gap.current > gap.target ? gap.current - gap.target : 0

  return (
    <div style={card(gap.priority)}>
      {/* Header row */}
      <div style={headerRow}>
        <div style={nutrientInfo}>
          <span style={priorityDot(gap.priority)} aria-hidden="true" />
          <div>
            <p style={nutrientName}>{gap.nutrient}</p>
            <p style={nutrientValues}>
              <span style={currentVal}>{Math.round(gap.current)}</span>
              <span style={slash}>/</span>
              <span style={targetVal}>{gap.target}{gap.unit}</span>
            </p>
          </div>
        </div>

        <div style={statusChip(gap.priority, surplus > 0)}>
          {surplus > 0
            ? `+${Math.round(surplus)}${gap.unit}`
            : deficit > 0
              ? `−${Math.round(deficit)}${gap.unit}`
              : 'On target'}
        </div>
      </div>

      {/* Progress bar */}
      <div style={progressTrack}>
        <div
          style={{
            ...progressFill,
            width: `${percent}%`,
            background: surplus > 0
              ? 'linear-gradient(90deg, var(--danger), #ff6666)'
              : percent > 75
                ? 'linear-gradient(90deg, var(--neon-dark), var(--neon))'
                : gap.priority === 'HIGH'
                  ? 'linear-gradient(90deg, #ff4444, #ff6644)'
                  : 'linear-gradient(90deg, var(--neon-dark), var(--neon))',
          }}
        />
      </div>

      {/* Food suggestions */}
      {gap.priority !== 'LOW' && gap.foods.length > 0 && (
        <div style={foodsSection}>
          <span style={addLabel}>Add to reach target:</span>
          <div style={foodPills}>
            {gap.foods.map((food) => (
              <span key={food} style={foodPill}>{food}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Compound: full suggestion panel ────────────────────────────────────────

interface DietSuggestionPanelProps {
  gaps: NutrientGap[]
  isLoading?: boolean
}

export function DietSuggestionPanel({ gaps, isLoading }: DietSuggestionPanelProps) {
  if (isLoading) {
    return (
      <div style={panel}>
        <PanelHeader />
        {[1, 2, 3].map((i) => (
          <div key={i} style={skeletonCard} />
        ))}
      </div>
    )
  }

  const sorted = [...gaps].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

  return (
    <div style={panel}>
      <PanelHeader />
      {sorted.length === 0 ? (
        <div style={emptyState}>
          <span style={emptyIcon}>✦</span>
          <p style={emptyText}>Great nutrition balance today</p>
        </div>
      ) : (
        sorted.map((g) => <DietSuggestion key={g.nutrient} gap={g} />)
      )}
    </div>
  )
}

function PanelHeader() {
  return (
    <div style={panelHeader}>
      <div>
        <p style={panelTitle}>Diet insights</p>
        <p style={panelSub}>Based on your intake vs healthy targets</p>
      </div>
      <span className="sf-badge sf-badge-neon">AI</span>
    </div>
  )
}

const PRIORITY_ORDER: Record<NutrientGap['priority'], number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
}

// ─── Styles ────────────────────────────────────────────────────────────────

function card(priority: NutrientGap['priority']): CSSProperties {
  const borderColor = priority === 'HIGH'
    ? 'rgba(255,68,68,0.25)'
    : 'var(--neon-border)'

  return {
    padding: '0.875rem 1rem',
    background: 'var(--bg-card)',
    border: `1px solid ${borderColor}`,
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625rem',
    transition: 'border-color 0.2s ease',
  }
}

const headerRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const nutrientInfo: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
}

function priorityDot(priority: NutrientGap['priority']): CSSProperties {
  const colors = {
    HIGH: 'var(--danger)',
    MEDIUM: '#f59e0b',
    LOW: 'var(--neon)',
  }
  return {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: colors[priority],
    flexShrink: 0,
  }
}

const nutrientName: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: '0.85rem',
  color: 'var(--text-primary)',
  margin: 0,
  lineHeight: 1.2,
}

const nutrientValues: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '2px',
  margin: '0.125rem 0 0',
}

const currentVal: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
}

const slash: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  color: 'var(--text-muted)',
  margin: '0 1px',
}

const targetVal: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  color: 'var(--text-muted)',
}

function statusChip(priority: NutrientGap['priority'], isSurplus: boolean): CSSProperties {
  if (isSurplus) {
    return {
      fontSize: '0.65rem',
      fontFamily: 'var(--font-mono)',
      fontWeight: 700,
      color: 'var(--danger)',
      background: 'var(--danger-dim)',
      border: '1px solid rgba(255,68,68,0.2)',
      borderRadius: '100px',
      padding: '2px 8px',
      whiteSpace: 'nowrap' as const,
    }
  }
  const color = priority === 'HIGH' ? 'var(--danger)' : priority === 'MEDIUM' ? '#f59e0b' : 'var(--neon)'
  return {
    fontSize: '0.65rem',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    color,
    background: 'var(--bg-muted)',
    border: `1px solid ${color}40`,
    borderRadius: '100px',
    padding: '2px 8px',
    whiteSpace: 'nowrap' as const,
  }
}

const progressTrack: CSSProperties = {
  height: '4px',
  background: 'var(--bg-muted)',
  borderRadius: '2px',
  overflow: 'hidden',
}

const progressFill: CSSProperties = {
  height: '100%',
  borderRadius: '2px',
  transition: 'width 0.6s var(--ease-out)',
}

const foodsSection: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.375rem',
}

const addLabel: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.58rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}

const foodPills: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.375rem',
}

const foodPill: CSSProperties = {
  padding: '3px 8px',
  background: 'var(--neon-dim)',
  border: '1px solid var(--neon-border)',
  borderRadius: '100px',
  fontFamily: 'var(--font-body)',
  fontSize: '0.72rem',
  color: 'var(--text-secondary)',
}

const panel: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.625rem',
}

const panelHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '0.25rem',
}

const panelTitle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 800,
  fontSize: '1.1rem',
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
  margin: 0,
}

const panelSub: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  margin: '0.125rem 0 0',
}

const emptyState: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '1.5rem',
  background: 'var(--bg-card)',
  border: '1px solid var(--neon-border)',
  borderRadius: 'var(--radius-md)',
}

const emptyIcon: CSSProperties = {
  fontSize: '1.25rem',
  color: 'var(--neon)',
}

const emptyText: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  margin: 0,
}

const skeletonCard: CSSProperties = {
  height: '90px',
  background: 'var(--bg-card)',
  border: '1px solid var(--neon-border)',
  borderRadius: 'var(--radius-md)',
  animation: 'skeleton-pulse 1.5s ease-in-out infinite',
}
