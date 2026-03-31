'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { RevenueCalculator } from '@/components/revenue-calculator/RevenueCalculator'

const CAL_LINK = 'https://cal.com/cursiveteam/30min'
const SLIDE_COUNT = 11
const SLIDE_LABELS = ['Cover', 'The Problem', 'The Platform', 'Identity Infrastructure', 'Product Suite', 'Services', 'Integrations & Industries', 'Results', 'How It Works', 'Why Cursive', 'Get Started']

const VISITORS = [
  { id: 1, anon: { ip: '104.21.47.201', location: 'Austin, TX', device: 'MacBook Pro', page: '/pricing', time: '2:14 PM CST' }, lead: { name: 'Marcus Chen', title: 'VP of Marketing', company: 'Horizon SaaS', email: 'm.chen@horizonsaas.com', phone: '+1 (512) 847-2391', intent: 'High', signal: 'Viewed /pricing 3x this week', score: 94 } },
  { id: 2, anon: { ip: '198.41.128.84', location: 'Chicago, IL', device: 'Windows 11 PC', page: '/services', time: '2:17 PM CST' }, lead: { name: 'Sarah Okonkwo', title: 'Director of Growth', company: 'Apex Revenue Co.', email: 's.okonkwo@apexrevenue.com', phone: '+1 (312) 555-9832', intent: 'High', signal: 'Visited /services + /pricing same session', score: 89 } },
  { id: 3, anon: { ip: '172.64.80.100', location: 'New York, NY', device: 'iPhone 15 Pro', page: '/case-studies', time: '2:19 PM CST' }, lead: { name: 'James Thornton', title: 'Chief Revenue Officer', company: 'BuildPath Technologies', email: 'j.thornton@buildpath.io', phone: '+1 (646) 203-7741', intent: 'Medium', signal: 'Downloaded case study, returned 3 days later', score: 72 } },
  { id: 4, anon: { ip: '104.18.10.225', location: 'Denver, CO', device: 'MacBook Air M3', page: '/enterprise', time: '2:21 PM CST' }, lead: { name: 'Priya Nair', title: 'Head of Demand Gen', company: 'CloudBridge Inc.', email: 'p.nair@cloudbridge.com', phone: '+1 (720) 441-0983', intent: 'High', signal: 'Viewed /enterprise 4x across 2 sessions', score: 91 } },
]

// ─── PRIMITIVES ──────────────────────────────────────────────────────────────
function Slide({ children, bg = 'bg-white' }: { children: React.ReactNode; bg?: string }) {
  return (
    <div className={`${bg} flex items-center`} style={{ height: 'calc(100vh - 52px)', overflowY: 'auto' }}>
      <div className="max-w-6xl mx-auto px-6 sm:px-12 py-6 w-full">{children}</div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-gray-400 mb-5">{children}</p>
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-gray-700">
      <svg className="w-4 h-4 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
      {children}
    </div>
  )
}

// ─── VISITOR DEMO ────────────────────────────────────────────────────────────
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
    const clear = () => { if (t.current) clearTimeout(t.current); if (iv.current) clearInterval(iv.current) }
    if (phase === 'idle') {
      t.current = setTimeout(() => setPhase('detected'), 700)
    } else if (phase === 'detected') {
      t.current = setTimeout(() => { setProgress(0); setPhase('matching') }, 1400)
    } else if (phase === 'matching') {
      let p = 0
      iv.current = setInterval(() => {
        p += Math.random() * 14 + 8
        if (p >= 100) { p = 100; clearInterval(iv.current!); setProgress(100); t.current = setTimeout(() => { setFields(0); setPhase('identified') }, 400) }
        setProgress(p)
      }, 100)
    } else if (phase === 'identified') {
      let f = 0
      const reveal = () => { f++; setFields(f); if (f < 6) { t.current = setTimeout(reveal, 240) } else { t.current = setTimeout(() => { setPhase('idle'); setVidx(i => (i + 1) % VISITORS.length) }, 3800) } }
      t.current = setTimeout(reveal, 300)
    }
    return clear
  }, [phase, vidx])

  const intentCls = (intent: string) => intent === 'High' ? 'bg-emerald-50 text-emerald-700' : intent === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-600'

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="bg-primary px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/25" /><div className="w-2.5 h-2.5 rounded-full bg-white/25" /><div className="w-2.5 h-2.5 rounded-full bg-white/25" />
          <span className="text-white/70 text-xs ml-2">cursive.io &middot; pixel monitor</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" /></span>
          <span className="text-white/80 text-xs">{liveCount.toLocaleString()} today</span>
        </div>
      </div>
      <div className={`p-5 ${compact ? 'min-h-[260px]' : 'min-h-[320px]'} flex flex-col justify-center`}>
        {phase === 'idle' && (
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-gray-400 text-sm">Monitoring traffic...</p>
            <div className="flex gap-1">{[0, 1, 2].map(i => (<div key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />))}</div>
          </div>
        )}
        {phase === 'detected' && (
          <div>
            <div className="flex items-center gap-2 mb-3"><span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">NEW VISITOR DETECTED</span><span className="text-gray-400 text-xs">{v.anon.time}</span></div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-2">
              {([['IP', v.anon.ip], ['Location', v.anon.location], ['Device', v.anon.device], ['Page', v.anon.page], ['Identity', 'Anonymous']] as [string, string][]).map(([l, val]) => (
                <div key={l} className="flex justify-between text-xs"><span className="text-gray-400">{l}</span><span className={l === 'Page' ? 'text-primary font-mono' : l === 'Identity' ? 'text-gray-400 italic' : 'text-gray-700'}>{val}</span></div>
              ))}
            </div>
          </div>
        )}
        {phase === 'matching' && (
          <div>
            <div className="flex items-center gap-2 mb-3"><span className="text-[10px] font-semibold bg-blue-50 text-primary px-2 py-0.5 rounded">MATCHING IDENTITY GRAPH</span></div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-4"><div className="flex justify-between text-xs"><span className="text-gray-400">Page</span><span className="text-primary font-mono">{v.anon.page}</span></div></div>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs text-gray-500"><span>Cross-referencing 420M+ profiles...</span><span>{Math.round(progress)}%</span></div>
              <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden"><div className="bg-primary h-full rounded-full transition-all duration-150" style={{ width: `${progress}%` }} /></div>
              <div className="text-[10px] text-gray-400 space-y-1 mt-1">
                {progress > 20 && <p>&#10003; Email graph matched</p>}
                {progress > 45 && <p>&#10003; Phone records verified</p>}
                {progress > 70 && <p>&#10003; Company firmographics loaded</p>}
                {progress > 88 && <p>&#10003; Intent signals scored</p>}
              </div>
            </div>
          </div>
        )}
        {phase === 'identified' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">&#10003; IDENTITY CONFIRMED</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${intentCls(v.lead.intent)}`}>{v.lead.intent.toUpperCase()} INTENT</span>
            </div>
            <div className="space-y-2">
              {[{ l: 'Name', val: v.lead.name, n: 1 }, { l: 'Title', val: v.lead.title, n: 2 }, { l: 'Company', val: v.lead.company, n: 3 }, { l: 'Email', val: v.lead.email, n: 4, mono: true }, { l: 'Phone', val: v.lead.phone, n: 5, mono: true }, { l: 'Intent Signal', val: v.lead.signal, n: 6, accent: true }].map(({ l, val, n, mono, accent }) => (
                <div key={l} className="flex justify-between text-xs transition-all duration-300" style={{ opacity: fields >= n ? 1 : 0, transform: fields >= n ? 'translateX(0)' : 'translateX(-6px)' }}>
                  <span className="text-gray-400">{l}</span>
                  <span className={`${mono ? 'font-mono text-[11px]' : ''} ${accent ? 'text-primary' : 'text-gray-900 font-medium'}`}>{val}</span>
                </div>
              ))}
            </div>
            {fields >= 6 && (
              <div className="mt-3 pt-3 border-t border-gray-100"><div className="flex items-center justify-between"><span className="text-[10px] text-gray-400">Intent Score</span><div className="flex items-center gap-2"><div className="w-20 bg-gray-200 rounded-full h-1.5 overflow-hidden"><div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${v.lead.score}%` }} /></div><span className="text-primary font-bold text-xs">{v.lead.score}</span></div></div></div>
            )}
          </div>
        )}
      </div>
      <div className="border-t border-gray-100 px-5 py-2.5 flex items-center justify-between bg-gray-50/50">
        <span className="text-[10px] text-gray-400">Live identification stream</span>
        <div className="flex gap-1.5">{VISITORS.map((_, i) => (<div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === vidx ? 'bg-primary' : 'bg-gray-300'}`} />))}</div>
      </div>
    </div>
  )
}

// ─── SLIDE 1 — COVER ────────────────────────────────────────────────────────
function S1() {
  return (
    <Slide>
      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-center">
        <div>
          <Label>Enterprise Platform Overview</Label>
          <h1 className="text-5xl lg:text-6xl font-light text-gray-900 leading-[1.05] mb-6">
            Turn Anonymous Traffic Into
            <span className="block font-cursive text-gray-500 mt-1">Booked Meetings.</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            The unified identity spine that powers every activation channel across B2B and B2C &mdash; from visitor identification to pipeline acceleration.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[{ v: '280M+', l: 'Consumer Profiles' }, { v: '140M+', l: 'Business Profiles' }, { v: '70%', l: 'Visitor ID Rate' }].map(s => (
              <div key={s.l} className="text-center border border-gray-200 rounded-lg py-3">
                <div className="text-2xl font-light text-primary">{s.v}</div>
                <div className="text-[10px] text-gray-400 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mb-6">
            <a href={CAL_LINK} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors">Book a Demo</a>
            <button className="px-6 py-3 border border-gray-300 hover:border-primary hover:text-primary text-gray-700 font-semibold rounded-lg transition-colors">See the Platform &rarr;</button>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 border-t border-gray-100">
            {['GDPR Compliant', 'CCPA Compliant', 'SOC 2 Ready', 'No PII Stored'].map(t => (
              <span key={t} className="text-[11px] font-mono text-gray-400">&#10003; {t}</span>
            ))}
          </div>
        </div>
        <div className="hidden lg:block"><VisitorDemo /></div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 2 — THE PROBLEM ──────────────────────────────────────────────────
function S2() {
  return (
    <Slide bg="bg-[#F7F9FB]">
      <div className="max-w-4xl mx-auto w-full">
        <Label>The Problem</Label>
        <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-4">
          98% of your pipeline
          <span className="block font-cursive text-gray-500 text-5xl">walks out the door.</span>
        </h2>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">Every month, thousands of ideal buyers visit your site. They read your content, view your pricing, compare you to competitors &mdash; and <strong className="text-gray-900">leave without filling a form.</strong> Cookies are dying. Forms convert at 0.5%. Your CRM is blind.</p>
        <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200 mb-8">
          {[
            { number: '97%', label: 'of B2B visitors leave without ever identifying themselves', color: 'text-red-500' },
            { number: '<2%', label: 'of your traffic you can currently contact', color: 'text-red-500' },
            { number: '$47', label: 'avg cost-per-click lost to anonymous sessions daily', color: 'text-amber-500' },
            { number: '12%', label: 'of Americans move every year, breaking millions of records', color: 'text-amber-500' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-8 lg:p-10">
              <div className={`text-5xl lg:text-6xl font-light mb-3 ${s.color}`}>{s.number}</div>
              <p className="text-gray-500 text-sm leading-relaxed">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-amber-900 text-sm font-medium leading-relaxed"><strong>The result:</strong> Your sales team is making 100 cold calls when 30 hot leads visited your pricing page yesterday &mdash; and you had no idea.</p>
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 3 — THE PLATFORM ─────────────────────────────────────────────────
function S3() {
  return (
    <Slide>
      <div className="max-w-5xl mx-auto w-full">
        <Label>The Cursive Platform</Label>
        <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-3">
          One identity spine.
          <span className="block font-cursive text-gray-500 text-5xl">Every activation channel.</span>
        </h2>
        <p className="text-gray-500 text-lg mb-10">One accurate identity spine powers every activation channel across B2B and B2C &mdash; from real-time visitor identification to automated pipeline acceleration.</p>
        <div className="grid md:grid-cols-2 gap-px bg-gray-200 border border-gray-200 mb-8">
          {[
            { title: 'B2B Precision', body: 'Target decision-makers with verified personal data that follows the individual, not just the company. Person-level enrichment across career changes.' },
            { title: 'B2C Reach', body: 'Connect with consumers at home using precise, household-level identity resolution. 280M consumer profiles with income, net worth, and lifestyle data.' },
            { title: 'Omnichannel Activation', body: 'A single, verified spine enables Geo-Frame resolution, UID2 onboarding, and high-match Cookie/HEM matching across every ad platform and CRM.' },
            { title: 'Continuous Verification', body: 'Monthly NCOA verification ensures your identity infrastructure remains robust while others decay. 308M records refreshed every 30 days.' },
          ].map((p, i) => (
            <div key={i} className="bg-white p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{p.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <p className="text-gray-800 text-sm font-medium leading-relaxed text-center">This isn&apos;t just better data. <strong className="text-primary">It&apos;s an identity moat</strong> &mdash; a fundamental shift in how identity is resolved and maintained.</p>
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 4 — IDENTITY INFRASTRUCTURE ──────────────────────────────────────
function S4() {
  return (
    <Slide bg="bg-[#F7F9FB]">
      <div className="max-w-5xl mx-auto w-full">
        <Label>V4 Identity Infrastructure</Label>
        <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-3">
          420 million reasons
          <span className="block font-cursive text-gray-500 text-5xl">it actually works.</span>
        </h2>
        <p className="text-gray-500 text-lg mb-8">Three infrastructure pillars that competitors cannot replicate.</p>
        <div className="grid md:grid-cols-3 gap-px bg-gray-200 border border-gray-200 mb-8">
          {[
            { num: '01', title: '30-Day NCOA Refresh', body: '308M consumer records verified every 30 days against USPS data. Industry standard is quarterly. We refresh 6-12x faster.' },
            { num: '02', title: 'Geo-Framed Proximity', body: 'Household identity tied to verified physical locations using precise Lat/Long mapping. 60% resolution rate without cookies.' },
            { num: '03', title: 'UID2 Onboarding', body: '8B hashed email mappings already onboarded into the UID2 framework. Future-proof identity activation beyond fragile cookies.' },
          ].map((p, i) => (
            <div key={i} className="bg-white p-6 lg:p-8">
              <div className="text-4xl font-light text-primary/20 mb-5">{p.num}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{p.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-gray-400">How we compare</p>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary text-white font-mono">v4</span>
          </div>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-gray-100"><th className="text-left py-2 px-4 text-gray-400 font-medium">Metric</th><th className="text-center py-2 px-3 text-gray-400 font-medium">Others</th><th className="text-center py-2 px-3 text-primary font-bold">Cursive V4</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {[['ID Rate', '15-35%', '70%'], ['Email Accuracy', '~78%', '95%+'], ['Phone Numbers', 'Add-on', 'Included'], ['Intent Score', 'Not available', 'Real-time V4'], ['DNC Compliance', 'Not available', 'Mobile + Landline'], ['Data Refresh', 'Quarterly', '30-Day NCOA'], ['Setup Time', '1-2 weeks', '5 minutes']].map(([metric, others, cursive]) => (
                <tr key={metric}><td className="py-2 px-4 text-gray-600">{metric}</td><td className="py-2 px-3 text-center text-gray-400">{others}</td><td className="py-2 px-3 text-center text-primary font-semibold">{cursive}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 5 — PRODUCT SUITE ────────────────────────────────────────────────
function S5() {
  const products = [
    { name: 'Super Pixel V4', color: 'bg-blue-500', features: ['70% visitor identification rate', 'Real-time URL-based intent scoring', 'Person-level enrichment (not just company)'] },
    { name: 'Lead Marketplace', color: 'bg-indigo-500', features: ['280M+ enriched contacts', '19,000+ audience segments', 'Starting at $0.50/lead'] },
    { name: 'Audience Intelligence', color: 'bg-violet-500', features: ['AI-powered semantic search', 'B2B & B2C identity coverage', 'Natural language querying'] },
    { name: 'AI Studio', color: 'bg-emerald-500', features: ['Brand voice training', 'Multi-channel outreach sequences', 'Autonomous campaign optimization'] },
    { name: 'People Search', color: 'bg-amber-500', features: ['Real-time contact enrichment', 'Filter by company, title, seniority', 'Verified email & phone'] },
    { name: 'Cursive API', color: 'bg-rose-500', features: ['Person & company lookup', 'Email verification endpoint', '60 req/min, 1000 req/day'] },
  ]
  return (
    <Slide>
      <div className="max-w-5xl mx-auto w-full">
        <Label>Product Suite</Label>
        <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-3">
          Everything you need to
          <span className="block font-cursive text-gray-500 text-5xl">own the funnel.</span>
        </h2>
        <p className="text-gray-500 text-lg mb-8">Six core products that work together as a unified pipeline engine.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.name} className="border border-gray-200 rounded-xl p-5 bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg ${p.color} flex items-center justify-center`}>
                  <span className="text-white text-xs font-bold">{p.name.charAt(0)}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{p.name}</h3>
              </div>
              <div className="space-y-2">
                {p.features.map(f => (
                  <div key={f} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="text-primary font-bold mt-0.5 flex-shrink-0">&#10003;</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 6 — SERVICES ─────────────────────────────────────────────────────
function S6() {
  const services = [
    { name: 'Cursive Data', items: ['Custom ICP-matched lead lists', 'Verified contact data monthly', 'CRM-ready CSV or integration', 'Dedicated data analyst'], badge: '' },
    { name: 'Cursive Outbound', items: ['Everything in Data, plus:', 'AI-written email sequences', 'Multi-channel outreach', 'A/B testing & optimization', 'Dedicated campaign manager'], badge: 'MOST POPULAR' },
    { name: 'Cursive Pipeline', items: ['Everything in Outbound, plus:', 'AI SDR agent qualification', 'Automated meeting booking', 'CRM pipeline management', 'Dedicated growth strategist'], badge: '' },
    { name: 'Venture Studio', items: ['White-glove growth engine', 'Custom go-to-market strategy', 'Full pipeline ownership', 'For scale-stage companies'], badge: 'CUSTOM' },
  ]
  return (
    <Slide bg="bg-[#F7F9FB]">
      <div className="max-w-5xl mx-auto w-full">
        <Label>Done-For-You Services</Label>
        <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-3">
          Whatever stage you&apos;re at,
          <span className="block font-cursive text-gray-500 text-5xl">we meet you there.</span>
        </h2>
        <p className="text-gray-500 text-lg mb-8">From data delivery to full pipeline ownership &mdash; pick the tier that matches your growth stage.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((s, i) => (
            <div key={s.name} className={`border rounded-xl p-5 bg-white ${i === 1 ? 'ring-2 ring-primary border-primary/30' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">{s.name}</h3>
                {s.badge && <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono ${i === 1 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>{s.badge}</span>}
              </div>
              <div className="space-y-2">
                {s.items.map(item => (
                  <div key={item} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="text-primary font-bold mt-0.5 flex-shrink-0">&#10003;</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 7 — INTEGRATIONS & INDUSTRIES ────────────────────────────────────
function S7() {
  const integrations = [
    { cat: 'CRM', tools: 'Salesforce, HubSpot, Pipedrive' },
    { cat: 'Marketing', tools: 'Mailchimp, ActiveCampaign, Klaviyo' },
    { cat: 'Sales', tools: 'Outreach, SalesLoft, Apollo' },
    { cat: 'Ads', tools: 'Google Ads, Meta Ads, LinkedIn Ads' },
    { cat: 'Automation', tools: 'Zapier, Make, n8n' },
    { cat: 'Data', tools: 'Clay, Clearbit, Snowflake' },
  ]
  const industries = ['B2B Software', 'Agencies', 'Ecommerce', 'Education', 'Financial Services', 'Franchises', 'Home Services', 'Media & Advertising', 'Real Estate', 'Retail', 'Technology']
  return (
    <Slide>
      <div className="max-w-5xl mx-auto w-full">
        <Label>Integrations & Industries</Label>
        <h2 className="text-4xl font-light text-gray-900 leading-[1.05] mb-3">
          Plugs into your stack.
          <span className="block font-cursive text-gray-500 text-4xl">Serves your vertical.</span>
        </h2>
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-gray-400 mb-4">200+ Native Integrations</p>
            <div className="space-y-3">
              {integrations.map(ig => (
                <div key={ig.cat} className="flex items-start gap-3 bg-white border border-gray-200 rounded-lg p-3">
                  <span className="text-[10px] font-mono uppercase tracking-wide text-primary font-bold w-20 flex-shrink-0 pt-0.5">{ig.cat}</span>
                  <span className="text-xs text-gray-600">{ig.tools}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs text-gray-600">Plus: <strong className="text-primary">Webhooks, REST API, CSV Export, Zapier (5,000+ apps)</strong></p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-gray-400 mb-4">Industries We Serve</p>
            <div className="grid grid-cols-2 gap-2">
              {industries.map(ind => (
                <div key={ind} className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg px-3 py-2.5">
                  <div className="w-2 h-2 rounded-full bg-primary/40 flex-shrink-0" />
                  <span className="text-xs text-gray-700 font-medium">{ind}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 8 — RESULTS ──────────────────────────────────────────────────────
function S8() {
  return (
    <Slide bg="bg-[#F7F9FB]">
      <div className="max-w-5xl mx-auto w-full">
        <Label>Results</Label>
        <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-8">
          The numbers
          <span className="block font-cursive text-gray-500 text-5xl">speak for themselves.</span>
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { v: '40x', sub: 'ROI', detail: 'AI SaaS · 30 days' },
            { v: '$11M', sub: 'Pipeline', detail: 'From $250K spend' },
            { v: '5x', sub: 'CPC Reduction', detail: 'Insurtech · 90 days' },
            { v: '$24M', sub: 'Pipeline', detail: 'Medical Tech · 3 days' },
          ].map(s => (
            <div key={s.sub + s.v} className="bg-white border border-gray-200 rounded-xl p-5 text-center">
              <div className="text-4xl font-light text-primary mb-1">{s.v}</div>
              <div className="text-xs font-semibold text-gray-700">{s.sub}</div>
              <div className="text-[10px] text-gray-400 mt-1">{s.detail}</div>
            </div>
          ))}
        </div>
        <div className="space-y-4 mb-8">
          {[
            { quote: 'We installed it on a Friday. By Monday we had 47 identified leads from weekend traffic we would have completely lost. Within two weeks it was our highest-volume lead source.', attr: 'VP of Sales \u00b7 Series B B2B SaaS \u00b7 12K monthly visitors' },
            { quote: 'Cursive replaced three separate tools for us \u2014 visitor ID, enrichment, and outbound. The data quality is unmatched and we saw $200K in new revenue within 90 days.', attr: 'Director of Growth \u00b7 E-Commerce Brand \u00b7 500 new customers' },
          ].map((t, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-4">
              <svg className="w-6 h-6 text-primary/40 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.192 15.757c0-.88-.23-1.618-.69-2.217-.326-.412-.768-.683-1.327-.812-.55-.128-1.07-.137-1.54-.028-.16-.95.1-1.95.78-3 .53-.81 1.24-1.48 2.13-2.02L9.027 6c-.75.506-1.4 1.11-1.94 1.81-.54.7-.95 1.44-1.23 2.22-.28.78-.41 1.58-.4 2.39.02.8.2 1.56.55 2.27.34.71.83 1.27 1.47 1.68.64.41 1.36.62 2.18.62.77 0 1.43-.19 1.98-.57.55-.38.83-.92.83-1.63zm8 0c0-.88-.23-1.618-.69-2.217-.326-.42-.77-.695-1.327-.825-.56-.13-1.07-.14-1.54-.022-.16-.95.1-1.95.78-3 .53-.81 1.24-1.48 2.13-2.02L17.027 6c-.75.506-1.4 1.11-1.94 1.81-.54.7-.95 1.44-1.23 2.22-.28.78-.41 1.58-.4 2.39.02.8.2 1.56.55 2.27.34.71.83 1.27 1.47 1.68.64.41 1.36.62 2.18.62.77 0 1.43-.19 1.98-.57.55-.38.83-.92.83-1.63z"/></svg>
              <div>
                <p className="text-gray-700 text-sm leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-[11px] text-gray-400 font-mono mt-2">&mdash; {t.attr}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[{ v: '70%', l: 'ID Rate' }, { v: '95%+', l: 'Email Accuracy' }, { v: '0.05%', l: 'Bounce Rate' }, { v: '<5 min', l: 'Setup Time' }].map(s => (
            <div key={s.l} className="text-center border-t-2 border-primary/20 pt-3">
              <div className="text-lg font-light text-gray-900">{s.v}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{s.l}</div>
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
        <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-3">
          From anonymous visitor to
          <span className="block font-cursive text-gray-500 text-5xl">qualified pipeline.</span>
        </h2>
        <p className="text-gray-500 text-lg mb-10">Four steps. No forms. No changes to your site. Works exactly like Google Analytics &mdash; one script tag.</p>
        <div className="grid md:grid-cols-4 gap-px bg-gray-200 border border-gray-200 mb-8">
          {[
            { num: '01', title: 'Install', desc: 'One script tag on your site. Works on WordPress, Webflow, Shopify, React \u2014 any stack. No engineering sprint.', detail: '5 minutes to go live' },
            { num: '02', title: 'Identify', desc: 'Every visitor cross-referenced against our 420M+ verified contact database in real-time. No cookies required.', detail: '70% identification rate' },
            { num: '03', title: 'Enrich & Score', desc: 'Full contact details + intent signals. Name, email, phone, company, seniority, and every page they viewed.', detail: '50+ data points per contact' },
            { num: '04', title: 'Activate', desc: 'Leads flow to your CRM, ad platforms, email sequences, or AI SDR \u2014 automatically, in real-time.', detail: 'HubSpot \u00b7 Salesforce \u00b7 Slack' },
          ].map((p, i) => (
            <div key={i} className="bg-white p-6">
              <div className="text-4xl font-light text-primary/20 mb-5">{p.num}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{p.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed mb-4">{p.desc}</p>
              <code className="text-[10px] bg-gray-50 border border-gray-200 px-2 py-1 rounded text-gray-400 block leading-snug">{p.detail}</code>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-6 py-4">
          <p className="text-sm text-gray-700 font-medium">From installation to first identified lead: <strong className="text-primary">under 5 minutes.</strong></p>
          <div className="flex items-center gap-4 text-[11px] text-gray-400 font-mono hidden sm:flex">
            <span>&#10003; GDPR</span><span>&#10003; CCPA</span><span>&#10003; No PII stored</span>
          </div>
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 10 — WHY CURSIVE ─────────────────────────────────────────────────
function S10() {
  return (
    <Slide bg="bg-[#F7F9FB]">
      <div className="max-w-5xl mx-auto w-full">
        <Label>Why Cursive</Label>
        <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-10">
          Not just better data.
          <span className="block font-cursive text-gray-500 text-5xl">A structural advantage.</span>
        </h2>
        <div className="grid grid-cols-3 gap-px bg-gray-200 border border-gray-200 mb-6">
          {[
            { label: 'Other Visitor ID Tools', accent: 'text-gray-400', highlight: false, items: [
              { ok: false, text: '30-40% identification rate' }, { ok: false, text: 'Company-level only, no contacts' },
              { ok: false, text: 'Stale data, quarterly refresh' }, { ok: false, text: 'No intent signals included' },
              { ok: false, text: 'Complex setup (weeks)' }, { ok: false, text: 'Phone numbers as paid add-on' },
            ]},
            { label: 'Cursive V4', accent: 'text-primary', highlight: true, items: [
              { ok: true, text: '70% identification rate' }, { ok: true, text: 'Individual contact + verified email' },
              { ok: true, text: '30-day NCOA continuous refresh' }, { ok: true, text: 'Real-time URL intent scoring' },
              { ok: true, text: '5-minute setup, one script tag' }, { ok: true, text: 'Phone + DNC compliance included' },
            ]},
            { label: 'Traditional Lead Gen', accent: 'text-gray-400', highlight: false, items: [
              { ok: false, text: '3% form conversion rate' }, { ok: false, text: '$200-$500 cost per lead' },
              { ok: false, text: 'No real-time intent data' }, { ok: false, text: 'Slow follow-up, cold outbound' },
              { ok: false, text: 'Generic contacts, poor quality' }, { ok: false, text: 'No page-level behavior data' },
            ]},
          ].map((col, ci) => (
            <div key={ci} className={`bg-white p-6 ${col.highlight ? 'ring-2 ring-primary ring-inset bg-primary/[0.04]' : ''}`}>
              {col.highlight ? (
                <div className="flex items-center gap-1.5 mb-4">
                  <img src="/cursive-logo.png" alt="Cursive" className="h-3.5 w-auto" />
                  <p className="text-[10px] font-mono uppercase tracking-[0.15em] font-black text-primary">Super Pixel V4</p>
                  <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-primary text-white font-mono leading-none">NEW</span>
                </div>
              ) : (
                <p className={`text-[10px] font-mono uppercase tracking-[0.15em] mb-4 ${col.accent}`}>{col.label}</p>
              )}
              <div className="space-y-2.5">
                {col.items.map((item, ii) => (
                  <div key={ii} className="flex items-start gap-2 text-xs">
                    <span className={`flex-shrink-0 font-bold mt-0.5 ${item.ok ? 'text-primary' : 'text-red-400'}`}>{item.ok ? '\u2713' : '\u2715'}</span>
                    <span className={item.ok ? 'text-gray-700' : 'text-gray-400'}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { metric: '70%', vs: '15% avg', title: 'ID Rate' },
            { metric: '0.05%', vs: '20% avg', title: 'Bounce Rate' },
            { metric: 'Person', vs: 'Company only', title: 'Identity Depth' },
            { metric: '30-day', vs: 'Quarterly', title: 'Data Freshness' },
          ].map((d, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-light text-primary">{d.metric}</span>
                <span className="text-[10px] text-gray-400 font-mono">vs {d.vs}</span>
              </div>
              <p className="text-xs font-semibold text-gray-700">{d.title}</p>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  )
}

// ─── SLIDE 11 — CTA CLOSE ───────────────────────────────────────────────────
function S11() {
  return (
    <Slide>
      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-6 flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" /></span>
          <p className="text-amber-900 text-sm font-medium">Every day without the pixel = more warm leads walking out your door unidentified.</p>
        </div>
        <Label>Get Started</Label>
        <h2 className="text-5xl font-light text-gray-900 leading-[1.05] mb-8">
          Ready to build
          <span className="block font-cursive text-gray-500 text-6xl">your identity moat?</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="border-2 border-primary rounded-xl p-6 bg-white">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary mb-4">Recommended</p>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Book a Demo</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-5">30-minute call. See your visitors identified live. Get a custom ROI analysis for your traffic.</p>
            <div className="space-y-2 mb-6">
              {['Live visitor identification demo', 'Custom ROI analysis for your site', 'Integration planning & onboarding', 'No commitment required'].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-gray-600"><span className="text-primary font-bold">&#10003;</span>{item}</div>
              ))}
            </div>
            <a href={CAL_LINK} target="_blank" rel="noopener noreferrer" className="block w-full text-center px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors">Schedule Demo &rarr;</a>
          </div>
          <div className="border border-gray-200 rounded-xl p-6 bg-white">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-gray-400 mb-4">Self-Serve</p>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Start Free Trial</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-5">14-day free trial. No credit card. Install the pixel and see your first identified leads in under 5 minutes.</p>
            <div className="space-y-2 mb-6">
              {['14-day free trial', 'No credit card required', 'First leads in 5 minutes', 'Works on any website stack'].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-gray-600"><span className="text-gray-400">&rarr;</span>{item}</div>
              ))}
            </div>
            <a href="https://leads.meetcursive.com" target="_blank" rel="noopener noreferrer" className="block text-center px-6 py-3 border border-gray-300 hover:border-primary hover:text-primary text-gray-700 font-semibold rounded-lg transition-colors">Start Free &rarr;</a>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          {[{ v: '70%', l: 'Visitor ID Rate' }, { v: '0.05%', l: 'Email Bounce Rate' }, { v: '5 min', l: 'Time to First Lead' }].map(s => (
            <div key={s.l} className="text-center"><div className="text-2xl font-light text-gray-900">{s.v}</div><div className="text-xs text-gray-400 mt-1">{s.l}</div></div>
          ))}
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2"><img src="/cursive-logo.png" alt="Cursive" className="h-6 w-auto" /><span className="text-sm text-gray-400 font-cursive">with Cursive</span></div>
          <p className="text-[10px] text-gray-300 font-mono">meetcursive.com</p>
        </div>
      </div>
    </Slide>
  )
}

// ─── DECK SHELL ──────────────────────────────────────────────────────────────
const SLIDE_COMPONENTS = [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11]

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
        @keyframes deckSlideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .deck-slide { animation: deckSlideIn 240ms ease forwards; }
      `}</style>

      {/* TOP CHROME */}
      <div className="fixed top-0 left-0 right-0 z-[110]">
        <div className="h-1 bg-gray-100"><div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} /></div>
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 h-12 flex items-center justify-between">
          <a href="/"><img src="/cursive-logo.png" alt="Cursive" className="h-6 w-auto" /></a>
          <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400">
            <span className="hidden sm:inline text-gray-300">Enterprise</span>
            <span className="hidden sm:inline text-gray-200">&middot;</span>
            <span className="hidden sm:inline">{SLIDE_LABELS[current]}</span>
            <span className="hidden sm:inline text-gray-200">&middot;</span>
            <span>{String(current + 1).padStart(2, '0')} / {String(SLIDE_COUNT).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* SLIDE CONTENT */}
      <div className="pt-[52px]" key={slideKey}><div className="deck-slide"><SlideComponent /></div></div>

      {/* PREV */}
      <button onClick={prev} disabled={current === 0} className="fixed left-3 top-1/2 -translate-y-1/2 z-[110] w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md hover:border-primary hover:text-primary hover:shadow-lg transition-all disabled:opacity-0 text-gray-500" aria-label="Previous slide">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
      </button>

      {/* NEXT */}
      <button onClick={next} disabled={current === SLIDE_COUNT - 1} className="fixed right-3 top-1/2 -translate-y-1/2 z-[110] w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md hover:border-primary hover:text-primary hover:shadow-lg transition-all disabled:opacity-0 text-gray-500" aria-label="Next slide">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
      </button>

      {/* DOT NAV */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 shadow-sm">
        {SLIDE_COMPONENTS.map((_, i) => (
          <button key={i} onClick={() => go(i)} title={SLIDE_LABELS[i]} className={`rounded-full transition-all duration-200 ${i === current ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'}`} aria-label={`Go to slide ${i + 1}: ${SLIDE_LABELS[i]}`} />
        ))}
      </div>

      {/* FLOATING CTA */}
      <a href={CAL_LINK} target="_blank" rel="noopener noreferrer" className="fixed bottom-4 right-4 z-[120] px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-full shadow-lg hover:shadow-xl transition-all">
        Book a Demo
      </a>
    </div>
  )
}
