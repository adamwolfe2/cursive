/**
 * Dashboard — streaming SSR
 *
 * Fast phase  (~100–300 ms): user profile, cached stats, pixel, targeting, credits
 *   → renders header, banners, 4 stat cards immediately
 *
 * Streamed phase (~200–500 ms, ≤2 s on cache miss): hot leads, recent leads,
 *   enrichments, pipeline stats, first-enrichment celebration
 *   → renders below the fold while user already sees content above it
 */

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CreditService } from '@/lib/services/credit.service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users, TrendingUp, Crown, ArrowRight, Sparkles,
  Zap, Star, Target, CheckCircle2, Circle,
  Calendar, Eye, Rocket, Activity, Flame, Phone, Mail,
} from 'lucide-react'
import { sanitizeName, sanitizeCompanyName, sanitizeText } from '@/lib/utils/sanitize-text'
import { DashboardAnimationWrapper, AnimatedSection } from '@/components/dashboard/dashboard-animation-wrapper'
import { formatDistanceToNow } from 'date-fns'
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist'
import { WhatsNewModal } from '@/components/dashboard/WhatsNewModal'
import { FirstLeadsBanner } from '@/components/dashboard/FirstLeadsBanner'
import { PendingLeadsBanner } from '@/components/dashboard/PendingLeadsBanner'
import { TargetingMissingBanner } from '@/components/dashboard/TargetingMissingBanner'
import { TrialCountdown } from '@/components/dashboard/TrialCountdown'
import { FirstEnrichmentModal } from '@/components/onboarding/FirstEnrichmentModal'
import { ProvisioningWidget } from '@/components/dashboard/ProvisioningWidget'

export const metadata: Metadata = {
  title: 'Dashboard | Cursive',
}

// ─── Module-scope helpers ──────────────────────────────────────────────────────

function intentLabel(score: number | null) {
  if (!score) return null
  if (score >= 70) return { label: 'Hot',  color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
  if (score >= 40) return { label: 'Warm', color: 'text-amber-600 bg-amber-50 border-amber-200' }
  return              { label: 'Cold', color: 'text-slate-600 bg-slate-100 border-slate-200' }
}

function trendBadge(current: number, previous: number) {
  if (previous === 0) return null
  const pct = Math.round(((current - previous) / previous) * 100)
  if (Math.abs(pct) < 1) return null
  return { pct: Math.abs(pct), up: pct > 0 }
}

// ─── Module-scope cache functions (stable references = proper Next.js caching) ─

const getCachedWorkspaceStats = unstable_cache(
  async (wsId: string) => {
    const admin = createAdminClient()
    const { data } = await admin
      .from('workspace_stats_cache')
      .select('*')
      .eq('workspace_id', wsId)
      .maybeSingle()

    const today = new Date().toISOString().split('T')[0]
    if (
      data &&
      data.stats_date === today &&
      Date.now() - new Date(data.refreshed_at).getTime() < 20 * 60 * 1000
    ) {
      return data
    }

    // Cache miss — refresh inline with 4 s guard, then return fresh row
    try {
      await Promise.race([
        admin.rpc('refresh_workspace_stats', { p_workspace_id: wsId }),
        new Promise(resolve => setTimeout(resolve, 4000)),
      ])
    } catch {
      // swallow RPC errors — stale cache is acceptable
    }
    const { data: fresh } = await admin
      .from('workspace_stats_cache')
      .select('*')
      .eq('workspace_id', wsId)
      .maybeSingle()
    return fresh
  },
  ['workspace-stats'],
  { revalidate: 120 },
)

const getCachedRecentLeads = unstable_cache(
  async (wsId: string) => {
    const admin = createAdminClient()
    const { data } = await admin
      .from('leads')
      .select('id, full_name, first_name, last_name, email, phone, company_name, status, created_at, delivered_at, intent_score_calculated, enrichment_status, source')
      .eq('workspace_id', wsId)
      .order('delivered_at', { ascending: false, nullsFirst: false })
      .order('created_at',   { ascending: false })
      .limit(8)
    return data ?? []
  },
  ['recent-leads'],
  { revalidate: 120 },
)

const getCachedRecentEnrichments = unstable_cache(
  async (wsId: string) => {
    const admin = createAdminClient()
    const { data } = await admin
      .from('leads')
      .select('id, full_name, first_name, last_name, company_name, updated_at, source')
      .eq('workspace_id', wsId)
      .eq('enrichment_status', 'enriched')
      .order('updated_at', { ascending: false })
      .limit(5)
    return data ?? []
  },
  ['recent-enrichments'],
  { revalidate: 120 },
)

const getCachedHotLeads = unstable_cache(
  async (wsId: string) => {
    const admin = createAdminClient()
    const { data } = await admin
      .from('leads')
      .select('id, full_name, first_name, last_name, email, phone, company_name, intent_score_calculated, enrichment_status, status, source')
      .eq('workspace_id', wsId)
      .gte('intent_score_calculated', 40)
      .not('status', 'eq', 'won')
      .not('status', 'eq', 'lost')
      .order('intent_score_calculated', { ascending: false })
      .limit(5)
    return data ?? []
  },
  ['hot-leads'],
  { revalidate: 300 },
)

const getCachedPipelineStats = unstable_cache(
  async (wsId: string) => {
    const admin = createAdminClient()
    const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const

    // Run all count queries in parallel — no rows loaded into memory
    const results = await Promise.all(
      statuses.map(status =>
        admin
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', wsId)
          .eq('status', status)
          .then(({ count }) => [status, count ?? 0] as const)
      )
    )

    // Also count rows with null/empty status (treated as 'new')
    const { count: nullStatusCount } = await admin
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', wsId)
      .is('status', null)

    const counts: Record<string, number> = {}
    for (const [status, count] of results) {
      counts[status] = count
    }
    counts.new = (counts.new ?? 0) + (nullStatusCount ?? 0)

    return counts as { new: number; contacted: number; qualified: number; proposal: number; negotiation: number; won: number; lost: number }
  },
  ['pipeline-stats'],
  { revalidate: 120 },
)

// ─── Types ────────────────────────────────────────────────────────────────────

type ChecklistItem = { id: string; label: string; done: boolean; href: string | null }

interface MainGridProps {
  workspaceId: string
  hasPreferences: boolean
  hasEnriched: boolean
  hasPixel: boolean
  hasVerifiedPixel: boolean
  hasActivated: boolean
  isOnTrial: boolean
  trialEndsAtStr: string | null
  pixelEventCount: number
  visitorCountTotal: number | null
  todayCount: number
  isFree: boolean
  showChecklist: boolean
  checklistItems: ChecklistItem[]
  checklistProgress: number
  checklistTotal: number
  creditLimit: number
  dailyLimit: number
}

// ─── Streamed main content grid ────────────────────────────────────────────────

async function DashboardMainGrid(props: MainGridProps) {
  const {
    workspaceId, hasPreferences, hasEnriched, hasPixel, hasVerifiedPixel,
    hasActivated, isOnTrial, trialEndsAtStr, pixelEventCount, visitorCountTotal,
    todayCount, isFree, showChecklist, checklistItems, checklistProgress,
    checklistTotal, creditLimit, dailyLimit,
  } = props

  const supabase = await createClient()

  const [hotLeads, recentLeads, recentEnrichments, pipelineStats, firstEnrichmentResult] =
    await Promise.all([
      getCachedHotLeads(workspaceId),
      getCachedRecentLeads(workspaceId),
      getCachedRecentEnrichments(workspaceId),
      getCachedPipelineStats(workspaceId),
      supabase
        .from('workspaces')
        .select('has_seen_first_enrichment')
        .eq('id', workspaceId)
        .maybeSingle()
        .then(async ({ data: ws }) => {
          if (ws?.has_seen_first_enrichment) return null
          const { data: lead } = await supabase
            .from('leads')
            .select('id, full_name, first_name, last_name, company_name, job_title, city, state, intent_score_calculated')
            .eq('workspace_id', workspaceId)
            .eq('enrichment_status', 'enriched')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          return lead ?? null
        }),
    ])

  const typedHotLeads = (hotLeads ?? []) as Array<{
    id: string; full_name: string | null; first_name: string | null; last_name: string | null
    email: string | null; phone: string | null; company_name: string | null
    intent_score_calculated: number | null; enrichment_status: string | null
    status: string | null; source: string | null
  }>

  const typedEnrichments = (recentEnrichments ?? []) as Array<{
    id: string; full_name: string | null; first_name: string | null; last_name: string | null
    company_name: string | null; updated_at: string | null; source: string | null
  }>

  const pipeline = pipelineStats ?? { new: 0, contacted: 0, qualified: 0, proposal: 0, negotiation: 0, won: 0, lost: 0 }
  const pipelineTotal = pipeline.contacted + pipeline.qualified + pipeline.proposal + pipeline.negotiation + pipeline.won
  const showPipeline = pipelineTotal > 0

  // Build activity log
  type ActivityEvent =
    | { type: 'delivery'; count: number; time: string }
    | { type: 'enrich'; leadName: string; company: string | null; time: string }
  const activityLog: ActivityEvent[] = []
  if (todayCount > 0) {
    activityLog.push({ type: 'delivery', count: todayCount, time: new Date().toISOString() })
  }
  for (const e of typedEnrichments) {
    const name = e.full_name || [e.first_name, e.last_name].filter(Boolean).join(' ') || 'Lead'
    activityLog.push({ type: 'enrich', leadName: name, company: e.company_name, time: e.updated_at ?? new Date().toISOString() })
  }
  activityLog.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  // Next step
  const step = !hasPreferences
    ? { label: 'Set targeting preferences', desc: 'Tell us your ideal customer so we can match leads.', href: '/my-leads/preferences', icon: <Target className="h-5 w-5 text-primary" />, color: 'border-primary/30 bg-primary/5' }
    : !hasEnriched
    ? { label: 'Enrich your first lead', desc: 'Reveal verified email, phone & LinkedIn — it\'s free.', href: '/leads', icon: <Sparkles className="h-5 w-5 text-blue-600" />, color: 'border-blue-200 bg-blue-50' }
    : !hasPixel
    ? { label: 'Install tracking pixel', desc: 'Identify anonymous website visitors in real-time.', href: '/settings/pixel', icon: <Eye className="h-5 w-5 text-primary" />, color: 'border-primary/30 bg-primary/5' }
    : !hasActivated
    ? { label: 'Activate outreach', desc: 'Build a lookalike audience or launch managed outbound.', href: '/activate', icon: <Rocket className="h-5 w-5 text-primary" />, color: 'border-primary/30 bg-primary/5' }
    : null

  return (
    <>
      {/* Hot leads */}
      {typedHotLeads.length > 0 && (
        <AnimatedSection delay={0.08}>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Top Leads to Act On
              </h2>
              <Link href="/leads?sort=intent" className="text-sm text-primary hover:underline flex items-center gap-1">
                All leads <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {typedHotLeads.slice(0, 3).map((lead) => {
                const name = sanitizeName(lead.full_name)
                  || sanitizeName([lead.first_name, lead.last_name].filter(Boolean).join(' '))
                  || sanitizeCompanyName(lead.company_name) || 'Unknown'
                const score = lead.intent_score_calculated
                const isHot = score !== null && score >= 70
                const isEnriched = lead.enrichment_status === 'enriched'
                const currentStatus = lead.status || 'new'
                const statusLabel = currentStatus === 'new' ? null : currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)
                return (
                  <div key={lead.id} className={`rounded-lg border p-3.5 flex flex-col gap-2.5 ${isHot ? 'border-orange-200 bg-orange-50/40' : 'border-blue-100 bg-blue-50/30'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                        {lead.company_name && <p className="text-xs text-gray-500 truncate">{sanitizeCompanyName(lead.company_name)}</p>}
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {score !== null && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${isHot ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {isHot ? 'HOT' : 'WARM'} {score}
                          </span>
                        )}
                        {statusLabel && (
                          <span className="text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-1.5 py-0.5">
                            {statusLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isEnriched && lead.email && (
                        <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[10px] bg-white border border-gray-200 text-gray-600 rounded-full px-2 py-0.5 hover:border-primary hover:text-primary transition-colors font-medium">
                          <Mail className="h-2.5 w-2.5" /> Email
                        </a>
                      )}
                      {isEnriched && lead.phone && (
                        <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[10px] bg-white border border-gray-200 text-gray-600 rounded-full px-2 py-0.5 hover:border-primary hover:text-primary transition-colors font-medium">
                          <Phone className="h-2.5 w-2.5" /> Call
                        </a>
                      )}
                      <Link href={`/crm/leads/${lead.id}`} className="inline-flex items-center gap-1 text-[10px] bg-white border border-gray-200 text-gray-600 rounded-full px-2 py-0.5 hover:border-primary hover:text-primary transition-colors font-medium ml-auto">
                        View <ArrowRight className="h-2.5 w-2.5" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Leads — 2/3 width */}
        <AnimatedSection delay={0.1} className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Star className="h-4 w-4 text-primary fill-primary" />
                Recent Leads
              </h2>
              <Link href="/leads" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {(recentLeads as any[]).filter(l => {
              const n = l.full_name || [l.first_name, l.last_name].filter(Boolean).join(' ')
              return n && n.trim().length > 1
            }).length > 0 ? (
              <div className="space-y-2">
                {(recentLeads as any[]).filter(l => {
                  const n = l.full_name || [l.first_name, l.last_name].filter(Boolean).join(' ')
                  return n && n.trim().length > 1
                }).map((lead) => {
                  const displayName = sanitizeName(lead.full_name)
                    || sanitizeName([lead.first_name, lead.last_name].filter(Boolean).join(' '))
                    || sanitizeCompanyName(lead.company_name) || 'Unknown'
                  const validEmail = lead.email?.includes('@') ? sanitizeText(lead.email) : null
                  const displaySub = sanitizeCompanyName(lead.company_name) || validEmail || sanitizeText(lead.phone) || ''
                  const intent = intentLabel(lead.intent_score_calculated)
                  const isEnriched = lead.enrichment_status === 'enriched'
                  return (
                    <Link key={lead.id} href={`/crm/leads/${lead.id}`} className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all group">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary transition-colors">{displayName}</p>
                        {displaySub && <p className="text-xs text-gray-500 truncate">{displaySub}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isEnriched && <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-1.5 py-0.5 font-medium">Enriched</span>}
                        {intent && <span className={`text-[10px] border rounded-full px-1.5 py-0.5 font-medium ${intent.color}`}>{intent.label}</span>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <Calendar className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-600">No leads yet today</p>
                <p className="text-xs text-gray-500 mt-1">Leads arrive every morning at 8am CT based on your targeting preferences.</p>
                {!hasPreferences && (
                  <Link href="/my-leads/preferences" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    Set preferences <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </AnimatedSection>

        {/* Right column */}
        <div className="space-y-4">

          {/* Pixel health */}
          <AnimatedSection delay={0.12}>
            <div className={`rounded-xl border p-3 ${hasVerifiedPixel ? 'border-green-200 bg-green-50' : hasPixel ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full shrink-0 ${hasVerifiedPixel ? 'bg-green-500' : hasPixel ? 'bg-amber-400' : 'bg-gray-300'}`} />
                <span className={`text-xs font-medium ${hasVerifiedPixel ? 'text-green-800' : hasPixel ? 'text-amber-800' : 'text-gray-600'}`}>
                  {hasVerifiedPixel ? 'Pixel Active' : hasPixel ? 'Pixel Installed — awaiting first event' : 'Pixel not installed'}
                </span>
                <Link href="/settings/pixel" className="ml-auto text-xs text-primary hover:underline shrink-0">
                  {hasPixel ? 'Manage' : 'Install'}
                </Link>
              </div>
              {hasPixel && (
                <div className="flex items-center gap-3 mt-1.5 pl-4 text-[11px] text-gray-500">
                  {pixelEventCount > 0 && <span>{pixelEventCount.toLocaleString()} events</span>}
                  {visitorCountTotal ? <span>{visitorCountTotal.toLocaleString()} visitors identified</span> : null}
                  {isOnTrial && trialEndsAtStr && (
                    <span className="text-amber-600 font-medium">
                      Trial: {Math.max(0, Math.ceil((new Date(trialEndsAtStr).getTime() - Date.now()) / 86400000))}d left
                    </span>
                  )}
                </div>
              )}
            </div>
          </AnimatedSection>

          {/* Next step */}
          <AnimatedSection delay={0.15}>
            {step ? (
              <Link href={step.href} className={`block rounded-xl border p-5 transition-all hover:shadow-sm ${step.color}`}>
                <div className="flex items-center gap-3 mb-2">
                  {step.icon}
                  <p className="text-sm font-semibold text-gray-900">Next Step</p>
                </div>
                <p className="text-sm font-medium text-gray-800">{step.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Get started <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ) : (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">You&apos;re all set!</p>
                    <p className="text-xs text-blue-700">Check your leads for fresh matches every morning at 8am CT.</p>
                  </div>
                </div>
              </div>
            )}
          </AnimatedSection>

          {/* Setup checklist */}
          {showChecklist && (
            <AnimatedSection delay={0.2}>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm">Setup Checklist</h3>
                  <span className="text-xs text-gray-500">{checklistProgress}/{checklistTotal}</span>
                </div>
                <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-primary rounded-full transition-all" style={{ width: `${(checklistProgress / checklistTotal) * 100}%` }} />
                </div>
                <div className="space-y-3">
                  {checklistItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5">
                      {item.done
                        ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        : <Circle className="h-4 w-4 text-gray-400 shrink-0" />}
                      {item.href && !item.done
                        ? <Link href={item.href} className="text-sm text-gray-700 hover:text-primary transition-colors">{item.label}</Link>
                        : <span className={`text-sm ${item.done ? 'text-gray-500 line-through' : 'text-gray-700'}`}>{item.label}</span>}
                      {!item.done && item.href && <ArrowRight className="h-3 w-3 text-gray-400 ml-auto" />}
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* Quick actions */}
          <AnimatedSection delay={0.22}>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/leads" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                  <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Star className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">Daily Leads</p>
                    <p className="text-xs text-gray-500">{todayCount} new today</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-primary transition-colors" />
                </Link>
                <Link href="/website-visitors" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                  <div className="p-1.5 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                    <Eye className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">Website Visitors</p>
                    <p className="text-xs text-gray-500">
                      {visitorCountTotal ? `${visitorCountTotal} identified` : hasPixel ? 'Pixel active' : 'Setup pixel'}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-primary transition-colors" />
                </Link>
                <Link href="/activate" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-blue-50 transition-colors group border border-blue-100">
                  <div className="p-1.5 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                    <Rocket className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-700">Activate</p>
                    <p className="text-xs text-blue-500">Audiences + campaigns</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-blue-300 group-hover:text-blue-600 transition-colors" />
                </Link>
              </div>
            </div>
          </AnimatedSection>

          {/* Recent activity */}
          {activityLog.length > 0 && (
            <AnimatedSection delay={0.24}>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-gray-500" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {activityLog.slice(0, 6).map((event, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="mt-0.5 h-5 w-5 shrink-0 flex items-center justify-center">
                        {event.type === 'delivery'
                          ? <div className="h-2 w-2 rounded-full bg-primary" />
                          : <div className="h-2 w-2 rounded-full bg-blue-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        {event.type === 'delivery' ? (
                          <p className="text-xs text-gray-700"><span className="font-medium">{event.count} leads</span> delivered today</p>
                        ) : (
                          <p className="text-xs text-gray-700 truncate">
                            <span className="font-medium">{event.leadName}</span>
                            {event.company && <span className="text-gray-500"> · {event.company}</span>}
                            <span className="text-blue-600 ml-1">enriched</span>
                          </p>
                        )}
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {formatDistanceToNow(new Date(event.time), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* Pipeline funnel */}
          {showPipeline && (
            <AnimatedSection delay={0.26}>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-gray-500" />
                    Pipeline
                  </h3>
                  <Link href="/crm/leads" className="text-xs text-primary hover:underline">View CRM</Link>
                </div>
                <div className="space-y-2">
                  {([
                    { key: 'contacted', label: 'Contacted', color: 'bg-blue-500',    textColor: 'text-blue-700'    },
                    { key: 'qualified', label: 'Qualified', color: 'bg-indigo-500',  textColor: 'text-indigo-700'  },
                    { key: 'proposal',  label: 'Proposal',  color: 'bg-amber-500',   textColor: 'text-amber-700'   },
                    { key: 'won',       label: 'Won',       color: 'bg-emerald-500', textColor: 'text-emerald-700' },
                  ] as const).map(({ key, label, color, textColor }) => {
                    const count = pipeline[key] ?? 0
                    const pct = Math.round((count / Math.max(pipeline.contacted, 1)) * 100)
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-16 shrink-0">{label}</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`text-xs font-semibold ${count > 0 ? textColor : 'text-gray-400'} w-6 text-right`}>{count}</span>
                      </div>
                    )
                  })}
                </div>
                {pipeline.won > 0 && (
                  <p className="mt-3 text-[11px] text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1.5 font-medium">
                    {pipeline.won} lead{pipeline.won !== 1 ? 's' : ''} won — keep going!
                  </p>
                )}
              </div>
            </AnimatedSection>
          )}

          {/* Upgrade CTA */}
          {isFree && (
            <AnimatedSection delay={0.25}>
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-primary/5 border border-primary/20 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-gray-900">Free Plan</span>
                </div>
                <div className="text-xs text-gray-500 mb-3 space-y-1">
                  <p className="flex justify-between"><span>Daily leads</span><span className="font-medium text-gray-700">{dailyLimit}/day</span></p>
                  <p className="flex justify-between"><span>Enrichment credits</span><span className="font-medium text-gray-700">{creditLimit}/day</span></p>
                  <p className="flex justify-between"><span>Credits reset</span><span className="font-medium text-gray-700">8am CT</span></p>
                  <div className="border-t border-gray-200 pt-1 mt-1">
                    <p className="flex justify-between text-primary"><span>Pro plan</span><span className="font-semibold">100 leads + 1,000 credits</span></p>
                  </div>
                </div>
                <Link href="/settings/billing" className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
                  <Sparkles className="h-3.5 w-3.5" />
                  Upgrade to Pro
                </Link>
              </div>
            </AnimatedSection>
          )}
        </div>
      </div>

      <WhatsNewModal />
      {firstEnrichmentResult && <FirstEnrichmentModal lead={firstEnrichmentResult} workspaceId={workspaceId} />}
    </>
  )
}

// ─── Skeleton shown while DashboardMainGrid streams in ────────────────────────

function DashboardMainGridSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hot leads skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="h-5 w-44 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 h-24" />)}
        </div>
      </div>
      {/* Main grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className="h-8 w-8 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-36 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {[64, 80, 96].map(h => (
            <div key={h} className="rounded-xl border border-gray-200 bg-gray-50" style={{ height: h }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main page — fast phase only ──────────────────────────────────────────────

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string; targeting_failed?: string }>
}) {
  const { onboarding, targeting_failed } = await searchParams
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/login')
  const user = session.user

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, auth_user_id, workspace_id, email, full_name, plan, role, daily_lead_limit, industry_segment, location_segment, workspaces(id, name, industry_vertical, created_at)')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  const userProfile = userData as {
    id: string; auth_user_id: string; workspace_id: string; email: string
    full_name: string | null; plan: string | null; role: string
    daily_lead_limit: number | null; industry_segment: string | null; location_segment: string | null
    workspaces: { id: string; name: string; industry_vertical: string | null; created_at: string } | null
  } | null

  if (userError || !userProfile?.workspace_id) redirect('/welcome')

  const workspaceId = userProfile.workspace_id

  // ── Fast phase: data needed for above-the-fold content ──
  const [
    statsData,
    pixelResult,
    userTargetingResult,
    creditsData,
    activationResult,
  ] = await Promise.all([
    // Stats: 2 s outer timeout (inner refresh still runs up to 4 s, but we don't wait)
    Promise.race([
      getCachedWorkspaceStats(workspaceId),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 2000)),
    ]).catch(() => null),
    supabase
      .from('audiencelab_pixels')
      .select('pixel_id, trial_status, trial_ends_at, visitor_count_total')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('user_targeting')
      .select('is_active, target_industries, target_states')
      .eq('user_id', userProfile.id)
      .eq('workspace_id', workspaceId)
      .maybeSingle(),
    // Credits: 1.5 s timeout (shows 0 on timeout — non-critical)
    Promise.race([
      CreditService.getRemainingCredits(userProfile.id),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 1500)),
    ]).catch(() => null),
    supabase
      .from('custom_audience_requests')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId),
  ])

  // Derived state for above-fold rendering
  const todayCount      = statsData?.today_leads      ?? 0
  const weekCount       = statsData?.week_leads       ?? 0
  const totalCount      = statsData?.total_leads      ?? 0
  const yesterdayCount  = statsData?.yesterday_leads  ?? 0
  const prevWeekCount   = statsData?.prev_week_leads  ?? 0
  const enrichedCount   = statsData?.enriched_leads   ?? 0
  const pixelEventCount = statsData?.pixel_event_count ?? 0
  const intelligenceTierCount = statsData?.intelligence_leads ?? 0

  const pixel           = pixelResult.data
  const hasPixel        = !!pixel
  const targeting       = userTargetingResult.data
  const hasPreferences  = !!(targeting?.target_industries?.length || targeting?.target_states?.length)
  const hasEnriched     = enrichedCount > 0
  const hasIntelligence = hasEnriched || intelligenceTierCount > 0
  const hasActivated    = (activationResult.count ?? 0) > 0
  const hasVerifiedPixel = hasPixel && pixelEventCount > 0
  const isOnTrial       = pixel?.trial_status === 'trial'
  const trialEndsAtStr  = pixel?.trial_ends_at ?? null
  const visitorCountTotal = pixel?.visitor_count_total ?? null

  const creditsRemaining = creditsData?.remaining ?? 0
  const creditLimit      = creditsData?.limit ?? 3
  const isFree           = !userProfile.plan || userProfile.plan === 'free'
  const dailyLimit       = userProfile.daily_lead_limit ?? 10

  const outboundUpgradeTiers = ['outbound', 'pipeline', 'venture_studio']
  const showOutboundUpsell   = pixelEventCount >= 10 && !outboundUpgradeTiers.includes(userProfile.plan ?? '')

  const workspaceCreatedAt = userProfile.workspaces?.created_at
  const workspaceAgeHours  = workspaceCreatedAt
    ? (Date.now() - new Date(workspaceCreatedAt).getTime()) / 3_600_000
    : 9999

  const checklistItems: ChecklistItem[] = [
    { id: 'account',          label: 'Create your account',             done: true,              href: null },
    { id: 'pixel',            label: 'Install tracking pixel',          done: hasPixel,          href: '/settings/pixel' },
    { id: 'pixel_verified',   label: 'Verify your pixel is working',    done: hasVerifiedPixel,  href: '/settings/pixel' },
    { id: 'prefs',            label: 'Set lead preferences',            done: hasPreferences,    href: '/my-leads/preferences' },
    { id: 'enrich',           label: 'Enrich your first lead',          done: hasEnriched,       href: '/leads' },
    { id: 'activate',         label: 'Activate — run a campaign',       done: hasActivated,      href: '/activate' },
    { id: 'intelligence',     label: 'Try Intelligence Pack on a lead', done: hasIntelligence,   href: '/leads' },
  ]
  const checklistProgress = checklistItems.filter(i => i.done).length
  const checklistTotal    = checklistItems.length
  const showChecklist     = checklistProgress < checklistTotal

  // Helper to create redirect with cookies preserved
  const redirectWithCookies = (url: URL) => {
    // (used only via redirect() in this component — kept for type completeness)
    return url
  }
  void redirectWithCookies // suppress unused warning

  return (
    <div className="space-y-6 p-6">
      <DashboardAnimationWrapper>

        {/* Header */}
        <AnimatedSection delay={0}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {userProfile.full_name?.split(' ')[0] || 'there'}!
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {userProfile.workspaces?.name && (
                  <span className="font-medium text-gray-700">{userProfile.workspaces.name} · </span>
                )}
                Here&apos;s your lead pipeline. New leads arrive every morning at 8am CT.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/leads"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                <Star className="h-4 w-4 fill-white" />
                Today&apos;s Leads
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* Onboarding checklist widget */}
        {showChecklist && (
          <AnimatedSection delay={0.03}>
            <OnboardingChecklist />
          </AnimatedSection>
        )}

        {/* New-user provisioning widget */}
        {workspaceAgeHours < 72 && (
          <AnimatedSection delay={0.04}>
            <ProvisioningWidget
              steps={[
                { id: 'account', label: 'Account created', done: true },
                { id: 'pixel',   label: 'Pixel installed',  done: hasPixel,    sublabel: hasPixel ? undefined : 'Add the tracking script to your site', href: '/settings/pixel' },
                { id: 'leads',   label: 'First leads identified', done: totalCount > 0, sublabel: totalCount > 0 ? undefined : 'Waiting for your first leads to arrive…', href: '/leads' },
                { id: 'team',    label: 'Share with your team',   done: false,           sublabel: 'Invite teammates to view and action leads', href: '/settings/team' },
              ]}
            />
          </AnimatedSection>
        )}

        {/* Onboarding complete banner */}
        {onboarding === 'complete' && (
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Setup complete!</p>
              <p className="text-sm text-blue-700">
                {totalCount > 0
                  ? `Your first ${totalCount} leads are ready — check them out below!`
                  : 'We\'re setting up your lead pipeline now. Your first leads will arrive shortly — check back in a few minutes or by 8am CT tomorrow.'}
              </p>
            </div>
          </div>
        )}

        {/* Targeting failed during onboarding — immediate corrective action */}
        {targeting_failed === 'true' && !hasPreferences && (
          <TargetingMissingBanner />
        )}

        {/* Zero leads — targeting missing warning (takes priority over pending banner) */}
        {totalCount === 0 && onboarding !== 'complete' && !hasPreferences && workspaceAgeHours >= 48 && (
          <TargetingMissingBanner />
        )}

        {/* Zero leads — new workspace pending banner (< 48h, or missing prefs on fresh account) */}
        {totalCount === 0 && onboarding !== 'complete' && (hasPreferences || workspaceAgeHours < 48) && (
          <>
            {!hasPreferences && workspaceAgeHours < 48 && (
              <TargetingMissingBanner />
            )}
            <PendingLeadsBanner
              workspaceAgeHours={workspaceAgeHours}
              hasPreferences={hasPreferences}
              hasPixel={hasPixel}
              dailyLimit={dailyLimit}
            />
          </>
        )}

        {/* Single priority banner */}
        {(() => {
          if (isOnTrial && trialEndsAtStr) return (
            <AnimatedSection delay={0.03}>
              <TrialCountdown trialEndsAt={trialEndsAtStr} visitorCountTotal={visitorCountTotal} />
            </AnimatedSection>
          )
          if (creditsRemaining <= 3) return (
            <AnimatedSection delay={0.03}>
              <div className="rounded-xl p-4 flex items-center justify-between gap-4 bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-3">
                  {isFree ? <Rocket className="h-5 w-5 text-blue-600 shrink-0" /> : <Zap className="h-5 w-5 text-blue-600 shrink-0" />}
                  <div>
                    {isFree ? (
                      <>
                        <p className="font-semibold text-blue-900 text-sm">
                          {creditsRemaining === 0 ? 'You\'ve used all your free credits today' : `Only ${creditsRemaining} free credit${creditsRemaining === 1 ? '' : 's'} left`}
                        </p>
                        <p className="text-xs text-blue-700">Upgrade to Pro for 1,000 daily credits, priority enrichment, and full CRM access.</p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-blue-900 text-sm">
                          {creditsRemaining === 0 ? 'You\'re out of enrichment credits' : `Only ${creditsRemaining} credit${creditsRemaining === 1 ? '' : 's'} remaining`}
                        </p>
                        <p className="text-xs text-blue-700">Each lead enrichment costs 1 credit — credits reset daily.</p>
                      </>
                    )}
                  </div>
                </div>
                <Link href="/settings/billing" className="shrink-0 text-sm font-semibold text-white rounded-lg px-3 py-1.5 transition-colors bg-primary hover:bg-primary/90">
                  {isFree ? 'Upgrade to Pro' : 'Buy Credits'}
                </Link>
              </div>
            </AnimatedSection>
          )
          if (showOutboundUpsell) return (
            <AnimatedSection delay={0.03}>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-blue-100 shrink-0 mt-0.5"><Rocket className="h-4 w-4 text-blue-700" /></div>
                  <div>
                    <p className="font-semibold text-blue-900 text-sm">Your pixel has identified {pixelEventCount.toLocaleString()} visitors</p>
                    <p className="text-xs text-blue-700 mt-0.5">Let Cursive Outbound email and follow up with every identified visitor — fully done-for-you.</p>
                  </div>
                </div>
                <a href="mailto:darren@meetcursive.com?subject=Cursive Outbound interest" className="inline-flex items-center gap-1.5 shrink-0 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition-colors whitespace-nowrap">
                  <ArrowRight className="h-3 w-3" />Talk to Darren
                </a>
              </div>
            </AnimatedSection>
          )
          if (totalCount > 0 && onboarding !== 'complete') return (
            <AnimatedSection delay={0.03}>
              <FirstLeadsBanner count={totalCount} workspaceAgeHours={workspaceAgeHours} />
            </AnimatedSection>
          )
          return null
        })()}

        {/* 4 stat cards — above the fold, rendered from fast-phase data */}
        <AnimatedSection delay={0.05}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Today's leads */}
            <Link href="/leads" className="group">
              <div className="bg-white rounded-xl border border-primary/30 bg-primary/5 p-5 hover:border-primary/50 transition-all h-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-primary/15"><Calendar className="h-4 w-4 text-primary" /></div>
                  <span className="text-sm text-gray-500">Today&apos;s Leads</span>
                </div>
                <div className="text-3xl font-bold text-primary">{todayCount}</div>
                <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((todayCount / Math.max(dailyLimit, 1)) * 100, 100)}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{todayCount} of {dailyLimit} delivered</p>
                {(() => {
                  const trend = trendBadge(todayCount, yesterdayCount)
                  if (!trend) return <p className="text-xs text-gray-400 mt-1">vs. yesterday</p>
                  return <p className={`text-xs mt-1 font-medium ${trend.up ? 'text-emerald-600' : 'text-red-500'}`}>{trend.up ? '↑' : '↓'} {trend.pct}% vs. yesterday</p>
                })()}
              </div>
            </Link>

            {/* This week */}
            <Link href="/leads" className="group">
              <div className="bg-white rounded-xl border border-gray-200 p-5 h-full hover:border-gray-300 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-gray-100"><TrendingUp className="h-4 w-4 text-gray-600" /></div>
                  <span className="text-sm text-gray-500">This Week</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{weekCount}</div>
                {(() => {
                  const trend = trendBadge(weekCount, prevWeekCount)
                  if (!trend) return <p className="text-xs text-gray-500 mt-1">{(weekCount / 7).toFixed(1)} avg/day</p>
                  return <p className={`text-xs mt-1 font-medium ${trend.up ? 'text-emerald-600' : 'text-red-500'}`}>{trend.up ? '↑' : '↓'} {trend.pct}% vs. last week</p>
                })()}
              </div>
            </Link>

            {/* Credits */}
            <Link href="/settings/billing" className="group">
              <div className={`bg-white rounded-xl border p-5 h-full transition-all ${creditsRemaining <= 3 ? 'border-blue-200 bg-blue-50/40' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${creditsRemaining <= 3 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Zap className={`h-4 w-4 ${creditsRemaining <= 3 ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <span className="text-sm text-gray-500" title="2 credits per Intel Pack · 10 credits per Deep Research">Enrichment Credits</span>
                </div>
                <div className={`text-3xl font-bold ${creditsRemaining <= 3 ? 'text-blue-600' : 'text-gray-900'}`}>{creditsRemaining}</div>
                <p className="text-xs text-gray-500 mt-1">of {creditLimit}/day ({isFree ? 'Free' : 'Pro'}) · resets daily</p>
              </div>
            </Link>

            {/* Total leads */}
            <Link href="/crm/leads" className="group">
              <div className="bg-white rounded-xl border border-gray-200 p-5 h-full hover:border-gray-300 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-gray-100"><Users className="h-4 w-4 text-gray-600" /></div>
                  <span className="text-sm text-gray-500">Total Leads</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{totalCount}</div>
                <p className="text-xs text-gray-500 mt-1">{enrichedCount} enriched</p>
                {(() => {
                  const trend = trendBadge(weekCount, prevWeekCount)
                  if (!trend) return null
                  return <p className={`text-xs mt-0.5 font-medium ${trend.up ? 'text-emerald-600' : 'text-red-500'}`}>{trend.up ? '↑' : '↓'} {trend.pct}% weekly growth</p>
                })()}
              </div>
            </Link>
          </div>
        </AnimatedSection>

        {/* ── Streamed section: hot leads + main content grid ── */}
        <Suspense fallback={<DashboardMainGridSkeleton />}>
          <DashboardMainGrid
            workspaceId={workspaceId}
            hasPreferences={hasPreferences}
            hasEnriched={hasEnriched}
            hasPixel={hasPixel}
            hasVerifiedPixel={hasVerifiedPixel}
            hasActivated={hasActivated}
            isOnTrial={isOnTrial}
            trialEndsAtStr={trialEndsAtStr}
            pixelEventCount={pixelEventCount}
            visitorCountTotal={visitorCountTotal}
            todayCount={todayCount}
            isFree={isFree}
            showChecklist={showChecklist}
            checklistItems={checklistItems}
            checklistProgress={checklistProgress}
            checklistTotal={checklistTotal}
            creditLimit={creditLimit}
            dailyLimit={dailyLimit}
          />
        </Suspense>

      </DashboardAnimationWrapper>
    </div>
  )
}
