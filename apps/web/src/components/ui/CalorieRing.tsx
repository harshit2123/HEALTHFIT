import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface CalorieRingProps {
  consumed: number
  target: number | null
  size?: number
}

export function CalorieRing({ consumed, target, size = 200 }: CalorieRingProps) {
  const safeTarget = target && target > 0 ? target : 2000
  const percent = (consumed / safeTarget) * 100
  const remaining = Math.max(0, safeTarget - consumed)
  const isOver = consumed > safeTarget
  const overage = isOver ? consumed - safeTarget : 0

  const arcColor =
    percent >= 100 ? '#ff4444' : percent >= 80 ? '#f59e0b' : '#00FF2E'

  const trackColor = 'rgba(0,255,46,0.06)'

  const arcConsumed = Math.min(consumed, safeTarget)
  const arcRemaining = Math.max(0, safeTarget - arcConsumed)

  const data = [
    { name: 'consumed', value: arcConsumed },
    { name: 'remaining', value: arcRemaining || 0.001 },
  ]

  const strokeGlow =
    percent >= 100
      ? 'drop-shadow(0 0 10px rgba(255,68,68,0.65))'
      : percent >= 80
        ? 'drop-shadow(0 0 10px rgba(245,158,11,0.65))'
        : 'drop-shadow(0 0 12px rgba(0,255,46,0.55))'

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      {/* Ambient glow behind ring */}
      <div style={{
        position: 'absolute',
        inset: '-8px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${arcColor}10 0%, transparent 68%)`,
        pointerEvents: 'none',
      }} />

      <ResponsiveContainer width="100%" height="100%">
        <PieChart style={{ filter: strokeGlow }}>
          {/* Track ring */}
          <Pie
            data={[{ value: 1 }]}
            cx="50%"
            cy="50%"
            innerRadius="74%"
            outerRadius="88%"
            startAngle={0}
            endAngle={360}
            dataKey="value"
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill={trackColor} />
          </Pie>
          {/* Progress arc */}
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="75%"
            outerRadius="90%"
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            isAnimationActive
            animationDuration={900}
            animationEasing="ease-out"
          >
            <Cell fill={arcColor} />
            <Cell fill="transparent" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        gap: '2px',
      }}>
        <p style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: size > 160 ? '2.6rem' : '1.9rem',
          fontWeight: 800,
          lineHeight: 1,
          color: arcColor,
          textShadow: `0 0 16px ${arcColor}55`,
          letterSpacing: '0.02em',
          animation: 'countUp 0.6s var(--ease-out) both',
        }}>
          {Math.round(consumed)}
        </p>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.58rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          {target ? `/ ${target}` : ''} kcal
        </p>
        {target && (
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            fontWeight: 700,
            color: isOver ? 'var(--danger)' : 'var(--neon)',
            letterSpacing: '0.04em',
            marginTop: '4px',
          }}>
            {isOver ? `+${Math.round(overage)} over` : `${Math.round(remaining)} left`}
          </p>
        )}
      </div>
    </div>
  )
}
