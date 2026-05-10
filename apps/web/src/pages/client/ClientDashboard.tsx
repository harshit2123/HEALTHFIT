import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { CSSProperties } from 'react'
import { useAuthStore } from '../../store/authStore'
import { clientApi, calorieApi, workoutApi, type MealType } from '../../lib/clientApi'
import { CalorieRing } from '../../components/ui/CalorieRing'
import { StreakChip } from '../../components/ui/StreakChip'

const MEAL_ORDER: MealType[] = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']
const MEAL_META: Record<MealType, { label: string; icon: string; time: string }> = {
  BREAKFAST: { label: 'Breakfast', icon: '🌅', time: '7–10 AM' },
  LUNCH:     { label: 'Lunch',     icon: '☀️', time: '12–2 PM' },
  SNACKS:    { label: 'Snacks',    icon: '🍎', time: '4–6 PM' },
  DINNER:    { label: 'Dinner',    icon: '🌙', time: '7–9 PM' },
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function ClientDashboard() {
  const { user } = useAuthStore()
  const today = new Date().toISOString().slice(0, 10)

  const { data: profile }       = useQuery({ queryKey: ['my-profile'],     queryFn: clientApi.getProfile })
  const { data: todayCalories } = useQuery({ queryKey: ['calories', today], queryFn: () => calorieApi.getDaily(today) })
  const { data: target }        = useQuery({ queryKey: ['calorie-target'],  queryFn: calorieApi.getDailyTarget })
  const { data: streak }        = useQuery({ queryKey: ['streak'],          queryFn: calorieApi.getStreak })
  const { data: todayWorkouts } = useQuery({ queryKey: ['workouts', 'day', today], queryFn: () => workoutApi.getDay(today) })

  const consumed = todayCalories?.summary.calories ?? 0
  const protein  = todayCalories?.summary.proteinG ?? 0
  const carbs    = todayCalories?.summary.carbsG ?? 0
  const fat      = todayCalories?.summary.fatG ?? 0
  const isB2C    = user?.accountType === 'B2C'
  const firstName = user?.name?.split(' ')[0] ?? 'Athlete'

  const workoutCount   = todayWorkouts?.length ?? 0
  const workoutMinutes = todayWorkouts?.reduce((s, w) => s + w.durationMin, 0) ?? 0

  return (
    <div style={page}>

      {/* ── Header ── */}
      <header style={headerWrap} className="sf-animate-in">
        <div>
          <p style={greetLabel}>{getGreeting()}</p>
          <h1 style={greetName}>
            {firstName}
            <span style={{ color: 'var(--neon)', marginLeft: 4 }}>.</span>
          </h1>
          {!isB2C && profile?.org?.name && (
            <p style={orgChip}>{profile.org.name}</p>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          {streak && <StreakChip days={streak.streakDays} isActiveToday={streak.isActiveToday} />}
          <Link to="/client/profile" style={avatarBtn}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--neon)' }}>
              {firstName.charAt(0)}
            </span>
          </Link>
        </div>
      </header>

      {/* ── Calorie ring card ── */}
      <section className="sf-card sf-animate-in" style={ringCard}>
        <CalorieRing consumed={consumed} target={target?.dailyCalorieTarget ?? null} size={190} />

        <div style={macroRow}>
          <MacroPill label="Protein" value={protein} unit="g" color="var(--neon)"         bg="rgba(0,255,46,0.06)" />
          <MacroPill label="Carbs"   value={carbs}   unit="g" color="var(--text-primary)"  bg="rgba(255,255,255,0.04)" />
          <MacroPill label="Fat"     value={fat}      unit="g" color="var(--energy)"        bg="rgba(255,107,53,0.06)" />
        </div>

        {!target?.dailyCalorieTarget && (
          <p style={targetHint}>
            <Link to="/client/profile" style={{ color: 'var(--neon)', textDecoration: 'none' }}>
              Set your profile
            </Link>{' '}
            to unlock daily target
          </p>
        )}
      </section>

      {/* ── Today's workout banner ── */}
      <Link to="/client/workouts" style={workoutBanner} className="sf-animate-in">
        <div style={workoutLeft}>
          <span style={workoutIcon}>⚡</span>
          <div>
            <p style={workoutTitle}>
              {workoutCount > 0
                ? `${workoutCount} workout${workoutCount > 1 ? 's' : ''} · ${workoutMinutes} min`
                : 'Log today\'s workout'}
            </p>
            <p style={workoutSub}>
              {workoutCount > 0
                ? `${todayWorkouts?.flatMap(w => w.exercises.flatMap(e => e.sets)).length ?? 0} sets done`
                : 'Stay consistent, stay strong'}
            </p>
          </div>
        </div>
        <span style={workoutArrow}>→</span>
      </Link>

      {/* ── Meals ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} className="sf-animate-in">
        <p style={sectionLabel}>Today's Meals</p>
        {MEAL_ORDER.map((meal, i) => {
          const mealCal  = todayCalories?.summary.byMeal[meal]?.calories ?? 0
          const entries  = todayCalories?.summary.byMeal[meal]?.entries ?? 0
          const meta     = MEAL_META[meal]
          const hasFood  = entries > 0
          return (
            <Link
              key={meal}
              to="/client/calories"
              style={{
                ...mealRow,
                animationDelay: `${i * 50}ms`,
                borderColor: hasFood ? 'var(--neon-border-md)' : 'var(--neon-border)',
              }}
              className="sf-animate-in"
            >
              <div style={mealLeft}>
                <div style={{
                  ...mealIconWrap,
                  background: hasFood ? 'var(--neon-dim)' : 'var(--bg-muted)',
                }}>
                  <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{meta.icon}</span>
                </div>
                <div>
                  <p style={mealName}>{meta.label}</p>
                  <p style={mealSub}>
                    {hasFood
                      ? `${Math.round(mealCal)} kcal · ${entries} item${entries !== 1 ? 's' : ''}`
                      : meta.time}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {hasFood && (
                  <div style={{ ...progressDot, background: 'var(--neon)' }} />
                )}
                <span style={mealAction}>{hasFood ? '→' : '+'}</span>
              </div>
            </Link>
          )
        })}
      </section>

      {/* ── Trainer badge ── */}
      {!isB2C && profile?.assignedToTrainer?.[0]?.trainer && (
        <div style={trainerCard} className="sf-animate-in">
          <div style={trainerLeft}>
            <div style={trainerAvatar}>
              {profile.assignedToTrainer[0].trainer.name.charAt(0)}
            </div>
            <div>
              <p style={trainerLabel}>Your Trainer</p>
              <p style={trainerName}>{profile.assignedToTrainer[0].trainer.name}</p>
            </div>
          </div>
          <span style={{ color: 'var(--gold)', fontSize: '0.75rem' }}>✦</span>
        </div>
      )}

    </div>
  )
}

function MacroPill({
  label, value, unit, color, bg,
}: {
  label: string; value: number; unit: string; color: string; bg: string
}) {
  return (
    <div style={{
      flex: 1,
      padding: '0.625rem 0.5rem',
      background: bg,
      border: '1px solid rgba(255,255,255,0.04)',
      borderRadius: 'var(--radius-md)',
      textAlign: 'center',
    }}>
      <p style={{
        margin: 0,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.55rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}>
        {label}
      </p>
      <p style={{
        margin: '4px 0 0',
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: '1.35rem',
        lineHeight: 1,
        color,
        letterSpacing: '0.02em',
      }}>
        {Math.round(value)}
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '1px' }}>
          {unit}
        </span>
      </p>
    </div>
  )
}

/* ── Styles ──────────────────────────────────────────────────────────────── */
const page: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  maxWidth: '480px',
  margin: '0 auto',
  width: '100%',
}

const headerWrap: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  paddingTop: '0.25rem',
}

const greetLabel: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.62rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  margin: 0,
}

const greetName: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 900,
  fontSize: '2.4rem',
  letterSpacing: '0.02em',
  color: 'var(--text-primary)',
  margin: '2px 0 0',
  lineHeight: 1,
  textTransform: 'uppercase',
}

const orgChip: CSSProperties = {
  display: 'inline-block',
  margin: '6px 0 0',
  padding: '2px 8px',
  background: 'var(--neon-dim)',
  border: '1px solid var(--neon-border)',
  borderRadius: '100px',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.58rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-neon)',
}

const avatarBtn: CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  background: 'var(--bg-card)',
  border: '1.5px solid var(--neon-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
  transition: 'all 0.2s ease',
}

const ringCard: CSSProperties = {
  padding: '1.5rem 1rem 1.25rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
}

const macroRow: CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  width: '100%',
}

const targetHint: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  textAlign: 'center',
}

const workoutBanner: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1rem 1.125rem',
  background: 'linear-gradient(135deg, rgba(255,107,53,0.12) 0%, rgba(255,107,53,0.04) 100%)',
  border: '1px solid var(--energy-border)',
  borderRadius: 'var(--radius-lg)',
  textDecoration: 'none',
  transition: 'all 0.2s var(--ease-out)',
}

const workoutLeft: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
}

const workoutIcon: CSSProperties = {
  fontSize: '1.5rem',
  lineHeight: 1,
}

const workoutTitle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
}

const workoutSub: CSSProperties = {
  margin: '2px 0 0',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.62rem',
  color: 'var(--text-muted)',
  letterSpacing: '0.04em',
}

const workoutArrow: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '1rem',
  color: 'var(--energy)',
}

const sectionLabel: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
}

const mealRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.875rem 1rem',
  background: 'var(--bg-card)',
  border: '1px solid var(--neon-border)',
  borderRadius: 'var(--radius-md)',
  textDecoration: 'none',
  color: 'inherit',
  transition: 'border-color 0.2s ease, background 0.2s ease',
}

const mealLeft: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
}

const mealIconWrap: CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: 'var(--radius-sm)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s ease',
}

const mealName: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
}

const mealSub: CSSProperties = {
  margin: '2px 0 0',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.6rem',
  color: 'var(--text-muted)',
  letterSpacing: '0.04em',
}

const mealAction: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--neon)',
}

const progressDot: CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  boxShadow: '0 0 6px rgba(0,255,46,0.6)',
}

const trainerCard: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.875rem 1rem',
  background: 'var(--gold-dim)',
  border: '1px solid var(--gold-border)',
  borderRadius: 'var(--radius-md)',
}

const trainerLeft: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
}

const trainerAvatar: CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  background: 'var(--gold-dim)',
  border: '1.5px solid var(--gold-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-display)',
  fontWeight: 800,
  fontSize: '1rem',
  color: 'var(--gold)',
}

const trainerLabel: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.58rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--gold)',
  opacity: 0.7,
}

const trainerName: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
}
