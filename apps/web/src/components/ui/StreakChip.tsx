interface StreakChipProps {
  days: number
  isActiveToday: boolean
}

/**
 * Streak gamification chip (Cult.fit pattern).
 * Hidden when 0. Bigger style at milestones (7, 30, 100).
 */
export function StreakChip({ days, isActiveToday }: StreakChipProps) {
  if (days === 0) return null

  const isMilestone = days === 7 || days === 30 || days === 100
  const dim = !isActiveToday // hasn't logged today, dim it as a nudge

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: isMilestone ? '0.4rem 0.75rem' : '0.25rem 0.625rem',
        background: isMilestone ? '#fef3c7' : '#fff7ed',
        color: dim ? '#9a3412' : '#9a3412',
        opacity: dim ? 0.65 : 1,
        borderRadius: '999px',
        fontSize: isMilestone ? '0.875rem' : '0.75rem',
        fontWeight: 700,
        border: isMilestone ? '1px solid #fde68a' : '1px solid #fed7aa',
      }}
      title={isActiveToday ? 'Logged today, streak alive' : 'Log something today to keep streak'}
    >
      <span aria-hidden="true">🔥</span>
      {days} day{days === 1 ? '' : 's'}
    </span>
  )
}
