import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../../lib/adminApi'

type FilterStatus = 'ALL' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'CANCELLED'

export function MemberSubscriptions() {
  const [filter, setFilter] = useState<FilterStatus>('ALL')

  const { data: subs, isLoading } = useQuery({
    queryKey: ['member-subscriptions', filter],
    queryFn: () =>
      adminApi.listMemberSubscriptions(
        filter === 'ALL' ? undefined : { status: filter as Exclude<FilterStatus, 'ALL'> }
      ),
  })

  const counts = {
    ALL: subs?.length ?? 0,
    EXPIRING: subs?.filter((s) => s.status === 'EXPIRING').length ?? 0,
  }

  return (
    <div>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Member subscriptions</h1>
        <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
          Track active, expiring, and expired memberships
        </p>
      </header>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
        {(['ALL', 'ACTIVE', 'EXPIRING', 'EXPIRED', 'CANCELLED'] as FilterStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: filter === s ? '2px solid #6366f1' : '2px solid transparent',
              color: filter === s ? '#6366f1' : '#6b7280',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: filter === s ? 600 : 400,
            }}
          >
            {s}
            {s === 'EXPIRING' && counts.EXPIRING > 0 && (
              <span style={{ marginLeft: '0.5rem', padding: '0.125rem 0.4rem', background: '#fef3c7', color: '#92400e', borderRadius: '999px', fontSize: '0.625rem', fontWeight: 600 }}>
                {counts.EXPIRING}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p>Loading…</p>
      ) : !subs || subs.length === 0 ? (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '3rem' }}>
          No subscriptions in this view.
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <Th>Member</Th>
              <Th>Plan</Th>
              <Th>Status</Th>
              <Th>Expires</Th>
              <Th>Paid</Th>
            </tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                <Td>
                  <Link to={`/admin/members/${s.member.id}`} style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
                    {s.member.name}
                  </Link>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{s.member.email}</div>
                </Td>
                <Td>{s.plan.name}</Td>
                <Td><StatusBadge status={s.status} /></Td>
                <Td>
                  {new Date(s.expiresAt).toLocaleDateString('en-IN')}
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    {daysFromNow(s.expiresAt)}
                  </div>
                </Td>
                <Td>₹{Number(s.amountPaidInr).toLocaleString('en-IN')}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'CANCELLED' }) {
  const config = {
    ACTIVE: { bg: '#dcfce7', color: '#166534' },
    EXPIRING: { bg: '#fef3c7', color: '#92400e' },
    EXPIRED: { bg: '#fee2e2', color: '#991b1b' },
    CANCELLED: { bg: '#f3f4f6', color: '#6b7280' },
  }[status]

  return (
    <span style={{ padding: '0.125rem 0.5rem', background: config.bg, color: config.color, borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
      {status}
    </span>
  )
}

function daysFromNow(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  return `in ${diffDays} days`
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{children}</td>
}
