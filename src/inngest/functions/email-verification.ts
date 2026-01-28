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
    console.log('[Email Verification] Kill switch is ON - verification disabled')
    return false
  }

  const apiKey = process.env.MILLIONVERIFIER_API_KEY
  if (!apiKey) {
    console.log('[Email Verification] No API key configured - verification disabled')
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
    concurrency: {
      limit: 1, // Only one instance at a time
    },
  },
  { cron: '*/5 * * * *' }, // Every 5 minutes
  async ({ step, logger }) => {
    // Check kill switch
    if (!isVerificationEnabled()) {
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
 */
export const continueEmailVerification = inngest.createFunction(
  {
    id: 'email-verification-continue',
    name: 'Continue Email Verification',
    retries: 2,
    concurrency: {
      limit: 1,
    },
  },
  { event: 'email-verification/continue' },
  async ({ step, logger }) => {
    if (!isVerificationEnabled()) {
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
  },
  { event: 'partner/upload-completed' },
  async ({ event, step, logger }) => {
    if (!isVerificationEnabled()) {
      return { skipped: true, reason: 'Verification disabled' }
    }

    const { batchId, partnerId, leadCount } = event.data

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
  },
  { cron: '0 3 * * *' }, // 3 AM daily
  async ({ step, logger }) => {
    if (!isVerificationEnabled()) {
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
        // Calculate verification pass rate
        const { data: leadStats } = await supabase
          .from('leads')
          .select('verification_status')
          .eq('partner_id', partner.id)
          .in('verification_status', ['valid', 'catch_all', 'invalid'])

        if (!leadStats || leadStats.length === 0) return

        const validCount = leadStats.filter(l => l.verification_status === 'valid').length
        const catchAllCount = leadStats.filter(l => l.verification_status === 'catch_all').length
        const total = leadStats.length

        const passRate = total > 0 ? ((validCount + catchAllCount) / total) * 100 : 0

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
