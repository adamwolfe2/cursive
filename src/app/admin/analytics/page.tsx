'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { safeError } from '@/lib/utils/log-sanitizer'

interface AnalyticsData {
  overview: {
    total_leads: number
    total_leads_change: number
    total_workspaces: number
    active_workspaces: number
    total_partners: number
    total_revenue: number
    revenue_change: number
  }
  leadsByDay: Array<{ date: string; count: number }>
  leadsByIndustry: Array<{ industry: string; count: number }>
  leadsByRegion: Array<{ region: string; count: number }>
  topPartners: Array<{ name: string; leads: number; earnings: number }>
  conversionFunnel: {
    delivered: number
    opened: number
    clicked: number
    replied: number
    converted: number
  }
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  const supabase = createClient()

  // Admin role check - prevent non-admins from accessing
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        window.location.href = '/login'
        return
      }
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .maybeSingle() as { data: { role: string } | null }
      if (!userData || (userData.role !== 'admin' && userData.role !== 'owner')) {
        window.location.href = '/dashboard'
        return
      }
      setIsAdmin(true)
      setAuthChecked(true)
    }
    checkAdmin()
  }, [])

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/analytics?range=${dateRange}`)
      const data = await response.json()
      if (data.success) {
        setAnalytics(data.data)
      }
    } catch (error) {
      safeError('[AdminAnalytics]', 'Failed to fetch analytics:', error)
    }
    setLoading(false)
  }, [dateRange])

  useEffect(() => {
    if (authChecked && isAdmin) fetchAnalytics()
  }, [authChecked, isAdmin, fetchAnalytics])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const formatChange = (change: number) => {
    const isPositive = change >= 0
    return (
      <span className={isPositive ? 'text-blue-600' : 'text-red-600'}>
        {isPositive ? '+' : ''}{change.toFixed(1)}%
      </span>
    )
  }

  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen"><p>Checking access...</p></div>
  }
  if (!isAdmin) {
    return null
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 bg-zinc-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-zinc-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-zinc-200 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Analytics Dashboard</h1>
          <p className="text-[13px] text-zinc-600 mt-1">Platform performance and insights</p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="h-9 px-3 text-[13px] border border-zinc-300 rounded-lg focus:outline-none focus:border-primary"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="365d">Last 12 months</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[12px] text-zinc-600">Total Leads</div>
          <div className="text-2xl font-semibold text-zinc-900 mt-1">
            {formatNumber(analytics?.overview.total_leads || 0)}
          </div>
          <div className="text-[12px] mt-1">
            {formatChange(analytics?.overview.total_leads_change || 0)} from last period
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[12px] text-zinc-600">Active Businesses</div>
          <div className="text-2xl font-semibold text-zinc-900 mt-1">
            {formatNumber(analytics?.overview.active_workspaces || 0)}
          </div>
          <div className="text-[12px] text-zinc-500 mt-1">
            of {formatNumber(analytics?.overview.total_workspaces || 0)} total
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[12px] text-zinc-600">Total Partners</div>
          <div className="text-2xl font-semibold text-zinc-900 mt-1">
            {formatNumber(analytics?.overview.total_partners || 0)}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[12px] text-zinc-600">Total Revenue</div>
          <div className="text-2xl font-semibold text-blue-600 mt-1">
            {formatCurrency(analytics?.overview.total_revenue || 0)}
          </div>
          <div className="text-[12px] mt-1">
            {formatChange(analytics?.overview.revenue_change || 0)} from last period
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Leads Over Time */}
        <div className="bg-white border border-zinc-200 rounded-lg p-6">
          <h2 className="text-[15px] font-medium text-zinc-900 mb-4">Leads Over Time</h2>
          <div className="h-64">
            {analytics?.leadsByDay && analytics.leadsByDay.length > 0 ? (
              <div className="flex items-end h-full gap-1">
                {analytics.leadsByDay.map((day, i) => {
                  const maxCount = Math.max(...analytics.leadsByDay.map(d => d.count))
                  const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-blue-500 rounded-t"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${day.date}: ${day.count} leads`}
                      />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500 text-[13px]">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Leads by Industry */}
        <div className="bg-white border border-zinc-200 rounded-lg p-6">
          <h2 className="text-[15px] font-medium text-zinc-900 mb-4">Leads by Industry</h2>
          <div className="space-y-3">
            {analytics?.leadsByIndustry && analytics.leadsByIndustry.length > 0 ? (
              analytics.leadsByIndustry.slice(0, 6).map((item, i) => {
                const maxCount = Math.max(...analytics.leadsByIndustry.map(d => d.count))
                const width = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                return (
                  <div key={i}>
                    <div className="flex justify-between text-[13px] mb-1">
                      <span className="text-zinc-700">{item.industry}</span>
                      <span className="text-zinc-900 font-medium">{formatNumber(item.count)}</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="flex items-center justify-center h-40 text-zinc-500 text-[13px]">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6 mb-8">
        <h2 className="text-[15px] font-medium text-zinc-900 mb-4">Conversion Funnel</h2>
        <div className="flex items-center justify-between">
          {[
            { label: 'Delivered', value: analytics?.conversionFunnel.delivered || 0, color: 'bg-blue-500' },
            { label: 'Opened', value: analytics?.conversionFunnel.opened || 0, color: 'bg-indigo-500' },
            { label: 'Clicked', value: analytics?.conversionFunnel.clicked || 0, color: 'bg-blue-500' },
            { label: 'Replied', value: analytics?.conversionFunnel.replied || 0, color: 'bg-cyan-500' },
            { label: 'Converted', value: analytics?.conversionFunnel.converted || 0, color: 'bg-blue-500' },
          ].map((step, i, arr) => (
            <div key={i} className="flex-1 text-center">
              <div className={`mx-auto w-16 h-16 ${step.color} rounded-full flex items-center justify-center text-white font-semibold`}>
                {formatNumber(step.value)}
              </div>
              <div className="text-[13px] text-zinc-700 mt-2">{step.label}</div>
              {i < arr.length - 1 && step.value > 0 && arr[i + 1].value > 0 && (
                <div className="text-[11px] text-zinc-500 mt-1">
                  {((arr[i + 1].value / step.value) * 100).toFixed(1)}%
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Top Partners */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        <h2 className="text-[15px] font-medium text-zinc-900 mb-4">Top Partners</h2>
        {analytics?.topPartners && analytics.topPartners.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="text-left text-[12px] font-medium text-zinc-600 pb-2">Partner</th>
                <th className="text-right text-[12px] font-medium text-zinc-600 pb-2">Leads</th>
                <th className="text-right text-[12px] font-medium text-zinc-600 pb-2">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topPartners.map((partner, i) => (
                <tr key={i} className="border-b border-zinc-100 last:border-0">
                  <td className="py-3 text-[13px] text-zinc-900">{partner.name}</td>
                  <td className="py-3 text-[13px] text-zinc-600 text-right">{formatNumber(partner.leads)}</td>
                  <td className="py-3 text-[13px] text-blue-600 text-right font-medium">
                    {formatCurrency(partner.earnings)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-zinc-500 text-[13px]">
            No partner data available
          </div>
        )}
      </div>
    </div>
  )
}
