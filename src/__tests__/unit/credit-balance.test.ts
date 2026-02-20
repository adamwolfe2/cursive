/**
 * Credit Balance — Running Balance Calculation Tests
 *
 * Documents and validates the running balance algorithm used in
 * GET /api/marketplace/credits/history.
 *
 * Algorithm (newest-first traversal):
 *   Start with the actual current balance from workspace_credits.
 *   For each transaction (sorted newest-to-oldest), record the current
 *   running balance as the "balance after" value, then adjust:
 *     runningBalance = runningBalance - credits_in + credits_out
 *
 * This walks backwards through history so each row shows the balance
 * at the moment that transaction was the most recent one.
 */

import { describe, it, expect } from 'vitest'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Transaction {
  id: string
  date: string
  credits_in: number
  credits_out: number
}

interface TransactionWithBalance extends Transaction {
  balance: number
}

// ─── Algorithm (verbatim from credits/history/route.ts) ──────────────────────

function computeRunningBalances(
  transactions: Transaction[],
  currentBalance: number
): TransactionWithBalance[] {
  // Sort newest first
  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  let runningBalance = currentBalance
  return sorted.map((t) => {
    const entry = { ...t, balance: runningBalance }
    runningBalance = runningBalance - t.credits_in + t.credits_out
    return entry
  })
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Running Balance Calculation', () => {
  /**
   * Scenario from the task spec:
   *   Input entries (chronological):
   *     2026-01-01  +100 (credit)
   *     2026-01-02  -10  (debit)
   *     2026-01-03  -5   (debit)
   *     2026-01-04  +50  (credit)
   *
   *   Current balance = 100 - 10 - 5 + 50 = 135
   *
   *   Expected running balances (newest-first display):
   *     2026-01-04  +50   balance = 135   (after adding 50, we're at 135)
   *     2026-01-03  -5    balance =  85   (before that debit, we were at 85)
   *     2026-01-02  -10   balance =  90   (before that debit, we were at 90)
   *     2026-01-01  +100  balance = 100   (before that credit, we were at 100)
   */
  it('computes running balances matching spec example', () => {
    const transactions: Transaction[] = [
      { id: '1', date: '2026-01-01', credits_in: 100, credits_out: 0 },
      { id: '2', date: '2026-01-02', credits_in: 0, credits_out: 10 },
      { id: '3', date: '2026-01-03', credits_in: 0, credits_out: 5 },
      { id: '4', date: '2026-01-04', credits_in: 50, credits_out: 0 },
    ]

    const currentBalance = 135 // 100 - 10 - 5 + 50
    const result = computeRunningBalances(transactions, currentBalance)

    // Should be sorted newest-first
    expect(result[0].date).toBe('2026-01-04')
    expect(result[1].date).toBe('2026-01-03')
    expect(result[2].date).toBe('2026-01-02')
    expect(result[3].date).toBe('2026-01-01')

    // Balances match spec
    expect(result[0].balance).toBe(135) // 2026-01-04: after +50
    expect(result[1].balance).toBe(85)  // 2026-01-03: after -5  (135 - 50 = 85)
    expect(result[2].balance).toBe(90)  // 2026-01-02: after -10 (85 + 5 = 90)
    expect(result[3].balance).toBe(100) // 2026-01-01: after +100 (90 + 10 = 100)
  })

  it('returns empty array for empty transaction list', () => {
    const result = computeRunningBalances([], 50)
    expect(result).toHaveLength(0)
  })

  it('single credit transaction shows current balance on that row', () => {
    const result = computeRunningBalances(
      [{ id: '1', date: '2026-01-01', credits_in: 100, credits_out: 0 }],
      100
    )
    expect(result).toHaveLength(1)
    expect(result[0].balance).toBe(100)
  })

  it('single debit transaction shows current balance on that row', () => {
    const result = computeRunningBalances(
      [{ id: '1', date: '2026-01-01', credits_in: 0, credits_out: 5 }],
      95
    )
    expect(result[0].balance).toBe(95)
  })

  it('balances form a monotonically consistent sequence for credits-only', () => {
    const transactions: Transaction[] = [
      { id: '1', date: '2026-01-01', credits_in: 100, credits_out: 0 },
      { id: '2', date: '2026-02-01', credits_in: 200, credits_out: 0 },
      { id: '3', date: '2026-03-01', credits_in: 50, credits_out: 0 },
    ]
    const currentBalance = 350 // 100 + 200 + 50
    const result = computeRunningBalances(transactions, currentBalance)

    // Newest first: 350, then 300, then 100
    expect(result[0].balance).toBe(350)
    expect(result[1].balance).toBe(300)
    expect(result[2].balance).toBe(100)
  })

  it('walking balance backwards from current produces correct pre-transaction values', () => {
    // Verify the "backwards walk" property:
    // balance[n] = balance[n-1] - credits_in[n-1] + credits_out[n-1]
    const transactions: Transaction[] = [
      { id: '1', date: '2026-01-01', credits_in: 500, credits_out: 0 },
      { id: '2', date: '2026-01-05', credits_in: 0, credits_out: 3 },
      { id: '3', date: '2026-01-10', credits_in: 0, credits_out: 3 },
      { id: '4', date: '2026-01-15', credits_in: 100, credits_out: 0 },
    ]
    const currentBalance = 594 // 500 - 3 - 3 + 100
    const result = computeRunningBalances(transactions, currentBalance)

    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1]
      const expected = prev.balance - prev.credits_in + prev.credits_out
      expect(result[i].balance).toBe(expected)
    }
  })

  it('handles transactions with both credits_in and credits_out > 0 (mixed row)', () => {
    // Edge case: a row that both adds and removes credits
    const transactions: Transaction[] = [
      { id: '1', date: '2026-01-01', credits_in: 10, credits_out: 5 },
    ]
    const currentBalance = 5
    const result = computeRunningBalances(transactions, currentBalance)
    expect(result[0].balance).toBe(5)
    // Balance before this row would be: 5 - 10 + 5 = 0
  })

  it('current balance anchors the computation even if filtered history is partial', () => {
    // Simulate a date-filtered history where only some transactions are shown.
    // The current balance (from workspace_credits) is the real anchor.
    const partialTransactions: Transaction[] = [
      { id: '3', date: '2026-03-01', credits_in: 0, credits_out: 10 },
      { id: '4', date: '2026-04-01', credits_in: 200, credits_out: 0 },
    ]
    // Real current balance is 250 (history before March is excluded from filter)
    const currentBalance = 250
    const result = computeRunningBalances(partialTransactions, currentBalance)

    expect(result[0].balance).toBe(250) // after +200 → 250
    expect(result[1].balance).toBe(50)  // before +200 → 250 - 200 = 50
  })

  it('preserves transaction metadata (id, date, credits) in output', () => {
    const transactions: Transaction[] = [
      { id: 'test-id-1', date: '2026-06-15', credits_in: 75, credits_out: 0 },
    ]
    const result = computeRunningBalances(transactions, 75)
    expect(result[0].id).toBe('test-id-1')
    expect(result[0].date).toBe('2026-06-15')
    expect(result[0].credits_in).toBe(75)
    expect(result[0].credits_out).toBe(0)
  })
})
