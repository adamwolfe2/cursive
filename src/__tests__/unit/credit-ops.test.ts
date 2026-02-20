/**
 * Credit Operations Unit Tests
 *
 * Tests credit package definitions and the validateCreditPurchase() helper
 * from src/lib/constants/credit-packages.ts.
 *
 * No DB calls are made — this module is pure constants + validation logic.
 */

import { describe, it, expect } from 'vitest'
import {
  CREDIT_PACKAGES,
  FREE_TRIAL_CREDITS,
  validateCreditPurchase,
  type CreditPackage,
} from '@/lib/constants/credit-packages'

// ---------------------------------------------------------------------------
// Package definitions
// ---------------------------------------------------------------------------

describe('CREDIT_PACKAGES definitions', () => {
  it('defines exactly 4 purchasable packages', () => {
    expect(CREDIT_PACKAGES).toHaveLength(4)
  })

  it('package IDs are starter, growth, scale, enterprise', () => {
    const ids = CREDIT_PACKAGES.map((p) => p.id)
    expect(ids).toContain('starter')
    expect(ids).toContain('growth')
    expect(ids).toContain('scale')
    expect(ids).toContain('enterprise')
  })

  it('starter package has 100 credits at $99', () => {
    const starter = CREDIT_PACKAGES.find((p) => p.id === 'starter')!
    expect(starter.credits).toBe(100)
    expect(starter.price).toBe(99)
  })

  it('growth package has 500 credits at $399', () => {
    const growth = CREDIT_PACKAGES.find((p) => p.id === 'growth')!
    expect(growth.credits).toBe(500)
    expect(growth.price).toBe(399)
  })

  it('scale package has 1000 credits at $699', () => {
    const scale = CREDIT_PACKAGES.find((p) => p.id === 'scale')!
    expect(scale.credits).toBe(1000)
    expect(scale.price).toBe(699)
  })

  it('enterprise package has 5000 credits at $2999', () => {
    const enterprise = CREDIT_PACKAGES.find((p) => p.id === 'enterprise')!
    expect(enterprise.credits).toBe(5000)
    expect(enterprise.price).toBe(2999)
  })

  it('every package has a positive credits count', () => {
    for (const pkg of CREDIT_PACKAGES) {
      expect(pkg.credits).toBeGreaterThan(0)
    }
  })

  it('every package has a positive price', () => {
    for (const pkg of CREDIT_PACKAGES) {
      expect(pkg.price).toBeGreaterThan(0)
    }
  })

  it('every package has a pricePerCredit matching price / credits', () => {
    for (const pkg of CREDIT_PACKAGES) {
      const expected = parseFloat((pkg.price / pkg.credits).toFixed(2))
      expect(pkg.pricePerCredit).toBeCloseTo(expected, 2)
    }
  })

  it('packages with more credits have a lower or equal pricePerCredit (volume discount)', () => {
    const sorted = [...CREDIT_PACKAGES].sort((a, b) => a.credits - b.credits)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].pricePerCredit).toBeLessThanOrEqual(sorted[i - 1].pricePerCredit)
    }
  })

  it('growth package is marked popular', () => {
    const growth = CREDIT_PACKAGES.find((p) => p.id === 'growth')!
    expect(growth.popular).toBe(true)
  })

  it('savings percentage increases with package size', () => {
    const sorted = [...CREDIT_PACKAGES].sort((a, b) => a.credits - b.credits)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].savings).toBeGreaterThanOrEqual(sorted[i - 1].savings)
    }
  })
})

// ---------------------------------------------------------------------------
// FREE_TRIAL_CREDITS
// ---------------------------------------------------------------------------

describe('FREE_TRIAL_CREDITS', () => {
  it('has 100 credits', () => {
    expect(FREE_TRIAL_CREDITS.credits).toBe(100)
  })

  it('has a price of 0', () => {
    expect(FREE_TRIAL_CREDITS.price).toBe(0)
  })

  it('has a pricePerCredit of 0', () => {
    expect(FREE_TRIAL_CREDITS.pricePerCredit).toBe(0)
  })

  it('has id "free_trial"', () => {
    expect(FREE_TRIAL_CREDITS.id).toBe('free_trial')
  })

  it('has 100% savings', () => {
    expect(FREE_TRIAL_CREDITS.savings).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// validateCreditPurchase
// ---------------------------------------------------------------------------

describe('validateCreditPurchase', () => {
  it('returns the package when all fields match starter exactly', () => {
    const result = validateCreditPurchase({
      packageId: 'starter',
      credits: 100,
      amount: 99,
    })
    expect(result).not.toBeNull()
    expect(result!.id).toBe('starter')
  })

  it('returns the package when all fields match growth exactly', () => {
    const result = validateCreditPurchase({
      packageId: 'growth',
      credits: 500,
      amount: 399,
    })
    expect(result).not.toBeNull()
    expect(result!.id).toBe('growth')
  })

  it('returns the package when all fields match scale exactly', () => {
    const result = validateCreditPurchase({
      packageId: 'scale',
      credits: 1000,
      amount: 699,
    })
    expect(result).not.toBeNull()
    expect(result!.id).toBe('scale')
  })

  it('returns the package when all fields match enterprise exactly', () => {
    const result = validateCreditPurchase({
      packageId: 'enterprise',
      credits: 5000,
      amount: 2999,
    })
    expect(result).not.toBeNull()
    expect(result!.id).toBe('enterprise')
  })

  it('returns null for an unknown packageId', () => {
    const result = validateCreditPurchase({
      packageId: 'pro',
      credits: 100,
      amount: 99,
    })
    expect(result).toBeNull()
  })

  it('returns null when credits do not match the package', () => {
    const result = validateCreditPurchase({
      packageId: 'starter',
      credits: 200, // tampered: starter is 100
      amount: 99,
    })
    expect(result).toBeNull()
  })

  it('returns null when amount does not match the package', () => {
    const result = validateCreditPurchase({
      packageId: 'starter',
      credits: 100,
      amount: 1, // tampered: starter is $99
    })
    expect(result).toBeNull()
  })

  it('returns null when both credits and amount are tampered', () => {
    const result = validateCreditPurchase({
      packageId: 'growth',
      credits: 1000,  // should be 500
      amount: 99,     // should be 399
    })
    expect(result).toBeNull()
  })

  it('returns null for empty packageId', () => {
    const result = validateCreditPurchase({
      packageId: '',
      credits: 100,
      amount: 99,
    })
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Credit balance invariants (pure logic, no DB)
// ---------------------------------------------------------------------------

describe('Credit balance invariants', () => {
  /**
   * These tests document expected business rules around credit balances.
   * The actual enforcement happens in DB functions / repositories, but
   * we can verify the math and boundary logic here with plain functions.
   */

  function applyDebit(balance: number, amount: number): number {
    if (amount <= 0) throw new Error('Debit amount must be positive')
    return Math.max(0, balance - amount)
  }

  function applyCredit(balance: number, amount: number): number {
    if (amount <= 0) throw new Error('Credit amount must be positive')
    return balance + amount
  }

  it('balance cannot go below 0 after a debit', () => {
    expect(applyDebit(5, 10)).toBe(0)
  })

  it('balance decreases by the exact debit amount when sufficient', () => {
    expect(applyDebit(100, 30)).toBe(70)
  })

  it('balance increases by the credit amount', () => {
    expect(applyCredit(50, 100)).toBe(150)
  })

  it('crediting a zero balance results in the credit amount', () => {
    expect(applyCredit(0, 500)).toBe(500)
  })

  it('debiting exact balance results in 0', () => {
    expect(applyDebit(100, 100)).toBe(0)
  })

  it('throws when debit amount is 0', () => {
    expect(() => applyDebit(100, 0)).toThrow()
  })

  it('throws when debit amount is negative', () => {
    expect(() => applyDebit(100, -5)).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Auto-recharge threshold logic
// ---------------------------------------------------------------------------

describe('Auto-recharge threshold logic', () => {
  /**
   * Documents the threshold check performed in credit-auto-recharge.ts:
   *   if (balance >= threshold) → skip, no recharge needed
   *   if (balance < threshold)  → recharge
   */

  function shouldRecharge(balance: number, threshold: number): boolean {
    return balance < threshold
  }

  it('triggers recharge when balance is 0 and threshold is 10', () => {
    expect(shouldRecharge(0, 10)).toBe(true)
  })

  it('triggers recharge when balance is below threshold', () => {
    expect(shouldRecharge(5, 10)).toBe(true)
  })

  it('does NOT trigger recharge when balance equals threshold', () => {
    expect(shouldRecharge(10, 10)).toBe(false)
  })

  it('does NOT trigger recharge when balance exceeds threshold', () => {
    expect(shouldRecharge(50, 10)).toBe(false)
  })

  it('triggers recharge at balance 9 with threshold 10', () => {
    expect(shouldRecharge(9, 10)).toBe(true)
  })

  it('does not trigger recharge at balance 11 with threshold 10', () => {
    expect(shouldRecharge(11, 10)).toBe(false)
  })
})
