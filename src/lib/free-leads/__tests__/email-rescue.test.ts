import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeSupabase } from './fake-supabase'

const searchContacts = vi.hoisted(() => vi.fn())
vi.mock('@/lib/getleads/client', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/getleads/client')>()), searchContacts }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => { throw new Error('use the fake') } }))
const scoreLeads = vi.hoisted(() => vi.fn())
vi.mock('../lead-fit', async (importOriginal) => ({ ...(await importOriginal<typeof import('../lead-fit')>()), scoreLeads }))
const findWorkEmail = vi.hoisted(() => vi.fn())
vi.mock('@/lib/prospeo/client', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/prospeo/client')>()), findWorkEmail }))
const isLimited = vi.hoisted(() => vi.fn())
vi.mock('../http', () => ({ isLimited }))

import { beginFulfillment, fulfillClaim, type ClaimRow } from '../claims'
import { MAX_EMAIL_LOOKUPS } from '../email-rescue'

type Admin = Parameters<typeof fulfillClaim>[2]

const person = (i: number, email: boolean, over: Record<string, string> = {}) => ({
  first_name: `F${i}`, last_name: `L${i}`, email_address: email ? `p${i}@co${i}.com` : '', email_status: email ? 'VALID' : '',
  job_title: 'Owner', job_level: 'Owner', org_company_name: `Co${i}`, org_domain: `co${i}.com`, org_industry_linkedin: 'Dentists',
  employee_count_range: '1 to 10', person_city: 'Austin', state_name: 'Texas', person_country_name: 'United States',
  person_linkedin_url: '', cellphone: '', ...over,
})
const range = (from: number, n: number, email: boolean) => Array.from({ length: n }, (_, k) => person(from + k, email))

function setup() {
  const claim = {
    id: 'c1', email: 'ceo@acme.com', email_domain: 'acme.com', website: 'https://acme.com', icp: {},
    filters: { industries: ['Dentists'], email_status: ['VALID'] }, status: 'pending', workspace_id: null, auth_user_id: null,
    total_matching: null, claim_token_hash: 'h', attempts: 0, processing_started_at: null, created_at: new Date().toISOString(),
  }
  const db = fakeSupabase({ free_lead_claims: [claim], users: [{ auth_user_id: 'u1', workspace_id: 'ws1' }], leads: [] })
  const admin = db as unknown as Admin
  const row = () => db.tables.free_lead_claims.find((r) => r.id === 'c1') as unknown as ClaimRow
  return { db, admin, row }
}

async function run(admin: Admin, row: () => ClaimRow) {
  expect(await beginFulfillment('c1', 'u1', admin)).toBe(true)
  return fulfillClaim(row(), 'u1', admin)
}

describe('small-niche email rescue', () => {
  beforeEach(() => {
    for (const m of [searchContacts, scoreLeads, findWorkEmail, isLimited]) m.mockReset()
    scoreLeads.mockResolvedValue(null)
    isLimited.mockResolvedValue(false)
    findWorkEmail.mockImplementation(async (q: { firstName: string }) => `${q.firstName.toLowerCase()}@found.test`)
    process.env.GETLEADS_API_KEY = 'k'
    process.env.PROSPEO_API_KEY = 'p'
  })

  it('large pool: no extra pull, no lookups, no extra cost', async () => {
    const { admin, row, db } = setup()
    searchContacts.mockResolvedValue({ contacts: range(0, 35, true), totalAvailable: 900 })
    const cost = await run(admin, row)
    expect(searchContacts).toHaveBeenCalledTimes(1)
    expect(findWorkEmail).not.toHaveBeenCalled()
    expect(isLimited).not.toHaveBeenCalled()
    expect(db.tables.leads).toHaveLength(25)
    expect(cost).toMatchObject({ credits: 35, extra_credits: 0, email_lookups: { tried: 0, found: 0 } })
  })

  it('thin pool: one extra pull without the email filter, lookups only up to the shortfall', async () => {
    const { admin, row, db } = setup()
    searchContacts
      .mockResolvedValueOnce({ contacts: range(0, 20, true), totalAvailable: 20 })
      .mockResolvedValueOnce({ contacts: [...range(0, 3, true), ...range(100, 7, false)], totalAvailable: 40 })
    const cost = await run(admin, row)
    expect(searchContacts).toHaveBeenCalledTimes(2)
    const [filters, page] = searchContacts.mock.calls[1]
    expect(filters.email_status).toBeUndefined()
    expect(filters.industries).toEqual(['Dentists'])
    expect(page.limit).toBe(10) // shortfall 5 x 2
    expect(findWorkEmail).toHaveBeenCalledTimes(5)
    expect(db.tables.leads).toHaveLength(25)
    expect(cost).toMatchObject({ credits: 30, extra_credits: 10, email_lookups: { tried: 5, found: 5 } })
    expect(cost.usd).toBeGreaterThan(0)
    expect(row()).toMatchObject({ status: 'fulfilled', attempts: 1, credits_used: 30 })
  })

  it('a short list in a big market (people already stored elsewhere) is not rescued', async () => {
    const { admin, row } = setup()
    searchContacts.mockResolvedValueOnce({ contacts: range(0, 20, true), totalAvailable: 5000 })
    const cost = await run(admin, row)
    expect(searchContacts).toHaveBeenCalledTimes(1)
    expect(findWorkEmail).not.toHaveBeenCalled()
    expect(cost.email_lookups).toEqual({ tried: 0, found: 0 })
  })

  it('pull limit is capped at 30 and lookups at the per-claim cap when nobody is found', async () => {
    const { admin, row, db } = setup()
    searchContacts
      .mockResolvedValueOnce({ contacts: range(0, 2, true), totalAvailable: 2 })
      .mockResolvedValueOnce({ contacts: range(100, 30, false), totalAvailable: 5000 })
    findWorkEmail.mockResolvedValue(null)
    const cost = await run(admin, row)
    expect(searchContacts.mock.calls[1][1].limit).toBe(30)
    expect(findWorkEmail.mock.calls.length).toBeLessThanOrEqual(MAX_EMAIL_LOOKUPS)
    expect(findWorkEmail).toHaveBeenCalledTimes(30)
    expect(db.tables.leads).toHaveLength(2)
    expect(cost.email_lookups).toEqual({ tried: 30, found: 0 })
    expect(row().status).toBe('fulfilled')
  })

  it('lookup failures and timeouts never fail the claim', async () => {
    const { admin, row, db } = setup()
    searchContacts
      .mockResolvedValueOnce({ contacts: range(0, 20, true), totalAvailable: 20 })
      .mockResolvedValueOnce({ contacts: range(100, 10, false), totalAvailable: 40 })
    findWorkEmail.mockRejectedValue(Object.assign(new Error('boom'), { code: 'timeout' }))
    const cost = await run(admin, row)
    expect(row().status).toBe('fulfilled')
    expect(db.tables.leads).toHaveLength(20)
    expect(cost.email_lookups.found).toBe(0)
  })

  it('a failed extra pull delivers the thin pool as today', async () => {
    const { admin, row, db } = setup()
    searchContacts.mockResolvedValueOnce({ contacts: range(0, 20, true), totalAvailable: 20 }).mockRejectedValueOnce(new Error('down'))
    const cost = await run(admin, row)
    expect(row()).toMatchObject({ status: 'fulfilled', attempts: 1 })
    expect(db.tables.leads).toHaveLength(20)
    expect(cost.extra_credits).toBe(0)
  })

  it('missing PROSPEO_API_KEY: no extra pull, no lookups, delivers as today', async () => {
    const { admin, row, db } = setup()
    delete process.env.PROSPEO_API_KEY
    searchContacts.mockResolvedValue({ contacts: range(0, 20, true), totalAvailable: 20 })
    await run(admin, row)
    expect(searchContacts).toHaveBeenCalledTimes(1)
    expect(findWorkEmail).not.toHaveBeenCalled()
    expect(db.tables.leads).toHaveLength(20)
  })

  it('daily cap hit: no extra pull and no lookups', async () => {
    const { admin, row, db } = setup()
    isLimited.mockResolvedValue(true)
    searchContacts.mockResolvedValue({ contacts: range(0, 20, true), totalAvailable: 20 })
    await run(admin, row)
    expect(searchContacts).toHaveBeenCalledTimes(1)
    expect(findWorkEmail).not.toHaveBeenCalled()
    expect(db.tables.leads).toHaveLength(20)
  })

  it('cap reached mid-claim stops further lookups', async () => {
    const { admin, row } = setup()
    searchContacts
      .mockResolvedValueOnce({ contacts: range(0, 10, true), totalAvailable: 10 })
      .mockResolvedValueOnce({ contacts: range(100, 30, false), totalAvailable: 40 })
    isLimited.mockResolvedValueOnce(false).mockResolvedValueOnce(false).mockResolvedValue(true)
    const cost = await run(admin, row)
    expect(cost.email_lookups.tried).toBe(2)
    expect(row().status).toBe('fulfilled')
  })

  it('rescued leads still go through dedupe and the stored-leads check', async () => {
    const { admin, row, db } = setup()
    // The finder returns an address that is already one of the pulled emails, and one already stored anywhere.
    searchContacts
      .mockResolvedValueOnce({ contacts: range(0, 23, true), totalAvailable: 23 })
      .mockResolvedValueOnce({ contacts: range(100, 10, false), totalAvailable: 40 })
    findWorkEmail.mockResolvedValueOnce('p0@co0.com').mockResolvedValueOnce('fresh@found.test')
    const cost = await run(admin, row)
    const emails = db.tables.leads.map((l) => l.email)
    expect(new Set(emails).size).toBe(emails.length)
    expect(emails).toContain('fresh@found.test')
    expect(cost.email_lookups.tried).toBe(2)
  })
})
