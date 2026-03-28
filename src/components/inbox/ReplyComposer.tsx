'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface ReplyComposerProps {
  readonly conversationId: string
  readonly onSent: () => void
}

const MAX_CHARS = 4000

export function ReplyComposer({ conversationId, onSent }: ReplyComposerProps) {
  const [body, setBody] = useState('')
  const [subject, setSubject] = useState('')
  const [showSubject, setShowSubject] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['conversation-detail', conversationId] })
    queryClient.invalidateQueries({ queryKey: ['inbox-conversations'] })
  }

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/inbox/conversations/${conversationId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body,
          ...(showSubject && subject ? { subject } : {}),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send reply')
      }
    },
    onSuccess: () => {
      setBody('')
      setSubject('')
      setError(null)
      invalidate()
      onSent()
    },
    onError: (err: Error) => setError(err.message),
  })

  const suggestMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/inbox/conversations/${conversationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suggest' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to generate suggestion')
      }
      const data = await res.json()
      if (data.body) {
        setBody(data.body)
      }
    },
    onError: (err: Error) => setError(err.message),
  })

  const isMutating = sendMutation.isPending || suggestMutation.isPending
  const charsLeft = MAX_CHARS - body.length
  const canSend = body.trim().length > 0 && body.length <= MAX_CHARS

  return (
    <div className="border-t bg-white px-4 py-3 space-y-2">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-medium hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {showSubject && (
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="w-full text-sm border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      )}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a reply..."
        rows={4}
        disabled={isMutating}
        className="w-full text-sm border border-zinc-200 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none disabled:opacity-50"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => sendMutation.mutate()}
            disabled={!canSend || isMutating}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {sendMutation.isPending ? 'Sending...' : 'Send'}
          </button>

          <button
            onClick={() => suggestMutation.mutate()}
            disabled={isMutating}
            className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium rounded-md hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {suggestMutation.isPending ? 'Generating...' : 'AI Suggest'}
          </button>

          <button
            onClick={() => setShowSubject((v) => !v)}
            className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            {showSubject ? 'Hide subject' : 'Add subject'}
          </button>
        </div>

        <span
          className={`text-xs ${charsLeft < 100 ? (charsLeft < 0 ? 'text-red-500 font-medium' : 'text-amber-600') : 'text-zinc-400'}`}
        >
          {charsLeft.toLocaleString()} left
        </span>
      </div>
    </div>
  )
}
