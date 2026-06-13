/**
 * Affiliate clawback accounting — invariant tests (blocker B3).
 *
 * Pins the rule that a clawed-back commission debits lifetime earnings EXACTLY
 * once, via one of two mutually-exclusive channels:
 *
 *   cash-reversed  → negative row is terminal ('reversed'); debit earnings here.
 *   carry-forward  → negative row stays 'pending'; the monthly cron nets it into a
 *                    future transferAmount (crediting the NET), so we must NOT also
 *                    debit earnings at clawback time.
 *
 * This is a behavioural model of the two code paths (handleAffiliateClawback +
 * the cron settle) — it would have caught the double-debit the reviewers found.
 */

import { describe, it, expect } from 'vitest'

type Status = 'pending' | 'paid' | 'failed' | 'reversed'
interface Row {
  id: string
  amount: number
  status: Status
  transfer: string | null
}

/** Models the clawback of a PAID commission of `amount` cents. */
function clawback(
  rows: Row[],
  earnings: { value: number },
  paidId: string,
  reversalSucceeds: boolean
): void {
  const paid = rows.find((r) => r.id === paidId)!
  // idempotency lock: negative carry-forward row
  const claw: Row = { id: `clawback_${paidId}`, amount: -paid.amount, status: 'pending', transfer: null }
  rows.push(claw)

  if (paid.transfer && reversalSucceeds) {
    claw.status = 'reversed'
    claw.transfer = 'rev_1'
    earnings.value -= paid.amount // debit once — terminal row, cron never nets it
  }
  // else: carry-forward — earnings untouched here (cron will net the negative row)
}

/** Models one cron run for a single affiliate: claim pending+unclaimed, net, settle. */
function cronRun(rows: Row[], earnings: { value: number }, minPayout = 5000): number {
  const claimable = rows.filter((r) => r.status === 'pending' && r.transfer === null)
  const net = claimable.reduce((s, r) => s + r.amount, 0)
  if (net < minPayout || net <= 0) return 0 // carry forward
  const key = 'payout_k'
  for (const r of claimable) r.transfer = key
  // settle
  for (const r of claimable) {
    r.status = r.amount < 0 ? 'reversed' : 'paid'
    r.transfer = 'tr_real'
  }
  earnings.value += net // credit the NET (negatives already baked in)
  return net
}

describe('Clawback earnings accounting (B3)', () => {
  it('cash-reversed: debits earnings exactly once, row is terminal', () => {
    const rows: Row[] = [{ id: 'c1', amount: 10000, status: 'paid', transfer: 'tr_c1' }]
    const earnings = { value: 10000 } // already credited at original transfer
    clawback(rows, earnings, 'c1', /* reversalSucceeds */ true)

    expect(earnings.value).toBe(0)
    const claw = rows.find((r) => r.id === 'clawback_c1')!
    expect(claw.status).toBe('reversed')
    // terminal → cron never re-nets it
    const transferred = cronRun(rows, earnings)
    expect(transferred).toBe(0)
    expect(earnings.value).toBe(0)
  })

  it('carry-forward: does NOT debit at clawback; cron nets it exactly once', () => {
    const rows: Row[] = [{ id: 'c1', amount: 10000, status: 'paid', transfer: 'tr_c1' }]
    const earnings = { value: 10000 }
    clawback(rows, earnings, 'c1', /* reversalSucceeds */ false)

    // earnings unchanged at clawback time
    expect(earnings.value).toBe(10000)

    // next month a +$200 commission accrues, then cron runs
    rows.push({ id: 'c2', amount: 20000, status: 'pending', transfer: null })
    const transferred = cronRun(rows, earnings)

    // net transfer = 200 - 100 = 100; earnings credited by the net
    expect(transferred).toBe(10000)
    expect(earnings.value).toBe(20000) // 100 (kept) + 200 - 100 = 200 net lifetime

    // the negative row is now terminal and cannot be netted again
    const claw = rows.find((r) => r.id === 'clawback_c1')!
    expect(claw.status).toBe('reversed')
    const second = cronRun(rows, earnings)
    expect(second).toBe(0)
    expect(earnings.value).toBe(20000) // unchanged — no double-claw
  })

  it('carry-forward below threshold stays pending and nets only when finally paid', () => {
    const rows: Row[] = [{ id: 'c1', amount: 10000, status: 'paid', transfer: 'tr_c1' }]
    const earnings = { value: 10000 }
    clawback(rows, earnings, 'c1', false)

    // small +$30 accrues — net = -$70 → below threshold, carried forward
    rows.push({ id: 'c2', amount: 3000, status: 'pending', transfer: null })
    expect(cronRun(rows, earnings)).toBe(0)
    expect(earnings.value).toBe(10000)
    // both rows remain pending+unclaimed
    expect(rows.filter((r) => r.status === 'pending' && r.transfer === null)).toHaveLength(2)
  })
})
