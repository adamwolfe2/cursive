import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeSupabase } from './fake-supabase'

const searchContacts = vi.hoisted(() => vi.fn())
vi.mock('@/lib/getleads/client', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/getleads/client')>()
  return { ...real, searchContacts }
})
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => { throw new Error('use the fake') } }))
const scoreLeads = vi.hoisted(() => vi.fn())
vi.mock('../lead-fit', async (importOriginal) => {
  const real = await importOriginal<typeof import('../lead-fit')>()
  return { ...real, scoreLeads }
})

import { deliverWeekly, isoWeek, weeklyCandidates, FIRST_WEEKLY_OFFSET } from '../weekly'

type Admin = Parameters<typeof deliverWeekly>[2]

const person = (i: number) => ({
  first_name: `P${i}`, last_name: 'Lee', email_address: `p${i}@co${i}.com`, email_status: 'VALID',
  job_title: 'CTO', job_level: 'C-Team', org_company_name: `Co${i}`, org_domain: `co${i}.com`,
  org_industry_linkedin: 'Software Development', employee_count_range: '11 to 50', person_city: 'Austin',
  state_name: 'Texas', person_country_name: 'United States', person_linkedin_url: '', cellphone: '',
})
const people = (from: number, n: number) => Array.from({ length: n }, (_, i) => person(from + i))

/** (order_id, week) is unique, like the table's constraint. */
const weekIndex = (table: string, rows: Record<string, unknown>[]) => {
  if (table !== 'free_lead_weekly_deliveries') return true
  const keys = rows.map((r) => `${r.order_id}|${r.week}`)
  return new Set(keys).size === keys.length
}

const ORDER = { id: 'ord-1', workspace_id: 'ws-1' }
const WEEK = '2026-W41'

function setup(extra: Partial<Record<string, Record<string, unknown>[]>> = {}) {
  const db = fakeSupabase(
    {
      free_lead_claims: [{
        id: 'c1', email: 'ceo@acme.com', email_domain: 'acme.com', website: 'https://acme.com',
        icp: { summary: 'x', industries: [], job_titles: ['CTO'], seniority: [], company_size: [], countries: ['United States'], states: [], cities: [] },
        filters: { email_status: ['VALID'] }, status: 'fulfilled', workspace_id: 'ws-1', auth_user_id: 'u1',
        total_matching: 900, claim_token_hash: 'h', attempts: 1, processing_started_at: null, created_at: '2026-10-01T00:00:00Z',
      }],
      leads: [],
      free_lead_weekly_deliveries: [],
      funnel_orders: [],
      workspaces: [],
      ...extra,
    },
    weekIndex
  )
  return { db, admin: db as unknown as Admin }
}

beforeEach(() => {
  searchContacts.mockReset()
  scoreLeads.mockReset()
  scoreLeads.mockResolvedValue(null)
  process.env.GETLEADS_API_KEY = 'test-key'
})

describe('isoWeek', () => {
  it('labels weeks the ISO way, including the year boundary', () => {
    expect(isoWeek(new Date('2026-10-05T14:00:00Z'))).toBe('2026-W41')
    expect(isoWeek(new Date('2027-01-01T12:00:00Z'))).toBe('2026-W53')
    expect(isoWeek(new Date('2025-12-29T12:00:00Z'))).toBe('2026-W01')
  })
})

describe('deliverWeekly', () => {
  it('pulls past the free 25 on the first week and stores 25 new leads in the workspace', async () => {
    const { admin, db } = setup()
    searchContacts.mockResolvedValue({ contacts: people(0, 35), totalAvailable: 900 })
    const res = await deliverWeekly(ORDER, WEEK, admin)
    expect(res).toMatchObject({ status: 'delivered', leads: 25, credits: 35 })
    expect(searchContacts.mock.calls[0][1]).toEqual({ limit: 35, offset: FIRST_WEEKLY_OFFSET })
    expect(db.tables.leads).toHaveLength(25)
    expect(db.tables.leads.every((l) => l.workspace_id === 'ws-1')).toBe(true)
    expect(db.tables.free_lead_weekly_deliveries[0]).toMatchObject({ status: 'delivered', offset_start: FIRST_WEEKLY_OFFSET, offset_end: FIRST_WEEKLY_OFFSET + 35, leads: 25 })
  })

  it('continues from the last cursor the next week', async () => {
    const { admin } = setup({
      free_lead_weekly_deliveries: [{ id: 'd0', order_id: 'ord-1', workspace_id: 'ws-1', week: '2026-W40', status: 'delivered', offset_start: 35, offset_end: 70, created_at: '2026-09-28T14:00:00Z' }],
    })
    searchContacts.mockResolvedValue({ contacts: people(100, 35), totalAvailable: 900 })
    await deliverWeekly(ORDER, WEEK, admin)
    expect(searchContacts.mock.calls[0][1]).toEqual({ limit: 35, offset: 70 })
  })

  it('never buys twice for the same order and week (retry or overlapping run)', async () => {
    const { admin, db } = setup()
    searchContacts.mockResolvedValue({ contacts: people(0, 35), totalAvailable: 900 })
    const [a, b] = await Promise.all([deliverWeekly(ORDER, WEEK, admin), deliverWeekly(ORDER, WEEK, admin)])
    expect([a.status, b.status].sort()).toEqual(['already', 'delivered'])
    expect(searchContacts).toHaveBeenCalledTimes(1)
    expect(db.tables.leads).toHaveLength(25)
  })

  it('skips people already stored anywhere, so nobody is a repeat', async () => {
    const { admin, db } = setup()
    const batch = people(0, 35)
    searchContacts.mockResolvedValue({ contacts: batch, totalAvailable: 900 })
    const { leadHashKey } = await import('../rules')
    db.tables.leads.push({ id: 'old', workspace_id: 'ws-1', hash_key: leadHashKey(batch[0]) })
    await deliverWeekly(ORDER, WEEK, admin)
    expect(db.tables.leads.filter((l) => l.email === 'p0@co0.com')).toHaveLength(0)
  })

  it('marks the week failed when the paid pull fails, and does not retry it', async () => {
    const { admin, db } = setup()
    searchContacts.mockRejectedValue(new Error('upstream 500'))
    await expect(deliverWeekly(ORDER, WEEK, admin)).rejects.toThrow()
    expect(db.tables.free_lead_weekly_deliveries[0].status).toBe('failed')
    const again = await deliverWeekly(ORDER, WEEK, admin)
    expect(again.status).toBe('already')
    expect(searchContacts).toHaveBeenCalledTimes(1)
  })

  it('skips a workspace with no fulfilled claim without spending', async () => {
    const { admin } = setup({ free_lead_claims: [] })
    expect((await deliverWeekly(ORDER, WEEK, admin)).status).toBe('skipped')
    expect(searchContacts).not.toHaveBeenCalled()
  })
})

describe('weeklyCandidates', () => {
  it('returns only active weekly orders bound to free-leads workspaces', async () => {
    const { admin } = setup({
      funnel_orders: [
        { id: 'a', workspace_id: 'ws-1', offer_slug: 'audience_197', subscription_state: 'active' },
        { id: 'b', workspace_id: 'ws-2', offer_slug: 'audience_197', subscription_state: 'active' },
        { id: 'c', workspace_id: 'ws-1', offer_slug: 'audience_197', subscription_state: 'paused' },
        { id: 'd', workspace_id: 'ws-1', offer_slug: 'pixel_97', subscription_state: 'active' },
        { id: 'e', workspace_id: null, offer_slug: 'audience_197', subscription_state: 'active' },
      ],
      workspaces: [
        { id: 'ws-1', settings: { source: 'free_leads' } },
        { id: 'ws-2', settings: { source: 'funnel_order' } },
      ],
    })
    expect((await weeklyCandidates(admin)).map((o) => o.id)).toEqual(['a'])
  })
})
