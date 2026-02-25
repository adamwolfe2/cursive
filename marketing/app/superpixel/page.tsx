import type { Metadata } from 'next'
import { CheckCircle2, Shield, Database, Globe, Clock, Users, TrendingUp } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { RevenueCalculator } from '@/components/revenue-calculator/RevenueCalculator'
import { CalInlineEmbed } from '@/components/cal-inline-embed'
import { DashboardCTA } from '@/components/dashboard-cta'
import { FaqAccordion } from './FaqAccordion'
import { SuperPixelPopup } from './SuperPixelPopup'
import { SampleLeadModal } from './SampleLeadModal'

export const metadata: Metadata = {
  title: "Identify 70% of Website Visitors — Cursive Super Pixel",
  description: "97% of your website visitors leave without buying. The Cursive Super Pixel identifies them in real time — name, email, phone, intent score, and 40+ data points. 10-minute setup. First leads in 24 hours.",
  robots: { index: true, follow: true },
}

const BOOK_ANCHOR = '#book-demo'
const CAL_LINK = 'https://cal.com/gotdarrenhill/30min'

const SAMPLE_LEAD = {
  name: 'James Sullivan',
  title: 'VP of Sales',
  company: 'Meridian Technology Group',
  email: 'j.sullivan@meridiantech.com',
  phone: '+1 (512) 847-2391',
  pageVisited: '/pricing',
  visitTime: 'Today at 2:14 PM CST',
  intentScore: 'High — 7-day spike detected',
}

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Book Demo Call',
    time: '15-minute call',
    desc: 'We learn your website, goals, and CRM. We scope the installation and answer every question.',
  },
  {
    step: '2',
    title: 'We Install Everything',
    time: 'Done in under 1 hour',
    desc: 'Our team installs the Super Pixel, configures CRM sync, sets up filters, and connects your integrations. You do nothing.',
  },
  {
    step: '3',
    title: 'Leads Start Flowing',
    time: 'Leads within 24–48 hours',
    desc: 'Verified, enriched, intent-scored visitor records appear in your dashboard and CRM — automatically, every day.',
  },
]

const DIFFERENTIATORS = [
  {
    icon: Shield,
    title: 'We Own the Source',
    subtitle: 'Proprietary Identity Graph',
    desc: "Most companies rent data from third parties. We built our own identity graph by going directly to primary providers others can't access. That's why our data is fresher and more accurate.",
  },
  {
    icon: Database,
    title: 'No Middlemen. Just Better Data.',
    subtitle: 'Primary Source Licensing',
    desc: "Data that passes through multiple hands decays. Ours doesn't. We license directly from primary providers. That's why our bounce rate is 0.05% while the industry sits at 20%+.",
  },
  {
    icon: Globe,
    title: "We See What Others Can't",
    subtitle: 'UID2 Integration',
    desc: "Built on UID2, the only universal identifier across every website in the US. Competitors without this infrastructure are guessing. We're matching.",
  },
  {
    icon: Clock,
    title: 'Your Data Never Goes Stale',
    subtitle: 'NCOA Refreshed Every 30 Days',
    desc: '12–15% of the US population moves every year. We verify addresses monthly so every lead we deliver is a real, reachable person.',
  },
  {
    icon: Users,
    title: 'We Know Almost Everyone',
    subtitle: '98% US Household Coverage',
    desc: '7 billion historic hashed emails tied to cookies and identifiers. 98% of US households observed. If they visit your site, we\'ll find them.',
  },
  {
    icon: TrendingUp,
    title: 'Leads in Real Time. Not Next Week.',
    subtitle: '50,000 Records/Second',
    desc: 'Our infrastructure processes 50,000 records per second. Your leads arrive in your CRM minutes after they visit, not days later.',
  },
]

export default function SuperPixelPage() {
  return (
    <>
      <SuperPixelPopup />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative py-24 bg-white">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#007AFF]/8 border border-[#007AFF]/20 text-[#007AFF] text-sm font-medium px-4 py-2 rounded-full mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007AFF] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007AFF]" />
              </span>
              10-minute setup · First leads in 24 hours
            </div>

            <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6 leading-tight">
              Identify the 97% of Visitors Who Leave
              <span className="block font-cursive text-6xl lg:text-7xl text-gray-500 mt-2">
                Without Buying.
              </span>
            </h1>

            <p className="text-2xl text-gray-700 font-medium mb-3 max-w-3xl mx-auto">
              Recover your invisible revenue with a 10-minute fix.
            </p>

            <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
              Enter your details below to discover the true cost of anonymous website traffic. The Cursive Super Pixel reveals your lost revenue and shows you exactly how to recover it.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
              <a
                href={BOOK_ANCHOR}
                className="px-8 py-4 bg-[#007AFF] hover:bg-[#0066DD] text-white font-bold rounded-lg transition-all shadow-lg shadow-[#007AFF]/25 text-lg"
              >
                See It Running on My Site →
              </a>
              <a href="#calculator" className="px-6 py-4 border border-gray-300 hover:border-[#007AFF] hover:text-[#007AFF] text-gray-700 font-semibold rounded-lg transition-colors text-base">
                Calculate My Revenue Leak ↓
              </a>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              {[
                'No contracts. Cancel anytime.',
                '10-minute setup',
                'No technical skills needed',
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── REVENUE CALCULATOR ────────────────────────────── */}
      <section id="calculator" className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-12">
            <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide uppercase">
              Super Pixel Found Money Calculator
            </span>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Your Invisible Revenue
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                Is Waiting to Be Found.
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enter your website details below. We&apos;ll show you exactly how much revenue is walking out the door unidentified — and what you&apos;ll recover with the Super Pixel.
            </p>
          </div>

          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-10 border border-gray-200 shadow-lg">
            <RevenueCalculator />
          </div>
        </Container>
      </section>

      {/* ── SAMPLE LEAD RECORD ────────────────────────────── */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center mb-14">
            <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide uppercase">
              See It In Action
            </span>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              This Is What You Receive
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                For Every Visitor
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A real enriched lead record delivered to your CRM within minutes of a visit. No form required.
            </p>
          </div>

          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-[#007AFF] px-6 py-4 flex items-center justify-between">
              <span className="text-white font-semibold text-sm uppercase tracking-wide">New Lead Identified</span>
              <span className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                High Intent · Score 94
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-2xl font-semibold text-gray-900">{SAMPLE_LEAD.name}</p>
                <p className="text-gray-500 text-sm mt-0.5">{SAMPLE_LEAD.title} · {SAMPLE_LEAD.company}</p>
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-3">
                {[
                  { label: 'Email', value: SAMPLE_LEAD.email },
                  { label: 'Mobile', value: SAMPLE_LEAD.phone },
                  { label: 'Company', value: SAMPLE_LEAD.company },
                  { label: 'Page Visited', value: SAMPLE_LEAD.pageVisited },
                  { label: 'Visit Time', value: SAMPLE_LEAD.visitTime },
                  { label: 'Intent Score', value: SAMPLE_LEAD.intentScore },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 w-28 flex-shrink-0">{row.label}</span>
                    <span className="text-sm text-gray-900 font-medium flex-1">{row.value}</span>
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 pb-5 text-center">
              <SampleLeadModal />
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">40+ data points per identified visitor. Every field verified against our identity graph.</p>
          </div>
        </Container>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              We Do Everything.
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">You Just Answer the Phone.</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              No technical skills needed. No code changes. No maintenance. Book a call and we handle the rest.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
                  <span className="text-3xl font-light text-[#007AFF]">{step.step}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  <CheckCircle2 className="w-3 h-3" />
                  {step.time}
                </div>
                <div className="text-sm text-[#007AFF] font-medium mb-2">Step {step.step}</div>
                <h3 className="text-2xl text-gray-900 mb-3 font-medium">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
            <p className="text-gray-700 font-medium text-sm">Works with your existing CRM, email tools, and workflows.</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 font-mono">
              {['GHL', 'HubSpot', 'Salesforce', 'Klaviyo', 'Make', 'Slack'].map(t => (
                <span key={t} className="bg-gray-50 border border-gray-200 px-2 py-1 rounded">{t}</span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── TECH DIFFERENTIATORS ──────────────────────────── */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center mb-16">
            <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide uppercase">
              The Technology
            </span>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Cheap Data Costs More.
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                Ours Comes From the Source.
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Diluted data that&apos;s passed through multiple hands bounces, wastes budget, and erodes your sender reputation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {DIFFERENTIATORS.map((card, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <card.icon className="w-6 h-6 text-[#007AFF]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-0.5">{card.title}</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wide mb-1">{card.subtitle}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── COMPETITOR CALLOUT BANNER ─────────────────────── */}
      <section className="py-10 bg-gray-900">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-white/60 text-xs font-mono uppercase tracking-widest mb-3">What competitors don&apos;t tell you</p>
            <p className="text-white text-xl md:text-2xl font-light leading-relaxed">
              A claimed 60% match rate typically yields only <strong className="text-[#007AFF] font-semibold">~15% usable contacts</strong> after data decay.{' '}
              <strong className="text-white font-semibold">Every match we deliver is a real, contactable person.</strong>
            </p>
          </div>
        </Container>
      </section>

      {/* ── STATS ─────────────────────────────────────────── */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="max-w-5xl mx-auto bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { number: '98%', label: 'US Households Covered' },
                { number: '60B+', label: 'Daily Intent Signals' },
                { number: '0.05%', label: 'Email Bounce Rate' },
                { number: '70%', label: 'Average ID Rate' },
                { number: '30 days', label: 'NCOA Refresh Cycle' },
                { number: '10–15M', label: 'Daily Email Verifications' },
                { number: '50,000', label: 'Records Per Second' },
                { number: '7B', label: 'Historic Hashed Emails' },
              ].map(stat => (
                <div key={stat.label} className="bg-[#F7F9FB] rounded-xl p-5 text-center">
                  <div className="text-3xl font-light text-[#007AFF] mb-1">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── COMPARISON TABLE ──────────────────────────────── */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              The Status Quo Is Costing You Every Day
            </h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              See what you&apos;re working with vs. what&apos;s possible.
            </p>
          </div>
          <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F7F9FB] border-b border-gray-200">
                    <th className="text-left py-4 px-4 text-gray-600 font-medium w-1/3">Capability</th>
                    <th className="text-center py-4 px-4 text-gray-500 font-medium">No Pixel</th>
                    <th className="text-center py-4 px-4 text-gray-500 font-medium">Standard Pixel</th>
                    <th className="text-center py-4 px-4 text-[#007AFF] font-bold">Cursive Super Pixel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['Visitor ID Rate', '~2% (forms only)', '~15%', '70%'],
                    ['Email Bounce Rate', 'N/A', '~20%', '0.05%'],
                    ['Intent Scoring', 'None', 'None', 'High / Med / Low'],
                    ['Data Freshness', 'N/A', 'Quarterly', '30-Day NCOA'],
                    ['Phone Numbers', 'No', 'Rarely', 'Yes'],
                    ['DNC Compliance Flags', 'No', 'No', 'Yes'],
                    ['Real-Time Delivery', 'N/A', 'Batch (24h)', 'Under 30 seconds'],
                    ['CRM / Webhook Integration', 'N/A', 'Limited', 'Full'],
                    ['Compliance (CAN-SPAM/CCPA)', 'N/A', 'Varies', 'Built-in'],
                  ].map(([cap, none, std, cursive]) => (
                    <tr key={cap}>
                      <td className="py-3 px-4 text-gray-600">{cap}</td>
                      <td className="py-3 px-4 text-center text-gray-400">{none}</td>
                      <td className="py-3 px-4 text-center text-gray-400">{std}</td>
                      <td className="py-3 px-4 text-center text-[#007AFF] font-semibold">{cursive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────── */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-4">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              From Teams Who Made the Switch
            </h2>
          </div>

          {/* Before/after banner */}
          <div className="max-w-3xl mx-auto mb-10 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-2 divide-x divide-gray-200">
              <div className="p-6 text-center">
                <p className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-2">Before Cursive</p>
                <div className="text-4xl font-light text-red-500 mb-1">2%</div>
                <p className="text-sm text-gray-500">Visitor capture rate (forms only)</p>
              </div>
              <div className="p-6 text-center bg-[#007AFF]/4">
                <p className="text-xs font-mono uppercase tracking-widest text-[#007AFF] mb-2">After Cursive</p>
                <div className="text-4xl font-light text-[#007AFF] mb-1">70%</div>
                <p className="text-sm text-gray-600">Visitor identification rate</p>
              </div>
            </div>
            <div className="border-t border-gray-100 bg-emerald-50 px-6 py-3 text-center">
              <p className="text-emerald-800 font-semibold text-sm">35× more identified contacts. Same traffic.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                quote: "We went from 12 identified leads a month to 340 in the first 30 days. I had no idea this much warm traffic was hitting our site every week.",
                author: 'Rachel M.', title: 'VP of Sales', company: 'Home Services Company, TX',
              },
              {
                quote: "I've tried RB2B, Clearbit, and three other pixel vendors. The bounce rates were killing our sender score. Cursive's 0.05% bounce rate is the only one that actually holds up in practice.",
                author: 'Marcus R.', title: 'VP Sales', company: 'Home Services Franchise',
              },
              {
                quote: "Our CAC dropped 40% in 90 days. Instead of buying ads to reach people who might be interested, we're now calling the people who already visited our pricing page.",
                author: 'Jennifer L.', title: 'CMO', company: 'Financial Services Firm',
              },
            ].map((t, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="text-[#007AFF] text-3xl mb-4">&ldquo;</div>
                <p className="text-gray-700 leading-relaxed mb-6 text-sm">{t.quote}</p>
                <div>
                  <p className="text-gray-900 font-semibold text-sm">{t.author}</p>
                  <p className="text-gray-500 text-xs">{t.title}, {t.company}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Integration logos */}
          <div className="mt-10 text-center">
            <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mb-4">Works with your existing tools</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {['GHL', 'HubSpot', 'Salesforce', 'Pipedrive', 'Klaviyo', 'Make', 'Slack', 'Zapier'].map(tool => (
                <span key={tool} className="bg-white border border-gray-200 text-gray-600 text-xs font-medium px-4 py-2 rounded-lg shadow-sm">{tool}</span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── PRICING ───────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600">
              No setup fees. No contracts. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Starter */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-3">Starter</div>
              <div className="text-4xl font-light text-gray-900 mb-1">$299<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <div className="text-gray-500 text-sm mb-6">Up to 3,000 identified visitors/mo</div>
              <ul className="space-y-3 mb-8">
                {[
                  '3,000 visitor identifications/month',
                  'Verified email + mobile on every match',
                  'Intent scoring (Low / Medium / High)',
                  'CRM integration (GHL, Klaviyo, Make)',
                  'Self-serve dashboard access',
                  'Email support',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-gray-600 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button href={BOOK_ANCHOR} variant="outline" className="w-full text-center">
                Get Started
              </Button>
            </div>

            {/* Growth — Most Popular */}
            <div className="bg-white border-2 border-[#007AFF] rounded-2xl p-6 shadow-lg relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-[#007AFF] text-white text-xs font-bold rounded-full">MOST POPULAR</span>
              </div>
              <div className="text-[#007AFF] text-sm font-semibold uppercase tracking-wider mb-3">Growth</div>
              <div className="text-4xl font-light text-gray-900 mb-1">$499<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <div className="text-gray-500 text-sm mb-6">Up to 5,000 identified visitors/mo</div>
              <ul className="space-y-3 mb-8">
                {[
                  '5,000 visitor identifications/month',
                  'Everything in Starter',
                  'Dedicated onboarding support',
                  'Priority API delivery',
                  'CRM integrations (HubSpot, Salesforce)',
                  'Run alongside existing pixels',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-gray-700 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button href={BOOK_ANCHOR} className="w-full text-center bg-[#007AFF] text-white hover:bg-[#0066DD]">
                Get Started
              </Button>
            </div>

            {/* Scale */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-3">Scale</div>
              <div className="text-4xl font-light text-gray-900 mb-1">$1,000<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <div className="text-gray-500 text-sm mb-6">Up to 15,000 identified visitors/mo</div>
              <ul className="space-y-3 mb-8">
                {[
                  '15,000 visitor identifications/month',
                  'Everything in Growth',
                  'White-glove setup + optimization',
                  'Custom integrations',
                  'Dedicated account manager',
                  'SLA guarantee',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-gray-600 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button href={BOOK_ANCHOR} variant="outline" className="w-full text-center">
                Talk to Sales
              </Button>
            </div>
          </div>

          <div className="mt-8 max-w-4xl mx-auto bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-4 text-center">
            <p className="text-emerald-900 font-medium text-sm">
              If you don&apos;t see verified leads in your CRM within 48 hours of setup, we&apos;ll keep working until you do. <strong>Guaranteed.</strong>
            </p>
          </div>
        </Container>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Questions? Answered.
              </h2>
            </div>
            <FaqAccordion />
          </div>
        </Container>
      </section>

      {/* ── BOOK A DEMO ───────────────────────────────────── */}
      <section id="book-demo" className="py-24 bg-white">
        <Container>
          <div className="text-center mb-12">
            <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide uppercase">
              See Results Before Your Next Monday Meeting
            </span>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              We Can Have This Live
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                on Your Site Today.
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto mb-6">
              Book a free 30-minute demo. See the Super Pixel running live on your website before the call ends. No pressure, no commitment.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 mb-10">
              {['30 minutes', 'Live demo on your site', 'No credit card required', 'First leads in 24 hours'].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            <CalInlineEmbed />
          </div>
        </Container>
      </section>

      {/* ── DASHBOARD CTA ─────────────────────────────────── */}
      <DashboardCTA
        headline="Install the Super Pixel."
        subheadline="Start getting leads."
        description="Book a call and we'll set up the Super Pixel on your website within 48 hours. Start seeing verified, enriched, intent-scored visitors flowing into your CRM automatically."
        ctaText="Book Your Free Demo Call"
        ctaUrl={CAL_LINK}
      />
    </>
  )
}
