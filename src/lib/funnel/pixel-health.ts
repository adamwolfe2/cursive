/**
 * Funnel pixel health classification.
 *
 * Turns the silent-failure mode (a pixel is installed but no visitor events
 * ever arrive — usually because AudienceLab isn't posting to our webhook with
 * the right secret) into an observable state we can alert on.
 *
 * Pure + fully testable; the Inngest health-check cron and any admin health
 * view both classify off this single function.
 */

export type PixelHealth = 'no-pixel' | 'pending' | 'healthy' | 'silent'

export interface PixelHealthInput {
  /** When the pixel was provisioned (ISO), or null if never. */
  pixelProvisionedAt: string | null
  /** When the most recent event arrived (ISO), or null if none. */
  pixelLastEventAt: string | null
  /** Current epoch ms (injectable for tests). Defaults to Date.now(). */
  now?: number
  /** Hours of zero-events-after-install before we call a pixel "silent". */
  silentThresholdHours?: number
}

export interface PixelHealthResult {
  status: PixelHealth
  reason: string
}

const DEFAULT_SILENT_THRESHOLD_HOURS = 6

/**
 * Classify a funnel pixel's health.
 *
 * - `no-pixel`  — never provisioned.
 * - `healthy`   — at least one event has arrived.
 * - `pending`   — provisioned recently, no events yet (normal warm-up).
 * - `silent`    — provisioned beyond the threshold with zero events (alert!).
 */
export function classifyPixelHealth(
  input: PixelHealthInput
): PixelHealthResult {
  const {
    pixelProvisionedAt,
    pixelLastEventAt,
    now = Date.now(),
    silentThresholdHours = DEFAULT_SILENT_THRESHOLD_HOURS,
  } = input

  if (!pixelProvisionedAt) {
    return { status: 'no-pixel', reason: 'Pixel has not been provisioned.' }
  }

  if (pixelLastEventAt) {
    return { status: 'healthy', reason: 'Pixel is receiving visitor events.' }
  }

  const provisionedMs = new Date(pixelProvisionedAt).getTime()
  if (Number.isNaN(provisionedMs)) {
    // Defensive: an unparseable timestamp shouldn't crash the cron.
    return {
      status: 'pending',
      reason: 'Provisioned-at timestamp unparseable.',
    }
  }

  const hoursSince = (now - provisionedMs) / (60 * 60 * 1000)
  if (hoursSince < silentThresholdHours) {
    return {
      status: 'pending',
      reason: `Provisioned ${hoursSince.toFixed(1)}h ago, awaiting first event.`,
    }
  }

  return {
    status: 'silent',
    reason: `Provisioned ${hoursSince.toFixed(1)}h ago with zero events — likely AudienceLab is not posting to the webhook (check x-audiencelab-secret).`,
  }
}

/** True when the pixel is in the alert-worthy "silent" state. */
export function isPixelSilent(input: PixelHealthInput): boolean {
  return classifyPixelHealth(input).status === 'silent'
}
