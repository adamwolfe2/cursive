'use client'

import { useQuery } from '@tanstack/react-query'

export function LeadStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['lead-stats'],
    queryFn: async () => {
      const response = await fetch('/api/leads/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-gray-200 bg-white p-6"
          >
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="mt-2 h-8 w-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  const intentBreakdown = data?.data?.intent_breakdown || {}
  const platformUploads = data?.data?.platform_uploads || []

  return (
    <div className="space-y-4">
      {/* Intent Breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <dt className="text-sm font-medium text-gray-500">🔥 Hot Leads</dt>
          <dd className="mt-2 flex items-baseline">
            <span className="text-3xl font-semibold text-gray-900">
              {intentBreakdown.hot_count || 0}
            </span>
            {intentBreakdown.hot_percentage > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                ({intentBreakdown.hot_percentage}%)
              </span>
            )}
          </dd>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <dt className="text-sm font-medium text-gray-500">⚡ Warm Leads</dt>
          <dd className="mt-2 flex items-baseline">
            <span className="text-3xl font-semibold text-gray-900">
              {intentBreakdown.warm_count || 0}
            </span>
            {intentBreakdown.warm_percentage > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                ({intentBreakdown.warm_percentage}%)
              </span>
            )}
          </dd>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <dt className="text-sm font-medium text-gray-500">❄️ Cold Leads</dt>
          <dd className="mt-2">
            <span className="text-3xl font-semibold text-gray-900">
              {intentBreakdown.cold_count || 0}
            </span>
          </dd>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <dt className="text-sm font-medium text-gray-500">Total Leads</dt>
          <dd className="mt-2">
            <span className="text-3xl font-semibold text-gray-900">
              {intentBreakdown.total_count || 0}
            </span>
          </dd>
        </div>
      </div>

      {/* Platform Upload Stats */}
      {platformUploads.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Platform Uploads
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {platformUploads.map((platform: any, idx: number) => (
              <div key={idx} className="px-6 py-4 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {platform.platform_name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Last upload:{' '}
                    {new Date(platform.last_upload).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div>
                    <span className="text-gray-500">🔥 Hot: </span>
                    <span className="font-medium text-gray-900">
                      {platform.hot_leads}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">⚡ Warm: </span>
                    <span className="font-medium text-gray-900">
                      {platform.warm_leads}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total: </span>
                    <span className="font-medium text-gray-900">
                      {platform.total_leads}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
