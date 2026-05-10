import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Catches React render errors. Without this, an unhandled exception leaves
 * users with a blank screen and no recovery path.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Production: ship to Sentry. For now: console.
    console.error('[ErrorBoundary]', error, info)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          style={{
            padding: '3rem 1.5rem',
            fontFamily: 'sans-serif',
            maxWidth: '480px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ margin: 0 }}>Something broke</h1>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            {this.state.error?.message ?? 'Unexpected error'}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button
              onClick={this.reset}
              style={{
                padding: '0.625rem 1rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Try again
            </button>
            <button
              onClick={() => {
                window.location.href = '/'
              }}
              style={{
                padding: '0.625rem 1rem',
                background: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Go home
            </button>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}
