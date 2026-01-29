/**
 * AI Email Sequence Generator
 * Uses Anthropic Claude to generate personalized email sequences
 * Based on Sales.co-style campaign crafting
 */

import Anthropic from '@anthropic-ai/sdk'
import type { CampaignDraft, GeneratedEmail } from '@/types/campaign-builder'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const MODEL = 'claude-3-5-sonnet-20241022'

/**
 * Generate email sequence from campaign draft
 */
export async function generateEmailSequence(
  draft: CampaignDraft,
  customPrompt?: string
): Promise<GeneratedEmail[]> {
  const prompt = customPrompt || buildGenerationPrompt(draft)

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4000,
      temperature: 0.7, // Creative but consistent
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Parse the structured response
    const emails = parseEmailSequenceResponse(content.text, draft.email_count || 5)

    return emails
  } catch (error) {
    console.error('[AI Generator] Failed to generate sequence:', error)
    throw error
  }
}

/**
 * Build the generation prompt from draft data
 */
function buildGenerationPrompt(draft: CampaignDraft): string {
  const emailCount = draft.email_count || 5
  const daysBetween = draft.days_between_emails || 3

  // Calculate days for each email
  const days = Array.from({ length: emailCount }, (_, i) => i * daysBetween)

  return `You are an expert cold email copywriter. Generate a ${emailCount}-email sequence based on the following information.

# COMPANY PROFILE
Company: ${draft.company_name || 'Not provided'}
Industry: ${draft.industry || 'Not provided'}
Company Size: ${draft.company_size || 'Not provided'}
Website: ${draft.website_url || 'Not provided'}
Value Proposition: ${draft.value_proposition || 'Not provided'}
Differentiators: ${draft.differentiators?.join(', ') || 'Not provided'}

# PRODUCT/SERVICE
Product Name: ${draft.product_name || 'Not provided'}
Problem Solved: ${draft.problem_solved || 'Not provided'}
Key Features:
${draft.key_features?.map((f) => `- ${f.title}: ${f.description}`).join('\n') || 'Not provided'}
Pricing Model: ${draft.pricing_model || 'Not provided'}
Social Proof: ${draft.social_proof || 'Not provided'}

Common Objections & Rebuttals:
${draft.objection_rebuttals ? Object.entries(draft.objection_rebuttals).map(([obj, reb]) => `- Objection: ${obj}\n  Rebuttal: ${reb}`).join('\n') : 'Not provided'}

# IDEAL CUSTOMER PROFILE
Target Titles: ${draft.target_titles?.join(', ') || 'Not provided'}
Target Company Sizes: ${draft.target_company_sizes?.join(', ') || 'Not provided'}
Target Industries: ${draft.target_industries?.join(', ') || 'Not provided'}
Target Locations: ${draft.target_locations?.join(', ') || 'Not provided'}
Pain Points: ${draft.pain_points?.join(', ') || 'Not provided'}
Buying Triggers: ${draft.buying_triggers?.join(', ') || 'Not provided'}

# OFFER & CTA
Primary CTA: ${draft.primary_cta || 'Not provided'}
Secondary CTA: ${draft.secondary_cta || 'Not provided'}
Urgency Elements: ${draft.urgency_elements || 'None'}
Meeting Link: ${draft.meeting_link || 'Not provided'}

# TONE & STYLE
Tone: ${draft.tone || 'professional'}
Email Length: ${draft.email_length || 'medium'}
Personalization Level: ${draft.personalization_level || 'medium'}
Reference Style: ${draft.reference_style || 'first_name'}

# SEQUENCE CONFIGURATION
Sequence Type: ${draft.sequence_type || 'cold_outreach'}
Sequence Goal: ${draft.sequence_goal || 'meeting_booked'}
Days Between Emails: ${daysBetween}
Email Schedule: Day ${days.join(', Day ')}

# INSTRUCTIONS
Generate ${emailCount} emails following best practices for cold outreach:

1. **Email 1 (Day ${days[0]})**: Initial outreach - Hook with pain point/curiosity, establish relevance, soft CTA
2. **Email 2 (Day ${days[1]})**: Value-add follow-up - Share insight/resource, build credibility, no hard ask
${emailCount >= 3 ? `3. **Email 3 (Day ${days[2]})**: Social proof - Case study/testimonial, address objection, CTA` : ''}
${emailCount >= 4 ? `4. **Email 4 (Day ${days[3]})**: Direct ask - Clear value prop, strong CTA, urgency if appropriate` : ''}
${emailCount >= 5 ? `5. **Email 5 (Day ${days[4]})**: Breakup email - Last attempt, alternative CTA, leave door open` : ''}
${emailCount >= 6 ? `6. **Email 6 (Day ${days[5]})**: Re-engagement - New angle, different value prop, final ask` : ''}
${emailCount >= 7 ? `7. **Email 7 (Day ${days[6]})**: Ultimate breakup - Respectful close, referral request, unsubscribe option` : ''}

# OUTPUT FORMAT
Return ONLY a valid JSON array with this exact structure:

[
  {
    "step": 1,
    "day": ${days[0]},
    "subject": "Subject line here",
    "body": "Email body here (use \\n for line breaks)",
    "personalization_notes": "Tips for personalizing this email",
    "variables": ["{{FirstName}}", "{{Company}}"]
  },
  ...
]

CRITICAL RULES:
- Keep subject lines under 50 characters
- Use personalization variables: {{FirstName}}, {{Company}}, {{JobTitle}}, {{Industry}}
- Follow the tone: ${draft.tone}
- Email length: ${draft.email_length} (short=50-100 words, medium=100-150, long=150-200)
- Personalization level: ${draft.personalization_level} (light=name only, medium=+company, heavy=+specific pain points)
- Include CTA in appropriate emails: ${draft.primary_cta}
- NO generic templates - make it specific to this company/product
- NO over-the-top claims - be authentic and helpful
- NO spam trigger words (free, guarantee, limited time, act now)

Generate the sequence now. Return ONLY the JSON array, no other text.`
}

/**
 * Parse Claude's response into structured emails
 */
function parseEmailSequenceResponse(response: string, expectedCount: number): GeneratedEmail[] {
  try {
    // Try to extract JSON from response (Claude sometimes adds explanation text)
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No JSON array found in response')
    }

    const emails = JSON.parse(jsonMatch[0]) as GeneratedEmail[]

    // Validate structure
    if (!Array.isArray(emails)) {
      throw new Error('Response is not an array')
    }

    if (emails.length !== expectedCount) {
      console.warn(`Expected ${expectedCount} emails, got ${emails.length}`)
    }

    // Validate each email has required fields
    emails.forEach((email, index) => {
      if (!email.subject || !email.body || email.step === undefined || email.day === undefined) {
        throw new Error(`Email ${index + 1} is missing required fields`)
      }
    })

    return emails
  } catch (error) {
    console.error('[AI Generator] Failed to parse response:', error)
    console.error('[AI Generator] Raw response:', response)
    throw new Error('Failed to parse AI response. Please try again.')
  }
}

/**
 * Regenerate a single email in the sequence
 */
export async function regenerateEmail(
  draft: CampaignDraft,
  emailStep: number,
  feedback?: string
): Promise<GeneratedEmail> {
  const currentEmail = draft.generated_emails?.find((e) => e.step === emailStep)

  const prompt = `You are an expert cold email copywriter. Regenerate email #${emailStep} in this sequence.

# CONTEXT
${buildGenerationPrompt(draft)}

# CURRENT EMAIL (to improve):
Subject: ${currentEmail?.subject || 'N/A'}
Body: ${currentEmail?.body || 'N/A'}

# FEEDBACK
${feedback || 'Make it better - more engaging, clearer value prop, stronger CTA'}

# OUTPUT
Return ONLY a JSON object with this structure:
{
  "step": ${emailStep},
  "day": ${currentEmail?.day || emailStep * (draft.days_between_emails || 3)},
  "subject": "Improved subject line",
  "body": "Improved email body",
  "personalization_notes": "Tips for personalizing",
  "variables": ["{{FirstName}}", "{{Company}}"]
}

Generate the improved email now. Return ONLY the JSON object, no other text.`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    temperature: 0.8, // More creative for regeneration
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON object found in response')
  }

  return JSON.parse(jsonMatch[0]) as GeneratedEmail
}
