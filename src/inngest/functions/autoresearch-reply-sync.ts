// Autoresearch Reply Sync
// Cron job that syncs reply data and classifies sentiment
// for active autoresearch experiments every 30 minutes.

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { classifySentiment } from '@/lib/services/autoresearch/sentiment-classifier'
import { sendSlackAlert } from '@/lib/monitoring/alerts'

// ---------------------------------------------------------------------------
// Cron: Sync + Classify Replies for Active Experiments
// ---------------------------------------------------------------------------

export const autoresearchReplySync = inngest.createFunction(
  {
    id: 'autoresearch-reply-sync',
    name: 'Autoresearch Reply Sentiment Sync',
    retries: 3,
    timeouts: { finish: '5m' },
    onFailure: async ({ error }) => {
      try {
        await sendSlackAlert({
          type: 'inngest_failure',
          severity: 'critical',
          message: 'Autoresearch reply sync failed',
          metadata: { error: error?.message ?? 'Unknown error' },
        })
      } catch {
        // Failure handler must not throw
      }
    },
  },
  { cron: '*/30 * * * *' },
  async ({ step, logger }) => {
    // Step 1: Find all active/waiting autoresearch experiments
    const activeExperiments = await step.run(
      'find-active-experiments',
      async () => {
        const supabase = createAdminClient()

        const { data, error } = await supabase
          .from('autoresearch_experiments')
          .select('id, program_id, workspace_id, control_variant_id, challenger_variant_ids')
          .in('status', ['active', 'waiting'])

        if (error) {
          throw new Error(`Failed to fetch active experiments: ${error.message}`)
        }

        return data ?? []
      }
    )

    if (activeExperiments.length === 0) {
      logger.info('No active autoresearch experiments — skipping reply sync')
      return { success: true, experiments_processed: 0, replies_classified: 0 }
    }

    logger.info(
      `Found ${activeExperiments.length} active autoresearch experiments to sync`
    )

    // Step 2: Process each experiment
    let totalClassified = 0

    for (const experiment of activeExperiments) {
      const classified = await step.run(
        `sync-replies-${experiment.id}`,
        async () => {
          const supabase = createAdminClient()

          // Gather all variant IDs for this experiment
          const allVariantIds = [
            experiment.control_variant_id,
            ...(experiment.challenger_variant_ids ?? []),
          ].filter(Boolean) as string[]

          if (allVariantIds.length === 0) {
            return 0
          }

          // Find email_sends that belong to these variants
          const { data: sends } = await supabase
            .from('email_sends')
            .select('id, variant_id')
            .in('variant_id', allVariantIds)

          if (!sends || sends.length === 0) {
            return 0
          }

          const sendIds = sends.map((s: any) => s.id)

          // Build a lookup: send_id -> variant_id
          const sendToVariant: Record<string, string> = {}
          for (const send of sends) {
            sendToVariant[send.id] = send.variant_id
          }

          // Find replies that are linked to these sends but have no sentiment yet
          const { data: unclassifiedReplies } = await supabase
            .from('email_replies')
            .select('id, email_send_id, subject, body_text')
            .in('email_send_id', sendIds)
            .is('autoresearch_sentiment', null)
            .limit(100)

          if (!unclassifiedReplies || unclassifiedReplies.length === 0) {
            return 0
          }

          let classifiedCount = 0

          for (const reply of unclassifiedReplies) {
            try {
              // Idempotency: skip if already logged (e.g. from a previous partial run)
              const { data: existingLog } = await supabase
                .from('reply_classification_logs')
                .select('id')
                .eq('reply_id', reply.id)
                .maybeSingle()

              if (existingLog) {
                // Classification already recorded — just make sure the reply row is updated
                logger.info(`Reply ${reply.id} already classified, skipping`)
                continue
              }

              const classification = await classifySentiment(
                reply.body_text ?? '',
                reply.subject ?? '',
                { replyId: reply.id }
              )

              const { error: updateError } = await supabase
                .from('email_replies')
                .update({
                  autoresearch_experiment_id: experiment.id,
                  autoresearch_sentiment: classification.sentiment,
                })
                .eq('id', reply.id)

              if (updateError) {
                logger.warn(
                  `Failed to update reply ${reply.id}: ${updateError.message}`
                )
                continue
              }

              classifiedCount++
            } catch (err) {
              logger.warn(
                `Failed to classify reply ${reply.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
              )
            }
          }

          return classifiedCount
        }
      )

      totalClassified += classified
    }

    logger.info(
      `Reply sync complete: ${activeExperiments.length} experiments, ${totalClassified} replies classified`
    )

    return {
      success: true,
      experiments_processed: activeExperiments.length,
      replies_classified: totalClassified,
    }
  }
)
