'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Package,
  CheckCircle,
  Clock,
  PlayCircle,
  ArrowLeft,
  Calendar,
  FileText,
  Plus
} from 'lucide-react'

interface ServiceDelivery {
  id: string
  service_subscription_id: string
  delivery_period_start: string
  delivery_period_end: string
  delivery_type: string
  status: string
  deliverable_data: any
  delivered_at: string | null
  client_rating: number | null
  client_feedback: string | null
  created_at: string
  service_subscription: {
    id: string
    workspace_id: string
    workspace: {
      name: string
    }
    service_tier: {
      name: string
      slug: string
    }
  }
}

export default function AdminServiceDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<ServiceDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
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
        .single() as { data: { role: string } | null }
      if (!userData || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
        window.location.href = '/dashboard'
        return
      }
      setIsAdmin(true)
      setAuthChecked(true)
    }
    checkAdmin()
  }, [])

  useEffect(() => {
    fetchDeliveries()
  }, [filterStatus, filterType])

  async function fetchDeliveries() {
    setLoading(true)
    try {
      let query = supabase
        .from('service_deliveries')
        .select(`
          *,
          service_subscription:service_subscriptions(
            id,
            workspace_id,
            workspace:workspaces(name),
            service_tier:service_tiers(name, slug)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      if (filterType !== 'all') {
        query = query.eq('delivery_type', filterType)
      }

      const { data, error } = await query

      if (error) throw error

      setDeliveries(data || [])
    } catch (error) {
      console.error('Failed to fetch deliveries:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateDeliveryStatus(deliveryId: string, newStatus: string) {
    try {
      const updates: any = { status: newStatus }

      if (newStatus === 'delivered') {
        updates.delivered_at = new Date().toISOString()
      }

      const { error } = await (supabase
        .from('service_deliveries') as any)
        .update(updates)
        .eq('id', deliveryId)

      if (error) throw error

      fetchDeliveries()
    } catch (error) {
      console.error('Failed to update delivery status:', error)
    }
  }

  const statusConfig = {
    scheduled: {
      label: 'Scheduled',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: Calendar,
      iconColor: 'text-blue-600'
    },
    in_progress: {
      label: 'In Progress',
      color: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: PlayCircle,
      iconColor: 'text-amber-600'
    },
    delivered: {
      label: 'Delivered',
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    },
    failed: {
      label: 'Failed',
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: Clock,
      iconColor: 'text-red-600'
    },
  }

  const deliveryTypes = {
    lead_list: { label: 'Lead List', icon: FileText },
    campaign_setup: { label: 'Campaign Setup', icon: Package },
    monthly_report: { label: 'Monthly Report', icon: FileText },
    optimization_session: { label: 'Optimization Session', icon: PlayCircle },
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateRange = (start: string, end: string) => {
    return `${formatDate(start)} - ${formatDate(end)}`
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
          <div className="flex items-center gap-3">
            <Link
              href="/admin/services/subscriptions"
              className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-zinc-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Service Deliveries</h1>
              <p className="text-sm text-zinc-600 mt-1">
                Track and manage all service deliverables
              </p>
            </div>
          </div>
          <Link
            href="/admin/services/deliveries/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Delivery
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-700">Status:</span>
            <div className="flex gap-2 flex-wrap">
              {['all', 'scheduled', 'in_progress', 'delivered', 'failed'].map(status => (
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

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-700">Type:</span>
            <div className="flex gap-2 flex-wrap">
              {['all', 'lead_list', 'campaign_setup', 'monthly_report', 'optimization_session'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    filterType === type
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  {type === 'all' ? 'All' : type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deliveries Table */}
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
                  Delivery Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-600 uppercase tracking-wider">
                  Delivered
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
                      <p className="text-sm text-zinc-500">Loading deliveries...</p>
                    </div>
                  </td>
                </tr>
              ) : deliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Package className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-sm font-medium text-zinc-900 mb-1">No deliveries found</p>
                    <p className="text-sm text-zinc-500">
                      Service deliveries will appear here as they are scheduled
                    </p>
                  </td>
                </tr>
              ) : (
                deliveries.map((delivery) => {
                  const statusData = statusConfig[delivery.status as keyof typeof statusConfig] || statusConfig.scheduled
                  const StatusIcon = statusData.icon
                  const deliveryTypeData = deliveryTypes[delivery.delivery_type as keyof typeof deliveryTypes]
                  const TypeIcon = deliveryTypeData?.icon || FileText

                  return (
                    <tr key={delivery.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-zinc-900">
                          {delivery.service_subscription?.workspace?.name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-zinc-900">
                          {delivery.service_subscription?.service_tier?.name || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-zinc-400" />
                          <span className="text-sm text-zinc-900">
                            {deliveryTypeData?.label || delivery.delivery_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-zinc-600">
                          {formatDateRange(delivery.delivery_period_start, delivery.delivery_period_end)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusData.color}`}>
                          <StatusIcon className={`h-3.5 w-3.5 ${statusData.iconColor}`} />
                          {statusData.label}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-zinc-600">
                          {delivery.delivered_at ? formatDate(delivery.delivered_at) : '-'}
                        </div>
                        {delivery.client_rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-amber-600">{'★'.repeat(delivery.client_rating)}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {delivery.status === 'scheduled' && (
                            <button
                              onClick={() => updateDeliveryStatus(delivery.id, 'in_progress')}
                              className="text-xs font-medium text-blue-600 hover:text-blue-700"
                            >
                              Start
                            </button>
                          )}
                          {delivery.status === 'in_progress' && (
                            <button
                              onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                              className="text-xs font-medium text-green-600 hover:text-green-700"
                            >
                              Mark Delivered
                            </button>
                          )}
                          <Link
                            href={`/admin/services/deliveries/${delivery.id}`}
                            className="text-xs font-medium text-zinc-600 hover:text-zinc-700"
                          >
                            Details
                          </Link>
                        </div>
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
