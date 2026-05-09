interface ComingSoonProps {
  title: string
  description: string
  phase: string
}

export function ComingSoon({ title, description, phase }: ComingSoonProps) {
  return (
    <div style={{ maxWidth: '480px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
      <div
        style={{
          display: 'inline-block',
          padding: '0.25rem 0.75rem',
          background: '#eef2ff',
          color: '#3730a3',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          marginBottom: '1rem',
        }}
      >
        {phase}
      </div>
      <h1 style={{ margin: 0 }}>{title}</h1>
      <p style={{ color: '#6b7280', marginTop: '0.75rem', lineHeight: 1.6 }}>{description}</p>
    </div>
  )
}
