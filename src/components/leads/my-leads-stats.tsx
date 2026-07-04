'use client'

/**
 * My Leads Stats Component (Client)
 *
 * Shows statistics for the user's assigned leads.
 * Refetches when refreshKey changes (triggered by realtime events).
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { safeError } from '@/lib/utils/log-sanitizer'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface MyLeadsStatsProps {
  userId: string
  workspaceId: string
  refreshKey?: number
}

interface Stats {
  totalLeads: number
  newLeads: number
  contactedLeads: number
  convertedLeads: number
}

export function MyLeadsStats({ userId, workspaceId, refreshKey = 0 }: MyLeadsStatsProps) {
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    newLeads: 0,
    contactedLeads: 0,
    convertedLeads: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function fetchStats() {
      setLoading(true)
      setError(false)
      const supabase = createClient()

      try {
        const [totalResult, newResult, contactedResult, convertedResult] = await Promise.all([
          supabase
            .from('user_lead_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('workspace_id', workspaceId),
          supabase
            .from('user_lead_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('workspace_id', workspaceId)
            .eq('status', 'new'),
          supabase
            .from('user_lead_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('workspace_id', workspaceId)
            .eq('status', 'contacted'),
          supabase
            .from('user_lead_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('workspace_id', workspaceId)
            .eq('status', 'converted'),
        ])

        if (cancelled) return

        // A rejected fetch throws; a query-level error surfaces on `.error`.
        if (totalResult.error || newResult.error || contactedResult.error || convertedResult.error) {
          throw totalResult.error || newResult.error || contactedResult.error || convertedResult.error
        }

        setStats({
          totalLeads: totalResult.count ?? 0,
          newLeads: newResult.count ?? 0,
          contactedLeads: contactedResult.count ?? 0,
          convertedLeads: convertedResult.count ?? 0,
        })
      } catch (err) {
        if (cancelled) return
        safeError('[MyLeadsStats]', 'Failed to fetch stats:', err)
        setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchStats()

    return () => {
      cancelled = true
    }
  }, [userId, workspaceId, refreshKey, retryKey])

  const statCards = [
    {
      label: 'Total Leads',
      value: stats.totalLeads,
      icon: (
        <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'New',
      value: stats.newLeads,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: (
        <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
    },
    {
      label: 'Contacted',
      value: stats.contactedLeads,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      icon: (
        <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: 'Converted',
      value: stats.convertedLeads,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: (
        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border border-zinc-200 bg-white p-6">
            <div className="h-4 w-20 bg-zinc-200 rounded"></div>
            <div className="mt-2 h-8 w-16 bg-zinc-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-800">Couldn&apos;t load your lead stats.</p>
        </div>
        <button
          onClick={() => setRetryKey((k) => k + 1)}
          className="inline-flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <div key={stat.label} className="rounded-lg border border-zinc-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${stat.bgColor || 'bg-zinc-50'}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
              <p className={`text-2xl font-semibold ${stat.color || 'text-zinc-900'}`}>
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
