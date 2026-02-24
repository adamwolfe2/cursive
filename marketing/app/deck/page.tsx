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
  { number: '97%', label: 'of B2B visitors leave without ever identifying themselves', color: 'text-red-500' },
  { number: '<2%', label: 'of your traffic you can currently contact', color: 'text-red-500' },
  { number: '$47', label: 'avg cost-per-click lost to anonymous sessions every day', color: 'text-amber-500' },
  { number: '8×', label: 'more identified contacts after Super Pixel install', color: 'text-[#007AFF]' },
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
    <div
      className={`${bg} flex items-center`}
      style={{ height: 'calc(100vh - 52px)', overflowY: 'auto' }}
    >
      <div className="max-w-6xl mx-auto px-6 sm:px-12 py-6 w-full">
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
            Your website generated pipeline last month.
            <span className="block font-cursive text-gray-500 mt-1">You just didn&apos;t capture it.</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-6">
            The average B2B website loses <strong className="text-gray-900">97% of visitors</strong> without capturing their identity. The Cursive Super Pixel recovers <strong className="text-gray-900">70% of them</strong> — automatically enriched with:
          </p>
          <div className="space-y-2 mb-6">
            {[
              'Full name & verified direct email',
              'Mobile phone number',
              'Company, role & seniority',
              'Real-time intent signals & page history',
              'Account-level buying signals',
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                <svg className="w-4 h-4 text-[#007AFF] flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                {item}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 border-t border-gray-100">
            {['✓ GDPR Compliant', '✓ CCPA Compliant', '✓ No PII Stored', '✓ SOC 2 Ready'].map(t => (
              <span key={t} className="text-[11px] font-mono text-gray-400">{t}</span>
            ))}
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
          Here&apos;s what&apos;s happening on your website
          <span className="block font-cursive text-gray-500 text-5xl">right now.</span>
        </h2>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">Every month, thousands of your ideal buyers visit your site. They read your content, view your pricing, compare you to competitors — and <strong className="text-gray-900">97% leave without filling a form.</strong> You never learn who they were.</p>

        <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200 mb-8">
          {PROBLEM_STATS.map((s, i) => (
            <div key={i} className="bg-white p-8 lg:p-10">
              <div className={`text-5xl lg:text-6xl font-light mb-3 ${s.color}`}>{s.number}</div>
              <p className="text-gray-500 text-sm leading-relaxed">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-gray-400 mb-3">The recoverable pipeline formula</p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded font-mono text-gray-700">Monthly visitors</span>
            <span className="text-gray-400">×</span>
            <span className="bg-[#007AFF]/8 border border-[#007AFF]/20 px-3 py-1.5 rounded font-mono text-[#007AFF]">70% ID rate</span>
            <span className="text-gray-400">×</span>
            <span className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded font-mono text-gray-700">Avg deal size</span>
            <span className="text-gray-400">×</span>
            <span className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded font-mono text-gray-700">Close rate</span>
            <span className="text-gray-400">=</span>
            <span className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded font-mono text-emerald-700 font-semibold">Recoverable pipeline / mo</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-gray-500">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-700 mb-1">2K visitors · $5K deal</p>
              <p className="font-mono text-emerald-600 font-semibold">$35K/mo recoverable</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-700 mb-1">10K visitors · $25K deal</p>
              <p className="font-mono text-emerald-600 font-semibold">$87K/mo recoverable</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-700 mb-1">50K visitors · $50K deal</p>
              <p className="font-mono text-emerald-600 font-semibold">$875K/mo recoverable</p>
            </div>
          </div>
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
        <Label>Root Cause</Label>
        <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-3">
          Why 97% of B2B visitors
          <span className="block font-cursive text-gray-500 text-5xl">stay anonymous.</span>
        </h2>
        <p className="text-gray-500 text-lg mb-10">This isn&apos;t your fault — it&apos;s three structural failures in how B2B tracking works today.</p>
        <div className="grid md:grid-cols-3 gap-px bg-gray-200 border border-gray-200 mb-8">
          {[
            {
              n: '01',
              title: 'Forms Are Dead',
              body: 'Only 3% of B2B visitors fill out a form. The other 97% have trust concerns, hate spam, and experience too much friction. Your best leads never self-identify.',
            },
            {
              n: '02',
              title: 'Cookies Failed',
              body: "iOS blocks third-party cookies by default. Chrome is following. GDPR and CCPA created legal risk. Cookie-based tracking only captures behavior — not identity.",
            },
            {
              n: '03',
              title: 'Your CRM Is Blind',
              body: "You can see traffic in Google Analytics, but you can't see who. You can't prioritize hot leads. Your sales team wastes time on cold outbound while warm leads bounce.",
            },
          ].map((p, i) => (
            <div key={i} className="bg-white p-8">
              <div className="text-4xl font-light text-gray-200 mb-5">{p.n}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{p.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-amber-900 text-sm font-medium leading-relaxed">
            <strong>The result:</strong> Your sales team is making 100 cold calls when 30 hot leads visited your pricing page yesterday — and you had no idea.
          </p>
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
        <Label>How It Works</Label>
        <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-3">
          Three steps. No forms.
          <span className="block font-cursive text-gray-500 text-6xl">No changes to your site.</span>
        </h2>
        <p className="text-gray-500 text-lg mb-10">Works exactly like Google Analytics — one script tag, and you&apos;re live.</p>
        <div className="grid md:grid-cols-3 gap-px bg-gray-200 border border-gray-200 mb-8">
          {[
            {
              num: '01',
              title: 'They Visit',
              desc: 'A visitor lands on any page of your site — completely anonymous. No form. No popup. No friction.',
              detail: 'Works on every page, every device',
            },
            {
              num: '02',
              title: 'Cursive Identifies',
              desc: 'Our Super Pixel matches their IP and digital fingerprint to our 420M+ contact database in under 200ms.',
              detail: '70% identification rate · No cookies',
            },
            {
              num: '03',
              title: 'You Get the Lead',
              desc: 'Full contact details and intent data flow instantly to your CRM — name, email, phone, company, role, and every page they viewed.',
              detail: 'HubSpot · Salesforce · Slack · Webhook',
            },
          ].map((p, i) => (
            <div key={i} className="bg-white p-6 lg:p-8">
              <div className="text-4xl font-light text-[#007AFF]/20 mb-5">{p.num}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{p.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed mb-4">{p.desc}</p>
              <code className="text-[10px] bg-gray-50 border border-gray-200 px-2 py-1 rounded text-gray-400 block leading-snug">{p.detail}</code>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-6 py-4">
          <p className="text-sm text-gray-700 font-medium">From installation to first identified lead: <strong className="text-[#007AFF]">under 5 minutes.</strong></p>
          <div className="flex items-center gap-4 text-[11px] text-gray-400 font-mono">
            <span>✓ GDPR Compliant</span>
            <span>✓ CCPA Compliant</span>
            <span>✓ No PII stored</span>
          </div>
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 5 — IDENTITY GRAPH ─────────────────────────────────────────────────
function S5() {
  return (
    <Slide>
      <div className="max-w-4xl mx-auto w-full">
        <Label>The Identity Graph</Label>
        <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-4">
          420 million reasons
          <span className="block font-cursive text-gray-500 text-5xl">it actually works.</span>
        </h2>
        <p className="text-gray-500 text-lg mb-6">Most tools give you a company name. Cursive cross-references device signals against a <strong className="text-gray-900">420M+ first-party identity graph</strong> to give you the actual person — no cookies required.</p>

        <div className="border border-gray-200 rounded-xl overflow-hidden mb-5">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-gray-400">How we compare</p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-4 text-gray-400 font-medium">Metric</th>
                <th className="text-center py-2 px-3 text-gray-400 font-medium">Others</th>
                <th className="text-center py-2 px-3 text-[#007AFF] font-bold">Cursive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                ['ID Rate', '15–35%', '70%'],
                ['Email Accuracy', '~78%', '95%+'],
                ['Phone Numbers', 'Add-on', '✓ Included'],
                ['Intent Signals', 'Basic/None', '✓ Real-time'],
                ['Data Refresh', 'Quarterly', '30-Day NCOA'],
                ['Setup Time', '1–2 weeks', '5 minutes'],
              ].map(([metric, others, cursive]) => (
                <tr key={metric}>
                  <td className="py-2 px-4 text-gray-600">{metric}</td>
                  <td className="py-2 px-3 text-center text-gray-400">{others}</td>
                  <td className="py-2 px-3 text-center text-[#007AFF] font-semibold">{cursive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="bg-[#007AFF] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-white/25" /><div className="w-2.5 h-2.5 rounded-full bg-white/25" /><div className="w-2.5 h-2.5 rounded-full bg-white/25" />
              <span className="text-white/70 text-xs ml-2">cursive.io · pixel monitor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" /></span>
              <span className="text-white/80 text-xs">1,863 today</span>
            </div>
          </div>
          <div className="px-5 py-4 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">✓ IDENTITY CONFIRMED</span>
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">HIGH INTENT · 89</span>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-1 text-xs flex-1">
              {([
                ['Name', 'Sarah Okonkwo'],
                ['Title', 'Director of Growth'],
                ['Company', 'Apex Revenue Co.'],
                ['Email', 's.okonkwo@apexrevenue.com'],
                ['Phone', '+1 (312) 555-9832'],
                ['Signal', 'Visited /pricing + /integrations same session'],
              ] as [string, string][]).map(([l, v]) => (
                <div key={l} className="flex items-baseline gap-1.5">
                  <span className="text-gray-400 text-[10px]">{l}</span>
                  <span className={`${l === 'Email' || l === 'Phone' ? 'font-mono text-[11px]' : ''} ${l === 'Signal' ? 'text-[#007AFF]' : 'text-gray-900 font-medium'}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>
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
        <h2 className="text-4xl font-light text-gray-900 leading-[1.05] mb-8">
          How much are you leaving on the table?
          <span className="block font-cursive text-gray-500 text-5xl">Let&apos;s run your numbers live.</span>
        </h2>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
          <RevenueCalculator deck />
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 7 — LEAD RECORD ────────────────────────────────────────────────────
function S7() {
  return (
    <Slide>
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 items-start max-w-5xl mx-auto w-full">
        <div>
          <Label>What You&apos;ll See in Your CRM</Label>
          <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-6">
            Not a company name.
            <span className="block font-cursive text-gray-500 text-5xl">A real person, ready to call.</span>
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-6">Every identified visitor arrives as a full, verified contact record — with company firmographics, intent signals, and every page they visited.</p>
          <div className="space-y-2.5">
            {[
              '40+ enrichment data points per contact',
              'Real-time Slack + CRM notification',
              'Automatic lead scoring by intent',
              'Auto-sync to HubSpot, Salesforce, Pipedrive',
              'Pages visited + time on each page',
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                <svg className="w-4 h-4 text-[#007AFF] flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm text-sm">
            <div className="bg-[#007AFF] px-5 py-3 flex items-center justify-between">
              <span className="text-white font-semibold text-xs uppercase tracking-wide">New Lead Identified</span>
              <span className="flex items-center gap-1.5 text-emerald-300 text-xs font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                High Intent · Score 94
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xl font-semibold text-gray-900">{SAMPLE_LEAD.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{SAMPLE_LEAD.title} · {SAMPLE_LEAD.company}</p>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {([
                  ['Email', SAMPLE_LEAD.email],
                  ['Mobile', SAMPLE_LEAD.phone],
                  ['Employees', '150–200'],
                  ['Revenue', '$15M–$25M ARR'],
                  ['Industry', 'B2B SaaS'],
                  ['Tech Stack', 'Salesforce, HubSpot'],
                ] as [string, string][]).map(([l, v]) => (
                  <div key={l}>
                    <p className="text-[10px] text-gray-400 mb-0.5">{l}</p>
                    <p className="text-gray-800 text-xs font-medium truncate">{v}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-gray-400 mb-2">Pages visited this week</p>
                <div className="space-y-1 text-xs font-mono text-gray-500">
                  <div className="flex justify-between"><span className="text-[#007AFF]">/pricing</span><span className="text-red-500 font-semibold">3× · 4 min avg</span></div>
                  <div className="flex justify-between"><span>/enterprise-features</span><span className="text-amber-500 font-medium">2×</span></div>
                  <div className="flex justify-between"><span>/integrations/salesforce</span><span>1×</span></div>
                  <div className="flex justify-between text-emerald-600 font-semibold items-center">
                    <span>→ /book-demo</span>
                    <span className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
                      viewing now
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-amber-600 mb-1">Recommended Action</p>
                <p className="text-amber-900 text-xs font-medium">Call within 30 minutes — 3.5× higher connect rate while on-site</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 8 — WHY CURSIVE ────────────────────────────────────────────────────
function S8() {
  return (
    <Slide bg="bg-[#F7F9FB]">
      <div className="max-w-5xl mx-auto w-full">
        <Label>Why Cursive</Label>
        <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-10">
          We&apos;re not just better.
          <span className="block font-cursive text-gray-500 text-5xl">We&apos;re structurally different.</span>
        </h2>
        <div className="grid grid-cols-3 gap-px bg-gray-200 border border-gray-200">
          {[
            {
              label: 'Other Visitor ID Tools',
              accent: 'text-gray-400',
              bg: 'bg-white',
              items: [
                { ok: false, text: '30–40% identification rate' },
                { ok: false, text: 'Company-level only, no contacts' },
                { ok: false, text: 'Stale data, quarterly refresh' },
                { ok: false, text: 'No intent signals included' },
                { ok: false, text: 'Complex setup (weeks)' },
                { ok: false, text: 'Phone numbers as paid add-on' },
              ],
            },
            {
              label: 'Cursive Super Pixel',
              accent: 'text-[#007AFF]',
              bg: 'bg-white',
              highlight: true,
              items: [
                { ok: true, text: '70% identification rate' },
                { ok: true, text: 'Individual contact + verified email' },
                { ok: true, text: '30-day NCOA data refresh' },
                { ok: true, text: 'Real-time intent scoring' },
                { ok: true, text: '5-minute setup, one script tag' },
                { ok: true, text: 'Mobile phone number included' },
              ],
            },
            {
              label: 'Traditional Lead Gen',
              accent: 'text-gray-400',
              bg: 'bg-white',
              items: [
                { ok: false, text: '3% form conversion rate' },
                { ok: false, text: '$200–$500 cost per lead' },
                { ok: false, text: 'No real-time intent data' },
                { ok: false, text: 'Slow follow-up, cold outbound' },
                { ok: false, text: 'Generic contacts, poor quality' },
                { ok: false, text: 'No page-level behavior data' },
              ],
            },
          ].map((col, ci) => (
            <div key={ci} className={`${col.bg} p-6 ${col.highlight ? 'ring-2 ring-[#007AFF] ring-inset bg-[#007AFF]/4' : ''}`}>
              {col.highlight ? (
                <div className="flex items-center gap-1.5 mb-4">
                  <img src="/cursive-logo.png" alt="Cursive" className="h-3.5 w-auto" />
                  <p className="text-[10px] font-mono uppercase tracking-[0.15em] font-black text-[#007AFF]">Super Pixel</p>
                </div>
              ) : (
                <p className={`text-[10px] font-mono uppercase tracking-[0.15em] mb-4 ${col.accent}`}>{col.label}</p>
              )}
              <div className="space-y-2.5">
                {col.items.map((item, ii) => (
                  <div key={ii} className="flex items-start gap-2 text-xs">
                    <span className={`flex-shrink-0 font-bold mt-0.5 ${item.ok ? 'text-[#007AFF]' : 'text-red-400'}`}>{item.ok ? '✓' : '✕'}</span>
                    <span className={item.ok ? 'text-gray-700' : 'text-gray-400'}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-4 gap-4">
          {DIFFS.map((d, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-light text-[#007AFF]">{d.metric}</span>
                <span className="text-[10px] text-gray-400 font-mono">vs {d.vs}</span>
              </div>
              <p className="text-xs font-semibold text-gray-700">{d.title}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-4">
          <svg className="w-6 h-6 text-[#007AFF]/40 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.192 15.757c0-.88-.23-1.618-.69-2.217-.326-.412-.768-.683-1.327-.812-.55-.128-1.07-.137-1.54-.028-.16-.95.1-1.95.78-3 .53-.81 1.24-1.48 2.13-2.02L9.027 6c-.75.506-1.4 1.11-1.94 1.81-.54.7-.95 1.44-1.23 2.22-.28.78-.41 1.58-.4 2.39.02.8.2 1.56.55 2.27.34.71.83 1.27 1.47 1.68.64.41 1.36.62 2.18.62.77 0 1.43-.19 1.98-.57.55-.38.83-.92.83-1.63zm8 0c0-.88-.23-1.618-.69-2.217-.326-.42-.77-.695-1.327-.825-.56-.13-1.07-.14-1.54-.022-.16-.95.1-1.95.78-3 .53-.81 1.24-1.48 2.13-2.02L17.027 6c-.75.506-1.4 1.11-1.94 1.81-.54.7-.95 1.44-1.23 2.22-.28.78-.41 1.58-.4 2.39.02.8.2 1.56.55 2.27.34.71.83 1.27 1.47 1.68.64.41 1.36.62 2.18.62.77 0 1.43-.19 1.98-.57.55-.38.83-.92.83-1.63z"/></svg>
          <div>
            <p className="text-gray-700 text-sm leading-relaxed italic">"We installed it on a Friday. By Monday we had 47 identified leads from the weekend traffic we would have completely lost. Within two weeks it was our highest-volume lead source."</p>
            <p className="text-[11px] text-gray-400 font-mono mt-2">— VP of Sales · Series B B2B SaaS · 12K monthly visitors</p>
          </div>
        </div>
      </div>
    </Slide>
  )
}

// ─── PIXEL INSTALL MODAL ──────────────────────────────────────────────────────
type InstallStep = 'url' | 'provisioning' | 'done' | 'error'

interface PixelResult { pixel_id: string; snippet: string; domain: string }

const PROVISION_STEPS = [
  'Validating your domain...',
  'Connecting to identity graph...',
  'Generating your custom pixel...',
  'Finalizing configuration...',
]

function PixelInstallModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<InstallStep>('url')
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [provStep, setProvStep] = useState(0)
  const [result, setResult] = useState<PixelResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [apiError, setApiError] = useState('')

  const provision = async () => {
    setUrlError('')
    if (!url.trim()) { setUrlError('Enter your website URL to continue'); return }
    setStep('provisioning')
    setProvStep(0)

    // Animate provision steps while API call runs
    const stepTimer = setInterval(() => setProvStep(p => Math.min(p + 1, PROVISION_STEPS.length - 1)), 900)

    try {
      const res = await fetch('https://leads.meetcursive.com/api/pixel/provision-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl: url.trim() }),
      })
      const data = await res.json()
      clearInterval(stepTimer)
      if (!res.ok) { setApiError(data.error || 'Something went wrong'); setStep('error'); return }
      // Ensure we show all steps before revealing result
      await new Promise(r => setTimeout(r, 400))
      setResult(data)
      setStep('done')
    } catch {
      clearInterval(stepTimer)
      setApiError('Network error — please try again')
      setStep('error')
    }
  }

  const copy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

        {/* Header */}
        <div className="bg-[#007AFF] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/cursive-logo.png" alt="Cursive" className="h-5 w-auto brightness-0 invert" />
            <span className="text-white/80 text-sm font-mono">Super Pixel · Live Setup</span>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl leading-none transition-colors">×</button>
        </div>

        {/* Step: URL input */}
        {step === 'url' && (
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-1">Generate your custom pixel</h3>
            <p className="text-gray-500 text-sm mb-5">Enter the website you want to start identifying visitors on. We&apos;ll generate a unique pixel for that domain right now.</p>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Website URL</label>
            <input
              type="text"
              value={url}
              onChange={e => { setUrl(e.target.value); setUrlError('') }}
              onKeyDown={e => e.key === 'Enter' && provision()}
              placeholder="yourcompany.com"
              autoFocus
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#007AFF]/60 focus:ring-1 focus:ring-[#007AFF]/30 transition-all font-mono text-sm"
            />
            {urlError && <p className="mt-1.5 text-red-500 text-sm">{urlError}</p>}
            <div className="mt-3 text-[11px] text-gray-400 space-y-0.5">
              <p>✓ Works on WordPress, Webflow, Shopify, React — any stack</p>
              <p>✓ No webhook setup required to get started</p>
            </div>
            <button
              onClick={provision}
              className="mt-5 w-full py-3 bg-[#007AFF] hover:bg-[#0066DD] text-white font-bold rounded-lg transition-colors"
            >
              Generate Pixel →
            </button>
          </div>
        )}

        {/* Step: Provisioning */}
        {step === 'provisioning' && (
          <div className="p-6 text-center">
            <div className="flex justify-center mb-5">
              <div className="relative w-14 h-14">
                <svg className="animate-spin w-14 h-14 text-[#007AFF]/20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /></svg>
                <svg className="animate-spin w-14 h-14 text-[#007AFF] absolute inset-0" viewBox="0 0 24 24" fill="none" style={{ animationDuration: '0.75s' }}><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Setting up your pixel...</h3>
            <div className="space-y-2 text-sm text-left max-w-xs mx-auto">
              {PROVISION_STEPS.map((s, i) => (
                <div key={i} className={`flex items-center gap-2.5 transition-all duration-300 ${i <= provStep ? 'opacity-100' : 'opacity-25'}`}>
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${i < provStep ? 'bg-emerald-100 text-emerald-600' : i === provStep ? 'bg-[#007AFF] text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {i < provStep ? '✓' : i + 1}
                  </span>
                  <span className={i <= provStep ? 'text-gray-700' : 'text-gray-400'}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && result && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">✓ PIXEL GENERATED</span>
              <span className="text-[10px] font-mono text-gray-400">{result.domain} · {result.pixel_id}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Your pixel is ready</h3>
            <p className="text-gray-500 text-sm mb-4">Paste this one line into the <code className="bg-gray-100 px-1 rounded text-[11px]">&lt;head&gt;</code> of <strong>{result.domain}</strong>:</p>

            <div className="bg-gray-900 rounded-xl p-4 mb-4 relative">
              <code className="text-emerald-400 text-xs font-mono break-all leading-relaxed block pr-14">{result.snippet}</code>
              <button
                onClick={copy}
                className={`absolute top-3 right-3 text-[11px] font-mono px-3 py-1.5 rounded-lg transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>

            <div className="bg-[#007AFF]/5 border border-[#007AFF]/20 rounded-lg p-3 mb-4 text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-700 mb-1.5">What happens after install:</p>
              <p>→ Pixel begins matching anonymous visitors to real contacts</p>
              <p>→ First identified leads appear within minutes</p>
              <p>→ Set up your Cursive account to receive leads in your CRM</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copy}
                className={`flex-1 py-2.5 font-bold rounded-lg transition-colors ${copied ? 'bg-emerald-600 text-white' : 'bg-[#007AFF] hover:bg-[#0066DD] text-white'}`}
              >
                {copied ? '✓ Copied to Clipboard' : 'Copy Snippet'}
              </button>
              <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 hover:border-gray-400 text-gray-500 rounded-lg text-sm transition-colors">Done</button>
            </div>
          </div>
        )}

        {/* Step: Error */}
        {step === 'error' && (
          <div className="p-6 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-500 text-sm mb-5">{apiError}</p>
            <button onClick={() => setStep('url')} className="w-full py-3 bg-[#007AFF] hover:bg-[#0066DD] text-white font-bold rounded-lg transition-colors">
              ← Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── SLIDE 9 — CLOSE ──────────────────────────────────────────────────────────
function S9() {
  const [showModal, setShowModal] = useState(false)

  return (
    <Slide>
      {showModal && <PixelInstallModal onClose={() => setShowModal(false)} />}
      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-6 flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" /></span>
          <p className="text-amber-900 text-sm font-medium">Every day without the pixel = more warm leads walking out your door unidentified. <strong>Right now, someone is on your site.</strong></p>
        </div>
        <Label>What Happens Next</Label>
        <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-8">
          We can have this live
          <span className="block font-cursive text-gray-500 text-6xl">on your site today.</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="border-2 border-[#007AFF] rounded-xl p-6 bg-white">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#007AFF] mb-4">Start Today</p>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Install on this call</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-5">Enter your website URL and we&apos;ll generate a custom pixel for your domain right now — one script tag, 90 seconds, and you&apos;re identifying visitors live.</p>
            <div className="space-y-2 mb-6">
              {[
                'No engineering sprint required',
                'Works on any website stack',
                'First leads identified within minutes',
                '1-on-1 onboarding support included',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="text-[#007AFF] font-bold">✓</span>
                  {item}
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="block w-full text-center px-6 py-3 bg-[#007AFF] hover:bg-[#0066DD] text-white font-bold rounded-lg transition-colors"
            >
              Install the Pixel on This Call →
            </button>
          </div>
          <div className="border border-gray-200 rounded-xl p-6 bg-white">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-gray-400 mb-4">Need More Time</p>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Technical deep dive</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-5">For teams requiring enterprise SSO, custom integrations, multi-site deployment, or volume pricing — we&apos;ll get the right people in a room.</p>
            <div className="space-y-2 mb-6">
              {[
                'Enterprise SSO & security review',
                'Custom CRM integration support',
                'Multi-site and sub-domain setup',
                'Volume pricing discussion',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="text-gray-400">→</span>
                  {item}
                </div>
              ))}
            </div>
            <a
              href={CAL_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center px-6 py-3 border border-gray-300 hover:border-[#007AFF] hover:text-[#007AFF] text-gray-700 font-semibold rounded-lg transition-colors"
            >
              Schedule Technical Demo
            </a>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          {[
            { v: '70%', l: 'Visitor ID Rate' },
            { v: '0.05%', l: 'Email Bounce Rate' },
            { v: '5 min', l: 'Time to First Lead' },
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
          <div className="h-full bg-[#007AFF] transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 h-12 flex items-center justify-between">
          <a href="/">
            <img src="/cursive-logo.png" alt="Cursive" className="h-6 w-auto" />
          </a>
          <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400">
            <span className="hidden sm:inline text-gray-300">Super Pixel</span>
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
          <SlideComponent />
        </div>
      </div>

      {/* ── PREV ARROW ── */}
      <button
        onClick={prev}
        disabled={current === 0}
        className="fixed left-3 top-1/2 -translate-y-1/2 z-[110] w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md hover:border-[#007AFF] hover:text-[#007AFF] hover:shadow-lg transition-all disabled:opacity-0 text-gray-500"
        aria-label="Previous slide"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
      </button>

      {/* ── NEXT ARROW ── */}
      <button
        onClick={next}
        disabled={current === SLIDE_COUNT - 1}
        className="fixed right-3 top-1/2 -translate-y-1/2 z-[110] w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md hover:border-[#007AFF] hover:text-[#007AFF] hover:shadow-lg transition-all disabled:opacity-0 text-gray-500"
        aria-label="Next slide"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
      </button>

      {/* ── DOT NAV ── */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 shadow-sm">
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
