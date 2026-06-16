'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import { safeError } from '@/lib/utils/log-sanitizer'
import FunnelStages from '@/components/admin/FunnelStages'
import type { LaunchFunnelStage, FunnelRange } from '@/lib/funnel/launch-funnel'

interface LaunchFunnelData {
  range: FunnelRange
  generatedAt: string
  stages: LaunchFunnelStage[]
}

const RANGE_OPTIONS: Array<{ value: FunnelRange; label: string }> = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All-time' },
]

export default function LaunchFunnelPage() {
  const { isAdmin, authChecked } = useAdminAuth()
  const [data, setData] = useState<LaunchFunnelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<FunnelRange>('30d')

  const fetchFunnel = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/launch-funnel?range=${range}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch (error) {
      safeError('[LaunchFunnel]', 'Failed to fetch funnel:', error)
    }
    setLoading(false)
  }, [range])

  useEffect(() => {
    if (authChecked && isAdmin) fetchFunnel()
  }, [authChecked, isAdmin, fetchFunnel])

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[13px] text-zinc-600">Checking access...</p>
      </div>
    )
  }
  if (!isAdmin) return null

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Launch Funnel</h1>
          <p className="text-[13px] text-zinc-600 mt-1">
            Traffic → estimate → call → purchase → install → first visitor → renewal
          </p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as FunnelRange)}
          className="h-9 px-3 text-[13px] border border-zinc-300 rounded-lg focus:outline-none focus:border-primary"
        >
          {RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Body */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="h-[88px] bg-zinc-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : data ? (
        <>
          <FunnelStages stages={data.stages} />
          <p className="mt-4 text-[11px] text-zinc-400">
            Read-only snapshot · counts scoped to the selected window · a dash
            (—) means the stage had no data or was unavailable.
          </p>
        </>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-lg p-8 text-center text-[13px] text-zinc-500">
          No funnel data available.
        </div>
      )}
    </div>
  )
}
