import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../lib/adminApi'
import { useAuthStore } from '../../store/authStore'

export function AdminDashboard() {
  const { user } = useAuthStore()
  const isOwner = user?.role === 'ORG_OWNER'

  const { data: org, isLoading } = useQuery({
    queryKey: ['org'],
    queryFn: adminApi.getOrg,
    enabled: isOwner,
  })

  const { data: expiringSoon } = useQuery({
    queryKey: ['member-subscriptions', { status: 'EXPIRING' }],
    queryFn: () => adminApi.listMemberSubscriptions({ status: 'EXPIRING' }),
    enabled: isOwner,
  })

  const { data: myMembers } = useQuery({
    queryKey: ['my-members'],
    queryFn: adminApi.getMyMembers,
    enabled: !isOwner,
  })

  if (isOwner) {
    return (
      <div>
        <h1 style={{ margin: 0 }}>{isLoading ? 'Loading…' : org?.name}</h1>
        <p style={{ color: '#6b7280' }}>Gym overview</p>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem' }}>
          <StatCard label="Active members" value={org?._count?.members ?? 0} color="#6366f1" />
          <StatCard label="Subscription plans" value={org?._count?.subscriptionPlans ?? 0} color="#10b981" />
          <StatCard
            label="Expiring soon"
            value={expiringSoon?.length ?? 0}
            color={expiringSoon && expiringSoon.length > 0 ? '#dc2626' : '#9ca3af'}
            hint={expiringSoon && expiringSoon.length > 0 ? 'Within 7 days' : 'All clear'}
          />
        </section>

        {expiringSoon && expiringSoon.length > 0 && (
          <section style={{ marginTop: '1.5rem', padding: '1rem', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
            <strong style={{ color: '#92400e' }}>{expiringSoon.length} subscription{expiringSoon.length === 1 ? '' : 's'} expiring soon.</strong>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#92400e' }}>
              <Link to="/admin/member-subscriptions" style={{ color: '#92400e' }}>Review and renew →</Link>
            </p>
          </section>
        )}

        <section style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.125rem' }}>Quick actions</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            <Link to="/admin/members/new" style={btnPrimary}>+ Add member</Link>
            <Link to="/admin/subscriptions/new" style={btnSecondary}>+ Create plan</Link>
            <Link to="/admin/trainers/new" style={btnSecondary}>+ Add trainer</Link>
          </div>
        </section>
      </div>
    )
  }

  // Trainer dashboard
  const myCount = Array.isArray(myMembers) ? myMembers.length : 0

  return (
    <div>
      <h1 style={{ margin: 0 }}>Welcome, {user?.name}</h1>
      <p style={{ color: '#6b7280' }}>Members assigned to you</p>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(200px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
        <StatCard label="Your assigned members" value={myCount} color="#10b981" />
        <StatCard label="New this month" value="—" hint="Coming with analytics" color="#6366f1" />
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem' }}>Quick actions</h2>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          <Link to="/admin/members/new" style={btnPrimary}>+ Add member</Link>
          <Link to="/admin/members" style={btnSecondary}>View my members</Link>
        </div>
        <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#9ca3af' }}>
          Members you add are automatically assigned to you.
        </p>
      </section>
    </div>
  )
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

const btnPrimary = {
  padding: '0.625rem 1rem',
  background: '#6366f1',
  color: 'white',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '0.875rem',
}
const btnSecondary = {
  padding: '0.625rem 1rem',
  background: 'white',
  color: '#374151',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '0.875rem',
}
