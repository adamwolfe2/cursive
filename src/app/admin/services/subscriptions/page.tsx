'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react'
import { safeError } from '@/lib/utils/log-sanitizer'

interface ServiceSubscription {
  id: string
  workspace_id: string
  status: string
  monthly_price: number
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  onboarding_completed: boolean
  created_at: string
  service_tier: {
    id: string
    slug: string
    name: string
    monthly_price_min: number
    monthly_price_max: number
  }
  workspace: {
    id: string
    name: string
    billing_email: string
  }
}

interface Stats {
  total: number
  active: number
  pending: number
  mrr: number
}

export default function AdminServiceSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<ServiceSubscription[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, pending: 0, mrr: 0 })
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
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

  useEffect(() => {
    fetchSubscriptions()
  }, [filterStatus])

  async function fetchSubscriptions() {
    setLoading(true)
    try {
      let query = supabase
        .from('service_subscriptions')
        .select(`
          *,
          service_tier:service_tiers(id, slug, name, monthly_price_min, monthly_price_max),
          workspace:workspaces(id, name, billing_email)
        `)
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error } = await query

      if (error) throw error

      setSubscriptions(data || [])

      // Calculate stats
      const allSubscriptions = filterStatus !== 'all' ? await fetchAllSubscriptions() : data
      calculateStats(allSubscriptions || [])
    } catch (error) {
      safeError('[AdminSubscriptions]', 'Failed to fetch subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAllSubscriptions() {
    const { data } = await supabase
      .from('service_subscriptions')
      .select('*')
    return data
  }

  function calculateStats(allSubs: any[]) {
    const stats = {
      total: allSubs.length,
      active: allSubs.filter(s => s.status === 'active').length,
      pending: allSubs.filter(s => ['pending_payment', 'onboarding'].includes(s.status)).length,
      mrr: allSubs
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + (s.monthly_price || 0), 0)
    }
    setStats(stats)
  }

  const statusConfig = {
    active: {
      label: 'Active',
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    },
    pending_payment: {
      label: 'Pending Payment',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: Clock,
      iconColor: 'text-amber-600'
    },
    onboarding: {
      label: 'Onboarding',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: Clock,
      iconColor: 'text-blue-600'
    },
    paused: {
      label: 'Paused',
      color: 'bg-zinc-100 text-zinc-700 border-zinc-200',
      icon: AlertCircle,
      iconColor: 'text-zinc-600'
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: XCircle,
      iconColor: 'text-red-600'
    },
    expired: {
      label: 'Expired',
      color: 'bg-zinc-100 text-zinc-700 border-zinc-200',
      icon: XCircle,
      iconColor: 'text-zinc-600'
    },
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen"><p>Checking access...</p></div>
  }
  if (!isAdmin) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Service Subscriptions</h1>
            <p className="text-sm text-zinc-600 mt-1">
              Manage all service tier subscriptions and track MRR
            </p>
          </div>
          <Link
            href="/admin/services/deliveries"
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors text-sm font-medium"
          >
            <Package className="h-4 w-4" />
            View Deliveries
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-zinc-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-600">Total Subscriptions</span>
            <Users className="h-5 w-5 text-zinc-400" />
          </div>
          <div className="text-3xl font-bold text-zinc-900">{stats.total}</div>
          <p className="text-xs text-zinc-500 mt-1">All time</p>
        </div>

        <div className="bg-white border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-700">Active</span>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-900">{stats.active}</div>
          <p className="text-xs text-green-600 mt-1">Currently active</p>
        </div>

        <div className="bg-white border border-amber-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-amber-700">Pending</span>
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-3xl font-bold text-amber-900">{stats.pending}</div>
          <p className="text-xs text-amber-600 mt-1">Needs attention</p>
        </div>

        <div className="bg-white border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-700">MRR</span>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-900">{formatCurrency(stats.mrr)}</div>
          <p className="text-xs text-blue-600 mt-1">Monthly recurring</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-700">Filter by status:</span>
          <div className="flex gap-2">
            {['all', 'active', 'pending_payment', 'onboarding', 'paused', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filterStatus === status
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
                  Workspace
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
                  Service Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
                  Monthly Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
                  Period End
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="animate-spin h-8 w-8 border-3 border-zinc-200 border-t-zinc-900 rounded-full" />
                      <p className="text-sm text-zinc-500">Loading subscriptions...</p>
                    </div>
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Package className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-sm font-medium text-zinc-900 mb-1">No subscriptions found</p>
                    <p className="text-sm text-zinc-500">
                      {filterStatus !== 'all'
                        ? `No ${filterStatus} subscriptions to display`
                        : 'Service subscriptions will appear here once customers subscribe'}
                    </p>
                  </td>
                </tr>
              ) : (
                subscriptions.map((subscription) => {
                  const statusData = statusConfig[subscription.status as keyof typeof statusConfig] || statusConfig.active
                  const StatusIcon = statusData.icon

                  return (
                    <tr key={subscription.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-zinc-900">
                            {subscription.workspace?.name || 'Unknown Workspace'}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {subscription.workspace?.billing_email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-zinc-400" />
                          <div>
                            <div className="text-sm font-medium text-zinc-900">
                              {subscription.service_tier?.name || 'Unknown Tier'}
                            </div>
                            <div className="text-xs text-zinc-500 capitalize">
                              {subscription.service_tier?.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusData.color}`}>
                          <StatusIcon className={`h-3.5 w-3.5 ${statusData.iconColor}`} />
                          {statusData.label}
                        </div>
                        {subscription.cancel_at_period_end && (
                          <div className="text-xs text-red-600 mt-1">Cancels at period end</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-zinc-900">
                          {formatCurrency(subscription.monthly_price)}/mo
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-zinc-600">
                          {formatDate(subscription.current_period_end)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-zinc-600">
                          {formatDate(subscription.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/services/subscriptions/${subscription.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
