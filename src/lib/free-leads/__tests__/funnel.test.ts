import { describe, expect, it, vi } from 'vitest'
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => { throw new Error('use the fake') } }))
import { NextRequest } from 'next/server'
import { recordStep, sessionIdFrom } from '../funnel'
import { fakeSupabase } from './fake-supabase'

type Admin = NonNullable<Parameters<typeof recordStep>[2]>['admin']
const SID = '6f1c2a9e-3b7d-4c1a-9e2f-1a2b3c4d5e6f'

describe('funnel', () => {
  it('reads only a valid uuid session header', () => {
    const r = (v: string) => new NextRequest('http://x/api/start/scan', { headers: { 'x-fl-session': v } })
    expect(sessionIdFrom(r(SID))).toBe(SID)
    expect(sessionIdFrom(r('not-a-uuid'))).toBeNull()
  })

  it('creates the session once with first-touch attribution, then patches and appends steps', async () => {
    const db = fakeSupabase({ free_lead_sessions: [], free_lead_events: [] })
    const admin = db as unknown as Admin
    await recordStep(SID, 'paste', { admin, attribution: { utm_source: 'linkedin' }, patch: { website: 'https://acme.com' } })
    await recordStep(SID, 'scan_done', { admin, attribution: { utm_source: 'overwritten?' }, patch: { total: 42 }, meta: { usd: 0.01 } })
    expect(db.tables.free_lead_sessions).toHaveLength(1)
    expect(db.tables.free_lead_sessions[0]).toMatchObject({
      id: SID, attribution: { utm_source: 'linkedin' }, website: 'https://acme.com', total: 42, last_step: 'scan_done',
    })
    expect(db.tables.free_lead_events.map((e) => e.step)).toEqual(['paste', 'scan_done'])
    expect(db.tables.free_lead_events[1].meta).toEqual({ usd: 0.01 })
  })

  it('does nothing without a session and never throws when the database fails', async () => {
    await expect(recordStep(null, 'paste')).resolves.toBeUndefined()
    const broken = { from: () => { throw new Error('db down') } }
    await expect(recordStep(SID, 'paste', { admin: broken as unknown as Admin })).resolves.toBeUndefined()
  })
})
