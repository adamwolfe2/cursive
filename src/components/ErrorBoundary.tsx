'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Something went wrong</p>
                  <p className="text-sm">
                    {this.state.error?.message || 'An unexpected error occurred'}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex-1"
              >
                Reload Page
              </Button>
              <Button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="flex-1"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
