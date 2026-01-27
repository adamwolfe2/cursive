'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface ProductTier {
  id: string
  name: string
  slug: string
  daily_lead_limit: number
  monthly_lead_limit: number | null
  price_monthly: number
  features: Record<string, unknown>
}

interface WorkspaceTier {
  id: string
  product_tier_id: string
  billing_cycle: string
  subscription_status: string
  daily_lead_limit_override: number | null
  monthly_lead_limit_override: number | null
  feature_overrides: Record<string, unknown> | null
  internal_notes: string | null
  product_tiers: ProductTier
}

interface Workspace {
  id: string
  name: string
  slug: string
  industry_vertical: string
  website_url: string | null
  logo_url: string | null
  onboarding_status: string
  is_suspended: boolean
  suspended_reason: string | null
  last_activity_at: string | null
  created_at: string
  company_size: string | null
  annual_revenue: string | null
  users: { id: string; email: string; full_name: string | null; role: string; plan: string; created_at: string }[]
  workspace_tiers: WorkspaceTier | null
}

interface AuditLog {
  id: string
  action: string
  resource_type: string
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  created_at: string
  platform_admins: { email: string; full_name: string | null }
}

export default function AdminWorkspaceDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<'overview' | 'tier' | 'users' | 'usage' | 'logs'>('overview')
  const [tierModalOpen, setTierModalOpen] = useState(false)
  const [overrideModalOpen, setOverrideModalOpen] = useState(false)
  const [selectedTier, setSelectedTier] = useState('')
  const [dailyOverride, setDailyOverride] = useState<string>('')
  const [monthlyOverride, setMonthlyOverride] = useState<string>('')
  const [tierNotes, setTierNotes] = useState('')

  // Fetch workspace details
  const { data: workspace, isLoading } = useQuery({
    queryKey: ['admin', 'workspace', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          users (id, email, full_name, role, plan, created_at),
          workspace_tiers (
            *,
            product_tiers (*)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Workspace
    },
  })

  // Fetch available tiers
  const { data: tiers } = useQuery({
    queryKey: ['admin', 'tiers'],
    queryFn: async () => {
      const response = await fetch('/api/admin/tiers')
      if (!response.ok) throw new Error('Failed to fetch tiers')
      const data = await response.json()
      return data.tiers as ProductTier[]
    },
  })

  // Fetch audit logs for this workspace
  const { data: auditLogs } = useQuery({
    queryKey: ['admin', 'audit-logs', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*, platform_admins(email, full_name)')
        .eq('workspace_id', id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as AuditLog[]
    },
    enabled: activeTab === 'logs',
  })

  // Fetch usage stats
  const { data: usageStats } = useQuery({
    queryKey: ['admin', 'usage', id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const [dailyLeads, monthlyLeads, totalLeads, campaigns, templates] = await Promise.all([
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', id)
          .gte('created_at', `${today}T00:00:00Z`),
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', id)
          .gte('created_at', startOfMonth.toISOString()),
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', id),
        supabase
          .from('email_campaigns')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', id),
        supabase
          .from('email_templates')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', id),
      ])

      return {
        dailyLeads: dailyLeads.count || 0,
        monthlyLeads: monthlyLeads.count || 0,
        totalLeads: totalLeads.count || 0,
        campaigns: campaigns.count || 0,
        templates: templates.count || 0,
      }
    },
    enabled: activeTab === 'usage' || activeTab === 'overview',
  })

  // Assign tier mutation
  const assignTierMutation = useMutation({
    mutationFn: async (tierSlug: string) => {
      const response = await fetch('/api/admin/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: id,
          tierSlug,
          notes: tierNotes,
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to assign tier')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'workspace', id] })
      setTierModalOpen(false)
      setSelectedTier('')
      setTierNotes('')
    },
  })

  // Override mutation
  const overrideMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/tiers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: id,
          dailyLeadLimitOverride: dailyOverride ? parseInt(dailyOverride) : null,
          monthlyLeadLimitOverride: monthlyOverride ? parseInt(monthlyOverride) : null,
          notes: tierNotes,
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update overrides')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'workspace', id] })
      setOverrideModalOpen(false)
      setDailyOverride('')
      setMonthlyOverride('')
      setTierNotes('')
    },
  })

  // Impersonation mutation
  const impersonateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: id }),
      })
      if (!response.ok) throw new Error('Failed to start impersonation')
      return response.json()
    },
    onSuccess: () => {
      router.push('/dashboard')
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-zinc-200 rounded mb-4" />
          <div className="h-4 w-96 bg-zinc-200 rounded" />
        </div>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-zinc-500">Workspace not found</p>
      </div>
    )
  }

  const currentTier = workspace.workspace_tiers?.product_tiers
  const effectiveDailyLimit = workspace.workspace_tiers?.daily_lead_limit_override ?? currentTier?.daily_lead_limit ?? 3
  const effectiveMonthlyLimit = workspace.workspace_tiers?.monthly_lead_limit_override ?? currentTier?.monthly_lead_limit ?? null

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/accounts"
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-3">
            {workspace.logo_url ? (
              <img
                src={workspace.logo_url}
                alt={workspace.name}
                className="h-12 w-12 rounded-lg object-contain border border-zinc-200"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                <span className="text-lg font-bold text-violet-600">
                  {workspace.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-xl font-semibold text-zinc-900">{workspace.name}</h1>
              <p className="text-sm text-zinc-500">{workspace.industry_vertical || 'No industry'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => impersonateMutation.mutate()}
            disabled={impersonateMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
          >
            Switch Into
          </button>
          {workspace.is_suspended ? (
            <span className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded-lg">
              Suspended
            </span>
          ) : (
            <span className="px-3 py-1 text-sm font-medium text-green-600 bg-green-50 rounded-lg">
              Active
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 mb-6">
        <nav className="flex gap-6">
          {(['overview', 'tier', 'users', 'usage', 'logs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'text-violet-600 border-violet-600'
                  : 'text-zinc-500 border-transparent hover:text-zinc-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info Card */}
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-lg p-6">
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Workspace Information</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-zinc-500">Slug</dt>
                <dd className="text-sm text-zinc-900">{workspace.slug}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Website</dt>
                <dd className="text-sm text-zinc-900">{workspace.website_url || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Company Size</dt>
                <dd className="text-sm text-zinc-900">{workspace.company_size || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Annual Revenue</dt>
                <dd className="text-sm text-zinc-900">{workspace.annual_revenue || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Onboarding Status</dt>
                <dd className="text-sm text-zinc-900 capitalize">{workspace.onboarding_status}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Created</dt>
                <dd className="text-sm text-zinc-900">
                  {new Date(workspace.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="bg-white border border-zinc-200 rounded-lg p-4">
              <div className="text-xs text-zinc-500">Current Tier</div>
              <div className="text-lg font-semibold text-zinc-900 mt-1">
                {currentTier?.name || 'Free'}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {effectiveDailyLimit} leads/day
                {effectiveMonthlyLimit && `, ${effectiveMonthlyLimit}/month`}
              </div>
            </div>
            <div className="bg-white border border-zinc-200 rounded-lg p-4">
              <div className="text-xs text-zinc-500">Today's Leads</div>
              <div className="text-lg font-semibold text-zinc-900 mt-1">
                {usageStats?.dailyLeads || 0} / {effectiveDailyLimit}
              </div>
            </div>
            <div className="bg-white border border-zinc-200 rounded-lg p-4">
              <div className="text-xs text-zinc-500">Total Leads</div>
              <div className="text-lg font-semibold text-zinc-900 mt-1">
                {usageStats?.totalLeads || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tier Tab */}
      {activeTab === 'tier' && (
        <div className="space-y-6">
          {/* Current Tier */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-900">Current Tier</h2>
              <button
                onClick={() => setTierModalOpen(true)}
                className="text-sm text-violet-600 hover:text-violet-700 font-medium"
              >
                Change Tier
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                <span className="text-xl font-bold text-white">
                  {(currentTier?.name || 'F').charAt(0)}
                </span>
              </div>
              <div>
                <div className="text-lg font-semibold text-zinc-900">{currentTier?.name || 'Free'}</div>
                <div className="text-sm text-zinc-500">
                  ${((currentTier?.price_monthly || 0) / 100).toFixed(0)}/month
                </div>
              </div>
            </div>
          </div>

          {/* Limits & Overrides */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-900">Limits & Overrides</h2>
              <button
                onClick={() => {
                  setDailyOverride(workspace.workspace_tiers?.daily_lead_limit_override?.toString() || '')
                  setMonthlyOverride(workspace.workspace_tiers?.monthly_lead_limit_override?.toString() || '')
                  setOverrideModalOpen(true)
                }}
                className="text-sm text-violet-600 hover:text-violet-700 font-medium"
              >
                Edit Overrides
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-zinc-500">Daily Lead Limit</dt>
                <dd className="text-sm text-zinc-900">
                  {effectiveDailyLimit}
                  {workspace.workspace_tiers?.daily_lead_limit_override && (
                    <span className="ml-2 text-xs text-amber-600">(override)</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Monthly Lead Limit</dt>
                <dd className="text-sm text-zinc-900">
                  {effectiveMonthlyLimit || 'Unlimited'}
                  {workspace.workspace_tiers?.monthly_lead_limit_override && (
                    <span className="ml-2 text-xs text-amber-600">(override)</span>
                  )}
                </dd>
              </div>
            </div>
            {workspace.workspace_tiers?.internal_notes && (
              <div className="mt-4 p-3 bg-zinc-50 rounded-lg">
                <div className="text-xs text-zinc-500 mb-1">Internal Notes</div>
                <div className="text-sm text-zinc-700">{workspace.workspace_tiers.internal_notes}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white border border-zinc-200 rounded-lg">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Team Members ({workspace.users?.length || 0})</h2>
          </div>
          <table className="w-full">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500">Joined</th>
              </tr>
            </thead>
            <tbody>
              {workspace.users?.map((user) => (
                <tr key={user.id} className="border-b border-zinc-100">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-zinc-900">{user.full_name || 'Unnamed'}</div>
                    <div className="text-xs text-zinc-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600 capitalize">{user.role}</td>
                  <td className="px-6 py-4 text-sm text-zinc-600 capitalize">{user.plan}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Usage Tab */}
      {activeTab === 'usage' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-zinc-200 rounded-lg p-6">
            <div className="text-xs text-zinc-500">Daily Leads</div>
            <div className="text-2xl font-semibold text-zinc-900 mt-1">{usageStats?.dailyLeads || 0}</div>
            <div className="text-xs text-zinc-500 mt-1">of {effectiveDailyLimit} limit</div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-lg p-6">
            <div className="text-xs text-zinc-500">Monthly Leads</div>
            <div className="text-2xl font-semibold text-zinc-900 mt-1">{usageStats?.monthlyLeads || 0}</div>
            <div className="text-xs text-zinc-500 mt-1">of {effectiveMonthlyLimit || 'unlimited'}</div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-lg p-6">
            <div className="text-xs text-zinc-500">Total Leads (All Time)</div>
            <div className="text-2xl font-semibold text-zinc-900 mt-1">{usageStats?.totalLeads || 0}</div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-lg p-6">
            <div className="text-xs text-zinc-500">Campaigns</div>
            <div className="text-2xl font-semibold text-zinc-900 mt-1">{usageStats?.campaigns || 0}</div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-lg p-6">
            <div className="text-xs text-zinc-500">Templates</div>
            <div className="text-2xl font-semibold text-zinc-900 mt-1">{usageStats?.templates || 0}</div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-lg p-6">
            <div className="text-xs text-zinc-500">Team Members</div>
            <div className="text-2xl font-semibold text-zinc-900 mt-1">{workspace.users?.length || 0}</div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-zinc-200 rounded-lg">
          <div className="px-6 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-900">Admin Activity Log</h2>
          </div>
          {auditLogs?.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">No activity logs yet</div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {auditLogs?.map((log) => (
                <div key={log.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-zinc-900">{log.action.replace(/_/g, ' ')}</span>
                      <span className="text-sm text-zinc-500"> on {log.resource_type}</span>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    by {log.platform_admins?.full_name || log.platform_admins?.email}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Change Tier Modal */}
      {tierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setTierModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Change Tier</h3>
            <div className="space-y-3 mb-4">
              {tiers?.map((tier) => (
                <label
                  key={tier.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTier === tier.slug
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="tier"
                    value={tier.slug}
                    checked={selectedTier === tier.slug}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="text-violet-600"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-zinc-900">{tier.name}</div>
                    <div className="text-xs text-zinc-500">
                      ${(tier.price_monthly / 100).toFixed(0)}/mo - {tier.daily_lead_limit} leads/day
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={tierNotes}
                onChange={(e) => setTierNotes(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-lg"
                placeholder="e.g., Upgraded per sales call"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setTierModalOpen(false)}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => assignTierMutation.mutate(selectedTier)}
                disabled={!selectedTier || assignTierMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg disabled:opacity-50"
              >
                {assignTierMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOverrideModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Edit Limit Overrides</h3>
            <p className="text-sm text-zinc-500 mb-4">
              Leave blank to use the tier's default limits.
            </p>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Daily Lead Limit</label>
                <input
                  type="number"
                  value={dailyOverride}
                  onChange={(e) => setDailyOverride(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-lg"
                  placeholder={`Default: ${currentTier?.daily_lead_limit || 3}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Monthly Lead Limit</label>
                <input
                  type="number"
                  value={monthlyOverride}
                  onChange={(e) => setMonthlyOverride(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-lg"
                  placeholder={`Default: ${currentTier?.monthly_lead_limit || 'Unlimited'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={tierNotes}
                  onChange={(e) => setTierNotes(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-lg"
                  placeholder="Reason for override"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => overrideMutation.mutate()}
                disabled={overrideMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg disabled:opacity-50"
              >
                {overrideMutation.isPending ? 'Saving...' : 'Save Overrides'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
