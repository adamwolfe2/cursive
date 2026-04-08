'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui'
import { AIDraftCard } from './AIDraftCard'
import { QuickActions } from './QuickActions'
import { ReplyComposer } from './ReplyComposer'
import type { InboxConversation } from '@/types/sdr'
import type { ConversationMessage } from '@/lib/services/campaign/conversation.service'

interface ConversationThreadProps {
  readonly conversationId: string | null
  readonly conversation: InboxConversation | null
  readonly onBack?: () => void
}

function formatTime(date: string | null): string {
  if (!date) return ''
  return new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ConversationThread({ conversationId, conversation, onBack }: ConversationThreadProps) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['conversation-detail', conversationId],
    queryFn: async () => {
      if (!conversationId) return null
      const res = await fetch(`/api/inbox/conversations/${conversationId}`)
      if (!res.ok) throw new Error('Failed to load conversation')
      return res.json() as Promise<{
        conversation: InboxConversation
        messages: ConversationMessage[]
        pendingDraft: {
          id: string
          body: string
          confidence: number
          knowledgeEntries: string[]
        } | null
      }>
    },
    enabled: !!conversationId,
    staleTime: 10_000,
  })

  useEffect(() => {
    if (conversationId && data) {
      queryClient.invalidateQueries({ queryKey: ['inbox-conversations'] })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, data?.messages?.length])

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full px-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/40 mb-4">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">No conversation selected</p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Pick a conversation from the list on the left to read the thread, see the AI-suggested reply, and respond.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-6 mt-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-3/4" />
          ))}
        </div>
      </div>
    )
  }

  const messages = data?.messages ?? []
  const detail = data?.conversation ?? conversation
  const pendingDraft = data?.pendingDraft ?? null

  const leadName = detail?.lead
    ? `${detail.lead.firstName || ''} ${detail.lead.lastName || ''}`.trim() || detail.lead.email
    : 'Unknown'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-white space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {onBack && (
              <button
                onClick={onBack}
                className="md:hidden flex-shrink-0 text-zinc-500 hover:text-zinc-700 text-sm font-medium transition-colors"
                aria-label="Back to conversations"
              >
                ← Back
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-zinc-900 truncate">{leadName}</h2>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5 flex-wrap">
                {detail?.lead?.companyName && <span>{detail.lead.companyName}</span>}
                {detail?.lead?.jobTitle && (
                  <>
                    <span className="text-zinc-300">-</span>
                    <span>{detail.lead.jobTitle}</span>
                  </>
                )}
                {detail?.lead?.email && (
                  <>
                    <span className="text-zinc-300">-</span>
                    <span className="truncate">{detail.lead.email}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {detail?.campaignName && (
            <span className="flex-shrink-0 px-2 py-1 bg-zinc-100 text-zinc-600 text-xs rounded">
              {detail.campaignName}
            </span>
          )}
        </div>

        {conversationId && (
          <QuickActions
            conversationId={conversationId}
            hasDraft={!!pendingDraft}
            onAction={() => {
              queryClient.invalidateQueries({ queryKey: ['conversation-detail', conversationId] })
              queryClient.invalidateQueries({ queryKey: ['inbox-conversations'] })
            }}
          />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-sm text-zinc-400 text-center py-8">No messages yet</div>
        )}

        {messages.map((msg, idx) => {
          const isOutbound = msg.direction === 'outbound'
          return (
            <div
              key={msg.id}
              className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-4 py-3 ${
                  isOutbound
                    ? 'bg-blue-50 border border-blue-100'
                    : 'bg-zinc-50 border border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span className="text-xs font-medium text-zinc-600">
                    {isOutbound ? 'You' : msg.fromName || msg.fromEmail}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {formatTime(msg.sentAt || msg.receivedAt || msg.createdAt)}
                  </span>
                </div>
                {idx === 0 && msg.subject && (
                  <div className="text-xs font-medium text-zinc-700 mb-1">
                    {msg.subject}
                  </div>
                )}
                <div className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">
                  {msg.bodyText || msg.snippet || ''}
                </div>
              </div>
            </div>
          )
        })}

        {pendingDraft && conversationId && (
          <AIDraftCard
            conversationId={conversationId}
            draft={pendingDraft}
          />
        )}
      </div>

      {conversationId && (
        <ReplyComposer
          conversationId={conversationId}
          onSent={() => {
            queryClient.invalidateQueries({ queryKey: ['conversation-detail', conversationId] })
            queryClient.invalidateQueries({ queryKey: ['inbox-conversations'] })
          }}
        />
      )}
    </div>
  )
}
