/**
 * Funnel — Pixel Health Check (silent-pixel detector)
 *
 * Every 2 hours. Finds funnel orders where the pixel was provisioned but has
 * received ZERO visitor events for >6h while the subscription is active — the
 * signature of AudienceLab not posting to our webhook (usually a missing or
 * mismatched x-audiencelab-secret). Fires ONE consolidated ops Slack alert and
 * marks each order so we alert once, not on every run.
 *
 * This converts the previously-silent failure mode (buyer paid, pixel "live",
 * but no events ever arrive) into an observable, actionable signal.
 *
 * NOTE: this only detects + alerts. Proving the pipeline end-to-end still
 * requires AudienceLab to be configured to POST events with the matching
 * secret, plus real traffic — that part is an ops/config task, not code.
 */

import { inngest } from '@/inngest/client'
import {
  findSilentPixelOrders,
  markPixelHealthAlerted,
} from '@/lib/funnel/order.service'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeLog } from '@/lib/utils/log-sanitizer'

const SILENT_THRESHOLD_HOURS = 6

export const funnelPixelHealthCheck = inngest.createFunction(
  {
    id: 'funnel-pixel-health-check',
    name: 'Funnel — Pixel Health Check (silent-pixel detector)',
    retries: 1,
  },
  [{ cron: '0 */2 * * *' }, { event: 'funnel/pixel-health-check.run' }],
  async ({ step }) => {
    const silent = await step.run('find-silent-pixels', async () =>
      findSilentPixelOrders(SILENT_THRESHOLD_HOURS)
    )

    if (silent.length === 0) {
      safeLog('[funnel-pixel-health] no silent pixels')
      return { silent: 0 }
    }

    await step.run('alert-and-mark', async () => {
      const lines = silent
        .map(
          (o) =>
            `• ${o.pixel_domain ?? 'unknown domain'} (${o.customer_email}) — pixel ${
              o.pixel_audiencelab_id ?? 'n/a'
            }`
        )
        .join('\n')

      await sendSlackAlert({
        type: 'webhook_failure',
        severity: 'warning',
        message: `${silent.length} funnel pixel${
          silent.length === 1 ? '' : 's'
        } installed >${SILENT_THRESHOLD_HOURS}h ago but receiving ZERO visitor events. Likely AudienceLab is not posting to /api/webhooks/audiencelab/superpixel with the correct x-audiencelab-secret. Verify the AL webhook config.\n\n${lines}`,
        metadata: {
          silent_count: silent.length,
          order_ids: silent.map((o) => o.id),
          threshold_hours: SILENT_THRESHOLD_HOURS,
        },
      })

      for (const order of silent) {
        await markPixelHealthAlerted(order.id)
      }
    })

    safeLog('[funnel-pixel-health] alerted', { count: silent.length })
    return { silent: silent.length }
  }
)
