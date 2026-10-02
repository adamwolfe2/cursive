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

describe('cachedCount', () => {
  it('treats a filter value the database does not know as zero matches, and rethrows other rejections', async () => {
    const { GetLeadsError } = await import('@/lib/getleads/client')
    const client = await import('@/lib/getleads/client')
    const { cachedCount } = await import('../cache')
    const db = fakeSupabase({ free_leads_cache: [] })
    const admin = db as unknown as Admin
    const spy = vi.spyOn(client, 'countContacts')
    spy.mockRejectedValueOnce(new GetLeadsError('Lead database rejected request: Invalid countries value(s): Atlantis.', 'rejected', 400))
    expect(await cachedCount({ countries: ['Atlantis'] }, admin)).toBe(0)
    expect(db.tables.free_leads_cache).toHaveLength(0)
    spy.mockRejectedValueOnce(new GetLeadsError('Lead database rejected request: HTTP 401', 'rejected', 401))
    await expect(cachedCount({ countries: ['Atlantis'] }, admin)).rejects.toThrow('401')
    spy.mockRestore()
  })

  it('counts without the title exclusion, which times the upstream count out', async () => {
    const client = await import('@/lib/getleads/client')
    const { cachedCount } = await import('../cache')
    const db = fakeSupabase({ free_leads_cache: [] })
    const spy = vi.spyOn(client, 'countContacts').mockResolvedValueOnce(13_037)
    expect(await cachedCount({ job_titles: ['Owner'], exclude_job_titles: ['Intern'] }, db as unknown as Admin)).toBe(13_037)
    expect(spy).toHaveBeenCalledWith({ job_titles: ['Owner'] })
    spy.mockRestore()
  })
})
