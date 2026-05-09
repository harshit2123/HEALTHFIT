import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Spacefit</h1>
      <p>Gym management + fitness tracking for India.</p>
      <nav style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Link to="/register">Get started</Link>
        <Link to="/login">Login</Link>
      </nav>
    </main>
  )
}
