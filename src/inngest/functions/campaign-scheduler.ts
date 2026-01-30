/**
 * Campaign Scheduler Functions
 * Handles scheduled campaign activation and auto-completion
 */

import { inngest } from '../client'
import {
  getScheduledCampaignsToActivate,
  transitionCampaignStatus,
  autoCompleteCampaigns,
  validateCampaignForActivation,
} from '@/lib/services/campaign/campaign-state-machine'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCampaignCompletedEmail } from '@/lib/email/service'

/**
 * Activate scheduled campaigns
 * Runs every 15 minutes to check for campaigns that should start
 */
export const activateScheduledCampaigns = inngest.createFunction(
  {
    id: 'activate-scheduled-campaigns',
    name: 'Activate Scheduled Campaigns',
    retries: 2,
    timeout: 300000, // 5 minutes
  },
  { cron: '*/15 * * * *' }, // Every 15 minutes
  async ({ step, logger }) => {
    // Step 1: Get campaigns ready for activation
    const campaignsToActivate = await step.run('get-scheduled-campaigns', async () => {
      return await getScheduledCampaignsToActivate()
    })

    logger.info(`Found ${campaignsToActivate.length} campaigns to activate`)

    if (campaignsToActivate.length === 0) {
      return { activated: 0, failed: 0 }
    }

    // Step 2: Validate and activate each campaign
    const results = await step.run('activate-campaigns', async () => {
      const activated: string[] = []
      const failed: Array<{ id: string; name: string; error: string }> = []

      for (const campaign of campaignsToActivate) {
        // Validate campaign is ready
        const validation = await validateCampaignForActivation(
          campaign.id,
          campaign.workspace_id
        )

        if (!validation.valid) {
          failed.push({
            id: campaign.id,
            name: campaign.name,
            error: validation.errors.join('; '),
          })
          continue
        }

        // Transition to active
        const result = await transitionCampaignStatus(
          { campaignId: campaign.id, workspaceId: campaign.workspace_id },
          'active'
        )

        if (result.success) {
          activated.push(campaign.id)
          logger.info(`Activated campaign: ${campaign.name} (${campaign.id})`)
        } else {
          failed.push({
            id: campaign.id,
            name: campaign.name,
            error: result.error || 'Unknown error',
          })
          logger.warn(`Failed to activate campaign ${campaign.name}: ${result.error}`)
        }
      }

      return { activated, failed }
    })

    // Step 3: Trigger batch enrichment for newly activated campaigns
    if (results.activated.length > 0) {
      await step.run('trigger-enrichment', async () => {
        // Queue batch enrichment for each activated campaign
        const events = campaignsToActivate
          .filter((c) => results.activated.includes(c.id))
          .map((campaign) => ({
            name: 'campaign/batch-enrich' as const,
            data: {
              campaign_id: campaign.id,
              workspace_id: campaign.workspace_id,
            },
          }))

        if (events.length > 0) {
          await inngest.send(events)
        }
      })
    }

    return {
      activated: results.activated.length,
      failed: results.failed.length,
      details: results,
    }
  }
)

/**
 * Auto-complete campaigns that have finished all sequences
 * Runs hourly to check for campaigns with no pending leads
 */
export const autoCompleteCampaignsCron = inngest.createFunction(
  {
    id: 'auto-complete-campaigns',
    name: 'Auto-Complete Finished Campaigns',
    retries: 2,
    timeout: 300000, // 5 minutes
  },
  { cron: '0 * * * *' }, // Every hour
  async ({ step, logger }) => {
    const completedIds = await step.run('check-and-complete', async () => {
      return await autoCompleteCampaigns()
    })

    if (completedIds.length > 0) {
      logger.info(`Auto-completed ${completedIds.length} campaigns: ${completedIds.join(', ')}`)
    }

    return {
      completed: completedIds.length,
      campaign_ids: completedIds,
    }
  }
)

/**
 * Handle campaign status transition event
 * Triggered when a campaign status is programmatically changed
 */
export const onCampaignStatusChange = inngest.createFunction(
  {
    id: 'campaign-status-change-handler',
    name: 'Campaign Status Change Handler',
    timeout: 300000, // 5 minutes
  },
  { event: 'campaign/status-changed' },
  async ({ event, step, logger }) => {
    const { campaign_id, workspace_id, old_status, new_status } = event.data

    logger.info(`Campaign ${campaign_id} transitioned from ${old_status} to ${new_status}`)

    // Handle specific transitions
    if (new_status === 'active' && old_status !== 'paused') {
      // Campaign just became active - trigger initial enrichment
      await step.run('trigger-initial-enrichment', async () => {
        await inngest.send({
          name: 'campaign/batch-enrich',
          data: {
            campaign_id,
            workspace_id,
          },
        })
      })
    }

    if (new_status === 'completed') {
      // Campaign completed - send notification to workspace owner
      logger.info(`Campaign ${campaign_id} completed`)

      await step.run('send-completion-notification', async () => {
        const supabase = createAdminClient()

        // Get campaign details with workspace owner
        const { data: campaign } = await supabase
          .from('email_campaigns')
          .select(`
            id,
            name,
            total_sent,
            total_opened,
            total_clicked,
            total_replied,
            workspaces!inner (
              id
            )
          `)
          .eq('id', campaign_id)
          .single()

        if (!campaign) {
          logger.error(`Campaign ${campaign_id} not found for notification`)
          return
        }

        // Get workspace owner
        const { data: owner } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('workspace_id', workspace_id)
          .eq('role', 'owner')
          .single()

        if (!owner) {
          logger.warn(`No owner found for workspace ${workspace_id}`)
          return
        }

        // Send completion email
        await sendCampaignCompletedEmail(
          owner.email,
          owner.full_name || 'there',
          campaign.name,
          campaign.id,
          {
            totalSent: campaign.total_sent || 0,
            opened: campaign.total_opened || 0,
            clicked: campaign.total_clicked || 0,
            replied: campaign.total_replied || 0,
          }
        )

        logger.info(`Sent completion notification for campaign ${campaign_id} to ${owner.email}`)
      })
    }

    return { success: true }
  }
)
