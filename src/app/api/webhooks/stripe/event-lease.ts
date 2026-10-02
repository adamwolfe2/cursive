/**
 * What to do when a Stripe event arrives that may already have a webhook_events row.
 * A row is written before processing and finished (processing_duration_ms set) after it. A row that never
 * finished means a run is either still going or crashed; the lease tells the two apart, so a crash never
 * turns every later Stripe retry into a 200 "duplicate" that silently drops the event.
 */

/** Longer than any function can run (Vercel's ceiling is 800s), so an unfinished row past it is a dead run. */
export const IN_PROGRESS_LEASE_MS = 15 * 60 * 1000

export interface ExistingEvent {
  error_message: string | null
  processing_duration_ms: number | null
  created_at: string
}

/** process: new event. duplicate: already done, 200. in_progress: 503 so Stripe retries. reclaim: delete row, process. */
export type ExistingEventAction = 'process' | 'duplicate' | 'in_progress' | 'reclaim'

export function existingEventAction(row: ExistingEvent | null, now: number): ExistingEventAction {
  if (!row) return 'process'
  if (row.error_message) return 'reclaim'
  if (row.processing_duration_ms !== null) return 'duplicate'
  return now - Date.parse(row.created_at) < IN_PROGRESS_LEASE_MS ? 'in_progress' : 'reclaim'
}
