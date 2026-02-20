/**
 * GHL Pipeline Lifecycle Manager
 *
 * Centralized function that tracks every customer through Cursive's
 * Agency OS Sales pipeline in GHL. Every significant event triggers
 * a pipeline stage change, tag update, or note — so Adam can see
 * exactly where every customer is at any time.
 *
 * Pipeline: Agency OS Sales (DDSchN74J4hfiFs5em4H)
 * Stages: NEW_LEAD → CALL_BOOKED → QUALIFIED_PROPOSAL → WON → LOST
 *
 * Lifecycle Events Tracked:
 *   - First purchase (credit/lead)     → NEW_LEAD + tags
 *   - DFY subscription payment         → QUALIFIED_PROPOSAL + tags
 *   - Sub-account created              → WON + "subaccount-created" tag
 *   - Onboarding form completed        → "onboarding-complete" tag + note
 *   - Pixel goes live                  → "pixel-live" tag
 *   - First leads delivered            → "receiving-leads" tag
 *   - Subscription cancelled           → LOST
 */

import { inngest } from '../client'
import {
  findCursiveContactByEmail,
  addCursiveContactTags,
  updateCursiveOpportunityStage,
  updateCursiveContact,
  GHL_STAGES,
} from '@/lib/integrations/ghl-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSlackAlert } from '@/lib/monitoring/alerts'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

/**
 * Track pipeline lifecycle events
 * Listens to a custom event that other functions emit
 */
export const ghlPipelineLifecycle = inngest.createFunction(
  {
    id: 'ghl-pipeline-lifecycle',
    name: 'GHL Pipeline Lifecycle Tracker',
    retries: 3,
  },
  { event: 'ghl/pipeline.update' },
  async ({ event, step }) => {
    const {
      user_email,
      workspace_id,
      lifecycle_event,
      metadata,
    } = event.data

    safeLog(`[Pipeline Lifecycle] ${lifecycle_event} for ${user_email}`)

    // Step 1: Find the contact in Cursive's GHL
    const contactId = await step.run('find-contact', async () => {
      const id = await findCursiveContactByEmail(user_email)
      if (!id) {
        safeLog(`[Pipeline Lifecycle] Contact not found for ${user_email}, skipping`)
      }
      return id
    })

    if (!contactId) {
      return { skipped: true, reason: 'contact_not_found' }
    }

    // Step 2: Find the opportunity ID from workspace settings
    const opportunityId = await step.run('find-opportunity', async () => {
      const supabase = createAdminClient()
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('settings')
        .eq('id', workspace_id)
        .maybeSingle()

      const settings = (workspace?.settings as Record<string, unknown>) || {}
      return (settings.ghl_opportunity_id as string) || null
    })

    // Step 3: Apply lifecycle changes based on event type
    await step.run('apply-lifecycle-changes', async () => {
      switch (lifecycle_event) {
        case 'subaccount_created': {
          // Move to WON — they paid and sub-account is provisioned
          if (opportunityId) {
            await updateCursiveOpportunityStage(
              opportunityId,
              GHL_STAGES.WON,
              'won'
            )
          }
          await addCursiveContactTags(contactId, [
            'subaccount-created',
            'dfy-active',
            `setup-date-${new Date().toISOString().split('T')[0]}`,
          ])
          break
        }

        case 'onboarding_completed': {
          await addCursiveContactTags(contactId, [
            'onboarding-complete',
            `onboarded-${new Date().toISOString().split('T')[0]}`,
          ])
          // Update contact with onboarding details if provided
          if (metadata?.website_url) {
            await updateCursiveContact(contactId, {
              customFields: [
                ...(metadata.website_url
                  ? [{ id: 'website', value: metadata.website_url }]
                  : []),
              ],
            })
          }
          break
        }

        case 'pixel_live': {
          await addCursiveContactTags(contactId, [
            'pixel-live',
            `pixel-date-${new Date().toISOString().split('T')[0]}`,
          ])
          break
        }

        case 'first_leads_delivered': {
          await addCursiveContactTags(contactId, [
            'receiving-leads',
            `first-leads-${new Date().toISOString().split('T')[0]}`,
          ])
          break
        }

        case 'subscription_cancelled': {
          if (opportunityId) {
            await updateCursiveOpportunityStage(
              opportunityId,
              GHL_STAGES.LOST,
              'lost'
            )
          }
          await addCursiveContactTags(contactId, [
            'churned',
            `cancelled-${new Date().toISOString().split('T')[0]}`,
          ])
          break
        }

        case 'subscription_renewed': {
          await addCursiveContactTags(contactId, [
            'renewed',
            `renewal-${new Date().toISOString().split('T')[0]}`,
          ])
          break
        }

        case 'credit_purchase': {
          const amount = metadata?.amount || 0
          await addCursiveContactTags(contactId, [
            'credit-buyer',
            ...(amount >= 500 ? ['high-value'] : []),
            `purchase-${new Date().toISOString().split('T')[0]}`,
          ])
          break
        }

        case 'lead_purchase': {
          await addCursiveContactTags(contactId, [
            'lead-buyer',
            `purchase-${new Date().toISOString().split('T')[0]}`,
          ])
          break
        }

        default:
          safeLog(`[Pipeline Lifecycle] Unknown lifecycle event: ${lifecycle_event}`)
      }
    })

    // Step 4: Send Slack notification for significant events
    await step.run('notify-slack', async () => {
      const significantEvents = new Set([
        'subaccount_created',
        'onboarding_completed',
        'pixel_live',
        'first_leads_delivered',
        'subscription_cancelled',
      ])

      if (significantEvents.has(lifecycle_event)) {
        try {
          await sendSlackAlert({
            type: 'pipeline_update',
            severity: lifecycle_event === 'subscription_cancelled' ? 'warning' : 'info',
            message: `Pipeline update: ${lifecycle_event.replace(/_/g, ' ')} — ${user_email}`,
            metadata: {
              email: user_email,
              workspace_id,
              event: lifecycle_event,
              ...metadata,
            },
          })
        } catch {
          // Slack is optional
        }
      }
    })

    return {
      success: true,
      contactId,
      lifecycleEvent: lifecycle_event,
    }
  }
)
