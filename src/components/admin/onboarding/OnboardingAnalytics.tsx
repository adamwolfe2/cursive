'use client'

import { useState, useMemo } from 'react'
import {
  ChevronDown,
  ChevronRight,
  BarChart3,
  Users,
  TrendingUp,
  Target,
} from 'lucide-react'
import { PACKAGES } from '@/types/onboarding'
import type { PackageSlug } from '@/types/onboarding'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnboardingAnalyticsProps {
  clients: Array<{
    id: string
    company_name: string
    status: string
    created_at: string
    updated_at: string
    packages_selected: string[]
    setup_fee: number | null
    recurring_fee: number | null
    enriched_icp_brief: {
      primary_verticals?: string[]
      buyer_personas?: Array<{ title: string }>
      messaging_angles?: Array<{ angle_name: string }>
      company_filters?: { geography?: string[] }
    } | null
    target_industries: string[]
    target_titles: string[]
    pain_points: string | null
  }>
}

interface CountEntry {
  label: string
  count: number
}

// ---------------------------------------------------------------------------
// Helpers (pure functions)
// ---------------------------------------------------------------------------

function countByKey<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = keyFn(item)
    return { ...acc, [key]: (acc[key] ?? 0) + 1 }
  }, {})
}

function topEntries(counts: Record<string, number>, limit: number): CountEntry[] {
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

function flatCountStrings(arrays: string[][], limit: number): CountEntry[] {
  const counts = arrays.flat().reduce<Record<string, number>>((acc, val) => {
    const trimmed = val.trim()
    if (trimmed.length === 0) return acc
    return { ...acc, [trimmed]: (acc[trimmed] ?? 0) + 1 }
  }, {})
  return topEntries(counts, limit)
}

function parsePainPoints(raw: string | null): string[] {
  if (!raw || raw.trim().length === 0) return []
  return raw
    .split(/\.\s+|,\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function isCurrentMonth(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
  }
  return `$${value.toLocaleString()}`
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionToggle({
  label,
  icon,
  isOpen,
  onToggle,
}: {
  label: string
  icon: React.ReactNode
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
    >
      {icon}
      <span className="flex-1">{label}</span>
      {isOpen ? (
        <ChevronDown className="h-4 w-4 text-gray-400" />
      ) : (
        <ChevronRight className="h-4 w-4 text-gray-400" />
      )}
    </button>
  )
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  )
}

function HorizontalBarChart({ entries, maxValue }: { entries: CountEntry[]; maxValue: number }) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-400">No data yet.</p>
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const widthPct = maxValue > 0 ? (entry.count / maxValue) * 100 : 0
        return (
          <div key={entry.label} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-sm text-gray-600" title={entry.label}>
              {entry.label}
            </span>
            <div className="relative flex-1 h-6 rounded bg-gray-100">
              <div
                className="absolute inset-y-0 left-0 rounded bg-blue-600 transition-all duration-300"
                style={{ width: `${Math.max(widthPct, 2)}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-sm font-medium text-gray-700">
              {entry.count}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function Pill({ label, count }: { label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700">
      {label}
      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-medium text-white">
        {count}
      </span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function OnboardingAnalytics({ clients }: OnboardingAnalyticsProps) {
  const [pipelineOpen, setPipelineOpen] = useState(true)
  const [icpOpen, setIcpOpen] = useState(true)

  // --- Pipeline stats ---
  const totalClients = clients.length

  const clientsThisMonth = useMemo(
    () => clients.filter((c) => isCurrentMonth(c.created_at)).length,
    [clients],
  )

  const pipelineValue = useMemo(
    () =>
      clients
        .filter((c) => c.status === 'onboarding' || c.status === 'setup')
        .reduce((sum, c) => sum + (c.setup_fee ?? 0) + (c.recurring_fee ?? 0), 0),
    [clients],
  )

  const activeClients = useMemo(
    () => clients.filter((c) => c.status === 'active').length,
    [clients],
  )

  // --- Status chart ---
  const statusCounts = useMemo(() => {
    const raw = countByKey(clients, (c) => c.status)
    return Object.entries(raw)
      .map(([label, count]) => ({ label, count }))
      .filter((e) => e.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [clients])

  const statusMax = useMemo(
    () => Math.max(...statusCounts.map((e) => e.count), 1),
    [statusCounts],
  )

  // --- Package chart ---
  const packageCounts = useMemo(() => {
    const raw = clients
      .flatMap((c) => c.packages_selected)
      .reduce<Record<string, number>>((acc, pkg) => {
        const label = PACKAGES[pkg as PackageSlug]?.label ?? pkg
        return { ...acc, [label]: (acc[label] ?? 0) + 1 }
      }, {})
    return topEntries(raw, 5)
  }, [clients])

  const packageMax = useMemo(
    () => Math.max(...packageCounts.map((e) => e.count), 1),
    [packageCounts],
  )

  // --- ICP insights ---
  const enrichedClients = useMemo(
    () => clients.filter((c) => c.enriched_icp_brief !== null),
    [clients],
  )

  const hasEnoughEnriched = enrichedClients.length >= 3

  const topIndustries = useMemo(
    () => flatCountStrings(clients.map((c) => c.target_industries), 8),
    [clients],
  )

  const topTitles = useMemo(
    () => flatCountStrings(clients.map((c) => c.target_titles), 8),
    [clients],
  )

  const commonPainPoints = useMemo(() => {
    const allPhrases = clients
      .map((c) => parsePainPoints(c.pain_points))
      .filter((arr) => arr.length > 0)
    return flatCountStrings(allPhrases, 5)
  }, [clients])

  const messagingAngles = useMemo(() => {
    const angles = enrichedClients.flatMap(
      (c) => c.enriched_icp_brief?.messaging_angles?.map((a) => a.angle_name) ?? [],
    )
    const counts = angles.reduce<Record<string, number>>((acc, name) => {
      const trimmed = name.trim()
      if (trimmed.length === 0) return acc
      return { ...acc, [trimmed]: (acc[trimmed] ?? 0) + 1 }
    }, {})
    return topEntries(counts, 10)
  }, [enrichedClients])

  return (
    <div className="space-y-3">
      {/* ------ Pipeline Analytics ------ */}
      <SectionToggle
        label="Pipeline Analytics"
        icon={<BarChart3 className="h-4 w-4 text-blue-600" />}
        isOpen={pipelineOpen}
        onToggle={() => setPipelineOpen((prev) => !prev)}
      />

      {pipelineOpen && (
        <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-5">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Total Clients"
              value={totalClients}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              label="This Month"
              value={clientsThisMonth}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <StatCard
              label="Pipeline Value"
              value={formatCurrency(pipelineValue)}
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <StatCard
              label="Active Clients"
              value={activeClients}
              icon={<Target className="h-4 w-4" />}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-900">Clients by Status</h4>
              <HorizontalBarChart entries={statusCounts} maxValue={statusMax} />
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-900">Popular Packages</h4>
              <HorizontalBarChart entries={packageCounts} maxValue={packageMax} />
            </div>
          </div>
        </div>
      )}

      {/* ------ ICP Insights ------ */}
      <SectionToggle
        label="ICP Insights"
        icon={<Target className="h-4 w-4 text-blue-600" />}
        isOpen={icpOpen}
        onToggle={() => setIcpOpen((prev) => !prev)}
      />

      {icpOpen && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          {!hasEnoughEnriched ? (
            <p className="text-sm text-gray-500">
              ICP Insights will appear after 3+ clients are enriched.
            </p>
          ) : (
            <div className="space-y-6">
              {/* Top Industries */}
              {topIndustries.length > 0 && (
                <div>
                  <h4 className="mb-2.5 text-sm font-semibold text-gray-900">Top Industries</h4>
                  <div className="flex flex-wrap gap-2">
                    {topIndustries.map((entry) => (
                      <Pill key={entry.label} label={entry.label} count={entry.count} />
                    ))}
                  </div>
                </div>
              )}

              {/* Top Titles */}
              {topTitles.length > 0 && (
                <div>
                  <h4 className="mb-2.5 text-sm font-semibold text-gray-900">Top Titles</h4>
                  <div className="flex flex-wrap gap-2">
                    {topTitles.map((entry) => (
                      <Pill key={entry.label} label={entry.label} count={entry.count} />
                    ))}
                  </div>
                </div>
              )}

              {/* Common Pain Points */}
              {commonPainPoints.length > 0 && (
                <div>
                  <h4 className="mb-2.5 text-sm font-semibold text-gray-900">
                    Common Pain Points
                  </h4>
                  <ul className="space-y-1.5">
                    {commonPainPoints.map((entry) => (
                      <li
                        key={entry.label}
                        className="flex items-center justify-between text-sm text-gray-700"
                      >
                        <span className="truncate pr-3">{entry.label}</span>
                        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                          {entry.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Messaging Angles */}
              {messagingAngles.length > 0 && (
                <div>
                  <h4 className="mb-2.5 text-sm font-semibold text-gray-900">Messaging Angles</h4>
                  <ul className="space-y-1.5">
                    {messagingAngles.map((entry) => (
                      <li
                        key={entry.label}
                        className="flex items-center justify-between text-sm text-gray-700"
                      >
                        <span className="truncate pr-3">{entry.label}</span>
                        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                          {entry.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
