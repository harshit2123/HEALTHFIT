import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface CalorieRingProps {
  consumed: number
  target: number | null
  size?: number
}

/**
 * Big calorie progress ring. Cal AI / HealthifyMe pattern.
 * Color shifts: green → amber@80% → red@100%+.
 */
export function CalorieRing({ consumed, target, size = 220 }: CalorieRingProps) {
  const safeTarget = target && target > 0 ? target : 2000
  const percent = (consumed / safeTarget) * 100
  const remaining = Math.max(0, safeTarget - consumed)
  const isOver = consumed > safeTarget
  const overage = isOver ? consumed - safeTarget : 0

  const color =
    percent >= 100
      ? '#dc2626' // red
      : percent >= 80
        ? '#f59e0b' // amber
        : '#10b981' // green

  // Cap visible arc at 100% but compute color with raw value
  const arcConsumed = Math.min(consumed, safeTarget)
  const arcRemaining = Math.max(0, safeTarget - arcConsumed)

  const data = [
    { name: 'consumed', value: arcConsumed },
    { name: 'remaining', value: arcRemaining },
  ]

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="78%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            isAnimationActive={true}
            animationDuration={600}
          >
            <Cell fill={color} />
            <Cell fill="#f3f4f6" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center text */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700, lineHeight: 1, color: '#18181b' }}>
          {Math.round(consumed)}
        </p>
        {target ? (
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
            / {target} kcal
          </p>
        ) : (
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>kcal</p>
        )}
        {target && (
          <p
            style={{
              margin: '0.5rem 0 0',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: isOver ? '#dc2626' : '#10b981',
            }}
          >
            {isOver ? `${Math.round(overage)} over` : `${Math.round(remaining)} left`}
          </p>
        )}
      </div>
    </div>
  )
}
