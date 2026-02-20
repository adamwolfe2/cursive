// Intent Classification Service
// Classifies email replies by buyer intent

import { createOpenAIClient, type OpenAIClient } from './openai'
import { safeError } from '@/lib/utils/log-sanitizer'

export type IntentCategory =
  | 'INTERESTED'      // 8-10: Wants demo, call, more info
  | 'CURIOUS'         // 5-7: Engaging but non-committal
  | 'QUESTION'        // 5-7: Has specific questions
  | 'OBJECTION'       // 3-4: Concerns or pushback
  | 'NOT_INTERESTED'  // 1-2: Clear rejection
  | 'UNSUBSCRIBE'     // 0: Unsubscribe request
  | 'OUT_OF_OFFICE'   // 0: Auto-reply
  | 'WRONG_PERSON'    // 0: Wrong contact

export type SuggestedAction =
  | 'auto_reply'    // Can auto-respond
  | 'human_review'  // Needs human review
  | 'ignore'        // No action needed
  | 'unsubscribe'   // Remove from list

export interface IntentClassification {
  category: IntentCategory
  score: number // 0-10
  reasoning: string
  suggestedAction: SuggestedAction
  confidence: number // 0-1
}

// Quick pattern matching for obvious cases
const QUICK_PATTERNS: Array<{
  patterns: RegExp[]
  category: IntentCategory
  score: number
  action: SuggestedAction
}> = [
  {
    patterns: [
      /\bunsubscribe\b/i,
      /\bremove me\b/i,
      /\bstop emailing\b/i,
      /\btake me off\b/i,
    ],
    category: 'UNSUBSCRIBE',
    score: 0,
    action: 'unsubscribe',
  },
  {
    patterns: [
      /\bout of (the )?office\b/i,
      /\bon (vacation|leave|holiday)\b/i,
      /\baway from (my )?desk\b/i,
      /\bauto(matic)?-?reply\b/i,
      /\bI('m| am) (currently )?away\b/i,
    ],
    category: 'OUT_OF_OFFICE',
    score: 0,
    action: 'ignore',
  },
  {
    patterns: [
      /\blet's (schedule|set up|book)\b/i,
      /\bwhen (can|are) (you|we)\b/i,
      /\bI('m| am) interested\b/i,
      /\bsounds (great|good|interesting)\b/i,
      /\btell me more\b/i,
      /\bI'd love to\b/i,
      /\byes,? please\b/i,
    ],
    category: 'INTERESTED',
    score: 8,
    action: 'auto_reply',
  },
  {
    patterns: [
      /\bnot interested\b/i,
      /\bno thanks\b/i,
      /\bwe('re| are) (all )?set\b/i,
      /\bplease don't\b/i,
      /\bwe already have\b/i,
    ],
    category: 'NOT_INTERESTED',
    score: 2,
    action: 'ignore',
  },
]

/**
 * Quick heuristic classification for obvious cases
 */
export function quickClassify(emailBody: string): IntentClassification | null {
  const normalizedBody = emailBody.toLowerCase()

  for (const pattern of QUICK_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(normalizedBody)) {
        return {
          category: pattern.category,
          score: pattern.score,
          reasoning: `Matched quick pattern: ${regex.source}`,
          suggestedAction: pattern.action,
          confidence: 0.9,
        }
      }
    }
  }

  return null
}

/**
 * AI-powered intent classification for ambiguous cases
 */
export async function classifyIntent(
  emailBody: string,
  apiKey: string
): Promise<IntentClassification> {
  // Try quick classification first
  const quickResult = quickClassify(emailBody)
  if (quickResult) {
    return quickResult
  }

  // Use AI for ambiguous cases
  const client = createOpenAIClient(apiKey, 'gpt-4o-mini')

  const systemPrompt = `You are analyzing email replies to cold outreach campaigns.

Classify the email into ONE of these categories:
1. INTERESTED (8-10) - Asks for more info, demo, call, or shows clear buying interest
2. CURIOUS (5-7) - Engaging but non-committal, wants to learn more
3. QUESTION (5-7) - Has specific questions about product/service
4. OBJECTION (3-4) - Concerns, pushback, or hesitation
5. NOT_INTERESTED (1-2) - Clear rejection or decline
6. UNSUBSCRIBE (0) - Explicit unsubscribe request
7. OUT_OF_OFFICE (0) - Auto-reply or away message
8. WRONG_PERSON (0) - Not the right contact

Respond ONLY with valid JSON in this exact format:
{
  "category": "CATEGORY_NAME",
  "score": NUMBER,
  "reasoning": "Brief 1-sentence explanation",
  "suggestedAction": "auto_reply" | "human_review" | "ignore" | "unsubscribe"
}`

  const userPrompt = `EMAIL TO CLASSIFY:
---
${emailBody}
---`

  try {
    const response = await client.chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      maxTokens: 300,
    })

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const result = JSON.parse(jsonMatch[0])

    return {
      category: result.category as IntentCategory,
      score: Number(result.score) || 5,
      reasoning: result.reasoning || 'AI classification',
      suggestedAction: result.suggestedAction as SuggestedAction || 'human_review',
      confidence: 0.8,
    }
  } catch (error) {
    safeError('[Intent Classification] AI error:', error)

    // Fallback to neutral classification
    return {
      category: 'CURIOUS',
      score: 5,
      reasoning: 'AI classification failed, defaulting to human review',
      suggestedAction: 'human_review',
      confidence: 0.3,
    }
  }
}

/**
 * Get intent score label
 */
export function getIntentLabel(score: number): string {
  if (score >= 8) return 'High Intent'
  if (score >= 5) return 'Medium Intent'
  if (score >= 3) return 'Low Intent'
  return 'No Intent'
}
