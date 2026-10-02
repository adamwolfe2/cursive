import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const runWeekly = vi.hoisted(() => vi.fn())
vi.mock('@/lib/free-leads/weekly', () => ({ runWeekly }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({}) }))

import { GET } from '../route'

const req = (auth?: string) =>
  new NextRequest('http://localhost/api/cron/free-leads-weekly', { headers: auth ? { authorization: auth } : {} })

beforeEach(() => {
  runWeekly.mockReset()
  process.env.CRON_SECRET = 's3cret'
})

describe('GET /api/cron/free-leads-weekly', () => {
  it('rejects a missing secret', async () => {
    expect((await GET(req())).status).toBe(401)
    expect(runWeekly).not.toHaveBeenCalled()
  })

  it('rejects a wrong secret', async () => {
    expect((await GET(req('Bearer nope'))).status).toBe(401)
    expect(runWeekly).not.toHaveBeenCalled()
  })

  it('fails closed when CRON_SECRET is unset', async () => {
    delete process.env.CRON_SECRET
    expect((await GET(req('Bearer undefined'))).status).toBe(401)
    expect(runWeekly).not.toHaveBeenCalled()
  })

  it('runs the service and returns the summary, including an empty run', async () => {
    runWeekly.mockResolvedValue({ week: '2026-W41', orders: 0, delivered: 0, failed: 0, deferred: 0 })
    const res = await GET(req('Bearer s3cret'))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ success: true, orders: 0 })
    expect(runWeekly).toHaveBeenCalledTimes(1)
  })

  it('returns a user-safe 500 when the run throws', async () => {
    runWeekly.mockRejectedValue(new Error('db down: secret detail'))
    const res = await GET(req('Bearer s3cret'))
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain('secret detail')
  })
})
