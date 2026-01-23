'use client'

import { useQuery } from '@tanstack/react-query'
import { formatDate, formatNumber } from '@/lib/utils'

export function LeadStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['lead-stats'],
    queryFn: async () => {
      const response = await fetch('/api/leads/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-zinc-200 bg-white p-6"
          >
            <div className="h-4 w-20 bg-zinc-200 rounded"></div>
            <div className="mt-2 h-8 w-16 bg-zinc-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  const intentBreakdown = data?.data?.intent_breakdown || {}
  const platformUploads = data?.data?.platform_uploads || []

  // Calculate percentages
  const total = intentBreakdown.total_count || 0
  const hotPercent = total > 0 ? Math.round((intentBreakdown.hot_count / total) * 100) : 0
  const warmPercent = total > 0 ? Math.round((intentBreakdown.warm_count / total) * 100) : 0
  const coldPercent = total > 0 ? Math.round((intentBreakdown.cold_count / total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Intent Breakdown Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Hot Leads */}
        <div className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-6 shadow-sm hover:border-red-300 transition-colors">
          <dt className="text-[13px] font-medium text-zinc-600">
            Hot Leads
          </dt>
          <dd className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-zinc-900">
              {formatNumber(intentBreakdown.hot_count || 0)}
            </span>
            {hotPercent > 0 && (
              <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                {hotPercent}%
              </span>
            )}
          </dd>
          {/* Progress Bar */}
          <div className="mt-4 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
              style={{ width: `${hotPercent}%` }}
            />
          </div>
        </div>

        {/* Warm Leads */}
        <div className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-6 shadow-sm hover:border-amber-300 transition-colors">
          <dt className="text-[13px] font-medium text-zinc-600">
            Warm Leads
          </dt>
          <dd className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-zinc-900">
              {formatNumber(intentBreakdown.warm_count || 0)}
            </span>
            {warmPercent > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                {warmPercent}%
              </span>
            )}
          </dd>
          {/* Progress Bar */}
          <div className="mt-4 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
              style={{ width: `${warmPercent}%` }}
            />
          </div>
        </div>

        {/* Cold Leads */}
        <div className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-6 shadow-sm hover:border-zinc-300 transition-colors">
          <dt className="text-[13px] font-medium text-zinc-600">
            Cold Leads
          </dt>
          <dd className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-zinc-900">
              {formatNumber(intentBreakdown.cold_count || 0)}
            </span>
            {coldPercent > 0 && (
              <span className="inline-flex items-center rounded-full bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-inset ring-zinc-600/20">
                {coldPercent}%
              </span>
            )}
          </dd>
          {/* Progress Bar */}
          <div className="mt-4 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-zinc-400 to-zinc-500 rounded-full transition-all duration-500"
              style={{ width: `${coldPercent}%` }}
            />
          </div>
        </div>

        {/* Total Leads */}
        <div className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 shadow-sm">
          <dt className="text-[13px] font-medium text-emerald-900">
            Total Leads
          </dt>
          <dd className="mt-2">
            <span className="text-3xl font-semibold text-emerald-900">
              {formatNumber(total)}
            </span>
          </dd>
          <div className="mt-4">
            <span className="text-xs text-emerald-700">
              {intentBreakdown.hot_count + intentBreakdown.warm_count > 0
                ? `${Math.round(((intentBreakdown.hot_count + intentBreakdown.warm_count) / total) * 100)}% qualified`
                : 'No qualified leads yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Distribution Chart */}
      {total > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-zinc-900 mb-4">
            Intent Distribution
          </h3>
          <div className="flex h-4 w-full overflow-hidden rounded-full">
            {intentBreakdown.hot_count > 0 && (
              <div
                className="bg-red-500 transition-all duration-500"
                style={{ width: `${hotPercent}%` }}
                title={`Hot: ${hotPercent}%`}
              />
            )}
            {intentBreakdown.warm_count > 0 && (
              <div
                className="bg-amber-500 transition-all duration-500"
                style={{ width: `${warmPercent}%` }}
                title={`Warm: ${warmPercent}%`}
              />
            )}
            {intentBreakdown.cold_count > 0 && (
              <div
                className="bg-zinc-400 transition-all duration-500"
                style={{ width: `${coldPercent}%` }}
                title={`Cold: ${coldPercent}%`}
              />
            )}
          </div>
          <div className="mt-4 flex items-center justify-between text-[13px]">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-zinc-600">
                Hot ({intentBreakdown.hot_count})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-zinc-600">
                Warm ({intentBreakdown.warm_count})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-zinc-400" />
              <span className="text-zinc-600">
                Cold ({intentBreakdown.cold_count})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Platform Upload Stats */}
      {platformUploads.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-zinc-200">
            <h3 className="text-base font-semibold text-zinc-900">
              Platform Uploads
            </h3>
            <p className="mt-1 text-[13px] text-zinc-500">
              Recent lead deliveries to connected platforms
            </p>
          </div>
          <div className="divide-y divide-zinc-200">
            {platformUploads.map((platform: any, idx: number) => (
              <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                <div className="flex-1">
                  <h4 className="font-medium text-zinc-900 text-[13px]">
                    {platform.platform_name}
                  </h4>
                  <p className="text-[13px] text-zinc-500">
                    Last upload: {formatDate(platform.last_upload)}
                  </p>
                </div>
                <div className="flex items-center gap-6 text-[13px]">
                  <div className="text-right">
                    <div className="font-medium text-zinc-900">
                      {formatNumber(platform.hot_leads)}
                    </div>
                    <div className="text-zinc-500">Hot</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-zinc-900">
                      {formatNumber(platform.warm_leads)}
                    </div>
                    <div className="text-zinc-500">Warm</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-emerald-600">
                      {formatNumber(platform.total_leads)}
                    </div>
                    <div className="text-zinc-500">Total</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {total === 0 && (
        <div className="rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-12 text-center">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-base font-semibold text-zinc-900">
            No leads yet
          </h3>
          <p className="mt-1 text-[13px] text-zinc-500">
            Get started by creating a query to discover leads
          </p>
        </div>
      )}
    </div>
  )
}
