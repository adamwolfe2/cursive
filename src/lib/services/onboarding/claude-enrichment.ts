// Claude ICP Enrichment Service
// Uses Claude to generate an enriched ICP brief from client onboarding data

import Anthropic from '@anthropic-ai/sdk'
import type { OnboardingClient, EnrichedICPBrief } from '@/types/onboarding'
import { checkSpendLimit, recordSpend } from '@/lib/services/api-spend-guard'

const MODEL = 'claude-sonnet-4-20250514'

// Sonnet pricing: $3/M input, $15/M output
const INPUT_COST_PER_TOKEN = 3.0 / 1_000_000
const OUTPUT_COST_PER_TOKEN = 15.0 / 1_000_000

// ---------------------------------------------------------------------------
// Lazy-initialized Anthropic client
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

const SYSTEM_PROMPT = `You are an expert B2B sales strategist and audience intelligence analyst at Cursive, a demand generation agency. Your job is to take a client's raw ICP (Ideal Customer Profile) intake form and produce a comprehensive, enriched ICP brief that the fulfillment team can use to build precise audience segments AND that the cold email copy engine can use to write high-converting outbound sequences.

You must return ONLY valid JSON matching the schema below. No markdown, no explanation, no preamble — just the JSON object.

Schema:
{
  "company_summary": "string — 2-3 sentence summary of the client's business, value prop, and market position",
  "ideal_buyer_profile": "string — detailed paragraph describing the ideal buyer: who they are, what they care about, and why they'd buy from this client",
  "primary_verticals": ["string — top 3-5 industry verticals to target"],
  "buyer_personas": [
    {
      "title": "string — job title",
      "seniority": "string — C-level, VP, Director, Manager, etc.",
      "department": "string — Sales, Marketing, Ops, IT, etc.",
      "pain_points": ["string — specific pains this persona has"],
      "buying_triggers": ["string — events or signals that indicate buying intent"]
    }
  ],
  "company_filters": {
    "size_range": "string — employee count range",
    "revenue_range": "string — annual revenue range",
    "geography": ["string — regions/countries"],
    "tech_signals": ["string — technologies or tools that indicate fit"],
    "exclusions": ["string — types of companies to exclude"]
  },
  "competitive_landscape": ["string — known competitors and positioning notes"],
  "messaging_angles": [
    {
      "angle_name": "string — short label for this messaging angle",
      "hook": "string — opening hook sentence",
      "value_prop": "string — core value proposition for this angle",
      "proof_point": "string — evidence or social proof to support this angle"
    }
  ],
  "audience_labs_search_strategy": {
    "recommended_taxonomy_paths": ["string — suggested taxonomy paths for Audience Labs searches"],
    "keyword_combinations": ["string — keyword combos for intent-based targeting"],
    "filters_to_apply": ["string — specific filters to layer on"],
    "estimated_audience_size": "string — rough estimate of total addressable audience",
    "notes_for_builder": "string — any special instructions for the audience builder"
  },
  "copy_research": {
    "prospect_world": {
      "daily_reality": "string — What does the prospect's day-to-day look like? What are they dealing with right now?",
      "current_tools": ["string — Tools and vendors they're likely using for this problem"],
      "current_approach": "string — How are they solving (or failing to solve) this problem today?",
      "trigger_events": ["string — Events that would make them suddenly care: new funding, hiring SDRs, competitor launch, board pressure on growth, etc."],
      "status_quo_cost": "string — What is the cost of doing nothing? Quantify if possible.",
      "objections": ["string — What would make them NOT reply? Price? Skepticism? Bad past experience? Too busy?"],
      "aspirations": "string — What does winning look like for them in this area?"
    },
    "messaging_ammunition": {
      "specific_proof_points": ["string — Concrete results, stats, or case studies that would resonate with this persona"],
      "social_proof_angles": ["string — Types of companies/people similar to the prospect that use the product"],
      "contrarian_hooks": ["string — Conventional wisdom in their space that's wrong — something that would make them stop scrolling"],
      "curiosity_gaps": ["string — Questions or partial reveals that would create enough curiosity to reply"],
      "pattern_interrupts": ["string — Unexpected openings that break the another cold email pattern"],
      "fear_of_missing_out": ["string — What competitors or peers are doing that the prospect might not be doing yet"],
      "ego_hooks": ["string — Ways to compliment or acknowledge the prospect's work without being sycophantic"]
    },
    "email_specific": {
      "recommended_subject_line_styles": ["string — e.g. question, stat, name_drop, curiosity, direct"],
      "recommended_opening_styles": ["string — e.g. observation about their company, industry trend, provocative question"],
      "cta_variations": ["string — Different ways to phrase the ask based on prospect sophistication level"],
      "personalization_variables_available": ["{{firstName}}", "{{companyName}}", "{{title}}"],
      "words_to_avoid": ["string — Spam trigger words specific to this industry or email providers"],
      "tone_calibration": "string — Specific guidance on how formal/casual to be for THIS audience (what the PROSPECT would respond to, not just the client's preference)"
    }
  }
}`

function buildUserMessage(client: OnboardingClient): string {
  const sections: string[] = [
    `## Company Information`,
    `- Company: ${client.company_name}`,
    `- Website: ${client.company_website}`,
    `- Industry: ${client.industry}`,
    '',
    `## ICP Description`,
    client.icp_description || '(not provided)',
    '',
    `## Target Industries`,
    (client.target_industries || []).join(', ') || '(not provided)',
    '',
    `## Sub-Industries`,
    (client.sub_industries || []).join(', ') || '(not provided)',
    '',
    `## Target Company Sizes`,
    (client.target_company_sizes || []).join(', ') || '(not provided)',
    '',
    `## Target Titles`,
    (client.target_titles || []).join(', ') || '(not provided)',
    '',
    `## Target Geography`,
    (client.target_geography || []).join(', ') || '(not provided)',
    client.specific_regions ? `Specific regions: ${client.specific_regions}` : '',
    '',
    `## Must-Have Traits`,
    client.must_have_traits || '(not provided)',
    '',
    `## Exclusion Criteria`,
    client.exclusion_criteria || '(not provided)',
    '',
    `## Pain Points`,
    client.pain_points || '(not provided)',
    '',
    `## Intent Keywords`,
    (client.intent_keywords || []).join(', ') || '(not provided)',
    '',
    `## Competitors`,
    (client.competitor_names || []).join(', ') || '(not provided)',
    '',
    `## Best Existing Customers`,
    client.best_customers || '(not provided)',
    '',
    `## Sample Target Accounts`,
    client.sample_accounts || '(not provided)',
    '',
    `## Packages Selected`,
    (client.packages_selected || []).join(', '),
    '',
    `## Copy Tone Preference`,
    client.copy_tone || '(not provided)',
    '',
    `## Primary CTA`,
    client.primary_cta || '(not provided)',
  ]

  return sections.filter(Boolean).join('\n')
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

  throw new Error(`${label}: Response is not valid JSON`)
}

/**
 * Enrich a client's ICP intake into a comprehensive brief using Claude.
 * Throws on API failure or invalid response.
 */
export async function enrichClientICP(client: OnboardingClient): Promise<EnrichedICPBrief> {
  const anthropic = getAnthropicClient()

  await checkSpendLimit()

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildUserMessage(client),
      },
    ],
  })

  // Track spend from enrichment call
  const usage = response.usage
  if (usage) {
    const cost = usage.input_tokens * INPUT_COST_PER_TOKEN + usage.output_tokens * OUTPUT_COST_PER_TOKEN
    recordSpend(cost)
  }

  // Validate response structure
  if (!response.content || response.content.length === 0) {
    throw new Error('Claude API returned unexpected response structure — no content array')
  }

  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude API returned empty content — no text block found')
  }

  const brief = safeParseJSON<EnrichedICPBrief>(textBlock.text, 'ICP Enrichment')

  // Validate required top-level fields
  const missingFields: string[] = []
  if (!brief.company_summary) missingFields.push('company_summary')
  if (!brief.ideal_buyer_profile) missingFields.push('ideal_buyer_profile')
  if (!Array.isArray(brief.buyer_personas)) missingFields.push('buyer_personas')
  if (!brief.company_filters) missingFields.push('company_filters')
  if (!Array.isArray(brief.messaging_angles)) missingFields.push('messaging_angles')
  if (!brief.audience_labs_search_strategy) missingFields.push('audience_labs_search_strategy')

  if (missingFields.length > 0) {
    throw new Error(`Claude returned an incomplete ICP brief — missing: ${missingFields.join(', ')}`)
  }

  return brief
}
