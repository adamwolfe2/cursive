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
const retrieve = vi.hoisted(() => vi.fn())
vi.mock('@/lib/stripe/client', () => ({ getStripeClient: () => ({ subscriptions: { retrieve } }) }))
const notifySales = vi.hoisted(() => vi.fn())
vi.mock('../notify', () => ({ notifySales }))
const sendEmail = vi.hoisted(() => vi.fn())
vi.mock('@/lib/email/templates/free-leads-weekly', () => ({ sendFreeLeadsWeeklyEmail: sendEmail }))

import { runWeekly } from '../weekly'

type Admin = Parameters<typeof runWeekly>[0]

const person = (i: number) => ({
  first_name: `P${i}`, last_name: 'Lee', email_address: `p${i}@co${i}.com`, email_status: 'VALID',
  job_title: 'CTO', job_level: 'C-Team', org_company_name: `Co${i}`, org_domain: `co${i}.com`,
  org_industry_linkedin: 'Software Development', employee_count_range: '11 to 50', person_city: 'Austin',
  state_name: 'Texas', person_country_name: 'United States', person_linkedin_url: '', cellphone: '',
})
const people = (n: number) => Array.from({ length: n }, (_, i) => person(i))

const weekIndex = (table: string, rows: Record<string, unknown>[]) => {
  if (table !== 'free_lead_weekly_deliveries') return true
  const keys = rows.map((r) => `${r.order_id}|${r.week}`)
  return new Set(keys).size === keys.length
}

const MONDAY = new Date('2026-10-05T14:00:00Z') // 2026-W41
const FAR = Date.now() + 3_600_000

function setup(orders: Record<string, unknown>[]) {
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
      funnel_orders: orders,
      workspaces: [{ id: 'ws-1', settings: { source: 'free_leads' } }],
      users: [{ workspace_id: 'ws-1', role: 'owner', email: 'ceo@acme.com' }],
    },
    weekIndex
  )
  return { db, admin: db as unknown as Admin }
}

const active = { id: 'ord-1', workspace_id: 'ws-1', offer_slug: 'audience_197', subscription_state: 'active', stripe_subscription_id: 'sub_1' }
const paused = { ...active, subscription_state: 'paused' }

beforeEach(() => {
  for (const m of [searchContacts, scoreLeads, retrieve, notifySales, sendEmail]) m.mockReset()
  scoreLeads.mockResolvedValue(null)
  process.env.GETLEADS_API_KEY = 'test-key'
})

describe('runWeekly', () => {
  it('handles an empty candidate list without spending', async () => {
    const { admin } = setup([])
    expect(await runWeekly(admin, MONDAY, FAR)).toEqual({ week: '2026-W41', orders: 0, delivered: 0, failed: 0, deferred: 0 })
    expect(searchContacts).not.toHaveBeenCalled()
  })

  it('delivers once and a second run in the same week (cron + catch-up or Inngest) buys nothing', async () => {
    const { admin, db } = setup([active])
    searchContacts.mockResolvedValue({ contacts: people(35), totalAvailable: 900 })
    const first = await runWeekly(admin, MONDAY, FAR)
    const second = await runWeekly(admin, MONDAY, FAR)
    expect(first.delivered).toBe(1)
    expect(second.delivered).toBe(0)
    expect(searchContacts).toHaveBeenCalledTimes(1)
    expect(db.tables.leads).toHaveLength(25)
    expect(db.tables.free_lead_weekly_deliveries).toHaveLength(1)
    expect(sendEmail).toHaveBeenCalledTimes(1)
  })

  it('skips an order whose subscription ended: no lock row, no pull', async () => {
    const { admin, db } = setup([paused])
    retrieve.mockResolvedValue({ status: 'canceled' })
    const res = await runWeekly(admin, MONDAY, FAR)
    expect(res).toMatchObject({ orders: 1, delivered: 0, failed: 0 })
    expect(searchContacts).not.toHaveBeenCalled()
    expect(db.tables.free_lead_weekly_deliveries).toHaveLength(0)
    expect(notifySales).not.toHaveBeenCalled()
  })

  it('still delivers to a paused order whose subscription is active until period end', async () => {
    const { admin } = setup([paused])
    retrieve.mockResolvedValue({ status: 'active' })
    searchContacts.mockResolvedValue({ contacts: people(35), totalAvailable: 900 })
    expect((await runWeekly(admin, MONDAY, FAR)).delivered).toBe(1)
  })

  it('marks the week failed on a provider error, alerts sales, and does not re-buy on the catch-up run', async () => {
    const { admin, db } = setup([active])
    searchContacts.mockRejectedValue(new Error('upstream 500'))
    const first = await runWeekly(admin, MONDAY, FAR)
    expect(first).toMatchObject({ delivered: 0, failed: 1 })
    expect(db.tables.free_lead_weekly_deliveries[0].status).toBe('failed')
    expect(db.tables.leads).toHaveLength(0)
    expect(notifySales).toHaveBeenCalledTimes(1)
    const second = await runWeekly(admin, MONDAY, FAR)
    expect(second.failed).toBe(0)
    expect(searchContacts).toHaveBeenCalledTimes(1)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('defers orders once the time budget is spent and says so', async () => {
    const { admin } = setup([active])
    const res = await runWeekly(admin, MONDAY, Date.now() - 1)
    expect(res).toMatchObject({ orders: 1, delivered: 0, deferred: 1 })
    expect(searchContacts).not.toHaveBeenCalled()
    expect(notifySales).toHaveBeenCalledTimes(1)
  })
})
