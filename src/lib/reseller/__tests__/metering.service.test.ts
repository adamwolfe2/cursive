import { describe, it, expect } from 'vitest'
import { decideDelivery, currentPeriodStart } from '../metering.service'
import type { Reseller, ResellerPixel } from '../types'

const baseReseller: Pick<
  Reseller,
  'status' | 'period_kind' | 'lead_cap_per_period' | 'default_throttle_mode' | 'period_start' | 'leads_delivered_period'
> = {
  status: 'active',
  period_kind: 'month',
  lead_cap_per_period: null,
  default_throttle_mode: false,
  period_start: '2026-07-01',
  leads_delivered_period: 0,
}

const basePixel: Pick<
  ResellerPixel,
  'status' | 'lead_cap_per_period' | 'throttle_mode' | 'period_start' | 'leads_delivered_period'
> = {
  status: 'active',
  lead_cap_per_period: null,
  throttle_mode: null,
  period_start: '2026-07-01',
  leads_delivered_period: 0,
}

const now = new Date('2026-07-15T12:00:00Z')

describe('currentPeriodStart', () => {
  it('returns first of month for month kind', () => {
    expect(currentPeriodStart('month', now)).toBe('2026-07-01')
  })
  it('returns today for day kind', () => {
    expect(currentPeriodStart('day', now)).toBe('2026-07-15')
  })
})

describe('decideDelivery', () => {
  it('delivers when under all caps', () => {
    expect(decideDelivery(baseReseller, basePixel, now)).toEqual({ deliver: true, throttled: false })
  })

  it('blocks when reseller is suspended', () => {
    expect(decideDelivery({ ...baseReseller, status: 'suspended' }, basePixel, now)).toMatchObject({
      deliver: false,
      reason: 'reseller_suspended',
    })
  })

  it('blocks when pixel is inactive', () => {
    expect(decideDelivery(baseReseller, { ...basePixel, status: 'inactive' }, now)).toMatchObject({
      deliver: false,
      reason: 'inactive',
    })
  })

  it('blocks at reseller cap', () => {
    expect(
      decideDelivery({ ...baseReseller, lead_cap_per_period: 100, leads_delivered_period: 100 }, basePixel, now),
    ).toMatchObject({ deliver: false, reason: 'reseller_cap' })
  })

  it('blocks at pixel cap', () => {
    expect(
      decideDelivery(baseReseller, { ...basePixel, lead_cap_per_period: 10, leads_delivered_period: 10 }, now),
    ).toMatchObject({ deliver: false, reason: 'pixel_cap' })
  })

  it('ignores a stale-period count (resets to 0)', () => {
    // Stored period is June but now is July → effective count is 0, so delivers.
    const staleReseller = { ...baseReseller, lead_cap_per_period: 100, leads_delivered_period: 100, period_start: '2026-06-01' }
    expect(decideDelivery(staleReseller, basePixel, now)).toMatchObject({ deliver: true })
  })

  it('throttles when pixel throttle_mode=true', () => {
    expect(decideDelivery(baseReseller, { ...basePixel, throttle_mode: true }, now)).toEqual({
      deliver: true,
      throttled: true,
    })
  })

  it('inherits reseller default_throttle_mode when pixel override is null', () => {
    expect(decideDelivery({ ...baseReseller, default_throttle_mode: true }, basePixel, now)).toEqual({
      deliver: true,
      throttled: true,
    })
  })

  it('pixel throttle=false overrides reseller default=true', () => {
    expect(
      decideDelivery({ ...baseReseller, default_throttle_mode: true }, { ...basePixel, throttle_mode: false }, now),
    ).toEqual({ deliver: true, throttled: false })
  })
})
