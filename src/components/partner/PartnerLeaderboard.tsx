/**
 * Partner Leaderboard Component
 * Shows the top 10 partners ranked by the chosen category and period,
 * with tier badges, podium styling for top 3, and the current
 * user's row highlighted (appended at the bottom if outside top 10).
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Award, Crown, Trophy, Loader2, Download } from 'lucide-react'
import { cn } from '@/lib/design-system'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { LeaderboardEntry, LeaderboardPeriod, LeaderboardCategory } from '@/app/api/partner/leaderboard/route'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Hex accent colors for the three tiers (used for inline styles on podium rows) */
const TIER_COLORS: Record<'Bronze' | 'Silver' | 'Gold', { hex: string; label: string }> = {
  Bronze: { hex: '#CD7F32', label: 'Bronze' },
  Silver: { hex: '#9EA0A4', label: 'Silver' },
  Gold:   { hex: '#FFD700', label: 'Gold' },
}

/** Podium accent colors for rank 1 / 2 / 3 */
const PODIUM_COLORS: Record<number, string> = {
  1: '#FFD700', // gold
  2: '#9EA0A4', // silver
  3: '#CD7F32', // bronze
}

const TIER_ICONS = {
  Bronze: Shield,
  Silver: Award,
  Gold:   Crown,
}

const PERIOD_OPTIONS: { value: LeaderboardPeriod; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'alltime', label: 'All Time' },
]

const CATEGORY_OPTIONS: { value: LeaderboardCategory; label: string }[] = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'leads', label: 'Leads' },
  { value: 'conversion', label: 'Conversion' },
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TierBadge({ tier }: { tier: 'Bronze' | 'Silver' | 'Gold' }) {
  const { hex, label } = TIER_COLORS[tier]
  const Icon = TIER_ICONS[tier]

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{
        backgroundColor: `${hex}22`,
        color: hex,
        border: `1px solid ${hex}55`,
      }}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const color = PODIUM_COLORS[rank]
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
        style={{ backgroundColor: `${color}22`, color, border: `1.5px solid ${color}88` }}
      >
        {rank}
      </span>
    )
  }
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
      {rank}
    </span>
  )
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-md px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-foreground text-background'
          : 'bg-muted text-muted-foreground hover:bg-muted/70'
      )}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface PartnerLeaderboardProps {
  /** Override the month displayed in the header (ISO string). Defaults to current month. */
  month?: string
  /** Whether the current user is an admin (shows Export CSV button). */
  isAdmin?: boolean
}

export function PartnerLeaderboard({ month, isAdmin = false }: PartnerLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolvedMonth, setResolvedMonth] = useState<string>(month ?? new Date().toISOString())
  const [period, setPeriod] = useState<LeaderboardPeriod>('month')
  const [category, setCategory] = useState<LeaderboardCategory>('revenue')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({ period, category })
        const res = await fetch(`/api/partner/leaderboard?${params.toString()}`)

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error ?? 'Failed to load leaderboard')
        }

        const data = await res.json()

        if (!cancelled) {
          setEntries(data.leaderboard ?? [])
          if (data.month) setResolvedMonth(data.month)
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [period, category])

  async function handleExport() {
    try {
      setExporting(true)
      const params = new URLSearchParams({ period, category })
      const res = await fetch(`/api/partner/leaderboard/export?${params.toString()}`)

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Export failed')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leaderboard-${period}-${category}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      // Silent fail — the download simply won't trigger
      safeError('[Leaderboard] Export error:', err)
    } finally {
      setExporting(false)
    }
  }

  // Format month header: "February 2026"
  const monthLabel = new Date(resolvedMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  // Determine header label based on period
  const periodLabel =
    period === 'week'
      ? 'This Week'
      : period === 'month'
      ? monthLabel
      : period === 'quarter'
      ? 'This Quarter'
      : 'All Time'

  // Separate top-10 rows from the "you're outside top 10" appended row
  const top10 = entries.filter((e) => e.rank <= 10 || entries.indexOf(e) < 10)
  const currentUserOutsideTop10 = entries.find(
    (e) => e.is_current_user && !top10.includes(e)
  )

  // Determine primary stat column label based on category
  const primaryStatLabel =
    category === 'revenue' ? 'Earnings' : category === 'leads' ? 'Leads' : 'Conv. %'

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
            <Trophy className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">Partner Leaderboard</CardTitle>
            <p className="text-sm text-muted-foreground">{periodLabel}</p>
          </div>

          {/* Admin-only Export CSV button */}
          {isAdmin && (
            <button
              onClick={handleExport}
              disabled={exporting || loading}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
            >
              {exporting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              Export CSV
            </button>
          )}
        </div>

        {/* Period filter buttons */}
        <div className="flex items-center gap-1.5 pt-2">
          {PERIOD_OPTIONS.map((opt) => (
            <FilterButton
              key={opt.value}
              active={period === opt.value}
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
            </FilterButton>
          ))}
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1.5 pt-1">
          {CATEGORY_OPTIONS.map((opt) => (
            <FilterButton
              key={opt.value}
              active={category === opt.value}
              onClick={() => setCategory(opt.value)}
            >
              {opt.label}
            </FilterButton>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && error && (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            {error}
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No data yet for this period. Be the first!
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <div className="divide-y divide-border">
            {/* Column headers */}
            <div className="grid grid-cols-[40px_1fr_auto_auto_auto] gap-3 px-6 py-2 text-xs font-medium text-muted-foreground">
              <span>#</span>
              <span>Partner</span>
              <span className="text-right">Tier</span>
              <span className="text-right">Leads</span>
              <span className="text-right">{primaryStatLabel}</span>
            </div>

            {/* Top 10 rows */}
            {top10.map((entry) => (
              <LeaderboardRow
                key={`${entry.rank}-${entry.partner_name}`}
                entry={entry}
                category={category}
              />
            ))}

            {/* Separator + current user's row when outside top 10 */}
            {currentUserOutsideTop10 && (
              <>
                <div className="flex items-center gap-2 px-6 py-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">Your rank</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <LeaderboardRow entry={currentUserOutsideTop10} category={category} />
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Row component
// ---------------------------------------------------------------------------

function LeaderboardRow({
  entry,
  category,
}: {
  entry: LeaderboardEntry
  category: LeaderboardCategory
}) {
  const isPodium = entry.rank <= 3
  const podiumColor = isPodium ? PODIUM_COLORS[entry.rank] : null

  // Primary stat based on category
  const primaryStat =
    category === 'revenue'
      ? `$${entry.earnings_this_month.toFixed(2)}`
      : category === 'leads'
      ? entry.leads_sold_this_month.toLocaleString()
      : `${entry.conversion_rate.toFixed(1)}%`

  const primaryStatSub =
    category === 'revenue' ? 'earned' : category === 'leads' ? 'leads' : 'conv.'

  return (
    <div
      className={cn(
        'grid grid-cols-[40px_1fr_auto_auto_auto] items-center gap-3 px-6 py-3 transition-colors',
        entry.is_current_user
          ? 'bg-blue-50 dark:bg-blue-950/20'
          : 'hover:bg-muted/30'
      )}
      style={
        isPodium && !entry.is_current_user
          ? { backgroundColor: `${podiumColor}08` }
          : undefined
      }
    >
      {/* Rank */}
      <div className="flex items-center justify-center">
        <RankBadge rank={entry.rank} />
      </div>

      {/* Partner name */}
      <div className="min-w-0">
        <span
          className={cn(
            'truncate text-sm font-medium',
            entry.is_current_user && 'text-blue-700 dark:text-blue-300'
          )}
        >
          {entry.partner_name}
          {entry.is_current_user && (
            <Badge
              variant="secondary"
              className="ml-2 text-[10px] px-1.5 py-0 align-middle"
            >
              You
            </Badge>
          )}
        </span>
      </div>

      {/* Tier badge */}
      <div className="flex justify-end">
        <TierBadge tier={entry.tier} />
      </div>

      {/* Leads sold (always shown) */}
      <div className="text-right">
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            isPodium && !entry.is_current_user && category === 'leads' ? '' : 'text-foreground'
          )}
          style={
            isPodium && !entry.is_current_user && category === 'leads'
              ? { color: podiumColor ?? undefined }
              : undefined
          }
        >
          {entry.leads_sold_this_month.toLocaleString()}
        </span>
        <p className="text-[10px] text-muted-foreground leading-none mt-0.5">leads</p>
      </div>

      {/* Primary stat column */}
      <div className="text-right">
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            category === 'revenue' ? 'text-emerald-600' : 'text-foreground'
          )}
          style={
            isPodium && !entry.is_current_user && category !== 'revenue'
              ? { color: podiumColor ?? undefined }
              : undefined
          }
        >
          {primaryStat}
        </span>
        <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{primaryStatSub}</p>
      </div>
    </div>
  )
}
