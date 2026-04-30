'use client'

import { motion } from 'framer-motion'
import { Download, Lock, Unlock, Users } from 'lucide-react'
import { useMemo } from 'react'
import type { SampleStreamPerson } from '@/lib/copilot/types'
import { RevealGate } from './RevealGate'

/**
 * Unmasked sample person (full data). Mirrored from
 * `src/lib/copilot/public-tools.ts#UnmaskedSamplePerson` — kept local so the
 * client component doesn't reach into server-only code.
 */
export interface UnmaskedSamplePerson {
  id: string
  first_name: string
  last_name: string
  email: string
  company: string | null
  domain: string | null
  state: string | null
  city: string | null
  job_title: string | null
  seniority: string | null
  industry: string | null
}

interface SampleLeadListUnlockedState {
  count: number
  reveals: UnmaskedSamplePerson[]
  exportAllowed: boolean
}

interface SampleLeadListProps {
  sampleViewId: string | null
  totalCount: number
  people: SampleStreamPerson[]
  unlocked?: SampleLeadListUnlockedState | null
  onOpenQualifier: (sampleViewId: string) => void
  onBookCall: () => void
  onExportCSV?: () => void
}

// First 3 rows are always visible (partially masked). Rows 4-15 are blurred
// behind the reveal gate until the lead promotes their unlock tier.
const FREE_PREVIEW_ROWS = 3

export function SampleLeadList({
  sampleViewId,
  totalCount,
  people,
  unlocked,
  onOpenQualifier,
  onBookCall,
  onExportCSV,
}: SampleLeadListProps) {
  const unlockedCount = unlocked?.count ?? 0
  const exportAllowed = unlocked?.exportAllowed ?? false

  // Derive the display list: first `unlockedCount` rows come from reveals
  // (full data), the rest stay masked from the stream payload.
  const rows = useMemo(() => {
    const reveals = unlocked?.reveals ?? []
    return people.map((masked, i) => {
      const revealed = i < unlockedCount ? reveals[i] : undefined
      const isVisible = i < Math.max(FREE_PREVIEW_ROWS, unlockedCount)
      return {
        key: masked.id || `row-${i}`,
        masked,
        revealed,
        isVisible,
        isUnmasked: Boolean(revealed),
      }
    })
  }, [people, unlocked?.reveals, unlockedCount])

  const remainingMasked = Math.max(0, people.length - Math.max(FREE_PREVIEW_ROWS, unlockedCount))
  const currentUnlockTier = unlocked == null ? 0 : exportAllowed ? 2 : 1
  const showGate = remainingMasked > 0 && currentUnlockTier < 2

  const handleQualifier = () => {
    if (sampleViewId) onOpenQualifier(sampleViewId)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      {/* Heading */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <Users className="h-3.5 w-3.5" />
          </span>
          <p className="truncate text-[13px] font-semibold text-[#0F172A]">
            {people.length} matches from ~
            {totalCount.toLocaleString()} in-market profiles
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
          Last 30 days
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100">
        {rows.map((row, i) => (
          <LeadRow key={row.key} row={row} index={i} />
        ))}
      </div>

      {/* Reveal gate */}
      {showGate && (
        <div className="border-t border-slate-100 px-3.5 py-3">
          <RevealGate
            remainingCount={remainingMasked}
            currentUnlockTier={currentUnlockTier}
            onQualifier={handleQualifier}
            onBookCall={onBookCall}
          />
        </div>
      )}

      {/* Export CSV — only after tier 2 */}
      {exportAllowed && onExportCSV && (
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-3.5 py-2.5">
          <p className="flex items-center gap-1.5 text-[12px] text-slate-600">
            <Unlock className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-medium text-[#0F172A]">All {people.length} leads unlocked</span>
          </p>
          <button
            type="button"
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Download className="h-3 w-3" />
            Download CSV
          </button>
        </div>
      )}
    </motion.div>
  )
}

// ─── Single row ─────────────────────────────────────────────────────────

interface LeadRowProps {
  row: {
    masked: SampleStreamPerson
    revealed?: UnmaskedSamplePerson
    isVisible: boolean
    isUnmasked: boolean
  }
  index: number
}

function LeadRow({ row, index }: LeadRowProps) {
  const { masked, revealed, isVisible, isUnmasked } = row
  const striped = index % 2 === 1

  // Fully unmasked row — show the real deal
  if (isUnmasked && revealed) {
    return (
      <div
        className={`flex items-start gap-3 px-3 py-2 ${
          striped ? 'bg-slate-50/40' : 'bg-white'
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[#0F172A]">
            {revealed.first_name} {revealed.last_name}
          </p>
          <p className="truncate font-mono text-[11px] text-slate-500">
            {revealed.email}
          </p>
          <p className="truncate text-[11px] text-slate-500">
            {[revealed.job_title, formatLocation(revealed.city, revealed.state)]
              .filter(Boolean)
              .join(' · ') || '—'}
          </p>
        </div>
        <div className="min-w-0 max-w-[40%] shrink-0 text-right">
          <p className="truncate text-[12px] font-medium text-slate-700">
            {revealed.company ?? '—'}
          </p>
          {revealed.industry && (
            <p className="truncate text-[10.5px] text-slate-400">
              {revealed.industry}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Blurred — this row is past the preview threshold
  if (!isVisible) {
    return (
      <div
        className={`flex items-start gap-3 px-3 py-2 select-none ${
          striped ? 'bg-slate-50/40' : 'bg-white'
        }`}
        style={{ filter: 'blur(4px)' }}
        aria-hidden="true"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[#0F172A]">
            {masked.first_name} {masked.last_name_masked}
          </p>
          <p className="truncate font-mono text-[11px] text-slate-400">
            {masked.email_masked}
          </p>
          <p className="truncate text-[11px] text-slate-500">
            {[masked.job_title, masked.state].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
        <div className="min-w-0 max-w-[40%] shrink-0 text-right">
          <p className="truncate text-[12px] font-medium text-slate-700">
            {masked.company ?? '—'}
          </p>
          {masked.industry && (
            <p className="truncate text-[10.5px] text-slate-400">
              {masked.industry}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Visible but masked (the first 3 preview rows)
  return (
    <div
      className={`flex items-start gap-3 px-3 py-2 ${
        striped ? 'bg-slate-50/40' : 'bg-white'
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[#0F172A]">
          {masked.first_name} {masked.last_name_masked}
        </p>
        <p className="truncate font-mono text-[11px] text-slate-400">
          {masked.email_masked}
        </p>
        <p className="truncate text-[11px] text-slate-500">
          {[masked.job_title, masked.state].filter(Boolean).join(' · ') || '—'}
        </p>
      </div>
      <div className="min-w-0 max-w-[40%] shrink-0 text-right">
        <p className="truncate text-[12px] font-medium text-slate-700">
          {masked.company ?? '—'}
        </p>
        {masked.industry && (
          <p className="truncate text-[10.5px] text-slate-400">
            {masked.industry}
          </p>
        )}
      </div>
      <Lock className="mt-0.5 h-3 w-3 shrink-0 text-slate-300" aria-hidden="true" />
    </div>
  )
}

function formatLocation(city: string | null, state: string | null): string {
  if (city && state) return `${city}, ${state}`
  return state || city || ''
}
