'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Workspace {
  id: string
  name: string
  slug: string
  industry_vertical: string
  allowed_regions: string[]
  website_url: string | null
  created_at: string
  users: { id: string; email: string; plan: string }[]
  _count?: { leads: number }
}

export default function AdminAccountsPage() {
  const [search, setSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState('')
  const supabase = createClient()

  const { data: workspaces, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'workspaces', search, industryFilter],
    queryFn: async () => {
      let query = supabase
        .from('workspaces')
        .select(`
          *,
          users (id, email, plan)
        `)
        .order('created_at', { ascending: false })

      if (search) {
        query = query.ilike('name', `%${search}%`)
      }

      if (industryFilter) {
        query = query.eq('industry_vertical', industryFilter)
      }

      const { data, error } = await query.limit(100)

      if (error) throw error
      return data as Workspace[]
    },
  })

  const toggleSuspend = async (workspaceId: string, currentStatus: boolean) => {
    await supabase
      .from('workspaces')
      .update({ is_suspended: !currentStatus })
      .eq('id', workspaceId)
    refetch()
  }

  const industries = [
    'HVAC', 'Roofing', 'Plumbing', 'Electrical', 'Solar',
    'Real Estate', 'Insurance', 'Home Services', 'Landscaping',
    'Pest Control', 'Cleaning Services', 'Auto Services',
    'Legal Services', 'Financial Services', 'Healthcare', 'Other',
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-medium text-zinc-900">Business Accounts</h1>
        <p className="text-[13px] text-zinc-500 mt-1">
          Manage all registered businesses and their lead delivery
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by business name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 px-3 text-[13px] text-zinc-900 placeholder:text-zinc-400 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-violet-500"
            />
          </div>
          <div className="w-48">
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="w-full h-10 px-3 text-[13px] text-zinc-900 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:border-violet-500"
            >
              <option value="">All Industries</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[13px] text-zinc-600">Total Accounts</div>
          <div className="text-2xl font-medium text-zinc-900 mt-1">
            {workspaces?.length || 0}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[13px] text-zinc-600">Active Today</div>
          <div className="text-2xl font-medium text-emerald-600 mt-1">
            {workspaces?.filter(w => {
              const today = new Date().toDateString()
              return new Date(w.created_at).toDateString() === today
            }).length || 0}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[13px] text-zinc-600">Pro Plans</div>
          <div className="text-2xl font-medium text-violet-600 mt-1">
            {workspaces?.filter(w => w.users?.some(u => u.plan === 'pro')).length || 0}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-[13px] text-zinc-600">Free Plans</div>
          <div className="text-2xl font-medium text-zinc-600 mt-1">
            {workspaces?.filter(w => w.users?.every(u => u.plan === 'free')).length || 0}
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
                  <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Service Areas</th>
                  <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Plan</th>
                  <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Created</th>
                  <th className="px-5 py-3 text-left text-[13px] font-medium text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workspaces?.map((workspace) => (
                  <tr key={workspace.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <div className="text-[13px] font-medium text-zinc-900">{workspace.name}</div>
                        <div className="text-[12px] text-zinc-500">{workspace.users?.[0]?.email}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-zinc-600">
                      {workspace.industry_vertical || 'N/A'}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-zinc-600">
                      {workspace.allowed_regions?.length === 50
                        ? 'All States'
                        : `${workspace.allowed_regions?.length || 0} states`}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md ${
                        workspace.users?.[0]?.plan === 'pro'
                          ? 'bg-violet-100 text-violet-700'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        {workspace.users?.[0]?.plan === 'pro' ? 'Pro' : 'Free'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[12px] text-zinc-500">
                      {new Date(workspace.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/accounts/${workspace.id}`}
                          className="text-[12px] text-violet-600 hover:text-violet-700 font-medium"
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/leads?workspace=${workspace.id}`}
                          className="text-[12px] text-zinc-600 hover:text-zinc-700 font-medium"
                        >
                          Leads
                        </Link>
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
    </div>
  )
}
