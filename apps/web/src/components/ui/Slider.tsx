import type { CSSProperties } from 'react'

interface SliderProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  label?: string
  unit?: string
  formatValue?: (v: number) => string
  disabled?: boolean
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  unit,
  formatValue,
  disabled = false,
}: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100
  const display = formatValue ? formatValue(value) : String(value)

  return (
    <div style={root}>
      {(label || unit) && (
        <div style={header}>
          {label && <span style={labelStyle}>{label}</span>}
          <span style={valueDisplay}>
            <span style={valueNum}>{display}</span>
            {unit && <span style={unitStyle}>{unit}</span>}
          </span>
        </div>
      )}

      <div style={track}>
        {/* filled portion */}
        <div
          style={{
            ...fill,
            width: `${percent}%`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="sf-slider"
          style={inputStyle}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
      </div>

      <div style={bounds}>
        <span>{formatValue ? formatValue(min) : min}{unit}</span>
        <span>{formatValue ? formatValue(max) : max}{unit}</span>
      </div>
    </div>
  )
}

const root: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  width: '100%',
}

const header: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
}

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}

const valueDisplay: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '2px',
}

const valueNum: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '1.1rem',
  fontWeight: 700,
  color: 'var(--neon)',
  lineHeight: 1,
}

const unitStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  color: 'var(--text-muted)',
  letterSpacing: '0.06em',
}

const track: CSSProperties = {
  position: 'relative',
  height: '4px',
  display: 'flex',
  alignItems: 'center',
}

const fill: CSSProperties = {
  position: 'absolute',
  left: 0,
  height: '4px',
  background: 'linear-gradient(90deg, var(--neon-dark), var(--neon))',
  borderRadius: '2px',
  pointerEvents: 'none',
  transition: 'width 0.1s ease',
  zIndex: 1,
}

const inputStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  opacity: 1,
  margin: 0,
  zIndex: 2,
}

const bounds: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  color: 'var(--text-muted)',
  letterSpacing: '0.06em',
}
