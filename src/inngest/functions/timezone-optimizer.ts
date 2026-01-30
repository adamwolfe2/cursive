/**
 * Timezone Optimizer
 * Periodically recalculates optimal send times for campaign leads
 */

import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import {
  updateCampaignLeadOptimalTimes,
  inferTimezone,
} from '@/lib/services/campaign/timezone-scheduling.service'

/**
 * Recalculate optimal send times for all active campaigns
 * Runs every 6 hours to keep optimal times fresh
 */
export const recalculateOptimalTimes = inngest.createFunction(
  {
    id: 'recalculate-optimal-send-times',
    name: 'Recalculate Optimal Send Times',
    retries: 2,
    timeout: 300000, // 5 minutes
  },
  { cron: '0 */6 * * *' }, // Every 6 hours
  async ({ step, logger }) => {
    // Get all active campaigns
    const campaigns = await step.run('get-active-campaigns', async () => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('email_campaigns')
        .select('id, name, workspace_id')
        .eq('status', 'active')

      if (error) {
        throw new Error(`Failed to fetch campaigns: ${error.message}`)
      }

      return data || []
    })

    logger.info(`Recalculating optimal times for ${campaigns.length} active campaigns`)

    if (campaigns.length === 0) {
      return { success: true, campaigns_processed: 0 }
    }

    // Process each campaign
    const results = await step.run('process-campaigns', async () => {
      const processed: Array<{
        campaign_id: string
        name: string
        leads_updated: number
        errors_count: number
      }> = []

      for (const campaign of campaigns) {
        try {
          const result = await updateCampaignLeadOptimalTimes(campaign.id)
          processed.push({
            campaign_id: campaign.id,
            name: campaign.name,
            leads_updated: result.updated,
            errors_count: result.errors.length,
          })
        } catch (error: any) {
          logger.warn(`Failed to update campaign ${campaign.id}: ${error.message}`)
          processed.push({
            campaign_id: campaign.id,
            name: campaign.name,
            leads_updated: 0,
            errors_count: 1,
          })
        }
      }

      return processed
    })

    const totalUpdated = results.reduce((sum, r) => sum + r.leads_updated, 0)
    logger.info(`Recalculated optimal times for ${totalUpdated} leads across ${campaigns.length} campaigns`)

    return {
      success: true,
      campaigns_processed: campaigns.length,
      total_leads_updated: totalUpdated,
      details: results,
    }
  }
)

/**
 * Infer timezone for leads missing timezone data
 * Runs daily to fill in missing timezones based on company location/domain
 */
export const inferLeadTimezones = inngest.createFunction(
  {
    id: 'infer-lead-timezones',
    name: 'Infer Lead Timezones',
    retries: 2,
    timeout: 300000, // 5 minutes
  },
  { cron: '30 2 * * *' }, // Daily at 2:30 AM UTC
  async ({ step, logger }) => {
    // Find leads missing timezone
    const leadsToUpdate = await step.run('find-leads-without-timezone', async () => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('leads')
        .select('id, company_location, company_domain')
        .is('timezone', null)
        .limit(500)

      if (error) {
        throw new Error(`Failed to fetch leads: ${error.message}`)
      }

      return data || []
    })

    logger.info(`Found ${leadsToUpdate.length} leads without timezone`)

    if (leadsToUpdate.length === 0) {
      return { success: true, leads_updated: 0 }
    }

    // Infer and update timezones
    const result = await step.run('infer-timezones', async () => {
      const supabase = await createClient()
      let updated = 0
      let errors = 0

      for (const lead of leadsToUpdate) {
        try {
          const inferred = await inferTimezone(
            lead.company_location as any,
            lead.company_domain
          )

          // Only update if we have reasonable confidence
          if (inferred.confidence >= 0.5) {
            const { error: updateError } = await supabase
              .from('leads')
              .update({
                timezone: inferred.timezone,
                timezone_source: inferred.source,
              })
              .eq('id', lead.id)

            if (updateError) {
              errors++
            } else {
              updated++
            }
          }
        } catch {
          errors++
        }
      }

      return { updated, errors }
    })

    logger.info(`Inferred timezones for ${result.updated} leads (${result.errors} errors)`)

    return {
      success: true,
      leads_processed: leadsToUpdate.length,
      leads_updated: result.updated,
      errors: result.errors,
    }
  }
)

/**
 * Update optimal times when a campaign's schedule changes
 */
export const onCampaignScheduleChanged = inngest.createFunction(
  {
    id: 'on-campaign-schedule-changed',
    name: 'Handle Campaign Schedule Change',
    retries: 2,
    timeout: 300000, // 5 minutes
  },
  { event: 'campaign/schedule-changed' },
  async ({ event, step, logger }) => {
    const { campaign_id, workspace_id } = event.data

    logger.info(`Campaign ${campaign_id} schedule changed, recalculating optimal times`)

    // Recalculate optimal send times
    const result = await step.run('recalculate-optimal-times', async () => {
      return await updateCampaignLeadOptimalTimes(campaign_id)
    })

    logger.info(`Updated ${result.updated} leads for campaign ${campaign_id}`)

    return {
      success: true,
      campaign_id,
      leads_updated: result.updated,
      errors: result.errors.length > 0 ? result.errors : undefined,
    }
  }
)

/**
 * Update lead timezone when enrichment data is received
 */
export const updateLeadTimezoneFromEnrichment = inngest.createFunction(
  {
    id: 'update-lead-timezone-from-enrichment',
    name: 'Update Lead Timezone from Enrichment',
    timeout: 300000, // 5 minutes
  },
  { event: 'lead/enrichment-complete' },
  async ({ event, step, logger }) => {
    const { lead_id, enrichment_data } = event.data

    // Check if enrichment includes location data
    if (!enrichment_data?.company_location) {
      return { success: true, updated: false, reason: 'no_location_data' }
    }

    // Infer timezone from location
    const inferred = await step.run('infer-timezone', async () => {
      return await inferTimezone(
        enrichment_data.company_location,
        enrichment_data.company_domain
      )
    })

    // Only update if confident
    if (inferred.confidence < 0.5) {
      return { success: true, updated: false, reason: 'low_confidence' }
    }

    // Update lead timezone
    await step.run('update-lead', async () => {
      const supabase = await createClient()

      const { error } = await supabase
        .from('leads')
        .update({
          timezone: inferred.timezone,
          timezone_source: inferred.source,
        })
        .eq('id', lead_id)

      if (error) {
        throw new Error(`Failed to update lead timezone: ${error.message}`)
      }
    })

    logger.info(`Updated lead ${lead_id} timezone to ${inferred.timezone}`)

    return {
      success: true,
      updated: true,
      timezone: inferred.timezone,
      source: inferred.source,
      confidence: inferred.confidence,
    }
  }
)
