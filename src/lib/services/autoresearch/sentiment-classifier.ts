// Sentiment Classifier for Autoresearch Experiments
// Tier 1: Fast keyword matching (no API cost)
// Tier 2: Claude Haiku classification (for ambiguous cases)

import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkSpendLimit, recordSpend } from '@/lib/services/api-spend-guard'
import type { AutoresearchSentiment } from '@/types/autoresearch'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SentimentClassification {
  readonly sentiment: AutoresearchSentiment
  readonly confidence: number
  readonly classifiedBy: 'keyword' | 'claude'
  readonly keywordsMatched: string[]
}

// ---------------------------------------------------------------------------
// Keyword Dictionaries
// ---------------------------------------------------------------------------

const POSITIVE_KEYWORDS = [
  'interested', "let's talk", 'sounds good', 'set up a call', 'tell me more',
  'love to', 'when can we', 'pricing', 'demo', 'schedule', 'available',
  "let's connect", 'great timing', 'perfect timing', 'yes', 'absolutely',
] as const

const NEGATIVE_KEYWORDS = [
  'not interested', 'remove', 'unsubscribe', 'stop', 'no thanks',
  "don't contact", 'cease', 'opt out', 'take me off', 'wrong person',
  'not relevant',
] as const

const UNSUBSCRIBE_KEYWORDS = [
  'unsubscribe', 'remove me', 'opt out', 'stop emailing',
] as const

const OOO_KEYWORDS = [
  'out of office', 'ooo', 'currently away', 'on vacation',
  'auto-reply', 'automatic reply',
] as const

// ---------------------------------------------------------------------------
// Lazy-initialized Anthropic Client
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tier 1: Keyword Matching
// ---------------------------------------------------------------------------

function findMatchingKeywords(
  text: string,
  keywords: readonly string[]
): string[] {
  const lower = text.toLowerCase()
  return keywords.filter((kw) => lower.includes(kw.toLowerCase()))
}

function classifyByKeyword(
  text: string
): SentimentClassification | null {
  const combined = text.toLowerCase()

  // Check unsubscribe first (highest priority)
  const unsubMatches = findMatchingKeywords(combined, UNSUBSCRIBE_KEYWORDS)
  if (unsubMatches.length > 0) {
    return {
      sentiment: 'unsubscribe',
      confidence: 0.95,
      classifiedBy: 'keyword',
      keywordsMatched: unsubMatches,
    }
  }

  // Check out-of-office
  const oooMatches = findMatchingKeywords(combined, OOO_KEYWORDS)
  if (oooMatches.length > 0) {
    return {
      sentiment: 'out_of_office',
      confidence: 0.95,
      classifiedBy: 'keyword',
      keywordsMatched: oooMatches,
    }
  }

  // Check negative (before positive, since "not interested" contains "interested")
  const negMatches = findMatchingKeywords(combined, NEGATIVE_KEYWORDS)
  if (negMatches.length > 0) {
    return {
      sentiment: 'negative',
      confidence: 0.9,
      classifiedBy: 'keyword',
      keywordsMatched: negMatches,
    }
  }

  // Check positive
  const posMatches = findMatchingKeywords(combined, POSITIVE_KEYWORDS)
  if (posMatches.length > 0) {
    return {
      sentiment: 'positive',
      confidence: 0.9,
      classifiedBy: 'keyword',
      keywordsMatched: posMatches,
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Tier 2: Claude Haiku Classification
// ---------------------------------------------------------------------------

const CLASSIFICATION_PROMPT = `You are classifying an email reply to a cold outreach campaign.

Classify the reply into exactly ONE sentiment category:
- positive: Interested, wants to talk, asks for more info, scheduling
- neutral: Acknowledged but unclear intent, generic response
- negative: Not interested, rejection, hostile, wrong person
- unsubscribe: Explicit unsubscribe or removal request
- out_of_office: Auto-reply, vacation, away message

Respond ONLY with valid JSON:
{
  "sentiment": "positive|neutral|negative|unsubscribe|out_of_office",
  "confidence": 0.0-1.0,
  "reasoning": "Brief 1-sentence explanation"
}`

async function classifyWithClaude(
  replyBody: string,
  replySubject: string
): Promise<SentimentClassification> {
  const client = getAnthropicClient()

  const userPrompt = `SUBJECT: ${replySubject || '(no subject)'}

BODY:
${replyBody.substring(0, 1500)}`

  await checkSpendLimit()

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [
      { role: 'user', content: `${CLASSIFICATION_PROMPT}\n\n${userPrompt}` },
    ],
  })

  if (response.usage) {
    const cost = (response.usage.input_tokens * 0.80 + response.usage.output_tokens * 4.00) / 1_000_000
    recordSpend(cost)
  }

  if (!response.content || response.content.length === 0 || response.content[0].type !== 'text') {
    throw new Error('Empty or invalid Claude response')
  }

  const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON found in Claude response')
  }

  const result = JSON.parse(jsonMatch[0])

  const validSentiments: AutoresearchSentiment[] = [
    'positive', 'neutral', 'negative', 'unsubscribe', 'out_of_office',
  ]
  const sentiment = validSentiments.includes(result.sentiment)
    ? result.sentiment as AutoresearchSentiment
    : 'neutral'

  return {
    sentiment,
    confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0.7)),
    classifiedBy: 'claude',
    keywordsMatched: [],
  }
}

// ---------------------------------------------------------------------------
// Classification Logging
// ---------------------------------------------------------------------------

async function logClassification(
  result: SentimentClassification,
  replyBody: string,
  options: { replyId?: string; emailbisonReplyId?: string }
): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from('reply_classification_logs').insert({
      reply_id: options.replyId ?? null,
      emailbison_reply_id: options.emailbisonReplyId ?? null,
      method: result.classifiedBy,
      confidence: result.confidence,
      classification: result.sentiment,
      keywords_matched: result.keywordsMatched,
      reply_snippet: replyBody.slice(0, 280),
      classified_at: new Date().toISOString(),
    })
  } catch {
    // Logging is non-critical — never block classification
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ClassifySentimentOptions {
  /** Internal email_replies.id — used for idempotency + logging */
  replyId?: string
  /** External EmailBison reply ID — used for idempotency + logging */
  emailbisonReplyId?: string
  /** When true, skip logging (e.g. for batch dry-runs) */
  skipLog?: boolean
}

export async function classifySentiment(
  replyBody: string,
  replySubject: string,
  options: ClassifySentimentOptions = {}
): Promise<SentimentClassification> {
  const combinedText = `${replySubject} ${replyBody}`

  // Tier 1: Keyword matching (fast, no cost)
  const keywordResult = classifyByKeyword(combinedText)
  if (keywordResult) {
    if (!options.skipLog) {
      await logClassification(keywordResult, replyBody, options)
    }
    return keywordResult
  }

  // Tier 2: Claude Haiku (for ambiguous cases)
  try {
    const claudeResult = await classifyWithClaude(replyBody, replySubject)
    if (!options.skipLog) {
      await logClassification(claudeResult, replyBody, options)
    }
    return claudeResult
  } catch {
    // Fallback: neutral with low confidence
    const fallback: SentimentClassification = {
      sentiment: 'neutral',
      confidence: 0.3,
      classifiedBy: 'keyword',
      keywordsMatched: [],
    }
    if (!options.skipLog) {
      await logClassification(fallback, replyBody, options)
    }
    return fallback
  }
}
