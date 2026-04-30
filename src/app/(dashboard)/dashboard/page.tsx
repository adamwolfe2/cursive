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
  ArrowRight,
  Star, Target, CheckCircle2, Circle,
  Eye, Rocket, Activity, Calendar,
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
import { FreePlanBanner } from '@/components/dashboard/FreePlanBanner'
import { LiveLeadsFeed } from '@/components/leads/live-leads-feed'
import { MarketplaceSetupBanner } from '@/components/marketplace/MarketplaceSetupBanner'
import { UnsupportedIndustryBanner } from '@/components/dashboard/UnsupportedIndustryBanner'
import { isSupportedIndustry } from '@/lib/utils/waitlist-validation'

export const metadata: Metadata = {
  title: 'Dashboard | Cursive',
}

// ─── Module-scope helpers ──────────────────────────────────────────────────────

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
  // Same workspace-leads tag as the other lead-derived caches so
  // populate-initial's revalidateTag purges the stats too. Otherwise the
  // dashboard's "Total leads" stat could lag the actual lead count by up
  // to 120s after the wizard completes.
  { revalidate: 120, tags: ['workspace-leads'] },
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
  // Tags let revalidateTag('workspace-leads') from populate-initial purge
  // this cache immediately when new leads arrive — without it, a brand new
  // user could land on the dashboard right after the wizard and see stale
  // empty state for up to 120s.
  { revalidate: 120, tags: ['workspace-leads'] },
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
  { revalidate: 120, tags: ['workspace-leads'] },
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
  { revalidate: 300, tags: ['workspace-leads'] },
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
  { revalidate: 120, tags: ['workspace-leads'] },
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
    ? { label: 'Set targeting preferences', desc: 'Tell us your ideal customer so we can match leads.', href: '/my-leads/preferences' }
    : !hasEnriched
    ? { label: 'Enrich your first lead', desc: 'Reveal verified email, phone & LinkedIn — it\'s free.', href: '/leads' }
    : !hasPixel
    ? { label: 'Install tracking pixel', desc: 'Identify anonymous website visitors in real-time.', href: '/settings/pixel' }
    : !hasActivated
    ? { label: 'Activate outreach', desc: 'Build a lookalike audience or launch managed outbound.', href: '/activate' }
    : null

  return (
    <div className="space-y-8">
      {/* Marketplace install setup banner — only shown when a GHL or Shopify
          install needs the pixel embed completed. Dismissible per session. */}
      <MarketplaceSetupBanner />

      {/* Hot leads — the aha-moment surface. When pixel is active these are
          typically the highest-intent visitors the pixel just identified.
          Each card surfaces Draft Email as the primary action because this is
          the point in the flow where outreach actually makes sense (enriched,
          verified, ICP-matched leads only — never raw visitors). */}
      {typedHotLeads.length > 0 && (
        <AnimatedSection delay={0.08}>
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-foreground">
                  {hasVerifiedPixel ? 'Hot Leads from Your Website' : 'Top Leads to Act On'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasVerifiedPixel
                    ? 'Enriched & verified visitors matching your ICP — ready for personalized outreach.'
                    : 'Your highest-intent prospects right now.'}
                </p>
              </div>
              <Link href="/leads?sort=intent" className="text-sm text-primary hover:underline flex items-center gap-1 shrink-0">
                All leads <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {typedHotLeads.slice(0, 3).map((lead) => {
                const name = sanitizeName(lead.full_name)
                  || sanitizeName([lead.first_name, lead.last_name].filter(Boolean).join(' '))
                  || sanitizeCompanyName(lead.company_name) || 'Unknown'
                const score = lead.intent_score_calculated
                const isEnriched = lead.enrichment_status === 'enriched'
                return (
                  <Link
                    key={lead.id}
                    href={`/crm/leads/${lead.id}`}
                    className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2.5 hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{name}</p>
                        {lead.company_name && <p className="text-xs text-muted-foreground truncate">{sanitizeCompanyName(lead.company_name)}</p>}
                      </div>
                      {score !== null && (
                        <span className="text-xs font-medium text-muted-foreground shrink-0">{score}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-auto pt-1">
                      {isEnriched ? (
                        <span className="text-xs font-medium text-primary group-hover:underline">
                          Draft email →
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Enrich to unlock</span>
                      )}
                    </div>
                  </Link>
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
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground">
                Recent Leads
              </h2>
              <Link href="/leads" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {((recentLeads ?? []) as Array<{
              id: string; full_name: string | null; first_name: string | null; last_name: string | null
              email: string | null; phone: string | null; company_name: string | null
              status: string | null; created_at: string; delivered_at: string | null
              intent_score_calculated: number | null; enrichment_status: string | null; source: string | null
            }>).filter(l => {
              const n = l.full_name || [l.first_name, l.last_name].filter(Boolean).join(' ')
              return n && n.trim().length > 1
            }).length > 0 ? (
              <div className="divide-y divide-border">
                {((recentLeads ?? []) as Array<{
                  id: string; full_name: string | null; first_name: string | null; last_name: string | null
                  email: string | null; phone: string | null; company_name: string | null
                  status: string | null; created_at: string; delivered_at: string | null
                  intent_score_calculated: number | null; enrichment_status: string | null; source: string | null
                }>).filter(l => {
                  const n = l.full_name || [l.first_name, l.last_name].filter(Boolean).join(' ')
                  return n && n.trim().length > 1
                }).map((lead) => {
                  const displayName = sanitizeName(lead.full_name)
                    || sanitizeName([lead.first_name, lead.last_name].filter(Boolean).join(' '))
                    || sanitizeCompanyName(lead.company_name) || 'Unknown'
                  const validEmail = lead.email?.includes('@') ? sanitizeText(lead.email) : null
                  const displaySub = sanitizeCompanyName(lead.company_name) || validEmail || sanitizeText(lead.phone) || ''
                  return (
                    <Link key={lead.id} href={`/crm/leads/${lead.id}`} className="flex items-center gap-3 py-3 hover:bg-muted transition-colors group px-1">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{displayName}</span>
                        {displaySub && <span className="text-sm text-muted-foreground ml-2">{displaySub}</span>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-sm font-medium text-muted-foreground">
                  {hasPreferences ? 'No leads yet — your audience is being built' : 'Tell us who you sell to'}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {hasPreferences
                    ? 'Your first leads should arrive within a few minutes. We\'re also pulling fresh ones every morning at 8am CT.'
                    : 'Complete setup to unlock your first batch of enriched leads matching your ICP.'}
                </p>
                {!hasPreferences && (
                  <Link href="/setup" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    Complete setup <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </AnimatedSection>

        {/* Right column */}
        <div className="space-y-6">

          {/* Pixel health */}
          <AnimatedSection delay={0.12}>
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full shrink-0 ${hasVerifiedPixel ? 'bg-foreground' : hasPixel ? 'bg-muted-foreground' : 'bg-border'}`} />
                <span className="text-xs font-medium text-muted-foreground">
                  {hasVerifiedPixel ? 'Pixel Active' : hasPixel ? 'Pixel Installed — awaiting first event' : 'Pixel not installed'}
                </span>
                <Link href="/settings/pixel" className="ml-auto text-xs text-primary hover:underline shrink-0">
                  {hasPixel ? 'Manage' : 'Install'}
                </Link>
              </div>
              {hasPixel && (
                <div className="flex items-center gap-3 mt-1.5 pl-4 text-[11px] text-muted-foreground">
                  {pixelEventCount > 0 && <span>{pixelEventCount.toLocaleString()} events</span>}
                  {visitorCountTotal ? <span>{visitorCountTotal.toLocaleString()} visitors identified</span> : null}
                  {isOnTrial && trialEndsAtStr && (() => {
                    const trialDays = Math.ceil((new Date(trialEndsAtStr).getTime() - Date.now()) / 86400000)
                    return (
                      <span className="text-muted-foreground font-medium">
                        {trialDays < 0 ? 'Trial expired' : `Trial: ${trialDays}d left`}
                      </span>
                    )
                  })()}
                </div>
              )}
            </div>
          </AnimatedSection>

          {/* Next step */}
          <AnimatedSection delay={0.15}>
            {step ? (
              <Link href={step.href} className="block rounded-xl border border-border bg-card p-5 transition-all hover:shadow-sm">
                <p className="text-xs text-muted-foreground mb-1">Next Step</p>
                <p className="text-sm font-medium text-foreground">{step.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Get started <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ) : (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">You&apos;re all set!</p>
                    <p className="text-xs text-muted-foreground">Check your leads for fresh matches every morning at 8am CT.</p>
                  </div>
                </div>
              </div>
            )}
          </AnimatedSection>

          {/* Setup checklist */}
          {showChecklist && (
            <AnimatedSection delay={0.2}>
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-foreground text-sm">Setup Checklist</h3>
                  <span className="text-xs text-muted-foreground">{checklistProgress}/{checklistTotal}</span>
                </div>
                <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-primary rounded-full transition-all" style={{ width: `${(checklistProgress / checklistTotal) * 100}%` }} />
                </div>
                <div className="space-y-3">
                  {checklistItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5">
                      {item.done
                        ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                      {item.href && !item.done
                        ? <Link href={item.href} className="text-sm text-foreground hover:text-primary transition-colors">{item.label}</Link>
                        : <span className={`text-sm ${item.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{item.label}</span>}
                      {!item.done && item.href && <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto" />}
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          )}

          {/* Quick actions */}
          <AnimatedSection delay={0.22}>
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground text-sm mb-3">Quick Actions</h3>
              <div className="space-y-1">
                <Link href="/leads" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors group">
                  <Star className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Daily Leads</p>
                    <p className="text-xs text-muted-foreground">{todayCount} new today</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-muted-foreground transition-colors" />
                </Link>
                <Link href="/website-visitors" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors group">
                  <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Website Visitors</p>
                    <p className="text-xs text-muted-foreground">
                      {visitorCountTotal ? `${visitorCountTotal} identified` : hasPixel ? 'Pixel active' : 'Setup pixel'}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-muted-foreground transition-colors" />
                </Link>
                <Link href="/activate" className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors group">
                  <Rocket className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Activate</p>
                    <p className="text-xs text-muted-foreground">Audiences + campaigns</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-muted-foreground transition-colors" />
                </Link>
              </div>
            </div>
          </AnimatedSection>

          {/* Recent activity */}
          {activityLog.length > 0 && (
            <AnimatedSection delay={0.24}>
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {activityLog.slice(0, 6).map((event, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="mt-0.5 h-5 w-5 shrink-0 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-border" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {event.type === 'delivery' ? (
                          <p className="text-xs text-foreground"><span className="font-medium">{event.count} leads</span> delivered today</p>
                        ) : (
                          <p className="text-xs text-foreground truncate">
                            <span className="font-medium">{event.leadName}</span>
                            {event.company && <span className="text-muted-foreground"> · {event.company}</span>}
                            <span className="text-muted-foreground ml-1">enriched</span>
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-0.5">
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
              <div className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-muted-foreground" />
                    Pipeline
                  </h3>
                  <Link href="/crm/leads" className="text-xs text-primary hover:underline">View CRM</Link>
                </div>
                <div className="space-y-2">
                  {([
                    { key: 'contacted', label: 'Contacted' },
                    { key: 'qualified', label: 'Qualified' },
                    { key: 'proposal',  label: 'Proposal'  },
                    { key: 'won',       label: 'Won'       },
                  ] as const).map(({ key, label }) => {
                    const count = pipeline[key] ?? 0
                    const pct = Math.round((count / Math.max(pipeline.contacted, 1)) * 100)
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-border rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`text-xs font-semibold ${count > 0 ? 'text-foreground' : 'text-muted-foreground'} w-6 text-right`}>{count}</span>
                      </div>
                    )
                  })}
                </div>
                {pipeline.won > 0 && (
                  <p className="mt-3 text-[11px] text-muted-foreground bg-muted rounded-lg px-2.5 py-1.5 font-medium">
                    {pipeline.won} lead{pipeline.won !== 1 ? 's' : ''} won
                  </p>
                )}
              </div>
            </AnimatedSection>
          )}

          {/* Upgrade CTA */}
          {isFree && (
            <FreePlanBanner dailyLimit={dailyLimit} creditLimit={creditLimit} />
          )}
        </div>
      </div>

      <WhatsNewModal />
      {firstEnrichmentResult && <FirstEnrichmentModal lead={firstEnrichmentResult} workspaceId={workspaceId} />}
    </div>
  )
}

// ─── Skeleton shown while DashboardMainGrid streams in ────────────────────────

function DashboardMainGridSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hot leads skeleton */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="h-5 w-44 bg-muted rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="rounded-lg border border-border bg-muted h-24" />)}
        </div>
      </div>
      {/* Main grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <div className="h-5 w-32 bg-muted rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-36 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {[64, 80, 96].map(h => (
            <div key={h} className="rounded-xl border border-border bg-muted" style={{ height: h }} />
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

  // SECURITY: Use getUser() for server-side JWT verification.
  // getSession() trusts client cookies and can fail to refresh expired tokens in SSR,
  // causing spurious redirects to /login.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
  const thisMonthStart = new Date()
  thisMonthStart.setUTCDate(1)
  thisMonthStart.setUTCHours(0, 0, 0, 0)
  const thisMonthStartIso = thisMonthStart.toISOString()

  const [
    statsData,
    pixelResult,
    userTargetingResult,
    creditsData,
    activationResult,
    meetingsThisMonthResult,
    meetingsAllTimeResult,
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
    // Meetings booked this calendar month
    supabase
      .from('cal_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', thisMonthStartIso),
    // Meetings booked all time
    supabase
      .from('cal_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId),
  ])

  // Derived state for above-fold rendering
  const todayCount      = statsData?.today_leads      ?? 0
  const totalCount      = statsData?.total_leads      ?? 0
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

  const meetingsThisMonth = meetingsThisMonthResult.count ?? 0
  const meetingsAllTime   = meetingsAllTimeResult.count ?? 0
  const dailyLimit       = userProfile.daily_lead_limit ?? 10

  const outboundUpgradeTiers = ['outbound', 'pipeline', 'venture_studio']
  const showOutboundUpsell   = pixelEventCount >= 10 && !outboundUpgradeTiers.includes(userProfile.plan ?? '')

  const workspaceCreatedAt = userProfile.workspaces?.created_at
  const workspaceAgeHours  = workspaceCreatedAt
    ? (Date.now() - new Date(workspaceCreatedAt).getTime()) / 3_600_000
    : 9999

  // Detect users whose industry_segment does not have a matching audience_lab_segments row.
  // These users will receive 0 leads from the daily cron and populate-initial until fixed.
  // A "broken targeting" user has:
  //   - an industry that is not in our supported list (e.g. 'other', 'saas', 'insurance'), AND
  //   - OR target_industries is ['Other'] / contains only unsupported values
  const rawIndustry = userProfile.industry_segment ?? ''
  const hasUnsupportedIndustry =
    totalCount === 0 &&
    rawIndustry !== '' &&
    !isSupportedIndustry(rawIndustry)

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

  return (
    <div className="space-y-8 p-6">
      <DashboardAnimationWrapper>

        {/* Header — pixel-aware. When pixel is installed we lead with the
            live-visitor story; otherwise we nudge toward installing the pixel. */}
        <AnimatedSection delay={0}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {userProfile.full_name?.split(' ')[0] || 'there'}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {userProfile.workspaces?.name && (
                  <span className="font-medium text-foreground">{userProfile.workspaces.name} · </span>
                )}
                {hasVerifiedPixel
                  ? `Your pixel is live${pixel?.trial_status === 'trial' ? ' (trial)' : ''}. Here's who visited your site recently.`
                  : hasPixel
                    ? 'Your pixel is installed — waiting for the first visitor. Leads will appear here automatically.'
                    : 'Install your pixel to start identifying anonymous website visitors in real time.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!hasPixel ? (
                <Link
                  href="/setup"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                >
                  <Rocket className="h-4 w-4" />
                  Install Pixel
                </Link>
              ) : (
                <Link
                  href="/leads"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                >
                  <Star className="h-4 w-4 fill-white" />
                  View Leads
                </Link>
              )}
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

        {/* Onboarding complete banner — the celebration moment after the
            setup wizard. Upgraded copy + primary-color accent so users feel
            they accomplished something rather than landing on a beige notice. */}
        {onboarding === 'complete' && (
          <AnimatedSection delay={0.02}>
            <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 shrink-0">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-foreground">
                  {totalCount > 0
                    ? `${totalCount} enriched lead${totalCount === 1 ? '' : 's'} ready — you're all set up.`
                    : 'You\'re all set up.'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {totalCount > 0
                    ? 'Your audience is configured, your pixel is ready, and your first leads are waiting below. Click any lead to see the full enrichment.'
                    : 'Your audience is configured and your pipeline is being built. Your first leads will land here shortly — we\'ll email you the moment they arrive.'}
                </p>
                {hasPixel && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Want to track YOUR website visitors too?{' '}
                    <Link href="/settings/pixel" className="font-medium text-primary hover:underline">
                      Install your pixel →
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Targeting failed during onboarding — immediate corrective action */}
        {targeting_failed === 'true' && !hasPreferences && (
          <TargetingMissingBanner />
        )}

        {/* Unsupported industry — user picked an industry we have no segments for.
            Daily cron and populate-initial will deliver 0 leads until they change.
            Show this in place of the generic TargetingMissingBanner for these users. */}
        {hasUnsupportedIndustry && onboarding !== 'complete' && (
          <UnsupportedIndustryBanner industry={rawIndustry} />
        )}

        {/* Zero leads — targeting missing warning (takes priority over pending banner) */}
        {totalCount === 0 && onboarding !== 'complete' && !hasPreferences && workspaceAgeHours >= 48 && !hasUnsupportedIndustry && (
          <TargetingMissingBanner />
        )}

        {/* Zero leads — new workspace pending banner (< 48h, or missing prefs on fresh account) */}
        {totalCount === 0 && onboarding !== 'complete' && !hasUnsupportedIndustry && (hasPreferences || workspaceAgeHours < 48) && (
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
              <div className="rounded-xl p-4 flex items-center justify-between gap-4 bg-muted border border-border">
                <div>
                  {isFree ? (
                    <>
                      <p className="font-semibold text-foreground text-sm">
                        {creditsRemaining === 0 ? 'No free credits remaining today' : `${creditsRemaining} free credit${creditsRemaining === 1 ? '' : 's'} left`}
                      </p>
                      <p className="text-xs text-muted-foreground">Upgrade to Pro for 1,000 daily credits and full CRM access.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-foreground text-sm">
                        {creditsRemaining === 0 ? 'No enrichment credits remaining' : `${creditsRemaining} credit${creditsRemaining === 1 ? '' : 's'} remaining`}
                      </p>
                      <p className="text-xs text-muted-foreground">Each lead enrichment costs 1 credit. Credits reset daily.</p>
                    </>
                  )}
                </div>
                <Link href="/settings/billing" className="shrink-0 text-sm font-semibold text-white rounded-lg px-3 py-1.5 transition-colors bg-primary hover:bg-primary/90">
                  {isFree ? 'Upgrade to Pro' : 'Buy Credits'}
                </Link>
              </div>
            </AnimatedSection>
          )
          if (showOutboundUpsell) return (
            <AnimatedSection delay={0.03}>
              <div className="rounded-xl border border-border bg-muted p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground text-sm">Your pixel has identified {pixelEventCount.toLocaleString()} visitors</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Cursive Outbound can email and follow up with every identified visitor.</p>
                </div>
                <a href="mailto:darren@meetcursive.com?subject=Cursive Outbound interest" className="inline-flex items-center gap-1.5 shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors whitespace-nowrap">
                  Talk to Darren
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

        {/* Stat cards — pared down from 5 to 3 to reduce dashboard noise.
            When pixel is installed we lead with visitors identified; otherwise
            we lead with daily leads. */}
        <AnimatedSection delay={0.05}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Pixel identified visitors (when pixel active) — otherwise Today's leads */}
            {hasPixel ? (
              <Link href="/website-visitors" className="group">
                <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all h-full">
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Visitors Identified</span>
                  </div>
                  <div className="text-3xl font-semibold text-foreground mt-2">
                    {(visitorCountTotal ?? pixelEventCount).toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {hasVerifiedPixel ? 'From your website pixel' : 'Waiting for first visitor'}
                  </p>
                </div>
              </Link>
            ) : (
              <Link href="/leads" className="group">
                <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all h-full">
                  <span className="text-sm text-muted-foreground">Today&apos;s Leads</span>
                  <div className="text-3xl font-semibold text-foreground mt-2">{todayCount}</div>
                  <p className="text-sm text-muted-foreground mt-1">{todayCount} of {dailyLimit} delivered</p>
                </div>
              </Link>
            )}

            {/* Total enriched leads */}
            <Link href="/leads" className="group">
              <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all h-full">
                <span className="text-sm text-muted-foreground">Total Leads</span>
                <div className="text-3xl font-semibold text-foreground mt-2">{totalCount}</div>
                <p className="text-sm text-muted-foreground mt-1">{enrichedCount} enriched & verified</p>
              </div>
            </Link>

            {/* Meetings booked */}
            <div className="rounded-xl border border-border bg-card p-5 h-full">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Meetings Booked</span>
              </div>
              <div className="text-3xl font-semibold text-foreground mt-2">{meetingsThisMonth}</div>
              <p className="text-sm text-muted-foreground mt-1">{meetingsAllTime} all time</p>
            </div>
          </div>
        </AnimatedSection>

        {/* ── Live AudienceLab leads feed (only shown when pixel active) ── */}
        {hasPixel && (
          <AnimatedSection delay={0.07}>
            <LiveLeadsFeed workspaceId={workspaceId} />
          </AnimatedSection>
        )}

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
