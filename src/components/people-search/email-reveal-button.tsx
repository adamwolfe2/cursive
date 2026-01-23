'use client'

import { useState } from 'react'

interface EmailRevealButtonProps {
  resultId: string
  maskedEmail: string
  revealed: boolean
  onReveal: (resultId: string, email: string) => void
  creditsAvailable: boolean
}

export function EmailRevealButton({
  resultId,
  maskedEmail,
  revealed,
  onReveal,
  creditsAvailable,
}: EmailRevealButtonProps) {
  const [loading, setLoading] = useState(false)
  const [revealedEmail, setRevealedEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleReveal = async () => {
    if (revealed || !creditsAvailable) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/people-search/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result_id: resultId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to reveal email')
      }

      setRevealedEmail(data.data.email)
      onReveal(resultId, data.data.email)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Already revealed
  if (revealed || revealedEmail) {
    return (
      <div className="flex items-center space-x-2">
        <a
          href={`mailto:${revealedEmail}`}
          className="text-[13px] font-medium text-zinc-900 hover:text-zinc-700"
        >
          {revealedEmail}
        </a>
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-emerald-50 text-emerald-700">
          Revealed
        </span>
      </div>
    )
  }

  // Not enough credits
  if (!creditsAvailable) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-[13px] text-zinc-500">{maskedEmail}</span>
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-red-50 text-red-700">
          No credits
        </span>
      </div>
    )
  }

  // Can reveal
  return (
    <div className="flex items-center space-x-2">
      <span className="text-[13px] text-zinc-500">{maskedEmail}</span>
      <button
        onClick={handleReveal}
        disabled={loading}
        className="inline-flex items-center h-7 px-2.5 text-[11px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-md transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          'Revealing...'
        ) : (
          <>
            <svg
              className="-ml-0.5 mr-1 h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Reveal (1 credit)
          </>
        )}
      </button>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  )
}
