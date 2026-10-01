import { describe, expect, it, vi } from 'vitest'
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => { throw new Error('use the fake') } }))
import { cacheGet, cachePut } from '../cache'
import { fakeSupabase } from './fake-supabase'

type Admin = Parameters<typeof cacheGet>[1]

describe('free-leads cache', () => {
  it('round-trips a value, overwrites on put, and ignores expired rows', async () => {
    const db = fakeSupabase({ free_leads_cache: [] })
    const admin = db as unknown as Admin
    expect(await cacheGet('count:x', admin)).toBeNull()
    await cachePut('count:x', { total: 1 }, 60_000, admin)
    await cachePut('count:x', { total: 2 }, 60_000, admin)
    expect(await cacheGet('count:x', admin)).toEqual({ total: 2 })
    expect(db.tables.free_leads_cache).toHaveLength(1)
    db.tables.free_leads_cache[0].expires_at = new Date(Date.now() - 1).toISOString()
    expect(await cacheGet('count:x', admin)).toBeNull()
  })

  it('sometimes sweeps expired rows on write (preview rows hold contact data)', async () => {
    const db = fakeSupabase({ free_leads_cache: [{ key: 'old', value: {}, expires_at: new Date(Date.now() - 1000).toISOString() }] })
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0)
    await cachePut('new', { ok: 1 }, 60_000, db as unknown as Admin)
    spy.mockRestore()
    expect(db.tables.free_leads_cache.map((r) => r.key)).toEqual(['new'])
  })

  it('treats a read error as a miss instead of failing the request', async () => {
    const broken = { from: () => ({ select: () => ({ eq: () => ({ gt: () => ({ maybeSingle: async () => ({ data: null, error: { message: 'down' } }) }) }) }) }) }
    expect(await cacheGet('scan:v1:acme.com', broken as unknown as Admin)).toBeNull()
  })
})
