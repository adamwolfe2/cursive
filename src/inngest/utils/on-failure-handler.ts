/**
 * Reusable onFailure handler factory for Inngest functions.
 *
 * Usage:
 *   import { createOnFailureHandler } from '@/inngest/utils/on-failure-handler'
 *
 *   export const myFunction = inngest.createFunction(
 *     { id: 'my-function', retries: 3, onFailure: createOnFailureHandler('my-function') },
 *     { ... },
 *     async ({ event, step }) => { ... }
 *   )
 */

import { sendSlackAlert } from '@/lib/monitoring/alerts'

/**
 * Creates a standardised onFailure handler that sends a Slack alert on failure.
 * The handler is intentionally non-throwing — alerting failures must not cascade.
 */
export function createOnFailureHandler(functionName: string) {
  return async ({ event, error }: { event: any; error: Error }) => {
    try {
      await sendSlackAlert({
        type: 'inngest_failure',
        severity: 'error',
        message: `Inngest function failed: ${functionName}`,
        metadata: {
          functionName,
          eventName: event?.data?.event?.name ?? event?.name ?? 'unknown',
          error: error?.message ?? 'Unknown error',
          eventData: JSON.stringify(event?.data?.event?.data ?? event?.data ?? {}).slice(0, 500),
        },
      })
    } catch {
      // Failure handler must never throw
    }
  }
}
