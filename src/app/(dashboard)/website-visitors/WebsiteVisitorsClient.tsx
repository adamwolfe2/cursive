'use client'

/**
 * Website Visitors Dashboard
 *
 * Shows pixel-identified leads with stats, enrichment status,
 * trial countdown, and upsell CTAs.
 *
 * State management hub — child components receive props.
 */

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  Eye, RefreshCw, SlidersHorizontal, Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/design-system'
import { EnrichLeadPanel } from '@/components/leads/EnrichLeadPanel'
import { AskYourDataSlideOver } from '@/components/intelligence'
import type { VisitorLead, VisitorStats, PixelInfo, VisitorsResponse } from './visitor-types'
import { exportVisitorsCSV } from './visitor-types'
import { VisitorStatsCards } from './VisitorStatsCards'
import { VisitorFilters } from './VisitorFilters'
import { VisitorGrid } from './VisitorGrid'
import { TrialBanner, NoPixelPromo, TrialExpiredOverlay } from './TrialBanner'
import { EnrichmentUpsell, ProUpsell } from './VisitorUpsells'

// ─── Main Client Component ──────────────────────────────────

interface WebsiteVisitorsClientProps {
  /** Stats pre-fetched server-side — renders immediately (no skeleton on first paint) */
  initialStats: VisitorStats | null
  /** Pixel info pre-fetched server-side */
  initialPixel: PixelInfo | null
}

export function WebsiteVisitorsClient({ initialStats, initialPixel }: WebsiteVisitorsClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [dateRange, setDateRange] = useState('30')
  const [enrichmentFilter, setEnrichmentFilter] = useState('')
  const [enrichTarget, setEnrichTarget] = useState<VisitorLead | null>(null)
  const [creditsRemaining, setCreditsRemaining] = useState(0)
  const [selectedVisitorIds, setSelectedVisitorIds] = useState<string[]>([])

  // Fetch credits
  useQuery({
    queryKey: ['user-credits'],
    queryFn: async () => {
      const res = await fetch('/api/credits/status')
      if (!res.ok) return null
      const data = await res.json()
      const remaining = data.credits?.remaining ?? 0
      setCreditsRemaining(remaining)
      return remaining
    },
    staleTime: 30_000,
  })

  const queryKey = ['visitors', page, dateRange, enrichmentFilter]

  const { data, isLoading, isFetching } = useQuery<VisitorsResponse>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        range: dateRange,
        ...(enrichmentFilter && { enrichment: enrichmentFilter }),
      })
      const res = await fetch(`/api/visitors?${params}`)
      if (!res.ok) throw new Error('Failed to load visitors')
      return res.json()
    },
    staleTime: 60_000,
    // Seed from server-side props so stats render on first paint without a skeleton
    initialData: initialStats && initialPixel
      ? { visitors: [], pagination: { total: 0, page: 1, limit: 25, pages: 0 }, stats: initialStats, pixel: initialPixel }
      : undefined,
    initialDataUpdatedAt: 0, // treat as stale so client fetch runs immediately for fresh table data
  })

  // Stats: use server-side initial data on first paint, then update from client fetch
  const stats = data?.stats ?? initialStats ?? undefined
  const visitors = data?.visitors ?? []
  const pagination = data?.pagination
  const pixel = data?.pixel ?? initialPixel

  function handleEnrich(lead: VisitorLead) {
    setEnrichTarget(lead)
  }

  function handleEnrichClose() {
    setEnrichTarget(null)
  }

  function handleEnrichSuccess() {
    queryClient.invalidateQueries({ queryKey: ['visitors'] })
    queryClient.invalidateQueries({ queryKey: ['user-credits'] })
    setEnrichTarget(null)
  }

  function handleDateRangeChange(value: string) {
    setDateRange(value)
    setPage(1)
  }

  function handleEnrichmentFilterChange(value: string) {
    setEnrichmentFilter(value)
    setPage(1)
  }

  function handleBulkComplete() {
    setSelectedVisitorIds([])
    queryClient.invalidateQueries({ queryKey: ['visitors'] })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            Website Visitors
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            See who&apos;s visiting your website — identified by name, company, and contact info.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => visitors.length && exportVisitorsCSV(visitors, dateRange)}
            disabled={!visitors.length}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['visitors'] })}
            disabled={isFetching}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
            Refresh
          </Button>
          <a
            href="/settings/pixel"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Pixel Settings
          </a>
        </div>
      </div>

      {/* Trial Banner */}
      {pixel && <TrialBanner pixel={pixel} />}

      {/* No pixel setup */}
      {!isLoading && !pixel && <NoPixelPromo />}

      {/* Stats */}
      {stats && (
        <VisitorStatsCards
          stats={stats}
          dateRange={dateRange}
          isLoading={isLoading}
          visitors={visitors}
        />
      )}

      {/* Filters */}
      <VisitorFilters
        dateRange={dateRange}
        enrichmentFilter={enrichmentFilter}
        totalCount={pagination?.total}
        onDateRangeChange={handleDateRangeChange}
        onEnrichmentFilterChange={handleEnrichmentFilterChange}
      />

      {/* Upsell strip */}
      {!isLoading && stats && (
        <EnrichmentUpsell stats={stats} />
      )}

      {/* Trial expired locked overlay */}
      {pixel?.trial_status === 'expired' && visitors.length > 0 && (
        <TrialExpiredOverlay visitors={visitors} />
      )}

      {/* Visitor grid */}
      <VisitorGrid
        visitors={visitors}
        pixel={pixel}
        isLoading={isLoading}
        page={page}
        pagination={pagination}
        selectedVisitorIds={selectedVisitorIds}
        onPageChange={setPage}
        onSelectionChange={setSelectedVisitorIds}
        onEnrich={handleEnrich}
        onView={(id) => router.push(`/crm/leads/${id}`)}
        onBulkComplete={handleBulkComplete}
      />

      {/* Pro upsell */}
      {!isLoading && visitors.length > 0 && <ProUpsell />}

      {/* Enrich Panel */}
      {enrichTarget && (
        <EnrichLeadPanel
          leadId={enrichTarget.id}
          lead={{
            email: enrichTarget.email,
            phone: enrichTarget.phone,
            company_name: enrichTarget.company_name,
            company_domain: enrichTarget.company_domain,
            job_title: enrichTarget.job_title,
            city: enrichTarget.city,
            state: enrichTarget.state,
            linkedin_url: enrichTarget.linkedin_url,
            full_name: enrichTarget.full_name || [enrichTarget.first_name, enrichTarget.last_name].filter(Boolean).join(' ') || null,
          }}
          creditsRemaining={creditsRemaining}
          open={!!enrichTarget}
          onClose={handleEnrichClose}
          onEnriched={handleEnrichSuccess}
        />
      )}

      {/* Ask Your Data — floating AI query button */}
      <AskYourDataSlideOver />
    </div>
  )
}
