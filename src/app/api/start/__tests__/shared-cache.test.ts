import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { fakeSupabase } from '@/lib/free-leads/__tests__/fake-supabase'

const db = vi.hoisted(() => ({ current: null as unknown }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => db.current }))
vi.mock('@/lib/free-leads/http', async (orig) => ({ ...(await orig<typeof import('@/lib/free-leads/http')>()), isLimited: async () => false }))
const fetchSite = vi.hoisted(() => vi.fn())
vi.mock('@/lib/free-leads/site', async (orig) => ({ ...(await orig<typeof import('@/lib/free-leads/site')>()), readSite: fetchSite }))
const scanIcp = vi.hoisted(() => vi.fn())
vi.mock('@/lib/free-leads/scan', async (orig) => ({ ...(await orig<typeof import('@/lib/free-leads/scan')>()), scanIcp }))
const countContacts = vi.hoisted(() => vi.fn())
const searchContacts = vi.hoisted(() => vi.fn())
vi.mock('@/lib/getleads/client', async (orig) => ({ ...(await orig<typeof import('@/lib/getleads/client')>()), countContacts, searchContacts }))
const scoreLeads = vi.hoisted(() => vi.fn())
vi.mock('@/lib/free-leads/lead-fit', async (orig) => ({ ...(await orig<typeof import('@/lib/free-leads/lead-fit')>()), scoreLeads }))

// Persona is best effort; fail it so this test never makes a real model call.
vi.mock('@/lib/free-leads/persona', async (orig) => ({ ...(await orig<typeof import('@/lib/free-leads/persona')>()), generatePersona: vi.fn(async () => { throw new Error('persona off in this test') }) }))

import { POST as scan } from '../scan/route'
import { POST as preview } from '../preview/route'

const ICP = {
  summary: 'You sell SOC 2 audits to SaaS teams.', industries: ['Software Development'], job_titles: ['CTO'],
  seniority: [], company_size: [], countries: ['United States'], states: [], cities: [],
}
const req = (path: string, body: unknown) =>
  new NextRequest(`http://localhost${path}`, { method: 'POST', body: JSON.stringify(body), headers: { 'x-forwarded-for': '1.2.3.4' } })
const events = async (res: Response) =>
  (await res.text()).split('\n\n').filter(Boolean).map((l) => JSON.parse(l.replace(/^data: /, '')) as { type: string })

beforeEach(() => {
  db.current = fakeSupabase({ free_leads_cache: [], free_lead_sessions: [], free_lead_events: [] })
  for (const m of [fetchSite, scanIcp, countContacts, searchContacts, scoreLeads]) m.mockReset()
})

describe('scan: shared cache', () => {
  it('a repeat scan of the same site replays the events with no fetch or model call', async () => {
    fetchSite.mockResolvedValue({ domain: 'acme.com', title: 'Acme', description: null, favicon: null, text: 'x'.repeat(400), source: 'direct' })
    scanIcp.mockImplementation(async (_t: string, cb: { onFact: (f: unknown) => void }) => {
      cb.onFact({ key: 'offer', label: 'What you sell', text: 'SOC 2 audits', source: 'model' })
      return ICP
    })
    countContacts.mockResolvedValue(1234)
    const first = await events(await scan(req('/api/start/scan', { url: 'acme.com' })))
    const second = await events(await scan(req('/api/start/scan', { url: 'https://www.acme.com/search?q=injected' })))
    expect(first.map((e) => e.type)).toEqual(['fact', 'icp', 'count', 'done'])
    expect(second[0]).toMatchObject({ type: 'replay' })
    expect(second.slice(1)).toEqual(first)
    expect(fetchSite).toHaveBeenCalledTimes(1)
    expect(scanIcp).toHaveBeenCalledTimes(1)
    expect(countContacts).toHaveBeenCalledTimes(1)
    // Paths and queries are dropped: the scan always reads the origin.
    expect(fetchSite.mock.calls[0][0]).toBe('https://acme.com/')
  })

  it('a visitor leaving mid-scan does not waste the scan: it finishes and is cached', async () => {
    fetchSite.mockResolvedValue({ domain: 'acme.com', title: 'Acme', description: null, favicon: null, text: 'x'.repeat(400), source: 'direct' })
    let release!: () => void
    const gate = new Promise<void>((r) => (release = r))
    scanIcp.mockImplementation(async (_t: string, cb: { onFact: (f: unknown) => void }) => {
      cb.onFact({ key: 'offer', label: 'What you sell', text: 'Audits', source: 'model' })
      await gate
      return ICP
    })
    countContacts.mockResolvedValue(7)
    const res = await scan(req('/api/start/scan', { url: 'acme.com' }))
    const reader = (res.body as ReadableStream<Uint8Array>).getReader()
    await reader.read()
    await reader.cancel()
    release()
    await vi.waitFor(() => {
      const cache = (db.current as ReturnType<typeof fakeSupabase>).tables.free_leads_cache
      expect(cache.some((r) => String(r.key).startsWith('scan:'))).toBe(true)
    })
  })

  it('a failed scan is not cached', async () => {
    fetchSite.mockResolvedValue({ domain: 'acme.com', title: 'Acme', description: null, favicon: null, text: 'x'.repeat(400), source: 'direct' })
    scanIcp.mockRejectedValue(new Error('model down'))
    await events(await scan(req('/api/start/scan', { url: 'acme.com' })))
    await events(await scan(req('/api/start/scan', { url: 'acme.com' })))
    expect(scanIcp).toHaveBeenCalledTimes(2)
  })
})

describe('preview: shared cache', () => {
  it('buys 5 once, stores the raw rows for delivery, and serves why lines from cache', async () => {
    const contacts = Array.from({ length: 5 }, (_, i) => ({
      first_name: `P${i}`, last_name: 'Doe', email_address: `p${i}@acme.com`, email_status: 'VALID', job_title: 'CTO',
      job_level: '', org_company_name: 'Acme', org_domain: 'acme.com', org_industry_linkedin: '', employee_count_range: '',
      person_city: '', state_name: '', person_country_name: '', person_linkedin_url: '', cellphone: '',
    }))
    searchContacts.mockResolvedValue({ contacts, totalAvailable: 99 })
    scoreLeads.mockResolvedValue(contacts.map((_, i) => ({ score: 3, why: `why ${i}` })))
    const a = await (await preview(req('/api/start/preview', { icp: ICP }))).json()
    const b = await (await preview(req('/api/start/preview', { icp: ICP }))).json()
    expect(searchContacts).toHaveBeenCalledTimes(1)
    expect(a).toEqual(b)
    expect(a.leads[0]).toMatchObject({ first_name: 'P0', email_masked: 'p•••@acme.com', why: 'why 0' })
    expect(JSON.stringify(a)).not.toContain('p0@acme.com')
    const cache = (db.current as ReturnType<typeof fakeSupabase>).tables.free_leads_cache
    const rows = cache.find((r) => String(r.key).startsWith('preview-rows:'))
    expect((rows?.value as { contacts: unknown[] }).contacts).toHaveLength(5)
    // A different summary reuses the paid rows but gets its own why lines.
    scoreLeads.mockResolvedValue(contacts.map(() => ({ score: 2, why: 'other' })))
    const c = await (await preview(req('/api/start/preview', { icp: { ...ICP, summary: 'Injected text' } }))).json()
    expect(searchContacts).toHaveBeenCalledTimes(1)
    expect(c.leads[0].why).toBe('other')
    expect(a.leads[0].why).toBe('why 0')
  })
})

describe('scan: facts', () => {
  const site = { domain: 'acme.com', title: 'Acme', description: null, favicon: null, text: 'x'.repeat(400), source: 'direct' }
  const sitePricing = { key: 'pricing', label: 'Pricing', text: 'Listed prices: $499/mo', source: 'site' }
  const facts = (evs: unknown[]) => (evs as Array<{ type: string; fact?: { key: string; source: string; text: string } }>).filter((e) => e.type === 'fact').map((e) => e.fact)

  it('shows one Pricing fact, the model\'s, when both the site and the model state it', async () => {
    fetchSite.mockImplementation(async (_u: string, send: (e: unknown) => void) => (send({ type: 'fact', fact: sitePricing }), site))
    scanIcp.mockImplementation(async (_t: string, cb: { onFact: (f: unknown) => void }) => {
      cb.onFact({ key: 'pricing', label: 'Pricing', text: 'Per property monthly: $499 Foundation', source: 'model' })
      return ICP
    })
    countContacts.mockResolvedValue(10)
    const first = await events(await scan(req('/api/start/scan', { url: 'acme.com' })))
    expect(facts(first)).toEqual([expect.objectContaining({ key: 'pricing', source: 'model' })])
    const replayed = await events(await scan(req('/api/start/scan', { url: 'acme.com' })))
    expect(facts(replayed)).toHaveLength(1)
  })

  it('keeps the site Pricing fact when the model states none, and cleans a replayed "$ 499/mo"', async () => {
    fetchSite.mockImplementation(async (_u: string, send: (e: unknown) => void) => (send({ type: 'fact', fact: { ...sitePricing, text: 'Listed prices: $ 499/mo, $ 899/mo' } }), site))
    scanIcp.mockResolvedValue(ICP)
    countContacts.mockResolvedValue(10)
    await scan(req('/api/start/scan', { url: 'acme.com' }))
    const replayed = await events(await scan(req('/api/start/scan', { url: 'acme.com' })))
    expect(facts(replayed)).toEqual([expect.objectContaining({ key: 'pricing', text: 'Listed prices: $499/mo, $899/mo' })])
  })
})
