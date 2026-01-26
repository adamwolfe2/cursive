// Campaign Builder Service
// Uses AI to generate email campaigns from client onboarding forms

import { createAIProvider, type AIProvider } from '../ai/provider'
import type {
  ClientOnboardingForm,
  GeneratedCampaign,
  CampaignSettings,
  EmailSequenceStep,
  ColdEmailBestPractice,
} from './types'

// Default campaign settings based on best practices
const DEFAULT_SETTINGS: CampaignSettings = {
  dailySendLimit: 50,
  sendingWindowStart: '08:00',
  sendingWindowEnd: '17:00',
  sendingTimezone: 'America/New_York',
  sendOnWeekends: false,
  enableSpintax: true,
  warmupEnabled: true,
  replyHandling: 'ai_draft',
  maxLeadsPerCompany: 3,
  excludeDomains: [],
  trackOpens: true,
  trackClicks: false, // Links can hurt deliverability
}

/**
 * Build campaign generation prompt
 */
function buildCampaignPrompt(
  form: ClientOnboardingForm,
  bestPractices: ColdEmailBestPractice[]
): string {
  // Group best practices by category
  const practicesByCategory = bestPractices.reduce(
    (acc, bp) => {
      if (!acc[bp.category]) acc[bp.category] = []
      acc[bp.category].push(bp)
      return acc
    },
    {} as Record<string, ColdEmailBestPractice[]>
  )

  let prompt = `You are an expert cold email campaign strategist. Generate a complete email campaign based on the client information below.

## CLIENT INFORMATION

**Company:** ${form.companyName}
**Website:** ${form.companyWebsite}
**Description:** ${form.companyDescription}
**Industry:** ${form.industryVertical}

**Product/Service:** ${form.productName}
**What it does:** ${form.productDescription}
**Main benefit:** ${form.mainBenefit}
**Unique selling points:**
${form.uniqueSellingPoints.map((usp) => `- ${usp}`).join('\n')}
${form.priceRange ? `**Price range:** ${form.priceRange}` : ''}

**Target ICP:**
- Job titles: ${form.targetJobTitles.join(', ')}
- Company size: ${form.targetCompanySize}
- Industries: ${form.targetIndustries.join(', ')}
- Locations: ${form.targetLocations.join(', ')}

**Campaign Goal:** ${form.campaignGoal}${form.customGoal ? ` (${form.customGoal})` : ''}
**Desired Outcome:** ${form.desiredOutcome}

**Offer:** ${form.offerType}
**Offer Details:** ${form.offerDetails}
**CTA:** ${form.callToAction}

**Tone:** ${form.tonePreference}
${form.brandVoiceNotes ? `**Brand voice notes:** ${form.brandVoiceNotes}` : ''}
${form.avoidTopics?.length ? `**Avoid mentioning:** ${form.avoidTopics.join(', ')}` : ''}

## COLD EMAIL BEST PRACTICES TO FOLLOW

`

  // Add relevant best practices
  for (const [category, practices] of Object.entries(practicesByCategory)) {
    prompt += `\n### ${category.toUpperCase().replace('_', ' ')}\n`
    for (const practice of practices.slice(0, 3)) {
      // Top 3 per category
      prompt += `- ${practice.title}: ${practice.content}\n`
      if (practice.examples?.length) {
        prompt += `  Examples: ${practice.examples.slice(0, 2).join('; ')}\n`
      }
    }
  }

  prompt += `

## YOUR TASK

Generate a complete 4-step email sequence (1 initial + 3 follow-ups) that:
1. Follows ALL the best practices above
2. Is tailored to the target ICP
3. Has compelling subject lines (under 50 chars, no spam words)
4. Opens with pattern-interrupting, personalized first lines
5. Keeps emails SHORT (under 100 words for initial, under 75 for follow-ups)
6. Has clear, single CTAs
7. Includes spintax variations for key phrases
8. Gets progressively shorter and more direct in follow-ups

## OUTPUT FORMAT

Respond with valid JSON only:
{
  "sequence": [
    {
      "order": 1,
      "type": "initial",
      "delayDays": 0,
      "subject": "Subject line here",
      "subjectVariants": ["Variant 1", "Variant 2"],
      "body": "Email body here with {{firstName}} personalization",
      "bodyVariants": ["Variant body 1", "Variant body 2"],
      "subjectWithSpintax": "{Subject line|Alternative subject} here",
      "bodyWithSpintax": "Body with {spintax|variations} included"
    }
    // ... more steps
  ],
  "settings": {
    "dailySendLimit": 50,
    "replyHandling": "ai_draft",
    "enableSpintax": true
  },
  "reasoning": {
    "settingsRationale": "Why these settings...",
    "sequenceRationale": "Why this sequence structure...",
    "offerRationale": "Why this offer positioning..."
  },
  "estimatedMetrics": {
    "expectedOpenRate": "25-35%",
    "expectedReplyRate": "3-5%",
    "bestSendTimes": ["Tuesday 10am", "Wednesday 2pm", "Thursday 9am"]
  },
  "warnings": ["Any concerns about the campaign..."],
  "suggestions": ["Additional recommendations..."]
}`

  return prompt
}

/**
 * Generate a campaign from a client onboarding form
 */
export async function generateCampaign(
  form: ClientOnboardingForm,
  bestPractices: ColdEmailBestPractice[],
  options: {
    anthropicKey?: string
    openaiKey?: string
  }
): Promise<GeneratedCampaign> {
  const aiProvider = createAIProvider({
    anthropicKey: options.anthropicKey,
    openaiKey: options.openaiKey,
    preferredProvider: 'anthropic',
  })

  const prompt = buildCampaignPrompt(form, bestPractices)

  const response = await aiProvider.complete({
    system: `You are an expert cold email campaign strategist with years of experience
building high-converting outbound campaigns. You deeply understand deliverability,
copywriting psychology, and B2B sales. You always follow best practices and create
campaigns that get results while maintaining sender reputation.`,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    maxTokens: 4000,
  })

  // Parse the JSON response
  const jsonMatch = response.content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to parse campaign generation response')
  }

  const result = JSON.parse(jsonMatch[0])

  // Merge with defaults
  const campaignConfig: GeneratedCampaign = {
    campaignConfig: {
      workspaceId: '', // To be filled by caller
      name: `${form.companyName} - ${form.campaignGoal}`,
      status: 'draft',
      onboardingData: form,
      settings: { ...DEFAULT_SETTINGS, ...result.settings },
      sequence: result.sequence.map((step: Partial<EmailSequenceStep>, index: number) => ({
        id: `step-${index + 1}`,
        order: step.order || index + 1,
        type: step.type || (index === 0 ? 'initial' : 'followup'),
        delayDays: step.delayDays || (index === 0 ? 0 : index * 3),
        subject: step.subject || '',
        subjectVariants: step.subjectVariants || [],
        body: step.body || '',
        bodyVariants: step.bodyVariants || [],
        subjectWithSpintax: step.subjectWithSpintax,
        bodyWithSpintax: step.bodyWithSpintax,
        sendIf: { noReply: true },
      })),
    },
    reasoning: result.reasoning || {
      settingsRationale: 'Generated with best practices',
      sequenceRationale: 'Standard 4-step sequence',
      offerRationale: 'Based on provided offer details',
    },
    estimatedMetrics: result.estimatedMetrics || {
      expectedOpenRate: '20-30%',
      expectedReplyRate: '2-4%',
      bestSendTimes: ['Tuesday 10am', 'Wednesday 2pm'],
    },
    warnings: result.warnings,
    suggestions: result.suggestions,
  }

  return campaignConfig
}

/**
 * Apply spintax to an email body
 * Spintax format: {option1|option2|option3}
 */
export function applySpintax(text: string): string {
  return text.replace(/\{([^}]+)\}/g, (_, options) => {
    const choices = options.split('|')
    return choices[Math.floor(Math.random() * choices.length)]
  })
}

/**
 * Generate spintax for a piece of text
 */
export async function generateSpintax(
  text: string,
  aiProvider: AIProvider
): Promise<string> {
  const response = await aiProvider.complete({
    system: `You are a spintax expert. Convert the given text into spintax format
where key phrases have 2-3 variations. Keep the meaning identical.
Use format: {option1|option2|option3}. Only add spintax where it makes sense
and won't change the core message.`,
    messages: [
      {
        role: 'user',
        content: `Convert this email to spintax:\n\n${text}`,
      },
    ],
    temperature: 0.5,
    maxTokens: 500,
  })

  return response.content
}
