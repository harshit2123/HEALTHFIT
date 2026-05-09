import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../../lib/adminApi'
import { useAuthStore } from '../../../store/authStore'
import { AssignSubscriptionForm } from '../subscriptions/AssignSubscriptionForm'

export function MemberDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const isOwner = user?.role === 'ORG_OWNER'
  const [showAssign, setShowAssign] = useState(false)

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => adminApi.getMember(id!),
    enabled: !!id,
  })

  if (isLoading) return <p>Loading…</p>
  if (!member) return <p>Member not found</p>

  const hasSub = !!member.memberSub
  const subStatus = member.memberSub?.status as 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'CANCELLED' | undefined

  return (
    <div style={{ maxWidth: '720px' }}>
      <Link to="/admin/members" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to members</Link>
      <h1 style={{ marginTop: '1rem' }}>{member.name}</h1>
      <p style={{ color: '#6b7280' }}>{member.email}{member.phone ? ` · ${member.phone}` : ''}</p>

      <section style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        <Card title="Subscription">
          {hasSub ? (
            <>
              <p style={{ margin: 0 }}><strong>{member.memberSub.plan.name}</strong></p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.25rem 0' }}>
                Status: <SubStatusPill status={subStatus!} /><br />
                Expires: {new Date(member.memberSub.expiresAt).toLocaleDateString('en-IN')}
              </p>
              {isOwner && (
                <button
                  onClick={() => setShowAssign((v) => !v)}
                  style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer', background: 'white', border: '1px solid #d1d5db', borderRadius: '4px' }}
                >
                  {showAssign ? 'Cancel' : 'Renew / change plan'}
                </button>
              )}
            </>
          ) : (
            <>
              <p style={{ color: '#9ca3af', margin: 0 }}>No active subscription</p>
              {isOwner && (
                <button
                  onClick={() => setShowAssign((v) => !v)}
                  style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer', background: '#6366f1', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                  {showAssign ? 'Cancel' : '+ Assign plan'}
                </button>
              )}
            </>
          )}
          {showAssign && isOwner && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
              <AssignSubscriptionForm
                memberId={member.id}
                hasExistingSub={hasSub}
                onSuccess={() => setShowAssign(false)}
              />
            </div>
          )}
        </Card>

        <Card title="Profile">
          {member.profile ? (
            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.875rem' }}>
              {member.profile.age && <li>Age: {member.profile.age}</li>}
              {member.profile.gender && <li>Gender: {member.profile.gender}</li>}
              {member.profile.heightCm && <li>Height: {String(member.profile.heightCm)} cm</li>}
              {member.profile.currentWeightKg && <li>Weight: {String(member.profile.currentWeightKg)} kg</li>}
              {member.profile.fitnessLevel && <li>Level: {member.profile.fitnessLevel}</li>}
            </ul>
          ) : (
            <p style={{ color: '#9ca3af', margin: 0 }}>No profile data</p>
          )}
        </Card>

        <Card title="Assigned trainer">
          {member.assignedToTrainer?.[0]?.trainer ? (
            <p style={{ margin: 0 }}>{member.assignedToTrainer[0].trainer.name}</p>
          ) : (
            <p style={{ color: '#9ca3af', margin: 0 }}>Not assigned</p>
          )}
        </Card>

        <Card title="Activity">
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>Workouts, calories, goals — Phase 5+</p>
        </Card>
      </section>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '1.25rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}>
      <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>{title}</h3>
      {children}
    </div>
  )
}

function SubStatusPill({ status }: { status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'CANCELLED' }) {
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
