// Variant Generator Service
// Core of the autoresearch system: generates email copy variants for A/B testing
// using the 4-step copywriting framework from the masterclass knowledge base.
// AI generates variant COMPONENTS (not full emails) — per the masterclass,
// AI handles small templated variables and suggests variant phrasing for specific lines.

import Anthropic from '@anthropic-ai/sdk'
import type {
  AutoresearchProgram,
  WinningPattern,
  ElementType,
  GeneratedVariant,
  ExperimentPlan,
} from '@/types/autoresearch'
import { checkSpendLimit, recordSpend } from '@/lib/services/api-spend-guard'
import {
  FOUR_STEP_FRAMEWORK,
  PSYCHOLOGICAL_PRINCIPLES,
  OFFER_ARCHETYPES,
  SUBJECT_LINE_PATTERNS,
  SUBJECT_LINE_RULES,
  AI_BOUNDARIES,
  COPY_QUALITY_CHECKS,
  LLM_ISM_RED_FLAGS,
  CORPORATE_KILL_SIGNALS,
  scoreCopy,
} from './cold-email-knowledge'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 4096

// ---------------------------------------------------------------------------
// Lazy-initialized Anthropic Client
// ---------------------------------------------------------------------------

let anthropicClient: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured')
    }
    anthropicClient = new Anthropic({ apiKey })
  }
  return anthropicClient
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripMarkdownFences(text: string): string {
  let cleaned = text.trim()
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '')
  cleaned = cleaned.replace(/\s*```\s*$/, '')
  return cleaned.trim()
}

function safeParseJSON<T>(raw: string, label: string): T {
  const cleaned = stripMarkdownFences(raw)

  try {
    return JSON.parse(cleaned) as T
  } catch {
    // Fall through to regex extraction
  }

  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0]) as T
    } catch {
      // Fall through
    }
  }

  throw new Error(`${label}: Response is not valid JSON`)
}

function getElementRules(element: ElementType): string {
  const ruleMap: Record<string, string> = {
    subject: [
      'SUBJECT LINE RULES:',
      ...SUBJECT_LINE_RULES.map((r) => `- ${r}`),
      '',
      'PROVEN PATTERNS:',
      ...SUBJECT_LINE_PATTERNS.map((p) => `- ${p.pattern} (${p.type})`),
    ].join('\n'),

    opening_line: [
      'PERSONALIZATION / OPENING LINE RULES:',
      `Purpose: ${FOUR_STEP_FRAMEWORK.step1_personalization.purpose}`,
      ...FOUR_STEP_FRAMEWORK.step1_personalization.rules.map((r) => `- ${r}`),
      `Cold reading technique: ${FOUR_STEP_FRAMEWORK.step1_personalization.coldReadingTechnique}`,
      '',
      'ANTI-PATTERNS (avoid these):',
      ...FOUR_STEP_FRAMEWORK.step1_personalization.antiPatterns.map((a) => `- ${a}`),
    ].join('\n'),

    body: [
      'WHO AM I + OFFER RULES:',
      `Who Am I purpose: ${FOUR_STEP_FRAMEWORK.step2_who_am_i.purpose}`,
      ...FOUR_STEP_FRAMEWORK.step2_who_am_i.rules.map((r) => `- ${r}`),
      `Template: ${FOUR_STEP_FRAMEWORK.step2_who_am_i.template}`,
      '',
      `Offer purpose: ${FOUR_STEP_FRAMEWORK.step3_offer.purpose}`,
      `Offer formula: ${FOUR_STEP_FRAMEWORK.step3_offer.formula}`,
      ...FOUR_STEP_FRAMEWORK.step3_offer.rules.map((r) => `- ${r}`),
      '',
      'OFFER ARCHETYPES:',
      ...OFFER_ARCHETYPES.map((a) => `- ${a.name}: ${a.template}`),
    ].join('\n'),

    cta: [
      'CTA RULES:',
      `Purpose: ${FOUR_STEP_FRAMEWORK.step4_cta.purpose}`,
      ...FOUR_STEP_FRAMEWORK.step4_cta.rules.map((r) => `- ${r}`),
      '',
      'ANTI-PATTERNS:',
      ...FOUR_STEP_FRAMEWORK.step4_cta.antiPatterns.map((a) => `- ${a}`),
      '',
      'PROVEN CTA TEMPLATES:',
      ...FOUR_STEP_FRAMEWORK.step4_cta.templates.map((t) => `- ${t}`),
    ].join('\n'),

    angle: [
      'ANGLE / FULL APPROACH RULES:',
      'When testing a new angle, vary the overall approach while keeping structure intact.',
      `Offer formula: ${FOUR_STEP_FRAMEWORK.step3_offer.formula}`,
      ...FOUR_STEP_FRAMEWORK.step3_offer.rules.map((r) => `- ${r}`),
      '',
      'OFFER ARCHETYPES:',
      ...OFFER_ARCHETYPES.map((a) => `- ${a.name}: ${a.template} (best for: ${a.bestFor.join(', ')})`),
    ].join('\n'),

    full_template: [
      'FULL TEMPLATE RULES:',
      'Testing a fundamentally different template. All 4 steps must be present:',
      `1. ${FOUR_STEP_FRAMEWORK.step1_personalization.name}: ${FOUR_STEP_FRAMEWORK.step1_personalization.purpose}`,
      `2. ${FOUR_STEP_FRAMEWORK.step2_who_am_i.name}: ${FOUR_STEP_FRAMEWORK.step2_who_am_i.purpose}`,
      `3. ${FOUR_STEP_FRAMEWORK.step3_offer.name}: ${FOUR_STEP_FRAMEWORK.step3_offer.purpose}`,
      `4. ${FOUR_STEP_FRAMEWORK.step4_cta.name}: ${FOUR_STEP_FRAMEWORK.step4_cta.purpose}`,
    ].join('\n'),

    send_time: [
      'SEND TIME TESTING:',
      'The copy remains identical. Only the send time varies.',
      'Return the baseline copy unchanged. The orchestrator handles timing.',
    ].join('\n'),
  }

  return ruleMap[element] || ruleMap['body']
}

function formatWinningPatterns(patterns: readonly WinningPattern[]): string {
  if (patterns.length === 0) {
    return 'No winning patterns recorded yet. This is an early experiment.'
  }

  return patterns
    .map((p) => [
      `- Element: ${p.element_type}`,
      `  Pattern: ${p.pattern_description}`,
      `  Winning copy: ${p.winning_copy}`,
      p.lift_percent ? `  Lift: +${p.lift_percent}%` : '',
      p.positive_reply_rate ? `  Reply rate: ${(p.positive_reply_rate * 100).toFixed(1)}%` : '',
    ].filter(Boolean).join('\n'))
    .join('\n')
}

function formatPrinciples(): string {
  return PSYCHOLOGICAL_PRINCIPLES
    .map((p) => `- ${p.id}: ${p.name} — ${p.description}`)
    .join('\n')
}

// ---------------------------------------------------------------------------
// Select Next Element
// ---------------------------------------------------------------------------

export function selectNextElement(params: {
  readonly elementRotation: readonly ElementType[]
  readonly lastElementTested: string | null
  readonly experimentCount: number
}): ElementType {
  const { elementRotation, lastElementTested, experimentCount } = params

  if (elementRotation.length === 0) {
    return 'subject'
  }

  // Early experiments (< 5): prioritize high-leverage elements
  if (experimentCount < 5) {
    const highLeverage: ElementType[] = ['subject', 'opening_line']
    const available = highLeverage.filter((el) => elementRotation.includes(el))
    if (available.length > 0) {
      const untested = available.filter((el) => el !== lastElementTested)
      return untested.length > 0 ? untested[0] : available[0]
    }
  }

  // Standard rotation: pick the next element after the last tested one
  if (!lastElementTested) {
    return elementRotation[0]
  }

  const lastIndex = elementRotation.indexOf(lastElementTested as ElementType)
  if (lastIndex === -1) {
    return elementRotation[0]
  }

  const nextIndex = (lastIndex + 1) % elementRotation.length
  return elementRotation[nextIndex]
}

// ---------------------------------------------------------------------------
// Validate Variant
// ---------------------------------------------------------------------------

export function validateVariant(
  variant: GeneratedVariant,
  program: AutoresearchProgram
): { readonly valid: boolean; readonly issues: readonly string[] } {
  const issues: string[] = []
  const constraints = program.config.qualityConstraints
  const bodyLower = variant.body.toLowerCase()
  const subjectLower = variant.subject.toLowerCase()
  const fullText = `${subjectLower} ${bodyLower}`

  // Word count constraints
  const wordCount = variant.body.split(/\s+/).filter(Boolean).length
  if (wordCount > constraints.maxWordCount) {
    issues.push(`Body exceeds max word count: ${wordCount} > ${constraints.maxWordCount}`)
  }
  if (wordCount < constraints.minWordCount) {
    issues.push(`Body below min word count: ${wordCount} < ${constraints.minWordCount}`)
  }

  // Subject length
  if (variant.subject.length > constraints.maxSubjectLength) {
    issues.push(`Subject exceeds max length: ${variant.subject.length} > ${constraints.maxSubjectLength}`)
  }

  // Corporate kill signals
  const corporateHits = CORPORATE_KILL_SIGNALS.filter(
    (signal) => fullText.includes(signal.toLowerCase())
  )
  if (corporateHits.length > 0) {
    issues.push(`Corporate kill signals detected: ${corporateHits.join(', ')}`)
  }

  // LLM-isms
  const llmHits = LLM_ISM_RED_FLAGS.filter(
    (flag) => fullText.includes(flag.toLowerCase())
  )
  if (llmHits.length > 0) {
    issues.push(`LLM-isms detected: ${llmHits.join(', ')}`)
  }

  // No links in body
  if (variant.body.includes('http') || variant.body.includes('www.') || variant.body.includes('.com/')) {
    issues.push('Body contains links (not allowed in cold emails)')
  }

  // Scoring rubric — minimum 4/7 principles
  const score = scoreCopy({
    subject: variant.subject,
    body: variant.body,
    hasSocialProof: fullText.includes('client') || fullText.includes('companies') || /\d+/.test(fullText),
    hasSpecificNumbers: /\d+/.test(fullText),
    hasOffer: fullText.includes('free') || fullText.includes('no cost') || fullText.includes('guarantee'),
    hasCta: fullText.includes('?') || fullText.includes('reply') || fullText.includes('call'),
    hasPersonalization: fullText.includes('{{') || fullText.includes('your'),
  })

  if (!score.passesMinimum) {
    issues.push(`Scoring rubric: only ${score.score}/7 principles present (minimum 4). Missing depth in psychological triggers.`)
  }

  return { valid: issues.length === 0, issues }
}

// ---------------------------------------------------------------------------
// Build Generation Prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(): string {
  return [
    'You are an expert cold email copywriter optimizing variants for A/B testing.',
    'You follow the 4-step copywriting framework: Personalization -> Who Am I -> Offer -> CTA.',
    '',
    'AI BOUNDARIES — what you should and should NOT do:',
    `Use AI for: ${AI_BOUNDARIES.useAiFor.join('; ')}`,
    `Never use AI for: ${AI_BOUNDARIES.neverUseAiFor.join('; ')}`,
    '',
    'THE 7 PSYCHOLOGICAL PRINCIPLES (variants must leverage at least 4):',
    formatPrinciples(),
    '',
    'QUALITY CHECKS every variant must pass:',
    ...COPY_QUALITY_CHECKS.map((c) => `- ${c}`),
  ].join('\n')
}

function buildUserPrompt(params: {
  readonly program: AutoresearchProgram
  readonly elementToTest: ElementType
  readonly winningPatterns: readonly WinningPattern[]
  readonly variantCount: number
}): string {
  const { program, elementToTest, winningPatterns, variantCount } = params
  const constraints = program.config.qualityConstraints

  return [
    'CURRENT BASELINE:',
    `Subject: ${program.baseline_subject || '(none set)'}`,
    `Body: ${program.baseline_body || '(none set)'}`,
    '',
    `ELEMENT TO TEST: ${elementToTest}`,
    `Keep ALL other elements identical to the baseline. Only vary the ${elementToTest}.`,
    '',
    'TARGET AUDIENCE:',
    `Niche: ${program.config.targetNiche}`,
    `Persona: ${program.config.targetPersona}`,
    '',
    'WINNING PATTERNS (what has worked before for this audience):',
    formatWinningPatterns(winningPatterns),
    '',
    `RULES FOR ${elementToTest.toUpperCase()}:`,
    getElementRules(elementToTest),
    '',
    'QUALITY REQUIREMENTS:',
    `- Under ${constraints.maxWordCount} words`,
    `- Above ${constraints.minWordCount} words`,
    `- Subject under ${constraints.maxSubjectLength} characters`,
    `- No corporate signals: ${CORPORATE_KILL_SIGNALS.slice(0, 5).join(', ')}...`,
    `- No LLM-isms: ${LLM_ISM_RED_FLAGS.slice(0, 5).join(', ')}...`,
    '- Must leverage at least 4 of 7 psychological principles',
    '- Must pass the "text message test"',
    '- No links in body',
    '',
    `Generate ${variantCount} challenger variants. For each:`,
    '1. State a hypothesis for why this variant might outperform',
    '2. Provide the full subject line and body',
    '3. Note which psychological principles are leveraged',
    '',
    'Output valid JSON:',
    '{',
    '  "variants": [',
    '    {',
    '      "name": "Variant B: [short label]",',
    '      "hypothesis": "...",',
    '      "subject": "...",',
    '      "body": "...",',
    '      "principles_used": ["give_first", "social_proof", ...]',
    '    }',
    '  ]',
    '}',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Generate Experiment Plan (main entry point)
// ---------------------------------------------------------------------------

interface ClaudeVariantOutput {
  readonly variants: ReadonlyArray<{
    readonly name: string
    readonly hypothesis: string
    readonly subject: string
    readonly body: string
    readonly principles_used: readonly string[]
  }>
}

export async function generateExperimentPlan(params: {
  readonly program: AutoresearchProgram
  readonly elementToTest: ElementType
  readonly winningPatterns: WinningPattern[]
  readonly variantCount: number
}): Promise<ExperimentPlan> {
  const { program, elementToTest, winningPatterns, variantCount } = params

  if (!program.baseline_subject || !program.baseline_body) {
    throw new Error('Program must have a baseline subject and body before generating variants')
  }

  const clampedCount = Math.min(Math.max(variantCount, 1), 3)
  const client = getAnthropicClient()

  await checkSpendLimit()

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: buildSystemPrompt(),
    messages: [
      {
        role: 'user',
        content: buildUserPrompt({
          program,
          elementToTest,
          winningPatterns,
          variantCount: clampedCount,
        }),
      },
    ],
  })

  // Track spend from this call
  if (response.usage) {
    const cost = (response.usage.input_tokens * 3.00 + response.usage.output_tokens * 15.00) / 1_000_000
    recordSpend(cost)
  }

  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Variant generation: Claude returned no text content')
  }

  const parsed = safeParseJSON<ClaudeVariantOutput>(textBlock.text, 'Variant generation')

  if (!parsed.variants || !Array.isArray(parsed.variants) || parsed.variants.length === 0) {
    throw new Error('Variant generation: Claude returned no variants')
  }

  // Validate each variant and filter to valid ones
  const validatedVariants: GeneratedVariant[] = []

  for (const raw of parsed.variants) {
    const variant: GeneratedVariant = {
      name: raw.name,
      subject: raw.subject,
      body: raw.body,
      hypothesis: raw.hypothesis,
    }

    const validation = validateVariant(variant, program)
    if (validation.valid) {
      validatedVariants.push(variant)
    }
    // Skip invalid variants silently — the orchestrator can retry if needed
  }

  if (validatedVariants.length === 0) {
    throw new Error(
      'Variant generation: All generated variants failed quality validation. ' +
      'The AI-generated copy did not meet minimum quality standards.'
    )
  }

  // Build the combined hypothesis from individual variant hypotheses
  const combinedHypothesis = validatedVariants
    .map((v) => `${v.name}: ${v.hypothesis}`)
    .join(' | ')

  return {
    elementToTest,
    hypothesis: combinedHypothesis,
    variants: validatedVariants,
    controlSubject: program.baseline_subject,
    controlBody: program.baseline_body,
  }
}
