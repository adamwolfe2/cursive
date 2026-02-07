"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Container } from "@/components/ui/container"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Marketing site error:", error)
  }, [error])

  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-white">
      <Container className="py-24">
        <div className="max-w-lg mx-auto text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
            Something went wrong
          </h1>

          <p className="text-lg text-zinc-600 mb-8 max-w-md mx-auto">
            We ran into an unexpected error. Please try again, and if the
            problem persists, feel free to contact us.
          </p>

          {error.digest && (
            <p className="text-xs text-zinc-400 font-mono mb-8">
              Error ID: {error.digest}
            </p>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-base rounded-lg bg-[#007AFF] text-white hover:bg-[#0066DD] transition-all duration-200"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-base rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200"
            >
              Go Home
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
