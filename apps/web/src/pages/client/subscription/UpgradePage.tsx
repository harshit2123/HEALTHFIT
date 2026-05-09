import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientApi } from '../../../lib/clientApi'

const PREMIUM_PLANS = [
  { months: 1, priceInr: 299, label: '1 month', perMonth: 299 },
  { months: 3, priceInr: 799, label: '3 months', perMonth: 266, savings: '11% off' },
  { months: 12, priceInr: 2499, label: '12 months', perMonth: 208, savings: '30% off', popular: true },
]

const PREMIUM_BENEFITS = [
  'Advanced health analytics + trends',
  'Unlimited workout history',
  'Goal-based meal recommendations',
  'Wearable sync (Apple Health, Garmin)',
  'Export your data anytime',
  'Priority support',
]

export function UpgradePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedMonths, setSelectedMonths] = useState(12)

  const { data: sub } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: clientApi.getSubscription,
  })

  const mutation = useMutation({
    mutationFn: (months: number) => clientApi.upgradeToPremium(months),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] })
      navigate('/client')
    },
  })

  const isAlreadyPremium = sub?.tier === 'PREMIUM'

  return (
    <div style={{ maxWidth: '720px' }}>
      <Link to="/client" style={{ color: '#10b981', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to dashboard</Link>

      <h1 style={{ marginTop: '1rem' }}>
        {isAlreadyPremium ? 'Extend your premium' : 'Upgrade to Premium'}
      </h1>
      <p style={{ color: '#6b7280' }}>
        {sub?.tier === 'TRIAL' && sub.daysRemaining !== null
          ? `${sub.daysRemaining} days left in your free trial.`
          : 'Unlock advanced features and stay on track.'}
      </p>

      {/* Benefits */}
      <section style={{ marginTop: '2rem', padding: '1.5rem', background: '#ecfdf5', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', textTransform: 'uppercase', color: '#065f46' }}>What you get</h3>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {PREMIUM_BENEFITS.map((b) => (
            <li key={b} style={{ padding: '0.375rem 0', fontSize: '0.875rem' }}>
              <span style={{ color: '#10b981', marginRight: '0.5rem' }}>✓</span>
              {b}
            </li>
          ))}
        </ul>
      </section>

      {/* Plan picker */}
      <section style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Choose your plan</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {PREMIUM_PLANS.map((plan) => (
            <button
              key={plan.months}
              onClick={() => setSelectedMonths(plan.months)}
              style={{
                padding: '1.25rem',
                border: selectedMonths === plan.months ? '2px solid #10b981' : '2px solid #e5e7eb',
                borderRadius: '8px',
                background: selectedMonths === plan.months ? '#ecfdf5' : 'white',
                cursor: 'pointer',
                position: 'relative',
                textAlign: 'left',
              }}
            >
              {plan.popular && (
                <span style={{ position: 'absolute', top: '-0.625rem', right: '0.75rem', padding: '0.125rem 0.5rem', background: '#10b981', color: 'white', borderRadius: '999px', fontSize: '0.625rem', fontWeight: 600 }}>
                  POPULAR
                </span>
              )}
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>{plan.label}</p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '1.5rem', fontWeight: 700 }}>
                ₹{plan.priceInr.toLocaleString('en-IN')}
              </p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                ₹{plan.perMonth}/month{plan.savings ? ` · ${plan.savings}` : ''}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Payment placeholder */}
      <section style={{ marginTop: '2rem', padding: '1rem', background: '#fef3c7', borderRadius: '8px', fontSize: '0.875rem', color: '#92400e' }}>
        <strong>Payment integration coming in Phase 4.</strong> For now, clicking &ldquo;Upgrade&rdquo; activates premium without charging.
      </section>

      {mutation.isError && (
        <p style={{ color: '#dc2626', marginTop: '1rem' }}>
          {(mutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Upgrade failed'}
        </p>
      )}

      <button
        onClick={() => mutation.mutate(selectedMonths)}
        disabled={mutation.isPending}
        style={{
          marginTop: '1.5rem',
          width: '100%',
          padding: '1rem',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 600,
        }}
      >
        {mutation.isPending
          ? 'Activating…'
          : `${isAlreadyPremium ? 'Extend' : 'Upgrade'} for ${selectedMonths} month${selectedMonths === 1 ? '' : 's'}`}
      </button>
    </div>
  )
}
