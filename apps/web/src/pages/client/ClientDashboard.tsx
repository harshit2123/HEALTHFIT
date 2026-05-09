import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { clientApi, calorieApi } from '../../lib/clientApi'

export function ClientDashboard() {
  const { user } = useAuthStore()
  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: clientApi.getProfile,
  })

  const today = new Date().toISOString().slice(0, 10)
  const { data: todayCalories } = useQuery({
    queryKey: ['calories', today],
    queryFn: () => calorieApi.getDaily(today),
  })

  const { data: target } = useQuery({
    queryKey: ['calorie-target'],
    queryFn: calorieApi.getDailyTarget,
  })

  const isB2C = user?.accountType === 'B2C'
  const greeting = getGreeting()

  return (
    <div>
      <h1 style={{ margin: 0 }}>
        {greeting}, {user?.name?.split(' ')[0]}
      </h1>
      <p style={{ color: '#6b7280' }}>
        {isB2C
          ? 'Track your fitness, hit your goals.'
          : profile?.org?.name
            ? `Member at ${profile.org.name}`
            : 'Welcome back'}
      </p>

      {/* Trainer info for B2B members */}
      {!isB2C && profile?.assignedToTrainer?.[0]?.trainer && (
        <div style={{ padding: '1rem', background: '#eef2ff', borderRadius: '8px', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          <strong>Your trainer:</strong> {profile.assignedToTrainer[0].trainer.name} · {profile.assignedToTrainer[0].trainer.email}
        </div>
      )}

      {/* Quick stats */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem' }}>
        <StatCard label="Workouts this week" value="—" hint="Phase 6" color="#10b981" />
        <StatCard
          label="Calories today"
          value={Math.round(todayCalories?.summary.calories ?? 0)}
          hint={target?.dailyCalorieTarget ? `of ${target.dailyCalorieTarget} target` : 'set profile for target'}
          color="#f59e0b"
        />
        <StatCard label="Goal progress" value="—" hint="Phase 7" color="#6366f1" />
      </section>

      {/* Quick actions */}
      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem' }}>Quick actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
          <ActionCard to="/client/workouts" title="Log workout" description="Track today's exercise" />
          <ActionCard to="/client/calories" title="Log meal" description="Track what you ate" />
          <ActionCard to="/client/goals" title="Set goal" description="Define your target" />
          <ActionCard to="/client/analytics" title="View progress" description="See your trends" />
        </div>
      </section>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function StatCard({ label, value, hint, color }: { label: string; value: string | number; hint?: string; color: string }) {
  return (
    <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>{label}</p>
      <p style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 700, color }}>{value}</p>
      {hint && <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>{hint}</p>}
    </div>
  )
}

function ActionCard({ to, title, description }: { to: string; title: string; description: string }) {
  return (
    <Link
      to={to}
      style={{
        padding: '1.25rem',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        background: 'white',
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        transition: 'border-color 0.15s',
      }}
    >
      <h3 style={{ margin: 0, fontSize: '1rem' }}>{title}</h3>
      <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>{description}</p>
    </Link>
  )
}
