"use client"

import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error) {
    console.error("Uncaught error:", error)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Oops, terjadi kesalahan!</h2>
            <p className="text-gray-600 mb-4">
              Mohon maaf, terjadi kesalahan yang tidak diharapkan. Silakan coba lagi.
            </p>
            <div className="flex justify-end">
              <Button onClick={this.handleRetry}>Coba Lagi</Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

