import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { CSSProperties } from 'react'
import { useAuthStore } from '../../store/authStore'
import { clientApi, calorieApi, workoutApi, type MealType } from '../../lib/clientApi'
import { CalorieRing } from '../../components/ui/CalorieRing'
import { StreakChip } from '../../components/ui/StreakChip'

const MEAL_ORDER: MealType[] = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']
const MEAL_META: Record<MealType, { label: string; icon: string }> = {
  BREAKFAST: { label: 'Breakfast', icon: '☀️' },
  LUNCH: { label: 'Lunch', icon: '🌤️' },
  SNACKS: { label: 'Snacks', icon: '🍎' },
  DINNER: { label: 'Dinner', icon: '🌙' },
}

export function ClientDashboard() {
  const { user } = useAuthStore()
  const today = new Date().toISOString().slice(0, 10)

  const { data: profile } = useQuery({ queryKey: ['my-profile'], queryFn: clientApi.getProfile })
  const { data: todayCalories } = useQuery({ queryKey: ['calories', today], queryFn: () => calorieApi.getDaily(today) })
  const { data: target } = useQuery({ queryKey: ['calorie-target'], queryFn: calorieApi.getDailyTarget })
  const { data: streak } = useQuery({ queryKey: ['streak'], queryFn: calorieApi.getStreak })
  const { data: todayWorkouts } = useQuery({ queryKey: ['workouts', 'day', today], queryFn: () => workoutApi.getDay(today) })

  const consumed = todayCalories?.summary.calories ?? 0
  const protein = todayCalories?.summary.proteinG ?? 0
  const carbs = todayCalories?.summary.carbsG ?? 0
  const fat = todayCalories?.summary.fatG ?? 0
  const isB2C = user?.accountType === 'B2C'
  const firstName = user?.name?.split(' ')[0] ?? ''

  return (
    <div style={page}>
      <header style={pageHeader} className="sf-animate-in">
        <div>
          <h1 style={greetingText}>
            {getGreeting()},{' '}
            <span style={{ color: 'var(--neon)' }}>{firstName}</span>
          </h1>
          {!isB2C && profile?.org?.name && (
            <p style={orgLabel}>Member at {profile.org.name}</p>
          )}
        </div>
        {streak && <StreakChip days={streak.streakDays} isActiveToday={streak.isActiveToday} />}
      </header>

      <section className="sf-card sf-animate-in" style={ringCard}>
        <CalorieRing consumed={consumed} target={target?.dailyCalorieTarget ?? null} size={200} />
        <div style={macroGrid}>
          <MacroPill label="Protein" value={protein} unit="g" color="var(--neon)" />
          <MacroPill label="Carbs" value={carbs} unit="g" color="var(--text-primary)" />
          <MacroPill label="Fat" value={fat} unit="g" color="var(--text-secondary)" />
        </div>
        {!target?.dailyCalorieTarget && (
          <p style={targetHint}>
            <Link to="/client/profile" style={{ color: 'var(--neon)', textDecoration: 'none' }}>
              Set age / height / weight
            </Link>{' '}
            to calculate daily target
          </p>
        )}
      </section>

      <section style={sectionWrap} className="sf-animate-in">
        <p style={sectionLabel}>Today's meals</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {MEAL_ORDER.map((meal) => {
            const mealCal = todayCalories?.summary.byMeal[meal]?.calories ?? 0
            const entries = todayCalories?.summary.byMeal[meal]?.entries ?? 0
            const meta = MEAL_META[meal]
            return (
              <Link key={meal} to="/client/calories" style={mealRow}>
                <div style={mealLeft}>
                  <span style={{ fontSize: '1.25rem' }}>{meta.icon}</span>
                  <div>
                    <p style={mealName}>{meta.label}</p>
                    {entries > 0 && (
                      <p style={mealSub}>{Math.round(mealCal)} kcal · {entries} item{entries === 1 ? '' : 's'}</p>
                    )}
                  </div>
                </div>
                <span style={mealAction}>{entries > 0 ? '→' : '+ Add'}</span>
              </Link>
            )
          })}
        </div>
      </section>

      <section style={sectionWrap} className="sf-animate-in">
        <p style={sectionLabel}>Today's workout</p>
        <Link to="/client/workouts" style={mealRow}>
          <div style={mealLeft}>
            <span style={{ fontSize: '1.25rem' }}>💪</span>
            <div>
              {todayWorkouts && todayWorkouts.length > 0 ? (
                <>
                  <p style={mealName}>{todayWorkouts.length} workout{todayWorkouts.length === 1 ? '' : 's'} · {todayWorkouts.reduce((s, w) => s + w.durationMin, 0)} min</p>
                  <p style={mealSub}>{todayWorkouts.flatMap((w) => w.exercises.flatMap((e) => e.sets)).length} sets logged</p>
                </>
              ) : (
                <>
                  <p style={mealName}>No workout logged yet</p>
                  <p style={mealSub}>Tap to log your session</p>
                </>
              )}
            </div>
          </div>
          <span style={mealAction}>{todayWorkouts && todayWorkouts.length > 0 ? '→' : '+ Log'}</span>
        </Link>
      </section>

      {!isB2C && profile?.assignedToTrainer?.[0]?.trainer && (
        <div style={trainerBadge} className="sf-animate-in">
          <span style={trainerLabel}>Trainer</span>
          <span style={trainerName}>{profile.assignedToTrainer[0].trainer.name}</span>
        </div>
      )}
    </div>
  )
}

function MacroPill({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div style={macroPill}>
      <p style={macroLabel}>{label}</p>
      <p style={{ margin: '0.25rem 0 0', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1, color }}>
        {Math.round(value)}<span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: '1px', fontWeight: 400 }}>{unit}</span>
      </p>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const page: CSSProperties = { maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }
const pageHeader: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
const greetingText: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.01em', color: 'var(--text-primary)', margin: 0 }
const orgLabel: CSSProperties = { margin: '0.2rem 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }
const ringCard: CSSProperties = { padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }
const macroGrid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', width: '100%' }
const macroPill: CSSProperties = { padding: '0.625rem', background: 'var(--bg-muted)', border: '1px solid var(--neon-border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }
const macroLabel: CSSProperties = { margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }
const targetHint: CSSProperties = { margin: 0, fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }
const sectionWrap: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.5rem' }
const sectionLabel: CSSProperties = { margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }
const mealRow: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--neon-border)', borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'inherit', transition: 'border-color 0.2s ease' }
const mealLeft: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.625rem' }
const mealName: CSSProperties = { margin: 0, fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }
const mealSub: CSSProperties = { margin: '0.125rem 0 0', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }
const mealAction: CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--neon)', letterSpacing: '0.04em' }
const trainerBadge: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem 1rem', background: 'var(--neon-dim)', border: '1px solid var(--neon-border)', borderRadius: 'var(--radius-md)' }
const trainerLabel: CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-neon)' }
const trainerName: CSSProperties = { fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }
