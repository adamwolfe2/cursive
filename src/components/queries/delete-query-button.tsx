'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DeleteQueryButtonProps {
  queryId: string
}

export function DeleteQueryButton({ queryId }: DeleteQueryButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/queries/${queryId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete query')
      }

      // Redirect to queries list
      router.push('/queries')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        Delete Query
      </button>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setShowConfirm(false)}
        disabled={loading}
        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Deleting...' : 'Confirm Delete'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
