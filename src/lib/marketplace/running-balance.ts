/**
 * Running-balance calculation for the credit history ledger.
 *
 * Extracted from GET /api/marketplace/credits/history so it can be unit
 * tested directly. It previously lived inline in the route while the test
 * suite exercised a hand-copied duplicate — meaning a change to the route
 * could not fail a test.
 */

export type CreditTransaction = {
  id: string
  date: string
  credits_in: number
  credits_out: number
}

export type WithBalance<T> = T & { balance: number }

/**
 * Assign a per-row balance to each transaction, anchored on the caller's
 * real current balance rather than the sum of the (possibly date-filtered)
 * rows — otherwise the balance column is wrong whenever a filter hides
 * older history.
 *
 * Transactions are sorted newest-first and walked backwards. Each row shows
 * the balance as of the moment that transaction was the most recent one, so
 * the balance *before* a row is `balance - credits_in + credits_out`.
 *
 * Pure: the input array is not mutated.
 */
export function computeRunningBalances<T extends CreditTransaction>(
  transactions: T[],
  currentBalance: number
): WithBalance<T>[] {
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

/** Sum of all credits added across the given transactions. */
export function totalCreditsIn(transactions: CreditTransaction[]): number {
  return transactions.reduce((sum, t) => sum + t.credits_in, 0)
}

/** Sum of all credits spent across the given transactions. */
export function totalCreditsOut(transactions: CreditTransaction[]): number {
  return transactions.reduce((sum, t) => sum + t.credits_out, 0)
}
