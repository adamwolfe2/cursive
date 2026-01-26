// Campaign Lead Enrichment
// Enriches leads added to campaigns with AI-powered research

import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'

// Mock flag for development when API keys aren't available
const USE_MOCKS = !process.env.ANTHROPIC_API_KEY

interface EnrichmentData {
  company_summary?: string
  recent_news?: string[]
  key_challenges?: string[]
  personalization_hooks?: string[]
  enriched_at: string
}

export const enrichCampaignLead = inngest.createFunction(
  {
    id: 'campaign-lead-enrichment',
    name: 'Campaign Lead Enrichment',
    retries: 3,
    throttle: {
      limit: 10,
      period: '1m',
    },
  },
  { event: 'campaign/lead-added' },
  async ({ event, step, logger }) => {
    const { campaign_lead_id, campaign_id, lead_id, workspace_id } = event.data

    // Step 1: Fetch lead and campaign data
    const { lead, campaign } = await step.run('fetch-data', async () => {
      const supabase = await createClient()

      const [leadResult, campaignResult] = await Promise.all([
        supabase
          .from('leads')
          .select('*')
          .eq('id', lead_id)
          .single(),
        supabase
          .from('email_campaigns')
          .select('*')
          .eq('id', campaign_id)
          .single(),
      ])

      if (leadResult.error) {
        throw new Error(`Failed to fetch lead: ${leadResult.error.message}`)
      }
      if (campaignResult.error) {
        throw new Error(`Failed to fetch campaign: ${campaignResult.error.message}`)
      }

      return { lead: leadResult.data, campaign: campaignResult.data }
    })

    logger.info(`Enriching campaign lead: ${campaign_lead_id} for ${lead.company_name}`)

    // Step 2: Research company and generate personalization
    const enrichmentData = await step.run('enrich-lead', async () => {
      if (USE_MOCKS) {
        logger.info('[MOCK] Generating mock enrichment data')
        return generateMockEnrichment(lead)
      }

      // Real enrichment using Claude
      return await enrichWithClaude(lead, campaign, logger)
    })

    // Step 3: Match to best value proposition
    const valuePropMatch = await step.run('match-value-prop', async () => {
      const valueProps = campaign.value_propositions as Array<{
        id: string
        name: string
        description: string
        target_segments?: string[]
      }> || []

      if (valueProps.length === 0) {
        return { matched_id: null, reasoning: 'No value propositions defined' }
      }

      if (USE_MOCKS) {
        // Mock: return first value prop
        return {
          matched_id: valueProps[0].id,
          reasoning: 'Mock selection: first value proposition',
        }
      }

      // Real matching would use AI to select best fit
      // For now, use simple matching based on industry/challenges
      const industry = lead.company_industry?.toLowerCase() || ''

      for (const vp of valueProps) {
        const segments = vp.target_segments || []
        if (segments.some((s) => industry.includes(s.toLowerCase()))) {
          return {
            matched_id: vp.id,
            reasoning: `Matched to "${vp.name}" based on industry alignment`,
          }
        }
      }

      // Default to first if no match
      return {
        matched_id: valueProps[0].id,
        reasoning: `Default selection: "${valueProps[0].name}"`,
      }
    })

    // Step 4: Update campaign_lead record
    await step.run('update-campaign-lead', async () => {
      const supabase = await createClient()

      const { error } = await supabase
        .from('campaign_leads')
        .update({
          enrichment_data: enrichmentData,
          enriched_at: new Date().toISOString(),
          matched_value_prop_id: valuePropMatch.matched_id,
          match_reasoning: valuePropMatch.reasoning,
          status: 'ready',
        })
        .eq('id', campaign_lead_id)

      if (error) {
        throw new Error(`Failed to update campaign lead: ${error.message}`)
      }

      logger.info(`Campaign lead ${campaign_lead_id} enriched and ready`)
    })

    // Step 5: Trigger email composition
    await step.run('trigger-composition', async () => {
      await inngest.send({
        name: 'campaign/compose-email',
        data: {
          campaign_lead_id,
          campaign_id,
          lead_id,
          workspace_id,
        },
      })

      logger.info(`Composition triggered for campaign lead ${campaign_lead_id}`)
    })

    return {
      success: true,
      campaign_lead_id,
      enrichment: enrichmentData,
      value_prop_match: valuePropMatch,
    }
  }
)

// Batch enrich multiple campaign leads
export const batchEnrichCampaignLeads = inngest.createFunction(
  {
    id: 'batch-campaign-lead-enrichment',
    name: 'Batch Campaign Lead Enrichment',
    retries: 2,
  },
  { event: 'campaign/batch-enrich' },
  async ({ event, step, logger }) => {
    const { campaign_id, workspace_id } = event.data

    // Fetch all pending leads for this campaign
    const pendingLeads = await step.run('fetch-pending-leads', async () => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('campaign_leads')
        .select('id, lead_id')
        .eq('campaign_id', campaign_id)
        .eq('status', 'pending')
        .limit(50)

      if (error) {
        throw new Error(`Failed to fetch pending leads: ${error.message}`)
      }

      return data || []
    })

    logger.info(`Found ${pendingLeads.length} pending leads to enrich`)

    // Send individual enrichment events for each lead
    await step.run('send-enrichment-events', async () => {
      const events = pendingLeads.map((cl) => ({
        name: 'campaign/lead-added' as const,
        data: {
          campaign_lead_id: cl.id,
          campaign_id,
          lead_id: cl.lead_id,
          workspace_id,
        },
      }))

      if (events.length > 0) {
        await inngest.send(events)
      }
    })

    return {
      success: true,
      campaign_id,
      leads_queued: pendingLeads.length,
    }
  }
)

// Helper: Generate mock enrichment data for development
function generateMockEnrichment(lead: any): EnrichmentData {
  return {
    company_summary: `${lead.company_name} is a ${lead.company_industry || 'technology'} company focused on innovation and growth.`,
    recent_news: [
      `${lead.company_name} announces new product launch`,
      `Industry report mentions ${lead.company_name} as key player`,
    ],
    key_challenges: [
      'Scaling operations efficiently',
      'Improving team productivity',
      'Reducing operational costs',
    ],
    personalization_hooks: [
      `Your role as ${lead.job_title} at a growing company`,
      `${lead.company_name}'s focus on ${lead.company_industry || 'innovation'}`,
    ],
    enriched_at: new Date().toISOString(),
  }
}

// Helper: Enrich with Claude AI (real implementation)
async function enrichWithClaude(
  lead: any,
  campaign: any,
  logger: any
): Promise<EnrichmentData> {
  // TODO: Implement real Claude API call for enrichment
  // This would:
  // 1. Research the company using web search or company database
  // 2. Generate personalization hooks
  // 3. Identify key challenges relevant to our value props

  logger.info(`[REAL] Would enrich ${lead.company_name} with Claude API`)

  // For now, return mock data even in "real" mode until API is integrated
  return generateMockEnrichment(lead)
}
