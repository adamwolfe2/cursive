/**
 * ICP Generator Service
 * ---------------------
 * Given free-text product description, ask Claude to extract structured ICP
 * filter primitives that map 1:1 to `agents.outbound_filters`.
 *
 * Used by:
 *   - POST /api/outbound/icp/generate (called by the SetupForm "Generate ICP" button)
 *
 * Strict JSON output via prompt instruction + a permissive parser that
 * tolerates surrounding markdown fencing.
 */

import Anthropic from '@anthropic-ai/sdk'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { IcpGenerationResult, SeniorityLevel } from '@/types/outbound'

const VALID_SENIORITY: SeniorityLevel[] = [
  'C-Suite',
  'VP',
  'Director',
  'Manager',
  'Individual Contributor',
  'Entry Level',
]

let cachedClient: Anthropic | null = null

function getClient(): Anthropic {
  if (!cachedClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    }
    cachedClient = new Anthropic({ apiKey })
  }
  return cachedClient
}

const SYSTEM_PROMPT = `You are an expert B2B sales strategist. Given a description of a product or service, extract a precise Ideal Customer Profile (ICP) for outbound prospecting.

Output a JSON object with EXACTLY these keys (no additional commentary):
{
  "industries": [array of 3-6 industry names — common values: "Software", "Marketing", "Financial Services", "Healthcare", "Retail", "Manufacturing", "Real Estate", "Education", "Construction", "Legal", "Consulting", "Insurance", "Nonprofit"],
  "seniority_levels": [array from EXACTLY: "C-Suite", "VP", "Director", "Manager", "Individual Contributor", "Entry Level" — pick 1-3 most relevant],
  "states": [array of 2-letter US state codes, or empty array if nationwide],
  "job_titles": [array of 3-6 specific job titles like "Head of Growth", "VP of Marketing", "Director of Sales"],
  "company_sizes": [array of size buckets like "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+"],
  "departments": [array of departments like "Sales", "Marketing", "Engineering", "Operations", "Finance"],
  "icp_summary": "1-2 sentence plain-English description of the target customer",
  "persona_summary": "1-2 sentence description of the buyer persona — their role, motivations, and pain points"
}

Be specific. If the product is generic, infer the most likely buyer based on the value proposition. NEVER include explanatory prose outside the JSON object.`

/**
 * Generate an ICP from a free-text product description.
 * Returns a structured filter set + plain-English summaries.
 *
 * Uses an explicit 25-second SDK timeout so a stuck Anthropic call surfaces
 * as an error rather than hanging the route.
 */
export async function generateIcpFromProduct(productText: string): Promise<IcpGenerationResult> {
  const trimmed = productText.trim()
  if (trimmed.length < 10) {
    throw new Error('Product description too short (minimum 10 characters)')
  }

  const client = getClient()

  try {
    const response = await client.messages.create(
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Product description:\n\n${trimmed}\n\nReturn JSON only.`,
          },
        ],
      },
      {
        // SDK-level timeout — abort the underlying fetch after 25s.
        // Combined with the route's wall-clock Promise.race(30s) and
        // maxDuration=45s, the user always sees a response within ~30s.
        timeout: 25_000,
        maxRetries: 1,
      }
    )

    if (!response.content?.length || response.content[0].type !== 'text') {
      throw new Error('Empty or non-text Claude response')
    }

    const raw = response.content[0].text
    return parseAndValidate(raw)
  } catch (error) {
    safeError('[outbound] ICP generation failed:', error)
    throw error instanceof Error ? error : new Error(String(error))
  }
}

/**
 * Parse Claude's response, tolerating surrounding markdown fences,
 * and validate the shape. Throws on malformed input.
 *
 * Exported for unit tests.
 */
export function parseAndValidate(raw: string): IcpGenerationResult {
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON object found in Claude response')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch (err) {
    throw new Error(`Invalid JSON in Claude response: ${(err as Error).message}`)
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Claude response is not a JSON object')
  }

  const obj = parsed as Record<string, unknown>

  // Coerce seniority strictly to the valid set
  const seniorityRaw = Array.isArray(obj.seniority_levels) ? obj.seniority_levels : []
  const seniority_levels = (seniorityRaw as unknown[])
    .filter((v): v is string => typeof v === 'string')
    .map(v => normalizeSeniority(v))
    .filter((v): v is SeniorityLevel => v !== null)

  return {
    industries: stringArray(obj.industries),
    seniority_levels,
    states: stringArray(obj.states).map(s => s.toUpperCase().slice(0, 2)),
    job_titles: stringArray(obj.job_titles),
    company_sizes: stringArray(obj.company_sizes),
    departments: stringArray(obj.departments),
    icp_summary:
      typeof obj.icp_summary === 'string' && obj.icp_summary.length > 0
        ? obj.icp_summary
        : 'No ICP summary provided.',
    persona_summary:
      typeof obj.persona_summary === 'string' && obj.persona_summary.length > 0
        ? obj.persona_summary
        : 'No persona summary provided.',
  }
}

function stringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((s): s is string => typeof s === 'string' && s.length > 0)
}

/**
 * Map a Claude-output seniority string into our strict enum, accepting common
 * variants like "VP / SVP" or "Manager+".
 */
function normalizeSeniority(value: string): SeniorityLevel | null {
  const v = value.trim().toLowerCase()
  if (v.includes('c-suite') || v.includes('founder') || v.includes('cxo') || v.includes('ceo')) return 'C-Suite'
  if (v.includes('vp') || v.includes('vice president')) return 'VP'
  if (v.includes('director') || v.includes('head of')) return 'Director'
  if (v.includes('manager') || v.includes('lead')) return 'Manager'
  if (v.includes('individual') || v.includes('ic')) return 'Individual Contributor'
  if (v.includes('entry')) return 'Entry Level'
  // Try exact match against the canonical list
  const canonical = VALID_SENIORITY.find(s => s.toLowerCase() === v)
  return canonical ?? null
}
