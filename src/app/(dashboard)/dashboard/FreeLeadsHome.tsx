import Link from 'next/link'
import { ArrowRight, BarChart3, CalendarClock, Download, Send, Sparkles } from 'lucide-react'
import type { FullLead, Icp } from '@/lib/free-leads/contract'
import '@/app/start/start.css'
import { StripeButton, UpgradeButton } from './UpgradeButton'
import { brandName, icpChips, leadStats, nextMonday, shortDate } from './home-helpers'

/**
 * Home for a workspace provisioned by the free-leads flow (/start).
 *
 * The visitor just got 25 leads for free. This page shows only that: their company, who we
 * looked for, the list, and the next steps up. None of the marketplace chrome (pixel setup,
 * credits, daily quotas, changelog modal) applies yet.
 */

interface Props {
  domain: string
  icp: Icp | null
  leads: FullLead[]
  totalMatching: number | null
  /** Latest weekly-leads order for this workspace, if any. */
  weekly: { state: string; trialEndsAt: string | null } | null
  /** Back from Stripe Checkout; the webhook may not have landed yet. */
  justStarted: boolean
}

const LIVE = new Set(['active', 'past_due', 'paused', 'incomplete'])

const FOCUS = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]'

export function FreeLeadsHome({ domain, icp, leads, totalMatching, weekly, justStarted }: Props) {
  const weeklyOn = Boolean(weekly && LIVE.has(weekly.state))
  const brand = brandName(domain)
  const stats = leadStats(leads)
  const chips = icpChips(icp)
  const inTrial = Boolean(weekly?.trialEndsAt && new Date(weekly.trialEndsAt) > new Date())

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 pb-16">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote favicon, any host */}
          <img
            src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 rounded-xl border border-[#e5e7eb] bg-white object-contain p-2"
          />
          <div className="min-w-0">
            <p className="text-sm text-[#6b7280]">{domain} workspace</p>
            <h1 className="mt-1 text-[1.75rem] font-bold leading-tight tracking-[-0.02em] text-[#111827] sm:text-[2.25rem]">
              {leads.length > 0 ? (
                <>
                  Your leads for <span className="text-[#007AFF]">{brand}</span>
                </>
              ) : (
                <>
                  Your workspace for <span className="text-[#007AFF]">{brand}</span>
                </>
              )}
            </h1>
            {icp?.summary && (
              <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-[#4b5563]">
                <span className="font-medium text-[#111827]">Who we look for:</span> {icp.summary}
              </p>
            )}
            {chips.length > 0 && (
              <ul aria-label="Your buyer profile" className="mt-3 flex flex-wrap gap-1.5">
                {chips.map((c) => (
                  <li key={c} className="rounded-full border border-[#cfe4ff] bg-[#F0F7FF] px-2.5 py-0.5 text-xs text-[#0050B3]">
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {leads.length > 0 && (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Link
              href="/start/leads"
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#d1d5db] bg-white px-4 text-[15px] font-medium text-[#111827] transition-colors hover:bg-[#f9fafb] ${FOCUS}`}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download CSV
            </Link>
            <Link
              href="/leads"
              className={`group inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#007AFF] px-4 text-[15px] font-medium text-white transition-colors hover:bg-[#0066DD] ${FOCUS}`}
            >
              Open all {leads.length}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        )}
      </header>

      <section aria-label="Delivery status" className="flex items-start gap-3 rounded-xl border border-[#cfe4ff] bg-[#F0F7FF] px-5 py-4">
        <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-[#007AFF]" aria-hidden="true" />
        <div className="text-[15px] text-[#111827]">
          {weeklyOn ? (
            <>
              <p role="status" className="font-medium">Your next 25 arrive {nextMonday()}.</p>
              <p className="text-sm text-[#4b5563]">
                Same buyer profile, new people, here and in your inbox.
                {inTrial && weekly?.trialEndsAt ? ` Free until ${shortDate(weekly.trialEndsAt)}.` : ''}
              </p>
            </>
          ) : justStarted ? (
            <p role="status" className="font-medium">Payment received. Turning weekly leads on now; refresh in a minute.</p>
          ) : (
            <>
              <p className="font-medium">Weekly leads are off.</p>
              <p className="text-sm text-[#4b5563]">Your 25 stay here free. Turn on weekly leads below to get 25 new people every Monday.</p>
            </>
          )}
        </div>
      </section>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value }, i) => (
          <div key={label} style={{ animationDelay: `${i * 60}ms` }} className="fl-rise rounded-xl border border-[#e5e7eb] bg-white p-5">
            <dt className="text-sm text-[#6b7280]">{label}</dt>
            <dd className="mt-1 text-[2rem] font-bold tabular-nums tracking-[-0.02em] text-[#111827]">{value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="fl-top" className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
        <div className="flex flex-col gap-1 border-b border-[#f3f4f6] px-5 py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <h2 id="fl-top" className="text-[17px] font-semibold text-[#111827]">Best fits first</h2>
          {totalMatching ? (
            <p className="text-sm text-[#6b7280]">
              Picked from <span className="tabular-nums text-[#111827]">{totalMatching.toLocaleString('en-US')}</span> people who fit
            </p>
          ) : null}
        </div>
        {leads.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[15px] font-medium text-[#111827]">No leads in this workspace yet.</p>
            <p className="mx-auto mt-1 max-w-[46ch] text-sm text-[#6b7280]">
              Paste your website and we will find 25 people who fit, with a checked work email and a reason for each one.
            </p>
            <Link
              href="/start"
              className={`mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-[#007AFF] px-5 text-[15px] font-medium text-white transition-colors hover:bg-[#0066DD] ${FOCUS}`}
            >
              Get my 25 leads
            </Link>
          </div>
        ) : (
          <ol className="divide-y divide-[#f3f4f6]">
            {leads.slice(0, 5).map((l, i) => (
              <li key={l.id} style={{ animationDelay: `${120 + i * 70}ms` }} className="fl-rise grid gap-1 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-6">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-[#111827]">
                    {l.first_name} {l.last_name}
                  </p>
                  <p className="truncate text-sm text-[#6b7280]">
                    {l.job_title}, {l.company}
                  </p>
                </div>
                <p className="min-w-0 text-sm leading-snug text-[#4b5563]">
                  {l.why ? (
                    <>
                      <span className="font-medium text-[#0066DD]">Why them </span>
                      {l.why}
                    </>
                  ) : (
                    l.location
                  )}
                </p>
                <p className="truncate text-sm text-[#374151] sm:text-right">{l.email}</p>
              </li>
            ))}
          </ol>
        )}
        {leads.length > 0 && (
          <div className="border-t border-[#f3f4f6] bg-[#F7F9FB] px-5 py-3 text-sm">
            <Link href="/leads" className="text-[#0066DD] underline decoration-[#b3d7ff] underline-offset-4 hover:decoration-[#007AFF]">
              See all {leads.length} in your leads list
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="fl-next">
        <h2 id="fl-next" className="text-[1.5rem] font-bold tracking-[-0.02em] text-[#111827] sm:text-[1.75rem]">Where to go from here</h2>
        <p className="mt-1 text-[15px] text-[#4b5563]">Find, reach, run. You have the first one. Pick the next.</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <article className="fl-card relative flex flex-col rounded-xl border-2 border-[#007AFF] bg-white p-6">
            <span className="absolute -top-3 left-5 rounded-full bg-[#007AFF] px-2.5 py-0.5 text-xs font-medium text-white">
              {weeklyOn ? 'On' : 'Most teams start here'}
            </span>
            <CalendarClock className="h-6 w-6 text-[#007AFF]" strokeWidth={1.5} aria-hidden="true" />
            <h3 className="mt-4 text-xl font-semibold text-[#111827]">25 new leads every Monday</h3>
            <p className="mt-2 flex-1 text-[15px] leading-relaxed text-[#4b5563]">
              Same buyer profile, fresh people each week, never a repeat. Lands right here and in your inbox.
            </p>
            {weeklyOn ? (
              <div className="mt-4">
                <p className="text-sm text-[#6b7280]">Starter, $197/mo. Cancel anytime.</p>
                <div className="mt-2">
                  <StripeButton path="/api/start/billing" label="Manage billing or cancel" quiet />
                </div>
              </div>
            ) : (
              <>
                <p className="mt-4 text-sm text-[#111827]">
                  14 days free, then $197/mo. <span className="text-[#6b7280]">Cancel anytime.</span>
                </p>
                <div className="mt-4">
                  <StripeButton path="/api/start/checkout" label="Start free for 14 days" />
                </div>
              </>
            )}
          </article>
          <article className="fl-card flex flex-col rounded-xl border border-[#e5e7eb] bg-white p-6">
            <Send className="h-6 w-6 text-[#374151]" strokeWidth={1.5} aria-hidden="true" />
            <h3 className="mt-4 text-xl font-semibold text-[#111827]">We run the outreach</h3>
            <p className="mt-2 flex-1 text-[15px] leading-relaxed text-[#4b5563]">
              Email and LinkedIn written in your voice and sent for you. You approve the first batch, then only take the replies.
            </p>
            <p className="mt-4 text-sm text-[#6b7280]">From $1,497/mo. Weekly leads included.</p>
            <div className="mt-4">
              <UpgradeButton tier="linkedin_outreach" label="Talk to us about outreach" />
            </div>
          </article>
          <article className="fl-card flex flex-col rounded-xl border border-[#e5e7eb] bg-white p-6">
            <BarChart3 className="h-6 w-6 text-[#374151]" strokeWidth={1.5} aria-hidden="true" />
            <h3 className="mt-4 text-xl font-semibold text-[#111827]">One pipeline dashboard</h3>
            <p className="mt-2 flex-1 text-[15px] leading-relaxed text-[#4b5563]">
              Every lead, reply, meeting and dollar in one view, built around how you sell, connected to the tools you already use.
            </p>
            <p className="mt-4 text-sm text-[#6b7280]">From $2,500 setup + $500/mo.</p>
            <div className="mt-4">
              <UpgradeButton tier="ai_dashboard" label="See what it looks like" />
            </div>
          </article>
        </div>
        <p className="mt-5 flex items-center gap-2 text-sm text-[#6b7280]">
          <Sparkles className="h-4 w-4 text-[#007AFF]" aria-hidden="true" />
          Your 25 stay in this workspace for good, free. Nothing is sent to anyone on your behalf.
        </p>
      </section>
    </div>
  )
}
