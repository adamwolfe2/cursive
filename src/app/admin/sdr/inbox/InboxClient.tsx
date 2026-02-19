'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Workspace } from '@/types'

interface InboxReply {
  id: string
  workspace_id: string
  from_email: string
  from_name: string | null
  subject: string
  body_text: string
  received_at: string
  sentiment: string | null
  intent_score: number | null
  suggested_response: string | null
  draft_status: string
  admin_notes: string | null
  approved_by: string | null
  approved_at: string | null
  status: string
  workspace: { name: string; slug: string } | null
}

interface FolderItem {
  label: string
  draft_status?: string
  count?: number
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function SentimentBadge({ sentiment }: { sentiment: string | null }) {
  if (!sentiment) return null
  const colors: Record<string, string> = {
    positive: 'bg-green-100 text-green-700',
    question: 'bg-yellow-100 text-yellow-700',
    neutral: 'bg-gray-100 text-gray-600',
    negative: 'bg-red-100 text-red-700',
    not_interested: 'bg-red-100 text-red-700',
    out_of_office: 'bg-purple-100 text-purple-700',
    unsubscribe: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${colors[sentiment] || 'bg-gray-100 text-gray-600'}`}>
      {sentiment.replace('_', ' ')}
    </span>
  )
}

function DraftStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    needs_approval: 'bg-red-100 text-red-700',
    sent: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600',
    skipped: 'bg-gray-100 text-gray-500',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export function InboxClient({ workspaces }: { workspaces: Workspace[] }) {
  const searchParams = useSearchParams()
  const [activeFolder, setActiveFolder] = useState<string | undefined>(undefined)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(
    searchParams.get('workspace_id') || ''
  )
  const [selectedReplyId, setSelectedReplyId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [editedDraft, setEditedDraft] = useState('')
  const [rejectNotes, setRejectNotes] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['sdr-inbox', activeFolder, selectedWorkspaceId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (activeFolder) params.set('draft_status', activeFolder)
      if (selectedWorkspaceId) params.set('workspace_id', selectedWorkspaceId)
      params.set('limit', '200')
      const res = await fetch(`/api/admin/sdr/inbox?${params}`)
      if (!res.ok) throw new Error('Failed to load inbox')
      return res.json() as Promise<{ replies: InboxReply[]; counts: Record<string, number> }>
    },
    staleTime: 30 * 1000,
  })

  const counts = data?.counts || {}

  const filtered = useMemo(() => {
    const replies = data?.replies || []
    if (!search) return replies
    const lower = search.toLowerCase()
    return replies.filter(
      (r) =>
        r.from_email.toLowerCase().includes(lower) ||
        (r.from_name || '').toLowerCase().includes(lower) ||
        r.subject.toLowerCase().includes(lower) ||
        (r.workspace?.name || '').toLowerCase().includes(lower)
    )
  }, [data, search])

  const selectedReply = filtered.find((r) => r.id === selectedReplyId) || null

  const handleSelectReply = (reply: InboxReply) => {
    setSelectedReplyId(reply.id)
    setEditedDraft(reply.suggested_response || '')
    setShowRejectInput(false)
    setRejectNotes('')
    setActionError(null)
  }

  const handleFolderChange = (draft_status: string | undefined) => {
    setActiveFolder(draft_status)
    setSelectedReplyId(null)
    setActionError(null)
  }

  const handleWorkspaceChange = (id: string) => {
    setSelectedWorkspaceId(id)
    setSelectedReplyId(null)
    setActionError(null)
  }

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['sdr-inbox'] })
    setSelectedReplyId(null)
    setActionError(null)
  }

  const approveMutation = useMutation({
    mutationFn: async (replyId: string) => {
      const res = await fetch(`/api/admin/sdr/inbox/${replyId}/approve`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to approve')
      }
    },
    onSuccess: invalidate,
    onError: (error: Error) => setActionError(error.message),
  })

  const sendMutation = useMutation({
    mutationFn: async ({ replyId, body }: { replyId: string; body: string }) => {
      const res = await fetch(`/api/admin/sdr/inbox/${replyId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to send')
      }
    },
    onSuccess: invalidate,
    onError: (error: Error) => setActionError(error.message),
  })

  const rejectMutation = useMutation({
    mutationFn: async ({ replyId, notes }: { replyId: string; notes: string }) => {
      const res = await fetch(`/api/admin/sdr/inbox/${replyId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to reject')
      }
    },
    onSuccess: invalidate,
    onError: (error: Error) => setActionError(error.message),
  })

  const isMutating = approveMutation.isPending || sendMutation.isPending || rejectMutation.isPending

  const folders: FolderItem[] = [
    { label: 'All Replies', draft_status: undefined },
    { label: 'Needs Approval', draft_status: 'needs_approval', count: counts.needs_approval },
    { label: 'Sent', draft_status: 'sent' },
    { label: 'Rejected', draft_status: 'rejected' },
    { label: 'Skipped', draft_status: 'skipped' },
  ]

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Column 1: Folder Nav */}
      <aside className="w-56 border-r bg-white p-4 flex-shrink-0">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Inbox Managers
        </p>
        <nav className="space-y-1">
          {folders.map((folder) => (
            <button
              key={folder.label}
              onClick={() => handleFolderChange(folder.draft_status)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-left transition-colors ${
                activeFolder === folder.draft_status
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <span>{folder.label}</span>
              {folder.count != null && folder.count > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {folder.count > 99 ? '99+' : folder.count}
                </span>
              )}
            </button>
          ))}
          <div className="border-t my-2" />
          <button
            disabled
            className="w-full flex items-center px-3 py-2 rounded-md text-sm text-left text-zinc-400 cursor-not-allowed"
          >
            Follow Up
            <span className="ml-1.5 text-[10px] text-zinc-400">(soon)</span>
          </button>
        </nav>
      </aside>

      {/* Column 2: Reply List */}
      <div className="w-96 border-r bg-zinc-50 flex flex-col flex-shrink-0">
        <div className="p-3 border-b bg-white space-y-2">
          <input
            type="text"
            placeholder="Search replies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select
            value={selectedWorkspaceId}
            onChange={(e) => handleWorkspaceChange(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            <option value="">All workspaces</option>
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="p-4 text-sm text-zinc-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-sm text-zinc-500">No replies found.</div>
          ) : (
            filtered.map((reply) => (
              <button
                key={reply.id}
                onClick={() => handleSelectReply(reply)}
                className={`w-full text-left p-3 border-b hover:bg-white transition-colors ${
                  selectedReplyId === reply.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-zinc-800 truncate max-w-[180px]">
                    {reply.from_name || reply.from_email}
                  </span>
                  <span className="text-[10px] text-zinc-400 flex-shrink-0 ml-1">
                    {timeAgo(reply.received_at)}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 truncate mb-1">{reply.subject}</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <SentimentBadge sentiment={reply.sentiment} />
                  {reply.intent_score != null && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 font-medium">
                      {reply.intent_score}/10
                    </span>
                  )}
                  <DraftStatusBadge status={reply.draft_status} />
                </div>
                {reply.workspace?.name && (
                  <div className="text-[10px] text-zinc-400 mt-1 truncate">{reply.workspace.name}</div>
                )}
                <div className="text-xs text-zinc-400 mt-1 line-clamp-2">{reply.body_text}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Column 3: Detail Panel */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        {!selectedReply ? (
          <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
            Select a reply to review
          </div>
        ) : (
          <div className="max-w-2xl space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <span className="font-medium text-zinc-800">
                    {selectedReply.from_name || selectedReply.from_email}
                  </span>
                  <span className="text-zinc-400">·</span>
                  <span className="text-zinc-500">{selectedReply.from_email}</span>
                  <span className="text-zinc-400">·</span>
                  <span className="text-zinc-400">{timeAgo(selectedReply.received_at)}</span>
                </div>
                {selectedReply.workspace?.name && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs rounded">
                    {selectedReply.workspace.name}
                  </span>
                )}
              </div>
              <DraftStatusBadge status={selectedReply.draft_status} />
            </div>

            {/* Subject */}
            <h2 className="text-lg font-semibold text-zinc-900">{selectedReply.subject}</h2>

            {/* Body */}
            <div className="bg-zinc-50 border rounded-lg p-4">
              <pre className="text-sm text-zinc-700 whitespace-pre-wrap font-sans leading-relaxed">
                {selectedReply.body_text}
              </pre>
            </div>

            {/* Classification */}
            <div className="bg-white border rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Classification</p>
              <div className="flex items-center gap-3 flex-wrap">
                <SentimentBadge sentiment={selectedReply.sentiment} />
                {selectedReply.intent_score != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Intent:</span>
                    <div className="flex items-center gap-1">
                      <div className="w-24 h-2 bg-zinc-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(selectedReply.intent_score / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-zinc-700">
                        {selectedReply.intent_score}/10
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action error */}
            {actionError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">
                {actionError}
              </div>
            )}

            {/* Draft Section */}
            {selectedReply.suggested_response && (
              <div className="bg-white border rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  AI Draft Response
                </p>

                {selectedReply.draft_status === 'needs_approval' && (
                  <>
                    <textarea
                      value={editedDraft}
                      onChange={(e) => setEditedDraft(e.target.value)}
                      rows={8}
                      className="w-full text-sm border rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans leading-relaxed"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => approveMutation.mutate(selectedReply.id)}
                        disabled={isMutating}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {approveMutation.isPending ? 'Sending...' : 'Approve & Send'}
                      </button>
                      <button
                        onClick={() => sendMutation.mutate({ replyId: selectedReply.id, body: editedDraft })}
                        disabled={isMutating || !editedDraft.trim()}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {sendMutation.isPending ? 'Sending...' : 'Edit & Send'}
                      </button>
                      <button
                        onClick={() => setShowRejectInput(!showRejectInput)}
                        disabled={isMutating}
                        className="px-4 py-2 bg-white border text-sm font-medium rounded-md hover:bg-zinc-50 text-zinc-700 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                    {showRejectInput && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Reason for rejection (optional)..."
                          value={rejectNotes}
                          onChange={(e) => setRejectNotes(e.target.value)}
                          className="w-full text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-400"
                        />
                        <button
                          onClick={() => rejectMutation.mutate({ replyId: selectedReply.id, notes: rejectNotes })}
                          disabled={isMutating}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                          {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {selectedReply.draft_status === 'sent' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        ✓ Sent
                      </span>
                      {selectedReply.approved_by && (
                        <span className="text-xs text-zinc-500">by {selectedReply.approved_by}</span>
                      )}
                    </div>
                    <pre className="text-sm text-zinc-600 whitespace-pre-wrap font-sans bg-zinc-50 p-3 rounded border">
                      {selectedReply.suggested_response}
                    </pre>
                  </div>
                )}

                {selectedReply.draft_status === 'rejected' && (
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      ✗ Rejected
                    </span>
                    {selectedReply.admin_notes && (
                      <p className="text-xs text-zinc-500 bg-zinc-50 p-2 rounded border">
                        Note: {selectedReply.admin_notes}
                      </p>
                    )}
                  </div>
                )}

                {selectedReply.draft_status === 'skipped' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    — Skipped
                  </span>
                )}

                {(selectedReply.draft_status === 'pending' || selectedReply.draft_status === 'approved') && (
                  <pre className="text-sm text-zinc-600 whitespace-pre-wrap font-sans bg-zinc-50 p-3 rounded border">
                    {selectedReply.suggested_response}
                  </pre>
                )}
              </div>
            )}

            {/* No draft but reply exists */}
            {!selectedReply.suggested_response && (
              <div className="bg-zinc-50 border rounded-lg p-4 text-sm text-zinc-500">
                No AI draft generated for this reply.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
