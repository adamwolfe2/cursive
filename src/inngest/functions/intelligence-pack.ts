/**
 * Intelligence Pack — On-demand Tier 2 and Tier 3 enrichment
 * Triggered: enrichment/intelligence-pack event
 * Event data: { lead_id, workspace_id, tier: 'intel' | 'deep_research' }
 */

import { inngest } from '../client'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog } from '@/lib/utils/log-sanitizer'
import {
  getLinkedInProfile,
  getSocialIntel,
  getNewsMentions,
  deepResearchPerson,
  trackCost,
  checkInvocationLimit,
} from '@/lib/services/intelligence'

const CREDIT_COSTS = {
  intel: 2,
  deep_research: 10,
} as const

export const intelligencePack = inngest.createFunction(
  {
    id: 'intelligence-pack',
    name: 'Intelligence Pack Enrichment',
    retries: 2,
    timeouts: { finish: '10m' },
    concurrency: { limit: 5 },
  },
  { event: 'enrichment/intelligence-pack' },
  async ({ event, step, logger }) => {
    const { lead_id, workspace_id, tier } = event.data as {
      lead_id: string
      workspace_id: string
      tier: 'intel' | 'deep_research'
    }

    logger.info(`Intelligence pack (${tier}) for lead ${lead_id}`)

    // Step 1: Fetch lead + verify credits already deducted
    const lead = await step.run('fetch-lead', async () => {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('leads')
        .select(
          'id, first_name, last_name, full_name, email, company_name, company_domain, job_title, linkedin_url, intelligence_tier'
        )
        .eq('id', lead_id)
        .eq('workspace_id', workspace_id)
        .maybeSingle()
      return data
    })

    if (!lead) {
      logger.error(`Lead not found: ${lead_id}`)
      return { success: false, reason: 'lead_not_found' }
    }

    // Skip if already at requested tier or higher
    const tierRank = { none: 0, auto: 1, intel: 2, deep_research: 3 }
    const currentRank =
      tierRank[(lead.intelligence_tier as keyof typeof tierRank) ?? 'none'] ?? 0
    const requestedRank = tierRank[tier] ?? 0
    if (currentRank >= requestedRank) {
      logger.info(`Lead already at tier ${lead.intelligence_tier}, skipping`)
      return { success: true, skipped: true, reason: 'already_enriched' }
    }

    const name =
      lead.full_name ||
      [lead.first_name, lead.last_name].filter(Boolean).join(' ')
    const results: Record<string, unknown> = {}

    if (tier === 'intel') {
      // Step 2a: LinkedIn profile
      const linkedin = await step.run('fetch-linkedin', async () => {
        const limit = checkInvocationLimit('proxycurl')
        if (!limit.allowed) return null
        return getLinkedInProfile(
          lead.linkedin_url,
          lead.email,
          name,
          lead.company_name
        )
      })
      if (linkedin) results.linkedin_data = linkedin

      // Step 2b: Social intel (FullContact)
      const social = await step.run('fetch-social', async () => {
        if (!lead.email) return null
        const limit = checkInvocationLimit('fullcontact')
        if (!limit.allowed) return null
        return getSocialIntel(lead.email)
      })
      if (social) results.social_intel = social

      // Step 2c: News mentions (Serper)
      const news = await step.run('fetch-news', async () => {
        if (!name || !lead.company_name) return []
        const limit = checkInvocationLimit('serper')
        if (!limit.allowed) return []
        return getNewsMentions(name, lead.company_name)
      })
      if (news.length > 0) results.news_mentions = news
    }

    if (tier === 'deep_research') {
      // Run all intel providers first
      const [linkedin, social, news] = await Promise.all([
        step.run('fetch-linkedin-dr', async () =>
          getLinkedInProfile(
            lead.linkedin_url,
            lead.email,
            name,
            lead.company_name
          )
        ),
        step.run('fetch-social-dr', async () =>
          lead.email ? getSocialIntel(lead.email) : null
        ),
        step.run('fetch-news-dr', async () =>
          name && lead.company_name
            ? getNewsMentions(name, lead.company_name)
            : []
        ),
      ])
      if (linkedin) results.linkedin_data = linkedin
      if (social) results.social_intel = social
      if ((news as unknown[]).length > 0) results.news_mentions = news

      // Deep research via Perplexity
      const brief = await step.run('deep-research', async () => {
        if (!name) return null
        const limit = checkInvocationLimit('perplexity_deep')
        if (!limit.allowed) return null
        return deepResearchPerson(
          name,
          lead.company_name ?? '',
          lead.job_title ?? '',
          lead.company_domain ?? undefined
        )
      })

      if (brief) {
        results.research_brief =
          brief.brief +
          (brief.keyFacts.length > 0
            ? '\n\nKey Facts:\n' +
              brief.keyFacts.map((f: string) => `• ${f}`).join('\n')
            : '') +
          (brief.outreachAngle
            ? `\n\nOutreach Angle: ${brief.outreachAngle}`
            : '')
        results.research_brief_at = new Date().toISOString()
        results.research_outreach_angle = brief.outreachAngle
        results.research_sources = brief.sources
      }
    }

    // Step 3: Save results to lead
    await step.run('save-results', async () => {
      if (Object.keys(results).length === 0) return

      const supabase = createAdminClient()
      await supabase
        .from('leads')
        .update({
          ...results,
          intelligence_tier: tier,
        })
        .eq('id', lead_id)
        .eq('workspace_id', workspace_id)

      // Log enrichment activity
      await supabase
        .from('lead_activities')
        .insert({
          lead_id,
          workspace_id,
          activity_type: 'enriched',
          description: `Intelligence ${tier === 'intel' ? 'Pack' : 'Deep Research'} completed`,
          metadata: {
            tier,
            providers: Object.keys(results),
          },
        })
        .select()
        .maybeSingle()
    })

    // Step 4: Track cost
    await step.run('track-cost', async () => {
      const costPerTier: Record<string, number> = {
        intel: 0.35,
        deep_research: 0.65,
      }
      await trackCost({
        workspace_id,
        lead_id,
        tier: tier === 'intel' ? 'intel' : 'deep_research',
        provider:
          tier === 'intel'
            ? 'proxycurl+fullcontact+serper'
            : 'proxycurl+fullcontact+serper+perplexity',
        credits_charged: CREDIT_COSTS[tier],
        api_cost_usd: costPerTier[tier],
        status: 'completed',
        metadata: { providers_run: Object.keys(results) },
      })
    })

    safeLog(`[IntelligencePack] Completed ${tier} for lead ${lead_id}`, {
      providers_run: Object.keys(results),
    })

    return {
      success: true,
      lead_id,
      tier,
      providers_run: Object.keys(results),
    }
  }
)
