'use client'

import { useState } from 'react'
import type { CopyComment } from '@/types/copy-comments'
import {
  addAdminComment,
  resolveComment,
  reopenComment,
  deleteComment,
} from '@/app/admin/onboarding/actions'
import { Button } from '@/components/ui/button'
import { MessageSquare, Check, RotateCcw, Trash2 } from 'lucide-react'

interface Props {
  clientId: string
  clientName: string
  sequenceIndex: number
  emailStep: number
  comments: CopyComment[]
  onChange: () => void
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

export default function AdminCommentThread({
  clientId,
  clientName,
  sequenceIndex,
  emailStep,
  comments,
  onChange,
}: Props) {
  const [draft, setDraft] = useState('')
  const [replyParent, setReplyParent] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const openComments = comments.filter((c) => c.status === 'open')
  const resolvedCount = comments.length - openComments.length

  async function submit() {
    if (!draft.trim() || submitting) return
    setSubmitting(true)
    try {
      await addAdminComment({
        clientId,
        sequenceIndex,
        emailStep,
        body: draft.trim(),
        parentCommentId: replyParent,
      })
      setDraft('')
      setReplyParent(null)
      setShowForm(false)
      onChange()
    } catch {
      // Non-fatal — error surfaces via empty state.
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleResolve(c: CopyComment) {
    if (c.status === 'open') {
      await resolveComment(c.id, clientId)
    } else {
      await reopenComment(c.id, clientId)
    }
    onChange()
  }

  async function remove(c: CopyComment) {
    if (!confirm('Delete this comment?')) return
    await deleteComment(c.id, clientId)
    onChange()
  }

  const topLevel = comments.filter((c) => !c.parent_comment_id)
  const repliesByParent = new Map<string, CopyComment[]>()
  for (const c of comments) {
    if (c.parent_comment_id) {
      const arr = repliesByParent.get(c.parent_comment_id) ?? []
      arr.push(c)
      repliesByParent.set(c.parent_comment_id, arr)
    }
  }

  if (comments.length === 0 && !showForm) {
    return (
      <div className="mt-3 border-t border-border/50 pt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
          <MessageSquare className="h-3 w-3" /> No comments yet
        </span>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          + Add comment
        </button>
      </div>
    )
  }

  return (
    <div className="mt-3 border-t border-border/50 pt-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
          <MessageSquare className="h-3 w-3" />
          {openComments.length} open{resolvedCount > 0 ? ` · ${resolvedCount} resolved` : ''}
        </span>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            + Add comment
          </button>
        )}
      </div>

      {topLevel.length > 0 && (
        <ul className="space-y-2">
          {topLevel.map((c) => {
            const replies = repliesByParent.get(c.id) ?? []
            return (
              <li key={c.id}>
                <Bubble
                  comment={c}
                  clientName={clientName}
                  onReply={() => {
                    setReplyParent(c.id)
                    setShowForm(true)
                  }}
                  onToggleResolve={() => toggleResolve(c)}
                  onDelete={() => remove(c)}
                />
                {replies.length > 0 && (
                  <ul className="ml-5 mt-1.5 space-y-1.5 border-l-2 border-border pl-2.5">
                    {replies.map((r) => (
                      <li key={r.id}>
                        <Bubble
                          comment={r}
                          clientName={clientName}
                          onReply={() => {
                            setReplyParent(c.id)
                            setShowForm(true)
                          }}
                          onToggleResolve={() => toggleResolve(r)}
                          onDelete={() => remove(r)}
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
        <div className="rounded-lg border border-border bg-muted/30 p-2.5 space-y-2">
          {replyParent && (
            <p className="text-[11px] text-muted-foreground">Replying to thread</p>
          )}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            autoFocus
            placeholder={replyParent ? 'Write a reply to the client…' : 'Write a comment for this email…'}
            className="w-full rounded-md border border-border bg-background px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={submit} loading={submitting} disabled={!draft.trim()}>
              {replyParent ? 'Reply' : 'Post'}
            </Button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setDraft('')
                setReplyParent(null)
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Bubble({
  comment,
  clientName,
  onReply,
  onToggleResolve,
  onDelete,
  compact,
}: {
  comment: CopyComment
  clientName: string
  onReply: () => void
  onToggleResolve: () => void
  onDelete: () => void
  compact?: boolean
}) {
  const isAdmin = comment.author_type === 'admin'
  const label = isAdmin
    ? comment.author_name || 'Cursive Team'
    : comment.author_name || clientName || 'Client'
  const isResolved = comment.status === 'resolved'

  return (
    <div
      className={`rounded-lg border ${
        isResolved
          ? 'bg-muted/40 border-border opacity-75'
          : isAdmin
            ? 'bg-amber-50 border-amber-200'
            : 'bg-blue-50 border-blue-200'
      } ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'}`}
    >
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span
          className={`text-[11px] font-semibold ${
            isAdmin ? 'text-amber-800' : 'text-blue-800'
          }`}
        >
          {label}
        </span>
        <span className="text-[10px] text-muted-foreground">{formatRelative(comment.created_at)}</span>
        {isResolved && (
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            · Resolved
          </span>
        )}
      </div>
      {comment.quoted_text && (
        <p className="text-[11px] text-muted-foreground italic border-l-2 border-border pl-2 mb-1 line-clamp-2">
          &ldquo;{comment.quoted_text}&rdquo;
        </p>
      )}
      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
        {comment.body}
      </p>
      {!compact && (
        <div className="flex items-center gap-3 mt-1.5">
          <button
            type="button"
            onClick={onReply}
            className="text-[11px] text-muted-foreground hover:text-foreground font-medium"
          >
            Reply
          </button>
          <button
            type="button"
            onClick={onToggleResolve}
            className="text-[11px] text-muted-foreground hover:text-foreground font-medium inline-flex items-center gap-1"
          >
            {isResolved ? (
              <>
                <RotateCcw className="h-2.5 w-2.5" /> Reopen
              </>
            ) : (
              <>
                <Check className="h-2.5 w-2.5" /> Resolve
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-[11px] text-muted-foreground hover:text-destructive font-medium inline-flex items-center gap-1"
            title="Delete comment"
          >
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        </div>
      )}
    </div>
  )
}
