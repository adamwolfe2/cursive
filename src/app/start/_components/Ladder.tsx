'use client'

import { ArrowRight, ArrowUpRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { BOOKING_URL, type FullLead, type InterestResponse, type UpgradeTier } from '@/lib/free-leads/contract'
import { isAbort, postJson, StartApiError, type Mock } from './api'
import { DashboardPreview } from './DashboardPreview'

const DASHBOARD_EXAMPLES_URL = 'https://leads.amcollectivecapital.com'

function useInterest(mock: Mock) {
  const router = useRouter()
  const [busy, setBusy] = useState<UpgradeTier | null>(null)
  const [done, setDone] = useState<UpgradeTier | null>(null)
  const inFlight = useRef(false)
  const choose = async (tier: UpgradeTier) => {
    if (inFlight.current) return
    inFlight.current = true
    if (tier === 'weekly_leads' && !mock) {
      // Self-serve: straight to Stripe Checkout (same tab). The server binds it to this workspace.
      setBusy(tier)
      try {
        const { url } = await postJson<{ url: string }>('/api/start/checkout', {}, mock)
        return window.location.assign(url)
      } catch (err) {
        inFlight.current = false
        setBusy(null)
        if (err instanceof StartApiError && err.status === 409) return router.push('/dashboard')
        if (err instanceof StartApiError && err.status === 401) return router.replace('/start')
        console.error('[start] checkout failed, falling back to the booking page', err)
        return window.location.assign(BOOKING_URL)
      }
    }
    // Open synchronously inside the click so popup blockers allow it, then point it at the booking page.
    const win = window.open('about:blank', '_blank')
    if (win) win.opener = null
    setBusy(tier)
    let url = BOOKING_URL
    try {
      url = (await postJson<InterestResponse>('/api/start/interest', { tier }, mock)).booking_url
    } catch (err) {
      if (err instanceof StartApiError && err.status === 401) {
        // Session gone: nothing to book against. Close the blank tab and start again.
        win?.close()
        inFlight.current = false
        return router.replace('/start')
      }
      if (!isAbort(err)) console.error('[start] interest not recorded, opening default booking page', err)
    }
    if (win) win.location.href = url
    else window.location.href = url
    setBusy(null)
    setDone(tier)
    inFlight.current = false
  }
  return { busy, done, choose }
}

function Cta({
  tier,
  label,
  tone,
  interest,
}: {
  tier: UpgradeTier
  label: string
  tone: 'white' | 'ink'
  interest: ReturnType<typeof useInterest>
}) {
  const styles =
    tone === 'white'
      ? 'bg-white text-[#0066DD] hover:bg-[#f0f7ff] focus-visible:outline-white'
      : 'bg-[#111827] text-white hover:bg-[#1f2937] focus-visible:outline-[#007AFF]'
  return (
    <div>
      <button
        type="button"
        onClick={() => void interest.choose(tier)}
        disabled={interest.busy !== null}
        className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-[15px] font-semibold transition-[background-color,transform] duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-70 ${styles}`}
      >
        {label}
        {interest.busy === tier ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </button>
      <p role="status" className={`mt-2 min-h-5 text-[13px] ${tone === 'white' ? 'text-white' : 'text-[#4b5563]'}`}>
        {interest.done === tier ? 'Booking page opened in a new tab.' : ''}
      </p>
    </div>
  )
}

export function Ladder({ mock, leads, website }: { mock: Mock; leads: FullLead[]; website: string | null }) {
  const interest = useInterest(mock)
  return (
    <>
      {/* Rung 1 sits flush under lead 26: the paywall is the next row. */}
      <section aria-labelledby="rung-weekly" className="fl-rise rounded-b-xl bg-[#007AFF] px-5 py-8 text-white sm:px-10 sm:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[40rem]">
            <h2 id="rung-weekly" className="text-[1.75rem] font-light leading-[1.1] tracking-[-0.02em] sm:text-[2.5rem]">
              Get 25 new leads like these,
              <span className="block text-[#007AFF] pt-0.5">every Monday.</span>
            </h2>
            <p className="mt-3 text-base leading-relaxed text-white sm:text-[17px]">
              Same buyer profile you approved, fresh contacts each week, never a repeat. Work emails and LinkedIn links included.
            </p>
            <p className="mt-3 text-[15px] text-white">
              14 days free, then $197/mo. <span className="text-white/80">Cancel anytime.</span>
            </p>
          </div>
          <Cta tier="weekly_leads" label="Start free for 14 days" tone="white" interest={interest} />
        </div>
        <NextMondays />

        <p className="mt-6 border-t border-white/20 pt-5 text-[15px] text-white">
          Worried you won&apos;t get to them all?{' '}
          <a href="#rung-linkedin" className="inline-flex min-h-11 items-center font-semibold underline decoration-white/50 underline-offset-4 hover:decoration-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            We can reach out for you.
          </a>
        </p>
      </section>

      {/* Rung 2: text left, the approval queue it describes on the right. */}
      <section
        aria-labelledby="rung-linkedin"
        className="mt-24 grid scroll-mt-8 items-center gap-10 sm:mt-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16"
      >
        <div className="max-w-[36rem]">
          <h2 id="rung-linkedin" className="text-[1.75rem] font-light leading-[1.1] tracking-[-0.02em] text-[#111827] sm:text-[2.25rem]">
            We message your leads on LinkedIn so you only take the replies.
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[#4b5563]">
            Written in your voice, sent from your profile, you approve the first batch.
          </p>
          <div className="mt-7">
            <Cta tier="linkedin_outreach" label="Talk about LinkedIn outreach" tone="ink" interest={interest} />
          </div>
        </div>
        <ApprovalQueue lead={leads[0] ?? null} />
      </section>

      {/* Rung 3: flipped, the dashboard leads. */}
      <section
        aria-labelledby="rung-dashboard"
        className="mt-24 grid items-center gap-10 border-t border-[#e5e7eb] pt-24 sm:mt-32 sm:pt-32 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16"
      >
        <div className="order-2 lg:order-1">
          <DashboardPreview website={website} leads={leads} />
        </div>
        <div className="order-1 max-w-[34rem] lg:order-2">
          <h2 id="rung-dashboard" className="text-[1.75rem] font-light leading-[1.1] tracking-[-0.02em] text-[#111827] sm:text-[2.25rem]">
            One dashboard that shows where every lead, reply, and dollar stands.
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[#4b5563]">
            Connect your tools and in 14 days you get a live view built around how you sell.
          </p>
          <div className="mt-7 flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-6">
            <Cta tier="ai_dashboard" label="Book a dashboard call" tone="ink" interest={interest} />
            <a
              href={DASHBOARD_EXAMPLES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-1.5 self-start text-[15px] font-semibold text-[#0066DD] underline decoration-[#b3d7ff] underline-offset-4 hover:decoration-[#007AFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]"
            >
              See dashboards we&apos;ve built
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

/** The next four Mondays on the weekly plan, with the running total. Rendered client-side only (after the leads load). */
function NextMondays() {
  const day = new Date()
  day.setHours(0, 0, 0, 0)
  day.setDate(day.getDate() + (((8 - day.getDay()) % 7) || 7))
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  const mondays = Array.from({ length: 4 }, (_, i) => fmt.format(new Date(day.getTime() + i * 7 * 86_400_000)))
  return (
    <ol aria-label="Your next four Mondays on the weekly plan" className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {mondays.map((label, i) => (
        <li
          key={label}
          className="fl-rise rounded-lg bg-white/10 px-3.5 py-3 ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/15"
          style={{ animationDelay: `${200 + i * 90}ms` }}
        >
          <p className="text-[13px] text-white">Mon, {label}</p>
          <p className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-xl font-semibold tabular-nums">+25</span>
            <span className="text-[13px] text-white">{(i + 2) * 25} total</span>
          </p>
        </li>
      ))}
    </ol>
  )
}

/** Illustrative draft built from their own first lead, so the rung describes their list, not a stock example. */
function ApprovalQueue({ lead }: { lead: FullLead | null }) {
  const first = lead?.first_name ?? 'Rachel'
  const who = lead ? `${lead.first_name} ${lead.last_name}` : 'Rachel Jones'
  const role = lead ? `${lead.job_title}, ${lead.company}` : 'VP of Engineering, Ledgerline'
  const initials = who
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
  return (
    <figure aria-label="Example of a LinkedIn message waiting for your approval" className="relative">
      <div className="absolute inset-x-6 -top-3 h-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb]" aria-hidden="true" />
      <div className="relative rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-enterprise-sm" aria-hidden="true">
        <div className="flex items-center justify-between text-[12px] font-medium text-[#6b7280]">
          <span>Draft 1 of 25</span>
          <span>Waiting for you</span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f0f7ff] text-sm font-semibold text-[#0066DD]">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111827]">{who}</p>
            <p className="truncate text-[13px] text-[#6b7280]">{role}</p>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-[#f3f4f6] p-4 text-[14px] leading-relaxed text-[#111827]">
          <p>Hi {first}, quick one.</p>
          <div className="mt-2.5 space-y-2">
            <div className="h-2.5 w-full rounded bg-[#d1d5db]" />
            <div className="h-2.5 w-11/12 rounded bg-[#d1d5db]" />
            <div className="h-2.5 w-2/3 rounded bg-[#d1d5db]" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <span className="inline-flex h-9 flex-1 items-center justify-center rounded-md bg-[#007AFF] text-sm font-semibold text-white">
            Approve
          </span>
          <span className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-[#d1d5db] text-sm font-semibold text-[#111827]">
            Edit
          </span>
        </div>
      </div>
    </figure>
  )
}
