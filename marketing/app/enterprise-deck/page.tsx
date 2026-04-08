'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { RevenueCalculator } from '@/components/revenue-calculator/RevenueCalculator'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CAL_LINK = 'https://cal.com/cursiveteam/30min'
const SLIDE_COUNT = 11

const SLIDE_LABELS = ['Cover', 'The Problem', 'The Platform', 'Identity Infrastructure', 'Product Suite', 'Services', 'Integrations & Industries', 'Results', 'How It Works', 'Why Cursive', 'Get Started']

const VISITORS = [
  {
    id: 1,
    anon: { ip: '104.21.47.201', location: 'Austin, TX', device: 'MacBook Pro', page: '/pricing', time: '2:14 PM CST' },
    lead: { name: 'Marcus Chen', title: 'VP of Marketing', company: 'Horizon SaaS', email: 'm.chen@horizonsaas.com', phone: '+1 (512) 847-2391', intent: 'High', signal: 'Viewed /pricing 3x this week', score: 94 },
  },
  {
    id: 2,
    anon: { ip: '198.41.128.84', location: 'Chicago, IL', device: 'Windows 11 PC', page: '/services', time: '2:17 PM CST' },
    lead: { name: 'Sarah Okonkwo', title: 'Director of Growth', company: 'Apex Revenue Co.', email: 's.okonkwo@apexrevenue.com', phone: '+1 (312) 555-9832', intent: 'High', signal: 'Visited /services + /pricing same session', score: 89 },
  },
  {
    id: 3,
    anon: { ip: '172.64.80.100', location: 'New York, NY', device: 'iPhone 15 Pro', page: '/case-studies', time: '2:19 PM CST' },
    lead: { name: 'James Thornton', title: 'Chief Revenue Officer', company: 'BuildPath Technologies', email: 'j.thornton@buildpath.io', phone: '+1 (646) 203-7741', intent: 'Medium', signal: 'Downloaded case study, returned 3 days later', score: 72 },
  },
  {
    id: 4,
    anon: { ip: '104.18.10.225', location: 'Denver, CO', device: 'MacBook Air M3', page: '/enterprise', time: '2:21 PM CST' },
    lead: { name: 'Priya Nair', title: 'Head of Demand Gen', company: 'CloudBridge Inc.', email: 'p.nair@cloudbridge.com', phone: '+1 (720) 441-0983', intent: 'High', signal: 'Viewed /enterprise 4x across 2 sessions', score: 91 },
  },
]

// ─── VISITOR IDENTIFICATION DEMO ──────────────────────────────────────────────
type VisitorPhase = 'idle' | 'detected' | 'matching' | 'identified'

function VisitorDemo({ compact = false }: { compact?: boolean }) {
  const [vidx, setVidx] = useState(0)
  const [phase, setPhase] = useState<VisitorPhase>('idle')
  const [progress, setProgress] = useState(0)
  const [fields, setFields] = useState(0)
  const [liveCount, setLiveCount] = useState(1847)
  const t = useRef<ReturnType<typeof setTimeout> | null>(null)
  const iv = useRef<ReturnType<typeof setInterval> | null>(null)
  const v = VISITORS[vidx]

  useEffect(() => {
    const tickLive = setInterval(() => setLiveCount(c => c + Math.floor(Math.random() * 3 + 1)), 2500)
    return () => clearInterval(tickLive)
  }, [])

  useEffect(() => {
    const clear = () => {
      if (t.current) clearTimeout(t.current)
      if (iv.current) clearInterval(iv.current)
    }
    if (phase === 'idle') {
      t.current = setTimeout(() => setPhase('detected'), 700)
    } else if (phase === 'detected') {
      t.current = setTimeout(() => { setProgress(0); setPhase('matching') }, 1400)
    } else if (phase === 'matching') {
      let p = 0
      iv.current = setInterval(() => {
        p += Math.random() * 14 + 8
        if (p >= 100) {
          p = 100; clearInterval(iv.current!)
          setProgress(100)
          t.current = setTimeout(() => { setFields(0); setPhase('identified') }, 400)
        }
        setProgress(p)
      }, 100)
    } else if (phase === 'identified') {
      let f = 0
      const reveal = () => {
        f++; setFields(f)
        if (f < 6) { t.current = setTimeout(reveal, 240) }
        else { t.current = setTimeout(() => { setPhase('idle'); setVidx(i => (i + 1) % VISITORS.length) }, 3800) }
      }
      t.current = setTimeout(reveal, 300)
    }
    return clear
  }, [phase, vidx])

  const intentCls = (intent: string) =>
    intent === 'High' ? 'bg-emerald-50 text-emerald-700' :
    intent === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-600'

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="bg-primary px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/25" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/25" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/25" />
          <span className="text-white/70 text-xs ml-2">cursive.io · pixel monitor</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-white/80 text-xs">{liveCount.toLocaleString()} today</span>
        </div>
      </div>

      <div className={`p-5 ${compact ? 'min-h-[260px]' : 'min-h-[320px]'} flex flex-col justify-center`}>
        {phase === 'idle' && (
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-gray-400 text-sm">Monitoring traffic on meetcursive.com...</p>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {phase === 'detected' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">NEW VISITOR DETECTED</span>
              <span className="text-gray-400 text-xs">{v.anon.time}</span>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-2">
              {([['IP', v.anon.ip], ['Location', v.anon.location], ['Device', v.anon.device], ['Page', v.anon.page], ['Identity', 'Anonymous']] as [string, string][]).map(([l, val]) => (
                <div key={l} className="flex justify-between text-xs">
                  <span className="text-gray-400">{l}</span>
                  <span className={l === 'Page' ? 'text-primary font-mono' : l === 'Identity' ? 'text-gray-400 italic' : 'text-gray-700'}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === 'matching' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-semibold bg-blue-50 text-primary px-2 py-0.5 rounded">MATCHING IDENTITY GRAPH</span>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Page</span>
                <span className="text-primary font-mono">{v.anon.page}</span>
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Matching against 280M+ verified profiles...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-[10px] text-gray-400 space-y-1 mt-1">
                {progress > 20 && <p>✓ Email graph matched</p>}
                {progress > 45 && <p>✓ Phone records verified</p>}
                {progress > 70 && <p>✓ Company firmographics loaded</p>}
                {progress > 88 && <p>✓ Intent signals scored</p>}
              </div>
            </div>
          </div>
        )}

        {phase === 'identified' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">✓ IDENTITY CONFIRMED</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${intentCls(v.lead.intent)}`}>{v.lead.intent.toUpperCase()} INTENT</span>
            </div>
            <div className="space-y-2">
              {[
                { l: 'Name', val: v.lead.name, n: 1 },
                { l: 'Title', val: v.lead.title, n: 2 },
                { l: 'Company', val: v.lead.company, n: 3 },
                { l: 'Email', val: v.lead.email, n: 4, mono: true },
                { l: 'Phone', val: v.lead.phone, n: 5, mono: true },
                { l: 'Intent Signal', val: v.lead.signal, n: 6, accent: true },
              ].map(({ l, val, n, mono, accent }) => (
                <div
                  key={l}
                  className="flex justify-between text-xs transition-all duration-300"
                  style={{ opacity: fields >= n ? 1 : 0, transform: fields >= n ? 'translateX(0)' : 'translateX(-6px)' }}
                >
                  <span className="text-gray-400">{l}</span>
                  <span className={`${mono ? 'font-mono text-[11px]' : ''} ${accent ? 'text-primary' : 'text-gray-900 font-medium'}`}>{val}</span>
                </div>
              ))}
            </div>
            {fields >= 6 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">Intent Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${v.lead.score}%` }} />
                    </div>
                    <span className="text-primary font-bold text-xs">{v.lead.score}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 px-5 py-2.5 flex items-center justify-between bg-gray-50/50">
        <span className="text-[10px] text-gray-400">Live identification stream</span>
        <div className="flex gap-1.5">
          {VISITORS.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === vidx ? 'bg-primary' : 'bg-gray-300'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SLIDE + LABEL PRIMITIVES ─────────────────────────────────────────────────
function Slide({ children, bg = 'bg-white' }: { children: React.ReactNode; bg?: string }) {
  return (
    <div
      className={`${bg} flex items-start sm:items-center`}
      style={{ height: 'calc(100vh - 52px)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-12 pt-4 sm:py-6 pb-20 sm:pb-6 w-full">
        {children}
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-gray-400 mb-5">{children}</p>
}

// ─── SLIDE 1 — COVER ─────────────────────────────────────────────────────────
function S1({ onNext }: { onNext: () => void }) {
  return (
    <Slide>
      <div className="max-w-4xl mx-auto w-full text-center">
        <Label>Enterprise Platform Overview</Label>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.05] mb-4 sm:mb-6">
          The Identity & Intent
          <span className="block font-cursive text-gray-500 mt-1">Infrastructure for Outbound.</span>
        </h1>
        <p className="text-base sm:text-xl text-gray-600 leading-relaxed mb-6 sm:mb-10 max-w-2xl mx-auto">
          Cursive is the identity layer for outbound, intent, and enrichment. Offline-rooted consumer data, a 15M-domain organic intent network, and a closed feedback loop validated against real conversion outcomes.
        </p>
        <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-10 max-w-2xl mx-auto">
          {[
            { v: '280M+', l: 'Consumer Profiles' },
            { v: '140M+', l: 'Business Profiles' },
            { v: '40\u201360%', l: 'Pixel Match Rate' },
          ].map(s => (
            <div key={s.l}>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-light text-primary">{s.v}</div>
              <div className="text-[10px] sm:text-xs text-gray-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <a
            href={CAL_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors text-sm"
          >
            Book a Demo
          </a>
          <button
            onClick={onNext}
            className="px-8 py-3.5 border border-gray-300 hover:border-primary hover:text-primary text-gray-700 font-semibold rounded-lg transition-colors text-sm"
          >
            See the Platform →
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {['✓ GDPR Compliant', '✓ CCPA Compliant', '✓ SOC 2 Ready'].map(t => (
            <span key={t} className="text-[11px] font-mono text-gray-400">{t}</span>
          ))}
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 2 — THE PROBLEM ────────────────────────────────────────────────────
function S2() {
  return (
    <Slide bg="bg-[#F7F9FB]">
      <div className="max-w-4xl mx-auto w-full">
        <Label>The Problem</Label>
        <h2 className="text-3xl sm:text-5xl font-light text-gray-900 leading-[1.05] mb-4">
          98% of your pipeline
          <span className="block font-cursive text-gray-500 text-3xl sm:text-5xl">walks out the door.</span>
        </h2>
        <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed">
          Your site generates thousands of visits a month. But anonymous traffic, wasted ad spend, and broken cookie infrastructure mean the vast majority of your buyers leave without you ever knowing who they were.
        </p>

        <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200 mb-6 sm:mb-8">
          {[
            { number: '97%', label: 'of visitors leave without ever identifying themselves', color: 'text-red-500' },
            { number: '<2%', label: 'of your total traffic you can actually contact', color: 'text-red-500' },
            { number: '$47', label: 'avg CPC lost to anonymous sessions every single day', color: 'text-amber-500' },
            { number: '12%', label: 'of Americans move yearly, breaking identity records', color: 'text-amber-500' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-4 sm:p-8 lg:p-10">
              <div className={`text-3xl sm:text-5xl lg:text-6xl font-light mb-2 sm:mb-3 ${s.color}`}>{s.number}</div>
              <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-amber-900 text-sm font-medium leading-relaxed">
            <strong>The recoverable pipeline:</strong> At a 40&ndash;60% deterministic pixel match rate (vs. cookie sync at 2&ndash;5% and IP databases at 10&ndash;15%), a site with 10K monthly visitors and a $25K average deal size is leaving an estimated <strong>$60K&ndash;$87K/month</strong> in recoverable pipeline on the table. Every day without identity infrastructure is revenue walking out the door.
          </p>
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 3 — THE PLATFORM ──────────────────────────────────────────────────
function S3() {
  return (
    <Slide>
      <div className="max-w-5xl mx-auto w-full">
        <Label>The Cursive Platform</Label>
        <h2 className="text-3xl sm:text-5xl font-light text-gray-900 leading-[1.05] mb-4">
          One identity spine.
          <span className="block font-cursive text-gray-500 text-3xl sm:text-5xl">Every activation channel.</span>
        </h2>
        <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-10 leading-relaxed">
          Cursive provides a unified identity infrastructure that resolves anonymous visitors to verified individuals — then activates them across CRM, email, ads, and AI outbound in real time.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200 border border-gray-200 mb-8">
          {[
            {
              title: 'B2B Precision',
              desc: 'Target decision-makers with verified personal data that follows the individual, not just the company. Person-level enrichment with email, phone, title, and seniority.',
            },
            {
              title: 'B2C Reach',
              desc: 'Connect with consumers at home using precise, household-level identity resolution. 280M+ consumer profiles with address, demographics, and purchase propensity.',
            },
            {
              title: 'Omnichannel Activation',
              desc: 'A single verified spine enables Geo-Frame resolution, UID2 onboarding, and high-match Cookie/HEM matching. One identity graph, every channel.',
            },
            {
              title: 'Continuous Verification',
              desc: 'Monthly NCOA verification ensures your identity infrastructure remains robust while others decay. 30-day refresh vs. industry-standard quarterly updates.',
            },
          ].map((p, i) => (
            <div key={i} className="bg-white p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{p.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-primary/8 border border-primary/20 rounded-xl px-6 py-4 text-center">
          <p className="text-primary text-sm font-semibold">This isn&apos;t better data. It&apos;s an identity moat.</p>
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 4 — IDENTITY INFRASTRUCTURE ───────────────────────────────────────
function S4() {
  return (
    <Slide bg="bg-[#F7F9FB]">
      <div className="max-w-5xl mx-auto w-full">
        <Label>V4 Identity Infrastructure</Label>
        <h2 className="text-3xl sm:text-5xl font-light text-gray-900 leading-[1.05] mb-4">
          280 million reasons
          <span className="block font-cursive text-gray-500 text-3xl sm:text-5xl">it actually works.</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-px bg-gray-200 border border-gray-200 mb-8">
          {[
            {
              title: '30-Day NCOA Refresh',
              desc: '280M+ verified consumer records reconciled every 30 days against NCOA. Most providers do annually; serious providers do quarterly.',
            },
            {
              title: '15M+ Organic Intent Network',
              desc: 'A proprietary 15M-domain organic network layered on top of standard SSP feeds. Bombora and 6sense pull from the same ~40,000 publisher sites the rest of the industry uses.',
            },
            {
              title: 'Closed Feedback Loop',
              desc: 'Signals are mapped back to source URLs, apps, and exchanges, then validated against real conversion outcomes. Not modeled. Not probabilistic.',
            },
          ].map((p, i) => (
            <div key={i} className="bg-white p-6 lg:p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{p.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-start">
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-gray-400">How we compare</p>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary text-white font-mono">v4</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-4 text-gray-400 font-medium">Metric</th>
                  <th className="text-center py-2 px-3 text-gray-400 font-medium">Others</th>
                  <th className="text-center py-2 px-3 text-primary font-bold">Cursive V4</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  ['Match Rate (deterministic)', 'Cookie 2\u20135% / IP 10\u201315%', '40\u201360%'],
                  ['Email Accuracy', '~78%', '95%+'],
                  ['Phone Numbers', 'Add-on', '\u2713 Included'],
                  ['Intent Network', '~40K SSP-only sources', '\u2713 15M+ organic domains'],
                  ['DNC Compliance', 'Not available', '\u2713 Mobile + Landline'],
                  ['Data Refresh', 'Annual NCOA', '30-Day NCOA'],
                  ['Setup Time', '1-2 weeks', '5 minutes'],
                ].map(([metric, others, cursive]) => (
                  <tr key={metric}>
                    <td className="py-2 px-4 text-gray-600">{metric}</td>
                    <td className="py-2 px-3 text-center text-gray-400">{others}</td>
                    <td className="py-2 px-3 text-center text-primary font-semibold">{cursive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="hidden lg:block">
            <VisitorDemo compact />
          </div>
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 5 — PRODUCT SUITE ─────────────────────────────────────────────────
function S5() {
  return (
    <Slide>
      <div className="max-w-5xl mx-auto w-full">
        <Label>Product Suite</Label>
        <h2 className="text-3xl sm:text-5xl font-light text-gray-900 leading-[1.05] mb-6 sm:mb-10">
          Everything you need to
          <span className="block font-cursive text-gray-500 text-3xl sm:text-5xl">own the funnel.</span>
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 border border-gray-200">
          {[
            {
              num: '01',
              name: 'Super Pixel',
              bullets: ['40\u201360% deterministic match', 'Real-time intent scoring', 'Person-level enrichment'],
            },
            {
              num: '02',
              name: 'Lead Marketplace',
              bullets: ['280M+ enriched contacts', '19,000+ audience segments', 'From $0.50/lead'],
            },
            {
              num: '03',
              name: 'Audience Intelligence',
              bullets: ['AI-powered semantic search', 'B2B & B2C coverage', 'Natural language querying'],
            },
            {
              num: '04',
              name: 'AI Studio',
              bullets: ['Brand voice training', 'Multi-channel sequences', 'Autonomous optimization'],
            },
            {
              num: '05',
              name: 'People Search',
              bullets: ['Real-time enrichment', 'Company/title/seniority', 'Verified email & phone'],
            },
            {
              num: '06',
              name: 'Cursive API',
              bullets: ['Person & company lookup', 'Email verification', '60 req/min rate limit'],
            },
          ].map((product) => (
            <div key={product.name} className="bg-white p-3 sm:p-5">
              <div className="text-xl sm:text-2xl font-light text-primary/20 mb-1 sm:mb-3">{product.num}</div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">{product.name}</h3>
              <ul className="space-y-1">
                {product.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-1.5 text-[10px] sm:text-xs text-gray-600">
                    <span className="text-primary font-bold flex-shrink-0">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 6 — SERVICES ─────────────────────────────────────────────────────
function S6() {
  return (
    <Slide bg="bg-[#F7F9FB]">
      <div className="max-w-5xl mx-auto w-full">
        <Label>Done-For-You Services</Label>
        <h2 className="text-3xl sm:text-5xl font-light text-gray-900 leading-[1.05] mb-6 sm:mb-10">
          Whatever stage you&apos;re at,
          <span className="block font-cursive text-gray-500 text-3xl sm:text-5xl">we meet you there.</span>
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 border border-gray-200">
          {[
            {
              name: 'Cursive Data',
              badge: null,
              bullets: ['Custom ICP-matched lead lists', 'Verified contact data monthly', 'CRM-ready delivery', 'Dedicated data analyst'],
            },
            {
              name: 'Cursive Outbound',
              badge: 'MOST POPULAR',
              bullets: ['Everything in Data plus', 'AI-written email sequences', 'Multi-channel outreach', 'A/B testing', 'Dedicated campaign manager'],
            },
            {
              name: 'Cursive Pipeline',
              badge: null,
              bullets: ['Everything in Outbound plus', 'AI SDR agent', 'Automated meeting booking', 'CRM pipeline management', 'Dedicated growth strategist'],
            },
            {
              name: 'Venture Studio',
              badge: null,
              bullets: ['White-glove growth engine', 'Custom go-to-market', 'Full pipeline ownership', 'For scale-stage companies'],
            },
          ].map((svc) => (
            <div
              key={svc.name}
              className={`p-4 sm:p-5 bg-white relative ${svc.badge ? 'ring-2 ring-primary ring-inset bg-primary/4' : ''}`}
            >
              {svc.badge && (
                <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary text-white font-mono mb-2 inline-block">
                  {svc.badge}
                </span>
              )}
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{svc.name}</h3>
              <ul className="space-y-1.5">
                {svc.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                    <span className="text-primary font-bold flex-shrink-0 mt-0.5">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 7 — INTEGRATIONS & INDUSTRIES ─────────────────────────────────────
function S7() {
  return (
    <Slide>
      <div className="max-w-5xl mx-auto w-full">
        <Label>Integrations & Industries</Label>
        <h2 className="text-3xl sm:text-5xl font-light text-gray-900 leading-[1.05] mb-6 sm:mb-8">
          Plugs into your stack.
          <span className="block font-cursive text-gray-500 text-3xl sm:text-5xl">Serves your vertical.</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-gray-200 border border-gray-200 mb-6 sm:mb-8">
          {[
            { cat: 'CRM', tools: 'Salesforce, HubSpot, Pipedrive' },
            { cat: 'Marketing', tools: 'Mailchimp, ActiveCampaign, Klaviyo' },
            { cat: 'Sales', tools: 'Outreach, SalesLoft, Apollo' },
            { cat: 'Ads', tools: 'Google Ads, Meta Ads, LinkedIn Ads' },
            { cat: 'Automation', tools: 'Zapier, Make, n8n' },
            { cat: 'Data', tools: 'Clay, Clearbit, Snowflake' },
          ].map((c) => (
            <div key={c.cat} className="bg-white p-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-primary mb-1">{c.cat}</p>
              <p className="text-[11px] text-gray-600 leading-relaxed">{c.tools}</p>
            </div>
          ))}
          <div className="bg-white p-3 col-span-2">
            <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-primary mb-1">Plus</p>
            <p className="text-[11px] text-gray-600 leading-relaxed">200+ native integrations via API, webhooks, and Zapier</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-gray-400 mb-4">Industries We Serve</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-px bg-gray-200 border border-gray-200">
            {[
              'B2B Software', 'Agencies', 'Ecommerce', 'Education',
              'Financial Services', 'Franchises', 'Home Services', 'Media & Ads',
              'Real Estate', 'Retail', 'Technology', 'Healthcare',
            ].map((ind) => (
              <div key={ind} className="bg-white px-3 py-2.5 text-[11px] text-gray-700 text-center">
                {ind}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 8 — RESULTS ───────────────────────────────────────────────────────
function S8() {
  return (
    <Slide bg="bg-[#F7F9FB]">
      <div className="max-w-5xl mx-auto w-full">
        <Label>Results</Label>
        <h2 className="text-3xl sm:text-5xl font-light text-gray-900 leading-[1.05] mb-6 sm:mb-8">
          The numbers
          <span className="block font-cursive text-gray-500 text-3xl sm:text-5xl">speak for themselves.</span>
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 border border-gray-200 mb-6 sm:mb-8">
          {[
            { stat: '40x ROI', detail: 'AI SaaS, 30 days' },
            { stat: '$11M', detail: 'Pipeline from $250K' },
            { stat: '5x CPC', detail: 'Reduction, 90 days' },
            { stat: '$24M', detail: 'Pipeline in 3 days' },
          ].map((s) => (
            <div key={s.stat} className="bg-white p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-light text-primary mb-1 sm:mb-2">{s.stat}</div>
              <p className="text-[10px] sm:text-xs text-gray-400">{s.detail}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3 mb-6 sm:mb-8">
          {[
            {
              quote: 'We installed it on a Friday. By Monday we had 47 identified leads from weekend traffic we would have completely lost. Within two weeks it was our highest-volume lead source.',
              author: 'VP of Sales, Series B B2B SaaS',
            },
            {
              quote: 'Cursive replaced three separate tools for us — visitor ID, enrichment, and outbound. The data quality is unmatched.',
              author: 'Director of Growth, E-Commerce Brand',
            },
          ].map((t) => (
            <div key={t.author} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 flex items-start gap-3">
              <svg className="w-5 h-5 text-primary/30 flex-shrink-0 mt-0.5 hidden sm:block" fill="currentColor" viewBox="0 0 24 24"><path d="M11.192 15.757c0-.88-.23-1.618-.69-2.217-.326-.412-.768-.683-1.327-.812-.55-.128-1.07-.137-1.54-.028-.16-.95.1-1.95.78-3 .53-.81 1.24-1.48 2.13-2.02L9.027 6c-.75.506-1.4 1.11-1.94 1.81-.54.7-.95 1.44-1.23 2.22-.28.78-.41 1.58-.4 2.39.02.8.2 1.56.55 2.27.34.71.83 1.27 1.47 1.68.64.41 1.36.62 2.18.62.77 0 1.43-.19 1.98-.57.55-.38.83-.92.83-1.63zm8 0c0-.88-.23-1.618-.69-2.217-.326-.42-.77-.695-1.327-.825-.56-.13-1.07-.14-1.54-.022-.16-.95.1-1.95.78-3 .53-.81 1.24-1.48 2.13-2.02L17.027 6c-.75.506-1.4 1.11-1.94 1.81-.54.7-.95 1.44-1.23 2.22-.28.78-.41 1.58-.4 2.39.02.8.2 1.56.55 2.27.34.71.83 1.27 1.47 1.68.64.41 1.36.62 2.18.62.77 0 1.43-.19 1.98-.57.55-.38.83-.92.83-1.63z"/></svg>
              <div>
                <p className="text-gray-700 text-xs sm:text-sm leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-[10px] sm:text-[11px] text-gray-400 font-mono mt-2">— {t.author}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-px bg-gray-200 border border-gray-200">
          {[
            { v: '40\u201360%', l: 'Match Rate' },
            { v: '95%+', l: 'Accuracy' },
            { v: '0.05%', l: 'Bounce' },
            { v: '<5 Min', l: 'Setup' },
          ].map(s => (
            <div key={s.l} className="text-center bg-white py-3">
              <div className="text-lg sm:text-xl font-light text-gray-900">{s.v}</div>
              <div className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 9 — HOW IT WORKS ─────────────────────────────────────────────────
function S9() {
  return (
    <Slide>
      <div className="max-w-5xl mx-auto w-full">
        <Label>How It Works</Label>
        <h2 className="text-3xl sm:text-5xl font-light text-gray-900 leading-[1.05] mb-3">
          From anonymous visitor to
          <span className="block font-cursive text-gray-500 text-3xl sm:text-5xl">qualified pipeline.</span>
        </h2>
        <p className="text-gray-500 text-base sm:text-lg mb-6 sm:mb-10">Four steps. Five minutes. No engineering sprint required.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-200 border border-gray-200 mb-6 sm:mb-8">
          {[
            {
              num: '01',
              title: 'Install',
              desc: 'One script tag on your site. Works on any stack. No engineering sprint. 5 minutes.',
            },
            {
              num: '02',
              title: 'Identify',
              desc: 'Every visitor matched deterministically against an offline-rooted graph of 280M+ verified consumer profiles. 40\u201360% pixel match rate.',
            },
            {
              num: '03',
              title: 'Enrich & Score',
              desc: 'Full contact details + intent signals. Name, email, phone, company, seniority, pages visited.',
            },
            {
              num: '04',
              title: 'Activate',
              desc: 'Leads flow to your CRM, ad platforms, email sequences, or AI SDR — automatically.',
            },
          ].map((p) => (
            <div key={p.num} className="bg-white p-6">
              <div className="text-4xl font-light text-primary/20 mb-5">{p.num}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{p.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-gray-200 rounded-xl px-6 py-4 gap-3">
          <p className="text-sm text-gray-700 font-medium">From installation to first identified lead: <strong className="text-primary">under 5 minutes.</strong></p>
          <div className="flex items-center gap-4 text-[11px] text-gray-400 font-mono">
            <span>✓ GDPR</span>
            <span>✓ CCPA</span>
            <span>✓ SOC 2 Ready</span>
          </div>
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 10 — WHY CURSIVE ──────────────────────────────────────────────────
function S10() {
  return (
    <Slide bg="bg-[#F7F9FB]">
      <div className="max-w-5xl mx-auto w-full">
        <Label>Why Cursive</Label>
        <h2 className="text-3xl sm:text-5xl font-light text-gray-900 leading-[1.05] mb-6 sm:mb-10">
          Not just better data.
          <span className="block font-cursive text-gray-500 text-3xl sm:text-5xl">A structural advantage.</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gray-200 border border-gray-200 mb-4 sm:mb-6">
          {[
            {
              label: 'Other Visitor ID Tools',
              accent: 'text-gray-400',
              bg: 'bg-white',
              highlight: false,
              items: [
                { ok: false, text: 'Cookie sync 2\u20135% / IP DB 10\u201315% match' },
                { ok: false, text: 'Company-level only' },
                { ok: false, text: 'Stale data, annual refresh' },
                { ok: false, text: 'SSP-only intent (~40K domains)' },
                { ok: false, text: 'Complex setup (weeks)' },
                { ok: false, text: 'Phone as paid add-on' },
              ],
            },
            {
              label: 'Cursive',
              accent: 'text-primary',
              bg: 'bg-white',
              highlight: true,
              items: [
                { ok: true, text: '40\u201360% deterministic pixel match' },
                { ok: true, text: 'Person-level + verified email' },
                { ok: true, text: '30-day NCOA continuous refresh' },
                { ok: true, text: '15M+ domain organic intent network' },
                { ok: true, text: '5-minute setup one script tag' },
                { ok: true, text: 'Phone + DNC compliance included' },
              ],
            },
            {
              label: 'Traditional Lead Gen',
              accent: 'text-gray-400',
              bg: 'bg-white',
              highlight: false,
              items: [
                { ok: false, text: '3% form conversion rate' },
                { ok: false, text: '$200-500 cost per lead' },
                { ok: false, text: 'No real-time intent' },
                { ok: false, text: 'Slow follow-up cold outbound' },
                { ok: false, text: 'Generic contacts poor quality' },
                { ok: false, text: 'No behavioral data' },
              ],
            },
          ].map((col, ci) => (
            <div key={ci} className={`${col.bg} p-6 ${col.highlight ? 'ring-2 ring-primary ring-inset bg-primary/4' : ''}`}>
              {col.highlight ? (
                <div className="flex items-center gap-1.5 mb-4">
                  <img src="/cursive-logo.png" alt="Cursive" className="h-3.5 w-auto" />
                  <p className="text-[10px] font-mono uppercase tracking-[0.15em] font-black text-primary">V4</p>
                </div>
              ) : (
                <p className={`text-[10px] font-mono uppercase tracking-[0.15em] mb-4 ${col.accent}`}>{col.label}</p>
              )}
              <div className="space-y-2.5">
                {col.items.map((item, ii) => (
                  <div key={ii} className="flex items-start gap-2 text-xs">
                    <span className={`flex-shrink-0 font-bold mt-0.5 ${item.ok ? 'text-primary' : 'text-red-400'}`}>{item.ok ? '✓' : '✕'}</span>
                    <span className={item.ok ? 'text-gray-700' : 'text-gray-400'}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200 border border-gray-200">
          {[
            { metric: '40\u201360%', vs: 'Cookie 2\u20135%', title: 'Match Rate' },
            { metric: '0.05%', vs: '20% avg', title: 'Bounce Rate' },
            { metric: '15M+', vs: '~40K SSP', title: 'Intent Network' },
            { metric: '30-day', vs: 'Annual', title: 'NCOA Refresh' },
          ].map((d) => (
            <div key={d.title} className="bg-white p-3 sm:p-4">
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-xl sm:text-2xl font-light text-primary">{d.metric}</span>
                <span className="text-[9px] sm:text-[10px] text-gray-400 font-mono">vs {d.vs}</span>
              </div>
              <p className="text-[11px] font-semibold text-gray-700">{d.title}</p>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 11 — CTA CLOSE ────────────────────────────────────────────────────
function S11() {
  return (
    <Slide>
      <div className="max-w-4xl mx-auto w-full">
        <Label>Get Started</Label>
        <h2 className="text-3xl sm:text-5xl font-light text-gray-900 leading-[1.05] mb-6 sm:mb-8">
          Ready to build
          <span className="block font-cursive text-gray-500 text-4xl sm:text-6xl">your identity moat?</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="border-2 border-primary rounded-xl p-6 bg-white">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary mb-4">Option 1</p>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Book a Demo</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-5">
              30-minute call with our team. See your visitors identified live. Get a custom ROI analysis for your site.
            </p>
            <div className="space-y-2 mb-6">
              {[
                '30-min live walkthrough',
                'See your visitors identified in real-time',
                'Custom ROI analysis',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="text-primary font-bold">✓</span>
                  {item}
                </div>
              ))}
            </div>
            <a
              href={CAL_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
            >
              Schedule Demo →
            </a>
          </div>
          <div className="border border-gray-200 rounded-xl p-6 bg-white">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-gray-400 mb-4">Option 2</p>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Start Free Trial</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-5">
              14-day free trial. No credit card required. Get your first identified leads in under 5 minutes.
            </p>
            <div className="space-y-2 mb-6">
              {[
                '14-day free trial',
                'No credit card required',
                'First leads in 5 minutes',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="text-gray-400">→</span>
                  {item}
                </div>
              ))}
            </div>
            <a
              href="https://leads.meetcursive.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-6 py-3 border border-gray-300 hover:border-primary hover:text-primary text-gray-700 font-semibold rounded-lg transition-colors"
            >
              Start Free →
            </a>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 mb-6">
          {[
            { v: '40\u201360%', l: 'Pixel Match Rate' },
            { v: '0.05%', l: 'Email Bounce Rate' },
            { v: '5 min', l: 'Time to First Lead' },
          ].map(s => (
            <div key={s.l} className="text-center">
              <div className="text-2xl font-light text-gray-900">{s.v}</div>
              <div className="text-xs text-gray-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-100">
          <img src="/cursive-logo.png" alt="Cursive" className="h-5 w-auto opacity-40" />
          <span className="text-[11px] text-gray-300 font-mono">© {new Date().getFullYear()} Cursive. All rights reserved.</span>
        </div>
      </div>
    </Slide>
  )
}

// ─── DECK SHELL ───────────────────────────────────────────────────────────────
export default function EnterpriseDeckPage() {
  const [current, setCurrent] = useState(0)
  const [slideKey, setSlideKey] = useState(0)
  const busy = useRef(false)

  const go = useCallback((n: number) => {
    if (busy.current || n < 0 || n >= SLIDE_COUNT) return
    busy.current = true
    setCurrent(n)
    setSlideKey(k => k + 1)
    setTimeout(() => { busy.current = false }, 280)
  }, [])

  const next = useCallback(() => go(Math.min(current + 1, SLIDE_COUNT - 1)), [current, go])
  const prev = useCallback(() => go(Math.max(current - 1, 0)), [current, go])

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev])

  // Touch/swipe nav for mobile
  const touchStart = useRef<number | null>(null)
  useEffect(() => {
    const onStart = (e: TouchEvent) => { touchStart.current = e.touches[0].clientX }
    const onEnd = (e: TouchEvent) => {
      if (touchStart.current === null) return
      const diff = touchStart.current - e.changedTouches[0].clientX
      if (Math.abs(diff) > 60) { diff > 0 ? next() : prev() }
      touchStart.current = null
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd) }
  }, [next, prev])

  const renderSlide = () => {
    switch (current) {
      case 0: return <S1 onNext={next} />
      case 1: return <S2 />
      case 2: return <S3 />
      case 3: return <S4 />
      case 4: return <S5 />
      case 5: return <S6 />
      case 6: return <S7 />
      case 7: return <S8 />
      case 8: return <S9 />
      case 9: return <S10 />
      case 10: return <S11 />
      default: return <S1 onNext={next} />
    }
  }

  const pct = ((current + 1) / SLIDE_COUNT) * 100

  return (
    <div className="bg-white" style={{ position: 'fixed', inset: 0, zIndex: 100, overflowY: 'auto' }}>
      <style>{`
        @keyframes deckSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .deck-slide { animation: deckSlideIn 240ms ease forwards; }
      `}</style>

      {/* ── TOP CHROME ── */}
      <div className="fixed top-0 left-0 right-0 z-[110]">
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 h-12 flex items-center justify-between">
          <a href="/">
            <img src="/cursive-logo.png" alt="Cursive" className="h-6 w-auto" />
          </a>
          <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400">
            <span className="hidden sm:inline text-gray-300">Enterprise</span>
            <span className="hidden sm:inline text-gray-200">·</span>
            <span className="hidden sm:inline">{SLIDE_LABELS[current]}</span>
            <span className="hidden sm:inline text-gray-200">·</span>
            <span>{String(current + 1).padStart(2, '0')} / {String(SLIDE_COUNT).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* ── SLIDE CONTENT ── */}
      <div className="pt-[52px]" key={slideKey}>
        <div className="deck-slide">
          {renderSlide()}
        </div>
      </div>

      {/* ── PREV ARROW ── */}
      <button
        onClick={prev}
        disabled={current === 0}
        className="hidden sm:flex fixed left-3 top-1/2 -translate-y-1/2 z-[110] w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md hover:border-primary hover:text-primary hover:shadow-lg transition-all disabled:opacity-0 text-gray-500"
        aria-label="Previous slide"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
      </button>

      {/* ── NEXT ARROW ── */}
      <button
        onClick={next}
        disabled={current === SLIDE_COUNT - 1}
        className="hidden sm:flex fixed right-3 top-1/2 -translate-y-1/2 z-[110] w-10 h-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md hover:border-primary hover:text-primary hover:shadow-lg transition-all disabled:opacity-0 text-gray-500"
        aria-label="Next slide"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
      </button>

      {/* ── DOT NAV ── */}
      <div className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-1 sm:gap-1.5 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-sm">
        {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            title={SLIDE_LABELS[i]}
            className={`rounded-full transition-all duration-200 ${i === current ? 'w-4 sm:w-6 h-1.5 sm:h-2 bg-primary' : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-gray-300 hover:bg-gray-400'}`}
            aria-label={`Go to slide ${i + 1}: ${SLIDE_LABELS[i]}`}
          />
        ))}
      </div>

      {/* ── FLOATING BOOK A DEMO BUTTON ── */}
      <a
        href={CAL_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-10 sm:bottom-14 right-3 sm:right-6 z-[120] px-3.5 py-2 sm:px-5 sm:py-3 bg-primary hover:bg-primary-dark text-white text-[11px] sm:text-sm font-bold rounded-full shadow-lg transition-all hover:shadow-xl"
      >
        Book a Demo
      </a>
    </div>
  )
}
