'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow, format } from 'date-fns'
import {
  ArrowLeft,
  Mail,
  Clock,
  Tag,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Send,
  User,
  Building2,
  ExternalLink,
  Check,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { useToast } from '@/lib/hooks/use-toast'
import { safeError } from '@/lib/utils/log-sanitizer'
import DOMPurify from 'isomorphic-dompurify'

// ─── Types ────────────────────────────────────────────────────────────────────

type ConversationStatus = 'active' | 'waiting_reply' | 'replied' | 'closed' | 'archived'
type ConversationPriority = 'low' | 'normal' | 'high' | 'urgent'

interface Message {
  id: string
  direction: 'inbound' | 'outbound'
  from: { email: string; name?: string }
  to: { email: string; name?: string }
  subject: string
  body_text?: string
  body_html?: string
  snippet?: string
  sent_at?: string
  received_at?: string
  is_read: boolean
  classification?: string
  is_auto_reply?: boolean
  is_out_of_office?: boolean
  created_at: string
}

interface ConversationDetail {
  id: string
  status: ConversationStatus
  priority: ConversationPriority
  subject: string
  message_count: number
  unread_count: number
  last_message_at: string
  sentiment?: string
  intent?: string
  tags?: string[]
  notes?: string
  lead: {
    id: string
    email: string
    name: string
    company?: string
    title?: string
  } | null
  campaign?: { id: string; name: string } | null
  created_at: string
}

interface ConversationResponse {
  conversation: ConversationDetail
  messages: Message[]
  total_messages: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<ConversationStatus, string> = {
  active: 'bg-blue-100 text-blue-800 border-blue-200',
  waiting_reply: 'bg-amber-100 text-amber-800 border-amber-200',
  replied: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
  archived: 'bg-gray-100 text-gray-500 border-gray-200',
}

const PRIORITY_COLORS: Record<ConversationPriority, string> = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  normal: 'bg-blue-50 text-blue-600',
  low: 'bg-gray-100 text-gray-500',
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'waiting_reply', label: 'Waiting Reply' },
  { value: 'replied', label: 'Replied' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConversationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()
  const id = params.id as string

  const [replyBody, setReplyBody] = useState('')
  const [showReply, setShowReply] = useState(false)

  // Fetch conversation + messages (mark as read on load)
  const { data, isLoading, isError, error, refetch } = useQuery<ConversationResponse>({
    queryKey: ['conversation', id],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${id}?mark_read=true`)
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/conversations')
          return Promise.reject(new Error('Not found'))
        }
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to load conversation')
      }
      const json = await res.json()
      return json.data as ConversationResponse
    },
    staleTime: 30_000,
    retry: 1,
  })

  // Invalidate conversations list so unread count updates
  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }
  }, [queryClient])

  // Update status/priority mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: { status?: ConversationStatus; priority?: ConversationPriority }) => {
      const res = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to update conversation')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', id] })
      toast.success('Conversation updated')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  // Send reply mutation
  const replyMutation = useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(`/api/conversations/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          body_html: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
          body_text: body,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to send reply')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', id] })
      toast.success('Reply queued for approval')
      setReplyBody('')
      setShowReply(false)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="h-10 w-full bg-muted rounded" />
        <div className="h-64 w-full bg-muted rounded" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-destructive" />
        <p className="text-sm font-medium text-destructive mb-1">Failed to load conversation</p>
        <p className="text-xs text-muted-foreground mb-4">{(error as Error)?.message}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (!data) return null

  const { conversation, messages } = data

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Back nav */}
      <Link
        href="/conversations"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Conversations
      </Link>

      {/* Header */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-foreground truncate">{conversation.subject}</h1>
            {conversation.lead && (
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {conversation.lead.name || conversation.lead.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {conversation.lead.email}
                </span>
                {conversation.lead.company && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {conversation.lead.company}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Lead link */}
          {conversation.lead && (
            <Link href={`/crm/leads?email=${encodeURIComponent(conversation.lead.email)}`}>
              <Button variant="outline" size="sm" className="shrink-0">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                View Lead
              </Button>
            </Link>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status</span>
            <Select
              value={conversation.status}
              options={STATUS_OPTIONS}
              onChange={(e) =>
                updateMutation.mutate({ status: e.target.value as ConversationStatus })
              }
              disabled={updateMutation.isPending}
              className="h-7 text-xs py-0 w-36"
            />
          </div>

          {/* Priority */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Priority</span>
            <Select
              value={conversation.priority}
              options={PRIORITY_OPTIONS}
              onChange={(e) =>
                updateMutation.mutate({ priority: e.target.value as ConversationPriority })
              }
              disabled={updateMutation.isPending}
              className="h-7 text-xs py-0 w-28"
            />
          </div>

          {/* Tags */}
          {conversation.tags && conversation.tags.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              {conversation.tags.map((tag) => (
                <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          )}

          {/* Campaign */}
          {conversation.campaign && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {conversation.campaign.name}
            </span>
          )}

          {/* Message count */}
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
            <Clock className="h-3.5 w-3.5" />
            Last activity {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Messages thread */}
      <div className="space-y-3">
        {messages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <Mail className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
      </div>

      {/* Reply area */}
      <div className="rounded-lg border border-border bg-card">
        {showReply ? (
          <div className="p-4 space-y-3">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Write your reply..."
              className="w-full min-h-[120px] text-sm px-3 py-2 border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring"
              autoFocus
            />
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowReply(false); setReplyBody('') }}
              >
                <X className="h-4 w-4 mr-1.5" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => replyMutation.mutate(replyBody)}
                disabled={!replyBody.trim() || replyMutation.isPending}
              >
                <Send className="h-4 w-4 mr-1.5" />
                {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowReply(true)}
            className="w-full flex items-center gap-3 px-5 py-4 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors rounded-lg"
          >
            <Send className="h-4 w-4" />
            Reply to this conversation...
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const [expanded, setExpanded] = useState(true)
  const isOutbound = message.direction === 'outbound'
  const timestamp = message.sent_at || message.received_at || message.created_at

  const displayTime = (() => {
    try {
      return format(new Date(timestamp), 'MMM d, yyyy h:mm a')
    } catch {
      return 'Unknown time'
    }
  })()

  const sender = isOutbound ? message.from : message.from
  const senderName = sender.name || sender.email

  return (
    <div
      className={`rounded-lg border ${
        isOutbound
          ? 'border-blue-200 bg-blue-50/50'
          : message.is_auto_reply || message.is_out_of_office
            ? 'border-amber-200 bg-amber-50/30'
            : 'border-border bg-card'
      }`}
    >
      {/* Message header */}
      <button
        className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground truncate">{senderName}</span>
            {isOutbound && (
              <Badge className="text-[10px] h-4 px-1.5 bg-blue-100 text-blue-700 border-blue-200">
                Outbound
              </Badge>
            )}
            {message.is_auto_reply && (
              <Badge className="text-[10px] h-4 px-1.5 bg-amber-100 text-amber-700 border-amber-200">
                Auto-reply
              </Badge>
            )}
            {message.is_out_of_office && (
              <Badge className="text-[10px] h-4 px-1.5 bg-amber-100 text-amber-700 border-amber-200">
                Out of Office
              </Badge>
            )}
            {message.classification && (
              <Badge className="text-[10px] h-4 px-1.5 bg-purple-100 text-purple-700 border-purple-200">
                {message.classification}
              </Badge>
            )}
          </div>
          {!expanded && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {message.snippet || message.body_text?.slice(0, 100)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
          <span>{displayTime}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Message body */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border/60 pt-3">
          {message.body_html ? (
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.body_html) }}
            />
          ) : message.body_text ? (
            <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
              {message.body_text}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground italic">No content</p>
          )}
        </div>
      )}
    </div>
  )
}
