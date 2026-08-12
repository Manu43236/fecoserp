import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4">
          <p className="text-lg font-semibold" style={{ color: 'var(--color-critical)' }}>
            Something went wrong
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {this.state.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm rounded-md text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
