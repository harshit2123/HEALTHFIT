import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../../lib/adminApi'

export function TrainersList() {
  const { data: trainers, isLoading } = useQuery({
    queryKey: ['trainers'],
    queryFn: adminApi.listTrainers,
  })

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Trainers</h1>
        <Link to="/admin/trainers/new" style={{ padding: '0.625rem 1rem', background: '#6366f1', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '0.875rem' }}>
          + Add trainer
        </Link>
      </header>

      {isLoading ? (
        <p>Loading…</p>
      ) : !trainers || trainers.length === 0 ? (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '3rem' }}>
          No trainers yet. Add your first trainer to assign members.
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Members</Th>
              <Th>Joined</Th>
            </tr>
          </thead>
          <tbody>
            {trainers.map((t) => (
              <tr key={t.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                <Td>{t.name}</Td>
                <Td>{t.email}</Td>
                <Td>{t._count.trainerAssignments}</Td>
                <Td>{new Date(t.createdAt).toLocaleDateString('en-IN')}</Td>
              </tr>
            ))}
          </tbody>
        </table>
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
