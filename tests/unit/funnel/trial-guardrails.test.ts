/**
 * Trial guardrails — the money-path invariants.
 *
 * These four rules are what stop a $0 trial from behaving like a paid order.
 * Each one maps to a real failure found in the 2026-08-26 audit.
 */

import { describe, it, expect } from 'vitest'
import { hasPaid, isOrderEntitled, type FunnelOrder } from '@/lib/funnel/order.service'

function makeOrder(overrides: Partial<FunnelOrder> = {}): FunnelOrder {
  return {
    id: 'ord_test',
    customer_email: 'buyer@example.com',
    offer_slug: 'bundle_247',
    monthly_price_cents: 24700,
    status: 'awaiting_pixel',
    subscription_state: 'active',
    trial_ends_at: '2026-09-09T00:00:00.000Z',
    first_paid_at: null,
    ...overrides,
  } as FunnelOrder
}

describe('hasPaid', () => {
  it('is false for a trialing order (looks active, has paid nothing)', () => {
    // The exact shape that let a $0 trial trigger a paid audience build.
    expect(hasPaid(makeOrder())).toBe(false)
  })

  it('is true only once a real invoice has landed', () => {
    expect(hasPaid(makeOrder({ first_paid_at: '2026-09-09T00:01:00.000Z' }))).toBe(true)
  })

  it('does not treat subscription_state as evidence of payment', () => {
    // 'trialing' maps to 'active' internally, so state must never be the proxy.
    expect(hasPaid(makeOrder({ subscription_state: 'active' }))).toBe(false)
  })
})

describe('isOrderEntitled', () => {
  it('allows a trialing buyer (they signed up for access)', () => {
    expect(isOrderEntitled(makeOrder())).toBe(true)
  })

  it('allows past_due — Stripe is still retrying, do not cut them off early', () => {
    expect(isOrderEntitled(makeOrder({ subscription_state: 'past_due' }))).toBe(true)
  })

  it('denies a cancelled order', () => {
    expect(isOrderEntitled(makeOrder({ subscription_state: 'cancelled' }))).toBe(false)
  })
})
