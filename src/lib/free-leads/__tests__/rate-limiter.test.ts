import { describe, expect, it, vi } from 'vitest'
import { fakeSupabase } from './fake-supabase'

const db = vi.hoisted(() => ({ current: null as unknown }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => db.current }))

import { checkRouteRateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limiter'

describe('checkRouteRateLimit (insert, then count)', () => {
  it('allows exactly maxRequests sequentially, then denies without consuming the window', async () => {
    const fake = fakeSupabase({ rate_limit_logs: [] })
    db.current = fake
    const max = RATE_LIMITS['free-leads-claim'].maxRequests
    const results = []
    for (let i = 0; i < max + 3; i++) results.push((await checkRouteRateLimit('ip:1.2.3.4', 'free-leads-claim')).allowed)
    expect(results.filter(Boolean)).toHaveLength(max)
    expect(results.slice(max).every((a) => !a)).toBe(true)
    expect(fake.tables.rate_limit_logs).toHaveLength(max)
  })

  it('a concurrent burst never exceeds the cap (per-IP and global)', async () => {
    for (let run = 0; run < 20; run++) {
      const fake = fakeSupabase({ rate_limit_logs: [] })
      db.current = fake
      const max = RATE_LIMITS['free-leads-preview'].maxRequests
      const burst = await Promise.all(Array.from({ length: 40 }, () => checkRouteRateLimit('ip:9.9.9.9', 'free-leads-preview')))
      const allowed = burst.filter((r) => r.allowed).length
      // Strict by design: at the boundary a simultaneous burst may over-deny, never over-allow.
      expect(allowed).toBeLessThanOrEqual(max)
      expect(fake.tables.rate_limit_logs.length).toBe(allowed)
    }
  })

  it('a burst against a partly used window still stops at the cap', async () => {
    const fake = fakeSupabase({ rate_limit_logs: [] })
    db.current = fake
    const max = RATE_LIMITS['free-leads-preview'].maxRequests
    for (let i = 0; i < max - 1; i++) await checkRouteRateLimit('ip:7.7.7.7', 'free-leads-preview')
    const burst = await Promise.all(Array.from({ length: 10 }, () => checkRouteRateLimit('ip:7.7.7.7', 'free-leads-preview')))
    expect(burst.filter((r) => r.allowed).length).toBeLessThanOrEqual(1)
    expect(fake.tables.rate_limit_logs.length).toBeLessThanOrEqual(max)
  })

  it('keys are independent', async () => {
    db.current = fakeSupabase({ rate_limit_logs: [] })
    const max = RATE_LIMITS['free-leads-preview'].maxRequests
    for (let i = 0; i < max; i++) await checkRouteRateLimit('ip:a', 'free-leads-preview')
    expect((await checkRouteRateLimit('ip:a', 'free-leads-preview')).allowed).toBe(false)
    expect((await checkRouteRateLimit('ip:b', 'free-leads-preview')).allowed).toBe(true)
  })

  it('fails closed when the database errors', async () => {
    db.current = { from: () => ({ insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'down' } }) }) }) }) }
    expect((await checkRouteRateLimit('ip:x', 'free-leads-scan')).allowed).toBe(false)
  })
})
