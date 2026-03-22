// Claude Email Copy Generation Service
// Generates outbound email sequences from ICP brief and client preferences

import type {
  OnboardingClient,
  EnrichedICPBrief,
  DraftSequences,
} from '@/types/onboarding'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

const SYSTEM_PROMPT = `You are an expert cold email copywriter at Cursive, a demand generation agency. You write high-converting outbound email sequences for B2B companies.

RULES (strictly enforced):
1. Every email body MUST be under 120 words. No exceptions.
2. Use {{firstName}} as the personalization variable for the recipient's first name.
3. NEVER use RE: or FWD: tricks in subject lines.
4. NEVER use cliche phrases like "I hope this email finds you well", "Just reaching out", "Touching base", "I'd love to pick your brain", "Synergy", or "Low-hanging fruit".
5. Match the client's requested copy tone exactly.
6. The CTA in each email must align with the client's primary CTA preference.
7. Subject lines must be under 50 characters and curiosity-driven.
8. Each email in a sequence must have a distinct purpose and angle — no repetition.
9. Write 2-3 sequences with 3-4 emails each (step 1 = day 0, then delays of 2-4 days between steps).

Return ONLY valid JSON matching this schema. No markdown, no explanation.

{
  "sequences": [
    {
      "sequence_name": "string — descriptive name for this sequence",
      "strategy": "string — 1 sentence describing the overall approach",
      "emails": [
        {
          "step": 1,
          "delay_days": 0,
          "subject_line": "string — under 50 chars",
          "body": "string — under 120 words, uses {{firstName}}",
          "purpose": "string — what this email is trying to accomplish"
        }
      ]
    }
  ]
}`

function buildCopyPrompt(client: OnboardingClient, icpBrief: EnrichedICPBrief): string {
  const messagingAngles = icpBrief.messaging_angles
    .map((a) => `- ${a.angle_name}: ${a.hook}`)
    .join('\n')

  const personas = icpBrief.buyer_personas
    .map((p) => `- ${p.title} (${p.seniority}, ${p.department}): Pain points — ${p.pain_points.join('; ')}`)
    .join('\n')

  return [
    `## Client`,
    `Company: ${client.company_name}`,
    `Website: ${client.company_website}`,
    `Industry: ${client.industry}`,
    '',
    `## Copy Preferences`,
    `Tone: ${client.copy_tone || 'Professional but conversational'}`,
    `Primary CTA: ${client.primary_cta || 'Book a call'}`,
    client.custom_cta ? `Custom CTA: ${client.custom_cta}` : '',
    client.calendar_link ? `Calendar link: ${client.calendar_link}` : '',
    '',
    `## ICP Summary`,
    icpBrief.ideal_buyer_profile,
    '',
    `## Target Personas`,
    personas,
    '',
    `## Messaging Angles to Use`,
    messagingAngles,
    '',
    `## Competitive Landscape`,
    icpBrief.competitive_landscape.join(', '),
    '',
    `## Value Props`,
    icpBrief.messaging_angles.map((a) => `- ${a.value_prop}`).join('\n'),
    '',
    `## Sender Names`,
    client.sender_names || '(use generic sender)',
    '',
    `## Compliance Notes`,
    client.compliance_disclaimers || 'Standard CAN-SPAM compliance',
    '',
    `Generate 2-3 email sequences with 3-4 emails each. Each sequence should use a different messaging angle.`,
  ]
    .filter(Boolean)
    .join('\n')
}

function buildRegenerationPrompt(
  client: OnboardingClient,
  icpBrief: EnrichedICPBrief,
  previousSequences: DraftSequences,
  feedback: string
): string {
  const basePrompt = buildCopyPrompt(client, icpBrief)

  return [
    basePrompt,
    '',
    `## REVISION REQUEST`,
    `The previous sequences need revisions. Here is the feedback:`,
    feedback,
    '',
    `## Previous Sequences (for reference)`,
    JSON.stringify(previousSequences, null, 2),
    '',
    `Please regenerate the sequences incorporating all feedback. Keep what works, fix what doesn't.`,
  ].join('\n')
}

function stripMarkdownFences(text: string): string {
  let cleaned = text.trim()
  // Remove leading ```json or ``` (with optional language tag)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '')
  // Remove trailing ```
  cleaned = cleaned.replace(/\s*```\s*$/, '')
  return cleaned.trim()
}

/**
 * Attempt to extract JSON from a string that may contain surrounding text.
 * Tries direct parse first, then regex extraction.
 */
function safeParseJSON<T>(raw: string, label: string): T {
  const cleaned = stripMarkdownFences(raw)

  // Try direct parse first
  try {
    return JSON.parse(cleaned) as T
  } catch {
    // Fall through to regex extraction
  }

  // Try to extract the outermost JSON object
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0]) as T
    } catch {
      // Fall through to error
    }
  }

  console.error(`[${label}] Failed to parse JSON. Raw response:\n`, raw.slice(0, 2000))
  throw new Error(`${label}: Response is not valid JSON`)
}

async function callClaude(userMessage: string): Promise<DraftSequences> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'unknown error')
    console.error(`[Copy Generation] Claude API HTTP ${response.status}:`, errorBody.slice(0, 1000))
    throw new Error(`Claude API returned ${response.status}: ${errorBody.slice(0, 200)}`)
  }

  const result = await response.json()

  // Validate response structure
  if (!result.content || !Array.isArray(result.content) || result.content.length === 0) {
    console.error('[Copy Generation] Unexpected response structure:', JSON.stringify(result).slice(0, 1000))
    throw new Error('Claude API returned unexpected response structure — no content array')
  }

  const textBlock = result.content.find((block: any) => block.type === 'text')
  const content = textBlock?.text
  if (!content) {
    console.error('[Copy Generation] No text block in response:', JSON.stringify(result.content).slice(0, 1000))
    throw new Error('Claude API returned empty content — no text block found')
  }

  const sequences = safeParseJSON<DraftSequences>(content, 'Copy Generation')

  if (!sequences.sequences || !Array.isArray(sequences.sequences) || sequences.sequences.length === 0) {
    console.error('[Copy Generation] No sequences in parsed result:', JSON.stringify(sequences).slice(0, 500))
    throw new Error('Claude returned no email sequences')
  }

  // Validate each sequence has required structure
  for (const seq of sequences.sequences) {
    if (!seq.sequence_name || !Array.isArray(seq.emails) || seq.emails.length === 0) {
      throw new Error(`Invalid sequence structure: ${seq.sequence_name || 'unnamed'}`)
    }
    // Validate each email has required fields
    for (const email of seq.emails) {
      if (typeof email.step !== 'number' || !email.subject_line || !email.body) {
        throw new Error(`Invalid email in sequence "${seq.sequence_name}": missing step, subject_line, or body`)
      }
    }
  }

  return sequences
}

/**
 * Generate initial email sequences from client data and ICP brief.
 * Throws on API failure or invalid response.
 */
export async function generateEmailSequences(
  client: OnboardingClient,
  icpBrief: EnrichedICPBrief
): Promise<DraftSequences> {
  const prompt = buildCopyPrompt(client, icpBrief)
  return callClaude(prompt)
}

/**
 * Regenerate email sequences incorporating feedback on previous versions.
 * Throws on API failure or invalid response.
 */
export async function regenerateEmailSequences(
  client: OnboardingClient,
  icpBrief: EnrichedICPBrief,
  previousSequences: DraftSequences,
  feedback: string
): Promise<DraftSequences> {
  const prompt = buildRegenerationPrompt(client, icpBrief, previousSequences, feedback)
  return callClaude(prompt)
}
