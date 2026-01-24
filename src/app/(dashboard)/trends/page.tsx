'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TopicCard } from '@/components/trends/topic-card'
import { useRouter } from 'next/navigation'
import { PageContainer, PageHeader } from '@/components/layout'

type TrendType = 'gainers' | 'losers'

interface Topic {
  id: string
  topic: string
  category: string
  current_volume: number
  trend_direction: 'up' | 'down' | 'stable'
  change_percent?: number
}

export default function TrendsPage() {
  const [activeTab, setActiveTab] = useState<TrendType>('gainers')
  const router = useRouter()

  const { data: trendsData, isLoading } = useQuery({
    queryKey: ['trends', activeTab],
    queryFn: async () => {
      const response = await fetch(`/api/trends?type=${activeTab}&limit=20`)
      if (!response.ok) throw new Error('Failed to fetch trends')
      return response.json()
    },
  })

  const topics = trendsData?.data?.[activeTab] || []

  const handleTrackTopic = (topicId: string, topicName: string) => {
    // Redirect to query wizard with pre-filled topic
    router.push(`/queries/new?topic_id=${topicId}&topic=${encodeURIComponent(topicName)}`)
  }

  return (
    <PageContainer>
      <PageHeader
        title="Trending Topics"
        description="Discover emerging trends and track topics with the highest growth"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Trends' },
        ]}
      />

    <div className="space-y-6">

      {/* Tabs */}
      <div className="border-b border-zinc-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('gainers')}
            className={`${
              activeTab === 'gainers'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'
            } whitespace-nowrap border-b-2 py-4 px-1 text-[13px] font-medium transition-colors`}
          >
            Top Gainers
          </button>
          <button
            onClick={() => setActiveTab('losers')}
            className={`${
              activeTab === 'losers'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'
            } whitespace-nowrap border-b-2 py-4 px-1 text-[13px] font-medium transition-colors`}
          >
            Top Losers
          </button>
        </nav>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-[13px] font-medium text-zinc-900">
              {activeTab === 'gainers' ? 'Top Gaining Topics' : 'Top Declining Topics'}
            </h3>
            <div className="mt-2 text-[13px] text-zinc-600">
              <p>
                {activeTab === 'gainers'
                  ? 'These topics are showing the highest growth in search volume. Track them to discover companies actively researching these areas.'
                  : 'These topics are showing declining interest. Use this data to identify shifting market trends.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-lg border border-zinc-200 bg-zinc-50 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Topics Grid */}
      {!isLoading && topics.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic: Topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onTrackTopic={handleTrackTopic}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && topics.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-[13px] font-medium text-zinc-900">
            No trends available
          </h3>
          <p className="mt-1 text-[13px] text-zinc-600">
            {activeTab === 'gainers'
              ? 'No gaining topics found in the current period.'
              : 'No declining topics found in the current period.'}
          </p>
        </div>
      )}
    </div>
    </PageContainer>
  )
}
