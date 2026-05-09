import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../../../lib/adminApi'

interface Props {
  memberId: string
  hasExistingSub: boolean
  onSuccess?: () => void
}

export function AssignSubscriptionForm({ memberId, hasExistingSub, onSuccess }: Props) {
  const queryClient = useQueryClient()
  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => adminApi.listPlans(),
  })

  const [planId, setPlanId] = useState('')
  const [amountPaid, setAmountPaid] = useState('')

  const mutation = useMutation({
    mutationFn: (data: { planId: string; amountPaidInr: number }) =>
      adminApi.assignSubscription(memberId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', memberId] })
      queryClient.invalidateQueries({ queryKey: ['member-subscriptions'] })
      setPlanId('')
      setAmountPaid('')
      onSuccess?.()
    },
  })

  const selectedPlan = plans?.find((p) => p.id === planId)

  function handleSelectPlan(id: string) {
    setPlanId(id)
    const plan = plans?.find((p) => p.id === id)
    if (plan && !amountPaid) {
      setAmountPaid(String(plan.priceInr))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!planId) return
    mutation.mutate({ planId, amountPaidInr: Number(amountPaid) })
  }

  if (isLoading) return <p>Loading plans…</p>
  if (!plans || plans.length === 0) {
    return (
      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
        No active plans. <a href="/admin/subscriptions/new">Create one</a> first.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
        Plan
        <select
          value={planId}
          onChange={(e) => handleSelectPlan(e.target.value)}
          required
          style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
        >
          <option value="">Select a plan…</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — ₹{Number(p.priceInr).toLocaleString('en-IN')} · {p.durationDays}d
            </option>
          ))}
        </select>
      </label>

      <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
        Amount paid (INR)
        <input
          type="number"
          min={0}
          step="1"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          required
          style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #d1d5db', borderRadius: '6px', boxSizing: 'border-box' }}
        />
      </label>

      {selectedPlan && (
        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
          {hasExistingSub
            ? `Will extend current subscription by ${selectedPlan.durationDays} days.`
            : `Starts today, expires in ${selectedPlan.durationDays} days.`}
        </p>
      )}

      {mutation.isError && (
        <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>
          {(mutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to assign'}
        </p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending || !planId}
        style={{ padding: '0.625rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}
      >
        {mutation.isPending ? 'Saving…' : hasExistingSub ? 'Renew subscription' : 'Assign subscription'}
      </button>
    </form>
  )
}
