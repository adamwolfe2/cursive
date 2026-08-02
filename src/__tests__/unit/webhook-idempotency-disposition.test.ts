import { describe, it, expect } from 'vitest'
import {
  classifyWebhookEvent,
  STALE_IN_FLIGHT_MS,
  type WebhookEventRow,
} from '@/lib/stripe/webhook-idempotency'

const NOW = Date.parse('2026-08-01T12:00:00.000Z')
const ago = (ms: number) => new Date(NOW - ms).toISOString()

const row = (over: Partial<WebhookEventRow> = {}): WebhookEventRow => ({
  created_at: ago(1000),
  processed_at: null,
  error_message: null,
  ...over,
})

describe('classifyWebhookEvent', () => {
  it('processes an event that has never been seen', () => {
    expect(classifyWebhookEvent(null, NOW)).toBe('process')
    expect(classifyWebhookEvent(undefined, NOW)).toBe('process')
  })

  it('skips an event that finished cleanly', () => {
    expect(
      classifyWebhookEvent(row({ processed_at: ago(5000), error_message: null }), NOW)
    ).toBe('skip')
  })

  it('reprocesses an event that finished with an error', () => {
    expect(
      classifyWebhookEvent(
        row({ processed_at: ago(5000), error_message: 'balance credit failed' }),
        NOW
      )
    ).toBe('process')
  })

  // The poison pill. A row with no error and no completion used to read as
  // "already processed", so every Stripe redelivery returned 200 duplicate and
  // the payment was never fulfilled.
  it('does not treat an unfinished row as processed', () => {
    expect(classifyWebhookEvent(row(), NOW)).not.toBe('skip')
  })

  it('defers to the live instance while a fresh attempt is in flight', () => {
    expect(classifyWebhookEvent(row({ created_at: ago(30_000) }), NOW)).toBe('in-flight')
  })

  it('takes over an attempt abandoned past the stale window', () => {
    expect(
      classifyWebhookEvent(row({ created_at: ago(STALE_IN_FLIGHT_MS + 1) }), NOW)
    ).toBe('process')
  })

  it('holds the boundary exactly at the stale window', () => {
    expect(classifyWebhookEvent(row({ created_at: ago(STALE_IN_FLIGHT_MS) }), NOW)).toBe(
      'in-flight'
    )
  })

  it('processes rather than stalls when created_at is unparseable', () => {
    expect(classifyWebhookEvent(row({ created_at: 'not a date' }), NOW)).toBe('process')
  })

  it('ignores a stale window on a row that already finished', () => {
    expect(
      classifyWebhookEvent(
        row({ created_at: ago(STALE_IN_FLIGHT_MS * 4), processed_at: ago(1000) }),
        NOW
      )
    ).toBe('skip')
  })
})
