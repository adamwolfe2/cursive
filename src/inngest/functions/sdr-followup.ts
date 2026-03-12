import { inngest } from '@/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { DncRepository } from '@/lib/repositories/dnc.repository'
import { safeError } from '@/lib/utils/log-sanitizer'
import { sendEmail } from '@/lib/services/outreach/email-sender.service'
import Anthropic from '@anthropic-ai/sdk'

// Lazy-initialized Anthropic client (same pattern as campaign-reply.ts)
let anthropicClient: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set')
    }
    anthropicClient = new Anthropic({ apiKey })
  }
  return anthropicClient
}

async function generateFollowUpWithClaude(
  firstName: string,
  objective: string,
  calUrl: string | null,
): Promise<string> {
  const client = getAnthropicClient()

  const prompt = `Generate a brief, natural follow-up email (50-80 words) for a lead who replied to our cold outreach but hasn't heard back.

Lead: ${firstName}
Campaign objective: ${objective}
Booking link: ${calUrl || 'https://cal.com/gotdarrenhill/30min'}

The email should:
- Reference that we connected previously
- Be low-pressure, curious tone
- End with a clear CTA to book a call
- Sound human, not templated

Respond with just the email body text, no subject line.`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  })

  if (!response.content || response.content.length === 0 || response.content[0].type !== 'text') {
    throw new Error('Empty response from Claude')
  }

  return response.content[0].text.trim()
}

export const sdrFollowupCron = inngest.createFunction(
  { id: 'sdr-followup-cron', retries: 1, timeouts: { finish: '10m' }, concurrency: { limit: 1 } },
  { cron: 'TZ=America/Chicago 0 9 * * 1-5' }, // 9am CT weekdays
  async ({ step, logger }) => {
    // Step 1: Load all workspaces with follow-up enabled
    const configs = await step.run('load-configs', async () => {
      const { data } = await createAdminClient()
        .from('sdr_configurations')
        .select('*')
        .eq('follow_up_enabled', true)
      return data || []
    })

    logger.info(`[SDR Follow-up] Processing ${configs.length} workspaces`)

    for (const config of configs) {
      await step.run(`followup-${config.workspace_id}`, async () => {
        const supabase = createAdminClient()
        const dncRepo = new DncRepository()

        // Find leads that replied but haven't heard back in follow_up_interval_days
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - config.follow_up_interval_days)

        const { data: leads } = await supabase
          .from('campaign_leads')
          .select('id, lead_id, campaign_id, leads!inner(email, first_name), email_campaigns!inner(name)')
          .eq('status', 'replied')
          .lt('replied_at', cutoff.toISOString())
          .limit(20)

        for (const lead of leads || []) {
          try {
            const leadData = lead.leads as unknown as { email: string; first_name: string | null }
            const campaignData = lead.email_campaigns as unknown as { name: string }
            const isBlocked = await dncRepo.isBlocked(config.workspace_id, leadData.email)
            if (isBlocked) continue

            // Count how many follow-ups already sent
            const { count } = await supabase
              .from('email_replies')
              .select('id', { count: 'exact', head: true })
              .eq('lead_id', lead.lead_id)
              .eq('workspace_id', config.workspace_id)
              .in('draft_status', ['sent'])

            if ((count || 0) >= config.follow_up_count) continue

            const firstName = leadData.first_name || 'there'
            const campaignName = campaignData?.name || ''

            logger.info(
              `[SDR Follow-up] Generating follow-up for lead ${lead.lead_id} in workspace ${config.workspace_id}`
            )

            // Generate follow-up body via Claude Haiku
            let generatedBody: string
            try {
              generatedBody = await generateFollowUpWithClaude(
                firstName,
                config.objective,
                config.cal_booking_url,
              )
            } catch (claudeErr) {
              safeError('[SDR Follow-up] Claude generation failed:', claudeErr)
              continue
            }

            const agentName = [config.agent_first_name, config.agent_last_name]
              .filter(Boolean)
              .join(' ')
            const fromEmail =
              config.notification_email ||
              process.env.OUTREACH_FROM_EMAIL ||
              'team@meetcursive.com'

            if (config.human_in_the_loop) {
              // Queue for human approval — insert with needs_approval
              const { error: insertErr } = await supabase.from('email_replies').insert({
                workspace_id: config.workspace_id,
                campaign_id: lead.campaign_id,
                lead_id: lead.lead_id,
                from_email: fromEmail,
                from_name: agentName || 'Cursive SDR',
                subject: `Re: ${campaignName || 'Following up'}`,
                body_text: generatedBody,
                received_at: new Date().toISOString(),
                suggested_response: generatedBody,
                response_generated_at: new Date().toISOString(),
                draft_status: 'needs_approval',
                status: 'new',
                suggested_response_metadata: {
                  generated_via: 'claude-haiku',
                  generated_by: 'sdr-followup-cron',
                  campaign_name: campaignName,
                },
              })

              if (insertErr) {
                safeError('[SDR Follow-up] Failed to insert HiL draft:', insertErr)
              } else {
                logger.info(
                  `[SDR Follow-up] Queued follow-up for approval — lead ${lead.lead_id}`
                )
              }
            } else {
              // Auto-send immediately
              const result = await sendEmail({
                to: leadData.email,
                from: fromEmail,
                fromName: agentName || undefined,
                subject: `Re: ${campaignName || 'Following up'}`,
                bodyText: generatedBody,
                replyTo: fromEmail,
                ...(config.auto_bcc_address ? { bcc: config.auto_bcc_address } : {}),
              })

              // Record the send in email_replies regardless of provider success
              const { error: insertErr } = await supabase.from('email_replies').insert({
                workspace_id: config.workspace_id,
                campaign_id: lead.campaign_id,
                lead_id: lead.lead_id,
                from_email: fromEmail,
                from_name: agentName || 'Cursive SDR',
                subject: `Re: ${campaignName || 'Following up'}`,
                body_text: generatedBody,
                received_at: new Date().toISOString(),
                suggested_response: generatedBody,
                response_generated_at: new Date().toISOString(),
                draft_status: 'sent',
                status: result.success ? 'responded' : 'new',
                suggested_response_metadata: {
                  generated_via: 'claude-haiku',
                  generated_by: 'sdr-followup-cron',
                  auto_sent: result.success,
                  auto_sent_at: new Date().toISOString(),
                  auto_sent_provider: result.provider,
                  auto_sent_message_id: result.messageId,
                  campaign_name: campaignName,
                },
              })

              if (insertErr) {
                safeError('[SDR Follow-up] Failed to insert sent record:', insertErr)
              }

              if (result.success) {
                logger.info(
                  `[SDR Follow-up] Auto-sent follow-up for lead ${lead.lead_id} via ${result.provider}`
                )
              } else {
                logger.info(
                  `[SDR Follow-up] Send failed for lead ${lead.lead_id}: ${result.error}`
                )
              }
            }
          } catch (e) {
            safeError('[SDR Follow-up] Error processing lead:', e)
          }
        }
      })
    }
  }
)
