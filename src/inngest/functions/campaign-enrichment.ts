// Campaign Lead Enrichment
// Enriches leads added to campaigns with AI-powered research

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'

// Mock flag for development when API keys aren't available
const USE_MOCKS = !process.env.ANTHROPIC_API_KEY

// Lazy-initialized Anthropic client
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
    timeouts: { finish: "5m" },
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
      const supabase = createAdminClient()

      const [leadResult, campaignResult] = await Promise.all([
        supabase
          .from('leads')
          .select('*')
          .eq('id', lead_id)
          .maybeSingle(),
        supabase
          .from('email_campaigns')
          .select('*')
          .eq('id', campaign_id)
          .maybeSingle(),
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

      // Use AI to intelligently match value proposition
      return await matchValuePropWithClaude(lead, enrichmentData, valueProps, logger)
    })

    // Step 4: Update campaign_lead record
    await step.run('update-campaign-lead', async () => {
      const supabase = createAdminClient()

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
    timeouts: { finish: "5m" },
  },
  { event: 'campaign/batch-enrich' },
  async ({ event, step, logger }) => {
    const { campaign_id, workspace_id } = event.data

    // Fetch all pending leads for this campaign
    const pendingLeads = await step.run('fetch-pending-leads', async () => {
      const supabase = createAdminClient()

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
  logger.info(`[REAL] Enriching ${lead.company_name} with Claude API`)

  const client = getAnthropicClient()

  // Build context from available lead data
  const companyContext = [
    `Company: ${lead.company_name}`,
    lead.company_domain ? `Domain: ${lead.company_domain}` : null,
    lead.company_industry ? `Industry: ${lead.company_industry}` : null,
    lead.company_size ? `Size: ${lead.company_size}` : null,
    lead.company_location ? `Location: ${JSON.stringify(lead.company_location)}` : null,
    lead.job_title ? `Contact Title: ${lead.job_title}` : null,
  ].filter(Boolean).join('\n')

  // Get value propositions for context
  const valueProps = campaign.value_propositions as Array<{
    name: string
    description: string
  }> || []

  const valuePropsContext = valueProps.length > 0
    ? `\n\nOur Value Propositions:\n${valueProps.map(vp => `- ${vp.name}: ${vp.description}`).join('\n')}`
    : ''

  const prompt = `You are a B2B sales research analyst. Research this company and provide actionable insights for personalized outreach.

${companyContext}
${valuePropsContext}

Analyze this company and provide:
1. A concise company summary (2-3 sentences about what they do and their market position)
2. Recent news or developments (3-5 bullet points, or note if limited information)
3. Key challenges they likely face (3-5 pain points relevant to their industry/size)
4. Personalization hooks for outreach (3-5 specific angles we can use to connect)

Respond ONLY with valid JSON in this exact format:
{
  "company_summary": "Brief summary of the company",
  "recent_news": ["Recent development 1", "Recent development 2"],
  "key_challenges": ["Challenge 1", "Challenge 2", "Challenge 3"],
  "personalization_hooks": ["Hook 1 based on their role/company", "Hook 2 based on industry trends"]
}

If you don't have specific information, make reasonable inferences based on their industry and company size. Be specific and actionable.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    if (!response.content || response.content.length === 0) {
      logger.warn('Empty response from Claude API, using mock data')
      return generateMockEnrichment(lead)
    }

    const content = response.content[0]
    if (content.type !== 'text') {
      logger.warn('Unexpected response type from Claude, using mock data')
      return generateMockEnrichment(lead)
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      logger.warn('No JSON found in Claude response, using mock data')
      return generateMockEnrichment(lead)
    }

    const enrichment = JSON.parse(jsonMatch[0])

    return {
      company_summary: enrichment.company_summary || `${lead.company_name} is a company in the ${lead.company_industry || 'technology'} sector.`,
      recent_news: enrichment.recent_news || [],
      key_challenges: enrichment.key_challenges || [],
      personalization_hooks: enrichment.personalization_hooks || [],
      enriched_at: new Date().toISOString(),
    }
  } catch (error) {
    logger.error(`Claude API error during enrichment: ${error}`)
    // Graceful fallback to mock data
    return generateMockEnrichment(lead)
  }
}

// Helper: Match value proposition with Claude AI
async function matchValuePropWithClaude(
  lead: any,
  enrichmentData: EnrichmentData,
  valueProps: Array<{ id: string; name: string; description: string; target_segments?: string[] }>,
  logger: any
): Promise<{ matched_id: string; reasoning: string }> {
  if (valueProps.length === 0) {
    return { matched_id: '', reasoning: 'No value propositions defined' }
  }

  if (valueProps.length === 1) {
    return { matched_id: valueProps[0].id, reasoning: 'Only one value proposition available' }
  }

  const client = getAnthropicClient()

  const prompt = `You are a sales strategist. Match this lead to the most appropriate value proposition.

LEAD INFORMATION:
- Company: ${lead.company_name}
- Industry: ${lead.company_industry || 'Unknown'}
- Size: ${lead.company_size || 'Unknown'}
- Contact Title: ${lead.job_title || 'Unknown'}

ENRICHMENT DATA:
- Summary: ${enrichmentData.company_summary || 'N/A'}
- Key Challenges: ${enrichmentData.key_challenges?.join(', ') || 'N/A'}

VALUE PROPOSITIONS:
${valueProps.map((vp, i) => `${i + 1}. ${vp.name}: ${vp.description}${vp.target_segments?.length ? ` (Targets: ${vp.target_segments.join(', ')})` : ''}`).join('\n')}

Which value proposition (1-${valueProps.length}) best matches this lead? Consider:
1. Industry alignment
2. Company size fit
3. Likely pain points
4. Contact's role and priorities

Respond with JSON:
{
  "selected": 1,
  "reasoning": "Brief explanation of why this value prop is the best fit"
}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })

    if (!response.content || response.content.length === 0 || response.content[0].type !== 'text') {
      return { matched_id: valueProps[0].id, reasoning: 'Default selection (API response issue)' }
    }

    const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { matched_id: valueProps[0].id, reasoning: 'Default selection (parsing issue)' }
    }

    const result = JSON.parse(jsonMatch[0])
    const selectedIndex = Math.max(0, Math.min(valueProps.length - 1, (result.selected || 1) - 1))

    return {
      matched_id: valueProps[selectedIndex].id,
      reasoning: result.reasoning || `Selected "${valueProps[selectedIndex].name}" based on AI analysis`,
    }
  } catch (error) {
    logger.warn(`Claude API error during value prop matching: ${error}`)
    return { matched_id: valueProps[0].id, reasoning: 'Default selection (API error)' }
  }
}
