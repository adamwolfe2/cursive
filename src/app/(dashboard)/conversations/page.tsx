'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import {
  MessageSquare,
  Mail,
  Clock,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Types ────────────────────────────────────────────────────────────────────

type ConversationStatus = 'active' | 'waiting_reply' | 'replied' | 'closed' | 'archived'
type ConversationPriority = 'low' | 'normal' | 'high' | 'urgent'

interface ConversationLead {
  id: string
  email: string
  first_name: string
  last_name: string
}

interface ConversationCampaign {
  id: string
  name: string
}

interface Conversation {
  id: string
  status: ConversationStatus
  priority: ConversationPriority
  subject: string
  message_count: number
  unread_count: number
  last_message_at: string
  lead: ConversationLead
  campaign: ConversationCampaign
}

interface ConversationsResponse {
  conversations: Conversation[]
  total: number
  page: number
  limit: number
  total_pages: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Waiting Reply', value: 'waiting_reply' },
  { label: 'Replied', value: 'replied' },
  { label: 'Closed', value: 'closed' },
]

const PRIORITY_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Priorities', value: 'all' },
  { label: 'Urgent', value: 'urgent' },
  { label: 'High', value: 'high' },
  { label: 'Normal', value: 'normal' },
  { label: 'Low', value: 'low' },
]

const STATUS_BADGE_VARIANTS: Record<
  ConversationStatus,
  { label: string; className: string }
> = {
  active: {
    label: 'Active',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  waiting_reply: {
    label: 'Waiting Reply',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  replied: {
    label: 'Replied',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  archived: {
    label: 'Archived',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
}

const PRIORITY_DOT_COLORS: Record<ConversationPriority, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  normal: 'bg-blue-400',
  low: 'bg-gray-400',
}

const PRIORITY_LABELS: Record<ConversationPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  normal: 'Normal',
  low: 'Low',
}

const PAGE_LIMIT = 20

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function fetchConversations(params: Record<string, string>): Promise<ConversationsResponse> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value && value !== 'all') {
      query.set(key, value)
    }
  }
  const res = await fetch(`/api/conversations?${query.toString()}`)
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error')
    throw new Error(text || `Request failed with status ${res.status}`)
  }
  return res.json()
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PriorityDot({ priority }: { priority: ConversationPriority }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${PRIORITY_DOT_COLORS[priority]}`}
      title={PRIORITY_LABELS[priority]}
      aria-label={`Priority: ${PRIORITY_LABELS[priority]}`}
    />
  )
}

function StatusBadge({ status }: { status: ConversationStatus }) {
  const config = STATUS_BADGE_VARIANTS[status]
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const leadName = [conversation.lead.first_name, conversation.lead.last_name]
    .filter(Boolean)
    .join(' ') || conversation.lead.email

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(conversation.last_message_at), {
        addSuffix: true,
      })
    } catch {
      return 'Unknown time'
    }
  })()

  const hasUnread = conversation.unread_count > 0

  return (
    <div
      className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/40 ${
        hasUnread ? 'bg-blue-50/30' : ''
      }`}
    >
      {/* Priority dot */}
      <div className="mt-1.5 shrink-0">
        <PriorityDot priority={conversation.priority} />
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          {/* Lead info */}
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
            <span
              className={`truncate text-sm font-semibold ${
                hasUnread ? 'text-foreground' : 'text-foreground/80'
              }`}
            >
              {leadName}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {conversation.lead.email}
            </span>
          </div>

          {/* Timestamp */}
          <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Subject */}
        <p
          className={`mt-0.5 truncate text-sm ${
            hasUnread ? 'font-medium text-foreground' : 'text-muted-foreground'
          }`}
        >
          {conversation.subject}
        </p>

        {/* Meta row */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {/* Campaign */}
          <span className="flex items-center gap-1 text-xs text-muted-foreground/70">
            <Mail className="h-3 w-3" />
            {conversation.campaign.name}
          </span>

          {/* Status badge */}
          <StatusBadge status={conversation.status} />

          {/* Unread badge */}
          {hasUnread && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white">
              {conversation.unread_count}
            </span>
          )}

          {/* Message count */}
          <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
            <MessageSquare className="h-3 w-3" />
            {conversation.message_count}
          </span>
        </div>
      </div>
    </div>
  )
}

function EmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean
  onClearFilters: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          {hasFilters ? 'No conversations match your filters' : 'No conversations yet'}
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          {hasFilters
            ? 'Try adjusting your filters or search query to find what you\'re looking for.'
            : 'Conversations with your leads will appear here once campaigns are active.'}
        </p>
      </div>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConversationsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Read filter state from URL
  const currentStatus = searchParams.get('status') || 'all'
  const currentPriority = searchParams.get('priority') || 'all'
  const currentSearch = searchParams.get('search') || ''
  const currentUnreadOnly = searchParams.get('has_unread') === 'true'
  const currentPage = parseInt(searchParams.get('page') || '1', 10)

  // Local search input state (debounced via URL push)
  const [searchInput, setSearchInput] = useState(currentSearch)

  // Helper to update URL params
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '' || value === 'all' || value === 'false') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      // Reset to page 1 on filter change (unless explicitly setting page)
      if (!('page' in updates)) {
        params.delete('page')
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, router, pathname]
  )

  // Build query params for API
  const queryParams: Record<string, string> = {
    page: String(currentPage),
    limit: String(PAGE_LIMIT),
  }
  if (currentStatus !== 'all') queryParams.status = currentStatus
  if (currentPriority !== 'all') queryParams.priority = currentPriority
  if (currentSearch) queryParams.search = currentSearch
  if (currentUnreadOnly) queryParams.has_unread = 'true'

  const { data, isLoading, isError, error } = useQuery<ConversationsResponse>({
    queryKey: ['conversations', queryParams],
    queryFn: () => fetchConversations(queryParams),
    staleTime: 30_000,
    retry: 2,
  })

  // Show toast on error
  if (isError) {
    const message =
      error instanceof Error ? error.message : 'Failed to load conversations'
    toast.error(message)
  }

  const conversations = data?.conversations ?? []
  const total = data?.total ?? 0
  const totalPages = data?.total_pages ?? 1
  const unreadTotal = conversations.reduce((sum, c) => sum + c.unread_count, 0)
  const activeCount = conversations.filter((c) => c.status === 'active').length

  const hasFilters =
    currentStatus !== 'all' ||
    currentPriority !== 'all' ||
    !!currentSearch ||
    currentUnreadOnly

  const handleClearFilters = () => {
    setSearchInput('')
    router.push(pathname)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ search: searchInput || null })
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      updateParams({ search: searchInput || null })
    }
  }

  const startItem = total === 0 ? 0 : (currentPage - 1) * PAGE_LIMIT + 1
  const endItem = Math.min(currentPage * PAGE_LIMIT, total)

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Conversations
            </h1>
            {unreadTotal > 0 && (
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-semibold text-white">
                {unreadTotal}
              </span>
            )}
          </div>

          {/* Stats bar */}
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              <span>
                <strong className="text-foreground">{total}</strong> total
              </span>
            </span>
            {unreadTotal > 0 && (
              <span className="flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <span>
                  <strong className="text-foreground">{unreadTotal}</strong> unread
                </span>
              </span>
            )}
            {activeCount > 0 && (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-green-500" />
                <span>
                  <strong className="text-foreground">{activeCount}</strong> active (this page)
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="space-y-3">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => updateParams({ status: tab.value })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                currentStatus === tab.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Priority + Search + Unread toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={currentPriority}
            onValueChange={(val) => updateParams({ priority: val })}
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 w-56 pl-8 pr-3"
                placeholder="Search conversations..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
          </form>

          <button
            onClick={() =>
              updateParams({ has_unread: currentUnreadOnly ? 'false' : 'true' })
            }
            className={`inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              currentUnreadOnly
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                currentUnreadOnly ? 'bg-blue-600' : 'bg-muted-foreground/40'
              }`}
            />
            Unread only
          </button>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-muted-foreground"
              onClick={handleClearFilters}
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* ── Conversation list ── */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-start gap-4 px-5 py-4">
                <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <div className="flex gap-2">
                      <div className="h-4 w-28 rounded bg-muted" />
                      <div className="h-4 w-36 rounded bg-muted" />
                    </div>
                    <div className="h-4 w-16 rounded bg-muted" />
                  </div>
                  <div className="h-4 w-2/3 rounded bg-muted" />
                  <div className="flex gap-2">
                    <div className="h-3.5 w-20 rounded bg-muted" />
                    <div className="h-5 w-14 rounded-full bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Failed to load conversations. Please try again.
            </p>
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClearFilters={handleClearFilters} />
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conversation) => (
              <ConversationRow key={conversation.id} conversation={conversation} />
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {!isLoading && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of{' '}
            <strong>{total}</strong> conversations
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => updateParams({ page: String(currentPage - 1) })}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>

            <span className="min-w-[4rem] text-center text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => updateParams({ page: String(currentPage + 1) })}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
