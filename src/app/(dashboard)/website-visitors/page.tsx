'use client'

/**
 * Website Visitors Dashboard
 *
 * Shows pixel-identified leads with stats, enrichment status,
 * trial countdown, and upsell CTAs.
 */

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  Eye, Zap, TrendingUp, Users, Clock, ArrowRight,
  Building2, MapPin, Mail, Phone, Linkedin, ExternalLink,
  RefreshCw, SlidersHorizontal, Calendar, Sparkles,
  AlertTriangle, CheckCircle2, Circle, Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/design-system'
import { formatDistanceToNow } from 'date-fns'
import { EnrichLeadPanel } from '@/components/leads/EnrichLeadPanel'

// ─── Types ─────────────────────────────────────────────────

interface VisitorLead {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  email: string | null
  phone: string | null
  company_name: string | null
  job_title: string | null
  city: string | null
  state: string | null
  country: string | null
  intent_score_calculated: number | null
  enrichment_status: string | null
  created_at: string
  source: string | null
  linkedin_url: string | null
}

interface VisitorStats {
  total: number
  this_week: number
  enriched: number
  avg_score: number
  match_rate: number
}

interface PixelInfo {
  pixel_id: string
  domain: string
  trial_status: string | null
  trial_ends_at: string | null
  is_active: boolean
}

interface VisitorsResponse {
  visitors: VisitorLead[]
  pagination: { total: number; page: number; limit: number; pages: number }
  stats: VisitorStats
  pixel: PixelInfo | null
}

// ─── Helpers ───────────────────────────────────────────────

const DATE_RANGES = [
  { label: '7 days', value: '7' },
  { label: '30 days', value: '30' },
  { label: '90 days', value: '90' },
]

const ENRICHMENT_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Enriched', value: 'enriched' },
  { label: 'Unenriched', value: 'unenriched' },
]

function getIntentColor(score: number | null): string {
  if (!score) return 'text-gray-400'
  if (score >= 70) return 'text-green-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-500'
}

function getIntentBg(score: number | null): string {
  if (!score) return 'bg-gray-100'
  if (score >= 70) return 'bg-green-50 border-green-200'
  if (score >= 40) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

function getInitials(lead: VisitorLead): string {
  const name = lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ')
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function getAvatarColor(id: string): string {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
  ]
  const idx = id.charCodeAt(0) % colors.length
  return colors[idx]
}

// ─── Stat Card ─────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconClass,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  iconClass?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('p-2 rounded-lg', iconClass ?? 'bg-primary/10')}>
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

// ─── Copy Button ─────────────────────────────────────────

function CopyBtn({ value }: { value: string }) {
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
      className="ml-1 text-gray-400 hover:text-primary transition-colors"
      title="Copy"
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

// ─── Visitor Card ──────────────────────────────────────────

function VisitorCard({
  lead,
  onEnrich,
  onView,
}: {
  lead: VisitorLead
  onEnrich: (lead: VisitorLead) => void
  onView: (id: string) => void
}) {
  const name = lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unknown Visitor'
  const initials = getInitials(lead)
  const isEnriched = lead.enrichment_status === 'enriched'
  const hasEmail = !!lead.email
  const hasPhone = !!lead.phone
  const hasLinkedIn = !!lead.linkedin_url

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all group">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={cn('h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0', getAvatarColor(lead.id))}>
          {initials || <Users className="h-4 w-4" />}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <button
                onClick={() => onView(lead.id)}
                className="font-semibold text-gray-900 hover:text-primary transition-colors text-left truncate block"
              >
                {name}
              </button>
              {(lead.job_title || lead.company_name) && (
                <p className="text-sm text-gray-500 truncate">
                  {[lead.job_title, lead.company_name].filter(Boolean).join(' · ')}
                </p>
              )}
              {(lead.city || lead.state) && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {[lead.city, lead.state].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {/* Intent score */}
            {lead.intent_score_calculated !== null && (
              <div className={cn('shrink-0 rounded-lg border px-2.5 py-1 text-center', getIntentBg(lead.intent_score_calculated))}>
                <div className={cn('text-sm font-bold', getIntentColor(lead.intent_score_calculated))}>
                  {lead.intent_score_calculated}
                </div>
                <div className="text-[10px] text-gray-400 leading-none">score</div>
              </div>
            )}
          </div>

          {/* Contact details (enriched) or data pills (not enriched) */}
          {isEnriched ? (
            <div className="mt-3 space-y-1">
              {hasEmail && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                  <span className="truncate flex-1">{lead.email}</span>
                  <CopyBtn value={lead.email!} />
                </div>
              )}
              {hasPhone && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                  <span className="flex-1">{lead.phone}</span>
                  <CopyBtn value={lead.phone!} />
                </div>
              )}
              {hasLinkedIn && (
                <a
                  href={lead.linkedin_url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Linkedin className="h-3 w-3 shrink-0" />
                  LinkedIn Profile
                  <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                </a>
              )}
              <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 mt-0.5">
                <Zap className="h-2.5 w-2.5" /> Enriched
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {hasEmail && (
                <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1">
                  <Mail className="h-3 w-3" /> Email
                </span>
              )}
              {hasPhone && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1">
                  <Phone className="h-3 w-3" /> Phone
                </span>
              )}
              {hasLinkedIn && (
                <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-1">
                  <Linkedin className="h-3 w-3" /> LinkedIn
                </span>
              )}
            </div>
          )}

          {/* Footer: timestamp + actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
            </span>

            <div className="flex items-center gap-2">
              {!isEnriched && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => onEnrich(lead)}
                >
                  <Zap className="h-3 w-3" />
                  Enrich
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-3 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onView(lead.id)}
              >
                View <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Trial Banner ──────────────────────────────────────────

function TrialBanner({ pixel }: { pixel: PixelInfo }) {
  const isExpired = pixel.trial_status === 'expired'
  const isActive = pixel.trial_status === 'trial'
  const trialEndsAt = pixel.trial_ends_at ? new Date(pixel.trial_ends_at) : null
  const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86_400_000)) : null

  if (pixel.trial_status === 'active') return null

  if (isExpired) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="font-semibold text-red-900 text-sm">Your pixel trial has ended</p>
              <p className="text-xs text-red-700 mt-0.5">
                Upgrade to Pro to reactivate your pixel on <strong>{pixel.domain}</strong> and keep identifying new visitors.
              </p>
            </div>
          </div>
          <a
            href="/settings/billing"
            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Reactivate Pixel <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    )
  }

  if (isActive && daysLeft !== null) {
    const isUrgent = daysLeft <= 4
    return (
      <div className={cn(
        'rounded-xl border px-5 py-4',
        isUrgent ? 'border-amber-200 bg-amber-50' : 'border-blue-100 bg-blue-50'
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Clock className={cn('h-5 w-5 shrink-0', isUrgent ? 'text-amber-500' : 'text-blue-500')} />
            <div>
              <p className={cn('font-semibold text-sm', isUrgent ? 'text-amber-900' : 'text-blue-900')}>
                {daysLeft === 0 ? 'Trial ends today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your free pixel trial`}
              </p>
              <p className={cn('text-xs mt-0.5', isUrgent ? 'text-amber-700' : 'text-blue-700')}>
                After your trial ends, your pixel stops identifying visitors. Upgrade to keep it running forever.
              </p>
            </div>
          </div>
          <a
            href="/settings/billing"
            className={cn(
              'shrink-0 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors',
              isUrgent ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'
            )}
          >
            Upgrade to Pro <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    )
  }

  return null
}

// ─── Empty State ───────────────────────────────────────────

function EmptyState({ hasPixel }: { hasPixel: boolean }) {
  if (!hasPixel) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Eye className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Install the Cursive pixel</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
          Install a lightweight pixel to identify anonymous website visitors in real-time. Free for 14 days.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/settings/pixel"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Set Up Pixel — Free 14-Day Trial
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Users className="h-7 w-7 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No visitors yet</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto">
        Visitors will appear here once your pixel starts firing. Make sure the snippet is installed on every page.
      </p>
      <a
        href="/settings/pixel"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-4"
      >
        Check pixel install status <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}

// ─── CSV Export ────────────────────────────────────────────

function exportVisitorsCSV(visitors: VisitorLead[], dateRange: string) {
  const headers = ['Name', 'Email', 'Phone', 'Company', 'Job Title', 'City', 'State', 'Intent Score', 'Enrichment', 'Visited']
  const rows = visitors.map((v) => [
    v.full_name || [v.first_name, v.last_name].filter(Boolean).join(' ') || '',
    v.email || '',
    v.phone || '',
    v.company_name || '',
    v.job_title || '',
    v.city || '',
    v.state || '',
    v.intent_score_calculated ?? '',
    v.enrichment_status || '',
    v.created_at ? new Date(v.created_at).toLocaleDateString() : '',
  ])
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cursive-visitors-${dateRange}days-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Main Page ─────────────────────────────────────────────

export default function WebsiteVisitorsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [dateRange, setDateRange] = useState('30')
  const [enrichmentFilter, setEnrichmentFilter] = useState('')
  const [enrichTarget, setEnrichTarget] = useState<VisitorLead | null>(null)
  const [creditsRemaining, setCreditsRemaining] = useState(0)

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
  })

  const stats = data?.stats
  const visitors = data?.visitors ?? []
  const pagination = data?.pagination
  const pixel = data?.pixel

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

        <div className="flex items-center gap-2">
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
      {!isLoading && !pixel && (
        <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-primary/5 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <p className="font-semibold text-blue-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Start your free 14-day pixel trial
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Install the SuperPixel to identify who&apos;s visiting your website and turn anonymous traffic into named leads.
              </p>
            </div>
            <a
              href="/settings/pixel"
              className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      {/* Stats */}
      {(stats || isLoading) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
                <div className="h-8 w-16 bg-gray-200 rounded" />
              </div>
            ))
          ) : (
            <>
              <StatCard
                icon={Users}
                label="Total Identified"
                value={(stats?.total ?? 0).toLocaleString()}
                sub={`last ${dateRange} days`}
                iconClass="bg-blue-100"
              />
              <StatCard
                icon={TrendingUp}
                label="This Week"
                value={(stats?.this_week ?? 0).toLocaleString()}
                sub="new visitors"
                iconClass="bg-emerald-100"
              />
              <StatCard
                icon={Zap}
                label="Enriched"
                value={(stats?.enriched ?? 0).toLocaleString()}
                sub={`${stats?.match_rate ?? 0}% match rate`}
                iconClass="bg-blue-100"
              />
              <StatCard
                icon={TrendingUp}
                label="Avg Intent Score"
                value={stats?.avg_score ?? 0}
                sub="out of 100"
                iconClass="bg-amber-100"
              />
            </>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Date range */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          <Calendar className="h-4 w-4 text-gray-400 ml-2" />
          {DATE_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => { setDateRange(r.value); setPage(1) }}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                dateRange === r.value
                  ? 'bg-primary text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Enrichment filter */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {ENRICHMENT_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setEnrichmentFilter(f.value); setPage(1) }}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                enrichmentFilter === f.value
                  ? 'bg-primary text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {pagination && (
          <span className="text-sm text-gray-400 ml-auto">
            {pagination.total.toLocaleString()} visitor{pagination.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Upsell strip — if they have enrichable visitors */}
      {!isLoading && stats && stats.total > 0 && stats.enriched < stats.total && (
        <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-primary/5 px-5 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {(stats.total - stats.enriched).toLocaleString()} visitors haven&apos;t been enriched yet
                </p>
                <p className="text-xs text-gray-500">
                  Enrich them to unlock email, phone, LinkedIn, and company data — 1 credit each
                </p>
              </div>
            </div>
            <a
              href="/settings/billing"
              className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Get More Credits
            </a>
          </div>
        </div>
      )}

      {/* Trial expired locked overlay */}
      {pixel?.trial_status === 'expired' && visitors.length > 0 && (
        <div className="relative">
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
            <div className="text-center max-w-md px-6">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Pixel trial ended</h3>
              <p className="text-sm text-gray-500 mb-4">
                Upgrade to Pro to keep identifying website visitors and unlock full enrichment.
              </p>
              <a
                href="/settings/billing"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                Upgrade to Pro
              </a>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-30 pointer-events-none select-none" aria-hidden="true">
            {visitors.slice(0, 3).map((v) => (
              <VisitorCard key={v.id} lead={v} onEnrich={() => {}} onView={() => {}} />
            ))}
          </div>
        </div>
      )}

      {/* Visitor list (hidden when trial expired — locked overlay shows instead) */}
      {pixel?.trial_status === 'expired' ? null : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : visitors.length === 0 ? (
        <EmptyState hasPixel={!!pixel} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visitors.map((v) => (
              <VisitorCard
                key={v.id}
                lead={v}
                onEnrich={handleEnrich}
                onView={(id) => router.push(`/crm/leads/${id}`)}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Pro upsell — lookalike + outbound tease */}
      {!isLoading && visitors.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-gray-900">Unlock more with Pro</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: Users,
                title: 'Lookalike Audiences',
                desc: 'Build ad audiences that mirror your best visitors. Target people just like them on Facebook, Google, and LinkedIn.',
                href: '/activate?flow=audience',
                cta: 'Build Audience →',
              },
              {
                icon: Mail,
                title: 'Outbound on Autopilot',
                desc: 'We run personalised email campaigns to your identified visitors on your behalf — you just close the deals.',
                href: '/activate?flow=campaign',
                cta: 'Launch Campaign →',
              },
              {
                icon: Zap,
                title: '1,000 Enrichments/Day',
                desc: 'Fill in every missing field on every new visitor automatically — email, phone, company, LinkedIn.',
                href: '/settings/billing',
                cta: 'Upgrade →',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm text-gray-900">{item.title}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{item.desc}</p>
                <a
                  href={item.href}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  {item.cta} <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrich Panel */}
      {enrichTarget && (
        <EnrichLeadPanel
          leadId={enrichTarget.id}
          lead={{
            email: enrichTarget.email,
            phone: enrichTarget.phone,
            company_name: enrichTarget.company_name,
            company_domain: null,
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
    </div>
  )
}
