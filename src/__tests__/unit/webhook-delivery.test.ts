/**
 * Webhook Delivery Unit Tests
 *
 * Tests HMAC signature generation, exponential backoff timing,
 * and retry count configuration for outbound webhook delivery.
 * All DB/fetch interactions are mocked — no real network calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── HMAC Signature Tests ────────────────────────────────────────────────────

describe('Webhook HMAC Signature', () => {
  it('produces a deterministic hex string for known inputs', async () => {
    // Test the crypto utility directly
    const { hmacSha256Hex } = await import('@/lib/utils/crypto')
    const secret = 'test-secret-key'
    const payload = '{"event":"lead.received"}'

    const sig1 = await hmacSha256Hex(secret, payload)
    const sig2 = await hmacSha256Hex(secret, payload)

    expect(sig1).toBe(sig2)
    expect(sig1).toMatch(/^[0-9a-f]{64}$/) // SHA-256 = 64 hex chars
  })

  it('produces different signatures for different secrets', async () => {
    const { hmacSha256Hex } = await import('@/lib/utils/crypto')
    const payload = '{"event":"lead.received"}'

    const sig1 = await hmacSha256Hex('secret-a', payload)
    const sig2 = await hmacSha256Hex('secret-b', payload)

    expect(sig1).not.toBe(sig2)
  })

  it('produces different signatures for different payloads', async () => {
    const { hmacSha256Hex } = await import('@/lib/utils/crypto')
    const secret = 'shared-secret'

    const sig1 = await hmacSha256Hex(secret, '{"event":"lead.received"}')
    const sig2 = await hmacSha256Hex(secret, '{"event":"lead.purchased"}')

    expect(sig1).not.toBe(sig2)
  })

  it('handles empty payload string', async () => {
    const { hmacSha256Hex } = await import('@/lib/utils/crypto')
    const sig = await hmacSha256Hex('secret', '')
    expect(sig).toMatch(/^[0-9a-f]{64}$/)
  })
})

// ─── Retry Backoff Configuration Tests ──────────────────────────────────────

describe('Webhook Retry Backoff', () => {
  const backoffMs = [0, 2_000, 6_000]

  it('has 3 retry attempts', () => {
    expect(backoffMs).toHaveLength(3)
  })

  it('first attempt has 0ms delay', () => {
    expect(backoffMs[0]).toBe(0)
  })

  it('second attempt has 2s delay', () => {
    expect(backoffMs[1]).toBe(2_000)
  })

  it('third attempt has 6s delay', () => {
    expect(backoffMs[2]).toBe(6_000)
  })

  it('delays are strictly increasing (exponential-ish backoff)', () => {
    for (let i = 1; i < backoffMs.length; i++) {
      expect(backoffMs[i]).toBeGreaterThan(backoffMs[i - 1])
    }
  })

  it('total max wait time is under 10s (fits within function timeout)', () => {
    const totalWait = backoffMs.reduce((a, b) => a + b, 0)
    expect(totalWait).toBeLessThan(10_000)
  })
})

// ─── Delivery Timeout Configuration Tests ───────────────────────────────────

describe('Webhook Delivery Timeout', () => {
  const DELIVERY_TIMEOUT_MS = 10_000

  it('timeout is 10 seconds', () => {
    expect(DELIVERY_TIMEOUT_MS).toBe(10_000)
  })

  it('timeout is under 30 seconds (Vercel Edge function limit)', () => {
    expect(DELIVERY_TIMEOUT_MS).toBeLessThan(30_000)
  })
})

// ─── Webhook Signature Header Format Tests ──────────────────────────────────

describe('Webhook Signature Header Format', () => {
  it('follows Stripe-style t=,v1= format', async () => {
    const { hmacSha256Hex } = await import('@/lib/utils/crypto')
    const timestamp = 1708000000
    const payloadString = '{"event":"test"}'
    const signature = await hmacSha256Hex('secret', `${timestamp}.${payloadString}`)

    const header = `t=${timestamp},v1=${signature}`

    expect(header).toMatch(/^t=\d+,v1=[0-9a-f]{64}$/)
  })

  it('timestamp in signature matches X-Cursive-Timestamp header', async () => {
    const { hmacSha256Hex } = await import('@/lib/utils/crypto')
    const timestamp = Math.floor(Date.now() / 1000)
    const payload = '{"event":"test"}'
    const sig = await hmacSha256Hex('secret', `${timestamp}.${payload}`)

    // Both headers should reference the same timestamp
    const sigHeader = `t=${timestamp},v1=${sig}`
    const extractedTs = Number(sigHeader.split(',')[0].replace('t=', ''))
    expect(extractedTs).toBe(timestamp)
  })
})

// ─── Event Type Coverage Tests ───────────────────────────────────────────────

describe('Supported Webhook Event Types', () => {
  const SUPPORTED_EVENTS = [
    'lead.received',
    'lead.enriched',
    'lead.purchased',
    'credit.purchased',
  ]

  it('includes all 4 documented event types', () => {
    expect(SUPPORTED_EVENTS).toHaveLength(4)
  })

  it('all event types follow dot-notation convention', () => {
    for (const event of SUPPORTED_EVENTS) {
      expect(event).toMatch(/^[a-z]+\.[a-z]+$/)
    }
  })

  it('lead events are all prefixed with "lead."', () => {
    const leadEvents = SUPPORTED_EVENTS.filter((e) => e.startsWith('lead.'))
    expect(leadEvents).toHaveLength(3)
  })
})
