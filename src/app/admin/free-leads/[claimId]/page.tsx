'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAdminAuth } from '@/hooks/use-admin-auth'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { Icp } from '@/lib/free-leads/contract'
import type { CostSummary, LeadView, TimelineEntry } from '@/lib/free-leads/funnel-admin'
import { STEP_LABELS, UPGRADE_LABELS, fmtDate, fmtUsd } from '../labels'

interface Detail {
  claim: {
    id: string
    created_at: string
    fulfilled_at: string | null
    email: string
    website: string
    status: string
    total_matching: number | null
    credits_used: number
    session_id: string | null
    upgrade_interest: string[]
    attribution: Record<string, unknown>
  }
  icp: Icp | null
  leads: LeadView[]
  events: TimelineEntry[]
  cost: CostSummary
}

const list = (xs: readonly string[]) => (xs.length ? xs.join(', ') : '-')

export default function FreeLeadClaimPage() {
  const { isAdmin, authChecked } = useAdminAuth()
  const { claimId } = useParams<{ claimId: string }>()
  const [data, setData] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/free-leads/${claimId}`)
      if (res.status === 404) {
        setMessage('Claim not found.')
      } else if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      } else {
        setData((await res.json()) as Detail)
      }
    } catch (error) {
      safeError('[FreeLeadsAdmin]', 'Failed to load claim:', error)
      setMessage('Could not load this claim. Try again in a moment.')
    }
    setLoading(false)
  }, [claimId])

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
    <div className="p-6 max-w-5xl">
      <Link href="/admin/free-leads" className="inline-flex items-center gap-1 text-[13px] text-zinc-600 hover:text-zinc-900 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Free leads
      </Link>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !data ? (
        <div className="bg-white border border-zinc-200 rounded-lg p-8 text-center text-[13px] text-zinc-500">{message}</div>
      ) : (
        <DetailBody data={data} />
      )}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4">
      <h2 className="text-[14px] font-medium text-zinc-900 mb-3">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-[13px]">
      <dt className="w-32 shrink-0 text-zinc-500">{label}</dt>
      <dd className="text-zinc-900 break-words min-w-0">{value}</dd>
    </div>
  )
}

function DetailBody({ data }: { data: Detail }) {
  const { claim, icp, leads, events, cost } = data
  const utm = ['utm_source', 'utm_medium', 'utm_campaign', 'ref']
    .map((k) => (typeof claim.attribution[k] === 'string' ? `${k}: ${claim.attribution[k]}` : null))
    .filter((v): v is string => Boolean(v))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">{claim.website}</h1>
        <p className="text-[13px] text-zinc-600 mt-1">
          {claim.email} · {claim.status} · claimed {fmtDate(claim.created_at)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="ICP">
          {icp ? (
            <dl className="space-y-1.5">
              <Field label="Summary" value={icp.summary} />
              <Field label="Industries" value={list(icp.industries)} />
              <Field label="Job titles" value={list(icp.job_titles)} />
              <Field label="Seniority" value={list(icp.seniority)} />
              <Field label="Company size" value={list(icp.company_size)} />
              <Field label="Countries" value={list(icp.countries)} />
              <Field label="States" value={list(icp.states)} />
              <Field label="Cities" value={list(icp.cities)} />
            </dl>
          ) : (
            <p className="text-[13px] text-zinc-500">The stored ICP could not be read.</p>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Claim">
            <dl className="space-y-1.5">
              <Field label="Matching" value={claim.total_matching === null ? '-' : String(claim.total_matching)} />
              <Field label="Credits used" value={String(claim.credits_used)} />
              <Field label="Delivered" value={claim.fulfilled_at ? fmtDate(claim.fulfilled_at) : '-'} />
              <Field label="Upgrade intent" value={list(claim.upgrade_interest.map((t) => UPGRADE_LABELS[t] ?? t))} />
              <Field label="Attribution" value={list(utm)} />
            </dl>
          </Card>

          <Card title="Cost">
            <dl className="space-y-1.5">
              <Field label="Total" value={fmtUsd(cost.totalUsd)} />
              <Field label="Model spend" value={fmtUsd(cost.usd)} />
              <Field label="Lead credits" value={`${cost.credits} (${fmtUsd(cost.creditUsd)})`} />
            </dl>
          </Card>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg overflow-x-auto">
        <div className="p-4 border-b border-zinc-100">
          <h2 className="text-[14px] font-medium text-zinc-900">Leads ({leads.length})</h2>
        </div>
        {leads.length === 0 ? (
          <p className="p-8 text-center text-[13px] text-zinc-500">No leads delivered for this claim.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-100">
                {['Name', 'Title', 'Company', 'Location', 'Fit', 'Why'].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b border-zinc-100 last:border-0 align-top">
                  <td className="px-3 py-2 text-zinc-900 whitespace-nowrap">{l.name || '-'}</td>
                  <td className="px-3 py-2 text-zinc-600">{l.job_title || '-'}</td>
                  <td className="px-3 py-2 text-zinc-900">{l.company || '-'}</td>
                  <td className="px-3 py-2 text-zinc-600">{l.location ?? '-'}</td>
                  <td className="px-3 py-2 tabular-nums text-zinc-900">{l.fit_score === null ? '-' : `${l.fit_score} / 3`}</td>
                  <td className="px-3 py-2 text-zinc-600">{l.fit_why ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Card title="Timeline">
        {events.length === 0 ? (
          <p className="text-[13px] text-zinc-500">No events recorded for this session.</p>
        ) : (
          <ol className="space-y-1.5">
            {events.map((e, i) => (
              <li key={`${e.step}-${e.created_at}-${i}`} className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="text-zinc-900">{STEP_LABELS[e.step] ?? e.step}</span>
                <span className="flex gap-4 tabular-nums text-zinc-500">
                  {e.cached ? <span>cached</span> : null}
                  {e.credits ? <span>{e.credits} credits</span> : null}
                  {e.usd ? <span>{fmtUsd(e.usd)}</span> : null}
                  <span>{fmtDate(e.created_at)}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  )
}
