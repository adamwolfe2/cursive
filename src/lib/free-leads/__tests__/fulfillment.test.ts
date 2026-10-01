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

import { GetLeadsError } from '@/lib/getleads/client'
import {
  beginFulfillment,
  fulfillClaim,
  releaseClaim,
  withinDailyFulfillmentCap,
  type ClaimRow,
} from '../claims'
import { leadHashKey, leadsActionFor } from '../rules'
import { filtersHash } from '../icp-to-filters'
import { loadStoredLeads } from '../claims'

type Admin = Parameters<typeof fulfillClaim>[2]

const contact = {
  first_name: 'Ada', last_name: 'Lovelace', email_address: 'ada@acme.com', email_status: 'VALID',
  job_title: 'CTO', job_level: 'C-Team', org_company_name: 'Acme', org_domain: 'acme.com',
  org_industry_linkedin: 'Software Development', employee_count_range: '11 to 50', person_city: 'Austin',
  state_name: 'Texas', person_country_name: 'United States', person_linkedin_url: '', cellphone: '',
}

/** One claim per domain in processing/fulfilled, like the partial unique index. */
const domainIndex = (table: string, rows: Record<string, unknown>[]) => {
  if (table !== 'free_lead_claims') return true
  const active = rows.filter((r) => r.status === 'processing' || r.status === 'fulfilled').map((r) => r.email_domain)
  return new Set(active).size === active.length
}

function setup(extra: Record<string, unknown>[] = []) {
  const claim = {
    id: 'c1', email: 'ceo@acme.com', email_domain: 'acme.com', website: 'https://acme.com', icp: {},
    filters: { email_status: ['VALID'] }, status: 'pending', workspace_id: null, auth_user_id: null,
    total_matching: null, claim_token_hash: 'h', attempts: 0, processing_started_at: null,
    created_at: new Date().toISOString(),
  }
  const db = fakeSupabase(
    { free_lead_claims: [claim, ...extra], users: [{ auth_user_id: 'u1', workspace_id: 'ws1' }], leads: [] },
    domainIndex
  )
  const admin = db as unknown as Admin
  const row = () => db.tables.free_lead_claims.find((r) => r.id === 'c1') as unknown as ClaimRow
  return { db, admin, row }
}

async function lockAndFulfill(admin: Admin, row: () => ClaimRow) {
  expect(await beginFulfillment('c1', 'u1', admin)).toBe(true)
  return fulfillClaim(row(), 'u1', admin)
}

describe('claim fulfillment state machine', () => {
  beforeEach(() => {
    searchContacts.mockReset()
    scoreLeads.mockReset()
    scoreLeads.mockResolvedValue(null)
    process.env.GETLEADS_API_KEY = 'test-key'
  })

  it('pending -> processing -> fulfilled with exactly one paid attempt', async () => {
    const { admin, row, db } = setup()
    searchContacts.mockResolvedValue({ contacts: [contact], totalAvailable: 900 })
    await lockAndFulfill(admin, row)
    expect(row()).toMatchObject({ status: 'fulfilled', attempts: 1, workspace_id: 'ws1', credits_used: 1, total_matching: 900 })
    expect(row().processing_started_at).toBeTruthy()
    expect(db.tables.leads).toHaveLength(1)
    expect(db.tables.leads[0]).toMatchObject({ workspace_id: 'ws1', source: 'free_leads' })
  })

  it('a failure AFTER the paid request is sent goes to failed, never back to pending', async () => {
    const { admin, row } = setup()
    searchContacts.mockRejectedValue(new GetLeadsError('timed out', 'timeout'))
    await expect(lockAndFulfill(admin, row)).rejects.toThrow('fulfillment failed')
    expect(row()).toMatchObject({ status: 'failed', attempts: 1 })
    expect(leadsActionFor(row())).toBe('failed')
    // A refresh cannot re-bill: the lock refuses a claim that already attempted a pull.
    expect(await beginFulfillment('c1', 'u1', admin)).toBe(false)
    expect(searchContacts).toHaveBeenCalledTimes(1)
  })

  it('a failure BEFORE the request (not configured) releases to pending with attempts untouched', async () => {
    const { admin, row } = setup()
    delete process.env.GETLEADS_API_KEY
    await expect(lockAndFulfill(admin, row)).rejects.toThrow('fulfillment failed')
    expect(row()).toMatchObject({ status: 'pending', attempts: 0, processing_started_at: null })
    expect(searchContacts).not.toHaveBeenCalled()
    expect(leadsActionFor(row())).toBe('fulfill')
  })

  it('a workspace provisioning failure also releases to pending', async () => {
    const { admin, row, db } = setup()
    db.tables.users = []
    db.tables.workspaces = []
    const from = db.from
    ;(db as { from: typeof from }).from = (t: string) => {
      if (t === 'workspaces') throw new Error('db down')
      return from(t)
    }
    await expect(lockAndFulfill(admin, row)).rejects.toThrow('fulfillment failed')
    expect(row()).toMatchObject({ status: 'pending', attempts: 0 })
    expect(searchContacts).not.toHaveBeenCalled()
  })

  it('release never reopens a claim whose pull was attempted', async () => {
    const { admin, row } = setup()
    searchContacts.mockRejectedValue(new GetLeadsError('boom', 'network'))
    await expect(lockAndFulfill(admin, row)).rejects.toThrow()
    row().status = 'processing'
    await releaseClaim('c1', admin)
    expect(row().status).toBe('processing')
  })

  it('parallel tabs: only one request wins the lock and pays', async () => {
    const { admin } = setup()
    const wins = await Promise.all(Array.from({ length: 5 }, () => beginFulfillment('c1', 'u1', admin)))
    expect(wins.filter(Boolean)).toHaveLength(1)
  })

  it('a colleague racing on the same domain is refused by the unique index', async () => {
    const other = {
      id: 'c2', email: 'cto@acme.com', email_domain: 'acme.com', status: 'fulfilled', attempts: 1,
      processing_started_at: new Date().toISOString(),
    }
    const { admin, row } = setup([other])
    await expect(beginFulfillment('c1', 'u1', admin)).rejects.toThrow('company domain already claimed')
    expect(row().status).toBe('failed')
  })

  it('daily fulfillment cap counts the caller itself, so a burst cannot overspend', async () => {
    const started = new Date().toISOString()
    const others = Array.from({ length: 2 }, (_, i) => ({
      id: `o${i}`, email_domain: `d${i}.com`, status: 'fulfilled', processing_started_at: started,
    }))
    const { admin } = setup(others)
    expect(await beginFulfillment('c1', 'u1', admin)).toBe(true)
    expect(await withinDailyFulfillmentCap(admin, 3)).toBe(true)
    expect(await withinDailyFulfillmentCap(admin, 2)).toBe(false)
  })
})

const ICP = {
  summary: 'You sell HVAC service to Dallas facility managers.', industries: [], job_titles: ['Facilities Manager'],
  seniority: [], company_size: [], countries: ['United States'], states: ['Texas'], cities: ['Dallas'],
}
const people = (n: number, from = 0) =>
  Array.from({ length: n }, (_, i) => ({ ...contact, first_name: `P${from + i}`, email_address: `p${from + i}@acme.com` }))

describe('delivery: over-pull, fit check, preview reuse', () => {
  beforeEach(() => {
    searchContacts.mockReset()
    scoreLeads.mockReset()
    process.env.GETLEADS_API_KEY = 'test-key'
  })

  function withIcp(extra: Record<string, unknown>[] = []) {
    const ctx = setup(extra)
    Object.assign(ctx.row(), { icp: ICP })
    return ctx
  }

  it('pulls 35 in one paid request, drops 0s, stores the best 25 with why and rank', async () => {
    const { admin, row, db } = withIcp()
    searchContacts.mockResolvedValue({ contacts: people(35), totalAvailable: 500 })
    // Leads 0-4 score 0, 5-14 score 3, the rest 1.
    scoreLeads.mockResolvedValue(people(35).map((_, i) => ({ score: i < 5 ? 0 : i < 15 ? 3 : 1, why: `why ${i}` })))
    await lockAndFulfill(admin, row)
    expect(searchContacts).toHaveBeenCalledTimes(1)
    expect(searchContacts.mock.calls[0][1]).toEqual({ limit: 35, offset: 0 })
    expect(row()).toMatchObject({ status: 'fulfilled', attempts: 1, credits_used: 35 })
    expect(db.tables.leads).toHaveLength(25)
    const names = db.tables.leads.map((l) => l.first_name)
    expect(names).not.toContain('P0')
    expect(names.slice(0, 10)).toEqual(Array.from({ length: 10 }, (_, i) => `P${i + 5}`))
    expect(db.tables.leads[0].metadata).toEqual({ free_lead_claim_id: 'c1', fit_score: 3, fit_why: 'why 5', fit_rank: 0 })
  })

  it('reuses the cached preview contacts and only buys the rest (offset past them)', async () => {
    const preview = people(5, 100)
    const { admin, row, db } = withIcp()
    db.tables.free_leads_cache = [
      { key: `preview-rows:${filtersHash(row().filters)}`, value: { contacts: preview, total: 500 }, expires_at: new Date(Date.now() + 60_000).toISOString() },
    ]
    searchContacts.mockResolvedValue({ contacts: people(30), totalAvailable: 500 })
    scoreLeads.mockResolvedValue(null)
    await lockAndFulfill(admin, row)
    expect(searchContacts).toHaveBeenCalledTimes(1)
    expect(searchContacts.mock.calls[0][1]).toEqual({ limit: 30, offset: 5 })
    expect(row()).toMatchObject({ status: 'fulfilled', credits_used: 30 })
    expect(db.tables.leads.slice(0, 5).map((l) => l.first_name)).toEqual(['P100', 'P101', 'P102', 'P103', 'P104'])
    expect(db.tables.leads).toHaveLength(25)
  })

  it('a failed fit check still delivers 25 unscored and never pulls again', async () => {
    const { admin, row, db } = withIcp()
    searchContacts.mockResolvedValue({ contacts: people(35), totalAvailable: 500 })
    scoreLeads.mockResolvedValue(null)
    await lockAndFulfill(admin, row)
    expect(row().status).toBe('fulfilled')
    expect(searchContacts).toHaveBeenCalledTimes(1)
    expect(db.tables.leads).toHaveLength(25)
    expect(db.tables.leads[0].metadata).toEqual({ free_lead_claim_id: 'c1' })
  })

  it('never delivers zero after paying: an all-zero fit check falls back to unscored rows', async () => {
    const { admin, row, db } = withIcp()
    searchContacts.mockResolvedValue({ contacts: people(35), totalAvailable: 500 })
    scoreLeads.mockResolvedValue(people(35).map(() => ({ score: 0, why: 'no' })))
    await lockAndFulfill(admin, row)
    expect(db.tables.leads).toHaveLength(25)
    expect(row().status).toBe('fulfilled')
  })

  it('skips people already stored in any workspace (global hash_key) and still delivers 25', async () => {
    const { admin, row, db } = withIcp()
    const pool = people(35)
    db.tables.leads.push({ workspace_id: 'other-ws', hash_key: leadHashKey(pool[0]) }, { workspace_id: 'other-ws', hash_key: leadHashKey(pool[7]) })
    searchContacts.mockResolvedValue({ contacts: pool, totalAvailable: 500 })
    scoreLeads.mockResolvedValue(null)
    await lockAndFulfill(admin, row)
    const mine = db.tables.leads.filter((l) => l.workspace_id === 'ws1')
    expect(mine).toHaveLength(25)
    expect(mine.map((l) => l.first_name)).not.toContain('P0')
    expect(mine.map((l) => l.first_name)).not.toContain('P7')
    expect(searchContacts).toHaveBeenCalledTimes(1)
    expect(row().status).toBe('fulfilled')
  })

  it('reads stored leads best-first with the why line', async () => {
    const { admin, row, db } = withIcp()
    searchContacts.mockResolvedValue({ contacts: people(3), totalAvailable: 3 })
    scoreLeads.mockResolvedValue([{ score: 1, why: 'c' }, { score: 3, why: 'a' }, { score: 2, why: 'b' }])
    await lockAndFulfill(admin, row)
    db.tables.leads.reverse() // storage order is not guaranteed
    const leads = await loadStoredLeads('ws1', 'c1', admin)
    expect(leads.map((l) => l.why)).toEqual(['a', 'b', 'c'])
  })
})

describe('stale processing recovery (nothing billed yet)', () => {
  it('a stale lock with no paid attempt goes back to pending and can be fulfilled; a billed one cannot', async () => {
    const { recoverStaleClaim } = await import('../claims')
    const { admin, row } = setup()
    const old = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    Object.assign(row(), { status: 'processing', attempts: 0, processing_started_at: old })
    expect(leadsActionFor(row())).toBe('recover')
    await recoverStaleClaim('c1', admin)
    expect(row()).toMatchObject({ status: 'pending', processing_started_at: null })
    expect(leadsActionFor(row())).toBe('fulfill')

    Object.assign(row(), { status: 'processing', attempts: 1, processing_started_at: old })
    expect(leadsActionFor(row())).toBe('failed')
    await recoverStaleClaim('c1', admin)
    expect(row().status).toBe('processing')
  })

  it('a fresh lock is never recovered (a live request may be mid-pull)', async () => {
    const { recoverStaleClaim } = await import('../claims')
    const { admin, row } = setup()
    Object.assign(row(), { status: 'processing', attempts: 0, processing_started_at: new Date().toISOString() })
    expect(leadsActionFor(row())).toBe('wait')
    await recoverStaleClaim('c1', admin)
    expect(row().status).toBe('processing')
  })
})
