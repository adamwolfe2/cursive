// AI Intake Parser Service
// Uses Claude to parse unstructured context (call notes, transcripts, briefs)
// into a structured client onboarding record

import type { ParsedIntakeData, ContextFormat, TemplateData } from '@/types/onboarding-templates'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

const SYSTEM_PROMPT = `You are an expert at extracting structured client onboarding data from unstructured business context. You will receive raw text that could be: sales call notes, meeting transcripts, email threads, voice memo summaries, client briefs, CRM notes, or any combination of these.

Your job is to extract every possible data point and map it to the Cursive AI client onboarding schema. Be aggressive about inference — if the notes say "they're a SaaS company doing about $5M ARR with 80 employees", you should infer: industry = "B2B SaaS", target_company_sizes includes "51-200", and set the company context accordingly.

For fields you cannot determine from the context, return null. Do not guess or hallucinate data that isn't supported by the input. But DO make reasonable inferences — if someone mentions "agency owners" as their target, you can infer target_titles likely includes "Agency Owner", "Founder", "CEO" for small agencies.

If pricing or package details are mentioned, extract them. If ICP details are discussed, extract everything: industries, titles, geography, pain points, competitors, exclusions.

If the text contains information about multiple topics (e.g., the call covered both their ICP AND discussed Cursive's pricing tiers), separate the client-specific data from the meta-discussion about Cursive's offerings.

Valid package slugs: super_pixel, audience, outbound, bundle, affiliate, enrichment, paid_ads, data_delivery

Valid target_company_sizes values: 1-10, 11-50, 51-200, 201-500, 500-1000, 1000+

Valid target_geography values: US Only, US + Canada, North America, Global, Specific States/Regions

Valid copy_tone values: Professional/Formal, Conversational, Direct/Bold, Friendly/Casual

Valid primary_cta values: Book a call, Reply to learn more, Visit landing page, Custom

Valid outbound_tier values: Base, Growth, Scale, Custom

Output valid JSON only matching this exact schema:
{
  "company_name": "string | null",
  "company_website": "string | null",
  "industry": "string | null",
  "primary_contact_name": "string | null",
  "primary_contact_email": "string | null",
  "primary_contact_phone": "string | null",
  "billing_contact_name": "string | null",
  "billing_contact_email": "string | null",
  "team_members": "string | null",
  "communication_channel": "string | null",
  "packages_selected": [],
  "packages_reasoning": "string explaining why these packages were selected based on context",
  "setup_fee": "number | null",
  "recurring_fee": "number | null",
  "billing_cadence": "string | null",
  "outbound_tier": "string | null",
  "payment_method": "string | null",
  "icp_description": "string | null — synthesize a 2-3 sentence ICP description from the context",
  "target_industries": [],
  "sub_industries": [],
  "target_company_sizes": [],
  "target_titles": [],
  "target_geography": [],
  "specific_regions": "string | null",
  "must_have_traits": "string | null",
  "exclusion_criteria": "string | null",
  "pain_points": "string | null",
  "intent_keywords": [],
  "competitor_names": [],
  "best_customers": "string | null",
  "sample_accounts": "string | null",
  "sending_volume": "string | null",
  "lead_volume": "string | null",
  "start_timeline": "string | null",
  "sender_names": "string | null",
  "domain_variations": "string | null",
  "domain_provider": "string | null",
  "copy_tone": "string | null",
  "primary_cta": "string | null",
  "calendar_link": "string | null",
  "reply_routing_email": "string | null",
  "pixel_urls": "string | null",
  "uses_gtm": "string | null",
  "pixel_installer": "string | null",
  "monthly_traffic": "string | null",
  "audience_refresh": "string | null",
  "data_use_cases": [],
  "primary_crm": "string | null",
  "data_format": "string | null",
  "audience_count": "string | null",
  "confidence_score": "number 0-100",
  "fields_inferred": ["list of field names where you made inferences beyond explicit statements"],
  "missing_critical_fields": ["fields critical for fulfillment but not determinable from context"],
  "additional_context": "string | null — anything relevant that does not fit a specific field"
}`

function buildUserMessage(
  rawContext: string,
  contextFormat: ContextFormat,
  templateData?: TemplateData
): string {
  const formatHints: Record<ContextFormat, string> = {
    call_notes:
      'The following input is formatted as call notes from a sales/discovery call. Expect discussion of the client\'s needs, ICP, and package fit.',
    email_thread:
      'The following input is formatted as an email thread or correspondence. Extract client details from the conversation.',
    transcript:
      'The following input is a raw transcript with speaker labels. Focus on extracting client-specific details from the discussion.',
    client_brief:
      'The following input is a structured client brief or document. It may already be partially organized — extract all relevant fields.',
    mixed: '',
  }

  const formatHint = formatHints[contextFormat]
  const parts: string[] = []

  if (formatHint) {
    parts.push(formatHint)
    parts.push('')
  }

  parts.push('Here is raw context about a new Cursive AI client. Extract all structured data you can find:')
  parts.push('')
  parts.push('<raw_context>')
  parts.push(rawContext)
  parts.push('</raw_context>')

  if (templateData) {
    parts.push('')
    parts.push(
      'Use this template as a starting scaffold. Override any template values with specifics from the raw context:'
    )
    parts.push('<template>')
    parts.push(JSON.stringify(templateData, null, 2))
    parts.push('</template>')
  }

  return parts.join('\n')
}

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
    // Fall through
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

/**
 * Parse unstructured context into structured onboarding data using Claude.
 */
export async function parseIntakeContext(
  rawContext: string,
  contextFormat: ContextFormat = 'mixed',
  templateData?: TemplateData
): Promise<ParsedIntakeData> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  if (!rawContext.trim()) {
    throw new Error('No context provided to parse')
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
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserMessage(rawContext, contextFormat, templateData),
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'unknown error')
    throw new Error(
      `Claude API returned ${response.status}: ${errorBody.slice(0, 200)}`
    )
  }

  const result = await response.json()

  if (!result.content || !Array.isArray(result.content) || result.content.length === 0) {
    throw new Error('Claude API returned unexpected response structure')
  }

  const textBlock = result.content.find((block: Record<string, unknown>) => block.type === 'text')
  const content = textBlock?.text as string | undefined
  if (!content) {
    throw new Error('Claude API returned empty content')
  }

  const parsed = safeParseJSON<ParsedIntakeData>(content, 'Intake Parser')

  // Sanitize parsed data (immutable — create new object)
  const sanitized: ParsedIntakeData = {
    ...parsed,
    packages_selected: Array.isArray(parsed.packages_selected) ? parsed.packages_selected : [],
    target_industries: Array.isArray(parsed.target_industries) ? parsed.target_industries : [],
    sub_industries: Array.isArray(parsed.sub_industries) ? parsed.sub_industries : [],
    target_company_sizes: Array.isArray(parsed.target_company_sizes) ? parsed.target_company_sizes : [],
    target_titles: Array.isArray(parsed.target_titles) ? parsed.target_titles : [],
    target_geography: Array.isArray(parsed.target_geography) ? parsed.target_geography : [],
    intent_keywords: Array.isArray(parsed.intent_keywords) ? parsed.intent_keywords : [],
    competitor_names: Array.isArray(parsed.competitor_names) ? parsed.competitor_names : [],
    data_use_cases: Array.isArray(parsed.data_use_cases) ? parsed.data_use_cases : [],
    fields_inferred: Array.isArray(parsed.fields_inferred) ? parsed.fields_inferred : [],
    missing_critical_fields: Array.isArray(parsed.missing_critical_fields) ? parsed.missing_critical_fields : [],
    confidence_score: typeof parsed.confidence_score === 'number' ? parsed.confidence_score : 50,
    packages_reasoning: parsed.packages_reasoning || '',
  }

  return sanitized
}
