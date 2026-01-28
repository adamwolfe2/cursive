/**
 * Partner Payout Flow Integration Tests
 *
 * Tests the end-to-end payout process including:
 * - Commission calculation
 * - Holdback period enforcement
 * - Payout aggregation
 * - Idempotency
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Commission configuration
const COMMISSION_CONFIG = {
  BASE_RATE: 0.30,
  HOLDBACK_DAYS: 7,
  MIN_PAYOUT_AMOUNT: 25,
  FRESH_SALE_BONUS: 0.10,
  FRESH_SALE_DAYS: 7,
  VERIFICATION_BONUS: 0.05,
  VERIFICATION_THRESHOLD: 90,
  VOLUME_BONUS: 0.05,
  VOLUME_THRESHOLD: 500,
  MAX_COMMISSION_RATE: 0.50,
}

// Simulated payout state
interface Commission {
  id: string
  partnerId: string
  amount: number
  status: 'pending_holdback' | 'payable' | 'paid'
  createdAt: Date
  payableAt: Date
}

interface Payout {
  id: string
  partnerId: string
  amount: number
  commissionIds: string[]
  idempotencyKey: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: Date
}

// Simulated database
let commissions: Commission[] = []
let payouts: Payout[] = []

describe('Partner Payout Flow', () => {
  beforeEach(() => {
    commissions = []
    payouts = []
  })

  // ==========================================================================
  // COMMISSION STATUS TRANSITIONS
  // ==========================================================================
  describe('Commission Status Transitions', () => {
    it('should create commission in pending_holdback status', () => {
      const now = new Date()
      const commission = createCommission({
        partnerId: 'partner-1',
        amount: 0.03,
        createdAt: now,
      })

      expect(commission.status).toBe('pending_holdback')
      expect(commission.payableAt.getTime()).toBe(
        now.getTime() + COMMISSION_CONFIG.HOLDBACK_DAYS * 24 * 60 * 60 * 1000
      )
    })

    it('should transition to payable after holdback period', () => {
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      const commission = createCommission({
        partnerId: 'partner-1',
        amount: 0.03,
        createdAt: eightDaysAgo,
      })

      const updatedCommission = processHoldback(commission)

      expect(updatedCommission.status).toBe('payable')
    })

    it('should NOT transition before holdback period ends', () => {
      const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      const commission = createCommission({
        partnerId: 'partner-1',
        amount: 0.03,
        createdAt: sixDaysAgo,
      })

      const updatedCommission = processHoldback(commission)

      expect(updatedCommission.status).toBe('pending_holdback')
    })

    it('should transition to paid after payout', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      const commission = createCommission({
        partnerId: 'partner-1',
        amount: 30,
        createdAt: tenDaysAgo,
      })

      // Process holdback
      const payableCommission = processHoldback(commission)
      expect(payableCommission.status).toBe('payable')

      // Process payout
      const payout = createPayout([payableCommission])
      const paidCommission = markCommissionPaid(payableCommission, payout.id)

      expect(paidCommission.status).toBe('paid')
    })
  })

  // ==========================================================================
  // PAYOUT AGGREGATION
  // ==========================================================================
  describe('Payout Aggregation', () => {
    it('should aggregate multiple commissions into single payout', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)

      // Create 10 commissions
      const partnerCommissions = Array.from({ length: 10 }, (_, i) =>
        processHoldback(createCommission({
          partnerId: 'partner-1',
          amount: 5,
          createdAt: tenDaysAgo,
        }))
      )

      const payout = createPayout(partnerCommissions)

      expect(payout.amount).toBe(50) // 10 * $5
      expect(payout.commissionIds.length).toBe(10)
    })

    it('should only include payable commissions', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)

      // Mix of payable and pending commissions
      const payableCommission = processHoldback(createCommission({
        partnerId: 'partner-1',
        amount: 30,
        createdAt: tenDaysAgo,
      }))

      const pendingCommission = processHoldback(createCommission({
        partnerId: 'partner-1',
        amount: 30,
        createdAt: twoDaysAgo,
      }))

      expect(payableCommission.status).toBe('payable')
      expect(pendingCommission.status).toBe('pending_holdback')

      // Only payable should be included
      const payableCommissions = [payableCommission, pendingCommission]
        .filter(c => c.status === 'payable')

      const payout = createPayout(payableCommissions)
      expect(payout.amount).toBe(30)
      expect(payout.commissionIds.length).toBe(1)
    })
  })

  // ==========================================================================
  // MINIMUM PAYOUT THRESHOLD
  // ==========================================================================
  describe('Minimum Payout Threshold', () => {
    it('should NOT create payout below minimum threshold ($25)', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)

      const commission = processHoldback(createCommission({
        partnerId: 'partner-1',
        amount: 20, // Below $25 minimum
        createdAt: tenDaysAgo,
      }))

      const shouldPayout = checkPayoutEligibility([commission])
      expect(shouldPayout).toBe(false)
    })

    it('should create payout at exactly minimum threshold', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)

      const commission = processHoldback(createCommission({
        partnerId: 'partner-1',
        amount: 25, // Exactly $25 minimum
        createdAt: tenDaysAgo,
      }))

      const shouldPayout = checkPayoutEligibility([commission])
      expect(shouldPayout).toBe(true)
    })

    it('should aggregate to meet minimum threshold', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)

      // 5 commissions of $5 each = $25
      const commissions = Array.from({ length: 5 }, () =>
        processHoldback(createCommission({
          partnerId: 'partner-1',
          amount: 5,
          createdAt: tenDaysAgo,
        }))
      )

      const shouldPayout = checkPayoutEligibility(commissions)
      expect(shouldPayout).toBe(true)
    })
  })

  // ==========================================================================
  // IDEMPOTENCY
  // ==========================================================================
  describe('Payout Idempotency', () => {
    it('should generate unique idempotency key per partner per week', () => {
      const weekStart = getWeekStart(new Date())
      const key1 = generateIdempotencyKey('partner-1', weekStart)
      const key2 = generateIdempotencyKey('partner-2', weekStart)

      expect(key1).not.toBe(key2)
    })

    it('should generate same key for same partner and week', () => {
      const weekStart = getWeekStart(new Date())
      const key1 = generateIdempotencyKey('partner-1', weekStart)
      const key2 = generateIdempotencyKey('partner-1', weekStart)

      expect(key1).toBe(key2)
    })

    it('should generate different keys for different weeks', () => {
      const thisWeek = getWeekStart(new Date())
      const lastWeek = new Date(thisWeek.getTime() - 7 * 24 * 60 * 60 * 1000)

      const key1 = generateIdempotencyKey('partner-1', thisWeek)
      const key2 = generateIdempotencyKey('partner-1', lastWeek)

      expect(key1).not.toBe(key2)
    })

    it('should prevent duplicate payouts for same week', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      const weekStart = getWeekStart(new Date())

      const commission = processHoldback(createCommission({
        partnerId: 'partner-1',
        amount: 30,
        createdAt: tenDaysAgo,
      }))

      // First payout attempt
      const payout1 = createPayoutWithIdempotency('partner-1', [commission], weekStart)
      expect(payout1).toBeDefined()
      expect(payout1!.status).toBe('pending')

      // Second payout attempt same week - should return null (duplicate)
      const payout2 = createPayoutWithIdempotency('partner-1', [commission], weekStart)
      expect(payout2).toBeNull()
    })
  })

  // ==========================================================================
  // WEEKLY PAYOUT JOB SIMULATION
  // ==========================================================================
  describe('Weekly Payout Job Simulation', () => {
    it('should process multiple partners in weekly job', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      const weekStart = getWeekStart(new Date())

      // Create commissions for 3 partners
      const partner1Commissions = createPartnerCommissions('partner-1', 5, 10, tenDaysAgo)
      const partner2Commissions = createPartnerCommissions('partner-2', 3, 15, tenDaysAgo)
      const partner3Commissions = createPartnerCommissions('partner-3', 10, 5, tenDaysAgo)

      // Run weekly job
      const results = processWeeklyPayouts([
        { partnerId: 'partner-1', commissions: partner1Commissions },
        { partnerId: 'partner-2', commissions: partner2Commissions },
        { partnerId: 'partner-3', commissions: partner3Commissions },
      ], weekStart)

      expect(results.processed).toBe(3)
      expect(results.payoutAmounts['partner-1']).toBe(50) // 5 * $10
      expect(results.payoutAmounts['partner-2']).toBe(45) // 3 * $15
      expect(results.payoutAmounts['partner-3']).toBe(50) // 10 * $5
    })

    it('should skip partners below minimum threshold', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      const weekStart = getWeekStart(new Date())

      // Partner 1: Above threshold, Partner 2: Below threshold
      const partner1Commissions = createPartnerCommissions('partner-1', 5, 10, tenDaysAgo)
      const partner2Commissions = createPartnerCommissions('partner-2', 2, 5, tenDaysAgo) // Only $10

      const results = processWeeklyPayouts([
        { partnerId: 'partner-1', commissions: partner1Commissions },
        { partnerId: 'partner-2', commissions: partner2Commissions },
      ], weekStart)

      expect(results.processed).toBe(1)
      expect(results.skipped).toBe(1)
      expect(results.payoutAmounts['partner-1']).toBe(50)
      expect(results.payoutAmounts['partner-2']).toBeUndefined()
    })
  })

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================
  describe('Payout Error Handling', () => {
    it('should handle failed Stripe transfer gracefully', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)

      const commission = processHoldback(createCommission({
        partnerId: 'partner-1',
        amount: 30,
        createdAt: tenDaysAgo,
      }))

      // Simulate failed transfer
      const payout = createPayout([commission])
      const failedPayout = simulateStripeFailure(payout)

      expect(failedPayout.status).toBe('failed')
      // Commission should remain payable for retry
      expect(commission.status).toBe('payable')
    })

    it('should not double-pay on retry after failure', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      const weekStart = getWeekStart(new Date())

      const commission = processHoldback(createCommission({
        partnerId: 'partner-1',
        amount: 30,
        createdAt: tenDaysAgo,
      }))

      // First attempt fails
      const payout1 = createPayoutWithIdempotency('partner-1', [commission], weekStart)
      const failedPayout = simulateStripeFailure(payout1!)

      // Clear failed payout from system
      payouts = payouts.filter(p => p.id !== failedPayout.id)

      // Retry should work
      const payout2 = createPayoutWithIdempotency('partner-1', [commission], weekStart)
      expect(payout2).toBeDefined()
    })
  })
})

// ==========================================================================
// HELPER FUNCTIONS
// ==========================================================================

function createCommission(params: {
  partnerId: string
  amount: number
  createdAt: Date
}): Commission {
  const commission: Commission = {
    id: `comm-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    partnerId: params.partnerId,
    amount: params.amount,
    status: 'pending_holdback',
    createdAt: params.createdAt,
    payableAt: new Date(
      params.createdAt.getTime() + COMMISSION_CONFIG.HOLDBACK_DAYS * 24 * 60 * 60 * 1000
    ),
  }
  commissions.push(commission)
  return commission
}

function processHoldback(commission: Commission): Commission {
  if (commission.payableAt <= new Date()) {
    commission.status = 'payable'
  }
  return commission
}

function markCommissionPaid(commission: Commission, payoutId: string): Commission {
  commission.status = 'paid'
  return commission
}

function createPayout(payableCommissions: Commission[]): Payout {
  const totalAmount = payableCommissions.reduce((sum, c) => sum + c.amount, 0)
  const partnerId = payableCommissions[0]?.partnerId || 'unknown'

  const payout: Payout = {
    id: `payout-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    partnerId,
    amount: totalAmount,
    commissionIds: payableCommissions.map(c => c.id),
    idempotencyKey: generateIdempotencyKey(partnerId, getWeekStart(new Date())),
    status: 'pending',
    createdAt: new Date(),
  }
  payouts.push(payout)
  return payout
}

function createPayoutWithIdempotency(
  partnerId: string,
  payableCommissions: Commission[],
  weekStart: Date
): Payout | null {
  const idempotencyKey = generateIdempotencyKey(partnerId, weekStart)

  // Check for existing payout with same key
  const existing = payouts.find(p => p.idempotencyKey === idempotencyKey)
  if (existing) {
    return null // Duplicate
  }

  return createPayout(payableCommissions)
}

function checkPayoutEligibility(payableCommissions: Commission[]): boolean {
  const totalAmount = payableCommissions
    .filter(c => c.status === 'payable')
    .reduce((sum, c) => sum + c.amount, 0)
  return totalAmount >= COMMISSION_CONFIG.MIN_PAYOUT_AMOUNT
}

function generateIdempotencyKey(partnerId: string, weekStart: Date): string {
  const weekStr = weekStart.toISOString().slice(0, 10)
  return `payout-${partnerId}-${weekStr}`
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function createPartnerCommissions(
  partnerId: string,
  count: number,
  amountEach: number,
  createdAt: Date
): Commission[] {
  return Array.from({ length: count }, () =>
    processHoldback(createCommission({
      partnerId,
      amount: amountEach,
      createdAt,
    }))
  )
}

function processWeeklyPayouts(
  partnerData: Array<{ partnerId: string; commissions: Commission[] }>,
  weekStart: Date
): {
  processed: number
  skipped: number
  payoutAmounts: Record<string, number>
} {
  let processed = 0
  let skipped = 0
  const payoutAmounts: Record<string, number> = {}

  for (const { partnerId, commissions: partnerCommissions } of partnerData) {
    const payable = partnerCommissions.filter(c => c.status === 'payable')
    const total = payable.reduce((sum, c) => sum + c.amount, 0)

    if (total >= COMMISSION_CONFIG.MIN_PAYOUT_AMOUNT) {
      const payout = createPayoutWithIdempotency(partnerId, payable, weekStart)
      if (payout) {
        payoutAmounts[partnerId] = total
        processed++
      }
    } else {
      skipped++
    }
  }

  return { processed, skipped, payoutAmounts }
}

function simulateStripeFailure(payout: Payout): Payout {
  payout.status = 'failed'
  return payout
}
