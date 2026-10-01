import Link from 'next/link'
import { ArrowRight, BarChart3, CalendarClock, Download, Send, Sparkles } from 'lucide-react'
import type { FullLead, Icp } from '@/lib/free-leads/contract'
import { scriptFont } from '@/app/start/_components/script-font'
import '@/app/start/start.css'
import { UpgradeButton } from './UpgradeButton'

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
}

const DECISION = /^(c-?team|c-suite|cxo|vp|director|owner|founder|partner)/i

function brandName(domain: string): string {
  const root = domain.replace(/^www\./, '').split('.')[0] ?? domain
  return root.charAt(0).toUpperCase() + root.slice(1)
}

export function FreeLeadsHome({ domain, icp, leads, totalMatching }: Props) {
  const brand = brandName(domain)
  const deciders = leads.filter((l) => DECISION.test(l.seniority ?? '') || /chief|founder|owner|vp|head|director|president/i.test(l.job_title)).length
  const companies = new Set(leads.map((l) => l.company_domain ?? l.company)).size
  const stats: Array<[string, string]> = [
    ['Leads in your list', String(leads.length)],
    ['With a work email', String(leads.filter((l) => l.email).length)],
    ['Decision makers', String(deciders)],
    ['Companies', String(companies)],
  ]

  return (
    <div className={`${scriptFont.variable} mx-auto w-full max-w-6xl space-y-10 pb-16`}>
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote favicon, any host */}
          <img
            src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 rounded-xl border border-[#e5e7eb] bg-white object-contain p-2"
          />
          <div>
            <p className="text-sm text-[#6b7280]">{domain} workspace</p>
            <h1 className="mt-1 text-[2rem] font-light leading-tight tracking-[-0.02em] text-[#111827] sm:text-[2.5rem]">
              Welcome to Cursive,{' '}
              <span className="fl-script fl-write inline-block text-[2.5rem] leading-none text-[#007AFF] sm:text-[3.25rem]">{brand}.</span>
            </h1>
            {icp?.summary && (
              <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-[#4b5563]">
                <span className="text-[#111827]">Who we look for:</span> {icp.summary}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/start/leads"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#d1d5db] bg-white px-4 text-[15px] text-[#111827] transition-colors hover:bg-[#f9fafb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download CSV
          </Link>
          <Link
            href="/leads"
            className="group inline-flex h-11 items-center gap-2 rounded-lg bg-[#007AFF] px-4 text-[15px] text-white transition-colors hover:bg-[#0066DD] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]"
          >
            Open all {leads.length}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, value], i) => (
          <div key={label} style={{ animationDelay: `${i * 60}ms` }} className="fl-rise rounded-xl border border-[#e5e7eb] bg-white p-5">
            <dt className="text-sm text-[#6b7280]">{label}</dt>
            <dd className="mt-1 text-[2rem] font-light tabular-nums tracking-[-0.02em] text-[#111827]">{value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="fl-top" className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
        <div className="flex items-baseline justify-between gap-4 border-b border-[#f3f4f6] px-5 py-4">
          <h2 id="fl-top" className="text-[17px] text-[#111827]">Best fits first</h2>
          {totalMatching ? (
            <p className="text-sm text-[#6b7280]">
              Picked from <span className="tabular-nums text-[#111827]">{totalMatching.toLocaleString('en-US')}</span> people who fit
            </p>
          ) : null}
        </div>
        <ol className="divide-y divide-[#f3f4f6]">
          {leads.slice(0, 5).map((l, i) => (
            <li key={l.id} style={{ animationDelay: `${120 + i * 70}ms` }} className="fl-rise grid gap-1 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-6">
              <div className="min-w-0">
                <p className="truncate text-[15px] text-[#111827]">
                  {l.first_name} {l.last_name}
                </p>
                <p className="truncate text-sm text-[#6b7280]">
                  {l.job_title}, {l.company}
                </p>
              </div>
              <p className="min-w-0 text-sm leading-snug text-[#4b5563]">
                {l.why ? (
                  <>
                    <span className="text-[#0066DD]">Why them </span>
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
        <div className="border-t border-[#f3f4f6] bg-[#F7F9FB] px-5 py-3 text-sm">
          <Link href="/leads" className="text-[#0066DD] underline decoration-[#b3d7ff] underline-offset-4 hover:decoration-[#007AFF]">
            See all {leads.length} in your leads list
          </Link>
        </div>
      </section>

      <section aria-labelledby="fl-next">
        <h2 id="fl-next" className="text-[1.75rem] font-light tracking-[-0.02em] text-[#111827]">
          Where to go{' '}
          <span className="fl-script inline-block text-[2.25rem] leading-none text-[#6b7280]">from here.</span>
        </h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <article className="fl-card relative flex flex-col rounded-xl border-2 border-[#007AFF] bg-white p-6">
            <span className="absolute -top-3 left-5 rounded-full bg-[#007AFF] px-2.5 py-0.5 text-xs text-white">Most teams start here</span>
            <CalendarClock className="h-6 w-6 text-[#007AFF]" strokeWidth={1.5} aria-hidden="true" />
            <h3 className="mt-4 text-xl text-[#111827]">25 new leads every Monday</h3>
            <p className="mt-2 flex-1 text-[15px] leading-relaxed text-[#4b5563]">
              Same buyer profile, fresh people each week, never a repeat. Lands right here and in your inbox.
            </p>
            <p className="mt-4 text-sm text-[#111827]">
              14 days free, then $197/mo. <span className="text-[#6b7280]">Cancel anytime.</span>
            </p>
            <div className="mt-4">
              <UpgradeButton tier="weekly_leads" label="Start free for 14 days" primary />
            </div>
          </article>
          <article className="fl-card flex flex-col rounded-xl border border-[#e5e7eb] bg-white p-6">
            <Send className="h-6 w-6 text-[#374151]" strokeWidth={1.5} aria-hidden="true" />
            <h3 className="mt-4 text-xl text-[#111827]">We run the outreach</h3>
            <p className="mt-2 flex-1 text-[15px] leading-relaxed text-[#4b5563]">
              Email and LinkedIn written in your voice and sent for you. You approve the first batch, then only take the replies.
            </p>
            <p className="mt-4 text-sm text-[#6b7280]">Weekly leads included.</p>
            <div className="mt-4">
              <UpgradeButton tier="linkedin_outreach" label="Talk to us about outreach" />
            </div>
          </article>
          <article className="fl-card flex flex-col rounded-xl border border-[#e5e7eb] bg-white p-6">
            <BarChart3 className="h-6 w-6 text-[#374151]" strokeWidth={1.5} aria-hidden="true" />
            <h3 className="mt-4 text-xl text-[#111827]">One pipeline dashboard</h3>
            <p className="mt-2 flex-1 text-[15px] leading-relaxed text-[#4b5563]">
              Every lead, reply, meeting and dollar in one view, built around how you sell. Live in about two weeks.
            </p>
            <p className="mt-4 text-sm text-[#6b7280]">Connects the tools you already use.</p>
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
