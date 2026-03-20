'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface QueryStatusToggleProps {
  queryId: string
  currentStatus: 'active' | 'paused' | 'archived'
}

export function QueryStatusToggle({
  queryId,
  currentStatus,
}: QueryStatusToggleProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleToggle = async () => {
    setLoading(true)
    setError(null)

    const newStatus = currentStatus === 'active' ? 'paused' : 'active'

    try {
      const response = await fetch(`/api/queries/${queryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update query status')
      }

      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`rounded-md px-4 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          currentStatus === 'active'
            ? 'bg-yellow-600 text-white hover:bg-yellow-500 focus:ring-yellow-500'
            : 'bg-green-600 text-white hover:bg-green-500 focus:ring-green-500'
        }`}
      >
        {loading
          ? 'Updating...'
          : currentStatus === 'active'
            ? 'Pause Query'
            : 'Activate Query'}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
