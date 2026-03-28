'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ConversationList } from '@/components/inbox/ConversationList'
import { ConversationThread } from '@/components/inbox/ConversationThread'
import { InboxFilters } from '@/components/inbox/InboxFilters'
import type { InboxConversation, InboxFilters as InboxFiltersType } from '@/types/sdr'

export default function InboxPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filters, setFilters] = useState<InboxFiltersType>({})
  const [page, setPage] = useState(1)
  const [mobileShowThread, setMobileShowThread] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['inbox-conversations', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
        statuses.forEach((s) => params.append('status', s))
      }
      if (filters.conversationStage) {
        const stages = Array.isArray(filters.conversationStage)
          ? filters.conversationStage
          : [filters.conversationStage]
        stages.forEach((s) => params.append('stage', s))
      }
      if (filters.campaignId) params.set('campaign_id', filters.campaignId)
      if (filters.hasPendingDraft) params.set('has_pending_draft', 'true')
      if (filters.search) params.set('search', filters.search)
      params.set('page', String(page))
      params.set('limit', '30')

      const res = await fetch(`/api/inbox/conversations?${params}`)
      if (!res.ok) throw new Error('Failed to load conversations')
      return res.json() as Promise<{
        conversations: InboxConversation[]
        total: number
        page: number
        limit: number
      }>
    },
    staleTime: 15_000,
  })

  const conversations = data?.conversations ?? []
  const total = data?.total ?? 0
  const selected = conversations.find((c) => c.id === selectedId) ?? null

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setMobileShowThread(true)
  }

  const handleBack = () => {
    setMobileShowThread(false)
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white">
      {/* Left panel: conversation list */}
      <div
        className={`w-full md:w-[360px] md:flex-shrink-0 border-r flex flex-col ${
          mobileShowThread ? 'hidden md:flex' : 'flex'
        }`}
      >
        <InboxFilters filters={filters} onChange={setFilters} />
        <ConversationList
          conversations={conversations}
          isLoading={isLoading}
          selectedId={selectedId}
          onSelect={handleSelect}
          total={total}
          page={page}
          onPageChange={setPage}
        />
      </div>

      {/* Right panel: conversation thread */}
      <div
        className={`flex-1 min-w-0 ${
          mobileShowThread ? 'flex flex-col' : 'hidden md:flex md:flex-col'
        }`}
      >
        <ConversationThread
          conversationId={selectedId}
          conversation={selected}
          onBack={handleBack}
        />
      </div>
    </div>
  )
}
