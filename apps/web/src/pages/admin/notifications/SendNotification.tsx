import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, notificationApi } from '../../../lib/adminApi'

type Channel = 'WHATSAPP' | 'SMS' | 'EMAIL' | 'IN_APP'

export function SendNotification() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [channel, setChannel] = useState<Channel>('WHATSAPP')
  const [mode, setMode] = useState<'TEMPLATE' | 'CUSTOM'>('TEMPLATE')
  const [templateKey, setTemplateKey] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [recipientFilter, setRecipientFilter] = useState<'ALL' | 'EXPIRING' | 'CUSTOM'>('ALL')
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(new Set())
  const [scheduledFor, setScheduledFor] = useState('')

  const { data: providers } = useQuery({
    queryKey: ['notification-providers'],
    queryFn: notificationApi.listProviders,
  })

  const { data: templates } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: notificationApi.listTemplates,
  })

  const { data: members } = useQuery({
    queryKey: ['members', 'all-for-notification'],
    queryFn: () => adminApi.listMembers({ limit: 100, status: 'ACTIVE' }),
  })

  const { data: expiringSubs } = useQuery({
    queryKey: ['member-subscriptions', { status: 'EXPIRING' }],
    queryFn: () => adminApi.listMemberSubscriptions({ status: 'EXPIRING' }),
    enabled: recipientFilter === 'EXPIRING',
  })

  const recipientIds = useMemo(() => {
    if (recipientFilter === 'ALL') return members?.members.map((m) => m.id) ?? []
    if (recipientFilter === 'EXPIRING') return expiringSubs?.map((s) => s.memberId) ?? []
    return Array.from(selectedRecipientIds)
  }, [recipientFilter, members, expiringSubs, selectedRecipientIds])

  const sendMutation = useMutation({
    mutationFn: notificationApi.send,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      navigate('/admin/notifications')
    },
  })

  const channelStatus = providers?.find((p) => p.channel === channel)
  const showSimulationWarning = channelStatus && !channelStatus.configured && channel !== 'IN_APP'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (recipientIds.length === 0) return

    sendMutation.mutate({
      recipientIds,
      channel,
      ...(mode === 'TEMPLATE' ? { templateKey } : { customMessage }),
      ...(scheduledFor ? { scheduledFor: new Date(scheduledFor).toISOString() } : {}),
    })
  }

  const previewMessage =
    mode === 'TEMPLATE'
      ? templates?.find((t) => t.key === templateKey)?.message
      : customMessage

  return (
    <div style={{ maxWidth: '720px' }}>
      <Link to="/admin/notifications" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.875rem' }}>
        ← Back to notifications
      </Link>
      <h1 style={{ marginTop: '1rem' }}>Send notification</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}>
        {/* Channel */}
        <Section title="Channel">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {(['WHATSAPP', 'SMS', 'EMAIL', 'IN_APP'] as Channel[]).map((c) => {
              const cfg = providers?.find((p) => p.channel === c)
              const isSimulated = cfg && !cfg.configured && c !== 'IN_APP'
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChannel(c)}
                  style={{
                    padding: '0.75rem',
                    border: channel === c ? '2px solid #6366f1' : '2px solid #e5e7eb',
                    background: channel === c ? '#eef2ff' : 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    position: 'relative',
                  }}
                >
                  {c === 'WHATSAPP' ? 'WhatsApp' : c === 'IN_APP' ? 'In-app' : c}
                  {isSimulated && (
                    <span style={{ display: 'block', fontSize: '0.625rem', color: '#92400e', marginTop: '0.25rem' }}>
                      Simulation
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          {showSimulationWarning && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#92400e', background: '#fef3c7', padding: '0.5rem', borderRadius: '4px' }}>
              {channel} provider not configured — will run in simulation mode (logs only).
            </p>
          )}
        </Section>

        {/* Recipients */}
        <Section title="Recipients">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {(['ALL', 'EXPIRING', 'CUSTOM'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setRecipientFilter(f)}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: recipientFilter === f ? '#6366f1' : 'white',
                  color: recipientFilter === f ? 'white' : '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                {f === 'ALL' ? 'All active members' : f === 'EXPIRING' ? 'Expiring soon' : 'Pick specific'}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
            <strong>{recipientIds.length}</strong> {recipientIds.length === 1 ? 'recipient' : 'recipients'} selected
          </p>

          {recipientFilter === 'CUSTOM' && members && (
            <div style={{ marginTop: '0.75rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.5rem' }}>
              {members.members.map((m) => (
                <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedRecipientIds.has(m.id)}
                    onChange={(e) => {
                      const next = new Set(selectedRecipientIds)
                      if (e.target.checked) next.add(m.id)
                      else next.delete(m.id)
                      setSelectedRecipientIds(next)
                    }}
                  />
                  <span>{m.name}</span>
                  <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>· {m.email}</span>
                </label>
              ))}
            </div>
          )}
        </Section>

        {/* Message */}
        <Section title="Message">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {(['TEMPLATE', 'CUSTOM'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: mode === m ? '#6366f1' : 'white',
                  color: mode === m ? 'white' : '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                {m === 'TEMPLATE' ? 'Use template' : 'Custom message'}
              </button>
            ))}
          </div>

          {mode === 'TEMPLATE' ? (
            <select
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value)}
              required
              style={{ width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
            >
              <option value="">Select template…</option>
              {templates?.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
          ) : (
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              required
              rows={4}
              placeholder="Type your message. Use {{name}} and {{gymName}} for personalization."
              style={{ width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
            />
          )}

          {previewMessage && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '6px', fontSize: '0.875rem', color: '#374151' }}>
              <p style={{ margin: 0, fontSize: '0.625rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Preview</p>
              <p style={{ margin: '0.25rem 0 0', whiteSpace: 'pre-wrap' }}>{previewMessage}</p>
            </div>
          )}
        </Section>

        {/* Schedule */}
        <Section title="Schedule (optional)">
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            style={{ width: '100%', padding: '0.625rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
          />
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
            Leave blank to send immediately
          </p>
        </Section>

        {sendMutation.isError && (
          <p style={{ color: '#dc2626', margin: 0 }}>
            {(sendMutation.error as { response?: { data?: { error?: string | object } } })?.response?.data?.error
              ? typeof (sendMutation.error as { response?: { data?: { error?: string | object } } }).response?.data?.error === 'string'
                ? String((sendMutation.error as { response?: { data?: { error?: string } } }).response!.data!.error)
                : 'Validation failed'
              : 'Failed to send'}
          </p>
        )}

        <button
          type="submit"
          disabled={sendMutation.isPending || recipientIds.length === 0}
          style={{
            padding: '0.875rem',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {sendMutation.isPending
            ? 'Sending…'
            : scheduledFor
              ? `Schedule for ${recipientIds.length} recipient${recipientIds.length === 1 ? '' : 's'}`
              : `Send to ${recipientIds.length} recipient${recipientIds.length === 1 ? '' : 's'}`}
        </button>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>{title}</h3>
      {children}
    </section>
  )
}
