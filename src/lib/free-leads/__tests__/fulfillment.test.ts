import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeSupabase } from './fake-supabase'

const searchContacts = vi.hoisted(() => vi.fn())
vi.mock('@/lib/getleads/client', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/getleads/client')>()
  return { ...real, searchContacts }
})
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => { throw new Error('use the fake') } }))

import { GetLeadsError } from '@/lib/getleads/client'
import {
  beginFulfillment,
  fulfillClaim,
  releaseClaim,
  withinDailyFulfillmentCap,
  type ClaimRow,
} from '../claims'
import { leadsActionFor } from '../rules'

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
