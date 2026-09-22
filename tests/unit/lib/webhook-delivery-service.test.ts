/**
 * The invariant this file exists to protect:
 * every outbound delivery — live event or "Send test" — must leave Cursive with
 * the same envelope and the same signature scheme, because a customer writes
 * exactly one verifier against them.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHmac, timingSafeEqual } from 'crypto'

const HOOK = {
  id: 'hook-1',
  workspace_id: 'ws-1',
  url: 'https://customer.example.com/hooks/cursive',
  secret: 'shhh-secret',
  events: ['lead.received'],
  is_active: true,
}

let webhookRow: typeof HOOK = { ...HOOK }
const inserted: any[] = []

function chain(result: any, listResult?: any) {
  const c: any = {}
  for (const m of ['select', 'eq', 'update', 'insert']) c[m] = vi.fn(() => c)
  c.maybeSingle = vi.fn(() => Promise.resolve(result))
  c.single = vi.fn(() => Promise.resolve(result))
  // getMatchingWebhookIds awaits the builder itself
  if (listResult) c.then = (res: any, rej: any) => Promise.resolve(listResult).then(res, rej)
  return c
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'workspace_webhooks')
        return chain({ data: webhookRow, error: null }, { data: [webhookRow], error: null })
      const c = chain({ data: { id: 'delivery-1' }, error: null })
      c.insert = vi.fn((row: any) => {
        inserted.push(row)
        return c
      })
      return c
    }),
  })),
}))

vi.mock('@/lib/utils/log-sanitizer', () => ({ safeLog: vi.fn(), safeError: vi.fn() }))

import { deliverWebhook, emitWebhookEvent } from '@/lib/services/webhook-delivery.service'

/** Verify exactly the way the published docs tell a customer to verify. */
function verifyLikeACustomer(headerValue: string, rawBody: string, secret: string) {
  const t = /t=(\d+)/.exec(headerValue)?.[1]
  const v1 = /v1=([a-f0-9]+)/.exec(headerValue)?.[1]
  if (!t || !v1) return false
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false
  const expected = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex')
  return v1.length === expected.length && timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(expected, 'hex'))
}

function captureFetch(status = 200) {
  const fn = vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    text: async () => 'ok',
  }))
  vi.stubGlobal('fetch', fn)
  return fn
}

beforeEach(() => {
  webhookRow = { ...HOOK }
  inserted.length = 0
  vi.unstubAllGlobals()
})

describe('outbound webhook delivery', () => {
  it('sends the canonical envelope with a customer-verifiable signature', async () => {
    const fetchMock = captureFetch()

    const result = await deliverWebhook('hook-1', 'lead.received', { email: 'jane@acme.com' })

    expect(result.success).toBe(true)
    const [url, init] = fetchMock.mock.calls[0] as any
    expect(url).toBe(HOOK.url)

    const body = JSON.parse(init.body)
    expect(Object.keys(body).sort()).toEqual(['data', 'event', 'timestamp', 'workspace_id'])
    expect(body.event).toBe('lead.received')
    expect(body.workspace_id).toBe('ws-1')
    expect(body.data).toEqual({ email: 'jane@acme.com' })

    expect(init.headers['X-Cursive-Event']).toBe('lead.received')
    expect(verifyLikeACustomer(init.headers['X-Cursive-Signature'], init.body, HOOK.secret)).toBe(true)
  })

  it('signs a test send identically, so one verifier covers both', async () => {
    const fetchMock = captureFetch()

    await deliverWebhook('hook-1', 'lead.received', { email: 'jane@acme.com' }, { maxAttempts: 1, test: true })

    const [, init] = fetchMock.mock.calls[0] as any
    const body = JSON.parse(init.body)
    expect(body.test).toBe(true)
    expect(body.event).toBe('lead.received')
    expect(verifyLikeACustomer(init.headers['X-Cursive-Signature'], init.body, HOOK.secret)).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('refuses to deliver to an internal address and records why', async () => {
    const fetchMock = captureFetch()
    webhookRow = { ...HOOK, url: 'http://169.254.169.254/latest/meta-data/' }

    const result = await deliverWebhook('hook-1', 'lead.received', { email: 'jane@acme.com' })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/blocked internal address/i)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(inserted.at(-1)).toMatchObject({ status: 'failed', error_message: expect.stringMatching(/blocked/i) })
  })

  it('fans out only to endpoints subscribed to the event', async () => {
    const fetchMock = captureFetch()

    const matched = await emitWebhookEvent('ws-1', 'lead.received', { email: 'jane@acme.com' })
    expect(matched).toEqual({ delivered: 1, failed: 0 })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    fetchMock.mockClear()
    const unmatched = await emitWebhookEvent('ws-1', 'lead.purchased', { email: 'jane@acme.com' })
    expect(unmatched).toEqual({ delivered: 0, failed: 0 })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('never lets a webhook failure escape into the caller', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('customer endpoint exploded') }))

    await expect(emitWebhookEvent('ws-1', 'lead.received', { email: 'jane@acme.com' }))
      .resolves.toEqual({ delivered: 0, failed: 1 })
  })
})
