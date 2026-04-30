'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface AIDraftCardProps {
  readonly conversationId: string
  readonly draft: {
    readonly id: string
    readonly body: string
    readonly confidence: number
    readonly knowledgeEntries: string[]
  }
}

export function AIDraftCard({ conversationId, draft }: AIDraftCardProps) {
  const [editedBody, setEditedBody] = useState(draft.body)
  const [isEditing, setIsEditing] = useState(false)
  const [showKnowledge, setShowKnowledge] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['conversation-detail', conversationId] })
    queryClient.invalidateQueries({ queryKey: ['inbox-conversations'] })
  }

  const approveMutation = useMutation({
    mutationFn: async () => {
      const body = isEditing ? editedBody : undefined
      const res = await fetch(`/api/inbox/conversations/${conversationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply_id: draft.id, edited_body: body }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to approve draft')
      }
    },
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  })

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/inbox/conversations/${conversationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply_id: draft.id, action: 'reject' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to reject draft')
      }
    },
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  })

  const isMutating = approveMutation.isPending || rejectMutation.isPending

  const confidenceColor =
    draft.confidence >= 0.8
      ? 'text-green-600'
      : draft.confidence >= 0.5
        ? 'text-yellow-600'
        : 'text-red-600'

  return (
    <div className="border-2 border-amber-200 bg-amber-50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
          AI Draft Reply
        </span>
        <span className={`text-xs font-medium ${confidenceColor}`}>
          {Math.round(draft.confidence * 100)}% confidence
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
          {error}
        </div>
      )}

      {isEditing ? (
        <textarea
          value={editedBody}
          onChange={(e) => setEditedBody(e.target.value)}
          rows={6}
          className="w-full text-sm border rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-sans leading-relaxed"
        />
      ) : (
        <div className="text-sm text-zinc-700 whitespace-pre-wrap bg-white rounded-md border p-3 leading-relaxed">
          {draft.body}
        </div>
      )}

      {draft.knowledgeEntries.length > 0 && (
        <div>
          <button
            onClick={() => setShowKnowledge(!showKnowledge)}
            className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            {showKnowledge ? 'Hide' : 'Show'} knowledge entries ({draft.knowledgeEntries.length})
          </button>
          {showKnowledge && (
            <ul className="mt-1 space-y-1">
              {draft.knowledgeEntries.map((entry) => (
                <li key={entry} className="text-xs text-zinc-500 bg-white px-2 py-1 rounded border">
                  {entry}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => approveMutation.mutate()}
          disabled={isMutating}
          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {approveMutation.isPending ? 'Sending...' : 'Approve & Send'}
        </button>
        <button
          onClick={() => setIsEditing(!isEditing)}
          disabled={isMutating}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isEditing ? 'Preview' : 'Edit'}
        </button>
        <button
          onClick={() => rejectMutation.mutate()}
          disabled={isMutating}
          className="px-4 py-2 bg-white border text-sm font-medium rounded-md hover:bg-zinc-50 text-zinc-700 transition-colors disabled:opacity-50"
        >
          {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
        </button>
      </div>
    </div>
  )
}
