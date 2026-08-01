/**
 * Clawback proration — the money math behind partial refunds.
 *
 * charge.refunded fires on PARTIAL refunds too. Before this was prorated, a
 * $50 goodwill refund against a $5,000 invoice reversed the partner's entire
 * $2,000 commission.
 */

import { describe, it, expect } from 'vitest'
import { prorateClawback } from '@/lib/affiliate/commission'

// $5,000 invoice, 40% commission — all values in cents, as Stripe uses.
const CHARGE = 500_000
const COMMISSION = 200_000

describe('prorateClawback', () => {
  it('claws the full commission on a full refund', () => {
    expect(
      prorateClawback({
        commissionAmount: COMMISSION,
        amountRefunded: CHARGE,
        chargeAmount: CHARGE,
        alreadyClawed: 0,
      })
    ).toBe(COMMISSION)
  })

  it('claws a proportional slice on a small partial refund', () => {
    // $50 of $5,000 = 1% -> 1% of $2,000 = $20
    expect(
      prorateClawback({
        commissionAmount: COMMISSION,
        amountRefunded: 5_000,
        chargeAmount: CHARGE,
        alreadyClawed: 0,
      })
    ).toBe(2_000)
  })

  it('claws half the commission on a half refund', () => {
    expect(
      prorateClawback({
        commissionAmount: COMMISSION,
        amountRefunded: CHARGE / 2,
        chargeAmount: CHARGE,
        alreadyClawed: 0,
      })
    ).toBe(COMMISSION / 2)
  })

  it('nets off prior clawbacks so a sequence never over-claws', () => {
    // 10% refunded, $5,000 (2.5%) already clawed -> owed 10% - 2.5% = 7.5%
    expect(
      prorateClawback({
        commissionAmount: COMMISSION,
        amountRefunded: 50_000,
        chargeAmount: CHARGE,
        alreadyClawed: 5_000,
      })
    ).toBe(15_000)
  })

  it('a partial then a full refund sums to exactly the commission', () => {
    const first = prorateClawback({
      commissionAmount: COMMISSION,
      amountRefunded: 100_000, // 20%
      chargeAmount: CHARGE,
      alreadyClawed: 0,
    })
    const second = prorateClawback({
      commissionAmount: COMMISSION,
      amountRefunded: CHARGE, // now fully refunded
      chargeAmount: CHARGE,
      alreadyClawed: first,
    })
    expect(first + second).toBe(COMMISSION)
  })

  it('three staged partials sum to exactly the commission', () => {
    let clawed = 0
    for (const cumulative of [100_000, 300_000, CHARGE]) {
      clawed += prorateClawback({
        commissionAmount: COMMISSION,
        amountRefunded: cumulative,
        chargeAmount: CHARGE,
        alreadyClawed: clawed,
      })
    }
    expect(clawed).toBe(COMMISSION)
  })

  it('returns 0 when a replayed webhook reports the same refund state', () => {
    const first = prorateClawback({
      commissionAmount: COMMISSION,
      amountRefunded: 50_000,
      chargeAmount: CHARGE,
      alreadyClawed: 0,
    })
    expect(
      prorateClawback({
        commissionAmount: COMMISSION,
        amountRefunded: 50_000,
        chargeAmount: CHARGE,
        alreadyClawed: first,
      })
    ).toBe(0)
  })

  it('never returns negative when already over-clawed', () => {
    expect(
      prorateClawback({
        commissionAmount: COMMISSION,
        amountRefunded: 10_000,
        chargeAmount: CHARGE,
        alreadyClawed: COMMISSION,
      })
    ).toBe(0)
  })

  it('caps at the full commission if refunded somehow exceeds the charge', () => {
    expect(
      prorateClawback({
        commissionAmount: COMMISSION,
        amountRefunded: CHARGE * 2,
        chargeAmount: CHARGE,
        alreadyClawed: 0,
      })
    ).toBe(COMMISSION)
  })

  it('returns 0 for a zero-amount charge rather than dividing by zero', () => {
    expect(
      prorateClawback({
        commissionAmount: COMMISSION,
        amountRefunded: 100,
        chargeAmount: 0,
        alreadyClawed: 0,
      })
    ).toBe(0)
  })

  it('returns whole cents — Stripe rejects fractional amounts', () => {
    const result = prorateClawback({
      commissionAmount: 33_333,
      amountRefunded: 33_333,
      chargeAmount: 99_999,
      alreadyClawed: 0,
    })
    expect(Number.isInteger(result)).toBe(true)
  })
})
