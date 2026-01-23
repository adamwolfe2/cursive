// Lead Data Page

import { getCurrentUser } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import { LeadsTable } from '@/components/leads/leads-table'
import { LeadStats } from '@/components/leads/lead-stats'
import { PageContainer, PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DataPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const params = await searchParams

  // Extract initial filters from query params
  const initialFilters = {
    query_id: typeof params.query_id === 'string' ? params.query_id : undefined,
    enrichment_status:
      typeof params.enrichment_status === 'string'
        ? params.enrichment_status
        : undefined,
    delivery_status:
      typeof params.delivery_status === 'string'
        ? params.delivery_status
        : undefined,
    intent_score:
      typeof params.intent_score === 'string' ? params.intent_score : undefined,
  }

  return (
    <PageContainer>
      <PageHeader
        title="Lead Data"
        description="View and manage all discovered leads across your queries"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Lead Data' },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Export
            </Button>
            <Link href="/queries/new">
              <Button size="sm">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Query
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="mb-6">
        <LeadStats />
      </div>

      {/* Table */}
      <LeadsTable initialFilters={initialFilters} />
    </PageContainer>
  )
}
