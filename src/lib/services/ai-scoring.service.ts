// AI Lead Scoring Service
// Uses Claude API for intelligent lead scoring and predictions

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

export interface LeadScoreInput {
  // Firmographic data
  companyName: string
  industry?: string
  employeeCount?: number
  revenue?: number
  location?: { city?: string; state?: string; country?: string }

  // Contact data
  jobTitle?: string
  seniority?: string
  department?: string

  // Engagement data
  emailOpens?: number
  emailClicks?: number
  websiteVisits?: number
  contentDownloads?: number
  formSubmissions?: number

  // Intent signals
  intentSignals?: Array<{ type: string; strength: string; timestamp: string }>

  // Historical performance
  similarLeadsConverted?: number
  industryConversionRate?: number
}

export interface LeadScore {
  overall: number // 0-100
  components: {
    firmographic: number
    engagement: number
    intent: number
    fit: number
  }
  tier: 'hot' | 'warm' | 'cold'
  explanation: string
  recommendations: string[]
  bestTimeToContact?: string
  predictedConversionProbability: number
}

export class AIScoreingService {
  /**
   * Score a lead using AI
   */
  async scoreLead(input: LeadScoreInput): Promise<LeadScore> {
    if (!anthropic) {
      return this.fallbackScoring(input)
    }

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `You are a lead scoring expert. Analyze this lead data and provide a comprehensive score.

Lead Data:
- Company: ${input.companyName}
- Industry: ${input.industry || 'Unknown'}
- Employee Count: ${input.employeeCount || 'Unknown'}
- Revenue: ${input.revenue ? `$${input.revenue.toLocaleString()}` : 'Unknown'}
- Location: ${[input.location?.city, input.location?.state, input.location?.country].filter(Boolean).join(', ') || 'Unknown'}
- Contact Title: ${input.jobTitle || 'Unknown'}
- Seniority: ${input.seniority || 'Unknown'}
- Department: ${input.department || 'Unknown'}

Engagement Metrics:
- Email Opens: ${input.emailOpens || 0}
- Email Clicks: ${input.emailClicks || 0}
- Website Visits: ${input.websiteVisits || 0}
- Content Downloads: ${input.contentDownloads || 0}
- Form Submissions: ${input.formSubmissions || 0}

Intent Signals: ${input.intentSignals?.length || 0} signals detected
${input.intentSignals?.map(s => `- ${s.type} (${s.strength})`).join('\n') || 'None'}

Respond with a JSON object containing:
{
  "overall": <0-100 score>,
  "components": {
    "firmographic": <0-100>,
    "engagement": <0-100>,
    "intent": <0-100>,
    "fit": <0-100>
  },
  "tier": "<hot|warm|cold>",
  "explanation": "<2-3 sentences explaining the score>",
  "recommendations": ["<action 1>", "<action 2>", "<action 3>"],
  "bestTimeToContact": "<e.g., 'Tuesday 10am-12pm local time'>",
  "predictedConversionProbability": <0.0-1.0>
}

Only respond with the JSON object, no other text.`,
        }],
      })

      const content = message.content[0]
      if (content.type !== 'text') {
        return this.fallbackScoring(input)
      }

      try {
        const score = JSON.parse(content.text) as LeadScore
        return score
      } catch {
        return this.fallbackScoring(input)
      }
    } catch (error) {
      console.error('[AIScoreingService] Score lead error:', error)
      return this.fallbackScoring(input)
    }
  }

  /**
   * Batch score multiple leads
   */
  async batchScoreLeads(
    workspaceId: string,
    leadIds: string[]
  ): Promise<Map<string, LeadScore>> {
    const supabase = await createClient()
    const results = new Map<string, LeadScore>()

    // Fetch leads
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .in('id', leadIds)

    if (!leads) return results

    // Score each lead
    for (const lead of leads) {
      const input: LeadScoreInput = {
        companyName: lead.company_name,
        industry: lead.company_industry,
        jobTitle: lead.job_title,
        // Add more fields as available
      }

      const score = await this.scoreLead(input)
      results.set(lead.id, score)

      // Store score in database
      await supabase.from('lead_score_history').insert({
        lead_id: lead.id,
        workspace_id: workspaceId,
        score: score.overall,
        score_breakdown: score.components,
        scoring_model: 'ai_claude',
        explanation: score.explanation,
      }).catch(() => {}) // Ignore if table doesn't exist
    }

    return results
  }

  /**
   * Predict conversion probability
   */
  async predictConversion(leadId: string): Promise<{
    probability: number
    confidence: number
    factors: Array<{ factor: string; impact: 'positive' | 'negative'; weight: number }>
  }> {
    const supabase = await createClient()

    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (!lead) {
      return { probability: 0.5, confidence: 0, factors: [] }
    }

    const score = await this.scoreLead({
      companyName: lead.company_name,
      industry: lead.company_industry,
      jobTitle: lead.job_title,
    })

    return {
      probability: score.predictedConversionProbability,
      confidence: 0.7, // Based on available data
      factors: [
        { factor: 'Firmographic fit', impact: score.components.firmographic > 50 ? 'positive' : 'negative', weight: 0.3 },
        { factor: 'Engagement level', impact: score.components.engagement > 50 ? 'positive' : 'negative', weight: 0.3 },
        { factor: 'Intent signals', impact: score.components.intent > 50 ? 'positive' : 'negative', weight: 0.25 },
        { factor: 'Company fit', impact: score.components.fit > 50 ? 'positive' : 'negative', weight: 0.15 },
      ],
    }
  }

  /**
   * Fallback scoring when AI is not available
   */
  private fallbackScoring(input: LeadScoreInput): LeadScore {
    let firmographic = 50
    let engagement = 50
    let intent = 50
    let fit = 50

    // Firmographic scoring
    if (input.employeeCount) {
      if (input.employeeCount >= 100) firmographic += 15
      else if (input.employeeCount >= 50) firmographic += 10
      else if (input.employeeCount >= 10) firmographic += 5
    }

    if (input.revenue) {
      if (input.revenue >= 10000000) firmographic += 15
      else if (input.revenue >= 1000000) firmographic += 10
      else if (input.revenue >= 100000) firmographic += 5
    }

    // Engagement scoring
    const totalEngagement = (input.emailOpens || 0) + (input.emailClicks || 0) * 2 +
      (input.websiteVisits || 0) + (input.contentDownloads || 0) * 3 +
      (input.formSubmissions || 0) * 5

    if (totalEngagement >= 20) engagement = 90
    else if (totalEngagement >= 10) engagement = 70
    else if (totalEngagement >= 5) engagement = 60

    // Intent scoring
    const intentCount = input.intentSignals?.length || 0
    const highIntentCount = input.intentSignals?.filter(s => s.strength === 'high').length || 0

    if (highIntentCount >= 3) intent = 95
    else if (highIntentCount >= 1) intent = 80
    else if (intentCount >= 3) intent = 70
    else if (intentCount >= 1) intent = 60

    // Fit scoring (seniority + department)
    if (input.seniority?.includes('C-') || input.seniority?.includes('VP')) fit = 90
    else if (input.seniority?.includes('Director')) fit = 80
    else if (input.seniority?.includes('Manager')) fit = 70

    const overall = Math.round((firmographic + engagement + intent + fit) / 4)

    return {
      overall,
      components: { firmographic, engagement, intent, fit },
      tier: overall >= 70 ? 'hot' : overall >= 50 ? 'warm' : 'cold',
      explanation: `Lead scored ${overall}/100 based on firmographic data, engagement metrics, and intent signals.`,
      recommendations: [
        overall >= 70 ? 'Prioritize immediate outreach' : 'Continue nurturing',
        engagement < 50 ? 'Increase engagement touchpoints' : 'Maintain engagement cadence',
        intent < 50 ? 'Monitor for buying signals' : 'Capitalize on intent signals',
      ],
      bestTimeToContact: 'Tuesday-Thursday, 9am-11am local time',
      predictedConversionProbability: overall / 100 * 0.8,
    }
  }
}

export const aiScoringService = new AIScoreingService()
