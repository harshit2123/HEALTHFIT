import type { CSSProperties } from 'react'
import type { ExerciseCategory } from '../../lib/clientApi'

interface ExerciseCardProps {
  exerciseName: string
  category: ExerciseCategory
  primaryMuscles: string[]
  weightKg?: number
  reps?: number
  sets?: number
  onWeightChange?: (v: number) => void
  onRepsChange?: (v: number) => void
  onAddSet?: () => void
  onRemove?: () => void
}

export function ExerciseCard({
  exerciseName,
  category,
  primaryMuscles,
  weightKg,
  reps,
  sets,
  onWeightChange,
  onRepsChange,
  onAddSet,
  onRemove,
}: ExerciseCardProps) {
  return (
    <div style={card}>
      {/* Left: body diagram */}
      <div style={diagramSide}>
        <BodyDiagram primaryMuscles={primaryMuscles} category={category} />
        <span style={categoryBadge}>{CATEGORY_LABELS[category]}</span>
      </div>

      {/* Right: exercise info + inputs */}
      <div style={inputSide}>
        <div style={nameRow}>
          <p style={exerciseName_style}>{exerciseName}</p>
          {onRemove && (
            <button onClick={onRemove} style={removeBtn} aria-label="Remove exercise">×</button>
          )}
        </div>

        {primaryMuscles.length > 0 && (
          <p style={musclesText}>{primaryMuscles.slice(0, 2).join(' · ')}</p>
        )}

        <div style={inputGrid}>
          <InputField
            label="kg"
            value={weightKg}
            step={0.5}
            onChange={onWeightChange}
          />
          <InputField
            label="reps"
            value={reps}
            step={1}
            onChange={onRepsChange}
          />
          <div style={setsCell}>
            <span style={setsLabel}>Sets</span>
            <span style={setsCount}>{sets ?? 1}</span>
          </div>
        </div>

        {onAddSet && (
          <button onClick={onAddSet} style={addSetBtn}>+ Set</button>
        )}
      </div>
    </div>
  )
}

function InputField({
  label,
  value,
  step,
  onChange,
}: {
  label: string
  value?: number
  step: number
  onChange?: (v: number) => void
}) {
  return (
    <label style={fieldWrap}>
      <span style={fieldLabel}>{label}</span>
      <input
        type="number"
        step={step}
        min={0}
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value ? Number(e.target.value) : 0)}
        style={fieldInput}
        aria-label={label}
      />
    </label>
  )
}

// SVG body silhouette with highlighted muscle groups
function BodyDiagram({ primaryMuscles, category }: { primaryMuscles: string[]; category: ExerciseCategory }) {
  const highlighted = resolveHighlight(primaryMuscles, category)

  const neon = 'rgba(0,255,46,0.65)'
  const base = 'rgba(255,255,255,0.07)'
  const stroke = 'rgba(255,255,255,0.12)'

  function fill(group: string) {
    return highlighted.includes(group) ? neon : base
  }

  return (
    <svg
      viewBox="0 0 80 160"
      width="72"
      height="144"
      aria-hidden="true"
      style={{ display: 'block', margin: '0 auto' }}
    >
      {/* Head */}
      <ellipse cx="40" cy="14" rx="10" ry="12" fill={base} stroke={stroke} strokeWidth="0.8" />

      {/* Neck */}
      <rect x="36" y="25" width="8" height="6" rx="2" fill={base} stroke={stroke} strokeWidth="0.8" />

      {/* Shoulders */}
      <ellipse cx="22" cy="36" rx="8" ry="6" fill={fill('shoulders')} stroke={stroke} strokeWidth="0.8" />
      <ellipse cx="58" cy="36" rx="8" ry="6" fill={fill('shoulders')} stroke={stroke} strokeWidth="0.8" />

      {/* Chest */}
      <path d="M30 31 Q40 27 50 31 L52 50 Q40 55 28 50 Z" fill={fill('chest')} stroke={stroke} strokeWidth="0.8" />

      {/* Abs */}
      <path d="M32 50 Q40 47 48 50 L47 70 Q40 73 33 70 Z" fill={fill('abs')} stroke={stroke} strokeWidth="0.8" />

      {/* Upper back / traps */}
      <path d="M30 31 Q40 27 50 31 L50 44 Q40 40 30 44 Z" fill={fill('back')} stroke={stroke} strokeWidth="0.8" />

      {/* Upper arms (biceps) */}
      <rect x="13" y="33" width="7" height="20" rx="3.5" fill={fill('biceps')} stroke={stroke} strokeWidth="0.8" />
      <rect x="60" y="33" width="7" height="20" rx="3.5" fill={fill('biceps')} stroke={stroke} strokeWidth="0.8" />

      {/* Forearms */}
      <rect x="11" y="55" width="6" height="18" rx="3" fill={fill('forearms')} stroke={stroke} strokeWidth="0.8" />
      <rect x="63" y="55" width="6" height="18" rx="3" fill={fill('forearms')} stroke={stroke} strokeWidth="0.8" />

      {/* Hips */}
      <path d="M32 70 Q40 68 48 70 L50 82 Q40 85 30 82 Z" fill={fill('glutes')} stroke={stroke} strokeWidth="0.8" />

      {/* Quads */}
      <rect x="31" y="82" width="8" height="28" rx="4" fill={fill('quads')} stroke={stroke} strokeWidth="0.8" />
      <rect x="41" y="82" width="8" height="28" rx="4" fill={fill('quads')} stroke={stroke} strokeWidth="0.8" />

      {/* Hamstrings (behind — lighter overlay) */}
      <rect x="31" y="82" width="8" height="24" rx="4" fill={fill('hamstrings')} stroke="none" />
      <rect x="41" y="82" width="8" height="24" rx="4" fill={fill('hamstrings')} stroke="none" />

      {/* Calves */}
      <rect x="32" y="112" width="7" height="22" rx="3.5" fill={fill('calves')} stroke={stroke} strokeWidth="0.8" />
      <rect x="41" y="112" width="7" height="22" rx="3.5" fill={fill('calves')} stroke={stroke} strokeWidth="0.8" />

      {/* Feet */}
      <ellipse cx="36" cy="137" rx="6" ry="3" fill={base} stroke={stroke} strokeWidth="0.8" />
      <ellipse cx="45" cy="137" rx="6" ry="3" fill={base} stroke={stroke} strokeWidth="0.8" />

      {/* Cardio: full body pulse ring */}
      {category === 'CARDIO' && (
        <ellipse cx="40" cy="80" rx="36" ry="70" fill="none" stroke={neon} strokeWidth="1" opacity="0.4" strokeDasharray="4 3" />
      )}
    </svg>
  )
}

const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  STRENGTH: 'Strength',
  CARDIO: 'Cardio',
  FLEXIBILITY: 'Flex',
  SPORTS: 'Sports',
  BODYWEIGHT: 'BW',
  OTHER: 'Other',
}

function resolveHighlight(primaryMuscles: string[], category: ExerciseCategory): string[] {
  const muscleMap: Record<string, string[]> = {
    chest: ['chest'],
    pectorals: ['chest'],
    back: ['back'],
    lats: ['back'],
    rhomboids: ['back'],
    traps: ['back', 'shoulders'],
    shoulders: ['shoulders'],
    deltoids: ['shoulders'],
    biceps: ['biceps'],
    triceps: ['biceps'],
    forearms: ['forearms'],
    abs: ['abs'],
    core: ['abs'],
    obliques: ['abs'],
    glutes: ['glutes'],
    quadriceps: ['quads'],
    quads: ['quads'],
    hamstrings: ['hamstrings'],
    calves: ['calves'],
    legs: ['quads', 'hamstrings', 'calves'],
  }

  if (category === 'CARDIO') return []
  if (category === 'FLEXIBILITY') return ['abs', 'quads', 'hamstrings']

  const hits = new Set<string>()
  for (const muscle of primaryMuscles) {
    const key = muscle.toLowerCase()
    const mapped = muscleMap[key]
    if (mapped) mapped.forEach((m) => hits.add(m))
  }

  if (hits.size === 0) {
    const defaults: Partial<Record<ExerciseCategory, string[]>> = {
      STRENGTH: ['chest', 'shoulders'],
      BODYWEIGHT: ['abs', 'chest'],
    }
    return defaults[category] ?? []
  }

  return Array.from(hits)
}

// ─── Styles ────────────────────────────────────────────────────────────────

const card: CSSProperties = {
  display: 'flex',
  gap: '1rem',
  padding: '1rem',
  background: 'var(--bg-card)',
  border: '1px solid var(--neon-border)',
  borderRadius: 'var(--radius-md)',
  transition: 'border-color 0.2s ease',
}

const diagramSide: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.375rem',
  flexShrink: 0,
}

const categoryBadge: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.55rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--text-neon)',
  background: 'var(--neon-dim)',
  border: '1px solid var(--neon-border)',
  borderRadius: '100px',
  padding: '2px 7px',
}

const inputSide: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  minWidth: 0,
}

const nameRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '0.5rem',
}

const exerciseName_style: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  fontSize: '1rem',
  color: 'var(--text-primary)',
  letterSpacing: '-0.01em',
  lineHeight: 1.2,
  margin: 0,
}

const musclesText: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  color: 'var(--text-muted)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  margin: 0,
}

const removeBtn: CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  fontSize: '1.1rem',
  cursor: 'pointer',
  padding: '0',
  lineHeight: 1,
  flexShrink: 0,
}

const inputGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr auto',
  gap: '0.5rem',
  alignItems: 'end',
}

const fieldWrap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
}

const fieldLabel: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}

const fieldInput: CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.625rem',
  background: 'var(--bg-muted)',
  border: '1px solid var(--neon-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const setsCell: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.25rem',
  paddingBottom: '0.375rem',
}

const setsLabel: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}

const setsCount: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '1.2rem',
  fontWeight: 700,
  color: 'var(--neon)',
  lineHeight: 1,
}

const addSetBtn: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '0.3rem 0.75rem',
  background: 'transparent',
  border: '1px solid var(--neon-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-neon)',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.08em',
  cursor: 'pointer',
  transition: 'border-color 0.2s, color 0.2s',
}
