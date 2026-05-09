import { useAuthStore } from '../../store/authStore'

export function MasterAdminPortal() {
  const { user, logout } = useAuthStore()

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Spacefit — Master Admin</h1>
        <div>
          <span style={{ marginRight: '1rem', color: '#6b7280' }}>{user?.email}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>
      <section>
        <h2>SaaS Dashboard</h2>
        <p style={{ color: '#6b7280' }}>Business metrics, org health, product analytics — Phase 1</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
          {['MRR / ARR', 'Active Orgs', 'Individual Users', 'Churn Rate', 'Trial → Paid', 'System Health'].map((metric) => (
            <div key={metric} style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>{metric}</p>
              <p style={{ margin: '0.5rem 0 0', fontSize: '1.5rem', fontWeight: 'bold' }}>—</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
