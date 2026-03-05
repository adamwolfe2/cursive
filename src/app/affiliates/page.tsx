'use client'

/**
 * /affiliates — Cursive Partner Program Marketing Page
 * CRO-optimized landing page with interactive earnings calculator,
 * milestone visualizer, ICP section, and application form.
 */

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, ArrowRight, DollarSign, Users, Zap,
  TrendingUp, Gift, Star, ChevronDown, ChevronUp,
  BarChart3, Calendar, ExternalLink, Layers, Target,
  Repeat, Award, PlayCircle
} from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const MILESTONES = [
  { tier: 1, activations: 5,   bonus: 50,    commission: 0,  label: 'Starter' },
  { tier: 2, activations: 10,  bonus: 150,   commission: 0,  label: 'Builder' },
  { tier: 3, activations: 15,  bonus: 250,   commission: 0,  label: 'Growth' },
  { tier: 4, activations: 30,  bonus: 500,   commission: 0,  label: 'Scale' },
  { tier: 5, activations: 50,  bonus: 1000,  commission: 10, label: 'Pro' },
  { tier: 6, activations: 100, bonus: 2500,  commission: 20, label: 'Elite' },
]

const ICP_LIST = [
  { icon: Users,    title: 'Marketing Agencies',      desc: 'SMB or mid-market agency owners with active client rosters. Every client you onboard earns you benefits.' },
  { icon: BarChart3, title: 'Newsletter Operators',   desc: 'B2B, ecommerce, or marketing newsletters with engaged subscriber bases who need leads.' },
  { icon: Repeat,   title: 'Podcast Hosts',           desc: 'Shows in the growth, marketing, sales, or ecommerce space. Your listeners are exactly who needs Cursive.' },
  { icon: Layers,   title: 'Community Builders',      desc: 'Slack groups, Discord servers, and online communities in SaaS, DTC, or B2B marketing.' },
  { icon: Target,   title: 'Fractional CMOs',         desc: 'Consultants and fractional executives with ongoing client relationships you can consistently leverage.' },
  { icon: Star,     title: 'Growth Influencers',      desc: 'Creators and educators in the revenue, marketing, or growth space with engaged, business-operator audiences.' },
]

const FAQS = [
  {
    q: 'What counts as an "activation"?',
    a: 'An activation is when a business you referred installs the Cursive pixel on their website and receives their first audience match — real, identified visitors from their site. It\'s the point where they see real value.',
  },
  {
    q: 'When and how do I get paid?',
    a: 'Milestone bonuses are paid immediately upon hitting each tier via Stripe Express. Monthly recurring commissions (10% or 20%) are paid on the 1st of each month for the prior month\'s revenue from your referred accounts.',
  },
  {
    q: 'Is there a minimum payout threshold?',
    a: 'Yes, $50 minimum for commission payouts. Milestone bonuses are transferred immediately with no minimum.',
  },
  {
    q: 'Can I refer my own business?',
    a: 'No. Self-referrals are not permitted and will be removed. The program is for genuine referrals of third-party businesses.',
  },
  {
    q: 'How do I track my referrals?',
    a: 'You get a real-time dashboard showing clicks, sign-ups, activations, commissions earned, and your current tier. Everything is visible from the moment someone clicks your link.',
  },
  {
    q: 'What if someone signs up without clicking my link?',
    a: 'Attribution is first-touch: if someone clicked your link within 30 days of signing up, the referral is credited to you. We track via a 30-day cookie.',
  },
]

const AUDIENCE_SIZES = [
  { value: 'under_500',  label: 'Under 500' },
  { value: '500_2k',    label: '500–2,000' },
  { value: '2k_10k',    label: '2,000–10,000' },
  { value: '10k_50k',   label: '10,000–50,000' },
  { value: '50k_plus',  label: '50,000+' },
]

const AUDIENCE_TYPES = [
  { value: 'newsletter',  label: 'Newsletter' },
  { value: 'podcast',     label: 'Podcast' },
  { value: 'agency',      label: 'Agency / Consulting' },
  { value: 'community',   label: 'Online Community' },
  { value: 'social',      label: 'Social Following' },
  { value: 'other',       label: 'Other' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Given an activation count, return all milestone rewards (cumulative) */
function calcEarnings(activations: number): { cash: number; freeMonths: number; tier: number; commissionRate: number } {
  let cash = 0
  let lastMilestone = null
  for (const m of MILESTONES) {
    if (activations >= m.activations) {
      cash = m.bonus
      lastMilestone = m
    }
  }
  // Add cumulative bonuses from all hit milestones
  cash = MILESTONES.filter(m => activations >= m.activations).reduce((sum, m) => sum + m.bonus, 0)
  const freeMonths = activations // 1 free month per activation
  const tier = lastMilestone?.tier ?? 0
  const commissionRate = lastMilestone?.commission ?? 0
  return { cash, freeMonths, tier, commissionRate }
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-zinc-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="text-[14px] font-medium text-zinc-900">{q}</span>
        {open ? <ChevronUp size={16} className="text-zinc-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-zinc-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="pb-4 text-[14px] text-zinc-500 leading-relaxed pr-8">
          {a}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AffiliatesPage() {
  const formRef = useRef<HTMLDivElement>(null)
  const [sliderValue, setSliderValue] = useState(15)
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
  const [error, setError] = useState('')

  const earnings = calcEarnings(sliderValue)

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function toggleAudienceType(val: string) {
    setForm((f) => ({
      ...f,
      audienceTypes: f.audienceTypes.includes(val)
        ? f.audienceTypes.filter((t) => t !== val)
        : [...f.audienceTypes, val],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.audienceSize) { setError('Please select an audience size.'); return }
    if (form.audienceTypes.length === 0) { setError('Please select at least one audience type.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/affiliate/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          website: form.website || undefined,
          audienceSize: form.audienceSize,
          audienceTypes: form.audienceTypes,
          promotionPlan: form.promotionPlan,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Submission failed')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Submitted state ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900 mb-3">Application received.</h1>
          <p className="text-zinc-500 text-[15px] leading-relaxed mb-6">
            We review every application individually and respond within 48 hours. We&apos;ll reach out via the email you provided.
          </p>
          <Link href="https://meetcursive.com" className="text-[13px] text-zinc-400 hover:text-zinc-700 transition-colors">
            ← Back to meetcursive.com
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <nav className="border-b border-zinc-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="https://meetcursive.com" className="text-[15px] font-semibold text-zinc-900 tracking-tight">
            Cursive
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/affiliates/terms" className="text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors">
              Terms
            </Link>
            <button
              onClick={scrollToForm}
              className="h-9 px-4 bg-zinc-900 text-white text-[13px] font-medium rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Apply Now
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-[12px] font-medium text-emerald-700 mb-6">
            <Zap size={12} />
            Partner Program — Now Open
          </div>
          <h1 className="text-[44px] font-bold text-zinc-900 leading-[1.1] tracking-tight mb-5">
            Turn your audience into<br />
            <span className="text-emerald-600">recurring income.</span>
          </h1>
          <p className="text-[18px] text-zinc-500 leading-relaxed mb-8 max-w-2xl">
            Share Cursive&apos;s website pixel with your network. Every business that activates earns you a free month — plus cash bonuses up to $2,500 and 20% recurring commission at scale.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={scrollToForm}
              className="h-12 px-6 bg-zinc-900 text-white text-[15px] font-medium rounded-xl hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              Apply to Partner Program
              <ArrowRight size={16} />
            </button>
            <a
              href="https://meetcursive.com"
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 px-6 border border-zinc-200 text-zinc-700 text-[15px] font-medium rounded-xl hover:border-zinc-300 hover:bg-zinc-50 transition-colors flex items-center gap-2"
            >
              <ExternalLink size={14} />
              See the product
            </a>
          </div>
          <div className="flex items-center gap-6 mt-8 flex-wrap">
            {[
              'Free for businesses you refer',
              'First-touch 30-day cookie',
              'Paid via Stripe Express',
            ].map((t) => (
              <div key={t} className="flex items-center gap-1.5 text-[13px] text-zinc-500">
                <CheckCircle2 size={13} className="text-emerald-500" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Earnings Calculator ─────────────────────────────────────────────── */}
      <section className="bg-zinc-900 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white mb-2">See what you could earn</h2>
            <p className="text-zinc-400 text-[15px]">Drag the slider to your referral goal</p>
          </div>

          <div className="bg-zinc-800 rounded-2xl p-8 max-w-3xl mx-auto">
            {/* Slider */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px] text-zinc-400">Referrals activated</span>
                <span className="text-2xl font-bold text-white">{sliderValue}</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-zinc-700 accent-emerald-500"
              />
              <div className="flex justify-between text-[11px] text-zinc-500 mt-1.5">
                <span>1</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>

            {/* Results grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-zinc-900 rounded-xl p-4">
                <div className="text-[11px] text-zinc-500 mb-1">Cash Earned</div>
                <div className="text-2xl font-bold text-emerald-400">{fmt(earnings.cash)}</div>
                <div className="text-[11px] text-zinc-500 mt-1">cumulative bonuses</div>
              </div>
              <div className="bg-zinc-900 rounded-xl p-4">
                <div className="text-[11px] text-zinc-500 mb-1">Free Months</div>
                <div className="text-2xl font-bold text-white">{earnings.freeMonths}</div>
                <div className="text-[11px] text-zinc-500 mt-1">added to your account</div>
              </div>
              <div className="bg-zinc-900 rounded-xl p-4">
                <div className="text-[11px] text-zinc-500 mb-1">Commission Rate</div>
                <div className="text-2xl font-bold text-white">
                  {earnings.commissionRate > 0 ? `${earnings.commissionRate}%` : '—'}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">recurring revenue</div>
              </div>
              <div className="bg-zinc-900 rounded-xl p-4">
                <div className="text-[11px] text-zinc-500 mb-1">Tier</div>
                <div className="text-2xl font-bold text-white">
                  {earnings.tier > 0 ? MILESTONES[earnings.tier - 1]?.label : 'Pre-Tier'}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1">
                  {earnings.tier < 6 ? `Next: ${MILESTONES[earnings.tier]?.activations} activations` : 'Maximum tier'}
                </div>
              </div>
            </div>

            {/* Tier progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                <span>Milestone progress</span>
                <span>
                  {earnings.tier < 6
                    ? `${sliderValue}/${MILESTONES[earnings.tier]?.activations} to ${MILESTONES[earnings.tier]?.label}`
                    : 'All milestones reached'}
                </span>
              </div>
              <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (sliderValue / 100) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between">
                {MILESTONES.map((m) => (
                  <div
                    key={m.tier}
                    className="flex flex-col items-center"
                  >
                    <div className={`w-2 h-2 rounded-full transition-colors ${
                      sliderValue >= m.activations ? 'bg-emerald-400' : 'bg-zinc-600'
                    }`} />
                    <span className="text-[10px] text-zinc-500 mt-1">{m.activations}</span>
                  </div>
                ))}
              </div>
            </div>

            {earnings.commissionRate > 0 && (
              <div className="mt-4 p-3 bg-emerald-900/30 border border-emerald-800 rounded-lg text-[13px] text-emerald-400">
                At {sliderValue} activations you earn <strong>{earnings.commissionRate}% recurring</strong> on all referred accounts — month after month, for as long as they stay.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Milestone Table ─────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-b border-zinc-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Milestone rewards</h2>
            <p className="text-zinc-500 text-[15px]">Every threshold unlocks a cash bonus. Hit 50 and commission starts. Hit 100 and it doubles.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MILESTONES.map((m, i) => {
              const isUnlocked = sliderValue >= m.activations
              const isCurrent = earnings.tier === m.tier
              return (
                <div
                  key={m.tier}
                  className={`relative rounded-xl border p-5 transition-all ${
                    isCurrent
                      ? 'border-emerald-200 bg-emerald-50'
                      : isUnlocked
                      ? 'border-zinc-200 bg-zinc-50'
                      : 'border-zinc-100 bg-white opacity-60'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-2 left-4 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-semibold rounded-full">
                      YOUR TARGET
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isUnlocked ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
                    }`}>
                      Tier {m.tier} — {m.label}
                    </span>
                    {isUnlocked && <CheckCircle2 size={16} className="text-emerald-500" />}
                  </div>
                  <div className="text-3xl font-bold text-zinc-900 mb-1">{m.activations}</div>
                  <div className="text-[13px] text-zinc-500 mb-3">activations</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Gift size={13} className="text-zinc-400" />
                      <span className="text-[13px] text-zinc-700 font-medium">{fmt(m.bonus)} cash bonus</span>
                    </div>
                    {m.commission > 0 && (
                      <div className="flex items-center gap-2">
                        <Repeat size={13} className="text-emerald-500" />
                        <span className="text-[13px] text-emerald-700 font-medium">{m.commission}% recurring commission</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-zinc-400" />
                      <span className="text-[13px] text-zinc-500">+{m.activations} free months accumulated</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-zinc-50 border-b border-zinc-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">How the program works</h2>
            <p className="text-zinc-500 text-[15px]">Simple mechanics. No hustle required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                n: '1',
                icon: Award,
                title: 'Apply',
                desc: 'Tell us about your audience. We review every application within 48 hours and reach out directly.',
              },
              {
                n: '2',
                icon: ExternalLink,
                title: 'Share your link',
                desc: 'You get a unique referral link (meetcursive.com?ref=YOURCODE). Share it in your newsletter, podcast, or community.',
              },
              {
                n: '3',
                icon: Zap,
                title: 'Business activates',
                desc: 'When a referred business installs the Cursive pixel and gets their first identified visitors — that\'s an activation.',
              },
              {
                n: '4',
                icon: DollarSign,
                title: 'You earn',
                desc: 'Each activation = 1 free month of Cursive on your account. Milestone bonuses transfer to your Stripe account immediately.',
              },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div key={s.n} className="relative">
                  <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center mb-4">
                    <Icon size={18} className="text-zinc-600" />
                  </div>
                  <div className="text-[11px] font-semibold text-zinc-400 mb-1">STEP {s.n}</div>
                  <h3 className="text-[15px] font-semibold text-zinc-900 mb-2">{s.title}</h3>
                  <p className="text-[13px] text-zinc-500 leading-relaxed">{s.desc}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-10 p-5 bg-white border border-zinc-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <PlayCircle size={16} className="text-white" />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-zinc-900 mb-1">What is the Cursive pixel?</div>
                <p className="text-[13px] text-zinc-500 leading-relaxed">
                  Cursive&apos;s pixel identifies anonymous visitors on a business&apos;s website — revealing names, emails, phone numbers, and LinkedIn profiles of people who visited but never filled out a form. Businesses use this data for outbound outreach, retargeting, and audience building. It&apos;s completely free to install, which is why it&apos;s an easy sell.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who It's For ───────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-b border-zinc-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Who this is for</h2>
            <p className="text-zinc-500 text-[15px]">The best partners have one thing in common: an audience of business owners who want more customers.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ICP_LIST.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-300 hover:shadow-sm transition-all">
                  <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center mb-3">
                    <Icon size={16} className="text-zinc-600" />
                  </div>
                  <h3 className="text-[14px] font-semibold text-zinc-900 mb-2">{item.title}</h3>
                  <p className="text-[13px] text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-8 p-5 border border-dashed border-zinc-300 rounded-xl">
            <div className="flex items-start gap-3">
              <TrendingUp size={18} className="text-zinc-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[14px] font-medium text-zinc-700 mb-1">The math is simple.</div>
                <p className="text-[13px] text-zinc-500 leading-relaxed">
                  If you have 500 readers and 2% try Cursive, that&apos;s 10 activations in your first month — a $150 bonus and $150 in free Cursive time. At 50 activations you&apos;re earning 10% of every invoice your referred businesses pay. That&apos;s passive revenue that compounds month after month.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What Partners Say ──────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-zinc-50 border-b border-zinc-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Why partners choose Cursive</h2>
            <p className="text-zinc-500 text-[15px]">Not just another affiliate program.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Easy to explain',
                icon: Zap,
                desc: '"A free pixel that shows you who visited your website" is a one-sentence pitch that lands every time.',
              },
              {
                title: 'No purchase required',
                icon: Gift,
                desc: 'The pixel is free to install. Your referrals activate just by using the product — no sale needed to start earning.',
              },
              {
                title: 'Recurring upside',
                icon: Repeat,
                desc: 'Unlike one-time affiliate programs, your top performers generate recurring commission every month they stay.',
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="bg-white border border-zinc-200 rounded-xl p-5">
                  <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center mb-3">
                    <Icon size={16} className="text-zinc-600" />
                  </div>
                  <h3 className="text-[14px] font-semibold text-zinc-900 mb-2">{item.title}</h3>
                  <p className="text-[13px] text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-b border-zinc-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Frequently asked questions</h2>
          </div>
          <div className="border border-zinc-100 rounded-xl px-5 divide-y divide-zinc-100">
            {FAQS.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Application Form ───────────────────────────────────────────────── */}
      <section ref={formRef} className="py-16 px-6 bg-zinc-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Apply to the Partner Program</h2>
            <p className="text-zinc-500 text-[15px]">We review every application and respond within 48 hours.</p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">First Name *</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full h-10 px-3 text-[14px] border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full h-10 px-3 text-[14px] border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 bg-white"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full h-10 px-3 text-[14px] border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 bg-white"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                  Phone <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full h-10 px-3 text-[14px] border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 bg-white"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                  Website or LinkedIn URL <span className="text-zinc-400 font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://"
                  className="w-full h-10 px-3 text-[14px] border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 bg-white"
                />
              </div>

              {/* Audience Size */}
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">Audience Size *</label>
                <select
                  required
                  value={form.audienceSize}
                  onChange={(e) => setForm({ ...form, audienceSize: e.target.value })}
                  className="w-full h-10 px-3 text-[14px] border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 bg-white"
                >
                  <option value="">Select size...</option>
                  {AUDIENCE_SIZES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Audience Type */}
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-2">
                  Audience Type * <span className="text-zinc-400 font-normal">(select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {AUDIENCE_TYPES.map((t) => {
                    const checked = form.audienceTypes.includes(t.value)
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => toggleAudienceType(t.value)}
                        className={`px-3 py-1.5 text-[13px] rounded-lg border transition-colors ${
                          checked
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Promotion Plan */}
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                  How do you plan to promote Cursive? *
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.promotionPlan}
                  onChange={(e) => setForm({ ...form, promotionPlan: e.target.value })}
                  placeholder="Tell us about your audience, how you'd share your referral link, and why your audience would benefit from Cursive..."
                  className="w-full px-3 py-2.5 text-[14px] border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 bg-white resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 bg-zinc-900 text-white text-[15px] font-medium rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? 'Submitting...' : (
                  <>
                    Apply to the Partner Program
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p className="text-center text-[12px] text-zinc-400">
                By applying you agree to the{' '}
                <Link href="/affiliates/terms" className="text-zinc-600 hover:text-zinc-900 underline" target="_blank">
                  Partner Program Terms
                </Link>
                . We respond within 48 hours.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="text-[13px] text-zinc-500">
            © {new Date().getFullYear()} Cursive · <a href="https://meetcursive.com" className="hover:text-zinc-900 transition-colors">meetcursive.com</a>
          </div>
          <div className="flex items-center gap-4 text-[13px] text-zinc-400">
            <Link href="/affiliates/terms" className="hover:text-zinc-700 transition-colors">Partner Terms</Link>
            <Link href="/privacy" className="hover:text-zinc-700 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-zinc-700 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
