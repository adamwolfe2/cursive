'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Package,
  Calendar,
  DollarSign,
  Mail,
  User,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink
} from 'lucide-react'

interface ServiceSubscription {
  id: string
  workspace_id: string
  service_tier_id: string
  status: string
  setup_fee_paid: number
  monthly_price: number
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  contract_start_date: string | null
  contract_end_date: string | null
  equity_percentage: number | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  onboarding_completed: boolean
  assigned_success_manager_id: string | null
  created_at: string
  updated_at: string
  service_tier: {
    id: string
    slug: string
    name: string
    description: string
    setup_fee: number
    monthly_price_min: number
    monthly_price_max: number
    features: string[]
    platform_features: any
  }
  workspace: {
    id: string
    name: string
    billing_email: string
  }
}

interface Delivery {
  id: string
  delivery_type: string
  status: string
  delivery_period_start: string
  delivery_period_end: string
  delivered_at: string | null
  client_rating: number | null
  client_feedback: string | null
}

export default function AdminSubscriptionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const subscriptionId = params.id as string
  const [subscription, setSubscription] = useState<ServiceSubscription | null>(null)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
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
    fetchSubscriptionDetails()
    fetchDeliveries()
  }, [subscriptionId])

  async function fetchSubscriptionDetails() {
    try {
      const { data, error } = await supabase
        .from('service_subscriptions')
        .select(`
          *,
          service_tier:service_tiers(*),
          workspace:workspaces(id, name, billing_email)
        `)
        .eq('id', subscriptionId)
        .single()

      if (error) throw error

      setSubscription(data)
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchDeliveries() {
    try {
      const { data, error } = await supabase
        .from('service_deliveries')
        .select('*')
        .eq('service_subscription_id', subscriptionId)
        .order('delivery_period_start', { ascending: false })

      if (error) throw error

      setDeliveries(data || [])
    } catch (error) {
      console.error('Failed to fetch deliveries:', error)
    }
  }

  async function updateStatus(newStatus: string) {
    setUpdating(true)
    try {
      const { error } = await (supabase
        .from('service_subscriptions') as any)
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', subscriptionId)

      if (error) throw error

      fetchSubscriptionDetails()
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setUpdating(false)
    }
  }

  async function toggleOnboarding() {
    setUpdating(true)
    try {
      const { error } = await (supabase
        .from('service_subscriptions') as any)
        .update({
          onboarding_completed: !subscription?.onboarding_completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)

      if (error) throw error

      fetchSubscriptionDetails()
    } catch (error) {
      console.error('Failed to toggle onboarding:', error)
    } finally {
      setUpdating(false)
    }
  }

  const statusConfig = {
    active: { label: 'Active', color: 'text-green-700 bg-green-50 border-green-200', icon: CheckCircle },
    pending_payment: { label: 'Pending Payment', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: Clock },
    onboarding: { label: 'Onboarding', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: Clock },
    paused: { label: 'Paused', color: 'text-zinc-700 bg-zinc-50 border-zinc-200', icon: AlertCircle },
    cancelled: { label: 'Cancelled', color: 'text-red-700 bg-red-50 border-red-200', icon: XCircle },
    expired: { label: 'Expired', color: 'text-zinc-700 bg-zinc-50 border-zinc-200', icon: XCircle },
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-3 border-zinc-200 border-t-zinc-900 rounded-full" />
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-sm font-medium text-zinc-900 mb-1">Subscription not found</p>
          <Link
            href="/admin/services/subscriptions"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Return to subscriptions
          </Link>
        </div>
      </div>
    )
  }

  const currentStatus = statusConfig[subscription.status as keyof typeof statusConfig] || statusConfig.active
  const StatusIcon = currentStatus.icon

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/admin/services/subscriptions"
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Subscription Details</h1>
            <p className="text-sm text-zinc-600 mt-1">
              Manage subscription for {subscription.workspace.name}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-900">Subscription Status</h2>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${currentStatus.color}`}>
                <StatusIcon className="h-4 w-4" />
                {currentStatus.label}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs font-medium text-zinc-600 uppercase tracking-wider">
                  Service Tier
                </label>
                <p className="mt-1 text-sm font-medium text-zinc-900">
                  {subscription.service_tier.name}
                </p>
                <p className="text-xs text-zinc-500 capitalize">{subscription.service_tier.slug}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-600 uppercase tracking-wider">
                  Monthly Price
                </label>
                <p className="mt-1 text-lg font-bold text-zinc-900">
                  {formatCurrency(subscription.monthly_price)}/mo
                </p>
              </div>

              {subscription.setup_fee_paid > 0 && (
                <div>
                  <label className="text-xs font-medium text-zinc-600 uppercase tracking-wider">
                    Setup Fee Paid
                  </label>
                  <p className="mt-1 text-sm font-medium text-zinc-900">
                    {formatCurrency(subscription.setup_fee_paid)}
                  </p>
                </div>
              )}

              {subscription.current_period_end && (
                <div>
                  <label className="text-xs font-medium text-zinc-600 uppercase tracking-wider">
                    {subscription.cancel_at_period_end ? 'Access Until' : 'Next Billing'}
                  </label>
                  <p className="mt-1 text-sm font-medium text-zinc-900">
                    {formatDate(subscription.current_period_end)}
                  </p>
                </div>
              )}
            </div>

            {subscription.cancel_at_period_end && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  ⚠️ This subscription is set to cancel at the end of the billing period
                </p>
              </div>
            )}

            {/* Update Status Actions */}
            <div className="mt-6 pt-6 border-t border-zinc-200">
              <label className="text-sm font-medium text-zinc-900 mb-3 block">
                Update Status
              </label>
              <div className="flex flex-wrap gap-2">
                {['pending_payment', 'onboarding', 'active', 'paused', 'cancelled'].map(status => (
                  <button
                    key={status}
                    onClick={() => updateStatus(status)}
                    disabled={updating || subscription.status === status}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      subscription.status === status
                        ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Billing Details */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Billing Details</h2>

            <div className="space-y-3">
              {subscription.stripe_customer_id && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">Stripe Customer</span>
                  <a
                    href={`https://dashboard.stripe.com/customers/${subscription.stripe_customer_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {subscription.stripe_customer_id}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {subscription.stripe_subscription_id && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">Stripe Subscription</span>
                  <a
                    href={`https://dashboard.stripe.com/subscriptions/${subscription.stripe_subscription_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {subscription.stripe_subscription_id}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">Billing Period</span>
                <span className="text-sm font-medium text-zinc-900">
                  {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-600">Created</span>
                <span className="text-sm font-medium text-zinc-900">
                  {formatDate(subscription.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Deliveries */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900">Recent Deliveries</h2>
              <Link
                href={`/admin/services/deliveries?subscription=${subscriptionId}`}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All
              </Link>
            </div>

            {deliveries.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-8">
                No deliveries yet
              </p>
            ) : (
              <div className="space-y-3">
                {deliveries.slice(0, 5).map(delivery => (
                  <div key={delivery.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-zinc-900 capitalize">
                        {delivery.delivery_type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatDate(delivery.delivery_period_start)} - {formatDate(delivery.delivery_period_end)}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      delivery.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      delivery.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-zinc-200 text-zinc-700'
                    }`}>
                      {delivery.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Workspace Info */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Workspace</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-600 uppercase tracking-wider flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Name
                </label>
                <p className="mt-1 text-sm font-medium text-zinc-900">
                  {subscription.workspace.name}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-600 uppercase tracking-wider flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Billing Email
                </label>
                <p className="mt-1 text-sm font-medium text-zinc-900">
                  {subscription.workspace.billing_email}
                </p>
              </div>

              <Link
                href={`/admin/accounts/${subscription.workspace_id}`}
                className="block mt-4 text-sm text-center font-medium text-blue-600 hover:text-blue-700"
              >
                View Full Account
              </Link>
            </div>
          </div>

          {/* Onboarding Status */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Onboarding</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">Status</span>
              <button
                onClick={toggleOnboarding}
                disabled={updating}
                className={`text-sm font-medium ${
                  subscription.onboarding_completed
                    ? 'text-green-600'
                    : 'text-amber-600'
                }`}
              >
                {subscription.onboarding_completed ? 'Completed' : 'Pending'}
              </button>
            </div>
          </div>

          {/* Platform Features */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-zinc-900 mb-4">Platform Access</h3>
            <div className="space-y-2">
              {subscription.service_tier.platform_features && Object.entries(subscription.service_tier.platform_features).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 capitalize">{feature.replace('_', ' ')}</span>
                  {typeof enabled === 'boolean' ? (
                    enabled ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-zinc-300" />
                    )
                  ) : (
                    <span className="font-medium text-zinc-900">{String(enabled)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
