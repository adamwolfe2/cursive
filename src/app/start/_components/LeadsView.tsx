'use client'

import { Check, Copy, Download, Linkedin, Lock, Phone, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FREE_LEAD_COUNT, type FullLead, type LeadsResponse } from '@/lib/free-leads/contract'
import { AnimatedNumber, formatCount } from './AnimatedNumber'
import { errorCopy, getJson, isAbort, StartApiError, trackStep, type Mock } from './api'
import { leadsCsv } from './csv'
import { Ladder } from './Ladder'
import { WhyLine } from './Preview'

type Ready = Extract<LeadsResponse, { status: 'ready' }>
/** `retryable` is optional in the contract; only an explicit true offers "Try again". */
type Failed = Extract<LeadsResponse, { status: 'failed' }> & { retryable?: boolean }
type State =
  | { kind: 'loading' }
  | { kind: 'ready'; data: Ready }
  | { kind: 'failed'; message: string; retryable: boolean }
  | { kind: 'expired' }

const SLOW_AFTER_MS = 12_000
/** Leads land one after another at this pace; the heading count and the blue rule track the same clock. */
const LAND_STEP_MS = 38

/** "https://www.acme.com/" -> "acme.com" for display and file names. */
function bareDomain(website: string): string {
  return website.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '')
}

function downloadCsv(leads: FullLead[], website: string) {
  const url = URL.createObjectURL(new Blob([leadsCsv(leads)], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `cursive-leads-${bareDomain(website).replace(/[^a-z0-9.-]/gi, '')}.csv`
  a.click()
  // Safari cancels the download if the URL is revoked in the same tick as the click.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** `token` is the `c` param from the emailed link. Held in memory only; sent on every (re)fetch. */
export function LeadsView({ mock, token }: { mock: Mock; token: string | null }) {
  const router = useRouter()
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [slow, setSlow] = useState(false)
  const ctrl = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    ctrl.current?.abort()
    const c = new AbortController()
    ctrl.current = c
    setState({ kind: 'loading' })
    const path = token ? `/api/start/leads?c=${encodeURIComponent(token)}` : '/api/start/leads'
    try {
      const res = await getJson<LeadsResponse>(path, mock, c.signal)
      if (res.status === 'no_claim') return router.replace('/start')
      if (res.status === 'failed') return setState({ kind: 'failed', message: res.message, retryable: (res as Failed).retryable === true })
      setState({ kind: 'ready', data: res })
    } catch (err) {
      if (isAbort(err)) return
      console.error('[start] leads load failed', err)
      if (err instanceof StartApiError && (err.status === 401 || err.status === 403)) return setState({ kind: 'expired' })
      // Transport errors (offline, 5xx) are worth another try.
      setState({ kind: 'failed', message: errorCopy(err), retryable: true })
    }
  }, [mock, router, token])

  useEffect(() => {
    void load()
    return () => ctrl.current?.abort()
  }, [load])

  useEffect(() => {
    if (state.kind !== 'loading') return setSlow(false)
    const t = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    return () => window.clearTimeout(t)
  }, [state.kind])

  if (state.kind === 'expired') return <Expired />

  const data = state.kind === 'ready' ? state.data : null
  const leads = data?.leads ?? []
  const landMs = leads.length * LAND_STEP_MS

  return (
    <div className="mx-auto w-full max-w-[72rem] px-5 pb-24 pt-8 sm:px-8 sm:pt-14">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[#6b7280]">{data?.website ? bareDomain(data.website) : 'Your free list'}</p>
          <h1 className="mt-1 text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.04em] text-[#111318] sm:text-[3rem]">
            {state.kind === 'failed' && 'Your leads are stuck.'}
            {state.kind === 'loading' && 'Pulling your 25 leads.'}
            {data && (
              <>
                <AnimatedNumber
                  value={leads.length}
                  from={0}
                  duration={landMs}
                  linear
                  // Padded to the final digit count so neither the digits nor the words after them move while it counts.
                  pad={String(leads.length).length}
                  className="whitespace-pre tabular-nums tracking-normal text-[#007AFF]"
                /> leads,
                ready.
              </>
            )}
            <span className="sr-only">{data ? `${leads.length} leads ready.` : ''}</span>
          </h1>
          {/* Two lines (three on phones) reserved: the loading note and the profile summary swap without moving the table. */}
          <p className={`mt-3 max-w-[62ch] text-[15px] leading-relaxed text-[#4d5460] ${state.kind === 'failed' ? '' : 'min-h-[3.25rem] max-sm:min-h-[4.875rem]'}`}
            role="status">
            {state.kind === 'loading' &&
              (slow
                ? 'Still checking emails. We only keep addresses that pass, so this can take up to a minute.'
                : 'Matching your profile and checking every email. This takes about 20 seconds.')}
            {data && data.icp.summary}
            {state.kind === 'failed' && state.message}
          </p>
        </div>
        {state.kind !== 'failed' && (
          <button
            type="button"
            disabled={!data}
            onClick={() => {
              if (!data) return
              downloadCsv(leads, data.website)
              trackStep('csv', mock)
            }}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-[#1d2025] bg-white px-4 text-[15px] font-semibold text-[#1d2025] transition-colors hover:bg-[#f9fafb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF] disabled:cursor-default disabled:border-[#d1d5db] disabled:text-[#a0a5b1] disabled:hover:bg-white sm:self-auto"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download CSV
          </button>
        )}
      </header>

      {state.kind === 'failed' ? (
        <div className="mt-10 rounded-xl border border-[#e5e7eb] p-6 sm:p-8">
          <p className="text-[15px] text-[#1d2025]">
            {state.retryable
              ? 'Your claim is saved. Try again, or reply to the email we sent and we will fix it by hand.'
              : 'Your claim is saved. Reply to the email we sent and we will sort out your list by hand.'}
          </p>
          {state.retryable && (
            <button
              type="button"
              onClick={() => void load()}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-[#0063E6] px-4 text-[15px] font-semibold text-white hover:bg-[#084fba] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
          )}
        </div>
      ) : (
        <>
          <Facts leads={data ? leads : null} />
          <div className="relative mt-6 overflow-hidden rounded-t-xl border border-b-0 border-[#e5e7eb]">
            {data && <span className="fl-fill absolute inset-x-0 top-0 h-[3px] bg-[#007AFF]" style={{ animationDuration: `${landMs}ms` }} aria-hidden="true" />}
            <table className="w-full table-fixed text-left text-sm max-sm:block">
              <caption className="sr-only">Your {FREE_LEAD_COUNT} leads</caption>
              <thead className="bg-[#f9fafb] text-[12px] font-medium text-[#6b7280] max-sm:hidden">
                <tr>
                  <th scope="col" className="hidden w-12 py-2.5 pl-4 sm:table-cell">#</th>
                  <th scope="col" className="px-4 py-2.5 sm:w-[26%]">Person</th>
                  <th scope="col" className="hidden px-4 py-2.5 md:table-cell">Company</th>
                  <th scope="col" className="hidden w-[14%] px-4 py-2.5 xl:table-cell">Location</th>
                  <th scope="col" className="hidden px-4 py-2.5 sm:table-cell sm:w-[34%] md:w-[30%]">Email</th>
                  <th scope="col" className="w-[4.75rem] px-4 py-2.5">
                    <span className="sr-only">LinkedIn and phone</span>
                  </th>
                </tr>
              </thead>
              {data ? (
                leads.map((l, i) => <LeadRow key={l.id} lead={l} index={i} />)
              ) : (
                <tbody className="divide-y divide-[#f3f4f6] max-sm:block">
                  {Array.from({ length: FREE_LEAD_COUNT }, (_, i) => (
                    <tr key={i} aria-hidden="true" className="fl-rise max-sm:flex" style={{ animationDelay: `${i * 160}ms` }}>
                      <td className="hidden py-3.5 pl-4 text-[13px] tabular-nums text-[#d1d5db] sm:table-cell">{i + 1}</td>
                      <td className="px-4 py-3.5 max-sm:flex-1" colSpan={5}>
                        <div className="flex items-center gap-6">
                          <div className="w-1/4 space-y-1.5">
                            <div className="fl-sheen-ink h-3.5 w-4/5 rounded" />
                            <div className="fl-sheen-ink h-3 w-3/5 rounded" />
                          </div>
                          <div className="fl-sheen-ink hidden h-3.5 w-1/5 rounded md:block" />
                          <div className="fl-sheen-ink hidden h-3.5 w-1/4 rounded sm:block" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
              {/* Delivery can return fewer than 25; with nothing beyond the list there is no locked row to tease. */}
              {data && data.total_matching > leads.length && <LockedRow index={leads.length + 1} total={data.total_matching} delay={landMs} />}
            </table>
          </div>
          {data ? (
            <Ladder mock={mock} firstLead={leads[0] ?? null} />
          ) : (
            <div className="h-24 rounded-b-xl border border-t-0 border-[#e5e7eb]" aria-hidden="true" />
          )}
        </>
      )}
    </div>
  )
}

/** One line of what's in the list. Its slot is held while loading so the table below never moves. */
function Facts({ leads }: { leads: FullLead[] | null }) {
  if (!leads) {
    return <p className="mt-8 h-5 text-sm text-[#6b7280]">Every email is checked before it lands here.</p>
  }
  const linkedin = leads.filter((l) => l.linkedin_url).length
  const phone = leads.filter((l) => l.phone).length
  return (
    <p className="fl-fade mt-8 h-5 truncate text-sm text-[#4d5460]">
      <span className="font-semibold text-[#1d2025]">{leads.length}</span> work emails
      <span className="px-2 text-[#d1d5db]" aria-hidden="true">/</span>
      <span className="font-semibold text-[#1d2025]">{linkedin}</span> LinkedIn
      <span className="px-2 text-[#d1d5db]" aria-hidden="true">/</span>
      <span className="font-semibold text-[#1d2025]">{phone}</span> phones
    </p>
  )
}

/** A lead is its own row group: the contact row, then the "why them" line under it. */
function LeadRow({ lead, index }: { lead: FullLead; index: number }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lead.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch (err) {
      console.error('[start] clipboard write failed', err)
    }
  }
  const name = `${lead.first_name} ${lead.last_name}`
  const pad = `pt-3 ${lead.why ? 'pb-1' : 'pb-3'}`
  const copyButton = (
    <button
      type="button"
      onClick={copy}
      className="fl-compact grid h-7 w-7 shrink-0 place-items-center rounded-md text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#1d2025] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#007AFF]"
      aria-label={copied ? `Copied ${lead.email}` : `Copy ${lead.email}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-[#15803d]" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
    </button>
  )
  return (
    <tbody
      className="fl-land border-t border-[#f3f4f6] first-of-type:border-t-0 hover:bg-[#fafbfc] max-sm:block"
      style={{ animationDelay: `${index * LAND_STEP_MS}ms` }}
    >
      <tr className="max-sm:flex">
        <td className={`hidden pl-4 align-top text-[13px] tabular-nums text-[#6b7280] sm:table-cell ${pad}`}>{index + 1}</td>
        <td className={`px-4 align-top max-sm:min-w-0 max-sm:flex-1 ${pad}`}>
          <div className="truncate font-semibold text-[#1d2025]">{name}</div>
          <div className="truncate text-[13px] text-[#6b7280]">{lead.job_title}</div>
          <div className="truncate text-[13px] text-[#6b7280] md:hidden">{lead.company}</div>
          {/* Phones: the whole email line is the copy target, 44px tall. */}
          <button
            type="button"
            onClick={copy}
            className="-ml-2 flex min-h-11 max-w-[calc(100%+0.5rem)] items-center gap-2 rounded-md px-2 text-left text-[13px] text-[#3a3f4b] active:bg-[#f3f4f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#007AFF] sm:hidden"
            aria-label={copied ? `Copied ${lead.email}` : `Copy ${lead.email}`}
          >
            <span className="truncate">{lead.email}</span>
            {copied ? <Check className="h-3.5 w-3.5 shrink-0 text-[#15803d]" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5 shrink-0 text-[#6b7280]" aria-hidden="true" />}
          </button>
        </td>
        <td className={`hidden px-4 align-top md:table-cell ${pad}`}>
          <div className="truncate font-medium text-[#1d2025]">{lead.company}</div>
          <div className="truncate text-[13px] text-[#6b7280]">
            {[lead.company_size && `${lead.company_size.replace(' to ', '-')} people`, lead.industry].filter(Boolean).join(' · ')}
          </div>
        </td>
        <td className={`hidden truncate px-4 align-top text-[#4d5460] xl:table-cell ${pad}`}>{lead.location ?? ''}</td>
        <td className={`hidden px-4 align-top sm:table-cell ${pad}`}>
          <div className="flex items-center gap-1">
            <a href={`mailto:${lead.email}`} className="fl-compact truncate text-[13px] text-[#1d2025] hover:text-[#0063E6] hover:underline">
              {lead.email}
            </a>
            {copyButton}
          </div>
        </td>
        <td className={`px-4 align-top max-sm:shrink-0 max-sm:pl-0 ${pad}`}>
          <div className="flex gap-1 max-sm:flex-col">
            {lead.linkedin_url ? (
              <a
                href={lead.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="fl-compact grid h-7 w-7 place-items-center rounded-md bg-[#f0f7ff] max-sm:h-11 max-sm:w-11 text-[#0063E6] transition-colors hover:bg-[#d6eaff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#007AFF]"
                aria-label={`${name} on LinkedIn`}
              >
                <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : (
              <span className="h-7 w-7 max-sm:hidden" />
            )}
            {lead.phone && (
              <a
                href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}
                className="fl-compact grid h-7 w-7 place-items-center rounded-md bg-[#f3f4f6] max-sm:h-11 max-sm:w-11 text-[#3a3f4b] transition-colors hover:bg-[#e5e7eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#007AFF]"
                aria-label={`Call ${name}: ${lead.phone}`}
                title={lead.phone}
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        </td>
      </tr>
      {lead.why && (
        <tr className="max-sm:block">
          <td className="hidden sm:table-cell" />
          <td colSpan={5} className="px-4 pb-3 max-sm:block">
            <WhyLine why={lead.why} className="max-w-[90ch]" />
          </td>
        </tr>
      )}
    </tbody>
  )
}

function LockedRow({ index, total, delay }: { index: number; total: number; delay: number }) {
  return (
    <tbody className="fl-rise border-t border-[#f3f4f6] max-sm:block" style={{ animationDelay: `${delay}ms` }}>
      <tr className="relative bg-[#f9fafb] max-sm:flex">
        <td className="hidden py-4 pl-4 align-middle text-[13px] tabular-nums text-[#6b7280] sm:table-cell">{index}</td>
        <td colSpan={5} className="px-4 py-4 max-sm:min-w-0 max-sm:flex-1">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white text-[#1d2025] shadow-enterprise-xs">
              <Lock className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 select-none">
              <p className="text-sm font-semibold text-[#1d2025]">Lead {index} of {formatCount(total)}</p>
              <p className="truncate text-[13px] text-[#6b7280] blur-[3px]" aria-hidden="true">
                Jordan Ellis, Head of Operations, Brightline Labs
              </p>
            </div>
          </div>
        </td>
      </tr>
    </tbody>
  )
}

function Expired() {
  return (
    <div className="mx-auto w-full max-w-[72rem] px-5 pb-24 pt-14 sm:px-8 sm:pt-24">
      <div className="max-w-xl">
        <h1 className="text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.04em] text-[#111318] sm:text-[3rem]">
          This link has expired or was already used.
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#4d5460]">
          Sign-in links work once, for a limited time. Paste your website again and we will send a fresh one.
        </p>
        <Link
          href="/start"
          className="mt-8 inline-flex h-12 items-center rounded-lg bg-[#0063E6] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#084fba] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]"
        >
          Get a new link
        </Link>
      </div>
    </div>
  )
}
