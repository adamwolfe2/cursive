'use client'

/**
 * Daily Leads View
 *
 * Rebuilt with modern card layout, tabs (Today/Week/Archive),
 * per-lead Enrich button, CSV export, enrichment filter,
 * intent score badges, and upgrade upsell hooks.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Calendar, TrendingUp, Zap, Download, Search,
  Crown, Sparkles, Star,
  SlidersHorizontal, ChevronRight,
  Target, CheckSquare,
} from 'lucide-react'
import { cn } from '@/lib/design-system'
import { Button } from '@/components/ui/button'
import { LeadCard, type Lead, exportToCSV } from './lead-card'
import { StatCard } from './lead-stat-card'
import { BulkActionBar } from './bulk-action-bar'
import { ArchiveTab } from './archive-tab'
import { EnrichLeadPanel } from '@/components/leads/EnrichLeadPanel'

// ─── Types ─────────────────────────────────────────────────

interface DailyLeadsViewProps {
  leads: Lead[]
  todayCount: number
  weekCount: number
  monthCount: number
  dailyLimit: number
  plan: string
  industrySegment?: string | null
  locationSegment?: string | null
}

type TabKey = 'today' | 'week' | 'archive'

const ENRICHMENT_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Enriched', value: 'enriched' },
  { label: 'Pending', value: 'pending' },
]

// ─── Main Component ────────────────────────────────────────

export function DailyLeadsView({
  leads: initialLeads,
  todayCount,
  weekCount,
  monthCount,
  dailyLimit,
  plan,
  industrySegment,
  locationSegment,
}: DailyLeadsViewProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<TabKey>('today')
  const [enrichFilter, setEnrichFilter] = useState('')
  const [search, setSearch] = useState('')
  const [enrichTarget, setEnrichTarget] = useState<Lead | null>(null)
  const [creditsRemaining, setCreditsRemaining] = useState(0)
  const [creditLimit, setCreditLimit] = useState(0)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkEnriching, setBulkEnriching] = useState(false)
  const [bulkEnrichProgress, setBulkEnrichProgress] = useState(0)
  const [bulkEnrichErrors, setBulkEnrichErrors] = useState(0)

  // Local state for today's leads — enables optimistic updates after enrichment
  const [todayLeads, setTodayLeads] = useState<Lead[]>(initialLeads)

  // Fetch credits
  useQuery({
    queryKey: ['user-credits'],
    queryFn: async () => {
      const res = await fetch('/api/credits/status')
      if (!res.ok) return null
      const data = await res.json()
      setCreditsRemaining(data.credits?.remaining ?? 0)
      setCreditLimit(data.credits?.limit ?? 0)
      return data
    },
    staleTime: 30_000,
  })

  // Week leads
  const { data: weekData, isLoading: weekLoading } = useQuery({
    queryKey: ['leads-week'],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 86_400_000).toISOString()
      const res = await fetch(`/api/leads?date_from=${encodeURIComponent(since)}&per_page=50`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: tab === 'week',
    staleTime: 60_000,
  })

  const isFree = plan === 'free' || plan === 'starter'
  const progressPct = (todayCount / Math.max(dailyLimit, 1)) * 100

  // Filter today's leads
  const filteredToday = todayLeads.filter((l) => {
    if (search) {
      const q = search.toLowerCase()
      if (![l.full_name, l.email, l.company_name].some((v) => v?.toLowerCase().includes(q))) return false
    }
    if (enrichFilter === 'enriched') return l.enrichment_status === 'enriched'
    if (enrichFilter === 'pending') return l.enrichment_status === 'pending' || l.enrichment_status === null
    return true
  })

  const weekLeads: Lead[] = weekData?.data ?? []

  function handleView(id: string) {
    router.push(`/crm/leads/${id}`)
  }

  function handleEnrich(lead: Lead) {
    setEnrichTarget(lead)
  }

  function handleEnrichClose() {
    setEnrichTarget(null)
  }

  function handleEnrichSuccess() {
    if (enrichTarget) {
      setTodayLeads((prev) =>
        prev.map((l) => l.id === enrichTarget.id ? { ...l, enrichment_status: 'enriched' } : l)
      )
    }
    queryClient.invalidateQueries({ queryKey: ['leads-week'] })
    queryClient.invalidateQueries({ queryKey: ['leads-archive'] })
    queryClient.invalidateQueries({ queryKey: ['user-credits'] })
    setEnrichTarget(null)
  }

  function toggleSelectionMode() {
    setSelectionMode((prev) => !prev)
    setSelectedIds(new Set())
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll(leads: Lead[]) {
    setSelectedIds(new Set(leads.map((l) => l.id)))
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  // Get current tab's visible leads for bulk operations
  const currentTabLeads: Lead[] = tab === 'today' ? filteredToday : tab === 'week' ? weekLeads : []
  const selectedLeads = currentTabLeads.filter((l) => selectedIds.has(l.id))
  const selectedUnenriched = selectedLeads.filter((l) => l.enrichment_status !== 'enriched')

  async function handleBulkEnrich() {
    if (selectedUnenriched.length === 0 || bulkEnriching) return
    setBulkEnriching(true)
    setBulkEnrichProgress(0)
    setBulkEnrichErrors(0)

    let errorCount = 0
    for (let i = 0; i < selectedUnenriched.length; i++) {
      const lead = selectedUnenriched[i]
      try {
        const res = await fetch(`/api/leads/${lead.id}/enrich`, { method: 'POST' })
        if (res.ok) {
          const data = await res.json()
          setTodayLeads((prev) =>
            prev.map((l) =>
              l.id === lead.id
                ? { ...l, enrichment_status: 'enriched', ...(data.after ?? {}) }
                : l
            )
          )
        } else {
          errorCount++
          setBulkEnrichErrors(errorCount)
          // Mark lead as failed so card updates
          setTodayLeads((prev) =>
            prev.map((l) =>
              l.id === lead.id ? { ...l, enrichment_status: 'failed' } : l
            )
          )
        }
      } catch {
        errorCount++
        setBulkEnrichErrors(errorCount)
      }
      setBulkEnrichProgress(i + 1)
    }

    setBulkEnriching(false)
    setBulkEnrichProgress(0)
    setBulkEnrichErrors(0)
    setSelectedIds(new Set())
    setSelectionMode(false)
    queryClient.invalidateQueries({ queryKey: ['leads-week'] })
    queryClient.invalidateQueries({ queryKey: ['leads-archive'] })
    queryClient.invalidateQueries({ queryKey: ['user-credits'] })
  }

  function handleBulkExport() {
    exportToCSV(selectedLeads, `cursive-leads-selected-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const unenrichedToday = todayLeads.filter((l) => l.enrichment_status !== 'enriched').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
            Your Daily Leads
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Fresh, verified leads matched to your industry and location.
            {industrySegment && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-primary bg-primary/10 rounded-full px-2 py-0.5">
                <Target className="h-3 w-3" />
                {industrySegment}
                {locationSegment && ` · ${locationSegment}`}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a href="/my-leads/preferences">
            <Button variant="outline" size="sm" className="gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Targeting
            </Button>
          </a>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => exportToCSV(todayLeads, `cursive-leads-${new Date().toISOString().split('T')[0]}.csv`)}
            disabled={todayLeads.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <button
            onClick={toggleSelectionMode}
            className={cn(
              'inline-flex items-center gap-1.5 text-sm rounded-lg px-3 py-2 transition-colors',
              selectionMode
                ? 'bg-primary text-white border border-primary hover:bg-primary/90'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            {selectionMode ? 'Done' : 'Select'}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="Today"
          value={todayCount}
          sub={`${todayCount} of ${dailyLimit} delivered`}
          progress={progressPct}
        />
        <StatCard
          icon={TrendingUp}
          label="This Week"
          value={weekCount}
          sub={`${(weekCount / 7).toFixed(1)} avg/day`}
        />
        <StatCard
          icon={TrendingUp}
          label="This Month"
          value={monthCount}
          sub={isFree ? `${dailyLimit * 30}/mo limit` : 'Unlimited'}
        />
        <StatCard
          icon={Crown}
          label="Your Plan"
          value={plan.charAt(0).toUpperCase() + plan.slice(1)}
          sub={isFree ? undefined : `${dailyLimit} leads/day`}
          accent={isFree}
          href={isFree ? '/settings/billing' : undefined}
        />
      </div>

      {/* Upgrade banner */}
      {isFree && (
        <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">You&apos;re on the free plan</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Upgrade to Pro for up to 100 leads/day, 1,000 enrichments, and unlimited CSV export.
                </p>
              </div>
            </div>
            <a
              href="/settings/billing"
              className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              <Zap className="h-4 w-4" />
              Upgrade to Pro
            </a>
          </div>
        </div>
      )}

      {/* Credit usage alert — shown when credits hit 80%+ usage */}
      {creditLimit > 0 && creditsRemaining === 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Zap className="h-4 w-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-800">
              <strong>No enrichment credits remaining.</strong> Your daily credits reset at 8am CT tomorrow. Each enrichment costs 1 credit.
            </p>
          </div>
          <a
            href="/settings/billing"
            className="shrink-0 text-xs font-semibold text-red-700 border border-red-300 rounded-lg px-3 py-1.5 hover:bg-red-100 transition-colors"
          >
            Buy Credits
          </a>
        </div>
      )}
      {creditLimit > 0 && creditsRemaining > 0 && creditsRemaining / creditLimit <= 0.2 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-5 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Zap className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>{creditsRemaining} credit{creditsRemaining === 1 ? '' : 's'} left today</strong> — running low on enrichment credits.
            </p>
          </div>
          <a
            href="/settings/billing"
            className="shrink-0 text-xs font-semibold text-amber-700 border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition-colors"
          >
            Get More
          </a>
        </div>
      )}

      {/* Unenriched call to action */}
      {unenrichedToday > 0 && !isFree && creditsRemaining > 0 && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-5 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Zap className="h-4 w-4 text-blue-600 shrink-0" />
            <p className="text-sm text-blue-800">
              <strong>{unenrichedToday} leads</strong> today haven&apos;t been enriched — fill in their email, phone, and LinkedIn. <span className="text-blue-600">1 credit each.</span>
            </p>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {selectionMode && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          totalCount={currentTabLeads.length}
          selectedUnenrichedCount={selectedUnenriched.length}
          bulkEnriching={bulkEnriching}
          bulkEnrichProgress={bulkEnrichProgress}
          bulkEnrichErrors={bulkEnrichErrors}
          creditsRemaining={creditsRemaining}
          onSelectAll={() => selectAll(currentTabLeads)}
          onClear={clearSelection}
          onExport={handleBulkExport}
          onBulkEnrich={handleBulkEnrich}
        />
      )}

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center border-b border-gray-200 pb-0">
        <div className="flex gap-0">
          {([
            { key: 'today', label: `Today (${todayCount})` },
            { key: 'week', label: `This Week (${weekCount})` },
            { key: 'archive', label: 'All Leads' },
          ] as { key: TabKey; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters (Today + Week tabs only) */}
        {(tab === 'today' || tab === 'week') && (
          <div className="flex items-center gap-3 sm:ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="search"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 w-44"
              />
            </div>
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
              {ENRICHMENT_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setEnrichFilter(f.value)}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-md transition-colors',
                    enrichFilter === f.value ? 'bg-primary text-white font-medium' : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tab content */}
      {tab === 'today' && (
        filteredToday.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-xl border border-dashed border-gray-200">
            <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700 mb-1">
              {todayCount === 0 ? 'No leads yet today' : 'No leads match your filters'}
            </h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              {todayCount === 0
                ? 'Leads arrive every morning at 8am CT based on your targeting preferences.'
                : 'Try clearing your search or filter.'}
            </p>
            {todayCount === 0 && (
              <a href="/my-leads/preferences" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Set preferences <ChevronRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredToday.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onEnrich={handleEnrich}
                onView={handleView}
                selectionMode={selectionMode}
                isSelected={selectedIds.has(lead.id)}
                onToggleSelect={toggleSelect}
                creditsRemaining={creditsRemaining}
              />
            ))}
          </div>
        )
      )}

      {tab === 'week' && (
        weekLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-36" />
            ))}
          </div>
        ) : weekLeads.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
            <TrendingUp className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="font-medium text-gray-700 mb-1">No leads this week yet</p>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              New leads are delivered daily based on your targeting preferences. Check back soon!
            </p>
            <a href="/my-leads/preferences" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Review preferences
            </a>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-2">
              <button
                onClick={() => exportToCSV(weekLeads, `cursive-leads-week.csv`)}
                className="inline-flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {weekLeads.map((lead: Lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onEnrich={handleEnrich}
                  onView={handleView}
                  selectionMode={selectionMode}
                  isSelected={selectedIds.has(lead.id)}
                  onToggleSelect={toggleSelect}
                  creditsRemaining={creditsRemaining}
                />
              ))}
            </div>
          </>
        )
      )}

      {tab === 'archive' && (
        <ArchiveTab
          onEnrich={handleEnrich}
          onView={handleView}
          creditsRemaining={creditsRemaining}
        />
      )}

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
            linkedin_url: null,
            full_name: enrichTarget.full_name || [enrichTarget.first_name, enrichTarget.last_name].filter(Boolean).join(' ') || null,
          }}
          creditsRemaining={creditsRemaining}
          open={!!enrichTarget}
          onClose={handleEnrichClose}
          onEnriched={handleEnrichSuccess}
        />
      )}
    </div>
  )
}
