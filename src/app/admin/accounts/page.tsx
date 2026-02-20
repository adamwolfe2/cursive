'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { sanitizeSearchTerm } from '@/lib/utils/sanitize-search'
import { safeError } from '@/lib/utils/log-sanitizer'

interface Workspace {
  id: string
  name: string
  slug: string
  industry_vertical: string
  allowed_regions: string[]
  website_url: string | null
  logo_url: string | null
  onboarding_status: string
  is_suspended: boolean
  suspended_reason: string | null
  last_activity_at: string | null
  created_at: string
  users: { id: string; email: string; full_name: string | null; plan: string; role: string }[]
  workspace_tiers?: {
    product_tiers?: {
      name: string
      slug: string
    }
  }
}

export default function AdminAccountsPage() {
  const [search, setSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [impersonateModalOpen, setImpersonateModalOpen] = useState(false)
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  const [impersonateReason, setImpersonateReason] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()

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

  const { data: workspaces, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'workspaces', search, industryFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('workspaces')
        .select(`
          *,
          users (id, email, full_name, plan, role),
          workspace_tiers (
            product_tiers (name, slug)
          )
        `)
        .order('created_at', { ascending: false })

      if (search) {
        const term = sanitizeSearchTerm(search)
        query = query.or(`name.ilike.%${term}%,slug.ilike.%${term}%`)
      }

      if (industryFilter) {
        query = query.eq('industry_vertical', industryFilter)
      }

      if (statusFilter === 'active') {
        query = query.eq('is_suspended', false)
      } else if (statusFilter === 'suspended') {
        query = query.eq('is_suspended', true)
      }

      const { data, error } = await query.limit(100)

      if (error) throw error
      return data as Workspace[]
    },
    enabled: authChecked && isAdmin,
  })

  // Impersonation mutation
  const impersonateMutation = useMutation({
    mutationFn: async ({ workspaceId, reason }: { workspaceId: string; reason?: string }) => {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, reason }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start impersonation')
      }
      return response.json()
    },
    onSuccess: () => {
      // Redirect to the impersonated workspace's dashboard
      router.push('/dashboard')
    },
  })

  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen"><p>Checking access...</p></div>
  }
  if (!isAdmin) {
    return null
  }

  const handleImpersonate = (workspace: Workspace) => {
    setSelectedWorkspace(workspace)
    setImpersonateReason('')
    setImpersonateModalOpen(true)
  }

  const confirmImpersonate = () => {
    if (!selectedWorkspace) return
    impersonateMutation.mutate({
      workspaceId: selectedWorkspace.id,
      reason: impersonateReason || undefined,
    })
  }

  const toggleSuspend = async (workspace: Workspace) => {
    const action = workspace.is_suspended ? 'unsuspend' : 'suspend'
    const reason = workspace.is_suspended
      ? undefined
      : prompt('Reason for suspension (optional):') || undefined

    // User cancelled suspension
    if (!workspace.is_suspended && reason === null) return

    try {
      const response = await fetch(`/api/admin/workspaces/${workspace.id}/suspend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update workspace')
      }

      refetch()
    } catch (error) {
      safeError('[AdminAccounts]', 'Failed to toggle suspension:', error)
      alert(error instanceof Error ? error.message : 'Failed to update workspace')
    }
  }

  const industries = [
    'HVAC', 'Roofing', 'Plumbing', 'Electrical', 'Solar',
    'Real Estate', 'Insurance', 'Home Services', 'Landscaping',
    'Pest Control', 'Cleaning Services', 'Auto Services',
    'Legal Services', 'Financial Services', 'Healthcare', 'Other',
  ]

  const getTierBadge = (workspace: Workspace) => {
    const tierName = workspace.workspace_tiers?.product_tiers?.name
    const tierSlug = workspace.workspace_tiers?.product_tiers?.slug

    // Fallback to user plan if no tier
    const plan = workspace.users?.[0]?.plan

    if (tierSlug === 'enterprise' || tierName === 'Enterprise') {
      return <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-amber-100 text-amber-700">Enterprise</span>
    }
    if (tierSlug === 'growth' || tierName === 'Growth') {
      return <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-blue-100 text-blue-700">Growth</span>
    }
    if (tierSlug === 'starter' || tierName === 'Starter') {
      return <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-blue-100 text-blue-700">Starter</span>
    }
    if (plan === 'pro') {
      return <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-blue-100 text-blue-700">Pro</span>
    }
    return <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-zinc-100 text-zinc-600">Free</span>
  }

  const getOnboardingBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-green-100 text-green-700">Complete</span>
      case 'in_progress':
        return <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-blue-100 text-blue-700">In Progress</span>
      case 'skipped':
        return <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-yellow-100 text-yellow-700">Skipped</span>
      default:
        return <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-zinc-100 text-zinc-600">Pending</span>
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-medium text-zinc-900">Business Accounts</h1>
        <p className="text-[13px] text-zinc-500 mt-1">
          Manage all registered businesses. Use &quot;Switch Into&quot; to view any account as if you were the owner.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by business name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          <div className="w-48">
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="w-full h-10 px-3 text-[13px] text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-primary"
            >
              <option value="">All Industries</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="w-full h-10 px-3 text-[13px] text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[13px] text-zinc-600">Total Accounts</div>
          <div className="text-2xl font-medium text-zinc-900 mt-1">
            {workspaces?.length || 0}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[13px] text-zinc-600">Active Today</div>
          <div className="text-2xl font-medium text-green-600 mt-1">
            {workspaces?.filter(w => {
              if (!w.last_activity_at) return false
              const today = new Date().toDateString()
              return new Date(w.last_activity_at).toDateString() === today
            }).length || 0}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[13px] text-zinc-600">Paid Plans</div>
          <div className="text-2xl font-medium text-primary mt-1">
            {workspaces?.filter(w =>
              w.users?.some(u => u.plan === 'pro') ||
              w.workspace_tiers?.product_tiers?.slug !== 'free'
            ).length || 0}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[13px] text-zinc-600">Onboarded</div>
          <div className="text-2xl font-medium text-blue-600 mt-1">
            {workspaces?.filter(w => w.onboarding_status === 'completed').length || 0}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[13px] text-zinc-600">Suspended</div>
          <div className="text-2xl font-medium text-red-600 mt-1">
            {workspaces?.filter(w => w.is_suspended).length || 0}
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-[15px] font-medium text-zinc-900">All Accounts</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-zinc-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr>
                  <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Business</th>
                  <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Industry</th>
                  <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Plan</th>
                  <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Onboarding</th>
                  <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Status</th>
                  <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Created</th>
                  <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workspaces?.map((workspace) => (
                  <tr
                    key={workspace.id}
                    className={`border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${
                      workspace.is_suspended ? 'bg-red-50/50' : ''
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {workspace.logo_url ? (
                          <img
                            src={workspace.logo_url}
                            alt={workspace.name}
                            className="h-8 w-8 rounded-lg object-cover border border-zinc-200"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">
                              {workspace.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="text-[13px] font-medium text-zinc-900">{workspace.name}</div>
                          <div className="text-[12px] text-zinc-500">
                            {workspace.users?.[0]?.email || 'No owner'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-zinc-600">
                      {workspace.industry_vertical || 'N/A'}
                    </td>
                    <td className="px-5 py-3">
                      {getTierBadge(workspace)}
                    </td>
                    <td className="px-5 py-3">
                      {getOnboardingBadge(workspace.onboarding_status)}
                    </td>
                    <td className="px-5 py-3">
                      {workspace.is_suspended ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-red-100 text-red-700">
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md bg-green-100 text-green-700">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[12px] text-zinc-500">
                      {new Date(workspace.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleImpersonate(workspace)}
                          className="text-[12px] text-primary hover:text-primary/80 font-medium bg-primary-muted hover:bg-primary-muted/80 px-2 py-1 rounded transition-colors"
                        >
                          Switch Into
                        </button>
                        <Link
                          href={`/admin/accounts/${workspace.id}`}
                          className="text-[12px] text-zinc-600 hover:text-zinc-700 font-medium"
                        >
                          Details
                        </Link>
                        <button
                          onClick={() => toggleSuspend(workspace)}
                          className={`text-[12px] font-medium ${
                            workspace.is_suspended
                              ? 'text-green-600 hover:text-green-700'
                              : 'text-red-600 hover:text-red-700'
                          }`}
                        >
                          {workspace.is_suspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && workspaces?.length === 0 && (
          <div className="p-8 text-center text-zinc-500">
            No accounts found matching your criteria.
          </div>
        )}
      </div>

      {/* Impersonation Modal */}
      {impersonateModalOpen && selectedWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setImpersonateModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">
              Switch Into Account
            </h3>
            <p className="text-sm text-zinc-600 mb-4">
              You&apos;re about to view <strong>{selectedWorkspace.name}</strong>&apos;s account as if you
              were the owner. All your actions will be logged for audit purposes.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Reason (optional)
              </label>
              <input
                type="text"
                value={impersonateReason}
                onChange={(e) => setImpersonateReason(e.target.value)}
                placeholder="e.g., Customer support request #1234"
                className="w-full h-10 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setImpersonateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmImpersonate}
                disabled={impersonateMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
              >
                {impersonateMutation.isPending ? 'Switching...' : 'Switch Into Account'}
              </button>
            </div>

            {impersonateMutation.isError && (
              <p className="mt-3 text-sm text-red-600">
                {impersonateMutation.error?.message || 'Failed to switch into account'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
