// Query Detail Page

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Query Details | Cursive' }
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { QueryRepository } from '@/lib/repositories/query.repository'
import { QueryStatusToggle } from '@/components/queries/query-status-toggle'
import { DeleteQueryButton } from '@/components/queries/delete-query-button'

interface QueryDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function QueryDetailPage({ params }: QueryDetailPageProps) {
  const { id } = await params

  // Layout already verified auth — get session for workspace lookup
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('workspace_id')
    .eq('auth_user_id', session.user.id)
    .maybeSingle()
  if (!userData?.workspace_id) redirect('/welcome')

  // Fetch query details
  const queryRepo = new QueryRepository()
  const query = await queryRepo.findById(id, userData.workspace_id)

  if (!query) {
    notFound()
  }

  // Fetch recent leads for this query
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('query_id', query.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const filters = query.filters as any
  const hasFilters =
    filters?.location ||
    filters?.employee_range ||
    filters?.revenue_range ||
    (filters?.industry && filters.industry.length > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <Link
            href="/queries"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <svg
              className="mr-1 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Queries
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 truncate">
            {query.name || (query as any).global_topics?.topic}
          </h1>
          <p className="mt-1 text-sm text-gray-500 capitalize">
            {(query as any).global_topics?.category}
          </p>
        </div>
        <div className="flex items-center space-x-3 ml-4">
          <QueryStatusToggle
            queryId={query.id}
            currentStatus={query.status as 'active' | 'paused' | 'archived'}
          />
          <DeleteQueryButton queryId={query.id} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <dt className="text-sm font-medium text-gray-500">Status</dt>
          <dd className="mt-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                query.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : query.status === 'paused'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
              }`}
            >
              {query.status}
            </span>
          </dd>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <dt className="text-sm font-medium text-gray-500">Total Leads</dt>
          <dd className="mt-2 text-3xl font-semibold text-gray-900">
            {(query as any).total_leads_generated || 0}
          </dd>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <dt className="text-sm font-medium text-gray-500">This Week</dt>
          <dd className="mt-2 text-3xl font-semibold text-gray-900">
            {(query as any).leads_this_week || 0}
          </dd>
        </div>
      </div>

      {/* Query Details */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Query Details
        </h2>

        <dl className="space-y-4">
          {/* Topic */}
          <div>
            <dt className="text-sm font-medium text-gray-500">Topic</dt>
            <dd className="mt-1 text-base text-gray-900">
              {(query as any).global_topics?.topic}
            </dd>
          </div>

          {/* Location */}
          {filters?.location && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="mt-1 text-base text-gray-900">
                {[
                  filters.location.city,
                  filters.location.state,
                  filters.location.country,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </dd>
            </div>
          )}

          {/* Employee Range */}
          {filters?.employee_range && (
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Number of Employees
              </dt>
              <dd className="mt-1 text-base text-gray-900">
                {filters.employee_range.min?.toLocaleString() || '0'} -{' '}
                {filters.employee_range.max
                  ? filters.employee_range.max.toLocaleString()
                  : 'Unlimited'}
              </dd>
            </div>
          )}

          {/* Revenue Range */}
          {filters?.revenue_range && (
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Annual Revenue
              </dt>
              <dd className="mt-1 text-base text-gray-900">
                ${(filters.revenue_range.min || 0).toLocaleString()} -{' '}
                {filters.revenue_range.max
                  ? `$${filters.revenue_range.max.toLocaleString()}`
                  : 'Unlimited'}
              </dd>
            </div>
          )}

          {/* Industries */}
          {filters?.industry && filters.industry.length > 0 && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Industries</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {filters.industry.map((industry: string) => (
                  <span
                    key={industry}
                    className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                  >
                    {industry}
                  </span>
                ))}
              </dd>
            </div>
          )}

          {/* No Filters Message */}
          {!hasFilters && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Filters</dt>
              <dd className="mt-1 text-base text-gray-900">
                No filters applied - tracking all companies researching this
                topic
              </dd>
            </div>
          )}

          {/* Last Run */}
          {query.last_run_at && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Run</dt>
              <dd className="mt-1 text-base text-gray-900">
                {new Date(query.last_run_at).toLocaleString()}
              </dd>
            </div>
          )}

          {/* Created Date */}
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-base text-gray-900">
              {new Date(query.created_at).toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>

      {/* Recent Leads */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Leads</h2>
        </div>

        {!leads || leads.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              No leads yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Leads will appear here once your query runs
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {leads.map((lead: any) => (
              <div key={lead.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {lead.company_data?.name || 'Unknown Company'}
                    </h3>
                    {lead.company_data?.domain && (
                      <p className="mt-1 text-xs text-gray-500">
                        {lead.company_data.domain}
                      </p>
                    )}
                  </div>
                  <span
                    className={`ml-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      lead.enrichment_status === 'enriched'
                        ? 'bg-green-100 text-green-800'
                        : lead.enrichment_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : lead.enrichment_status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {lead.enrichment_status}
                  </span>
                </div>
                {lead.contact_data && (
                  <div className="mt-2 text-xs text-gray-500">
                    {lead.contact_data.name && (
                      <div>{lead.contact_data.name}</div>
                    )}
                    {lead.contact_data.title && (
                      <div>{lead.contact_data.title}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {leads && leads.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <Link
              href={`/data?query_id=${query.id}`}
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              View all leads →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
