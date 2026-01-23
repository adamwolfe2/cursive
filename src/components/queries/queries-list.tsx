'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { QueryCardSkeleton } from '@/components/skeletons'
import { ErrorDisplay, EmptyState } from '@/components/error-display'

interface Query {
  id: string
  name: string
  status: 'active' | 'paused' | 'completed'
  total_leads_generated: number
  leads_this_week: number
  last_run_at: string | null
  global_topics?: {
    topic: string
    category: string
  }
}

export function QueriesList() {
  const { data: queries, isLoading, error, refetch } = useQuery<Query[]>({
    queryKey: ['queries'],
    queryFn: async () => {
      const response = await fetch('/api/queries')
      if (!response.ok) throw new Error('Failed to fetch queries')
      const data = await response.json()
      return data.data || []
    },
  })

  if (error) {
    return (
      <ErrorDisplay
        error={error as Error}
        retry={() => refetch()}
        variant="card"
        title="Failed to load queries"
      />
    )
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <QueryCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!queries || queries.length === 0) {
    return (
      <EmptyState
        title="No queries yet"
        description="Get started by creating your first query to track topics"
        action={
          <Link
            href="/queries/new"
            className="h-10 px-4 inline-flex items-center text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-all duration-150"
          >
            <svg
              className="-ml-0.5 mr-1.5 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Query
          </Link>
        }
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {queries.map((query) => (
        <Link
          key={query.id}
          href={`/queries/${query.id}`}
          className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-150"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="truncate text-[15px] font-medium text-zinc-900">
                {query.name || query.global_topics?.topic}
              </h3>
              <p className="mt-1 text-[13px] text-zinc-600 capitalize">
                {query.global_topics?.category}
              </p>
            </div>
            <span
              className={`ml-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
                query.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                  : query.status === 'paused'
                    ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                    : 'bg-zinc-100 text-zinc-600 ring-zinc-500/20'
              }`}
            >
              {query.status}
            </span>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-zinc-600">Total Leads</span>
              <span className="font-medium text-zinc-900">
                {query.total_leads_generated || 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-zinc-600">This Week</span>
              <span className="font-medium text-zinc-900">
                {query.leads_this_week || 0}
              </span>
            </div>
          </div>

          {query.last_run_at && (
            <div className="mt-4 pt-3 border-t border-zinc-200 text-[12px] text-zinc-500">
              Last run: {new Date(query.last_run_at).toLocaleDateString()}
            </div>
          )}
        </Link>
      ))}
    </div>
  )
}
