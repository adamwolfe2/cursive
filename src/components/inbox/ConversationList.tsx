'use client'

import { Skeleton } from '@/components/ui'
import { ConversationStatusBadge } from './ConversationStatusBadge'
import type { InboxConversation } from '@/types/sdr'

interface ConversationListProps {
  readonly conversations: InboxConversation[]
  readonly isLoading: boolean
  readonly selectedId: string | null
  readonly onSelect: (id: string) => void
  readonly total: number
  readonly page: number
  readonly onPageChange: (page: number) => void
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function SentimentDot({ sentiment }: { readonly sentiment: string | null }) {
  if (!sentiment) return null
  const colors: Record<string, string> = {
    positive: 'bg-green-500',
    neutral: 'bg-gray-400',
    negative: 'bg-red-500',
    question: 'bg-yellow-500',
  }
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[sentiment] || 'bg-gray-400'}`}
      title={sentiment}
    />
  )
}

export function ConversationList({
  conversations,
  isLoading,
  selectedId,
  onSelect,
  total,
  page,
  onPageChange,
}: ConversationListProps) {
  const limit = 30
  const totalPages = Math.max(1, Math.ceil(total / limit))

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-zinc-400">
        No conversations found
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="overflow-y-auto flex-1">
        {conversations.map((conv) => {
          const leadName =
            conv.lead.firstName || conv.lead.lastName
              ? `${conv.lead.firstName || ''} ${conv.lead.lastName || ''}`.trim()
              : conv.lead.email
          const isSelected = selectedId === conv.id

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full text-left p-3 border-b transition-colors ${
                isSelected
                  ? 'bg-blue-50 border-l-2 border-l-blue-500'
                  : 'hover:bg-zinc-50 border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {conv.unreadCount > 0 && (
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium text-zinc-800 truncate">
                    {leadName}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 flex-shrink-0 ml-2">
                  {timeAgo(conv.lastMessageAt)}
                </span>
              </div>

              {conv.lead.companyName && (
                <div className="text-xs text-zinc-500 truncate mb-1">
                  {conv.lead.companyName}
                </div>
              )}

              {conv.lastMessageSnippet && (
                <div className="text-xs text-zinc-400 line-clamp-2 mb-1.5">
                  {conv.lastMessageDirection === 'outbound' && (
                    <span className="text-zinc-500">You: </span>
                  )}
                  {conv.lastMessageSnippet}
                </div>
              )}

              <div className="flex items-center gap-1.5 flex-wrap">
                <ConversationStatusBadge stage={conv.conversationStage} />
                <SentimentDot sentiment={conv.sentiment} />
                {conv.hasPendingDraft && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                    draft
                  </span>
                )}
                {conv.campaignName && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-500 truncate max-w-[120px]">
                    {conv.campaignName}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t bg-zinc-50 text-xs text-zinc-500">
          <span>
            {total} conversation{total !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-2 py-1 rounded hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-2 py-1 rounded hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
