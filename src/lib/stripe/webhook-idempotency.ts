/**
 * Stripe webhook idempotency decision.
 *
 * The `webhook_events` row is inserted BEFORE the handler runs, so "a row
 * exists" does not mean "the event was handled". Distinguishing the two is
 * what stops a lambda that dies mid-handler from becoming a poison pill:
 * its row sits there with no error recorded, and every Stripe redelivery
 * short-circuits to `200 {duplicate:true}` forever, so the payment is never
 * fulfilled and nothing ever alerts.
 *
 * `processed_at` is therefore written only when the handler finishes — which
 * is the meaning `checkAlertRules()` already assumed when it looked for rows
 * with a NULL `processed_at` older than five minutes.
 */

/**
 * How long an in-flight row may sit before a redelivery is allowed to take it
 * over. Must exceed the route's own max duration, or a slow-but-alive handler
 * gets reprocessed concurrently with itself.
 */
export const STALE_IN_FLIGHT_MS = 15 * 60 * 1000

export type WebhookEventRow = {
  processed_at: string | null
  error_message: string | null
  created_at: string
}

export type WebhookDisposition =
  /** No prior row, or the prior attempt is dead — run the handler. */
  | 'process'
  /** Already handled successfully — return 200 without re-running. */
  | 'skip'
  /** Another instance is handling it right now — make Stripe come back later. */
  | 'in-flight'

export function classifyWebhookEvent(
  existing: WebhookEventRow | null | undefined,
  now: number = Date.now()
): WebhookDisposition {
  if (!existing) return 'process'

  const finished = existing.processed_at !== null

  // Finished cleanly. Anything else is a redelivery of an event we already
  // acted on, and re-running it risks double-crediting.
  if (finished && existing.error_message === null) return 'skip'

  // Finished with an error — the caller deletes the row and retries.
  if (finished) return 'process'

  // Never finished. Either a sibling instance is mid-flight, or one died and
  // left the row behind. Age is the only signal we have to tell them apart.
  const startedAt = Date.parse(existing.created_at)
  if (!Number.isFinite(startedAt)) return 'process'

  return now - startedAt > STALE_IN_FLIGHT_MS ? 'process' : 'in-flight'
}
