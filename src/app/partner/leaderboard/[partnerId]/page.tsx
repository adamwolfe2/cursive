/**
 * Partner Profile Page
 * /partner/leaderboard/[partnerId]
 *
 * Shows public stats for a partner. If the viewer is the current user,
 * shows their real name; otherwise shows anonymized name.
 * Includes a div-based bar chart showing last 6 months of earnings.
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Award, Crown, Loader2, TrendingUp, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { PartnerProfileData, MonthlyTrend } from '@/app/api/partner/profile/[partnerId]/route'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIER_STYLES: Record<
  'Bronze' | 'Silver' | 'Gold',
  { hex: string; label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  Bronze: { hex: '#CD7F32', label: 'Bronze', Icon: Shield },
  Silver: { hex: '#9EA0A4', label: 'Silver', Icon: Award },
  Gold:   { hex: '#FFD700', label: 'Gold',   Icon: Crown },
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TierBadge({ tier }: { tier: 'Bronze' | 'Silver' | 'Gold' }) {
  const { hex, label, Icon } = TIER_STYLES[tier]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
      style={{
        backgroundColor: `${hex}22`,
        color: hex,
        border: `1px solid ${hex}55`,
      }}
    >
      <Icon className="h-4 w-4" />
      {label} Partner
    </span>
  )
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  )
}

function MonthlyBarChart({ data }: { data: MonthlyTrend[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">No trend data available.</p>
    )
  }

  const maxEarnings = Math.max(...data.map((d) => d.earnings), 1)

  return (
    <div className="space-y-2">
      {data.map((month) => {
        const pct = Math.max((month.earnings / maxEarnings) * 100, month.earnings > 0 ? 2 : 0)
        return (
          <div key={month.month} className="flex items-center gap-3">
            {/* Month label */}
            <span className="w-16 shrink-0 text-xs text-muted-foreground text-right">
              {month.label}
            </span>
            {/* Bar */}
            <div className="flex-1 h-6 rounded bg-muted overflow-hidden">
              <div
                className="h-full rounded bg-emerald-500 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            {/* Value */}
            <span className="w-20 shrink-0 text-xs font-medium text-right tabular-nums">
              {month.earnings > 0 ? `$${month.earnings.toFixed(2)}` : '—'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PartnerProfilePage() {
  const params = useParams()
  const partnerId = typeof params.partnerId === 'string' ? params.partnerId : ''

  const [profile, setProfile] = useState<PartnerProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!partnerId) return

    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`/api/partner/profile/${encodeURIComponent(partnerId)}`)

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error ?? 'Failed to load profile')
        }

        const data: PartnerProfileData = await res.json()
        if (!cancelled) setProfile(data)
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load profile')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [partnerId])

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-3xl">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !profile) {
    return (
      <div className="container mx-auto py-8 max-w-3xl">
        <Link
          href="/partner/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm">
          {error ?? 'Profile not found.'}
        </div>
      </div>
    )
  }

  const memberSince = new Date(profile.member_since).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="container mx-auto py-8 max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/partner/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      {/* Profile header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar placeholder */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground shrink-0">
              {profile.partner_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold">{profile.partner_name}</h1>
                {profile.is_own_profile && (
                  <Badge variant="secondary" className="text-xs">
                    You
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Member since {memberSince}</p>
              <div className="mt-2">
                <TierBadge tier={profile.tier} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Leads Sold"
          value={profile.total_leads_sold.toLocaleString()}
          sub="All time"
        />
        <StatCard
          label="Total Earnings"
          value={`$${profile.total_earnings.toFixed(2)}`}
          sub="All time commissions"
        />
        <StatCard
          label="Conversion Rate"
          value={`${profile.conversion_rate.toFixed(1)}%`}
          sub="Sold / uploaded"
        />
        <StatCard
          label="Partner Tier"
          value={profile.tier}
          sub="Based on total uploads"
        />
      </div>

      {/* Monthly earnings trend */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Monthly Earnings — Last 6 Months</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <MonthlyBarChart data={profile.monthly_trend} />
        </CardContent>
      </Card>
    </div>
  )
}
