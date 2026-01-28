'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface MarketplaceStats {
  totalLeadsListed: number
  totalLeadsSold: number
  totalRevenue: number
  totalCommissionsPaid: number
  pendingCommissions: number
  activePartners: number
  avgLeadPrice: number
  conversionRate: number
}

interface RecentSale {
  id: string
  total_leads: number
  total_price: number
  payment_method: string
  created_at: string
  buyer_workspace_id: string
}

interface TopPartner {
  id: string
  name: string
  email: string
  total_leads_uploaded: number
  total_leads_sold: number
  total_earnings: number
  verification_pass_rate: number
  partner_score: number
}

export default function AdminMarketplacePage() {
  const [stats, setStats] = useState<MarketplaceStats | null>(null)
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [topPartners, setTopPartners] = useState<TopPartner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  const supabase = createClient()

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    try {
      // Calculate date filter
      let dateFilter = new Date()
      if (dateRange === '7d') dateFilter.setDate(dateFilter.getDate() - 7)
      else if (dateRange === '30d') dateFilter.setDate(dateFilter.getDate() - 30)
      else if (dateRange === '90d') dateFilter.setDate(dateFilter.getDate() - 90)
      else dateFilter = new Date(0) // All time

      // Fetch marketplace stats
      const { count: totalListed } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('is_marketplace_listed', true)

      const { data: soldLeads } = await supabase
        .from('leads')
        .select('sold_count, marketplace_price')
        .eq('is_marketplace_listed', true)
        .gt('sold_count', 0)

      const totalSold = soldLeads?.reduce((sum, l) => sum + (l.sold_count || 0), 0) || 0
      const totalRevenue = soldLeads?.reduce((sum, l) => sum + ((l.marketplace_price || 0) * (l.sold_count || 0)), 0) || 0

      // Fetch recent purchases
      const { data: purchases } = await supabase
        .from('marketplace_purchases')
        .select('*')
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: false })
        .limit(10)

      setRecentSales(purchases || [])

      // Fetch partners stats
      const { data: partners, count: activePartnerCount } = await supabase
        .from('partners')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('total_earnings', { ascending: false })
        .limit(10)

      setTopPartners(partners as TopPartner[] || [])

      // Calculate pending commissions
      const { data: pendingItems } = await supabase
        .from('marketplace_purchase_items')
        .select('commission_amount')
        .eq('commission_status', 'pending_holdback')

      const pendingCommissions = pendingItems?.reduce((sum, i) => sum + (i.commission_amount || 0), 0) || 0

      // Calculate paid commissions
      const { data: paidItems } = await supabase
        .from('marketplace_purchase_items')
        .select('commission_amount')
        .eq('commission_status', 'paid')

      const paidCommissions = paidItems?.reduce((sum, i) => sum + (i.commission_amount || 0), 0) || 0

      // Calculate average price
      const avgPrice = totalSold > 0 ? totalRevenue / totalSold : 0

      setStats({
        totalLeadsListed: totalListed || 0,
        totalLeadsSold: totalSold,
        totalRevenue,
        totalCommissionsPaid: paidCommissions,
        pendingCommissions,
        activePartners: activePartnerCount || 0,
        avgLeadPrice: avgPrice,
        conversionRate: totalListed ? (totalSold / (totalListed || 1)) * 100 : 0,
      })
    } catch (error) {
      console.error('Failed to fetch marketplace stats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [dateRange, supabase])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-zinc-900">Marketplace Management</h1>
          <p className="text-[13px] text-zinc-500 mt-1">
            Monitor sales, partners, and commissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
            className="h-9 px-3 text-[13px] border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <Link
            href="/admin/partners"
            className="h-9 px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg inline-flex items-center"
          >
            Manage Partners
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-[12px] text-zinc-500 mb-1">Leads Listed</p>
          {isLoading ? (
            <div className="h-7 w-16 bg-zinc-100 rounded animate-pulse" />
          ) : (
            <p className="text-xl font-semibold text-zinc-900">
              {stats?.totalLeadsListed.toLocaleString()}
            </p>
          )}
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-[12px] text-zinc-500 mb-1">Leads Sold</p>
          {isLoading ? (
            <div className="h-7 w-16 bg-zinc-100 rounded animate-pulse" />
          ) : (
            <p className="text-xl font-semibold text-emerald-600">
              {stats?.totalLeadsSold.toLocaleString()}
            </p>
          )}
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-[12px] text-zinc-500 mb-1">Total Revenue</p>
          {isLoading ? (
            <div className="h-7 w-16 bg-zinc-100 rounded animate-pulse" />
          ) : (
            <p className="text-xl font-semibold text-zinc-900">
              {formatCurrency(stats?.totalRevenue || 0)}
            </p>
          )}
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-[12px] text-zinc-500 mb-1">Avg Lead Price</p>
          {isLoading ? (
            <div className="h-7 w-16 bg-zinc-100 rounded animate-pulse" />
          ) : (
            <p className="text-xl font-semibold text-zinc-900">
              {formatCurrency(stats?.avgLeadPrice || 0)}
            </p>
          )}
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-[12px] text-zinc-500 mb-1">Active Partners</p>
          {isLoading ? (
            <div className="h-7 w-16 bg-zinc-100 rounded animate-pulse" />
          ) : (
            <p className="text-xl font-semibold text-violet-600">
              {stats?.activePartners}
            </p>
          )}
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-[12px] text-zinc-500 mb-1">Conversion Rate</p>
          {isLoading ? (
            <div className="h-7 w-16 bg-zinc-100 rounded animate-pulse" />
          ) : (
            <p className="text-xl font-semibold text-zinc-900">
              {stats?.conversionRate.toFixed(1)}%
            </p>
          )}
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-[12px] text-zinc-500 mb-1">Commissions Paid</p>
          {isLoading ? (
            <div className="h-7 w-16 bg-zinc-100 rounded animate-pulse" />
          ) : (
            <p className="text-xl font-semibold text-emerald-600">
              {formatCurrency(stats?.totalCommissionsPaid || 0)}
            </p>
          )}
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <p className="text-[12px] text-zinc-500 mb-1">Pending Commissions</p>
          {isLoading ? (
            <div className="h-7 w-16 bg-zinc-100 rounded animate-pulse" />
          ) : (
            <p className="text-xl font-semibold text-amber-600">
              {formatCurrency(stats?.pendingCommissions || 0)}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-white border border-zinc-200 rounded-lg">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-[15px] font-medium text-zinc-900">Recent Sales</h2>
          </div>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-zinc-100 rounded animate-pulse" />
              ))}
            </div>
          ) : recentSales.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-zinc-500">
              No sales in this period
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {recentSales.map((sale) => (
                <div key={sale.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-zinc-900">
                      {sale.total_leads} lead{sale.total_leads !== 1 ? 's' : ''}
                    </p>
                    <p className="text-[12px] text-zinc-500">
                      {new Date(sale.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-semibold text-zinc-900">
                      {formatCurrency(sale.total_price)}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {sale.payment_method === 'credits' ? 'Credits' : 'Card'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Partners */}
        <div className="bg-white border border-zinc-200 rounded-lg">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-zinc-900">Top Partners</h2>
            <Link
              href="/admin/partners"
              className="text-[12px] text-violet-600 hover:text-violet-700 font-medium"
            >
              View All
            </Link>
          </div>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-zinc-100 rounded animate-pulse" />
              ))}
            </div>
          ) : topPartners.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-zinc-500">
              No active partners
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {topPartners.slice(0, 5).map((partner, index) => (
                <div key={partner.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center text-[11px] font-medium text-zinc-600">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-zinc-900 truncate">
                      {partner.name}
                    </p>
                    <p className="text-[12px] text-zinc-500">
                      {partner.total_leads_uploaded.toLocaleString()} leads · {partner.verification_pass_rate?.toFixed(0) || 0}% verified
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-semibold text-emerald-600">
                      {formatCurrency(partner.total_earnings || 0)}
                    </p>
                    <div className="flex items-center gap-1 justify-end">
                      <span className="text-[11px] text-zinc-500">Score:</span>
                      <span className={`text-[11px] font-medium ${
                        (partner.partner_score || 0) >= 80 ? 'text-emerald-600' :
                        (partner.partner_score || 0) >= 50 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {partner.partner_score || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white border border-zinc-200 rounded-lg p-6">
        <h2 className="text-[15px] font-medium text-zinc-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/payouts"
            className="h-9 px-4 text-[13px] font-medium border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-lg inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Process Payouts
          </Link>
          <button
            onClick={() => fetchStats()}
            className="h-9 px-4 text-[13px] font-medium border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-lg inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Stats
          </button>
          <Link
            href="/admin/leads"
            className="h-9 px-4 text-[13px] font-medium border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-lg inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View All Leads
          </Link>
          <Link
            href="/admin/analytics"
            className="h-9 px-4 text-[13px] font-medium border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 rounded-lg inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </Link>
        </div>
      </div>
    </div>
  )
}
