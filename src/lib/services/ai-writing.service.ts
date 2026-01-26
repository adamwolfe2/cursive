// AI Writing Assistant Service
// Uses Claude API for email writing, personalization, and optimization

import Anthropic from '@anthropic-ai/sdk'

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

export interface LeadContext {
  firstName?: string
  lastName?: string
  fullName?: string
  companyName?: string
  jobTitle?: string
  industry?: string
  location?: string
  previousInteractions?: string[]
  painPoints?: string[]
  interests?: string[]
}

export interface EmailGenerationOptions {
  purpose: 'cold_outreach' | 'follow_up' | 'meeting_request' | 'proposal' | 'check_in' | 'thank_you'
  tone: 'professional' | 'casual' | 'friendly' | 'formal' | 'urgent'
  length: 'short' | 'medium' | 'long'
  includeCallToAction: boolean
  customInstructions?: string
}

export interface GeneratedEmail {
  subject: string
  subjectVariants: string[]
  body: string
  bodyVariants: string[]
  callToAction: string
  personalizationNotes: string[]
}

export interface SubjectLineOptimization {
  original: string
  optimized: string[]
  predictions: Array<{
    subject: string
    predictedOpenRate: number
    reasoning: string
  }>
}

export class AIWritingService {
  /**
   * Generate a personalized email
   */
  async generateEmail(
    lead: LeadContext,
    options: EmailGenerationOptions
  ): Promise<GeneratedEmail> {
    if (!anthropic) {
      return this.fallbackEmailGeneration(lead, options)
    }

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `You are an expert B2B sales copywriter. Generate a personalized email for the following lead.

Lead Information:
- Name: ${lead.fullName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'there'}
- Company: ${lead.companyName || 'their company'}
- Title: ${lead.jobTitle || 'professional'}
- Industry: ${lead.industry || 'their industry'}
- Location: ${lead.location || 'their region'}
${lead.previousInteractions?.length ? `- Previous Interactions: ${lead.previousInteractions.join(', ')}` : ''}
${lead.painPoints?.length ? `- Known Pain Points: ${lead.painPoints.join(', ')}` : ''}
${lead.interests?.length ? `- Interests: ${lead.interests.join(', ')}` : ''}

Email Requirements:
- Purpose: ${options.purpose.replace(/_/g, ' ')}
- Tone: ${options.tone}
- Length: ${options.length} (${options.length === 'short' ? '50-100 words' : options.length === 'medium' ? '100-200 words' : '200-300 words'})
- Include Call to Action: ${options.includeCallToAction}
${options.customInstructions ? `- Additional Instructions: ${options.customInstructions}` : ''}

Respond with a JSON object:
{
  "subject": "<main subject line>",
  "subjectVariants": ["<variant 1>", "<variant 2>"],
  "body": "<email body with appropriate formatting>",
  "bodyVariants": ["<shorter version>", "<different angle>"],
  "callToAction": "<specific call to action>",
  "personalizationNotes": ["<what was personalized>", "<why it resonates>"]
}

Only respond with the JSON object.`,
        }],
      })

      const content = message.content[0]
      if (content.type !== 'text') {
        return this.fallbackEmailGeneration(lead, options)
      }

      try {
        return JSON.parse(content.text) as GeneratedEmail
      } catch {
        return this.fallbackEmailGeneration(lead, options)
      }
    } catch (error) {
      console.error('[AIWritingService] Generate email error:', error)
      return this.fallbackEmailGeneration(lead, options)
    }
  }

  /**
   * Generate subject line variants
   */
  async generateSubjectLines(
    context: { purpose: string; recipientName?: string; companyName?: string; topic?: string },
    count: number = 5
  ): Promise<string[]> {
    if (!anthropic) {
      return this.fallbackSubjectLines(context, count)
    }

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `Generate ${count} compelling email subject lines for the following context:

Purpose: ${context.purpose}
${context.recipientName ? `Recipient: ${context.recipientName}` : ''}
${context.companyName ? `Company: ${context.companyName}` : ''}
${context.topic ? `Topic: ${context.topic}` : ''}

Requirements:
- Keep under 50 characters when possible
- Create curiosity without being clickbait
- Personalize when name/company is available
- Vary the approach (question, statement, number, etc.)

Respond with a JSON array of subject lines:
["<subject 1>", "<subject 2>", ...]`,
        }],
      })

      const content = message.content[0]
      if (content.type === 'text') {
        try {
          return JSON.parse(content.text) as string[]
        } catch {
          return this.fallbackSubjectLines(context, count)
        }
      }
      return this.fallbackSubjectLines(context, count)
    } catch (error) {
      console.error('[AIWritingService] Generate subjects error:', error)
      return this.fallbackSubjectLines(context, count)
    }
  }

  /**
   * Optimize subject line with predictions
   */
  async optimizeSubjectLine(subject: string): Promise<SubjectLineOptimization> {
    if (!anthropic) {
      return {
        original: subject,
        optimized: [subject],
        predictions: [{ subject, predictedOpenRate: 0.2, reasoning: 'Baseline prediction' }],
      }
    }

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Analyze and optimize this email subject line:

"${subject}"

Provide:
1. 3 optimized versions
2. Predicted open rate for each (0.0-1.0)
3. Reasoning for predictions

Respond with JSON:
{
  "original": "${subject}",
  "optimized": ["<opt1>", "<opt2>", "<opt3>"],
  "predictions": [
    {"subject": "<opt1>", "predictedOpenRate": 0.XX, "reasoning": "<why>"},
    {"subject": "<opt2>", "predictedOpenRate": 0.XX, "reasoning": "<why>"},
    {"subject": "<opt3>", "predictedOpenRate": 0.XX, "reasoning": "<why>"}
  ]
}`,
        }],
      })

      const content = message.content[0]
      if (content.type === 'text') {
        return JSON.parse(content.text) as SubjectLineOptimization
      }
      throw new Error('Invalid response')
    } catch (error) {
      console.error('[AIWritingService] Optimize subject error:', error)
      return {
        original: subject,
        optimized: [subject],
        predictions: [{ subject, predictedOpenRate: 0.2, reasoning: 'Unable to analyze' }],
      }
    }
  }

  /**
   * Personalize an existing email
   */
  async personalizeEmail(
    template: string,
    lead: LeadContext
  ): Promise<string> {
    if (!anthropic) {
      return this.applyMergeFields(template, lead)
    }

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `Personalize this email template for the lead. Make subtle, natural adjustments based on their information.

Template:
${template}

Lead Information:
${JSON.stringify(lead, null, 2)}

Return ONLY the personalized email body, nothing else.`,
        }],
      })

      const content = message.content[0]
      return content.type === 'text' ? content.text : this.applyMergeFields(template, lead)
    } catch (error) {
      console.error('[AIWritingService] Personalize error:', error)
      return this.applyMergeFields(template, lead)
    }
  }

  /**
   * Suggest tone adjustments
   */
  async suggestToneAdjustment(
    content: string,
    targetTone: 'more_professional' | 'more_casual' | 'more_urgent' | 'more_friendly'
  ): Promise<string> {
    if (!anthropic) {
      return content
    }

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `Adjust this email to be ${targetTone.replace(/_/g, ' ')}:

${content}

Return ONLY the adjusted email, nothing else.`,
        }],
      })

      const result = message.content[0]
      return result.type === 'text' ? result.text : content
    } catch (error) {
      console.error('[AIWritingService] Tone adjustment error:', error)
      return content
    }
  }

  /**
   * Apply merge fields to template
   */
  private applyMergeFields(template: string, lead: LeadContext): string {
    let result = template

    const fields: Record<string, string | undefined> = {
      '{{first_name}}': lead.firstName,
      '{{last_name}}': lead.lastName,
      '{{full_name}}': lead.fullName || `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
      '{{company_name}}': lead.companyName,
      '{{job_title}}': lead.jobTitle,
      '{{industry}}': lead.industry,
      '{{location}}': lead.location,
    }

    for (const [field, value] of Object.entries(fields)) {
      result = result.replace(new RegExp(field, 'g'), value || '')
    }

    return result
  }

  /**
   * Fallback email generation
   */
  private fallbackEmailGeneration(
    lead: LeadContext,
    options: EmailGenerationOptions
  ): GeneratedEmail {
    const name = lead.firstName || 'there'
    const company = lead.companyName || 'your company'

    const templates = {
      cold_outreach: {
        subject: `Quick question about ${company}`,
        body: `Hi ${name},\n\nI noticed ${company} has been growing, and I wanted to reach out.\n\nWe help companies like yours improve their lead generation and sales processes.\n\nWould you be open to a quick 15-minute call to explore if we can help?\n\nBest,`,
      },
      follow_up: {
        subject: `Following up - ${company}`,
        body: `Hi ${name},\n\nI wanted to follow up on my previous email. I understand you're busy, so I'll keep this brief.\n\nI believe we can help ${company} achieve better results with your sales pipeline.\n\nWould next week work for a quick chat?\n\nBest,`,
      },
      meeting_request: {
        subject: `Meeting request: ${company} + Our Team`,
        body: `Hi ${name},\n\nI'd love to schedule a brief call to discuss how we can support ${company}'s goals.\n\nAre you available for a 20-minute call this week or next?\n\nPlease let me know what works best for your schedule.\n\nBest,`,
      },
      proposal: {
        subject: `Proposal for ${company}`,
        body: `Hi ${name},\n\nThank you for our recent conversation. As discussed, I'm following up with a proposal tailored to ${company}'s needs.\n\nI've outlined several options that I believe will deliver significant value for your team.\n\nI'd love to walk you through the details. When would be a good time to connect?\n\nBest,`,
      },
      check_in: {
        subject: `Checking in - ${company}`,
        body: `Hi ${name},\n\nI hope all is well at ${company}. I wanted to check in and see how things are going.\n\nIf there's anything I can help with, please don't hesitate to reach out.\n\nBest,`,
      },
      thank_you: {
        subject: `Thank you, ${name}!`,
        body: `Hi ${name},\n\nThank you for taking the time to speak with me about ${company}'s needs.\n\nI really enjoyed our conversation and am excited about the possibility of working together.\n\nPlease let me know if you have any questions.\n\nBest,`,
      },
    }

    const template = templates[options.purpose]

    return {
      subject: template.subject,
      subjectVariants: [template.subject, `Re: ${template.subject}`],
      body: template.body,
      bodyVariants: [template.body],
      callToAction: options.includeCallToAction ? 'Would you be available for a call this week?' : '',
      personalizationNotes: [
        `Used recipient's first name: ${name}`,
        `Mentioned their company: ${company}`,
      ],
    }
  }

  /**
   * Fallback subject lines
   */
  private fallbackSubjectLines(
    context: { purpose: string; recipientName?: string; companyName?: string; topic?: string },
    count: number
  ): string[] {
    const subjects = [
      `Quick question for ${context.companyName || 'you'}`,
      `${context.recipientName || 'Hi'}, thoughts on this?`,
      `Ideas for ${context.companyName || 'your team'}`,
      `Can we connect?`,
      `Following up on ${context.topic || 'our conversation'}`,
      `Time-sensitive: ${context.topic || 'opportunity'}`,
      `3 ways to improve ${context.topic || 'results'}`,
    ]

    return subjects.slice(0, count)
  }
}

export const aiWritingService = new AIWritingService()
