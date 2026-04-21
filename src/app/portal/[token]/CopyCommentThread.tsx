'use client'

import { useState } from 'react'
import type { CopyComment } from '@/types/copy-comments'

interface Props {
  token: string
  clientName: string
  sequenceIndex: number
  emailStep: number
  comments: CopyComment[]
  onChange: () => void
  bodyRef: React.RefObject<HTMLDivElement | null>
}

function formatRelative(iso: string): string {
  const d = new Date(iso)
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}

export default function CopyCommentThread({
  token,
  clientName,
  sequenceIndex,
  emailStep,
  comments,
  onChange,
  bodyRef,
}: Props) {
  const [draft, setDraft] = useState('')
  const [replyParent, setReplyParent] = useState<string | null>(null)
  const [quotedText, setQuotedText] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const openComments = comments.filter((c) => c.status === 'open')
  const resolvedCount = comments.length - openComments.length

  function captureSelection() {
    if (typeof window === 'undefined') return
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setQuotedText(null)
      return
    }
    const text = sel.toString().trim()
    if (!bodyRef.current) {
      setQuotedText(null)
      return
    }
    // Only treat as a quote if the selection is inside this email's body.
    const anchorNode = sel.anchorNode
    if (!anchorNode || !bodyRef.current.contains(anchorNode)) {
      setQuotedText(null)
      return
    }
    setQuotedText(text.length > 500 ? text.slice(0, 500) + '…' : text)
  }

  function openForm(parentId: string | null) {
    captureSelection()
    setReplyParent(parentId)
    setShowForm(true)
  }

  function cancel() {
    setShowForm(false)
    setDraft('')
    setReplyParent(null)
    setQuotedText(null)
  }

  async function submit() {
    if (!draft.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/portal/${token}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence_index: sequenceIndex,
          email_step: emailStep,
          body: draft.trim(),
          quoted_text: quotedText,
          parent_comment_id: replyParent,
          author_name: clientName,
        }),
      })
      if (res.ok) {
        setDraft('')
        setQuotedText(null)
        setReplyParent(null)
        setShowForm(false)
        onChange()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleResolve(comment: CopyComment) {
    const next = comment.status === 'open' ? 'resolved' : 'open'
    await fetch(`/api/portal/${token}/comments/${comment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    onChange()
  }

  // Build thread tree: top-level + replies
  const topLevel = comments.filter((c) => !c.parent_comment_id)
  const repliesByParent = new Map<string, CopyComment[]>()
  for (const c of comments) {
    if (c.parent_comment_id) {
      const arr = repliesByParent.get(c.parent_comment_id) ?? []
      arr.push(c)
      repliesByParent.set(c.parent_comment_id, arr)
    }
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          <span>
            {openComments.length} open{resolvedCount > 0 ? ` · ${resolvedCount} resolved` : ''}
          </span>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => openForm(null)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            + Add comment
          </button>
        )}
      </div>

      {comments.length === 0 && !showForm && (
        <p className="text-xs text-gray-400 italic">
          Highlight any part of the email, then click &ldquo;Add comment&rdquo; to leave feedback.
        </p>
      )}

      {topLevel.length > 0 && (
        <ul className="space-y-2">
          {topLevel.map((c) => {
            const replies = repliesByParent.get(c.id) ?? []
            return (
              <li key={c.id}>
                <CommentBubble
                  comment={c}
                  clientName={clientName}
                  onToggleResolve={() => toggleResolve(c)}
                  onReply={() => openForm(c.id)}
                />
                {replies.length > 0 && (
                  <ul className="ml-6 mt-1.5 space-y-1.5 border-l-2 border-gray-100 pl-3">
                    {replies.map((r) => (
                      <li key={r.id}>
                        <CommentBubble
                          comment={r}
                          clientName={clientName}
                          onToggleResolve={() => toggleResolve(r)}
                          onReply={() => openForm(c.id)}
                          compact
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {showForm && (
        <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-2.5 space-y-2">
          {quotedText && (
            <div className="rounded border-l-2 border-blue-400 bg-white px-2.5 py-1.5">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">
                Quoting
              </p>
              <p className="text-xs text-gray-700 italic line-clamp-3">&ldquo;{quotedText}&rdquo;</p>
            </div>
          )}
          {replyParent && (
            <p className="text-[11px] text-gray-500">
              Replying to thread
            </p>
          )}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            autoFocus
            placeholder={replyParent ? 'Write a reply…' : 'What would you like changed? Be as specific as you want.'}
            className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !draft.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving…' : replyParent ? 'Reply' : 'Post comment'}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CommentBubble({
  comment,
  clientName,
  onToggleResolve,
  onReply,
  compact,
}: {
  comment: CopyComment
  clientName: string
  onToggleResolve: () => void
  onReply: () => void
  compact?: boolean
}) {
  const isAdmin = comment.author_type === 'admin'
  const label = isAdmin
    ? comment.author_name || 'Cursive Team'
    : comment.author_name || clientName || 'You'
  const isResolved = comment.status === 'resolved'

  return (
    <div
      className={`rounded-lg ${
        isResolved
          ? 'bg-gray-50 border border-gray-100 opacity-70'
          : isAdmin
            ? 'bg-amber-50 border border-amber-100'
            : 'bg-blue-50 border border-blue-100'
      } ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`text-[11px] font-semibold ${
            isAdmin ? 'text-amber-800' : 'text-blue-800'
          }`}
        >
          {label}
        </span>
        <span className="text-[10px] text-gray-400">{formatRelative(comment.created_at)}</span>
        {isResolved && (
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
            · Resolved
          </span>
        )}
      </div>
      {comment.quoted_text && (
        <p className="text-[11px] text-gray-500 italic border-l-2 border-gray-200 pl-2 mb-1 line-clamp-2">
          &ldquo;{comment.quoted_text}&rdquo;
        </p>
      )}
      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
        {comment.body}
      </p>
      {!compact && (
        <div className="flex items-center gap-3 mt-1.5">
          <button
            type="button"
            onClick={onReply}
            className="text-[11px] text-gray-500 hover:text-gray-700 font-medium"
          >
            Reply
          </button>
          <button
            type="button"
            onClick={onToggleResolve}
            className="text-[11px] text-gray-500 hover:text-gray-700 font-medium"
          >
            {isResolved ? 'Reopen' : 'Mark resolved'}
          </button>
        </div>
      )}
    </div>
  )
}
