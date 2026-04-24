import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px', textAlign: 'center', padding: '24px' }}>
          <h2 style={{ fontSize: '1.4rem', color: '#333' }}>Algo salió mal</h2>
          <p style={{ color: '#666' }}>Ocurrió un error inesperado. Por favor recargá la página.</p>
          <a href="/" style={{ padding: '10px 24px', background: 'var(--primary, #6E88B0)', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
            Volver al inicio
          </a>
        </div>
      )
    }
    return this.props.children
  }
}
