'use client'

import { ArrowRight, ArrowUpRight, Linkedin, Loader2, Phone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  BOOKING_URL,
  FREE_LEAD_COUNT,
  type ClaimResponse,
  type Icp,
  type MaskedLead,
} from '@/lib/free-leads/contract'
import { formatCount } from './AnimatedNumber'
import { CLAIM_STORAGE_KEY, errorCopy, postJson, StartApiError, type Mock } from './api'

/** Shown only when the lead has it; an empty slot keeps the column aligned, same as the full list. */
function Indicator({ on, label, children }: { on: boolean; label: string; children: React.ReactNode }) {
  if (!on) return <span className="h-7 w-7" />
  return (
    <span className="grid h-7 w-7 place-items-center rounded-md bg-[#f0f7ff] text-[#0063E6]" title={label}>
      {children}
      <span className="sr-only">Has {label}</span>
    </span>
  )
}

/** "Why them" line under a lead. Renders nothing when the fit check had no answer. */
export function WhyLine({ why, className = '' }: { why: string | null; className?: string }) {
  if (!why) return null
  return (
    <p className={`text-[13px] leading-snug text-[#3a3f4b] ${className}`}>
      <span className="mr-1.5 font-semibold text-[#0063E6]">Why them</span>
      {why}
    </p>
  )
}

/** Five masked rows from the approved profile. Rows mount together when the preview lands; nothing is faked before. */
export function PreviewTable({ leads, total }: { leads: MaskedLead[] | null; total: number | null }) {
  return (
    <section aria-labelledby="preview-heading" aria-busy={!leads}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 id="preview-heading" className="flex items-center gap-2 text-lg font-semibold tracking-[-0.01em] text-[#1d2025]">
          {!leads && <Loader2 className="h-4 w-4 animate-spin text-[#007AFF]" aria-hidden="true" />}
          {leads ? `A first look: 5 of ${formatCount(total ?? leads.length)}` : 'Pulling 5 of them to show you'}
        </h3>
        <p className="text-sm text-[#6b7280]">Full names and emails unlock with your work email.</p>
      </div>

      {leads && (
        <ol aria-label="Five sample leads, partly hidden" className="mt-4 divide-y divide-[#f3f4f6] overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
          {leads.map((lead, i) => (
            <li
              key={i}
              className="fl-rise grid gap-x-6 gap-y-1 px-4 py-3.5 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:px-5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-[#1d2025]">
                  {lead.first_name}
                  {lead.last_initial ? ` ${lead.last_initial.replace(/\.$/, '')}.` : ''}
                </p>
                <p className="truncate text-[13px] text-[#6b7280]">
                  {lead.job_title}
                  <span className="sm:hidden">, {lead.company}</span>
                </p>
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-medium text-[#1d2025]">{lead.company}</p>
                <p className="truncate text-[13px] text-[#6b7280]">{lead.location ?? lead.company_domain}</p>
              </div>
              <p className="truncate text-[13px] text-[#3a3f4b] sm:self-center sm:text-sm">{lead.email_masked}</p>
              <div className="hidden gap-1 self-center sm:flex">
                <Indicator on={lead.has_linkedin} label="LinkedIn">
                  <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
                </Indicator>
                <Indicator on={lead.has_phone} label="Phone">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                </Indicator>
              </div>
              <WhyLine why={lead.why} className="mt-1 sm:col-span-full" />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type ClaimState =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'personal_email' }
  | { kind: 'already_claimed' }
  | { kind: 'rate_limited' }
  | { kind: 'error'; message: string }

/** The work-email step. Mounts right after Approve and takes focus. */
export function ClaimForm({ website, icp, mock }: { website: string | null; icp: Icp; mock: Mock }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<ClaimState>({ kind: 'idle' })
  const id = useId()
  const msgId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => inputRef.current?.focus({ preventScroll: true }), [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const value = email.trim().toLowerCase()
    if (state.kind === 'sending') return
    if (!EMAIL.test(value)) return setState({ kind: 'error', message: 'Enter your work email, like you@company.com.' })
    setState({ kind: 'sending' })
    // Description-only scans have no site; the work email's domain is the company's site.
    const body = { email: value, website: website ?? value.split('@')[1], icp }
    try {
      const res = await postJson<ClaimResponse>('/api/start/claim', body, mock)
      if (res.status === 'sent') {
        sessionStorage.setItem(CLAIM_STORAGE_KEY, JSON.stringify(body))
        router.push(`/start/check-email?email=${encodeURIComponent(value)}${mock ? `&mock=${mock}` : ''}`)
        return
      }
      setState({ kind: res.status })
    } catch (err) {
      console.error('[start] claim failed', err)
      // 400 bodies from the claim route are already human ("Enter a valid work email.").
      const serverDown = err instanceof StartApiError && err.status >= 500
      setState({
        kind: 'error',
        message: serverDown
          ? "We couldn't send your link just now. Your list is saved on this page, so try again in a minute."
          : errorCopy(err, err instanceof Error ? err.message : undefined),
      })
    }
  }

  const message = (() => {
    switch (state.kind) {
      case 'personal_email':
        return 'That looks like a personal inbox. Use your work email so we can tie the leads to your company.'
      case 'already_claimed':
        return 'Your company already has its free 25. Check your inbox for the earlier link, or book a call and we will set you up with more.'
      case 'rate_limited':
        return 'Too many tries from this network. Give it a few minutes and try again.'
      case 'error':
        return state.message
      default:
        return null
    }
  })()
  const invalid = state.kind === 'personal_email' || state.kind === 'error'

  return (
    <form onSubmit={submit} noValidate aria-labelledby="claim-heading">
      <h2 id="claim-heading" className="text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.025em] text-[#111318] sm:text-[2.5rem]">
        Get {FREE_LEAD_COUNT} leads like this.
      </h2>
      <p className="mt-3 max-w-[58ch] text-[15px] leading-relaxed text-[#4d5460] sm:text-[17px]">
        We send a sign-in link to your work email. Open it and your {FREE_LEAD_COUNT} are waiting: names, titles, work emails,
        and why each one fits.
      </p>
      <label htmlFor={id} className="mt-7 block text-sm font-medium text-[#1d2025]">
        Work email
      </label>
      <div className="mt-2 flex max-w-2xl flex-col gap-2 sm:flex-row">
        <input
          ref={inputRef}
          id={id}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (state.kind !== 'sending' && state.kind !== 'idle') setState({ kind: 'idle' })
          }}
          placeholder="you@company.com"
          aria-invalid={invalid || undefined}
          aria-describedby={message ? msgId : undefined}
          className="h-14 w-full min-w-0 rounded-xl border-[1.5px] border-[#1d2025] bg-white px-4 text-base text-[#1d2025] placeholder:text-[#a0a5b1] transition-colors focus:border-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/15 aria-[invalid]:border-[#dc2626] sm:flex-1"
        />
        <button
          type="submit"
          disabled={state.kind === 'sending'}
          className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0063E6] px-6 text-base font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[#084fba] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF] disabled:opacity-70"
        >
          Send my {FREE_LEAD_COUNT} leads
          {state.kind === 'sending' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {/* One slot: the reassurance line gives way to any message, so a one-line message never moves the preview. */}
      <div className="mt-3 min-h-5 max-w-2xl text-sm">
        <div id={msgId} role="alert">
          {message && <p className={invalid ? 'text-[#b91c1c]' : 'text-[#3a3f4b]'}>{message}</p>}
        </div>
        {state.kind === 'already_claimed' && (
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex h-11 items-center gap-1.5 font-semibold text-[#0063E6] underline decoration-[#b3d7ff] underline-offset-4 hover:decoration-[#0063E6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]"
          >
            Book a call
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
        {!message && <p className="text-[13px] text-[#6b7280]">No card. One free list per company.</p>}
      </div>
    </form>
  )
}
