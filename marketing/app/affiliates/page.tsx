/* eslint-disable react/no-unescaped-entities */
'use client'

/**
 * meetcursive.com/affiliates — Partner Program Marketing Page
 * Design mirrors /superpixel: Inter + Dancing Script, #007AFF, font-light headings
 */

import { useState } from 'react'
import { CheckCircle2, DollarSign, Users, TrendingUp, Star, Zap, Globe, BookOpen, Mic, Mail } from 'lucide-react'
import { Container } from '@/components/ui/container'
import type { Metadata } from 'next'

// ── Constants ─────────────────────────────────────────────────────────────────

const APPLY_URL = 'https://leads.meetcursive.com/api/affiliate/apply'

const MILESTONES = [
  { activations: 5, bonus: 50, tier: 1 },
  { activations: 10, bonus: 150, tier: 2 },
  { activations: 15, bonus: 250, tier: 3 },
  { activations: 30, bonus: 500, tier: 4 },
  { activations: 50, bonus: 1000, tier: 5 },
  { activations: 100, bonus: 2500, tier: 6 },
]

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Apply & Get Approved',
    time: 'Under 24 hours',
    desc: 'Submit your application. We review every partner personally. Approved partners receive a unique link and access to the partner dashboard.',
  },
  {
    step: '2',
    title: 'Share With Your Audience',
    time: 'Your terms, your pace',
    desc: 'Share your referral link in content, newsletters, podcasts, or 1:1. Every referral gets a 30-day attribution cookie — if they sign up within 30 days, you get credit.',
  },
  {
    step: '3',
    title: 'Get Paid Every Month',
    time: 'Payouts on the 1st',
    desc: 'Cash bonuses hit your account the moment you reach each milestone. Recurring commissions (10–20%) pay out on the 1st of every month via Stripe — for life.',
  },
]

const ICPS = [
  { icon: BookOpen, title: 'Content Creators', desc: 'Newsletter writers, bloggers, and YouTube creators with a B2B or marketing-focused audience.' },
  { icon: Users, title: 'Agency Owners', desc: 'Marketing, SEO, and digital agencies whose clients are hungry for more pipeline.' },
  { icon: Mic, title: 'Podcast Hosts', desc: 'Business and marketing podcast hosts with consistent weekly listenership.' },
  { icon: TrendingUp, title: 'Sales Consultants', desc: 'Fractional sales leaders, outbound consultants, and RevOps pros.' },
  { icon: Globe, title: 'Community Builders', desc: 'Operators of Slack groups, Discord servers, or LinkedIn communities for marketers and founders.' },
  { icon: Star, title: 'Industry Influencers', desc: 'LinkedIn thought leaders, Twitter voices, and conference speakers in B2B sales and marketing.' },
]

const FAQS = [
  {
    q: 'How does attribution work?',
    a: "When someone clicks your referral link, we set a 30-day first-touch cookie. If they sign up within 30 days, the referral is credited to you — even if they sign up weeks later.",
  },
  {
    q: 'When do I receive my cash bonuses?',
    a: "Milestone bonuses are processed immediately when you hit each threshold. You'll need to complete Stripe Connect onboarding to receive the transfer. It typically arrives in 1–2 business days.",
  },
  {
    q: 'How long do recurring commissions last?',
    a: 'Once you reach 50 activations (Tier 5), you earn 10% recurring commission on every payment your referred customers make — for the lifetime of their subscription. At 100 activations, that jumps to 20%, also for life.',
  },
  {
    q: "What counts as an 'activation'?",
    a: "An activation is when a referred customer installs the Cursive pixel on their website AND receives their first identified visitor. It's not just a signup — it's a customer who's gotten real value from the platform.",
  },
  {
    q: 'Is there a minimum payout?',
    a: 'Yes — $50 minimum per payout cycle. Any earned amount below $50 rolls over to the following month.',
  },
  {
    q: 'Do I need to be a Cursive customer to apply?',
    a: "No, but partners who use Cursive themselves tend to convert significantly better. We recommend getting familiar with the platform so you can speak authentically about it.",
  },
]

const AUDIENCE_TYPES = [
  'Newsletter',
  'Blog / Content',
  'Podcast',
  'LinkedIn',
  'Twitter / X',
  'YouTube',
  'Community / Slack',
  'Agency / Consulting',
  'Email List',
  'Other',
]

const AUDIENCE_SIZES = [
  { value: 'under_500', label: 'Under 500' },
  { value: '500_2k', label: '500 – 2,000' },
  { value: '2k_10k', label: '2,000 – 10,000' },
  { value: '10k_50k', label: '10,000 – 50,000' },
  { value: '50k_plus', label: '50,000+' },
]

// ── Earnings Calculator ────────────────────────────────────────────────────────

function calcEarnings(activations: number) {
  const avgMonthlyRevenue = 99 // $99/mo avg plan
  let bonus = 0
  for (const m of MILESTONES) {
    if (activations >= m.activations) bonus = m.bonus
  }
  let commissionRate = 0
  if (activations >= 100) commissionRate = 0.2
  else if (activations >= 50) commissionRate = 0.1

  const monthlyRecurring = Math.round(activations * avgMonthlyRevenue * commissionRate)
  const annualRecurring = monthlyRecurring * 12
  const nextMilestone = MILESTONES.find((m) => m.activations > activations)

  return { bonus, monthlyRecurring, annualRecurring, commissionRate, nextMilestone }
}

function EarningsCalculator() {
  const [activations, setActivations] = useState(20)
  const { bonus, monthlyRecurring, annualRecurring, commissionRate, nextMilestone } = calcEarnings(activations)

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 md:p-10 border border-gray-200 shadow-xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Activations per month
          </label>
          <span className="text-3xl font-light text-[#007AFF]">{activations}</span>
        </div>
        <input
          type="range"
          min={1}
          max={150}
          value={activations}
          onChange={(e) => setActivations(Number(e.target.value))}
          className="w-full h-2 rounded-full bg-gray-200 appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #007AFF ${((activations - 1) / 149) * 100}%, #e5e7eb ${((activations - 1) / 149) * 100}%)`,
          }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1</span>
          <span>50</span>
          <span>100</span>
          <span>150</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#F7F9FB] rounded-xl p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Cash Bonuses Earned</p>
          <p className="text-3xl font-light text-gray-900">${bonus.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">cumulative milestones</p>
        </div>
        <div className="bg-[#F7F9FB] rounded-xl p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Monthly Recurring</p>
          <p className="text-3xl font-light text-gray-900">
            {commissionRate === 0 ? (
              <span className="text-gray-400 text-xl">Unlocks at 50</span>
            ) : (
              `$${monthlyRecurring.toLocaleString()}`
            )}
          </p>
          {commissionRate > 0 && (
            <p className="text-xs text-gray-400 mt-1">{commissionRate * 100}% of referred revenue</p>
          )}
        </div>
      </div>

      {commissionRate > 0 && (
        <div className="bg-[#007AFF]/6 border border-[#007AFF]/20 rounded-xl p-5 text-center mb-6">
          <p className="text-xs text-[#007AFF] uppercase tracking-wide font-medium mb-1">Annual Recurring Income</p>
          <p className="text-4xl font-light text-[#007AFF]">${annualRecurring.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">passive income — every year, for life</p>
        </div>
      )}

      {nextMilestone && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {nextMilestone.activations - activations} more activations until your ${nextMilestone.bonus.toLocaleString()} bonus
            </p>
            <p className="text-xs text-amber-600">Hit {nextMilestone.activations} activations → cash hits your account instantly</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── FAQ Accordion ─────────────────────────────────────────────────────────────

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {FAQS.map((faq, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-[#007AFF]/40 transition-colors"
        >
          <button
            className="w-full px-6 py-5 text-left flex items-center justify-between gap-4"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="font-medium text-gray-900 text-base">{faq.q}</span>
            <span className="text-2xl text-gray-400 flex-shrink-0 leading-none">{open === i ? '−' : '+'}</span>
          </button>
          {open === i && (
            <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Application Form ──────────────────────────────────────────────────────────

function ApplicationForm() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    website: '',
    audienceSize: '',
    audienceTypes: [] as string[],
    promotionPlan: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleAudienceType(type: string) {
    setForm((f) => ({
      ...f,
      audienceTypes: f.audienceTypes.includes(type)
        ? f.audienceTypes.filter((t) => t !== type)
        : [...f.audienceTypes, type],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.audienceSize || form.audienceTypes.length === 0) {
      setError('Please select your audience size and at least one channel.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(APPLY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setSubmitted(true)
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-lg">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-2xl font-light text-gray-900 mb-3">Application Received</h3>
        <p className="text-gray-600 text-lg mb-4">
          We review every application personally. You'll hear back within{' '}
          <strong className="text-gray-900">24 hours</strong>.
        </p>
        <p className="text-sm text-gray-500">Check your inbox for a confirmation — including what to expect next.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 md:p-10 shadow-lg">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
          <input
            type="text"
            required
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition"
            placeholder="Jane"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
          <input
            type="text"
            required
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition"
            placeholder="Smith"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition"
          placeholder="jane@example.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition"
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Website / Content URL <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="url"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition"
            placeholder="https://yournewsletter.com"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Audience Size</label>
        <div className="flex flex-wrap gap-2">
          {AUDIENCE_SIZES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, audienceSize: s.value }))}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                form.audienceSize === s.value
                  ? 'bg-[#007AFF] border-[#007AFF] text-white'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-[#007AFF] hover:text-[#007AFF]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">How do you reach your audience? <span className="text-gray-400 font-normal">(select all that apply)</span></label>
        <div className="flex flex-wrap gap-2">
          {AUDIENCE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleAudienceType(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                form.audienceTypes.includes(t)
                  ? 'bg-[#007AFF] border-[#007AFF] text-white'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-[#007AFF] hover:text-[#007AFF]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          How do you plan to promote Cursive?
        </label>
        <textarea
          required
          minLength={10}
          value={form.promotionPlan}
          onChange={(e) => setForm((f) => ({ ...f, promotionPlan: e.target.value }))}
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition resize-none"
          placeholder="Tell us about your audience, the type of content you create, and how you plan to introduce Cursive to them..."
        />
        <p className="text-xs text-gray-400 mt-1">Be specific — this is what we review. Quality over quantity.</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-8 py-4 bg-[#007AFF] hover:bg-[#0066DD] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all shadow-lg shadow-[#007AFF]/25 text-lg"
      >
        {submitting ? 'Submitting...' : 'Apply to the Partner Program →'}
      </button>

      <p className="text-center text-xs text-gray-400 mt-3">
        We review every application personally. You'll hear back within 24 hours.
      </p>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AffiliatesPage() {
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
              Now accepting partners · First 100 spots only
            </div>

            <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6 leading-tight">
              Earn While Your Audience
              <span className="block font-cursive text-6xl lg:text-7xl text-gray-500 mt-2">
                Grows Their Business.
              </span>
            </h1>

            <p className="text-2xl text-gray-700 font-medium mb-3 max-w-3xl mx-auto">
              Up to 20% recurring commission — for life. Plus up to $4,500 in cash bonuses.
            </p>

            <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
              Recommend Cursive to your audience. Every activation earns you a free month of Cursive plus cash bonuses.
              Once you hit 50 activations, you earn 10% of every payment your referrals make, forever.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
              <a
                href="#apply"
                className="px-8 py-4 bg-[#007AFF] hover:bg-[#0066DD] text-white font-bold rounded-lg transition-all shadow-lg shadow-[#007AFF]/25 text-lg"
              >
                Apply to Become a Partner →
              </a>
              <a
                href="#calculator"
                className="px-6 py-4 border border-gray-300 hover:border-[#007AFF] hover:text-[#007AFF] text-gray-700 font-semibold rounded-lg transition-colors text-base"
              >
                Calculate My Earnings ↓
              </a>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              {[
                'Free to join',
                'No minimum audience size',
                '30-day cookie window',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── STATS STRIP ───────────────────────────────────── */}
      <section className="py-12 bg-[#F7F9FB] border-y border-gray-200">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
            {[
              { number: '20%', label: 'Max recurring commission' },
              { number: '$4,500', label: 'Total cash bonuses available' },
              { number: '30 days', label: 'Attribution window' },
              { number: 'For life', label: 'Commissions never expire' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-light text-[#007AFF] mb-1">{stat.number}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── CALCULATOR ────────────────────────────────────── */}
      <section id="calculator" className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-12">
            <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide uppercase">
              Partner Earnings Calculator
            </span>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              See What You Could Earn
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                From Your Referrals.
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Move the slider to your estimated monthly activations and see your cash bonuses, monthly recurring income,
              and annual passive income — all in real time.
            </p>
          </div>
          <EarningsCalculator />
        </Container>
      </section>

      {/* ── MILESTONES ────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center mb-16">
            <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide uppercase">
              Milestone Rewards
            </span>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Hit a Milestone.
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">Get Paid Immediately.</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every milestone bonus transfers directly to your bank the moment you hit it — no waiting for the monthly cycle.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
            {MILESTONES.map((m, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 border text-center transition-all hover:shadow-lg ${
                  i === MILESTONES.length - 1
                    ? 'bg-[#007AFF] border-[#007AFF] text-white'
                    : 'bg-white border-gray-200 hover:border-[#007AFF]/40'
                }`}
              >
                <div className={`text-3xl font-light mb-1 ${i === MILESTONES.length - 1 ? 'text-white' : 'text-[#007AFF]'}`}>
                  ${m.bonus.toLocaleString()}
                </div>
                <div className={`text-sm font-medium ${i === MILESTONES.length - 1 ? 'text-white/80' : 'text-gray-500'}`}>
                  at {m.activations} activations
                </div>
                {i >= 4 && (
                  <div className={`mt-2 text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${
                    i === MILESTONES.length - 1 ? 'bg-white/20 text-white' : 'bg-[#007AFF]/10 text-[#007AFF]'
                  }`}>
                    + {i === 4 ? '10%' : '20%'} recurring commission unlocks
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="max-w-4xl mx-auto bg-[#F7F9FB] border border-gray-200 rounded-2xl p-6">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-light text-[#007AFF] mb-1">1 activation</div>
                <div className="text-sm text-gray-500">= 1 free month of Cursive for you</div>
              </div>
              <div>
                <div className="text-2xl font-light text-[#007AFF] mb-1">50 activations</div>
                <div className="text-sm text-gray-500">= 10% recurring commission, for life</div>
              </div>
              <div>
                <div className="text-2xl font-light text-[#007AFF] mb-1">100 activations</div>
                <div className="text-sm text-gray-500">= 20% recurring commission, for life</div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Three Steps.
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">Then It Runs Itself.</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              No complex integrations. No spreadsheets. Just your unique link and a dashboard that tracks everything automatically.
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
        </Container>
      </section>

      {/* ── WHO IT'S FOR ──────────────────────────────────── */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center mb-16">
            <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide uppercase">
              Who This Is For
            </span>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              If Your Audience Wants More Pipeline,
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                You're Already a Fit.
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Cursive is for B2B companies that want to convert website visitors into pipeline.
              If you reach marketing leaders, founders, or sales teams — your audience is our ideal customer.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {ICPS.map((icp, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all flex gap-4"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <icp.icon className="w-6 h-6 text-[#007AFF]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{icp.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{icp.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── CALLOUT ───────────────────────────────────────── */}
      <section className="py-12 bg-[#007AFF]/6 border-y border-[#007AFF]/15">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[#007AFF] text-xs font-mono uppercase tracking-widest mb-3">What makes this program different</p>
            <p className="text-gray-900 text-xl md:text-2xl font-light leading-relaxed">
              Most affiliate programs pay once.{' '}
              <strong className="text-[#007AFF] font-semibold">Ours pays every month, forever.</strong>{' '}
              Refer once. Earn as long as they&apos;re a customer.
            </p>
          </div>
        </Container>
      </section>

      {/* ── WHY CURSIVE ───────────────────────────────────── */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-16">
            <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide uppercase">
              Why Partners Choose Cursive
            </span>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Easy to Recommend.
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                Because It Actually Works.
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                title: 'Real Results in 24–48 Hours',
                desc: 'Referred customers see their first identified visitors within 24–48 hours of installation. Easy to recommend — the value is immediate and undeniable.',
              },
              {
                title: 'A Product That Sells Itself',
                desc: 'You don\'t need to be a salesperson. Just show someone their website traffic data and ask if they want the names behind it. The product closes itself.',
              },
              {
                title: 'Trusted by B2B Teams',
                desc: 'Cursive powers visitor identification and outreach for growth teams at companies across e-commerce, SaaS, and professional services.',
              },
              {
                title: 'Full Attribution Transparency',
                desc: 'Your partner dashboard shows every click, every lead, every activation, and every commission — in real time. No black boxes.',
              },
              {
                title: 'Dedicated Partner Support',
                desc: 'Approved partners get a direct line to the team. Content briefs, product updates, and early access to new features before public launch.',
              },
              {
                title: 'No Cap on Earnings',
                desc: 'Your partner link works indefinitely. Refer 5 people or 500 — the commission rate scales up, not down, the more you refer.',
              },
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-[#007AFF]/40 hover:shadow-lg transition-all flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle2 className="w-5 h-5 text-[#007AFF]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{card.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center mb-12">
            <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide uppercase">
              Frequently Asked Questions
            </span>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Everything You Need to Know
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                Before You Apply.
              </span>
            </h2>
          </div>
          <FAQ />
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              More questions?{' '}
              <a href="mailto:adam@meetcursive.com" className="text-[#007AFF] hover:underline">
                Email us directly
              </a>{' '}
              or view the full{' '}
              <a href="/affiliates/terms" className="text-[#007AFF] hover:underline">
                Partner Program Terms
              </a>
              .
            </p>
          </div>
        </Container>
      </section>

      {/* ── APPLICATION FORM ──────────────────────────────── */}
      <section id="apply" className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-12">
            <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide uppercase">
              Partner Application
            </span>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Apply Now.
              <span className="block font-cursive text-5xl lg:text-6xl text-gray-500 mt-2">
                Hear Back in 24 Hours.
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              We review every application personally. We're selective — we want partners who are genuinely excited about
              the product and whose audience is a real fit.
            </p>
          </div>
          <ApplicationForm />
        </Container>
      </section>
    </>
  )
}
