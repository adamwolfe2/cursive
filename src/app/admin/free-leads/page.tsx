'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { AdminRange, ClaimListRow, CostSummary, FunnelStepCount } from '@/lib/free-leads/funnel-admin'
import { STEP_LABELS, UPGRADE_LABELS, fmtDate, fmtPct, fmtUsd } from './labels'

interface Overview {
  funnel: FunnelStepCount[]
  cost: CostSummary
  claims: ClaimListRow[]
  truncated: boolean
}

const RANGE_OPTIONS: Array<{ value: AdminRange; label: string }> = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All-time' },
]

const numberFmt = new Intl.NumberFormat('en-US')

export default function FreeLeadsAdminPage() {
  const { isAdmin, authChecked } = useAdminAuth()
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [range, setRange] = useState<AdminRange>('30d')

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const res = await fetch(`/api/admin/free-leads?range=${range}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData((await res.json()) as Overview)
    } catch (error) {
      safeError('[FreeLeadsAdmin]', 'Failed to load funnel:', error)
      setFailed(true)
    }
    setLoading(false)
  }, [range])

  useEffect(() => {
    if (authChecked && isAdmin) load()
  }, [authChecked, isAdmin, load])

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[13px] text-zinc-600">Checking access...</p>
      </div>
    )
  }
  if (!isAdmin) return null

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Free leads</h1>
          <p className="text-[13px] text-zinc-600 mt-1">
            The /start flow: sessions reaching each step, what each signup costs, and every claim.
          </p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as AdminRange)}
          className="h-9 px-3 text-[13px] border border-zinc-300 rounded-lg focus:outline-none focus:border-primary"
        >
          {RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : failed || !data ? (
        <div className="bg-white border border-zinc-200 rounded-lg p-8 text-center text-[13px] text-zinc-500">
          Could not load the funnel. Try again in a moment.
        </div>
      ) : (
        <div className="space-y-6">
          {data.truncated && (
            <p className="text-[13px] text-amber-600">
              Event volume hit the read cap, so the oldest events in this window are missing. Pick a shorter range.
            </p>
          )}
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <FunnelCard funnel={data.funnel} />
            <CostCard cost={data.cost} />
          </div>
          <ClaimsTable claims={data.claims} />
        </div>
      )}
    </div>
  )
}

function FunnelCard({ funnel }: { funnel: FunnelStepCount[] }) {
  const max = Math.max(1, ...funnel.map((s) => s.sessions))
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4">
      <h2 className="text-[14px] font-medium text-zinc-900 mb-3">Funnel</h2>
      <div className="space-y-3">
        {funnel.map((s, i) => {
          const prev = i > 0 ? funnel[i - 1].sessions : null
          const dropped = prev !== null && s.sessions < prev ? prev - s.sessions : null
          return (
            <div key={s.step}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] text-zinc-900">
                  <span className="text-[11px] text-zinc-400 mr-2">{i + 1}</span>
                  {STEP_LABELS[s.step] ?? s.step}
                </span>
                <span className="text-[13px] font-semibold text-zinc-900 tabular-nums">{numberFmt.format(s.sessions)}</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${s.sessions === 0 ? 0 : Math.max((s.sessions / max) * 100, 1.5)}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 tabular-nums">
                <span>{dropped !== null ? `${numberFmt.format(dropped)} dropped vs previous step` : ''}</span>
                <span className="flex gap-3">
                  {i > 0 && <span>{fmtPct(s.vsPrev)} of previous</span>}
                  {i > 0 && <span>{fmtPct(s.vsPaste)} of pasted</span>}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CostCard({ cost }: { cost: CostSummary }) {
  const steps = Object.entries(cost.byStep)
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4 h-fit">
      <h2 className="text-[14px] font-medium text-zinc-900">Cost per signup</h2>
      <p className="text-2xl font-semibold text-zinc-900 tabular-nums mt-2">{fmtUsd(cost.costPerDelivered)}</p>
      <p className="text-[11px] text-zinc-500 mt-1">
        Total {fmtUsd(cost.totalUsd)} over {numberFmt.format(cost.deliveredSessions)} delivered signups
      </p>
      <dl className="mt-4 space-y-1 text-[13px]">
        <div className="flex justify-between">
          <dt className="text-zinc-600">Model spend</dt>
          <dd className="tabular-nums text-zinc-900">{fmtUsd(cost.usd)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-600">Lead credits ({numberFmt.format(cost.credits)})</dt>
          <dd className="tabular-nums text-zinc-900">{fmtUsd(cost.creditUsd)}</dd>
        </div>
      </dl>
      {steps.length > 0 && (
        <div className="mt-4 border-t border-zinc-100 pt-3 space-y-1 text-[13px]">
          {steps.map(([step, c]) => (
            <div key={step} className="flex justify-between">
              <span className="text-zinc-600">{STEP_LABELS[step] ?? step}</span>
              <span className="tabular-nums text-zinc-900">{fmtUsd(c.totalUsd)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ClaimsTable({ claims }: { claims: ClaimListRow[] }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg overflow-x-auto">
      <div className="p-4 border-b border-zinc-100">
        <h2 className="text-[14px] font-medium text-zinc-900">Claims ({numberFmt.format(claims.length)})</h2>
      </div>
      {claims.length === 0 ? (
        <p className="p-8 text-center text-[13px] text-zinc-500">No claims in this window.</p>
      ) : (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-100">
              {['When', 'Email', 'Website', 'ICP', 'Matching', 'Status', 'Leads', 'Fit', 'Upgrade interest', 'Source'].map((h) => (
                <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 align-top">
                <td className="px-3 py-2 whitespace-nowrap text-zinc-600">
                  <Link href={`/admin/free-leads/${c.id}`} className="text-blue-600 hover:underline">
                    {fmtDate(c.created_at)}
                  </Link>
                </td>
                <td className="px-3 py-2 text-zinc-900">{c.email}</td>
                <td className="px-3 py-2 text-zinc-600">{c.website}</td>
                <td className="px-3 py-2 text-zinc-600 max-w-[260px] truncate" title={c.icp_summary ?? undefined}>
                  {c.icp_summary ?? '-'}
                </td>
                <td className="px-3 py-2 tabular-nums text-zinc-600">{c.total_matching === null ? '-' : numberFmt.format(c.total_matching)}</td>
                <td className={`px-3 py-2 ${c.status === 'failed' ? 'text-red-600' : 'text-zinc-900'}`}>{c.status}</td>
                <td className="px-3 py-2 tabular-nums text-zinc-900">{c.lead_count}</td>
                <td className="px-3 py-2 tabular-nums text-zinc-900">{c.mean_fit_score === null ? '-' : `${c.mean_fit_score.toFixed(2)} / 3`}</td>
                <td className="px-3 py-2 text-zinc-600">
                  {c.upgrade_interest.length ? c.upgrade_interest.map((t) => UPGRADE_LABELS[t] ?? t).join(', ') : '-'}
                </td>
                <td className="px-3 py-2 text-zinc-600 whitespace-nowrap">{[c.utm_source, c.ref].filter(Boolean).join(' / ') || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
