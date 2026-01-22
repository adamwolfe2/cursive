// Dashboard Home Page

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get user
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', session!.user.id)
    .single()

  // Get queries count
  const { count: queriesCount } = await supabase
    .from('queries')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', user!.workspace_id)

  // Get leads count
  const { count: leadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', user!.workspace_id)

  // Get recent leads
  const { data: recentLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('workspace_id', user!.workspace_id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name || 'there'}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s what&apos;s happening with your lead generation
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Queries */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Active Queries
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {queriesCount || 0}
          </dd>
        </div>

        {/* Total Leads */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Total Leads
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {leadsCount || 0}
          </dd>
        </div>

        {/* Credits Remaining */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Credits Today
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {user!.daily_credit_limit - user!.daily_credits_used}
          </dd>
        </div>

        {/* Plan */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">
            Current Plan
          </dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900 capitalize">
            {user!.plan}
          </dd>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg bg-white shadow">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Quick Actions
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/queries/new"
              className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400"
            >
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">
                  Create Query
                </p>
                <p className="truncate text-sm text-gray-500">
                  Track a new topic
                </p>
              </div>
            </Link>

            <Link
              href="/data"
              className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400"
            >
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">View Leads</p>
                <p className="truncate text-sm text-gray-500">
                  Browse your data
                </p>
              </div>
            </Link>

            <Link
              href="/people-search"
              className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400"
            >
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">
                  Search People
                </p>
                <p className="truncate text-sm text-gray-500">
                  Find contacts
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Leads */}
      {recentLeads && recentLeads.length > 0 && (
        <div className="rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                Recent Leads
              </h3>
              <Link
                href="/data"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View all
              </Link>
            </div>
            <div className="flow-root">
              <ul role="list" className="-my-5 divide-y divide-gray-200">
                {recentLeads.map((lead) => {
                  const companyData = lead.company_data as any
                  return (
                    <li key={lead.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {companyData?.name || 'Unknown Company'}
                          </p>
                          <p className="truncate text-sm text-gray-500">
                            {companyData?.industry || 'No industry'}
                          </p>
                        </div>
                        <div>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              lead.enrichment_status === 'enriched'
                                ? 'bg-green-100 text-green-800'
                                : lead.enrichment_status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {lead.enrichment_status}
                          </span>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Getting Started (if no queries) */}
      {queriesCount === 0 && (
        <div className="rounded-lg bg-blue-50 p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                Get Started with OpenInfo
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Create your first query to start tracking companies researching
                  topics you care about. It only takes a few minutes!
                </p>
              </div>
              <div className="mt-4">
                <Link
                  href="/queries/new"
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                >
                  Create Your First Query
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
