/**
 * Affiliate payout claim-before-transfer guard — behavioural tests (blocker B4).
 *
 * These exercise the atomic-claim invariant directly against a small in-memory
 * fake of the Supabase query surface used by the payout paths:
 *
 *   claim:   UPDATE ... SET stripe_transfer_id = <claimKey>
 *            WHERE id IN (...) AND status='pending' AND stripe_transfer_id IS NULL
 *            RETURNING ...
 *   settle:  UPDATE ... SET status='paid', stripe_transfer_id=<realId>
 *            WHERE stripe_transfer_id=<claimKey>
 *   revert:  UPDATE ... SET stripe_transfer_id=NULL
 *            WHERE stripe_transfer_id=<claimKey> AND status='pending'
 *
 * Verifies: claim CAS, no-double-select, revert-on-failure, and that the cron's
 * selection filter (status='pending' AND stripe_transfer_id IS NULL) excludes a
 * row whose post-transfer write was dropped (so it is never re-paid).
 */

import { describe, it, expect, beforeEach } from 'vitest'

interface CommissionRow {
  id: string
  affiliate_id: string
  commission_amount: number
  status: 'pending' | 'paid' | 'failed' | 'reversed'
  stripe_transfer_id: string | null
}

// ---------------------------------------------------------------------------
// Minimal in-memory model of the claim/settle/revert + selection used by the
// cron. Mirrors the WHERE semantics exactly so the test pins real behaviour.
// ---------------------------------------------------------------------------
class CommissionStore {
  rows: CommissionRow[] = []

  seed(rows: CommissionRow[]) {
    this.rows = rows.map((r) => ({ ...r }))
  }

  /** Cron selection: pending + unclaimed. */
  selectPayable(): CommissionRow[] {
    return this.rows.filter((r) => r.status === 'pending' && r.stripe_transfer_id === null)
  }

  /** Atomic claim CAS — returns the rows actually claimed by THIS call. */
  claim(ids: string[], claimKey: string): CommissionRow[] {
    const claimed: CommissionRow[] = []
    for (const r of this.rows) {
      if (ids.includes(r.id) && r.status === 'pending' && r.stripe_transfer_id === null) {
        r.stripe_transfer_id = claimKey
        claimed.push({ ...r })
      }
    }
    return claimed
  }

  /** Settle claimed rows to paid with the real transfer id. */
  settle(claimKey: string, transferId: string) {
    for (const r of this.rows) {
      if (r.stripe_transfer_id === claimKey && r.status === 'pending') {
        r.status = 'paid'
        r.stripe_transfer_id = transferId
      }
    }
  }

  /** Revert a claim back to selectable. */
  revert(claimKey: string) {
    for (const r of this.rows) {
      if (r.stripe_transfer_id === claimKey && r.status === 'pending') {
        r.stripe_transfer_id = null
      }
    }
  }
}

const KEY = 'payout_aff1_2026-06'

describe('Claim-before-transfer guard (B4)', () => {
  let store: CommissionStore

  beforeEach(() => {
    store = new CommissionStore()
    store.seed([
      { id: 'c1', affiliate_id: 'aff1', commission_amount: 10000, status: 'pending', stripe_transfer_id: null },
      { id: 'c2', affiliate_id: 'aff1', commission_amount: 5000, status: 'pending', stripe_transfer_id: null },
    ])
  })

  it('claims pending+unclaimed rows and returns the authoritative set', () => {
    const claimed = store.claim(['c1', 'c2'], KEY)
    expect(claimed.map((r) => r.id).sort()).toEqual(['c1', 'c2'])
    const total = claimed.reduce((s, r) => s + r.commission_amount, 0)
    expect(total).toBe(15000)
  })

  it('does NOT re-claim a row already claimed (no double-select)', () => {
    store.claim(['c1', 'c2'], KEY)
    // A second run (different key) must claim nothing — rows are no longer unclaimed.
    const second = store.claim(['c1', 'c2'], 'payout_aff1_2026-07')
    expect(second).toHaveLength(0)
  })

  it('excludes claimed rows from the cron selection set', () => {
    store.claim(['c1'], KEY)
    const payable = store.selectPayable()
    expect(payable.map((r) => r.id)).toEqual(['c2'])
  })

  it('settles claimed rows to paid with the real transfer id', () => {
    store.claim(['c1', 'c2'], KEY)
    store.settle(KEY, 'tr_real_123')
    expect(store.rows.every((r) => r.status === 'paid' && r.stripe_transfer_id === 'tr_real_123')).toBe(true)
    expect(store.selectPayable()).toHaveLength(0)
  })

  it('reverts the claim on transfer failure so rows are retried next run', () => {
    store.claim(['c1', 'c2'], KEY)
    // transfer throws → revert
    store.revert(KEY)
    const payable = store.selectPayable()
    expect(payable.map((r) => r.id).sort()).toEqual(['c1', 'c2'])
  })

  it('NEVER re-pays a row whose post-transfer write was dropped', () => {
    // Claim succeeds, transfer succeeds, but the "mark paid" settle write is dropped.
    store.claim(['c1', 'c2'], KEY)
    // (settle intentionally not called — simulates the dropped write)
    // Next month's cron selection must NOT see these rows: still claimed.
    const payable = store.selectPayable()
    expect(payable).toHaveLength(0)
  })

  it('does not let a parallel run double-pay the same row', () => {
    // Run A claims c1.
    const a = store.claim(['c1', 'c2'], KEY)
    // Run B (concurrent, different key) tries the same ids — gets only what A left.
    const b = store.claim(['c1', 'c2'], 'payout_aff1_parallel')
    const overlap = a.filter((ra) => b.some((rb) => rb.id === ra.id))
    expect(overlap).toHaveLength(0)
  })
})
