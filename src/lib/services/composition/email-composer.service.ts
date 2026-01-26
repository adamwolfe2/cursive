/**
 * Email Composer Service
 *
 * Composes personalized emails for campaign leads by:
 * 1. Selecting the best template based on lead profile
 * 2. Replacing variables with lead/campaign data
 * 3. Inserting value propositions and trust signals
 * 4. Adding enrichment-based personalization
 */

import type { EmailTemplate, EmailCampaign, CampaignLead, Lead } from '@/types'

export interface ComposedEmail {
  subject: string
  body_html: string
  body_text: string
  template_id: string
  variables_used: Record<string, string>
  metadata: {
    composed_at: string
    lead_id: string
    campaign_id: string
    value_prop_used?: string
    trust_signals_used?: string[]
    personalization_notes?: string
  }
}

export interface ComposeEmailInput {
  campaignLead: CampaignLead & { lead?: Lead }
  campaign: EmailCampaign
  template: EmailTemplate
  senderName: string
  senderTitle?: string
  senderCompany?: string
}

export class EmailComposerService {
  /**
   * Compose a personalized email for a campaign lead
   */
  async composeEmail(input: ComposeEmailInput): Promise<ComposedEmail> {
    const { campaignLead, campaign, template, senderName, senderTitle, senderCompany } = input
    const lead = campaignLead.lead

    if (!lead) {
      throw new Error('Lead data is required for email composition')
    }

    // Build variable replacement map
    const variables = this.buildVariableMap({
      lead,
      campaign,
      campaignLead,
      senderName,
      senderTitle,
      senderCompany,
    })

    // Get value proposition content if matched
    const valuePropContent = this.getValuePropContent(campaign, campaignLead)
    if (valuePropContent) {
      variables.value_prop = valuePropContent.description
      variables.value_prop_name = valuePropContent.name
    }

    // Get trust signals
    const trustSignals = this.getTrustSignals(campaign)
    if (trustSignals.length > 0) {
      variables.trust_signal = trustSignals[0]
      variables.trust_signals = trustSignals.join(', ')
    }

    // Add enrichment-based variables
    const enrichmentVars = this.extractEnrichmentVariables(campaignLead.enrichment_data)
    Object.assign(variables, enrichmentVars)

    // Replace variables in template
    const subject = this.replaceVariables(template.subject, variables)
    const bodyHtml = this.replaceVariables(template.body_html || '', variables)
    const bodyText = this.replaceVariables(template.body_text || '', variables)

    return {
      subject,
      body_html: bodyHtml,
      body_text: bodyText,
      template_id: template.id,
      variables_used: variables,
      metadata: {
        composed_at: new Date().toISOString(),
        lead_id: lead.id,
        campaign_id: campaign.id,
        value_prop_used: valuePropContent?.name,
        trust_signals_used: trustSignals.slice(0, 3),
        personalization_notes: enrichmentVars.personalization_hook,
      },
    }
  }

  /**
   * Select the best template for a lead based on campaign settings
   */
  selectTemplate(
    templates: EmailTemplate[],
    lead: Lead,
    campaign: EmailCampaign,
    stepNumber: number = 1
  ): EmailTemplate {
    if (templates.length === 0) {
      throw new Error('No templates available for selection')
    }

    const matchingMode = campaign.matching_mode || 'intelligent'

    if (matchingMode === 'random') {
      // Random selection for A/B testing
      return templates[Math.floor(Math.random() * templates.length)]
    }

    // Intelligent matching - score templates based on lead profile
    const scores = templates.map((template) => ({
      template,
      score: this.scoreTemplateForLead(template, lead, stepNumber),
    }))

    scores.sort((a, b) => b.score - a.score)
    return scores[0].template
  }

  /**
   * Score a template for a specific lead
   */
  private scoreTemplateForLead(
    template: EmailTemplate,
    lead: Lead,
    stepNumber: number
  ): number {
    let score = 0

    // Match seniority
    const targetSeniority = template.target_seniority || []
    const leadTitle = (lead.job_title || '').toLowerCase()

    if (targetSeniority.includes('c_level')) {
      if (/\b(ceo|cto|cfo|coo|chief|founder)\b/i.test(leadTitle)) score += 30
    }
    if (targetSeniority.includes('vp')) {
      if (/\bvp\b|vice president/i.test(leadTitle)) score += 25
    }
    if (targetSeniority.includes('director')) {
      if (/\bdirector\b/i.test(leadTitle)) score += 20
    }
    if (targetSeniority.includes('manager')) {
      if (/\bmanager\b/i.test(leadTitle)) score += 15
    }

    // Match company type/industry
    const companyTypes = template.company_types || []
    const industry = (lead.company_industry || '').toLowerCase()

    for (const type of companyTypes) {
      if (industry.includes(type.toLowerCase())) {
        score += 15
        break
      }
    }

    // Prefer follow-up templates for later steps
    const templateName = (template.name || '').toLowerCase()
    if (stepNumber > 1 && templateName.includes('follow')) {
      score += 20
    }
    if (stepNumber === 1 && !templateName.includes('follow')) {
      score += 10
    }

    // Prefer templates with good performance
    if (template.reply_rate && template.reply_rate > 0.05) {
      score += 10
    }
    if (template.open_rate && template.open_rate > 0.3) {
      score += 5
    }

    return score
  }

  /**
   * Build variable replacement map from lead/campaign data
   */
  private buildVariableMap(params: {
    lead: Lead
    campaign: EmailCampaign
    campaignLead: CampaignLead
    senderName: string
    senderTitle?: string
    senderCompany?: string
  }): Record<string, string> {
    const { lead, campaign, senderName, senderTitle, senderCompany } = params

    return {
      // Lead variables
      first_name: lead.first_name || 'there',
      last_name: lead.last_name || '',
      full_name: lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'there',
      email: lead.email || '',
      company_name: lead.company_name || 'your company',
      job_title: lead.job_title || 'professional',
      industry: lead.company_industry || 'your industry',

      // Sender variables
      sender_name: senderName,
      sender_title: senderTitle || '',
      sender_company: senderCompany || '',

      // Common placeholders
      pain_point: 'operational efficiency',
      metric_area: 'key metrics',
      metric_value: '30%',
      timeframe: '30 days',
      social_proof_company: 'leading companies',
      similar_company_count: '100',

      // Will be overwritten if matched
      value_prop: '',
      value_prop_name: '',
      trust_signal: '',
      trust_signals: '',
    }
  }

  /**
   * Get value proposition content for the matched value prop
   */
  private getValuePropContent(
    campaign: EmailCampaign,
    campaignLead: CampaignLead
  ): { name: string; description: string } | null {
    if (!campaignLead.matched_value_prop_id) return null

    const valueProps = (campaign.value_propositions || []) as Array<{
      id: string
      name: string
      description: string
    }>

    return valueProps.find((vp) => vp.id === campaignLead.matched_value_prop_id) || null
  }

  /**
   * Get trust signals from campaign
   */
  private getTrustSignals(campaign: EmailCampaign): string[] {
    const signals = (campaign.trust_signals || []) as Array<{
      type: string
      content: string
    }>

    return signals.map((s) => s.content)
  }

  /**
   * Extract variables from enrichment data
   */
  private extractEnrichmentVariables(
    enrichmentData: unknown
  ): Record<string, string> {
    if (!enrichmentData || typeof enrichmentData !== 'object') {
      return {}
    }

    const data = enrichmentData as Record<string, unknown>
    const vars: Record<string, string> = {}

    if (data.company_summary && typeof data.company_summary === 'string') {
      vars.company_summary = data.company_summary
    }

    if (Array.isArray(data.recent_news) && data.recent_news.length > 0) {
      vars.recent_news = data.recent_news[0]
    }

    if (Array.isArray(data.key_challenges) && data.key_challenges.length > 0) {
      vars.pain_point = data.key_challenges[0]
    }

    if (Array.isArray(data.personalization_hooks) && data.personalization_hooks.length > 0) {
      vars.personalization_hook = data.personalization_hooks[0]
    }

    return vars
  }

  /**
   * Replace {{variable}} placeholders with values
   */
  private replaceVariables(text: string, variables: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      const value = variables[varName]
      // Return the variable value if it exists and is non-empty, otherwise return placeholder
      return value ? value : `[${varName}]`
    })
  }
}

// Singleton instance
export const emailComposerService = new EmailComposerService()
