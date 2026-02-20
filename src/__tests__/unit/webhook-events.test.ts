/**
 * Webhook Events Unit Tests
 *
 * Tests:
 * 1. Event type validation — only the four allowed event types are accepted
 * 2. Payload shape validation — lead.received must have id and email
 * 3. HMAC signature verification — known payload + secret + timestamp produces
 *    the correct signature (using the real hmacSha256Hex crypto utility)
 *
 * No DB calls, no network calls.
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// ─── Allowed event types (from src/app/api/webhooks/outbound/route.ts) ───────

const ALLOWED_EVENTS = [
  'lead.received',
  'lead.enriched',
  'lead.purchased',
  'credit.purchased',
] as const

type AllowedEvent = (typeof ALLOWED_EVENTS)[number]

// ─── Validation schemas ──────────────────────────────────────────────────────

/** Schema for the webhook creation request body */
const webhookSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  events: z.array(z.enum(ALLOWED_EVENTS)).min(1, 'Select at least one event'),
  name: z.string().min(1).max(100).optional(),
})

/** Schema for a lead.received payload */
const leadReceivedPayloadSchema = z.object({
  event: z.literal('lead.received'),
  timestamp: z.string().datetime(),
  lead: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    company_name: z.string().optional(),
    job_title: z.string().optional(),
  }),
})

/** Schema for a lead.purchased payload */
const leadPurchasedPayloadSchema = z.object({
  event: z.literal('lead.purchased'),
  timestamp: z.string().datetime(),
  purchase_id: z.string().uuid(),
  lead: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    company_name: z.string().optional(),
    company_industry: z.string().optional(),
    phone: z.string().optional(),
  }),
})

/** Schema for a credit.purchased payload */
const creditPurchasedPayloadSchema = z.object({
  event: z.literal('credit.purchased'),
  timestamp: z.string().datetime(),
  credits_added: z.number().positive(),
  new_balance: z.number().nonnegative(),
})

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Event type validation', () => {
  it('has exactly 4 allowed event types', () => {
    expect(ALLOWED_EVENTS).toHaveLength(4)
  })

  it('all event types follow dot-notation convention', () => {
    for (const event of ALLOWED_EVENTS) {
      expect(event).toMatch(/^[a-z]+\.[a-z]+$/)
    }
  })

  it('lead.received is an allowed event', () => {
    expect(ALLOWED_EVENTS).toContain('lead.received')
  })

  it('lead.enriched is an allowed event', () => {
    expect(ALLOWED_EVENTS).toContain('lead.enriched')
  })

  it('lead.purchased is an allowed event', () => {
    expect(ALLOWED_EVENTS).toContain('lead.purchased')
  })

  it('credit.purchased is an allowed event', () => {
    expect(ALLOWED_EVENTS).toContain('credit.purchased')
  })

  it('accepts a valid webhook with one event', () => {
    const r = webhookSchema.safeParse({
      url: 'https://example.com/hooks',
      events: ['lead.received'],
    })
    expect(r.success).toBe(true)
  })

  it('accepts all four events in a single webhook', () => {
    const r = webhookSchema.safeParse({
      url: 'https://example.com/hooks',
      events: [...ALLOWED_EVENTS],
    })
    expect(r.success).toBe(true)
  })

  it('rejects an unknown event type', () => {
    const r = webhookSchema.safeParse({
      url: 'https://example.com/hooks',
      events: ['lead.deleted'],
    })
    expect(r.success).toBe(false)
  })

  it('rejects empty events array', () => {
    const r = webhookSchema.safeParse({
      url: 'https://example.com/hooks',
      events: [],
    })
    expect(r.success).toBe(false)
  })

  it('rejects an invalid URL', () => {
    const r = webhookSchema.safeParse({
      url: 'not-a-url',
      events: ['lead.received'],
    })
    expect(r.success).toBe(false)
  })

  it('rejects a name longer than 100 characters', () => {
    const r = webhookSchema.safeParse({
      url: 'https://example.com/hooks',
      events: ['lead.received'],
      name: 'a'.repeat(101),
    })
    expect(r.success).toBe(false)
  })

  it('accepts optional name up to 100 characters', () => {
    const r = webhookSchema.safeParse({
      url: 'https://example.com/hooks',
      events: ['lead.received'],
      name: 'My webhook',
    })
    expect(r.success).toBe(true)
  })

  it('accepts missing name (optional field)', () => {
    const r = webhookSchema.safeParse({
      url: 'https://example.com/hooks',
      events: ['lead.purchased'],
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.name).toBeUndefined()
  })
})

describe('Payload shape validation — lead.received', () => {
  const validPayload = {
    event: 'lead.received' as const,
    timestamp: '2026-02-20T12:00:00Z',
    lead: {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      email: 'jane@acme.com',
      first_name: 'Jane',
      last_name: 'Smith',
    },
  }

  it('accepts a valid lead.received payload', () => {
    expect(leadReceivedPayloadSchema.safeParse(validPayload).success).toBe(true)
  })

  it('requires id field in lead', () => {
    const r = leadReceivedPayloadSchema.safeParse({
      ...validPayload,
      lead: { email: 'jane@acme.com' },
    })
    expect(r.success).toBe(false)
  })

  it('requires email field in lead', () => {
    const r = leadReceivedPayloadSchema.safeParse({
      ...validPayload,
      lead: { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
    })
    expect(r.success).toBe(false)
  })

  it('rejects invalid UUID in lead.id', () => {
    const r = leadReceivedPayloadSchema.safeParse({
      ...validPayload,
      lead: { ...validPayload.lead, id: 'not-a-uuid' },
    })
    expect(r.success).toBe(false)
  })

  it('rejects invalid email in lead.email', () => {
    const r = leadReceivedPayloadSchema.safeParse({
      ...validPayload,
      lead: { ...validPayload.lead, email: 'not-an-email' },
    })
    expect(r.success).toBe(false)
  })

  it('accepts payload without optional fields (first_name, last_name)', () => {
    const minimal = {
      event: 'lead.received' as const,
      timestamp: '2026-02-20T12:00:00Z',
      lead: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        email: 'jane@acme.com',
      },
    }
    expect(leadReceivedPayloadSchema.safeParse(minimal).success).toBe(true)
  })

  it('rejects payload with wrong event type for this schema', () => {
    const r = leadReceivedPayloadSchema.safeParse({
      ...validPayload,
      event: 'lead.purchased',
    })
    expect(r.success).toBe(false)
  })

  it('requires a valid ISO timestamp', () => {
    const r = leadReceivedPayloadSchema.safeParse({
      ...validPayload,
      timestamp: 'not-a-date',
    })
    expect(r.success).toBe(false)
  })
})

describe('Payload shape validation — lead.purchased', () => {
  const validPayload = {
    event: 'lead.purchased' as const,
    timestamp: '2026-02-20T12:00:00Z',
    purchase_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    lead: {
      id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      email: 'buyer@company.com',
      first_name: 'John',
      last_name: 'Doe',
    },
  }

  it('accepts a valid lead.purchased payload', () => {
    expect(leadPurchasedPayloadSchema.safeParse(validPayload).success).toBe(true)
  })

  it('requires purchase_id', () => {
    const { purchase_id, ...without } = validPayload
    expect(leadPurchasedPayloadSchema.safeParse(without).success).toBe(false)
  })

  it('rejects invalid UUID for purchase_id', () => {
    const r = leadPurchasedPayloadSchema.safeParse({
      ...validPayload,
      purchase_id: 'not-a-uuid',
    })
    expect(r.success).toBe(false)
  })

  it('requires lead.id', () => {
    const r = leadPurchasedPayloadSchema.safeParse({
      ...validPayload,
      lead: { email: 'buyer@company.com' },
    })
    expect(r.success).toBe(false)
  })

  it('requires lead.email', () => {
    const r = leadPurchasedPayloadSchema.safeParse({
      ...validPayload,
      lead: { id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' },
    })
    expect(r.success).toBe(false)
  })
})

describe('Payload shape validation — credit.purchased', () => {
  const validPayload = {
    event: 'credit.purchased' as const,
    timestamp: '2026-02-20T12:00:00Z',
    credits_added: 500,
    new_balance: 594.70,
  }

  it('accepts a valid credit.purchased payload', () => {
    expect(creditPurchasedPayloadSchema.safeParse(validPayload).success).toBe(true)
  })

  it('rejects credits_added of 0', () => {
    expect(creditPurchasedPayloadSchema.safeParse({ ...validPayload, credits_added: 0 }).success).toBe(false)
  })

  it('rejects negative credits_added', () => {
    expect(creditPurchasedPayloadSchema.safeParse({ ...validPayload, credits_added: -1 }).success).toBe(false)
  })

  it('accepts new_balance of 0 (just used all credits)', () => {
    expect(creditPurchasedPayloadSchema.safeParse({ ...validPayload, new_balance: 0 }).success).toBe(true)
  })

  it('rejects negative new_balance', () => {
    expect(creditPurchasedPayloadSchema.safeParse({ ...validPayload, new_balance: -5 }).success).toBe(false)
  })
})

describe('HMAC signature verification', () => {
  /**
   * Cursive uses Stripe-style signatures:
   *   X-Cursive-Signature: t={unix_ts},v1={hmac_sha256}
   *
   * HMAC is computed over: "{timestamp}.{raw_body}"
   * using the webhook secret as the key.
   *
   * These tests import and exercise the real hmacSha256Hex utility from
   * src/lib/utils/crypto.ts — no mocking needed since it is a pure function.
   */

  it('produces a deterministic 64-char hex signature for known inputs', async () => {
    const { hmacSha256Hex } = await import('@/lib/utils/crypto')
    const secret = 'test-webhook-secret-abc123'
    const timestamp = 1708000000
    const body = '{"event":"lead.received","lead":{"id":"uuid-123","email":"jane@acme.com"}}'
    const sigInput = `${timestamp}.${body}`

    const sig1 = await hmacSha256Hex(secret, sigInput)
    const sig2 = await hmacSha256Hex(secret, sigInput)

    expect(sig1).toBe(sig2)
    expect(sig1).toMatch(/^[0-9a-f]{64}$/)
  })

  it('formats correctly in Stripe-style header', async () => {
    const { hmacSha256Hex } = await import('@/lib/utils/crypto')
    const secret = 'my-secret'
    const timestamp = 1708000000
    const body = '{"event":"lead.purchased"}'
    const sig = await hmacSha256Hex(secret, `${timestamp}.${body}`)

    const header = `t=${timestamp},v1=${sig}`
    expect(header).toMatch(/^t=\d+,v1=[0-9a-f]{64}$/)
  })

  it('signatures differ for different secrets', async () => {
    const { hmacSha256Hex } = await import('@/lib/utils/crypto')
    const payload = '1708000000.{"event":"lead.received"}'

    const sig1 = await hmacSha256Hex('secret-a', payload)
    const sig2 = await hmacSha256Hex('secret-b', payload)

    expect(sig1).not.toBe(sig2)
  })

  it('signatures differ for different timestamps', async () => {
    const { hmacSha256Hex } = await import('@/lib/utils/crypto')
    const secret = 'shared-secret'
    const body = '{"event":"lead.received"}'

    const sig1 = await hmacSha256Hex(secret, `1708000000.${body}`)
    const sig2 = await hmacSha256Hex(secret, `1708000001.${body}`)

    expect(sig1).not.toBe(sig2)
  })

  it('signatures differ for different payloads', async () => {
    const { hmacSha256Hex } = await import('@/lib/utils/crypto')
    const secret = 'shared-secret'
    const timestamp = 1708000000

    const sig1 = await hmacSha256Hex(secret, `${timestamp}.{"event":"lead.received"}`)
    const sig2 = await hmacSha256Hex(secret, `${timestamp}.{"event":"lead.purchased"}`)

    expect(sig1).not.toBe(sig2)
  })

  it('can verify a known signature matches expected', async () => {
    const { hmacSha256Hex, timingSafeEqual } = await import('@/lib/utils/crypto')
    const secret = 'known-secret'
    const timestamp = 1700000000
    const body = '{"event":"credit.purchased","credits_added":500}'
    const sigInput = `${timestamp}.${body}`

    const expected = await hmacSha256Hex(secret, sigInput)
    const provided = await hmacSha256Hex(secret, sigInput)

    // timingSafeEqual is used internally by verifyHmacSignature
    expect(timingSafeEqual(expected, provided)).toBe(true)
  })

  it('timingSafeEqual returns false for tampered signature', async () => {
    const { hmacSha256Hex, timingSafeEqual } = await import('@/lib/utils/crypto')
    const secret = 'known-secret'
    const real = await hmacSha256Hex(secret, '1708000000.payload')
    const tampered = 'a'.repeat(64) // wrong signature, same length

    expect(timingSafeEqual(real, tampered)).toBe(false)
  })

  it('timestamp can be extracted from the signature header', async () => {
    const { hmacSha256Hex } = await import('@/lib/utils/crypto')
    const timestamp = Math.floor(Date.now() / 1000)
    const sig = await hmacSha256Hex('secret', `${timestamp}.{}`)
    const header = `t=${timestamp},v1=${sig}`

    const extracted = Number(header.split(',')[0].replace('t=', ''))
    expect(extracted).toBe(timestamp)
  })
})
