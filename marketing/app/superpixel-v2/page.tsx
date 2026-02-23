import type { Metadata } from 'next'
import { CheckCircle2, Shield, Database, Globe, Clock, Users, TrendingUp } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { RevenueCalculator } from '@/components/revenue-calculator/RevenueCalculator'
import { CalInlineEmbed } from '@/components/cal-inline-embed'
import { DashboardCTA } from '@/components/dashboard-cta'
import { FaqAccordion } from './FaqAccordion'

export const metadata: Metadata = {
  title: "Super Pixel Revenue Calculator — See What You're Losing | Cursive",
  description: "97% of your website visitors leave without converting. Calculate exactly how much revenue you're losing — and see how the Cursive Super Pixel recovers it with 70% visitor ID rates and 0.05% bounce rates.",
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
    desc: '15-minute call to understand your website, goals, and CRM. We scope the installation and answer every question.',
  },
  {
    step: '2',
    title: 'We Install & Configure',
    desc: 'Our team installs the Super Pixel, configures CRM sync, sets up bot/internal traffic filters, and connects your integrations.',
  },
  {
    step: '3',
    title: 'Leads Start Flowing',
    desc: "Within 24–48 hours you'll see verified, enriched, intent-scored visitor records in your dashboard and CRM — automatically.",
  },
]

const DIFFERENTIATORS = [
  { icon: Shield, title: 'Proprietary Identity Graph', desc: "Built and owned outright — sourced from the same primary providers others can't access directly." },
  { icon: Database, title: 'Primary Source Licensing', desc: 'We license directly from primary data providers. Data that passes through multiple hands decays — ours doesn\'t. 0.05% bounce rate.' },
  { icon: Globe, title: 'UID2 Integration', desc: 'The only universal identifier dispersed across every website in the United States. Competitors without UID2 simply don\'t have the infrastructure.' },
  { icon: Clock, title: 'NCOA Refreshed Every 30 Days', desc: '12–15% of the US population moves annually. We verify addresses monthly so your data never goes stale.' },
  { icon: Users, title: '98% US Household Coverage', desc: '7 billion historic hashed emails tied to UID2 and cookies. 98% of US households observed.' },
  { icon: TrendingUp, title: '50,000 Records/Second', desc: 'Stateless worker architecture. Your data flows don\'t time out, bottleneck, or fall behind.' },
]

const TESTIMONIALS = [
  {
    quote: "We were converting 1.8% of our traffic through forms. The Super Pixel identified 67% of our visitors in the first week. That's not an improvement — that's a different business.",
    author: 'Sarah K.', title: 'Head of Growth', company: 'Series B SaaS Platform',
  },
  {
    quote: "I've tried RB2B, Clearbit, and three other pixel vendors. The bounce rates were killing our sender score. Cursive's 0.05% bounce rate is the only one that actually holds up in practice.",
    author: 'Marcus R.', title: 'VP Sales', company: 'Home Services Franchise',
  },
  {
    quote: "Our CAC dropped 40% in 90 days. Instead of buying ads to reach people who might be interested, we're now calling the people who already visited our pricing page.",
    author: 'Jennifer L.', title: 'CMO', company: 'Financial Services Firm',
  },
]

export default function SuperPixelV2Page() {
  return (
    <>
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative py-24 bg-white">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#007AFF]/8 border border-[#007AFF]/20 text-[#007AFF] text-sm font-medium px-4 py-2 rounded-full mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007AFF] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007AFF]" />
              </span>
              Super Pixel Revenue Calculator
            </div>

            <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6 leading-tight">
              97% of Your Visitors Leave
              <span className="block font-cursive text-6xl lg:text-7xl text-gray-500 mt-2">
                Without a Name.
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
              Enter your details below to see exactly how much pipeline you&apos;re losing every month — and what the{' '}
              <strong className="text-gray-900 font-semibold">Cursive Super Pixel</strong> can recover for your business.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              {[
                'Identifies 70% of US Web Visitors',
                '0.05% Email Bounce Rate',
                '420M+ Verified Contacts',
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── REVENUE CALCULATOR ────────────────────────────── */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-12">
            <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide uppercase">
              Your Numbers
            </span>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Calculate Your Revenue Leak
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                In 60 Seconds
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Enter your website traffic, average deal size, and industry. We&apos;ll show you exactly what you&apos;re leaving on the table.
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
              A real enriched lead record delivered to your CRM, inbox, or platform within minutes of a visit.
            </p>
          </div>

          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-[#007AFF] px-6 py-4 flex items-center justify-between">
              <span className="text-white font-semibold text-sm uppercase tracking-wide">Sample Lead Record</span>
              <span className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Live Visitor
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
            <div className="px-6 pb-5">
              <p className="text-xs text-gray-400 text-center">* Sample record — actual fields vary by match quality</p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              We Handle Everything
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Book a call, we set everything up. First leads typically arrive within 24–48 hours.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mb-6 shadow-sm">
                  <span className="text-3xl font-light text-[#007AFF]">{step.step}</span>
                </div>
                <div className="text-sm text-[#007AFF] font-medium mb-2">Step {step.step}</div>
                <h3 className="text-2xl text-gray-900 mb-3 font-medium">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
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
                  <h3 className="font-medium text-gray-900 mb-1">{card.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
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
            <div className="border-l-4 border-[#007AFF] bg-blue-50 rounded-r-xl p-5">
              <p className="text-gray-800 text-sm">
                <span className="font-semibold">What competitors don&apos;t tell you:</span> A claimed 60% match rate typically yields only ~15% usable contacts after data decay. Our geo-framed, NCOA-verified methodology means every match we deliver is a real, contactable person.
              </p>
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
                    ['LinkedIn Profiles', 'No', 'Sometimes', 'Yes'],
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
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              From Teams Who Made the Switch
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
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
              Start free. Scale as you grow. No setup fees, no contracts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-3">Free Trial</div>
              <div className="text-4xl font-light text-gray-900 mb-1">$0</div>
              <div className="text-gray-500 text-sm mb-6">14 days, no credit card</div>
              <ul className="space-y-3 mb-8">
                {['Up to 500 visitor identifications', 'Full contact data on every match', 'Intent scoring', 'CSV export', 'Email support'].map(f => (
                  <li key={f} className="flex items-start gap-2 text-gray-600 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button href="https://leads.meetcursive.com/signup" variant="outline" className="w-full text-center">
                Start Free Trial
              </Button>
            </div>

            <div className="bg-white border-2 border-[#007AFF] rounded-2xl p-6 shadow-lg relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-[#007AFF] text-white text-xs font-bold rounded-full">MOST POPULAR</span>
              </div>
              <div className="text-[#007AFF] text-sm font-semibold uppercase tracking-wider mb-3">Pro</div>
              <div className="text-4xl font-light text-gray-900 mb-1">$299<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <div className="text-gray-500 text-sm mb-6">Up to 5,000 identifications/mo</div>
              <ul className="space-y-3 mb-8">
                {['5,000 visitor identifications/month', 'Full contact data + intent scores', 'CRM integrations (HubSpot, Salesforce)', 'Slack & webhook alerts', 'Email sequence triggers', 'Priority support'].map(f => (
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

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-3">Enterprise</div>
              <div className="text-4xl font-light text-gray-900 mb-1">Custom</div>
              <div className="text-gray-500 text-sm mb-6">Unlimited volume</div>
              <ul className="space-y-3 mb-8">
                {['Unlimited identifications', 'Dedicated identity graph segment', 'Custom data enrichment fields', 'SLA guarantee', 'Dedicated success manager', 'White-label options'].map(f => (
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
        </Container>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                Frequently Asked Questions
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
              Get Started
            </span>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Ready to Stop Losing
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                Your Website Traffic?
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto mb-6">
              Book a free 30-minute demo with Darren. See the Super Pixel running live on your website — no pressure, no commitment.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 mb-10">
              {['30 minutes', 'Live demo on your site', 'No credit card required'].map(item => (
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
