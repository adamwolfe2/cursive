'use client'

import { ArrowRight, Linkedin, Loader2, Phone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useState, type FormEvent } from 'react'
import {
  BOOKING_URL,
  type ClaimResponse,
  type Icp,
  type MaskedLead,
} from '@/lib/free-leads/contract'
import { formatCount } from './AnimatedNumber'
import { CLAIM_STORAGE_KEY, errorCopy, postJson, StartApiError, type Mock } from './api'

function Indicator({ on, label, children }: { on: boolean; label: string; children: React.ReactNode }) {
  return (
    <span
      className={`grid h-7 w-7 place-items-center rounded-md ${on ? 'bg-[#f0f7ff] text-[#0063E6]' : 'text-[#d1d5db]'}`}
      title={on ? label : `No ${label.toLowerCase()}`}
    >
      {children}
      <span className="sr-only">{on ? `Has ${label}` : `No ${label}`}</span>
    </span>
  )
}

export function PreviewTable({ leads, total }: { leads: MaskedLead[] | null; total: number | null }) {
  const rows = leads ?? Array.from({ length: 5 }, () => null)
  return (
    <section aria-labelledby="preview-heading" className="fl-rise">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="preview-heading" className="text-2xl font-semibold tracking-[-0.02em] text-[#1d2025] sm:text-[1.75rem]">
          {leads ? `5 of ${formatCount(total ?? leads.length)}` : total ? `Pulling 5 of ${formatCount(total)}` : 'Pulling 5 of them'}
        </h2>
        <p className="text-sm text-[#6b7280]">Names and emails unlock when you confirm your work email.</p>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-[#e5e7eb]">
        <table className="w-full table-fixed text-left text-sm">
          <caption className="sr-only">Five sample leads, partly hidden</caption>
          <thead className="bg-[#f9fafb] text-[12px] font-medium text-[#6b7280]">
            <tr>
              <th scope="col" className="px-4 py-2.5 sm:w-[24%]">Name</th>
              <th scope="col" className="hidden px-4 py-2.5 sm:table-cell">Company</th>
              <th scope="col" className="hidden px-4 py-2.5 lg:table-cell">Location</th>
              <th scope="col" className="hidden px-4 py-2.5 sm:table-cell">Email</th>
              <th scope="col" className="hidden w-24 px-4 py-2.5 md:table-cell">
                <span className="sr-only">LinkedIn and phone</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3f4f6]">
            {rows.map((lead, i) =>
              lead ? (
                <tr key={i} className="fl-rise" style={{ animationDelay: `${i * 90}ms` }}>
                  <td className="px-4 py-3 align-top">
                    <div className="truncate font-semibold text-[#1d2025]">
                      {lead.first_name}
                      {lead.last_initial ? ` ${lead.last_initial.replace(/\.$/, '')}.` : ''}
                    </div>
                    <div className="truncate text-[13px] text-[#6b7280]">{lead.job_title}</div>
                    <div className="truncate text-[13px] text-[#6b7280] sm:hidden">{lead.company}</div>
                    <div className="mt-1 truncate font-mono text-[12px] text-[#3a3f4b] sm:hidden">{lead.email_masked}</div>
                  </td>
                  <td className="hidden px-4 py-3 align-top sm:table-cell">
                    <div className="truncate font-medium text-[#1d2025]">{lead.company}</div>
                    <div className="truncate text-[13px] text-[#6b7280]">{lead.company_domain}</div>
                  </td>
                  <td className="hidden truncate px-4 py-3 align-top text-[#4d5460] lg:table-cell">{lead.location ?? ''}</td>
                  <td className="hidden px-4 py-3 align-top sm:table-cell">
                    <span className="block truncate font-mono text-[13px] text-[#3a3f4b]">{lead.email_masked}</span>
                  </td>
                  <td className="hidden px-4 py-3 align-top md:table-cell">
                    <div className="flex gap-1">
                      <Indicator on={lead.has_linkedin} label="LinkedIn">
                        <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
                      </Indicator>
                      <Indicator on={lead.has_phone} label="Phone">
                        <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      </Indicator>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={i} aria-hidden="true">
                  <td className="px-4 py-3.5" colSpan={5}>
                    <div className="fl-sheen-ink h-9 rounded-md" style={{ animationDelay: `${i * 120}ms` }} />
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
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

export function ClaimForm({ website, icp, mock }: { website: string | null; icp: Icp; mock: Mock }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<ClaimState>({ kind: 'idle' })
  const id = useId()
  const msgId = useId()

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

  return (
    <section aria-labelledby="claim-heading" className="fl-rise rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-5 py-7 sm:px-10 sm:py-9">
      <h2 id="claim-heading" className="text-2xl font-semibold tracking-[-0.02em] text-[#1d2025] sm:text-[1.75rem]">
        Get all 25, names and emails included.
      </h2>
      <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-[#4d5460]">
        We send a sign-in link to your work email. Open it and your 25 leads are waiting, ready to download.
      </p>
      <form onSubmit={submit} className="mt-6 max-w-xl" noValidate>
        <label htmlFor={id} className="text-sm font-medium text-[#1d2025]">
          Work email
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
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
            aria-invalid={state.kind === 'personal_email' || state.kind === 'error' || undefined}
            aria-describedby={message ? msgId : undefined}
            className="h-12 w-full min-w-0 shrink-0 rounded-lg border sm:flex-1 border-[#d1d5db] bg-white px-4 text-base text-[#1d2025] placeholder:text-[#a0a5b1] transition-colors focus:border-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/15 aria-[invalid]:border-[#dc2626]"
          />
          <button
            type="submit"
            disabled={state.kind === 'sending'}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#007AFF] px-5 text-[15px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-[#0063E6] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF] disabled:opacity-70"
          >
            {state.kind === 'sending' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            )}
            Send my 25 leads
          </button>
        </div>
        <div id={msgId} role="alert" className="mt-3 min-h-5 text-sm">
          {message && (
            <p className={state.kind === 'personal_email' || state.kind === 'error' ? 'text-[#b91c1c]' : 'text-[#3a3f4b]'}>
              {message}
              {state.kind === 'already_claimed' && (
                <>
                  {' '}
                  <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-[#0063E6] underline underline-offset-4">
                    Book a call
                  </a>
                </>
              )}
            </p>
          )}
        </div>
        <p className="text-[13px] text-[#6b7280]">No card. One free list per company.</p>
      </form>
    </section>
  )
}
