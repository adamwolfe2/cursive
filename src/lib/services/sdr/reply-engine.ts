/**
 * Reply Engine
 * The AI SDR brain — generates intelligent replies based on conversation context,
 * knowledge base, and templates. Uses the cold email masterclass knowledge to
 * ensure replies are human, short, and conversational.
 */

import Anthropic from '@anthropic-ai/sdk'
import type {
  ConversationMessage,
  LeadContext,
  GeneratedReply,
  ReplyDecision,
  ConversationStage,
  SdrKnowledgeEntry,
  SdrConfigurationEnhanced,
  ReplyTemplate,
} from '@/types/sdr'
import { SdrKnowledgeRepository } from '@/lib/repositories/sdr-knowledge.repository'
import { SdrTemplateRepository } from '@/lib/repositories/sdr-template.repository'
import {
  FOUR_STEP_FRAMEWORK,
  CORPORATE_KILL_SIGNALS,
  LLM_ISM_RED_FLAGS,
  FOLLOW_UP_RULES,
} from '../autoresearch/cold-email-knowledge'
import { checkSpendLimit, recordSpend } from '@/lib/services/api-spend-guard'
import {
  extractKeywords,
  detectSchedulingIntent,
  detectStageTransition,
  shouldEscalate,
} from './conversation-manager'

// ---------------------------------------------------------------------------
// Lazy-initialized Anthropic client (matches campaign-reply.ts pattern)
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
// Main entry point
// ---------------------------------------------------------------------------

export async function generateReply(params: {
  readonly replyBody: string
  readonly replySubject: string
  readonly conversationHistory: ConversationMessage[]
  readonly leadContext: LeadContext
  readonly workspaceId: string
  readonly config: SdrConfigurationEnhanced
  readonly sentiment: string
  readonly intentScore: number
  readonly conversationId: string
  readonly replyId: string
  readonly turnCount: number
  readonly currentStage: ConversationStage
}): Promise<ReplyDecision> {
  const {
    replyBody,
    replySubject,
    conversationHistory,
    leadContext,
    workspaceId,
    config,
    sentiment,
    intentScore,
    conversationId,
    replyId,
    turnCount,
    currentStage,
  } = params

  // 1. Skip replies that should not be answered
  if (sentiment === 'unsubscribe' || sentiment === 'not_interested') {
    return {
      action: 'skip',
      reason: `Skipping reply: sentiment is ${sentiment}`,
      reply: null,
      conversationId,
      replyId,
    }
  }

  // 2. Query knowledge base for relevant entries
  const knowledgeRepo = new SdrKnowledgeRepository()
  const keywords = extractKeywords(replyBody)
  const knowledgeEntries = keywords.length > 0
    ? await knowledgeRepo.findByKeywords(workspaceId, keywords)
    : []

  // 3. Find matching template
  const templateRepo = new SdrTemplateRepository()
  const matchedTemplate = await templateRepo.findMatchingTemplate(workspaceId, {
    sentiment,
    intentScore,
    conversationStage: currentStage,
  })

  // 4. Determine conversation stage transition
  const stageTransition = detectStageTransition({
    currentStage,
    replyBody,
    sentiment,
    intentScore,
    turnCount,
  })

  const effectiveStage = stageTransition?.newStage ?? currentStage

  // 5. Check escalation before generating reply
  const escalationCheck = shouldEscalate({
    turnCount,
    maxAiTurns: config.max_ai_turns,
    escalationAfterTurns: config.escalation_after_turns,
    sentiment,
    confidence: 0.8, // placeholder — updated after generation
  })

  if (escalationCheck.escalate) {
    return {
      action: 'escalate',
      reason: escalationCheck.reason,
      reply: {
        subject: null,
        body: '',
        tone: 'neutral',
        confidence: 0,
        knowledgeEntriesUsed: [],
        templateUsed: null,
        suggestedStageTransition: stageTransition?.newStage ?? null,
        shouldEscalate: true,
        escalationReason: escalationCheck.reason,
      },
      conversationId,
      replyId,
    }
  }

  // 6. Build prompt and call Claude
  const prompt = buildReplyPrompt({
    replyBody,
    replySubject,
    conversationHistory,
    leadContext,
    knowledgeEntries,
    matchedTemplate,
    config,
    effectiveStage,
    turnCount,
  })

  const generatedReply = await callClaude(prompt, {
    knowledgeEntries,
    matchedTemplate,
    stageTransition,
  })

  // 7. Quality check
  const qualityIssues = checkReplyQuality(generatedReply.body)

  // Lower confidence if quality issues found
  const adjustedConfidence = qualityIssues.length > 0
    ? Math.max(0.3, generatedReply.confidence - qualityIssues.length * 0.1)
    : generatedReply.confidence

  const finalReply: GeneratedReply = {
    ...generatedReply,
    confidence: adjustedConfidence,
  }

  // 8. Re-check escalation with actual confidence
  const postGenEscalation = shouldEscalate({
    turnCount,
    maxAiTurns: config.max_ai_turns,
    escalationAfterTurns: config.escalation_after_turns,
    sentiment,
    confidence: adjustedConfidence,
  })

  if (postGenEscalation.escalate) {
    return {
      action: 'escalate',
      reason: postGenEscalation.reason,
      reply: { ...finalReply, shouldEscalate: true, escalationReason: postGenEscalation.reason },
      conversationId,
      replyId,
    }
  }

  // 9. Decide action
  const action = decideAction({
    reply: finalReply,
    config,
    sentiment,
    turnCount,
  })

  return {
    action,
    reason: buildActionReason(action, sentiment, adjustedConfidence, config),
    reply: finalReply,
    conversationId,
    replyId,
  }
}

// ---------------------------------------------------------------------------
// Prompt Builder
// ---------------------------------------------------------------------------

function buildReplyPrompt(context: {
  readonly replyBody: string
  readonly replySubject: string
  readonly conversationHistory: ConversationMessage[]
  readonly leadContext: LeadContext
  readonly knowledgeEntries: SdrKnowledgeEntry[]
  readonly matchedTemplate: ReplyTemplate | null
  readonly config: SdrConfigurationEnhanced
  readonly effectiveStage: ConversationStage
  readonly turnCount: number
}): string {
  const {
    replyBody,
    replySubject,
    conversationHistory,
    leadContext,
    knowledgeEntries,
    matchedTemplate,
    config,
    effectiveStage,
    turnCount,
  } = context

  const leadName = leadContext.firstName || 'there'
  const companyName = leadContext.companyName || ''
  const jobTitle = leadContext.jobTitle || ''
  const calUrl = config.cal_booking_url || ''
  const hasSchedulingIntent = detectSchedulingIntent(replyBody)

  // Build conversation thread
  const threadSummary = conversationHistory
    .slice(-6) // last 6 messages for context
    .map((msg) => {
      const dir = msg.direction === 'outbound' ? 'US' : 'THEM'
      return `[${dir}]: ${msg.body.slice(0, 300)}`
    })
    .join('\n\n')

  // Build knowledge context
  const knowledgeContext = knowledgeEntries.length > 0
    ? knowledgeEntries
        .slice(0, 5)
        .map((e) => `[${e.category.toUpperCase()}] ${e.title}: ${e.content.slice(0, 200)}`)
        .join('\n')
    : ''

  // Build template skeleton
  const templateSkeleton = matchedTemplate
    ? `\nTEMPLATE SKELETON (use as inspiration, do NOT copy verbatim):\n${matchedTemplate.body_template}`
    : ''

  // Follow-up rules from masterclass
  const followUpRules = FOLLOW_UP_RULES.rules.join('\n- ')
  const ctaRules = FOUR_STEP_FRAMEWORK.step4_cta.rules.join('\n- ')

  const sections = [
    `You are an AI SDR replying to an email on behalf of a sales team. Your goal: ${config.objective}`,
    '',
    '--- THEIR LATEST REPLY ---',
    `Subject: ${replySubject || '(no subject)'}`,
    replyBody,
    '',
    '--- CONVERSATION HISTORY ---',
    threadSummary || '(first reply in thread)',
    '',
    '--- LEAD ---',
    `Name: ${leadName}`,
    companyName ? `Company: ${companyName}` : '',
    jobTitle ? `Title: ${jobTitle}` : '',
    `Conversation stage: ${effectiveStage}`,
    `Turn count: ${turnCount}`,
    '',
    knowledgeContext ? `--- KNOWLEDGE BASE ---\n${knowledgeContext}\n` : '',
    templateSkeleton,
    config.brand_voice_notes ? `\n--- BRAND VOICE ---\n${config.brand_voice_notes}\n` : '',
    '',
    '--- REPLY RULES ---',
    '- Keep it SHORT (under 100 words). Write like a human texting a colleague.',
    '- Reference the conversation naturally — do not repeat what they said back to them.',
    '- If they asked a question, answer it directly using knowledge base facts (do NOT dump info).',
    '- If they raised an objection, handle it briefly and redirect to value.',
    `- Follow-up rules: ${followUpRules}`,
    `- CTA rules: ${ctaRules}`,
    '- No HTML, no links, no logos, no formal sign-offs.',
    '- Do NOT start with "I hope this finds you well" or any corporate opener.',
    '- Sound like a real person. Short sentences. Occasional sentence fragments are fine.',
    '- Use "Hi" or "Hey" + first name. Sign off with just first name or "Best,".',
    '',
  ]

  if (hasSchedulingIntent && calUrl) {
    sections.push(
      '--- SCHEDULING DETECTED ---',
      `The prospect wants to schedule. Include this booking link: ${calUrl}`,
      'Propose 2 specific time options and include the booking link as a fallback.',
      ''
    )
  }

  sections.push(
    'Respond with valid JSON only:',
    '{',
    '  "subject": "Re: ... (or null to keep thread subject)",',
    '  "body": "The full email reply body",',
    '  "tone": "casual|helpful|professional|enthusiastic",',
    '  "confidence": 0.0-1.0',
    '}'
  )

  return sections.filter(Boolean).join('\n')
}

// ---------------------------------------------------------------------------
// Claude API Call
// ---------------------------------------------------------------------------

async function callClaude(
  prompt: string,
  context: {
    readonly knowledgeEntries: SdrKnowledgeEntry[]
    readonly matchedTemplate: ReplyTemplate | null
    readonly stageTransition: { readonly newStage: ConversationStage; readonly reason: string } | null
  }
): Promise<GeneratedReply> {
  const client = getAnthropicClient()

  // Check daily spend cap before making a paid API call
  await checkSpendLimit()

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 768,
      messages: [{ role: 'user', content: prompt }],
    })

    // Track spend from this call
    const usage = response.usage
    if (usage) {
      const cost = (usage.input_tokens * 0.80 + usage.output_tokens * 4.00) / 1_000_000
      recordSpend(cost)
    }

    if (!response.content || response.content.length === 0 || response.content[0].type !== 'text') {
      return buildFallbackReply(context)
    }

    const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return buildFallbackReply(context)
    }

    const result = JSON.parse(jsonMatch[0])

    return {
      subject: result.subject || null,
      body: result.body || '',
      tone: result.tone || 'professional',
      confidence: Math.max(0, Math.min(1, Number(result.confidence) || 0.7)),
      knowledgeEntriesUsed: context.knowledgeEntries.slice(0, 5).map((e) => e.id),
      templateUsed: context.matchedTemplate?.id ?? null,
      suggestedStageTransition: context.stageTransition?.newStage ?? null,
      shouldEscalate: false,
      escalationReason: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Claude API error during reply generation: ${message}`)
  }
}

function buildFallbackReply(context: {
  readonly knowledgeEntries: SdrKnowledgeEntry[]
  readonly matchedTemplate: ReplyTemplate | null
  readonly stageTransition: { readonly newStage: ConversationStage; readonly reason: string } | null
}): GeneratedReply {
  return {
    subject: null,
    body: '',
    tone: 'professional',
    confidence: 0,
    knowledgeEntriesUsed: context.knowledgeEntries.slice(0, 5).map((e) => e.id),
    templateUsed: context.matchedTemplate?.id ?? null,
    suggestedStageTransition: context.stageTransition?.newStage ?? null,
    shouldEscalate: true,
    escalationReason: 'Failed to parse Claude response — needs human review',
  }
}

// ---------------------------------------------------------------------------
// Quality Checks
// ---------------------------------------------------------------------------

function checkReplyQuality(body: string): string[] {
  const issues: string[] = []
  const lower = body.toLowerCase()

  // Check for corporate kill signals
  for (const signal of CORPORATE_KILL_SIGNALS) {
    if (lower.includes(signal.toLowerCase())) {
      issues.push(`Corporate signal detected: "${signal}"`)
    }
  }

  // Check for LLM-isms
  for (const flag of LLM_ISM_RED_FLAGS) {
    if (lower.includes(flag.toLowerCase())) {
      issues.push(`LLM-ism detected: "${flag}"`)
    }
  }

  // Length check — replies should be concise
  const wordCount = body.split(/\s+/).length
  if (wordCount > 150) {
    issues.push(`Reply too long: ${wordCount} words (target: under 100)`)
  }

  // Check for HTML
  if (body.includes('<') && body.includes('>')) {
    issues.push('HTML detected in reply body')
  }

  return issues
}

// ---------------------------------------------------------------------------
// Action Decision
// ---------------------------------------------------------------------------

function decideAction(params: {
  readonly reply: GeneratedReply
  readonly config: SdrConfigurationEnhanced
  readonly sentiment: string
  readonly turnCount: number
}): ReplyDecision['action'] {
  const { reply, config, sentiment, turnCount } = params

  // Human-in-the-loop mode → always queue
  if (config.human_in_the_loop) {
    return 'queue_approval'
  }

  // Escalation flagged by reply engine
  if (reply.shouldEscalate) {
    return 'escalate'
  }

  // Negative or unsubscribe → skip
  if (sentiment === 'negative' || sentiment === 'unsubscribe' || sentiment === 'not_interested') {
    return 'skip'
  }

  // Turn limit exceeded
  if (turnCount >= config.max_ai_turns) {
    return 'escalate'
  }

  // High confidence + positive/question sentiment → auto-send
  if (reply.confidence >= 0.8 && (sentiment === 'positive' || sentiment === 'question')) {
    return 'auto_send'
  }

  // Default: queue for approval
  return 'queue_approval'
}

function buildActionReason(
  action: ReplyDecision['action'],
  sentiment: string,
  confidence: number,
  config: SdrConfigurationEnhanced
): string {
  switch (action) {
    case 'auto_send':
      return `High confidence (${confidence.toFixed(2)}) + ${sentiment} sentiment → auto-sending`
    case 'queue_approval':
      return config.human_in_the_loop
        ? 'Human-in-the-loop enabled — queued for approval'
        : `Confidence ${confidence.toFixed(2)} below auto-send threshold — queued for approval`
    case 'escalate':
      return 'Conversation requires human handoff'
    case 'skip':
      return `Skipping: ${sentiment} sentiment — no reply warranted`
  }
}
