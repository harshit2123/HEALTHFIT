import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
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

/**
 * Cal AI / HealthifyMe-inspired home:
 * - Streak chip + greeting (compact)
 * - Calorie ring (dominant)
 * - Macro pills
 * - Today's meal timeline (inline + buttons → /client/calories)
 * - Workout card
 *
 * No FAB here — handled by ClientPortal layout.
 */
export function ClientDashboard() {
  const { user } = useAuthStore()
  const today = new Date().toISOString().slice(0, 10)

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: clientApi.getProfile,
  })
  const { data: todayCalories } = useQuery({
    queryKey: ['calories', today],
    queryFn: () => calorieApi.getDaily(today),
  })
  const { data: target } = useQuery({
    queryKey: ['calorie-target'],
    queryFn: calorieApi.getDailyTarget,
  })
  const { data: streak } = useQuery({
    queryKey: ['streak'],
    queryFn: calorieApi.getStreak,
  })
  const { data: todayWorkouts } = useQuery({
    queryKey: ['workouts', 'day', today],
    queryFn: () => workoutApi.getDay(today),
  })

  const consumed = todayCalories?.summary.calories ?? 0
  const protein = todayCalories?.summary.proteinG ?? 0
  const carbs = todayCalories?.summary.carbsG ?? 0
  const fat = todayCalories?.summary.fatG ?? 0

  const isB2C = user?.accountType === 'B2C'
  const greeting = getGreeting()
  const firstName = user?.name?.split(' ')[0] ?? ''

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Header: streak + greeting */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
            {greeting}, {firstName}
          </h1>
          {!isB2C && profile?.org?.name && (
            <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
              Member at {profile.org.name}
            </p>
          )}
        </div>
        {streak && <StreakChip days={streak.streakDays} isActiveToday={streak.isActiveToday} />}
      </header>

      {/* Calorie ring + macros */}
      <section
        style={{
          padding: '1.5rem 1rem',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          marginBottom: '1.25rem',
        }}
      >
        <CalorieRing consumed={consumed} target={target?.dailyCalorieTarget ?? null} size={220} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '1.25rem' }}>
          <MacroPill label="Protein" value={protein} unit="g" color="#6366f1" />
          <MacroPill label="Carbs" value={carbs} unit="g" color="#f59e0b" />
          <MacroPill label="Fat" value={fat} unit="g" color="#dc2626" />
        </div>

        {!target?.dailyCalorieTarget && (
          <p style={{ margin: '1rem 0 0', textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af' }}>
            <Link to="/client/profile" style={{ color: '#10b981' }}>
              Set age, height, weight
            </Link>{' '}
            to calculate daily target
          </p>
        )}
      </section>

      {/* Today's meals */}
      <section style={{ marginBottom: '1.25rem' }}>
        <h2 style={sectionHeading}>Today's meals</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {MEAL_ORDER.map((meal) => {
            const mealCal = todayCalories?.summary.byMeal[meal]?.calories ?? 0
            const entries = todayCalories?.summary.byMeal[meal]?.entries ?? 0
            const meta = MEAL_META[meal]
            return (
              <Link
                key={meal}
                to="/client/calories"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.875rem 1rem',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{meta.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>{meta.label}</p>
                    {entries > 0 && (
                      <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                        {Math.round(mealCal)} kcal · {entries} item{entries === 1 ? '' : 's'}
                      </p>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981' }}>
                  {entries > 0 ? '→' : '+ Add'}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Workout card */}
      <section style={{ marginBottom: '1.25rem' }}>
        <h2 style={sectionHeading}>Today's workout</h2>
        <Link
          to="/client/workouts"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{ fontSize: '1.5rem' }}>💪</span>
            <div>
              {todayWorkouts && todayWorkouts.length > 0 ? (
                <>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>
                    {todayWorkouts.length} workout{todayWorkouts.length === 1 ? '' : 's'} ·{' '}
                    {todayWorkouts.reduce((s, w) => s + w.durationMin, 0)} min
                  </p>
                  <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                    {todayWorkouts.flatMap((w) => w.exercises.flatMap((e) => e.sets)).length} sets logged
                  </p>
                </>
              ) : (
                <>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem' }}>No workout logged yet</p>
                  <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                    Tap to log
                  </p>
                </>
              )}
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981' }}>
            {todayWorkouts && todayWorkouts.length > 0 ? '→' : '+ Log'}
          </span>
        </Link>
      </section>

      {/* Trainer info for B2B members */}
      {!isB2C && profile?.assignedToTrainer?.[0]?.trainer && (
        <div
          style={{
            padding: '0.875rem 1rem',
            background: '#eef2ff',
            borderRadius: '10px',
            fontSize: '0.875rem',
          }}
        >
          <strong>Your trainer:</strong> {profile.assignedToTrainer[0].trainer.name}
        </div>
      )}
    </div>
  )
}

function MacroPill({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div
      style={{
        padding: '0.625rem',
        background: '#f9fafb',
        borderRadius: '8px',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.625rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>
        {label}
      </p>
      <p style={{ margin: '0.25rem 0 0', fontWeight: 700, color }}>
        {Math.round(value)}
        <span style={{ fontSize: '0.625rem', color: '#9ca3af', fontWeight: 400 }}>{unit}</span>
      </p>
    </div>
  )
}

const sectionHeading = {
  margin: '0 0 0.625rem',
  fontSize: '0.75rem',
  textTransform: 'uppercase' as const,
  color: '#9ca3af',
  fontWeight: 600,
  letterSpacing: '0.04em',
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
