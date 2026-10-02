import { describe, expect, it } from 'vitest'
import { insertLeadsSkippingDuplicates } from '../claims'
import { fakeSupabase } from './fake-supabase'

type Row = Record<string, unknown>
const uniqueHash = (_t: string, rows: Row[]) => new Set(rows.map((r) => r.hash_key)).size === rows.length

describe('insertLeadsSkippingDuplicates', () => {
  it('stores every row when none collide', async () => {
    const admin = fakeSupabase({ leads: [] }, uniqueHash)
    const res = await insertLeadsSkippingDuplicates(admin as never, [{ hash_key: 'a' }, { hash_key: 'b' }])
    expect(res).toEqual({ stored: 2, skipped: 0 })
  })

  it('skips a person stored meanwhile instead of failing the paid batch', async () => {
    const admin = fakeSupabase({ leads: [{ hash_key: 'b' }] }, uniqueHash)
    const res = await insertLeadsSkippingDuplicates(admin as never, [{ hash_key: 'a' }, { hash_key: 'b' }, { hash_key: 'c' }])
    expect(res).toEqual({ stored: 2, skipped: 1 })
  })

  it('fails when nothing could be stored', async () => {
    const admin = fakeSupabase({ leads: [{ hash_key: 'a' }] }, uniqueHash)
    await expect(insertLeadsSkippingDuplicates(admin as never, [{ hash_key: 'a' }])).rejects.toThrow(/no leads stored/)
  })

  it('stores nothing and succeeds for an empty batch', async () => {
    const admin = fakeSupabase({ leads: [] }, uniqueHash)
    expect(await insertLeadsSkippingDuplicates(admin as never, [])).toEqual({ stored: 0, skipped: 0 })
  })
})
