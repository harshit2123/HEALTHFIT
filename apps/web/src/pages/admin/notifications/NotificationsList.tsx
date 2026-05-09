import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { notificationApi } from '../../../lib/adminApi'

export function NotificationsList() {
  const { data: notifs, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.history(50),
  })

  const { data: providers } = useQuery({
    queryKey: ['notification-providers'],
    queryFn: notificationApi.listProviders,
  })

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Notifications</h1>
          <p style={{ color: '#6b7280', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
            Send WhatsApp, SMS, or email reminders to members
          </p>
        </div>
        <Link to="/admin/notifications/new" style={btnPrimary}>+ Send notification</Link>
      </header>

      {/* Provider status */}
      {providers && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {providers.map((p) => (
            <div
              key={p.channel}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                background: p.configured ? '#ecfdf5' : '#fef3c7',
                fontSize: '0.75rem',
              }}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>
                {p.channel === 'WHATSAPP' ? 'WhatsApp' : p.channel === 'IN_APP' ? 'In-app' : p.channel}
              </p>
              <p style={{ margin: '0.125rem 0 0', color: p.configured ? '#065f46' : '#92400e' }}>
                {p.configured ? '● Live' : '○ Simulation'}
              </p>
            </div>
          ))}
        </section>
      )}

      {isLoading ? (
        <p>Loading…</p>
      ) : !notifs || notifs.length === 0 ? (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '3rem' }}>
          No notifications sent yet.
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <Th>Sent</Th>
              <Th>Channel</Th>
              <Th>Recipients</Th>
              <Th>Template / Message</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {notifs.map((n) => (
              <tr key={n.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                <Td>
                  {n.sentAt
                    ? new Date(n.sentAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                    : n.scheduledFor
                      ? `Scheduled ${new Date(n.scheduledFor).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}`
                      : new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                </Td>
                <Td>{n.channel === 'WHATSAPP' ? 'WhatsApp' : n.channel === 'IN_APP' ? 'In-app' : n.channel}</Td>
                <Td>{Array.isArray(n.recipientIds) ? n.recipientIds.length : 0}</Td>
                <Td>
                  {n.templateName && n.templateName !== 'CUSTOM' ? (
                    <span style={{ fontSize: '0.75rem', color: '#6366f1' }}>{n.templateName}</span>
                  ) : (
                    <span style={{ color: '#374151', fontSize: '0.875rem' }}>
                      {n.messageText.slice(0, 50)}{n.messageText.length > 50 ? '…' : ''}
                    </span>
                  )}
                </Td>
                <Td><StatusPill status={n.status} /></Td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: 'PENDING' | 'SCHEDULED' | 'SENT' | 'FAILED' }) {
  const config = {
    PENDING: { bg: '#f3f4f6', color: '#6b7280' },
    SCHEDULED: { bg: '#dbeafe', color: '#1e40af' },
    SENT: { bg: '#dcfce7', color: '#166534' },
    FAILED: { bg: '#fee2e2', color: '#991b1b' },
  }[status]
  return (
    <span style={{ padding: '0.125rem 0.5rem', background: config.bg, color: config.color, borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
      {status}
    </span>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{children}</td>
}

const btnPrimary = {
  padding: '0.625rem 1rem',
  background: '#6366f1',
  color: 'white',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '0.875rem',
}
