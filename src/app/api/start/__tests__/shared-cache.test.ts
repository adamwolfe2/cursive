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
    const second = await events(await scan(req('/api/start/scan', { url: 'https://www.acme.com/' })))
    expect(first.map((e) => e.type)).toEqual(['fact', 'icp', 'count', 'done'])
    expect(second[0]).toMatchObject({ type: 'replay' })
    expect(second.slice(1)).toEqual(first)
    expect(fetchSite).toHaveBeenCalledTimes(1)
    expect(scanIcp).toHaveBeenCalledTimes(1)
    expect(countContacts).toHaveBeenCalledTimes(1)
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
    const row = (db.current as ReturnType<typeof fakeSupabase>).tables.free_leads_cache[0]
    expect((row.value as { contacts: unknown[] }).contacts).toHaveLength(5)
  })
})
