/**
 * DEV-ONLY fixtures for /start?mock=<scenario>. Loaded lazily by api.ts only when
 * page.tsx passes a mock scenario, which it never does in production.
 * Scan scenarios: 1 (happy path), replay, slow (profile after ~18s), unreachable, ratelimited, zero (no matches).
 * /start/leads: failed, expired. claim500 (claim returns a server error). Claim emails: gmail etc -> personal_email,
 * *taken* -> already_claimed, *slowdown* -> rate_limited. Email-profile: *slowdown* -> rate_limited, no "@" -> invalid_email.
 */
import {
  BOOKING_URL,
  type FullLead,
  type Icp,
  type MaskedLead,
  type ScanEvent,
} from '@/lib/free-leads/contract'
import { StartApiError, type ScanInput } from './api'

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })

const ICP: Icp = {
  summary: 'You sell SOC 2 and ISO 27001 audits to B2B software companies getting ready for enterprise deals.',
  industries: ['Software Development', 'IT Services and IT Consulting', 'Financial Services'],
  job_titles: ['CTO', 'VP of Engineering', 'Head of Security', 'Founder'],
  seniority: ['C-Team', 'VP', 'Director'],
  company_size: ['11 to 50', '51 to 200', '201 to 500'],
  countries: ['United States'],
  states: [],
  cities: [],
}

const SITE_FACTS: ScanEvent[] = [
  { type: 'fact', fact: { key: 'company', source: 'site', label: 'Company', text: 'Vantacheck, founded 2021' } },
  { type: 'fact', fact: { key: 'pricing', source: 'site', label: 'Pricing', text: 'Listed prices: $4,900, $9,500' } },
]
const MODEL_FACTS: Array<[number, ScanEvent]> = [
  [2000, { type: 'fact', fact: { key: 'offer', source: 'model', label: 'What you sell', text: 'SOC 2 and ISO 27001 audit readiness, plus the auditor intro.' } }],
  [2600, { type: 'fact', fact: { key: 'customers', source: 'model', label: 'Who buys', text: 'Engineering and security leaders at software companies closing their first enterprise deals.' } }],
  [3200, { type: 'fact', fact: { key: 'locations', source: 'model', label: 'Where', text: 'Mostly United States, some UK and Canada.' } }],
]
const ICP_FIELDS = ['summary', 'industries', 'job_titles', 'seniority', 'company_size', 'countries', 'states', 'cities'] as const

/**
 * Replays the real event order with realistic timings (ms from submit):
 * page "/" fetching 50 -> site + read 450 -> sub-pages fetching 480, settled 900-1400 (one fails)
 * -> site facts 1400 -> model facts 2000/2600/3200 -> icp_partial 3500-5200 -> icp 5300 -> count 6500 -> done.
 * Scenarios: replay (instant, after a `replay` marker), unreachable, ratelimited, zero, slow (+13s before the profile).
 */
export async function mockScan(
  input: ScanInput,
  onEvent: (e: ScanEvent) => void,
  signal: AbortSignal,
  scenario: string
): Promise<void> {
  const t0 = Date.now()
  const replay = scenario === 'replay'
  // Replays land almost at once, like the cached server path.
  const at = async (ms: number, e: ScanEvent) => {
    await wait(Math.max(0, (replay ? Math.min(ms, 40) : ms) - (Date.now() - t0)), signal)
    onEvent(e)
  }
  if (scenario === 'ratelimited') {
    return at(250, { type: 'error', code: 'rate_limited', message: 'You have run a lot of scans. Try again in an hour.' })
  }
  if (replay) await at(20, { type: 'replay', scanned_at: new Date(Date.now() - 3 * 3600_000).toISOString() })
  if ('url' in input) {
    await at(50, { type: 'page', path: '/', state: 'fetching' })
    if (scenario === 'unreachable') {
      await at(1900, { type: 'page', path: '/', state: 'failed' })
      return at(1950, { type: 'error', code: 'unreachable', message: 'We could not open that site.' })
    }
    await at(450, {
      type: 'site',
      domain: 'vantacheck.io',
      title: 'Vantacheck | Pass your SOC 2 in weeks, not quarters',
      description: 'Compliance automation and audit readiness for growing SaaS teams.',
      favicon: null,
    })
    onEvent({ type: 'page', path: '/', state: 'read', title: 'Vantacheck', chars: 12_408 })
    await at(480, { type: 'page', path: '/pricing', state: 'fetching' })
    onEvent({ type: 'page', path: '/customers', state: 'fetching' })
    onEvent({ type: 'page', path: '/about', state: 'fetching' })
    await at(900, { type: 'page', path: '/customers', state: 'read', title: 'Customers', chars: 5_870 })
    await at(1250, { type: 'page', path: '/about', state: 'failed' })
    await at(1400, { type: 'page', path: '/pricing', state: 'read', title: 'Pricing', chars: 3_221 })
    SITE_FACTS.forEach(onEvent)
  }
  for (const [ms, e] of MODEL_FACTS) await at(ms, e)
  const delay = scenario === 'slow' ? 13_000 : 0
  const full: Icp = scenario === 'zero' ? { ...ICP, states: ['Wyoming'] } : ICP
  for (const [i, field] of ICP_FIELDS.entries()) {
    await at(delay + 3500 + i * 243, { type: 'icp_partial', icp: { [field]: full[field] } })
  }
  await at(delay + 5300, { type: 'icp', icp: full })
  await at(delay + (replay ? 600 : 6500), { type: 'count', total: countFor(full) })
  onEvent({ type: 'done' })
}

function countFor(icp: Icp): number {
  if (icp.states.includes('Wyoming') && icp.company_size.length > 0) return 0
  const breadth =
    Math.max(icp.industries.length, 1) *
    Math.max(icp.job_titles.length, 1) *
    Math.max(icp.company_size.length, 2) *
    (icp.seniority.length || 5)
  const geo = icp.states.length ? 0.09 * icp.states.length : icp.countries.length || 3
  return Math.round(breadth * 128 * geo + icp.summary.length)
}

const PEOPLE = [
  ['Rachel', 'Jones', 'VP of Engineering', 'Ledgerline', 'ledgerline.com', 'Austin, TX'],
  ['Marcus', 'Okafor', 'CTO', 'Shipfast', 'shipfast.dev', 'Denver, CO'],
  ['Priya', 'Raman', 'Head of Security', 'Northwind Health', 'northwindhealth.io', 'Boston, MA'],
  ['Daniel', 'Weiss', 'Founder & CEO', 'Tallyroom', 'tallyroom.com', 'New York, NY'],
  ['Elena', 'Castillo', 'Director of IT', 'Pinebrook Capital', 'pinebrook.co', 'Chicago, IL'],
  ['Tom', 'Becker', 'VP of Engineering', 'Formwell', 'formwell.ai', 'Seattle, WA'],
  ['Aisha', 'Bello', 'CTO', 'Quillpay', 'quillpay.com', 'Atlanta, GA'],
  ['Kevin', 'Nguyen', 'Head of Platform', 'Stackmint', 'stackmint.io', 'San Jose, CA'],
  ['Laura', 'Fischer', 'Director of Engineering', 'Orbitdesk', 'orbitdesk.com', 'Portland, OR'],
  ['Sam', 'Patel', 'Co-founder & CTO', 'Kitebase', 'kitebase.dev', 'Dallas, TX'],
] as const

function masked(i: number): MaskedLead {
  const [first, last, title, company, domain, loc] = PEOPLE[i % PEOPLE.length]
  return {
    first_name: first,
    last_initial: last[0],
    job_title: title,
    company,
    company_domain: domain,
    location: loc,
    email_masked: `${first[0].toLowerCase()}•••@${domain}`,
    has_linkedin: i % 4 !== 3,
    has_phone: i % 3 === 0,
    why: `${title} at a growing software company in ${loc.split(',')[0]}, so owns the security review.`,
  }
}

function full(i: number): FullLead {
  const [first, last, title, company, domain, loc] = PEOPLE[i % PEOPLE.length]
  const n = Math.floor(i / PEOPLE.length)
  return {
    id: `mock-${i}`,
    first_name: first,
    last_name: n ? `${last}-${n}` : last,
    job_title: title,
    seniority: title.includes('VP') ? 'VP' : title.includes('Director') ? 'Director' : 'C-Team',
    company: n ? `${company} ${['Labs', 'Group'][n - 1] ?? ''}`.trim() : company,
    company_domain: domain,
    industry: 'Software Development',
    company_size: '51 to 200',
    location: loc,
    why: i % 5 === 4 ? null : `${title} at a 51-200 person software company in ${loc.split(',')[0]}, so owns the security review.`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`,
    linkedin_url: i % 4 === 3 ? null : `https://www.linkedin.com/in/${first.toLowerCase()}${last.toLowerCase()}`,
    phone: i % 3 === 0 ? '+1 512 555 0' + String(100 + i) : null,
  }
}

type Body = Record<string, unknown> | null

export async function mockRequest(path: string, body: unknown, scenario: string): Promise<unknown> {
  const b = body as Body
  switch (path.split('?')[0]) {
    case '/api/start/count':
      await wait(350)
      return { total: countFor(b?.icp as Icp) }
    case '/api/start/refine': {
      await wait(1100)
      const icp = b?.icp as Icp
      const text = String(b?.instruction ?? '').toLowerCase()
      const next: Icp = {
        ...icp,
        states: text.includes('texas') ? ['Texas'] : icp.states,
        job_titles: text.includes('cmo') ? [...icp.job_titles, 'CMO'] : icp.job_titles,
      }
      return { icp: next, note: 'Limited to Texas and added CMOs.', total: countFor(next) }
    }
    case '/api/start/preview':
      await wait(1400)
      return { leads: [0, 1, 2, 3, 4].map(masked), total: countFor(b?.icp as Icp) }
    case '/api/start/claim': {
      await wait(900)
      if (scenario === 'claim500') throw new StartApiError('Something went wrong. Please try again.', 500)
      const email = String(b?.email ?? '')
      if (/@(gmail|yahoo|hotmail|outlook|icloud)\./.test(email)) return { status: 'personal_email' }
      if (email.includes('taken')) return { status: 'already_claimed' }
      if (email.includes('slowdown')) return { status: 'rate_limited' }
      return { status: 'sent' }
    }
    case '/api/start/leads':
      await wait(scenario === 'slow' ? 14000 : 2600)
      if (scenario === 'expired') throw new StartApiError('Unauthorized', 401)
      if (scenario === 'failed') return { status: 'failed', message: 'We could not pull your leads right now.' }
      return {
        status: 'ready',
        icp: ICP,
        website: 'vantacheck.io',
        leads: Array.from({ length: 25 }, (_, i) => full(i)),
        total_matching: 48210,
      }
    case '/api/start/email-icp': {
      await wait(700)
      const email = String(b?.email ?? '')
      if (!email.includes('@')) return { status: 'invalid_email' }
      return { status: email.includes('slowdown') ? 'rate_limited' : 'sent' }
    }
    case '/api/start/event':
      return { ok: true }
    case '/api/start/interest':
      await wait(300)
      return { ok: true, booking_url: BOOKING_URL }
    default:
      throw new Error(`mock: no fixture for ${path}`)
  }
}
