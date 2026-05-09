import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi, type ConversionLeaderboardEntry } from '../../lib/adminApi'

type Range = 'ALL' | '30D' | '7D'

function rangeToSince(range: Range): string | undefined {
  if (range === 'ALL') return undefined
  const days = range === '30D' ? 30 : 7
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

/**
 * Owner-only: see who's bringing in members.
 * Trainers ranked by # of members they added.
 * Filter by date range to see "this week" or "this month" performance.
 */
export function ConversionsPage() {
  const [range, setRange] = useState<Range>('30D')

  const { data, isLoading } = useQuery({
    queryKey: ['conversions', range],
    queryFn: () => adminApi.getConversions(rangeToSince(range)),
  })

  const totalNew = data?.reduce((sum, e) => sum + e.membersAdded, 0) ?? 0
  const trainerEntries = data?.filter((e) => e.creatorRole === 'TRAINER') ?? []
  const ownerEntries = data?.filter((e) => e.creatorRole === 'ORG_OWNER') ?? []
  const trainerTotal = trainerEntries.reduce((sum, e) => sum + e.membersAdded, 0)

  return (
    <div>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Conversions</h1>
        <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
          Who's bringing in new members
        </p>
      </header>

      {/* Range tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {(['7D', '30D', 'ALL'] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            style={{
              padding: '0.4rem 0.875rem',
              background: range === r ? '#6366f1' : 'white',
              color: range === r ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {r === '7D' ? 'Last 7 days' : r === '30D' ? 'Last 30 days' : 'All time'}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <SummaryCard label="New members" value={totalNew} color="#6366f1" />
        <SummaryCard label="Brought in by trainers" value={trainerTotal} color="#10b981" />
        <SummaryCard
          label="Trainer share"
          value={totalNew > 0 ? `${Math.round((trainerTotal / totalNew) * 100)}%` : '—'}
          color="#f59e0b"
        />
      </section>

      {/* Leaderboard */}
      {isLoading ? (
        <p>Loading…</p>
      ) : !data || data.length === 0 ? (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '3rem' }}>
          No member additions in this range yet.
        </p>
      ) : (
        <>
          {trainerEntries.length > 0 && (
            <LeaderboardTable title="Trainers" entries={trainerEntries} />
          )}
          {ownerEntries.length > 0 && (
            <div style={{ marginTop: trainerEntries.length > 0 ? '2rem' : 0 }}>
              <LeaderboardTable title="Self-added (Owner)" entries={ownerEntries} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color: string
}) {
  return (
    <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>{label}</p>
      <p style={{ margin: '0.5rem 0 0', fontSize: '2rem', fontWeight: 700, color }}>{value}</p>
    </div>
  )
}

function LeaderboardTable({
  title,
  entries,
}: {
  title: string
  entries: ConversionLeaderboardEntry[]
}) {
  return (
    <div>
      <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>
        {title}
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        <thead style={{ background: '#f9fafb' }}>
          <tr>
            <Th>Rank</Th>
            <Th>Name</Th>
            <Th>Members added</Th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, idx) => (
            <tr key={e.creatorId} style={{ borderTop: '1px solid #f3f4f6' }}>
              <Td>
                <RankPill rank={idx + 1} />
              </Td>
              <Td>{e.creatorName}</Td>
              <Td>
                <strong>{e.membersAdded}</strong>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RankPill({ rank }: { rank: number }) {
  const bg = rank === 1 ? '#fef3c7' : rank === 2 ? '#f3f4f6' : rank === 3 ? '#fde6d3' : '#f9fafb'
  const color = rank === 1 ? '#92400e' : rank === 2 ? '#374151' : rank === 3 ? '#9a3412' : '#6b7280'
  return (
    <span style={{ display: 'inline-block', minWidth: '24px', padding: '0.125rem 0.5rem', background: bg, color, borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center' }}>
      #{rank}
    </span>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{children}</td>
}
