import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../../lib/adminApi'
import { useAuthStore } from '../../../store/authStore'

export function MembersList() {
  const { user } = useAuthStore()
  const isOwner = user?.role === 'ORG_OWNER'
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['members', { page, search }],
    queryFn: () => adminApi.listMembers({ page, search: search || undefined }),
  })

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>{isOwner ? 'Members' : 'My Members'}</h1>
          {data && <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>{data.total} total</p>}
        </div>
        <Link
          to="/admin/members/new"
          style={{ padding: '0.625rem 1rem', background: '#6366f1', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '0.875rem' }}
        >
          + Add member
        </Link>
      </header>

      <input
        type="search"
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        style={{ width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '1rem' }}
      />

      {isLoading ? (
        <p>Loading…</p>
      ) : !data || data.members.length === 0 ? (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '3rem' }}>
          {search
            ? 'No members match your search.'
            : isOwner
              ? 'No members yet. Add your first member to get started.'
              : 'No members assigned to you yet. Add a member to start tracking conversions.'}
        </p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Plan</Th>
                <Th>Trainer</Th>
                <Th>Joined</Th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((m) => (
                <tr key={m.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <Td>
                    <Link to={`/admin/members/${m.id}`} style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
                      {m.name}
                    </Link>
                  </Td>
                  <Td>{m.email}</Td>
                  <Td>{m.memberSub?.plan?.name ?? '—'}</Td>
                  <Td>{m.assignedToTrainer[0]?.trainer?.name ?? '—'}</Td>
                  <Td>{new Date(m.createdAt).toLocaleDateString('en-IN')}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.total > data.limit && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
              <span style={{ padding: '0.5rem' }}>
                Page {page} of {Math.ceil(data.total / data.limit)}
              </span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * data.limit >= data.total}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{children}</td>
}
