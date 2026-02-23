import type { Metadata } from 'next'
import { RevenueCalculator } from '@/components/revenue-calculator/RevenueCalculator'
import { CalInlineEmbed } from '@/components/cal-inline-embed'

export const metadata: Metadata = {
  title: "Cursive Super Pixel — See How Much Revenue You're Losing | Free Calculator",
  description:
    '97% of your website visitors leave without converting. The Cursive Super Pixel identifies 70% of them with verified contact data, intent scoring, and a 0.05% bounce rate. Calculate your revenue leak now.',
  robots: { index: true, follow: true },
}

const BOOK_ANCHOR = '#book-demo'

// ─── Sample Lead Record Data ─────────────────────────────────────────────────

const SAMPLE_LEAD = {
  name: 'Michael Torres',
  title: 'VP of Operations',
  company: 'Apex Home Solutions',
  location: 'Austin, TX',
  email: 'm.torres@apexhomesolutions.com',
  phone: '(512) 847-3921',
  linkedin: 'linkedin.com/in/michaeltorres-ops',
  intent: 'HIGH',
  intentScore: 94,
  pages: ['Pricing', 'Enterprise Features', 'Case Studies'],
  visitedAt: '2 minutes ago',
  source: 'Organic Search',
}

// ─── FAQ Data ─────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'How does the Super Pixel identify 70% of visitors when competitors only get 15%?',
    a: 'Most pixel vendors rely on third-party cookie matching with stale databases. Cursive uses a proprietary first-party identity graph built on 420M+ verified US consumer records, refreshed via 30-day NCOA updates. We match on multiple signals simultaneously — device fingerprint, email hash, IP intelligence, and behavioral patterns — giving us dramatically higher match rates on real, reachable people.',
  },
  {
    q: 'What makes the 0.05% bounce rate possible?',
    a: 'Every email address in our database is validated in real-time against live mailbox checks, not just format validation. We remove role addresses, catch-alls, and known spam traps before they ever reach you. Our 30-day NCOA cycle ensures we flag addresses the moment someone moves or changes providers.',
  },
  {
    q: 'How is this different from Clearbit, 6sense, or RB2B?',
    a: "B2B intent tools like 6sense identify company-level traffic — you get the organization, not the person. RB2B focuses on LinkedIn identification only. Clearbit enriches data you already have. Cursive's Super Pixel uniquely provides person-level identification with full contact data (email, phone, LinkedIn), intent scoring at the individual level, and CAN-SPAM/CCPA-compliant outreach data — all in one.",
  },
  {
    q: 'Is this CAN-SPAM and CCPA compliant?',
    a: 'Yes. All data originates from consumer-consented sources. Our identity graph is built on opt-in data partnerships. Every contact includes suppression flags for do-not-contact registries. We provide DNC list management and unsubscribe handling as part of the platform. We recommend consulting your legal counsel for your specific use case.',
  },
  {
    q: 'What does the pixel actually collect?',
    a: "The Super Pixel is a lightweight JavaScript snippet (~3KB) that fires on page load. It collects anonymized first-party signals: page URL, referrer, session ID, and a hashed device fingerprint. No personally identifiable information is collected by the pixel itself — the identity resolution happens server-side against our identity graph. Your visitors' raw PII never leaves your domain.",
  },
  {
    q: 'How quickly do identified leads appear in my dashboard?',
    a: 'Real-time. Most matches resolve within 30 seconds of a visitor landing on your page. High-intent visitors (multiple pages, pricing views, return visits) are flagged immediately and can trigger Slack notifications or CRM webhooks.',
  },
  {
    q: 'Do I need a developer to install it?',
    a: 'No. The pixel is a single line of HTML you paste into your website head tag — identical to installing Google Analytics or the Meta Pixel. For Shopify, WordPress, Webflow, and most CMSs, we have one-click integrations. Average install time is under 5 minutes.',
  },
  {
    q: "What happens to the 30% of visitors you can't identify?",
    a: "No technology identifies 100% — anonymous browsers, VPNs, and privacy tools will always create a floor. The 70% we do identify are real, verified, reachable people. Compare this to your current form conversion rate of 1–3%: even a 70% partial identification rate is 23x more pipeline than the status quo.",
  },
]

// ─── How It Works Steps ──────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Pixel Fires on Page Load',
    description:
      'A 3KB script fires instantly on any page visit, collecting anonymized first-party signals — page path, referrer, session ID, and device fingerprint. No PII leaves your domain.',
  },
  {
    step: '02',
    title: 'Identity Resolution Against 420M Records',
    description:
      'Our server-side identity graph matches the anonymized signals against 420M+ verified US consumer records. We cross-reference device graphs, email hashes, and IP intelligence simultaneously.',
  },
  {
    step: '03',
    title: 'Intent Scoring & Enrichment',
    description:
      'Matched visitors receive an intent score (High / Medium / Low) based on pages visited, time on site, return visits, and behavioral signals against 60B+ daily intent data points.',
  },
  {
    step: '04',
    title: 'Verified Contact Data Delivered',
    description:
      "You receive the visitor's full name, verified email (0.05% bounce rate), phone number, LinkedIn profile, company, job title, and location — ready for outreach or CRM sync.",
  },
]

// ─── Tech Differentiators ────────────────────────────────────────────────────

const DIFFERENTIATORS = [
  {
    icon: '&#x26A1;',
    title: '420M+ Verified US Records',
    description: 'The largest consumer identity graph purpose-built for lead identification. Updated continuously, not quarterly.',
  },
  {
    icon: '&#x1F3AF;',
    title: '60B+ Daily Intent Signals',
    description: 'Real-time behavioral data from across the open web, mapped to individual identities for precision scoring.',
  },
  {
    icon: '&#x1F504;',
    title: '30-Day NCOA Refresh',
    description: 'National Change of Address verification runs every 30 days, not quarterly. Stale data is flagged and removed before you touch it.',
  },
  {
    icon: '&#x1F4CA;',
    title: '98% US Household Coverage',
    description: 'Our identity graph covers 98% of US households, giving you reach into virtually every market segment and geography.',
  },
  {
    icon: '&#x1F512;',
    title: 'Multi-Signal Matching',
    description: 'We match on device fingerprint + email hash + IP intelligence + behavioral signals simultaneously — not a single vector like competitors.',
  },
  {
    icon: '&#x2705;',
    title: 'Real-Time Email Validation',
    description: 'Every address undergoes live mailbox verification before delivery. Role addresses, catch-alls, and spam traps are removed automatically.',
  },
]

// ─── Testimonials ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote:
      "We were converting 1.8% of our traffic through forms. The Super Pixel identified 67% of our visitors in the first week. That's not an improvement — that's a different business.",
    author: 'Sarah K.',
    title: 'Head of Growth',
    company: 'Series B SaaS Platform',
  },
  {
    quote:
      "I've tried RB2B, Clearbit, and three other pixel vendors. The bounce rates were killing our sender score. Cursive's 0.05% bounce rate is the only one that actually holds up in practice.",
    author: 'Marcus R.',
    title: 'VP Sales',
    company: 'Home Services Franchise',
  },
  {
    quote:
      'Our CAC dropped 40% in 90 days. Instead of buying ads to reach people who might be interested, we\'re now calling the people who already visited our pricing page.',
    author: 'Jennifer L.',
    title: 'CMO',
    company: 'Financial Services Firm',
  },
]

// ─── Page Component ───────────────────────────────────────────────────────────

export default function SuperPixelV2Page() {
  return (
    <main className="min-h-screen bg-[#0a0f1a]">
      {/* ── Minimal Nav ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0f1a]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="https://meetcursive.com" className="text-white font-bold text-lg tracking-tight">
            Cursive
          </a>
          <a
            href={BOOK_ANCHOR}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm rounded-lg transition-all"
          >
            Book a Demo
          </a>
        </div>
      </nav>

      {/* ── Hero: Revenue Calculator ─────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 text-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Super Pixel Revenue Calculator
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white text-center leading-tight mb-6">
            How Much Revenue Is{' '}
            <span className="text-red-400">Walking Out</span>{' '}
            Your Front Door?
          </h1>

          <p className="text-white/60 text-lg md:text-xl text-center max-w-2xl mx-auto mb-12 leading-relaxed">
            97% of your website visitors leave without a trace. Enter your details to see exactly how much
            pipeline you&apos;re losing — and how the Super Pixel recovers it.
          </p>

          {/* Calculator Card */}
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl shadow-black/40">
            <RevenueCalculator />
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-white/40 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400">&#10003;</span>
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400">&#10003;</span>
              Free 14-day trial
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400">&#10003;</span>
              Setup in under 5 minutes
            </span>
          </div>
        </div>
      </section>

      {/* ── Sample Lead Record ───────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              This Is What You&apos;re Missing
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Every visitor who leaves your site without converting is a real person with a name, email, and phone number.
              Here&apos;s what a Super Pixel lead record looks like:
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden shadow-xl shadow-black/30">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white/50 text-sm font-medium">New Visitor Identified</span>
                </div>
                <span className="text-white/30 text-xs">{SAMPLE_LEAD.visitedAt}</span>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400/30 to-blue-400/30 border border-white/10 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {SAMPLE_LEAD.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-white font-bold text-lg">{SAMPLE_LEAD.name}</h3>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                        INTENT: {SAMPLE_LEAD.intent} ({SAMPLE_LEAD.intentScore})
                      </span>
                    </div>
                    <p className="text-white/60 text-sm">{SAMPLE_LEAD.title} at {SAMPLE_LEAD.company}</p>
                    <p className="text-white/40 text-xs mt-0.5">{SAMPLE_LEAD.location} &middot; via {SAMPLE_LEAD.source}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <p className="text-white/40 text-xs mb-1 uppercase tracking-wider">Email</p>
                    <p className="text-emerald-300 text-sm font-medium">{SAMPLE_LEAD.email}</p>
                    <p className="text-white/30 text-xs mt-0.5">&#10003; Verified &middot; 0% bounce risk</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <p className="text-white/40 text-xs mb-1 uppercase tracking-wider">Phone</p>
                    <p className="text-white text-sm font-medium">{SAMPLE_LEAD.phone}</p>
                    <p className="text-white/30 text-xs mt-0.5">&#10003; Mobile &middot; Direct line</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <p className="text-white/40 text-xs mb-1 uppercase tracking-wider">LinkedIn</p>
                    <p className="text-blue-400 text-sm font-medium">{SAMPLE_LEAD.linkedin}</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <p className="text-white/40 text-xs mb-1 uppercase tracking-wider">Pages Visited</p>
                    <div className="flex flex-wrap gap-1">
                      {SAMPLE_LEAD.pages.map(page => (
                        <span key={page} className="px-2 py-0.5 rounded text-xs bg-white/5 text-white/60">{page}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-center">
                  <p className="text-red-400/80 text-sm">
                    Without the Super Pixel, Michael would have just been <strong>1 more anonymous bounce</strong> in your analytics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              How the Super Pixel Works
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              From anonymous visit to verified, intent-scored lead record — in under 30 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-colors">
                <div className="text-emerald-400/40 font-black text-5xl leading-none mb-4">{step.step}</div>
                <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-white/50 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Differentiators ─────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Why 70% vs. Everyone Else&apos;s 15%
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              The gap isn&apos;t luck. It&apos;s the result of purpose-built technology that competitors simply haven&apos;t invested in.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {DIFFERENTIATORS.map((d) => (
              <div key={d.title} className="bg-white/[0.03] border border-white/8 rounded-xl p-5 hover:border-emerald-400/20 hover:bg-white/[0.05] transition-all group">
                <div className="text-2xl mb-3" dangerouslySetInnerHTML={{ __html: d.icon }} />
                <h3 className="text-white font-bold mb-2 group-hover:text-emerald-300 transition-colors">{d.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{d.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison Table ─────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              The Status Quo Is Costing You Every Day
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              See what you&apos;re working with vs. what&apos;s possible.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-white/40 font-medium text-sm w-1/3">Capability</th>
                  <th className="text-center py-4 px-4 text-white/40 font-medium text-sm">No Pixel</th>
                  <th className="text-center py-4 px-4 text-white/40 font-medium text-sm">Standard Pixel</th>
                  <th className="text-center py-4 px-4 text-emerald-300 font-bold text-sm">Cursive Super Pixel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
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
                    <td className="py-3 px-4 text-white/60 text-sm">{cap}</td>
                    <td className="py-3 px-4 text-center text-white/30 text-sm">{none}</td>
                    <td className="py-3 px-4 text-center text-white/30 text-sm">{std}</td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-semibold text-sm">{cursive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              From Teams Who Made the Switch
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.author} className="bg-white/[0.03] border border-white/8 rounded-2xl p-6">
                <div className="text-emerald-400 text-2xl mb-4">&ldquo;</div>
                <p className="text-white/70 leading-relaxed mb-6 text-sm">{t.quote}</p>
                <div>
                  <p className="text-white font-semibold text-sm">{t.author}</p>
                  <p className="text-white/40 text-xs">{t.title}, {t.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/5" id="pricing">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-white/50 text-lg">
              Start free. Scale as you grow. No setup fees, no contracts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Trial */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <div className="text-white/50 text-sm font-semibold uppercase tracking-wider mb-3">Free Trial</div>
              <div className="text-4xl font-black text-white mb-1">$0</div>
              <div className="text-white/40 text-sm mb-6">14 days, no credit card</div>
              <ul className="space-y-3 mb-8">
                {[
                  'Up to 500 visitor identifications',
                  'Full contact data on every match',
                  'Intent scoring',
                  'CSV export',
                  'Email support',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-white/60 text-sm">
                    <span className="text-emerald-400 shrink-0 mt-0.5">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://leads.meetcursive.com/signup"
                className="block text-center py-3 px-6 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg border border-white/15 transition-all"
              >
                Start Free Trial
              </a>
            </div>

            {/* Pro */}
            <div className="bg-emerald-400/10 border-2 border-emerald-400/40 rounded-2xl p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-emerald-400 text-black text-xs font-bold rounded-full">
                  MOST POPULAR
                </span>
              </div>
              <div className="text-emerald-300 text-sm font-semibold uppercase tracking-wider mb-3">Pro</div>
              <div className="text-4xl font-black text-white mb-1">$299<span className="text-lg font-normal text-white/50">/mo</span></div>
              <div className="text-white/40 text-sm mb-6">Up to 5,000 identifications/mo</div>
              <ul className="space-y-3 mb-8">
                {[
                  '5,000 visitor identifications/month',
                  'Full contact data + intent scores',
                  'CRM integrations (HubSpot, Salesforce)',
                  'Slack & webhook alerts',
                  'Email sequence triggers',
                  'Priority support',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-white/70 text-sm">
                    <span className="text-emerald-400 shrink-0 mt-0.5">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={BOOK_ANCHOR}
                className="block w-full text-center py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-all"
              >
                Get Started
              </a>
            </div>

            {/* Enterprise */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <div className="text-white/50 text-sm font-semibold uppercase tracking-wider mb-3">Enterprise</div>
              <div className="text-4xl font-black text-white mb-1">Custom</div>
              <div className="text-white/40 text-sm mb-6">Unlimited volume</div>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited identifications',
                  'Dedicated identity graph segment',
                  'Custom data enrichment fields',
                  'SLA guarantee',
                  'Dedicated success manager',
                  'White-label options',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-white/60 text-sm">
                    <span className="text-emerald-400 shrink-0 mt-0.5">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={BOOK_ANCHOR}
                className="block w-full text-center py-3 px-6 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg border border-white/15 transition-all"
              >
                Talk to Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.q} className="bg-white/[0.03] border border-white/8 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-3 leading-snug">{faq.q}</h3>
                <p className="text-white/55 leading-relaxed text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Book a Demo (Cal.com Inline) ──────────────────────────────────── */}
      <section id="book-demo" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Book a Free Demo With Darren
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              See the Super Pixel running live on your website. Pick a time that works for you — no pressure, no sales pitch.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-white/40 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400">&#10003;</span>
                30 minutes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400">&#10003;</span>
                Live demo on your site
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400">&#10003;</span>
                No credit card required
              </span>
            </div>
          </div>

          {/* Cal.com inline embed */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
            <CalInlineEmbed />
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-white/30 text-sm">
          <span>&#169; 2026 Cursive. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-white/60 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white/60 transition-colors">Terms</a>
            <a href="mailto:hello@meetcursive.com" className="hover:text-white/60 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
