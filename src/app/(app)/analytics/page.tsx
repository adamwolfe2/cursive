import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ArrowRight } from 'lucide-react'
import { AnimatedSection, DashboardAnimationWrapper } from '@/components/dashboard/dashboard-animation-wrapper'

export const metadata: Metadata = {
  title: 'Analytics | Cursive',
}

function pct(num: number, den: number) {
  if (!den) return '0%'
  return `${Math.round((num / den) * 100)}%`
}

function FunnelBar({ label, count, total }: { label: string; count: number; total: number }) {
  const width = total > 0 ? Math.max(4, Math.round((count / total) * 100)) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-24 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-6 bg-muted rounded-lg overflow-hidden">
        <div
          className="h-full bg-border rounded-lg flex items-center px-2 transition-all"
          style={{ width: `${width}%` }}
        >
          {width > 12 && <span className="text-foreground text-xs font-bold">{count.toLocaleString()}</span>}
        </div>
      </div>
      {width <= 12 && <span className="text-xs font-semibold text-muted-foreground w-8">{count}</span>}
      <span className="text-xs text-muted-foreground w-10 text-right shrink-0">{pct(count, total)}</span>
    </div>
  )
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('id, workspace_id, plan')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!userData?.workspace_id) redirect('/welcome')
  const workspaceId = userData.workspace_id

  // ── All analytics queries in parallel ──

  const getPipelineStats = unstable_cache(
    async (wsId: string) => {
      const admin = createAdminClient()

      // ── Database-level counts (no rows loaded into memory) ──

      const [
        total,
        enriched,
        contacted,
        qualified,
        won,
        lost,
        hot,
        warm,
        cold,
        noScore,
      ] = await Promise.all([
        // Total
        admin.from('leads').select('*', { count: 'exact', head: true })
          .eq('workspace_id', wsId)
          .then(({ count }) => count ?? 0),
        // Enriched
        admin.from('leads').select('*', { count: 'exact', head: true })
          .eq('workspace_id', wsId).eq('enrichment_status', 'enriched')
          .then(({ count }) => count ?? 0),
        // Contacted (contacted + qualified + proposal + negotiation + won)
        admin.from('leads').select('*', { count: 'exact', head: true })
          .eq('workspace_id', wsId).in('status', ['contacted', 'qualified', 'proposal', 'negotiation', 'won'])
          .then(({ count }) => count ?? 0),
        // Qualified (qualified + proposal + negotiation + won)
        admin.from('leads').select('*', { count: 'exact', head: true })
          .eq('workspace_id', wsId).in('status', ['qualified', 'proposal', 'negotiation', 'won'])
          .then(({ count }) => count ?? 0),
        // Won
        admin.from('leads').select('*', { count: 'exact', head: true })
          .eq('workspace_id', wsId).eq('status', 'won')
          .then(({ count }) => count ?? 0),
        // Lost
        admin.from('leads').select('*', { count: 'exact', head: true })
          .eq('workspace_id', wsId).eq('status', 'lost')
          .then(({ count }) => count ?? 0),
        // Hot (intent >= 70)
        admin.from('leads').select('*', { count: 'exact', head: true })
          .eq('workspace_id', wsId).gte('intent_score_calculated', 70)
          .then(({ count }) => count ?? 0),
        // Warm (intent 40-69)
        admin.from('leads').select('*', { count: 'exact', head: true })
          .eq('workspace_id', wsId).gte('intent_score_calculated', 40).lt('intent_score_calculated', 70)
          .then(({ count }) => count ?? 0),
        // Cold (intent < 40, not null)
        admin.from('leads').select('*', { count: 'exact', head: true })
          .eq('workspace_id', wsId).lt('intent_score_calculated', 40).not('intent_score_calculated', 'is', null)
          .then(({ count }) => count ?? 0),
        // No score (null intent)
        admin.from('leads').select('*', { count: 'exact', head: true })
          .eq('workspace_id', wsId).is('intent_score_calculated', null)
          .then(({ count }) => count ?? 0),
      ])

      // ── Source breakdown + weekly trend need lightweight column data ──
      // Only fetch source and date columns (not full rows)
      const { data: sourceAndDateRows } = await admin
        .from('leads')
        .select('source, created_at, delivered_at')
        .eq('workspace_id', wsId)

      const rows = sourceAndDateRows ?? []

      const sourceMap: Record<string, number> = {}
      for (const r of rows) {
        const src = r.source || 'unknown'
        let bucket = 'Other'
        if (src.includes('superpixel') || src.includes('pixel')) bucket = 'Pixel Visitors'
        else if (src.startsWith('audience_labs') || src.startsWith('audiencelab')) bucket = 'Daily Leads'
        else if (src === 'query' || src === 'auto_match') bucket = 'Auto-Match'
        else if (src === 'marketplace') bucket = 'Marketplace'
        else if (src === 'import') bucket = 'Import'
        else if (src === 'manual') bucket = 'Manual'
        else if (src === 'partner') bucket = 'Partner'
        sourceMap[bucket] = (sourceMap[bucket] ?? 0) + 1
      }

      // Weekly trend — last 8 weeks
      const now = new Date()
      const weeks: { label: string; count: number }[] = []
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now)
        weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay())
        weekStart.setHours(0, 0, 0, 0)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)
        const count = rows.filter(r => {
          const d = new Date(r.delivered_at || r.created_at || '')
          return d >= weekStart && d < weekEnd
        }).length
        const monthDay = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        weeks.push({ label: monthDay, count })
      }

      return { total, enriched, contacted, qualified, won, lost, hot, warm, cold, noScore, sourceMap, weeks }
    },
    ['analytics-pipeline'],
    { revalidate: 300, tags: [`analytics-${workspaceId}`] }
  )

  const stats = await getPipelineStats(workspaceId)
  const maxWeek = Math.max(...stats.weeks.map(w => w.count), 1)
  const sourceSorted = Object.entries(stats.sourceMap).sort((a, b) => b[1] - a[1])

  // Conversion rate labels
  const enrichRate = pct(stats.enriched, stats.total)
  const contactRate = pct(stats.contacted, stats.total)
  const winRate = pct(stats.won, Math.max(stats.contacted, 1))

  return (
    <div className="space-y-8 p-6">
      <DashboardAnimationWrapper>

      {/* Header */}
      <AnimatedSection delay={0}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your lead pipeline performance at a glance.</p>
          </div>
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            View Leads
          </Link>
        </div>
      </AnimatedSection>

      {/* KPI Row */}
      <AnimatedSection delay={0.04}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <span className="text-sm text-muted-foreground">Total Leads</span>
            <div className="text-3xl font-semibold text-foreground mt-1">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{enrichRate} enriched</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <span className="text-sm text-muted-foreground">Contacted</span>
            <div className="text-3xl font-semibold text-foreground mt-1">{stats.contacted.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{contactRate} of total</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <span className="text-sm text-muted-foreground">Hot Leads</span>
            <div className="text-3xl font-semibold text-foreground mt-1">{stats.hot.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">intent score &ge;70</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <span className="text-sm text-muted-foreground">Won</span>
            <div className="text-3xl font-semibold text-foreground mt-1">{stats.won.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{winRate} close rate</p>
          </div>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pipeline Funnel */}
        <AnimatedSection delay={0.08}>
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-5">Pipeline Funnel</h2>
            <div className="space-y-3">
              <FunnelBar label="All Leads" count={stats.total} total={stats.total} />
              <FunnelBar label="Enriched" count={stats.enriched} total={stats.total} />
              <FunnelBar label="Contacted" count={stats.contacted} total={stats.total} />
              <FunnelBar label="Qualified" count={stats.qualified} total={stats.total} />
              <FunnelBar label="Won" count={stats.won} total={stats.total} />
            </div>
            {stats.lost > 0 && (
              <p className="mt-4 text-xs text-muted-foreground">{stats.lost} marked not interested</p>
            )}
            <div className="mt-5 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">{enrichRate}</p>
                <p className="text-xs text-muted-foreground">Enrich rate</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{contactRate}</p>
                <p className="text-xs text-muted-foreground">Contact rate</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{winRate}</p>
                <p className="text-xs text-muted-foreground">Close rate</p>
              </div>
            </div>
            {stats.contacted === 0 && (
              <div className="mt-4 p-3 bg-muted rounded-lg border border-border">
                <p className="text-xs text-foreground font-medium">Start tracking outreach</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mark leads as &ldquo;Contacted&rdquo; from the{' '}
                  <Link href="/leads" className="text-primary underline">leads page</Link> to see your pipeline fill up.
                </p>
              </div>
            )}
          </div>
        </AnimatedSection>

        {/* Intent Score Distribution */}
        <AnimatedSection delay={0.1}>
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-5">Lead Quality</h2>
            <div className="space-y-4">
              {[
                { label: 'Hot (70+)', count: stats.hot },
                { label: 'Warm (40\u201369)', count: stats.warm },
                { label: 'Cold (<40)', count: stats.cold },
                { label: 'Not scored', count: stats.noScore },
              ].map(({ label, count }) => {
                const barPct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                return (
                  <div key={label} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{label}</span>
                      <span className="text-sm font-semibold text-foreground">{count.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">({barPct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-border rounded-full transition-all" style={{ width: `${barPct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
            {stats.hot > 0 && (
              <Link
                href="/leads"
                className="mt-4 flex items-center justify-between rounded-lg bg-muted border border-border px-3 py-2.5 hover:bg-muted transition-colors"
              >
                <span className="text-xs font-semibold text-foreground">
                  {stats.hot} hot lead{stats.hot !== 1 ? 's' : ''} ready for outreach
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            )}
          </div>
        </AnimatedSection>

        {/* Lead Sources */}
        <AnimatedSection delay={0.12}>
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-5">Lead Sources</h2>
            {sourceSorted.length > 0 ? (
              <div className="space-y-3">
                {sourceSorted.map(([source, count]) => {
                  const barPct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                  return (
                    <div key={source} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-28 shrink-0 truncate">{source}</span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-border"
                          style={{ width: `${Math.max(4, barPct)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground w-8 text-right">{count}</span>
                      <span className="text-xs text-muted-foreground w-8 text-right">{barPct}%</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No leads yet</p>
            )}
          </div>
        </AnimatedSection>

        {/* Weekly Trend */}
        <AnimatedSection delay={0.14}>
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-5">Weekly Lead Volume</h2>
            <div className="flex items-end gap-2 h-32">
              {stats.weeks.map((week) => {
                const height = maxWeek > 0 ? Math.max(4, Math.round((week.count / maxWeek) * 100)) : 4
                return (
                  <div key={week.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground font-medium">{week.count > 0 ? week.count : ''}</span>
                    <div
                      className="w-full rounded-t-sm transition-all bg-muted hover:bg-border"
                      style={{ height: `${height}%` }}
                      title={`${week.label}: ${week.count} leads`}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2 mt-2">
              {stats.weeks.map((week) => (
                <div key={week.label} className="flex-1 text-center">
                  <span className="text-[9px] text-muted-foreground leading-none">{week.label.split(' ')[1]}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">Last 8 weeks</p>
          </div>
        </AnimatedSection>

      </div>

      {/* Bottom CTA if user isn&apos;t using pipeline features */}
      {stats.contacted === 0 && stats.total > 0 && (
        <AnimatedSection delay={0.16}>
          <div className="bg-muted border border-border rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground">Track your outreach to unlock full analytics</p>
              <p className="text-sm text-muted-foreground mt-1">
                Mark leads as &ldquo;Contacted,&rdquo; &ldquo;Won,&rdquo; or &ldquo;Not Interested&rdquo; directly from the leads page.
                Your pipeline funnel and close rate will update automatically.
              </p>
            </div>
            <Link
              href="/leads"
              className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Start Tracking <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </AnimatedSection>
      )}

      </DashboardAnimationWrapper>
    </div>
  )
}
