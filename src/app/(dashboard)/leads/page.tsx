import { Suspense } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { LeadStats } from '@/components/leads'
import { PageContainer, PageHeader } from '@/components/layout/page-container'
import { GradientCard } from '@/components/ui/gradient-card'
import { Skeleton } from '@/components/ui/loading-states'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

// Dynamically import LeadsTable to reduce initial bundle size
const LeadsTable = dynamic(() => import('@/components/leads/leads-table').then(mod => ({ default: mod.LeadsTable })), {
  loading: () => (
    <GradientCard variant="subtle">
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    </GradientCard>
  ),
})

export const metadata = {
  title: 'Leads | Cursive',
  description: 'Manage and track your B2B leads',
}

export default function LeadsPage() {
  return (
    <PageContainer maxWidth="wide">
      {/* Header */}
      <PageHeader
        title="Leads"
        description="Track and manage your B2B leads with intent data"
        action={
          <Link href="/leads/discover">
            <Button>
              <Search className="h-4 w-4 mr-2" />
              Discover Leads
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="mb-8">
        <Suspense
          fallback={
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <GradientCard key={i} variant="subtle">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </GradientCard>
              ))}
            </div>
          }
        >
          <LeadStats />
        </Suspense>
      </div>

      {/* Table */}
      <Suspense
        fallback={
          <GradientCard variant="subtle">
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
            </div>
          </GradientCard>
        }
      >
        <LeadsTable />
      </Suspense>
    </PageContainer>
  )
}
