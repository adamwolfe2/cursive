// SDR Inbox Sync
// Cron: every 15 minutes — syncs new replies, runs through AI SDR reply engine

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { SdrConfigRepository } from '@/lib/repositories/sdr-config.repository'
import { generateReply } from '@/lib/services/sdr/reply-engine'
import { classifySentiment } from '@/lib/services/autoresearch/sentiment-classifier'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { createOnFailureHandler } from '@/inngest/utils/on-failure-handler'
import type { ConversationStage } from '@/types/sdr'

export const sdrInboxSync = inngest.createFunction(
  {
    id: 'sdr-inbox-sync',
    name: 'SDR Inbox Sync',
    retries: 3,
    timeouts: { finish: '10m' },
    concurrency: { limit: 1 },
    onFailure: createOnFailureHandler('sdr-inbox-sync'),
  },
  { cron: '*/15 * * * *' },
  async ({ step, logger }) => {
    // Step 1: Load all workspaces with SDR enabled
    const configs = await step.run('load-sdr-configs', async () => {
      const { data } = await createAdminClient()
        .from('sdr_configurations')
        .select('*')
        .eq('human_in_the_loop', false)
      return data ?? []
    })

    if (configs.length === 0) {
      logger.info('[SDR Sync] No workspaces with auto-SDR enabled')
      return { processed: 0 }
    }

    let totalProcessed = 0

    for (const config of configs) {
      const processed = await step.run(
        `sync-workspace-${config.workspace_id}`,
        async () => {
          const supabase = createAdminClient()
          const configRepo = new SdrConfigRepository()
          const sdrConfig = await configRepo.findByWorkspace(config.workspace_id)

          if (!sdrConfig) return 0

          // Find unprocessed inbound replies (no suggested_response yet, not skipped)
          const { data: replies } = await supabase
            .from('email_replies')
            .select(`
              id,
              workspace_id,
              campaign_id,
              lead_id,
              from_email,
              subject,
              body_text,
              sentiment,
              intent_score,
              draft_status,
              suggested_response
            `)
            .eq('workspace_id', config.workspace_id)
            .eq('draft_status', 'pending')
            .is('suggested_response', null)
            .not('sentiment', 'in', '("out_of_office","unsubscribe")')
            .order('received_at', { ascending: true })
            .limit(20)

          if (!replies || replies.length === 0) return 0

          let count = 0

          for (const reply of replies) {
            try {
              // Idempotency: skip replies that already have a classification log entry
              // (guards against double-processing on retry or duplicate events)
              const { data: existingClassLog } = await supabase
                .from('reply_classification_logs')
                .select('id')
                .eq('reply_id', reply.id)
                .maybeSingle()

              if (existingClassLog && reply.suggested_response) {
                // Already fully processed — skip
                continue
              }

              // Get conversation history
              const { data: conversation } = await supabase
                .from('email_conversations')
                .select('id, sentiment, ai_turn_count, message_count')
                .eq('workspace_id', config.workspace_id)
                .eq('lead_id', reply.lead_id)
                .order('last_message_at', { ascending: false })
                .limit(1)
                .maybeSingle()

              const conversationStage = (conversation?.sentiment ?? 'new') as ConversationStage
              const turnCount = conversation?.ai_turn_count ?? 0

              // Get conversation messages for history
              const { data: messages } = conversation?.id
                ? await supabase
                    .from('conversation_messages')
                    .select('direction, body_text, subject, sent_at, received_at')
                    .eq('conversation_id', conversation.id)
                    .order('created_at', { ascending: true })
                    .limit(10)
                : { data: [] }

              // Get lead context
              const { data: lead } = await supabase
                .from('leads')
                .select('first_name, last_name, company_name, job_title, email')
                .eq('id', reply.lead_id)
                .maybeSingle()

              // Classify sentiment if not already done
              const sentiment = reply.sentiment ?? (
                await classifySentiment(reply.body_text ?? '', reply.subject ?? '', { replyId: reply.id })
              ).sentiment

              // Run through reply engine
              const decision = await generateReply({
                replyBody: reply.body_text ?? '',
                replySubject: reply.subject ?? '',
                conversationHistory: (messages ?? []).map((m) => ({
                  direction: m.direction as 'outbound' | 'inbound',
                  body: m.body_text ?? '',
                  subject: m.subject,
                  sentAt: m.sent_at,
                  receivedAt: m.received_at,
                })),
                leadContext: {
                  firstName: lead?.first_name ?? null,
                  lastName: lead?.last_name ?? null,
                  companyName: lead?.company_name ?? null,
                  jobTitle: lead?.job_title ?? null,
                  email: reply.from_email,
                },
                workspaceId: config.workspace_id,
                config: sdrConfig as any,
                sentiment,
                intentScore: reply.intent_score ?? 5,
                conversationId: conversation?.id ?? '',
                replyId: reply.id,
                turnCount,
                currentStage: conversationStage,
              })

              // Update reply with AI draft
              if (decision.reply) {
                await supabase
                  .from('email_replies')
                  .update({
                    suggested_response: decision.reply.body,
                    suggested_response_metadata: {
                      subject: decision.reply.subject,
                      tone: decision.reply.tone,
                      confidence: decision.reply.confidence,
                      knowledgeEntriesUsed: decision.reply.knowledgeEntriesUsed,
                      templateUsed: decision.reply.templateUsed,
                      action: decision.action,
                      generated_via: 'sdr-inbox-sync',
                    },
                    response_generated_at: new Date().toISOString(),
                    draft_status: decision.action === 'auto_send'
                      ? 'approved'
                      : decision.action === 'queue_approval'
                        ? 'needs_approval'
                        : 'skipped',
                  })
                  .eq('id', reply.id)

                // Update conversation stage if transition detected
                if (conversation?.id && decision.reply.suggestedStageTransition) {
                  await supabase
                    .from('email_conversations')
                    .update({
                      sentiment: decision.reply.suggestedStageTransition,
                      ai_turn_count: turnCount + 1,
                      last_ai_reply_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', conversation.id)
                }

                // Slack: notify on auto-send or needs-approval
                const leadName = [lead?.first_name, lead?.last_name]
                  .filter(Boolean)
                  .join(' ') || reply.from_email
                const companyName = lead?.company_name ?? 'Unknown'

                try {
                  if (decision.action === 'auto_send') {
                    await sendSlackAlert({
                      type: 'system_event',
                      severity: 'info',
                      message: `AI SDR auto-replied to ${leadName} (${companyName})`,
                      metadata: {
                        workspace_id: config.workspace_id,
                        sentiment,
                        confidence: `${decision.reply.confidence ?? '?'}%`,
                      },
                    })
                  } else if (decision.action === 'queue_approval') {
                    const inboxUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.meetcursive.com'}/inbox`
                    await sendSlackAlert({
                      type: 'system_event',
                      severity: 'warning',
                      message: `Reply needs review: ${leadName} (${companyName})`,
                      metadata: {
                        workspace_id: config.workspace_id,
                        sentiment,
                        review_url: inboxUrl,
                      },
                    })
                  }
                } catch {
                  // Non-critical: do not break the pipeline if Slack is down
                }
              }

              count++
            } catch (err) {
              logger.warn(`[SDR Sync] Failed to process reply ${reply.id}: ${err}`)
            }
          }

          return count
        }
      )

      totalProcessed += processed
    }

    logger.info(`[SDR Sync] Processed ${totalProcessed} replies across ${configs.length} workspaces`)
    return { processed: totalProcessed, workspaces: configs.length }
  }
)
