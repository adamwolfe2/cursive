// Email Verification Inngest Functions
// Handles background processing of email verification queue

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  processVerificationQueue,
  queueStaleLeadsForReverification,
  queueLeadsForVerification,
} from '@/lib/services/email-verification.service'

// Feature flag check
function isVerificationEnabled(): boolean {
  const killSwitch = process.env.EMAIL_VERIFICATION_KILL_SWITCH
  if (killSwitch === 'true' || killSwitch === '1') {
    return false
  }

  const apiKey = process.env.MILLIONVERIFIER_API_KEY
  if (!apiKey) {
    return false
  }

  return true
}

/**
 * Process email verification queue
 * Runs every 5 minutes to process pending verifications
 */
export const processEmailVerificationQueue = inngest.createFunction(
  {
    id: 'email-verification-queue',
    name: 'Process Email Verification Queue',
    retries: 3,
    // CONCURRENCY SAFETY: limit:1 + finish:"5m" is safe. If the function runs
    // longer than 5 minutes, Inngest terminates it and automatically releases
    // the concurrency slot — no manual cleanup needed and no deadlock risk.
    timeouts: { finish: "5m" },
    concurrency: {
      limit: 1, // Only one instance at a time
    },
  },
  { cron: '*/15 * * * *' }, // Every 15 minutes (cost: 3x fewer cron invocations)
  async ({ step, logger }) => {
    // Check kill switch
    if (!isVerificationEnabled()) {
      console.warn('[email-verification] Skipped: kill-switch is active (EMAIL_VERIFICATION_KILL_SWITCH)')
      return { skipped: true, reason: 'Verification disabled' }
    }

    // Process queue in batches
    const results = await step.run('process-queue', async () => {
      return processVerificationQueue(50) // Process 50 at a time
    })

    logger.info('Email verification queue processed', results)

    // If there are still pending items, trigger another run
    if (results.processed === 50) {
      const supabase = createAdminClient()
      const { count } = await supabase
        .from('email_verification_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (count && count > 0) {
        logger.info(`${count} items still pending, triggering continuation`)
        await step.sendEvent('continue-processing', {
          name: 'email-verification/continue',
          data: { remaining: count },
        })
      }
    }

    return {
      processed: results.processed,
      valid: results.valid,
      invalid: results.invalid,
      catchAll: results.catchAll,
      unknown: results.unknown,
    }
  }
)

/**
 * Continue processing when there are more items
 *
 * BACKLOG RISK: This function is triggered exclusively via sendEvent from
 * processEmailVerificationQueue. If that function crashes before it can fire
 * the continuation event (e.g., mid-step after processing but before the
 * sendEvent call), in-flight items will sit in the queue until the next
 * 15-minute cron tick picks them up. There is no separate sweep/fallback
 * beyond the cron schedule. The retry-failed-jobs cron does NOT cover this
 * gap because the parent job itself succeeds (it processes items and then
 * crashes before sending the continuation). Mitigation: the 15-minute cron
 * acts as a natural recovery window — worst-case delay is 15 minutes.
 * If tighter SLAs are needed, consider a dedicated sweep cron that checks
 * for pending queue items and fires this event directly.
 */
export const continueEmailVerification = inngest.createFunction(
  {
    id: 'email-verification-continue',
    name: 'Continue Email Verification',
    retries: 2,
    timeouts: { finish: "5m" },
    concurrency: {
      limit: 1,
    },
  },
  { event: 'email-verification/continue' },
  async ({ step, logger }) => {
    if (!isVerificationEnabled()) {
      console.warn('[email-verification] Skipped: kill-switch is active (EMAIL_VERIFICATION_KILL_SWITCH)')
      return { skipped: true }
    }

    // Wait a bit before continuing
    await step.sleep('wait-before-continue', '30s')

    const results = await step.run('process-more', async () => {
      return processVerificationQueue(50)
    })

    logger.info('Continued email verification processing', results)

    return results
  }
)

/**
 * Queue new leads for verification when upload completes
 * Triggered by upload completion event
 */
export const queueNewLeadsForVerification = inngest.createFunction(
  {
    id: 'email-verification-queue-new-leads',
    name: 'Queue New Leads for Verification',
    retries: 3,
    timeouts: { finish: "5m" },
  },
  { event: 'partner/upload-completed' },
  async ({ event, step, logger }) => {
    if (!isVerificationEnabled()) {
      console.warn('[email-verification] Skipped: kill-switch is active (EMAIL_VERIFICATION_KILL_SWITCH)')
      return { skipped: true, reason: 'Verification disabled' }
    }

    const { batchId, partnerId: _partnerId, leadCount } = event.data

    logger.info(`Queueing ${leadCount} leads for verification from batch ${batchId}`)

    // Get lead IDs from the batch
    const leadIds = await step.run('get-lead-ids', async () => {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('leads')
        .select('id')
        .eq('upload_batch_id', batchId)
        .eq('verification_status', 'pending')
        .limit(1000)

      if (error) {
        throw new Error(`Failed to get leads: ${error.message}`)
      }

      return (data || []).map(l => l.id)
    })

    // Queue for verification with high priority
    const queued = await step.run('queue-leads', async () => {
      return queueLeadsForVerification(leadIds, 10) // High priority
    })

    logger.info(`Queued ${queued} leads for verification`)

    return { queued }
  }
)

/**
 * Re-verify stale leads
 * Runs daily to re-check old leads that haven't sold
 */
export const reverifyStaleLeads = inngest.createFunction(
  {
    id: 'email-verification-reverify-stale',
    name: 'Re-verify Stale Leads',
    retries: 2,
    timeouts: { finish: "5m" },
  },
  { cron: '0 3 * * *' }, // 3 AM daily
  async ({ step, logger }) => {
    if (!isVerificationEnabled()) {
      console.warn('[email-verification] Skipped: kill-switch is active (EMAIL_VERIFICATION_KILL_SWITCH)')
      return { skipped: true, reason: 'Verification disabled' }
    }

    const queued = await step.run('queue-stale-leads', async () => {
      return queueStaleLeadsForReverification(60) // Leads older than 60 days
    })

    logger.info(`Queued ${queued} stale leads for re-verification`)

    return { queued }
  }
)

/**
 * Update partner verification pass rates
 * Runs after verification processing
 */
export const updatePartnerVerificationRates = inngest.createFunction(
  {
    id: 'email-verification-update-partner-rates',
    name: 'Update Partner Verification Rates',
    retries: 2,
    timeouts: { finish: "5m" },
  },
  { cron: '0 4 * * *' }, // 4 AM daily
  async ({ step, logger }) => {
    const supabase = createAdminClient()

    // Get all partners
    const { data: partners, error } = await supabase
      .from('partners')
      .select('id')
      .eq('is_active', true)

    if (error || !partners) {
      throw new Error(`Failed to get partners: ${error?.message}`)
    }

    let updated = 0

    for (const partner of partners) {
      await step.run(`update-partner-${partner.id}`, async () => {
        // Use count-only queries instead of fetching all rows (cost: no data transfer)
        const [validResult, catchAllResult, totalResult] = await Promise.all([
          supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('partner_id', partner.id)
            .eq('verification_status', 'valid'),
          supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('partner_id', partner.id)
            .eq('verification_status', 'catch_all'),
          supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('partner_id', partner.id)
            .in('verification_status', ['valid', 'catch_all', 'invalid']),
        ])

        const total = totalResult.count ?? 0
        if (total === 0) return

        const validCount = validResult.count ?? 0
        const catchAllCount = catchAllResult.count ?? 0
        const passRate = ((validCount + catchAllCount) / total) * 100

        await supabase
          .from('partners')
          .update({
            verification_pass_rate: Math.round(passRate * 100) / 100,
            updated_at: new Date().toISOString(),
          })
          .eq('id', partner.id)

        updated++
      })
    }

    logger.info(`Updated verification rates for ${updated} partners`)

    return { updated }
  }
)
