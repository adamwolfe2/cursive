import { Suspense } from 'react'
import { LeadsTable, LeadStats } from '@/components/leads'

export const metadata = {
  title: 'Leads | Cursive',
  description: 'Manage and track your B2B leads',
}

export default function LeadsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Leads</h1>
        <p className="mt-1 text-[13px] text-zinc-500">
          Track and manage your B2B leads with intent data
        </p>
      </div>

      {/* Stats */}
      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-zinc-200 bg-white p-6"
              >
                <div className="h-4 w-20 bg-zinc-200 rounded"></div>
                <div className="mt-2 h-8 w-16 bg-zinc-200 rounded"></div>
              </div>
            ))}
          </div>
        }
      >
        <LeadStats />
      </Suspense>

      {/* Table */}
      <Suspense
        fallback={
          <div className="rounded-lg border border-zinc-200 bg-white p-12">
            <div className="flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-600" />
            </div>
          </div>
        }
      >
        <LeadsTable />
      </Suspense>
    </div>
  )
}
