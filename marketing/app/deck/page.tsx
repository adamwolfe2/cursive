'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { RevenueCalculator } from '@/components/revenue-calculator/RevenueCalculator'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CAL_LINK = 'https://cal.com/gotdarrenhill/30min'
const SLIDE_COUNT = 9

const VISITORS = [
  {
    id: 1,
    anon: { ip: '104.21.47.201', location: 'Austin, TX', device: 'MacBook Pro', page: '/pricing', time: '2:14 PM CST' },
    lead: { name: 'Marcus Chen', title: 'VP of Marketing', company: 'Horizon SaaS', email: 'm.chen@horizonsaas.com', phone: '+1 (512) 847-2391', intent: 'High', signal: 'Viewed /pricing 3× this week', score: 94 },
  },
  {
    id: 2,
    anon: { ip: '198.41.128.84', location: 'Chicago, IL', device: 'Windows 11 PC', page: '/services', time: '2:17 PM CST' },
    lead: { name: 'Sarah Okonkwo', title: 'Director of Growth', company: 'Apex Revenue Co.', email: 's.okonkwo@apexrevenue.com', phone: '+1 (312) 555-9832', intent: 'High', signal: 'Visited /services + /pricing same session', score: 89 },
  },
  {
    id: 3,
    anon: { ip: '172.64.80.100', location: 'New York, NY', device: 'iPhone 15 Pro', page: '/data-access', time: '2:19 PM CST' },
    lead: { name: 'James Thornton', title: 'Chief Revenue Officer', company: 'BuildPath Technologies', email: 'j.thornton@buildpath.io', phone: '+1 (646) 203-7741', intent: 'Medium', signal: 'Downloaded case study · returned 3 days later', score: 72 },
  },
  {
    id: 4,
    anon: { ip: '104.18.10.225', location: 'Denver, CO', device: 'MacBook Air M3', page: '/superpixel', time: '2:21 PM CST' },
    lead: { name: 'Priya Nair', title: 'Head of Demand Gen', company: 'CloudBridge Inc.', email: 'p.nair@cloudbridge.com', phone: '+1 (720) 441-0983', intent: 'High', signal: 'Viewed /superpixel 4× across 2 sessions', score: 91 },
  },
]

const PHASES = [
  { num: '01', title: 'Install', desc: 'One script tag on your site. Works on WordPress, Webflow, React, Shopify — any stack. No engineering sprint.', code: '<script src="cdn.cursive.io/px.js">' },
  { num: '02', title: 'Match', desc: 'Every visitor cross-referenced against 420M+ verified contacts in real-time. No cookies. No fingerprinting.', code: '420M+ profiles · <200ms match' },
  { num: '03', title: 'Score', desc: 'Intent AI scores each visitor on page visited, scroll depth, return frequency, and session behavior.', code: '60B+ daily intent signals' },
  { num: '04', title: 'Deliver', desc: 'Verified name, email, phone, and intent score delivered to your CRM or inbox before the session ends.', code: 'HubSpot · Salesforce · Slack' },
]

const PROBLEM_STATS = [
  { number: '97%', label: 'of B2B visitors leave without ever identifying themselves' },
  { number: '<2%', label: 'of your traffic you can currently contact' },
  { number: '$47', label: 'avg cost-per-click lost to anonymous sessions every day' },
  { number: '8×', label: 'more identified contacts after Super Pixel install' },
]

const PROBLEMS = [
  { title: 'Cookies Are Dying', body: "iOS and Chrome block third-party cookies by default. Legacy pixel tech is evaporating in real time. You need a first-party identity layer that doesn't depend on browser storage." },
  { title: 'Forms Convert at 0.5%', body: "You spend tens of thousands per month driving traffic. 99.5% of visitors won't fill a form. You're paying for attention you'll never be able to act on." },
  { title: 'IP Lookup Shows Buildings', body: '"Acme Corp visited your site." Great — but which of their 300 employees? IP tools give you a door to knock on. Cursive hands you the name of the person who answered.' },
]

const DIFFS = [
  { metric: '70%', vs: '15% competitor avg', title: 'Identification Rate', body: 'Standard pixels rely on cookie syncing — blocked by iOS, degrading on Chrome. Our first-party graph covers 98% of US households without any browser dependency.' },
  { metric: '0.05%', vs: '20% industry avg', title: 'Email Bounce Rate', body: 'Every email is live-verified against SMTP at delivery. Bounced contacts are replaced automatically. Your sender score stays pristine.' },
  { metric: 'Person', vs: 'Company only', title: 'Identity Depth', body: 'IP tools give you the company. We give you the person: full name, direct email, mobile phone, job title, LinkedIn, and company firmographics.' },
  { metric: '30-day', vs: 'Quarterly refresh', title: 'Data Freshness', body: 'Our contact graph syncs with NCOA every 30 days. You never pay for a contact who changed jobs or went out of business last quarter.' },
]

const SAMPLE_LEAD = {
  name: 'James Sullivan',
  title: 'VP of Sales',
  company: 'Meridian Technology Group',
  email: 'j.sullivan@meridiantech.com',
  phone: '+1 (512) 847-2391',
  page: '/pricing',
  visitTime: 'Today at 2:14 PM CST',
  intent: 'High — 7-day spike detected',
}

const SLIDE_LABELS = ['Hero', 'The Problem', 'Why It Happens', 'How It Works', 'Identity Graph', 'ROI Calculator', 'Lead Record', 'Why Cursive', 'Book Demo']

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
      t.current = setTimeout(() => setPhase('detected'), 1800)
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
      <div className="bg-[#007AFF] px-4 py-2.5 flex items-center justify-between">
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
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#007AFF] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
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
                  <span className={l === 'Page' ? 'text-[#007AFF] font-mono' : l === 'Identity' ? 'text-gray-400 italic' : 'text-gray-700'}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === 'matching' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-semibold bg-blue-50 text-[#007AFF] px-2 py-0.5 rounded">MATCHING IDENTITY GRAPH</span>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Page</span>
                <span className="text-[#007AFF] font-mono">{v.anon.page}</span>
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Cross-referencing 420M+ profiles...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#007AFF] h-full rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
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
                  <span className={`${mono ? 'font-mono text-[11px]' : ''} ${accent ? 'text-[#007AFF]' : 'text-gray-900 font-medium'}`}>{val}</span>
                </div>
              ))}
            </div>
            {fields >= 6 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">Intent Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#007AFF] h-full rounded-full transition-all duration-1000" style={{ width: `${v.lead.score}%` }} />
                    </div>
                    <span className="text-[#007AFF] font-bold text-xs">{v.lead.score}</span>
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
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === vidx ? 'bg-[#007AFF]' : 'bg-gray-300'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── SLIDE + LABEL PRIMITIVES ─────────────────────────────────────────────────
function Slide({ children, bg = 'bg-white' }: { children: React.ReactNode; bg?: string }) {
  return (
    <div className={`${bg} min-h-[calc(100vh-52px)]`}>
      <div className="max-w-6xl mx-auto px-6 sm:px-12 py-16 w-full flex flex-col justify-center min-h-[calc(100vh-52px)]">
        {children}
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-gray-400 mb-5">{children}</p>
}

// ─── SLIDE 1 — HERO ───────────────────────────────────────────────────────────
function S1() {
  return (
    <Slide>
      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-center">
        <div>
          <Label>Cursive Super Pixel</Label>
          <h1 className="text-5xl lg:text-6xl font-light text-gray-900 leading-[1.05] mb-6">
            Your website is generating leads.
            <span className="block font-cursive text-[#007AFF] mt-1">You just can&apos;t see them.</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            The Cursive Super Pixel identifies up to <strong className="text-gray-900">70% of anonymous B2B visitors</strong> — name, email, phone, company, and intent — before they leave your site.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <a href={CAL_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#007AFF] hover:bg-[#0066DD] text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-lg shadow-[#007AFF]/20">
              Book a Live Demo
            </a>
            <a href="/superpixel" className="text-[#007AFF] font-medium text-sm hover:underline">
              Calculate your revenue leak →
            </a>
          </div>
        </div>
        <div className="hidden lg:block">
          <VisitorDemo />
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
        <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-4">
          You&apos;re paying for traffic
          <span className="block font-cursive text-[#007AFF] text-6xl">you can&apos;t follow up with.</span>
        </h2>
        <p className="text-xl text-gray-600 mb-12">Every month, thousands of buyers visit your site, evaluate your product, and leave — without you knowing who they are.</p>
        <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200">
          {PROBLEM_STATS.map((s, i) => (
            <div key={i} className="bg-white p-8 lg:p-10">
              <div className="text-5xl lg:text-6xl font-light text-gray-900 mb-3">{s.number}</div>
              <p className="text-gray-500 text-sm leading-relaxed">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 3 — WHY IT HAPPENS ─────────────────────────────────────────────────
function S3() {
  return (
    <Slide>
      <div className="max-w-5xl mx-auto w-full">
        <Label>Why It Happens</Label>
        <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-12">
          Three structural flaws
          <span className="block font-cursive text-gray-500 text-5xl">in how tracking works today.</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-px bg-gray-200 border border-gray-200">
          {PROBLEMS.map((p, i) => (
            <div key={i} className="bg-white p-8">
              <div className="text-4xl font-light text-gray-200 mb-5">0{i + 1}</div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">{p.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 4 — HOW IT WORKS ───────────────────────────────────────────────────
function S4() {
  return (
    <Slide bg="bg-[#F7F9FB]">
      <div className="max-w-5xl mx-auto w-full">
        <Label>How the Super Pixel Works</Label>
        <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-12">
          Four phases.
          <span className="block font-cursive text-[#007AFF] text-6xl">One script tag.</span>
        </h2>
        <div className="grid md:grid-cols-4 gap-px bg-gray-200 border border-gray-200">
          {PHASES.map((p, i) => (
            <div key={i} className="bg-white p-6 lg:p-8">
              <div className="text-4xl font-light text-[#007AFF]/20 mb-5">{p.num}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{p.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed mb-4">{p.desc}</p>
              <code className="text-[10px] bg-gray-50 border border-gray-200 px-2 py-1 rounded text-gray-400 block leading-snug">{p.code}</code>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 5 — UNDER THE HOOD ─────────────────────────────────────────────────
function S5() {
  return (
    <Slide>
      <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto w-full">
        <div>
          <Label>The Identity Graph</Label>
          <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-6">
            420 million reasons
            <span className="block font-cursive text-gray-500 text-5xl">it actually works.</span>
          </h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>Most identification tools match visitors to companies using IP address lookup. That&apos;s a 1995 solution to a 2025 problem.</p>
            <p>Cursive maintains a first-party identity graph of <strong className="text-gray-900">420M+ verified US contacts</strong>, refreshed every 30 days via NCOA. When a visitor lands on your site, we cross-reference device signals, session data, and behavioral patterns against this graph in under 200ms.</p>
            <p>No cookies. No fingerprinting. No privacy violations. Just a match rate that&apos;s <strong className="text-gray-900">4× higher than any competitor</strong>.</p>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { v: '420M+', l: 'Verified contacts' },
              { v: '98%', l: 'US household coverage' },
              { v: '<200ms', l: 'Match latency' },
            ].map(s => (
              <div key={s.l} className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-2xl font-light text-[#007AFF] mb-1">{s.v}</div>
                <div className="text-[11px] text-gray-500">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden lg:block">
          <VisitorDemo compact />
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 6 — ROI CALCULATOR ─────────────────────────────────────────────────
function S6() {
  return (
    <Slide bg="bg-[#F7F9FB]">
      <div className="max-w-4xl mx-auto w-full">
        <Label>Revenue Impact Calculator</Label>
        <h2 className="text-4xl font-light text-gray-900 mb-2">
          How much are you leaving on the table?
        </h2>
        <p className="text-gray-500 text-lg mb-8">Enter any domain and we&apos;ll calculate the revenue your anonymous traffic is costing you right now.</p>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 lg:p-8">
          <RevenueCalculator />
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 7 — SAMPLE LEAD RECORD ────────────────────────────────────────────
function S7() {
  return (
    <Slide>
      <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto w-full">
        <div>
          <Label>What You&apos;ll Receive</Label>
          <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-6">
            Not a company name.
            <span className="block font-cursive text-[#007AFF] text-5xl">A real person.</span>
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-5">Every identified visitor arrives as a full, verified contact record — enriched with company data, intent score, and the exact page that triggered the match.</p>
          <p className="text-gray-600 text-lg leading-relaxed">Delivered in real-time to your CRM, inbox, or webhook. No export. No CSV. No delay.</p>
          <div className="mt-8 space-y-3">
            {[
              'Name, title, direct work email, and mobile',
              'Company firmographics and LinkedIn',
              'Page visited, time on site, and intent score',
              'Delivered to HubSpot, Salesforce, or Slack',
            ].map(item => (
              <div key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                <svg className="w-4 h-4 text-[#007AFF] mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#007AFF] px-5 py-3.5 flex items-center justify-between">
              <span className="text-white font-semibold text-sm uppercase tracking-wide">Sample Lead Record</span>
              <span className="flex items-center gap-1.5 text-emerald-300 text-xs font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
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
              <div className="space-y-3">
                {([
                  ['Email', SAMPLE_LEAD.email],
                  ['Mobile', SAMPLE_LEAD.phone],
                  ['Company', SAMPLE_LEAD.company],
                  ['Page Visited', SAMPLE_LEAD.page],
                  ['Visit Time', SAMPLE_LEAD.visitTime],
                  ['Intent Score', SAMPLE_LEAD.intent],
                ] as [string, string][]).map(([l, v]) => (
                  <div key={l} className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">{l}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-800">{v}</span>
                      <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 text-center pt-3 border-t border-gray-100">* Sample record — actual fields vary by match quality</p>
            </div>
          </div>
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 8 — DIFFERENTIATORS ────────────────────────────────────────────────
function S8() {
  return (
    <Slide bg="bg-[#F7F9FB]">
      <div className="max-w-5xl mx-auto w-full">
        <Label>Why Cursive</Label>
        <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-12">
          We&apos;re not just better.
          <span className="block font-cursive text-gray-500 text-5xl">We&apos;re structurally different.</span>
        </h2>
        <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200">
          {DIFFS.map((d, i) => (
            <div key={i} className="bg-white p-8">
              <div className="flex items-baseline gap-3 mb-4">
                <div className="text-4xl font-light text-[#007AFF]">{d.metric}</div>
                <div className="text-xs text-gray-400 font-mono">vs {d.vs}</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{d.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{d.body}</p>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 9 — CLOSING CTA ────────────────────────────────────────────────────
function S9() {
  return (
    <Slide>
      <div className="text-center max-w-3xl mx-auto w-full">
        <Label>Ready to See It Live?</Label>
        <h2 className="text-6xl lg:text-7xl font-light text-gray-900 leading-[1.02] mb-6">
          See it running
          <span className="block font-cursive text-[#007AFF]">on your site.</span>
        </h2>
        <p className="text-xl text-gray-600 mb-10 max-w-xl mx-auto leading-relaxed">
          Book a 30-minute demo. We&apos;ll install the pixel live on your site and show you exactly who&apos;s visiting — before the call ends.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href={CAL_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-10 py-4 bg-[#007AFF] hover:bg-[#0066DD] text-white font-bold text-lg rounded-lg transition-colors shadow-lg shadow-[#007AFF]/25"
          >
            Book a Free Demo →
          </a>
          <a href="/superpixel" className="text-[#007AFF] font-medium hover:underline">
            Calculate your revenue leak first
          </a>
        </div>
        <div className="grid grid-cols-3 gap-8 pt-10 border-t border-gray-200 max-w-md mx-auto">
          {[
            { v: '70%', l: 'Visitor ID Rate' },
            { v: '0.05%', l: 'Bounce Rate' },
            { v: '420M+', l: 'Verified Contacts' },
          ].map(s => (
            <div key={s.l} className="text-center">
              <div className="text-2xl font-light text-gray-900">{s.v}</div>
              <div className="text-xs text-gray-400 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  )
}

// ─── DECK SHELL ───────────────────────────────────────────────────────────────
const SLIDE_COMPONENTS = [S1, S2, S3, S4, S5, S6, S7, S8, S9]

export default function DeckPage() {
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev])

  const SlideComponent = SLIDE_COMPONENTS[current]
  const pct = ((current + 1) / SLIDE_COUNT) * 100

  return (
    <div className="relative bg-white" style={{ minHeight: '100vh' }}>
      <style>{`
        @keyframes deckSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .deck-slide { animation: deckSlideIn 240ms ease forwards; }
      `}</style>

      {/* ── TOP CHROME ── */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-[#007AFF] transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 h-12 flex items-center justify-between">
          <a href="/" className="font-cursive text-2xl text-gray-900 hover:text-[#007AFF] transition-colors leading-none">
            Cursive
          </a>
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-gray-400">
            <span className="text-gray-300">Super Pixel</span>
            <span className="text-gray-200">·</span>
            <span>{SLIDE_LABELS[current]}</span>
            <span className="text-gray-200">·</span>
            <span>{String(current + 1).padStart(2, '0')} / {String(SLIDE_COUNT).padStart(2, '0')}</span>
          </div>
          <a
            href={CAL_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0066DD] px-3 py-1.5 rounded transition-colors"
          >
            Book Demo
          </a>
        </div>
      </div>

      {/* ── SLIDE CONTENT ── */}
      <div className="pt-[52px]" key={slideKey}>
        <div className="deck-slide">
          <SlideComponent />
        </div>
      </div>

      {/* ── PREV ARROW ── */}
      <button
        onClick={prev}
        disabled={current === 0}
        className="fixed left-3 top-1/2 -translate-y-1/2 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:border-[#007AFF] hover:text-[#007AFF] transition-all disabled:opacity-0 text-gray-500 text-lg"
        aria-label="Previous slide"
      >
        ‹
      </button>

      {/* ── NEXT ARROW ── */}
      <button
        onClick={next}
        disabled={current === SLIDE_COUNT - 1}
        className="fixed right-3 top-1/2 -translate-y-1/2 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:border-[#007AFF] hover:text-[#007AFF] transition-all disabled:opacity-0 text-gray-500 text-lg"
        aria-label="Next slide"
      >
        ›
      </button>

      {/* ── DOT NAV ── */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 shadow-sm">
        {SLIDE_COMPONENTS.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            title={SLIDE_LABELS[i]}
            className={`rounded-full transition-all duration-200 ${i === current ? 'w-6 h-2 bg-[#007AFF]' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'}`}
            aria-label={`Go to slide ${i + 1}: ${SLIDE_LABELS[i]}`}
          />
        ))}
      </div>
    </div>
  )
}
