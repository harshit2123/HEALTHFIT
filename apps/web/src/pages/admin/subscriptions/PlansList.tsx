import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../../lib/adminApi'

export function PlansList() {
  const queryClient = useQueryClient()
  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => adminApi.listPlans(),
  })

  const archiveMutation = useMutation({
    mutationFn: adminApi.archivePlan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  })

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Subscription plans</h1>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
            Define plans your members can subscribe to
          </p>
        </div>
        <Link to="/admin/subscriptions/new" style={btnPrimary}>
          + Create plan
        </Link>
      </header>

      {isLoading ? (
        <p>Loading…</p>
      ) : !plans || plans.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', border: '2px dashed #e5e7eb', borderRadius: '8px' }}>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>No plans yet.</p>
          <Link to="/admin/subscriptions/new" style={btnPrimary}>Create your first plan</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {plans.map((plan) => (
            <div key={plan.id} style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{plan.name}</h3>
                {!plan.isActive && (
                  <span style={{ padding: '0.125rem 0.5rem', background: '#f3f4f6', color: '#6b7280', borderRadius: '999px', fontSize: '0.75rem' }}>
                    Archived
                  </span>
                )}
              </div>
              {plan.description && (
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.5rem 0 1rem' }}>{plan.description}</p>
              )}
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#6366f1' }}>
                ₹{Number(plan.priceInr).toLocaleString('en-IN')}
              </p>
              <p style={{ margin: '0.25rem 0 1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                for {plan.durationDays} days
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>
                {plan._count?.subscriptions ?? 0} active members
                {plan.memberCapacity && ` · capacity ${plan.memberCapacity}`}
              </p>
              {plan.isActive && (
                <button
                  onClick={() => {
                    if (confirm('Archive this plan? Existing subscribers stay active until expiry.')) {
                      archiveMutation.mutate(plan.id)
                    }
                  }}
                  style={{ marginTop: '1rem', padding: '0.4rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer', background: 'white', border: '1px solid #d1d5db', borderRadius: '4px' }}
                >
                  Archive
                </button>
              )}
            </div>
          ))}
        </div>
      )}
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
  border: 'none',
  cursor: 'pointer' as const,
}
