'use client'

/**
 * Daily Leads View
 *
 * Rebuilt with modern card layout, tabs (Today/Week/Archive),
 * per-lead Enrich button, CSV export, enrichment filter,
 * intent score badges, and upgrade upsell hooks.
 */

import { useState, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Calendar, TrendingUp, Zap, Download, Search,
  Mail, Phone, MapPin,
  Crown, Sparkles, Star, CheckCircle2,
  SlidersHorizontal, ChevronRight,
  Target, Users, Square, CheckSquare, XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/design-system'
import { formatDistanceToNow } from 'date-fns'
import { EnrichLeadPanel } from '@/components/leads/EnrichLeadPanel'

// ─── Types ─────────────────────────────────────────────────

interface Lead {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  email: string | null
  phone: string | null
  company_name: string | null
  company_domain: string | null
  job_title: string | null
  city: string | null
  state: string | null
  country: string | null
  delivered_at: string | null
  intent_score_calculated: number | null
  freshness_score: number | null
  enrichment_status: string | null
  verification_status: string | null
  status: string | null
  tags: string[] | null
  source: string | null
}

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

// ─── Helpers ───────────────────────────────────────────────

type TabKey = 'today' | 'week' | 'archive'

const ENRICHMENT_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Enriched', value: 'enriched' },
  { label: 'Pending', value: 'pending' },
]

function intentColor(score: number | null) {
  if (!score) return { bg: 'bg-gray-100', text: 'text-gray-500' }
  if (score >= 70) return { bg: 'bg-green-50 border border-green-200', text: 'text-green-700' }
  if (score >= 40) return { bg: 'bg-amber-50 border border-amber-200', text: 'text-amber-700' }
  return { bg: 'bg-red-50 border border-red-200', text: 'text-red-600' }
}

function intentLabel(score: number | null) {
  if (!score) return null
  if (score >= 70) return 'Hot'
  if (score >= 40) return 'Warm'
  return 'Cold'
}

function getInitials(lead: Lead) {
  const n = lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ')
  return n.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
]

function avatarColor(id: string) {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length]
}

function sourceLabel(source: string | null): { label: string; className: string } | null {
  if (!source) return null
  if (source === 'superpixel' || source.includes('superpixel')) {
    return { label: 'Pixel', className: 'bg-sky-50 text-sky-600 border-sky-200' }
  }
  if (source.startsWith('audience_labs') || source.startsWith('audiencelab')) {
    return { label: 'Daily', className: 'bg-blue-50 text-blue-600 border-blue-200' }
  }
  if (source === 'partner') {
    return { label: 'Partner', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' }
  }
  return null
}

// ─── CSV Export ────────────────────────────────────────────

function exportToCSV(leads: Lead[], filename: string) {
  const headers = ['Name', 'Email', 'Phone', 'Company', 'Job Title', 'City', 'State', 'Intent Score', 'Enrichment', 'Delivered']
  const rows = leads.map((l) => [
    l.full_name || [l.first_name, l.last_name].filter(Boolean).join(' ') || '',
    l.email || '',
    l.phone || '',
    l.company_name || '',
    l.job_title || '',
    l.city || '',
    l.state || '',
    l.intent_score_calculated ?? '',
    l.enrichment_status || '',
    l.delivered_at ? new Date(l.delivered_at).toLocaleDateString() : '',
  ])
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Lead Card ─────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }}
      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-primary"
      title="Copy to clipboard"
    >
      {copied ? (
        <CheckCircle2 className="h-3 w-3 text-green-500" />
      ) : (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  )
}

const LeadCard = memo(function LeadCard({
  lead,
  onEnrich,
  onView,
  selectionMode,
  isSelected,
  onToggleSelect,
  creditsRemaining = 0,
}: {
  lead: Lead
  onEnrich: (lead: Lead) => void
  onView: (id: string) => void
  selectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
  creditsRemaining?: number
}) {
  const name = lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown Lead'
  const isEnriched = lead.enrichment_status === 'enriched'
  const { bg, text } = intentColor(lead.intent_score_calculated)
  const label = intentLabel(lead.intent_score_calculated)

  return (
    <div
      className={cn(
        'group bg-white rounded-xl border p-5 hover:shadow-sm transition-all cursor-pointer',
        isSelected ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30' : 'border-gray-200 hover:border-gray-300',
      )}
      onClick={selectionMode ? () => onToggleSelect?.(lead.id) : undefined}
    >
      <div className="flex items-start gap-3">
        {/* Avatar or checkbox */}
        {selectionMode ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleSelect?.(lead.id) }}
            className="h-9 w-9 flex items-center justify-center shrink-0"
          >
            {isSelected
              ? <CheckSquare className="h-5 w-5 text-primary" />
              : <Square className="h-5 w-5 text-gray-300 group-hover:text-gray-400" />
            }
          </button>
        ) : (
          <div className={cn('h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0', avatarColor(lead.id))}>
            {getInitials(lead)}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 justify-between">
            <div className="min-w-0">
              <button
                onClick={() => onView(lead.id)}
                className="font-semibold text-gray-900 hover:text-primary transition-colors text-sm text-left block truncate"
              >
                {name}
              </button>
              {(lead.job_title || lead.company_name) && (
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {[lead.job_title, lead.company_name].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>

            {/* Intent badge */}
            {label && (
              <span className={cn('shrink-0 text-xs font-semibold rounded-full px-2.5 py-1', bg, text)}>
                {label} {lead.intent_score_calculated}
              </span>
            )}
          </div>

          {/* Contact + location */}
          <div className="mt-2 space-y-1">
            {lead.email && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                <span className="truncate flex-1">{lead.email}</span>
                {lead.verification_status === 'valid' && (
                  <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                )}
                <CopyButton value={lead.email} />
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                <span className="flex-1">{lead.phone}</span>
                <CopyButton value={lead.phone} />
              </div>
            )}
            {(lead.city || lead.state) && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <MapPin className="h-3 w-3 shrink-0" />
                {[lead.city, lead.state].filter(Boolean).join(', ')}
              </div>
            )}
          </div>

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {lead.tags.slice(0, 3).map((t) => (
                <span key={t} className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{t}</span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isEnriched && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2 py-0.5 font-medium">
                  <Zap className="h-2.5 w-2.5" /> Enriched
                </span>
              )}
              {(() => {
                const src = sourceLabel(lead.source)
                return src ? (
                  <span className={cn('inline-flex items-center text-[10px] border rounded-full px-2 py-0.5 font-medium', src.className)}>
                    {src.label}
                  </span>
                ) : null
              })()}
              {!isEnriched && !sourceLabel(lead.source) && (
                <span className="text-[10px] text-gray-400">
                  {lead.delivered_at ? formatDistanceToNow(new Date(lead.delivered_at), { addSuffix: true }) : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isEnriched && creditsRemaining === 0 && (
                <a
                  href="/settings/billing"
                  className="inline-flex items-center gap-1 text-xs bg-gray-400 text-white rounded-full px-2.5 py-1 font-medium hover:bg-gray-500 transition-colors"
                >
                  <Zap className="h-2.5 w-2.5" /> Buy Credits
                </a>
              )}
              {!isEnriched && creditsRemaining > 0 && (
                <button
                  onClick={() => onEnrich(lead)}
                  className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-blue-500 to-primary text-white rounded-full px-2.5 py-1 font-medium hover:opacity-90 transition-opacity"
                >
                  <Zap className="h-2.5 w-2.5" /> Enrich
                  {creditsRemaining <= 5 && (
                    <span className="ml-0.5 text-[9px] opacity-80">{creditsRemaining} left</span>
                  )}
                </button>
              )}
              <button
                onClick={() => onView(lead.id)}
                className="inline-flex items-center gap-1 text-xs text-gray-600 border border-gray-200 rounded-full px-2.5 py-1 hover:border-primary hover:text-primary transition-colors"
              >
                View <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

// ─── Stat Card ─────────────────────────────────────────────

const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  progress,
  accent = false,
  href,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  progress?: number
  accent?: boolean
  href?: string
}) {
  const content = (
    <div className={cn(
      'bg-white rounded-xl border p-5 transition-all',
      accent ? 'border-primary/30 bg-primary/5 hover:border-primary/50' : 'border-gray-200 hover:border-gray-300',
      href && 'cursor-pointer'
    )}>
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('p-1.5 rounded-lg', accent ? 'bg-primary/15' : 'bg-gray-100')}>
          <Icon className={cn('h-4 w-4', accent ? 'text-primary' : 'text-gray-600')} />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className={cn('text-2xl font-bold', accent ? 'text-primary' : 'text-gray-900')}>{value}</div>
      {progress !== undefined && (
        <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}
      {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
  )
  return href ? <a href={href}>{content}</a> : content
})

// ─── Archive tab (client-side paginated fetch) ──────────────

function ArchiveTab({
  workspaceId,
  onEnrich,
  onView,
  creditsRemaining,
}: {
  workspaceId?: string
  onEnrich: (lead: Lead) => void
  onView: (id: string) => void
  creditsRemaining: number
}) {
  const [page, setPage] = useState(1)
  const [enrichFilter, setEnrichFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['leads-archive', page, enrichFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), per_page: '24' })
      if (enrichFilter) params.set('enrichment_status', enrichFilter)
      const res = await fetch(`/api/leads?${params}`)
      if (!res.ok) throw new Error('Failed to load')
      return res.json()
    },
    staleTime: 60_000,
  })

  const leads: Lead[] = (data?.data ?? []).filter((l: Lead) =>
    !search || [l.full_name, l.email, l.company_name].some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {ENRICHMENT_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setEnrichFilter(f.value); setPage(1) }}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                enrichFilter === f.value ? 'bg-primary text-white font-medium' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => exportToCSV(data?.data ?? [], `cursive-leads-archive-p${page}.csv`)}
          disabled={!data?.data?.length}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-36" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
          <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No leads found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {leads.map((l) => (
              <LeadCard key={l.id} lead={l} onEnrich={onEnrich} onView={onView} />
            ))}
          </div>
          {data?.pagination && data.pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="text-sm text-gray-500">Page {page} of {data.pagination.total_pages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.pagination.total_pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

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
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkEnriching, setBulkEnriching] = useState(false)
  const [bulkEnrichProgress, setBulkEnrichProgress] = useState(0)

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
    // Optimistically update the enriched lead in local state
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

    for (let i = 0; i < selectedUnenriched.length; i++) {
      const lead = selectedUnenriched[i]
      try {
        const res = await fetch(`/api/leads/${lead.id}/enrich`, { method: 'POST' })
        if (res.ok) {
          const data = await res.json()
          // Update lead with enriched fields so card reflects new data immediately
          setTodayLeads((prev) =>
            prev.map((l) =>
              l.id === lead.id
                ? { ...l, enrichment_status: 'enriched', ...(data.after ?? {}) }
                : l
            )
          )
        }
      } catch {
        // continue on failure
      }
      setBulkEnrichProgress(i + 1)
    }

    setBulkEnriching(false)
    setBulkEnrichProgress(0)
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
          <a
            href="/my-leads/preferences"
            className="inline-flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Targeting
          </a>
          <button
            onClick={() => exportToCSV(todayLeads, `cursive-leads-${new Date().toISOString().split('T')[0]}.csv`)}
            disabled={todayLeads.length === 0}
            className="inline-flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
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

      {/* Unenriched call to action */}
      {unenrichedToday > 0 && !isFree && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-5 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Zap className="h-4 w-4 text-blue-600 shrink-0" />
            <p className="text-sm text-blue-800">
              <strong>{unenrichedToday} leads</strong> today haven&apos;t been enriched — fill in their email, phone, and LinkedIn. <span className="text-blue-600">1 credit each.</span>
            </p>
          </div>
          {creditsRemaining <= 3 && (
            <a
              href="/settings/billing"
              className="shrink-0 text-xs font-semibold text-blue-700 border border-blue-300 rounded-lg px-3 py-1.5 hover:bg-blue-100 transition-colors"
            >
              Get Credits
            </a>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {selectionMode && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => selectAll(currentTabLeads)}
              className="text-xs text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white hover:bg-gray-50 transition-colors"
            >
              Select all {currentTabLeads.length}
            </button>
            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={clearSelection}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <XCircle className="h-3.5 w-3.5" /> Clear
                </button>
                <button
                  onClick={handleBulkExport}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Download className="h-3 w-3" /> Export {selectedIds.size}
                </button>
                {selectedUnenriched.length > 0 && (
                  <button
                    onClick={handleBulkEnrich}
                    disabled={bulkEnriching || creditsRemaining < selectedUnenriched.length}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-primary rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Zap className="h-3 w-3" />
                    {bulkEnriching
                      ? `Enriching ${bulkEnrichProgress}/${selectedUnenriched.length}…`
                      : `Enrich ${selectedUnenriched.length} (${selectedUnenriched.length} cr)`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
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
            <p className="text-gray-500">No leads this week yet</p>
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
