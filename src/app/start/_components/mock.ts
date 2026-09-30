/**
 * DEV-ONLY fixtures for /start?mock=<scenario>. Loaded lazily by api.ts only when
 * page.tsx passes a mock scenario, which it never does in production.
 * Scenarios: 1 (happy path), slow (icp after 14s), unreachable, zero (no matches), failed + expired (/start/leads),
 * claim500 (claim returns a server error). Claim emails: gmail etc -> personal_email, *taken* -> already_claimed.
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

export async function mockScan(
  input: ScanInput,
  onEvent: (e: ScanEvent) => void,
  signal: AbortSignal,
  scenario: string
): Promise<void> {
  const emit = async (ms: number, e: ScanEvent) => {
    await wait(ms, signal)
    onEvent(e)
  }
  if ('url' in input) {
    await emit(500, {
      type: 'site',
      domain: 'vantacheck.io',
      title: 'Vantacheck | Pass your SOC 2 in weeks, not quarters',
      description: 'Compliance automation and audit readiness for growing SaaS teams.',
      favicon: null,
    })
  }
  if (scenario === 'unreachable') {
    await emit(900, { type: 'error', code: 'unreachable', message: 'We could not open that site.' })
    return
  }
  await emit(700, { type: 'finding', finding: { label: 'What you sell', text: 'SOC 2 and ISO 27001 audit readiness, plus the auditor intro.' } })
  await emit(800, { type: 'finding', finding: { label: 'Who buys', text: 'Engineering and security leaders at software companies closing their first enterprise deals.' } })
  await emit(800, { type: 'finding', finding: { label: 'Company stage', text: 'Seed to Series B, roughly 20 to 300 employees.' } })
  await emit(700, { type: 'finding', finding: { label: 'Where', text: 'Mostly United States, some UK and Canada.' } })
  if (scenario === 'slow') await wait(13000, signal)
  const steps: Array<Partial<Icp>> = [
    { summary: ICP.summary },
    { industries: ICP.industries },
    { job_titles: ICP.job_titles },
    { seniority: ICP.seniority },
    { company_size: ICP.company_size },
    { countries: scenario === 'zero' ? ['United States'] : ICP.countries, states: scenario === 'zero' ? ['Wyoming'] : [] },
  ]
  let partial: Partial<Icp> = {}
  for (const step of steps) {
    partial = { ...partial, ...step }
    await emit(550, { type: 'icp_partial', icp: partial })
  }
  const icp = { ...ICP, ...partial } as Icp
  await emit(300, { type: 'icp', icp })
  await emit(400, { type: 'count', total: countFor(icp) })
  await emit(50, { type: 'done' })
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
    case '/api/start/interest':
      await wait(300)
      return { ok: true, booking_url: BOOKING_URL }
    default:
      throw new Error(`mock: no fixture for ${path}`)
  }
}
