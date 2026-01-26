// Email Reply Generation Service
// Generates AI-powered email responses based on context

import { createOpenAIClient } from './openai'
import type { IntentClassification } from './intent'

export interface ReplyContext {
  agentName: string
  agentTone: 'casual' | 'professional' | 'friendly' | 'formal'
  instructions: string[]
  kbEntries: Array<{ title: string; content: string }>
  conversationHistory: Array<{ direction: 'inbound' | 'outbound'; content: string }>
  latestMessage: string
  intentScore: number
  senderName?: string
}

export interface GeneratedReply {
  content: string
  confidence: number
  instructionsUsed: string[]
  kbEntriesUsed: string[]
  reasoning?: string
}

/**
 * Build the system prompt for reply generation
 */
function buildSystemPrompt(context: ReplyContext): string {
  const toneDescriptions = {
    casual: 'Keep responses relaxed, conversational, and approachable. Use contractions and friendly language.',
    professional: 'Maintain a business-appropriate tone. Be clear, concise, and respectful.',
    friendly: 'Be warm and personable while remaining professional. Show genuine interest.',
    formal: 'Use formal language and proper business etiquette. Be polished and respectful.',
  }

  let prompt = `You are ${context.agentName}, an AI sales assistant responding to email replies.

COMMUNICATION TONE: ${context.agentTone.toUpperCase()}
${toneDescriptions[context.agentTone]}

INTENT SCORE: ${context.intentScore}/10 (${getIntentLabel(context.intentScore)})`

  if (context.instructions.length > 0) {
    prompt += '\n\nYOUR INSTRUCTIONS (follow these carefully):'
    context.instructions.forEach((instruction, i) => {
      prompt += `\n${i + 1}. ${instruction}`
    })
  }

  if (context.kbEntries.length > 0) {
    prompt += '\n\nKNOWLEDGE BASE (use this information when relevant):'
    context.kbEntries.forEach((entry) => {
      prompt += `\n\n[${entry.title}]\n${entry.content}`
    })
  }

  prompt += `

IMPORTANT GUIDELINES:
- Keep responses concise and to the point
- Address the sender's specific questions or concerns
- End with a clear call-to-action when appropriate
- Do not include email headers, signatures, or greetings like "Hi [Name]," at the start
- Output ONLY the email reply text, nothing else
- Do not wrap the reply in quotes or markdown
- If the sender seems uninterested, be respectful and don't be pushy`

  return prompt
}

/**
 * Build the user prompt with conversation context
 */
function buildUserPrompt(context: ReplyContext): string {
  let prompt = ''

  if (context.conversationHistory.length > 0) {
    prompt += 'CONVERSATION HISTORY:\n'
    context.conversationHistory.forEach((msg) => {
      const label = msg.direction === 'inbound' ? 'THEM' : 'US'
      prompt += `\n[${label}]: ${msg.content.substring(0, 500)}\n`
    })
    prompt += '\n---\n'
  }

  prompt += `LATEST INBOUND MESSAGE:
${context.latestMessage}

---

Generate a reply to this message.`

  return prompt
}

/**
 * Get intent label from score
 */
function getIntentLabel(score: number): string {
  if (score >= 8) return 'High Intent - They want to proceed'
  if (score >= 5) return 'Medium Intent - Engaged but exploring'
  if (score >= 3) return 'Low Intent - Skeptical or hesitant'
  return 'No Intent - Not interested'
}

/**
 * Clean the AI-generated reply
 */
function cleanReply(reply: string): string {
  let cleaned = reply.trim()

  // Remove markdown code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '')
  cleaned = cleaned.replace(/`/g, '')

  // Remove common prefixes
  cleaned = cleaned.replace(/^(REPLY:|Response:|Email:)\s*/i, '')

  // Remove surrounding quotes
  cleaned = cleaned.replace(/^["']|["']$/g, '')

  // Remove email headers if accidentally included
  cleaned = cleaned.replace(/^(Subject:|To:|From:|Date:).*\n?/gim, '')

  return cleaned.trim()
}

/**
 * Calculate confidence score for a generated reply
 */
async function calculateConfidence(
  reply: string,
  context: ReplyContext,
  apiKey: string
): Promise<{
  confidence: number
  instructionsUsed: string[]
  kbEntriesUsed: string[]
}> {
  // Simple heuristic-based confidence calculation
  let confidence = 0.5

  // Check reply length
  if (reply.length < 50) confidence -= 0.1
  if (reply.length > 100 && reply.length < 500) confidence += 0.1

  // Check for question handling
  const hasQuestion = /\?/.test(context.latestMessage)
  const answersQuestion = reply.length > 100 || /because|since|the reason/i.test(reply)
  if (hasQuestion && answersQuestion) confidence += 0.15

  // Check for CTA
  const hasCTA = /\?|let me know|happy to|would you|can we|shall we/i.test(reply)
  if (hasCTA) confidence += 0.1

  // Clamp confidence
  confidence = Math.min(1, Math.max(0, confidence))

  // Simple keyword matching for used items
  const instructionsUsed = context.instructions.filter((inst) => {
    const keywords = inst.toLowerCase().split(/\s+/).slice(0, 5)
    return keywords.some((kw) => reply.toLowerCase().includes(kw))
  })

  const kbEntriesUsed = context.kbEntries
    .filter((entry) => {
      const keywords = entry.title.toLowerCase().split(/\s+/)
      return keywords.some((kw) => reply.toLowerCase().includes(kw))
    })
    .map((e) => e.title)

  return { confidence, instructionsUsed, kbEntriesUsed }
}

/**
 * Generate an email reply based on context
 */
export async function generateReply(
  context: ReplyContext,
  apiKey: string
): Promise<GeneratedReply> {
  const client = createOpenAIClient(apiKey, 'gpt-4o-mini')

  const systemPrompt = buildSystemPrompt(context)
  const userPrompt = buildUserPrompt(context)

  try {
    const response = await client.chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 500,
    })

    const cleanedReply = cleanReply(response.content)

    const { confidence, instructionsUsed, kbEntriesUsed } = await calculateConfidence(
      cleanedReply,
      context,
      apiKey
    )

    return {
      content: cleanedReply,
      confidence,
      instructionsUsed,
      kbEntriesUsed,
    }
  } catch (error) {
    console.error('[Reply Generation] Error:', error)
    throw new Error(
      `Failed to generate reply: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Select relevant KB entries based on email content
 */
export function selectRelevantKBEntries(
  emailContent: string,
  kbEntries: Array<{ title: string; content: string; tags?: string[] }>,
  maxEntries = 3
): Array<{ title: string; content: string }> {
  const emailWords = new Set(
    emailContent.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
  )

  // Score each entry by keyword overlap
  const scored = kbEntries.map((entry) => {
    const entryWords = new Set([
      ...entry.title.toLowerCase().split(/\W+/),
      ...(entry.content.toLowerCase().split(/\W+/).slice(0, 50)),
      ...(entry.tags || []).map((t) => t.toLowerCase()),
    ])

    let score = 0
    for (const word of emailWords) {
      if (entryWords.has(word)) score++
    }

    return { entry, score }
  })

  // Sort by score and take top entries
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxEntries)
    .filter((s) => s.score > 0)
    .map((s) => ({ title: s.entry.title, content: s.entry.content }))
}
