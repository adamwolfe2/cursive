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
const generatePersona = vi.hoisted(() => vi.fn())
vi.mock('@/lib/free-leads/persona', async (orig) => ({ ...(await orig<typeof import('@/lib/free-leads/persona')>()), generatePersona }))
const countContacts = vi.hoisted(() => vi.fn())
vi.mock('@/lib/getleads/client', async (orig) => ({ ...(await orig<typeof import('@/lib/getleads/client')>()), countContacts }))

import { POST as scan } from '../scan/route'

const ICP = {
  summary: 'You sell SOC 2 audits to SaaS teams.', industries: ['Software Development'], job_titles: ['CTO'],
  seniority: [], company_size: [], countries: ['United States'], states: [], cities: [],
}
const PERSONA = {
  name: 'Dana', role: 'VP Operations', company: 'a 12-property operator in Austin', day: 'Walks buildings.',
  measured_on: ['Occupancy', 'Work orders'], replies_when: 'A short note.',
}
const req = (body: unknown) =>
  new NextRequest('http://localhost/api/start/scan', { method: 'POST', body: JSON.stringify(body), headers: { 'x-forwarded-for': '1.2.3.4' } })
const events = async (res: Response) =>
  (await res.text()).split('\n\n').filter(Boolean).map((l) => JSON.parse(l.replace(/^data: /, '')) as { type: string })
const cacheRows = () => (db.current as ReturnType<typeof fakeSupabase>).tables.free_leads_cache
const types = (es: Array<{ type: string }>) => es.map((e) => e.type)

beforeEach(() => {
  db.current = fakeSupabase({ free_leads_cache: [], free_lead_sessions: [], free_lead_events: [] })
  for (const m of [fetchSite, scanIcp, generatePersona, countContacts]) m.mockReset()
  fetchSite.mockResolvedValue({ domain: 'acme.com', title: 'Acme', description: null, favicon: null, text: 'x'.repeat(400), source: 'direct' })
  scanIcp.mockResolvedValue(ICP)
  countContacts.mockResolvedValue(50)
  generatePersona.mockResolvedValue(PERSONA)
})

describe('scan: persona', () => {
  it('sends count, then persona, then done', async () => {
    const es = await events(await scan(req({ url: 'acme.com' })))
    expect(types(es)).toEqual(['icp', 'count', 'persona', 'done'])
    expect(es[2]).toMatchObject({ persona: PERSONA })
  })

  it('does not delay the count: persona starts before the count resolves', async () => {
    let release!: () => void
    countContacts.mockImplementation(() => new Promise<number>((r) => (release = () => r(9))))
    const res = await scan(req({ url: 'acme.com' }))
    await vi.waitFor(() => expect(generatePersona).toHaveBeenCalled())
    release()
    expect(types(await events(res))).toEqual(['icp', 'count', 'persona', 'done'])
  })

  it('a persona failure still ends in done', async () => {
    generatePersona.mockRejectedValue(new Error('model down'))
    expect(types(await events(await scan(req({ url: 'acme.com' }))))).toEqual(['icp', 'count', 'done'])
  })

  it('description-only scans get a persona and are not cached', async () => {
    const es = await events(await scan(req({ description: 'We sell SOC 2 audits to Series A software companies in the US.' })))
    expect(types(es)).toEqual(['icp', 'count', 'persona', 'done'])
    expect(cacheRows().some((r) => String(r.key).startsWith('scan:'))).toBe(false)
  })

  it('a replay with a cached persona makes no model call', async () => {
    await events(await scan(req({ url: 'acme.com' })))
    generatePersona.mockClear()
    const es = await events(await scan(req({ url: 'acme.com' })))
    expect(types(es)).toEqual(['replay', 'icp', 'count', 'persona', 'done'])
    expect(es[3]).toMatchObject({ persona: PERSONA })
    expect(generatePersona).not.toHaveBeenCalled()
    expect(scanIcp).toHaveBeenCalledTimes(1)
  })

  it('a replay without a persona generates one once and writes it back', async () => {
    generatePersona.mockRejectedValueOnce(new Error('model down'))
    await events(await scan(req({ url: 'acme.com' })))
    expect(JSON.stringify(cacheRows())).not.toContain('"persona"')
    const second = await events(await scan(req({ url: 'acme.com' })))
    expect(types(second)).toEqual(['replay', 'icp', 'count', 'persona', 'done'])
    expect(generatePersona).toHaveBeenCalledTimes(2)
    const third = await events(await scan(req({ url: 'acme.com' })))
    expect(types(third)).toContain('persona')
    expect(generatePersona).toHaveBeenCalledTimes(2)
  })
})
