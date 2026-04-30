'use client'

import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface QuickActionsProps {
  readonly conversationId: string
  readonly hasDraft: boolean
  readonly onAction: () => void
}

const SNOOZE_OPTIONS = [
  { label: '1 hour', hours: 1 },
  { label: '4 hours', hours: 4 },
  { label: 'Tomorrow', hours: 24 },
  { label: 'Next week', hours: 168 },
] as const

export function QuickActions({ conversationId, hasDraft, onAction }: QuickActionsProps) {
  const [snoozeOpen, setSnoozeOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const snoozeRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['conversation-detail', conversationId] })
    queryClient.invalidateQueries({ queryKey: ['inbox-conversations'] })
    onAction()
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (snoozeRef.current && !snoozeRef.current.contains(e.target as Node)) {
        setSnoozeOpen(false)
      }
    }
    if (snoozeOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [snoozeOpen])

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/inbox/conversations/${conversationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to approve draft')
      }
    },
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  })

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/inbox/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to archive')
      }
    },
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  })

  const escalateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/inbox/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needsHuman: true, priority: 'high' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to escalate')
      }
    },
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  })

  const snoozeMutation = useMutation({
    mutationFn: async (hours: number) => {
      const snoozeUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
      const res = await fetch(`/api/inbox/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'snoozed', snoozeUntil }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to snooze')
      }
    },
    onSuccess: () => {
      setSnoozeOpen(false)
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const isMutating =
    approveMutation.isPending ||
    archiveMutation.isPending ||
    escalateMutation.isPending ||
    snoozeMutation.isPending

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {error && (
        <span className="text-xs text-red-600 mr-1">
          {error}
          <button onClick={() => setError(null)} className="ml-1 underline">
            dismiss
          </button>
        </span>
      )}

      {hasDraft && (
        <button
          onClick={() => approveMutation.mutate()}
          disabled={isMutating}
          className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {approveMutation.isPending ? 'Approving...' : 'Approve AI Draft'}
        </button>
      )}

      <div className="relative" ref={snoozeRef}>
        <button
          onClick={() => setSnoozeOpen((v) => !v)}
          disabled={isMutating}
          className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 text-xs font-medium rounded-md hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Snooze
        </button>

        {snoozeOpen && (
          <div className="absolute top-full mt-1 left-0 z-10 bg-white border border-zinc-200 rounded-md shadow-md min-w-[120px]">
            {SNOOZE_OPTIONS.map((opt) => (
              <button
                key={opt.hours}
                onClick={() => snoozeMutation.mutate(opt.hours)}
                disabled={snoozeMutation.isPending}
                className="block w-full text-left px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 first:rounded-t-md last:rounded-b-md"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => archiveMutation.mutate()}
        disabled={isMutating}
        className="px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 text-xs font-medium rounded-md hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {archiveMutation.isPending ? 'Archiving...' : 'Archive'}
      </button>

      <button
        onClick={() => escalateMutation.mutate()}
        disabled={isMutating}
        className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-medium rounded-md hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {escalateMutation.isPending ? 'Escalating...' : 'Escalate'}
      </button>
    </div>
  )
}
