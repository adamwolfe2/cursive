/**
 * Public copilot tools — a restricted, read-only subset of the admin toolkit.
 *
 * The public Audience Builder copilot must not expose write actions, live
 * audience counts, or raw segment_ids (which are our AudienceLab-internal
 * identifiers). This module handles:
 *   1. Allowlisting which tools the LLM can call.
 *   2. Sanitizing tool output before it leaves the server — raw segment_ids
 *      are replaced with HMAC-signed pseudo-ids that the server can verify
 *      and reverse server-side when the client asks for a sample of that
 *      segment.
 *   3. Sample-lead tool that calls AL previewAudience with PII masking.
 */

import { createHmac } from 'crypto'
import { ADMIN_TOOLS, runTool, type CopilotToolName, type ToolDefinition } from './tools'
import { previewAudience, type ALEnrichedProfile } from '@/lib/audiencelab/api-client'
import { getTokenSecret } from './public-session'
import type { SegmentResult } from './types'

// ============================================================================
// Pseudo-id signing (HMAC — reversible server-side, opaque client-side)
// ============================================================================

const SIG_LEN = 12

function base64urlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url')
}

function base64urlDecode(input: string): string | null {
  try {
    return Buffer.from(input, 'base64url').toString('utf8')
  } catch {
    return null
  }
}

function hmacShort(payload: string): string {
  return createHmac('sha256', getTokenSecret()).update(payload).digest('base64url').slice(0, SIG_LEN)
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Sign a raw id (segment_id or person UUID) so it can be sent to the client and later verified. */
export function signOpaqueId(prefix: 'seg' | 'person', realId: string): string {
  const body = base64urlEncode(realId)
  const sig = hmacShort(`${prefix}:${body}`)
  return `${prefix}_${body}.${sig}`
}

/** Verify an opaque id and return the original raw id, or null if tampered / malformed. */
export function verifyOpaqueId(prefix: 'seg' | 'person', opaque: string): string | null {
  if (typeof opaque !== 'string' || !opaque.startsWith(`${prefix}_`)) return null
  const rest = opaque.slice(prefix.length + 1)
  const [body, sig] = rest.split('.')
  if (!body || !sig) return null
  const expected = hmacShort(`${prefix}:${body}`)
  if (!constantTimeEqual(sig, expected)) return null
  return base64urlDecode(body)
}

// ============================================================================
// Tool allowlist
// ============================================================================

export type PublicToolName = CopilotToolName | 'get_segment_sample'

export const PUBLIC_ALLOWED_TOOLS = new Set<PublicToolName>([
  'search_segments',
  'list_top_categories',
  'get_segment_sample',
])

const ADMIN_ALLOWED_SUBSET: ToolDefinition[] = ADMIN_TOOLS.filter((t) =>
  PUBLIC_ALLOWED_TOOLS.has(t.name as PublicToolName)
)

const SAMPLE_TOOL: ToolDefinition = {
  name: 'get_segment_sample' as CopilotToolName, // cast — admin toolset doesn't know this one
  description:
    'Fetch a masked sample of 10–15 REAL in-market profiles from a specific segment the user has shown interest in. Use when the user clicks "Show me sample leads" on a segment card, or asks to see actual people/leads/samples from a specific segment. Returns first name, masked last name, masked email, company, state, and job title. Counts against the user\'s daily quota (max 3 samples per day, max 1 per segment per day).',
  input_schema: {
    type: 'object',
    properties: {
      segment_id: {
        type: 'string',
        description:
          'The opaque segment_id (format: seg_xxx.yyy) from a prior search_segments result. NEVER guess or invent this — use only IDs returned by the previous tool call.',
      },
      days_back: {
        type: 'number',
        description: 'How many days of in-market activity to include. Default 30, max 30.',
      },
    },
    required: ['segment_id'],
  },
}

export const PUBLIC_TOOLS: ToolDefinition[] = [...ADMIN_ALLOWED_SUBSET, SAMPLE_TOOL]

// ============================================================================
// Output sanitization
// ============================================================================

/** Replace raw segment_ids with signed opaque tokens the server can reverse. */
export function sanitizeSegmentsForPublic(segments: SegmentResult[]): SegmentResult[] {
  return segments.map((s) => ({
    ...s,
    segment_id: signOpaqueId('seg', s.segment_id),
  }))
}

/** Strip any raw UUIDs that might leak from tool summaries / LLM text. */
export function sanitizeText(text: string): string {
  return text.replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    '[redacted]'
  )
}

// ============================================================================
// PII masking for sample leads
// ============================================================================

/** Generic personal-email domains we should NOT expose (feels sketchy). */
const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'me.com',
  'live.com',
  'msn.com',
  'protonmail.com',
  'mail.com',
  'gmx.com',
  'yandex.com',
])

function maskLastName(lastName: string | undefined | null): string {
  if (!lastName) return ''
  const trimmed = lastName.trim()
  if (!trimmed) return ''
  return `${trimmed[0].toUpperCase()}.`
}

function maskEmail(email: string | undefined | null): string {
  if (!email) return ''
  const m = email.trim().match(/^([^@]+)@([^@]+)$/)
  if (!m) return ''
  const [, local, domain] = m
  const domParts = domain.split('.')
  const tld = domParts.slice(-1)[0] ?? 'com'
  const localLead = local.slice(0, Math.min(2, local.length))
  return `${localLead}***@***.${tld}`
}

function maskCompany(profile: ALEnrichedProfile): string | null {
  const name = profile.COMPANY_NAME?.trim()
  const domain = profile.COMPANY_DOMAIN?.trim().toLowerCase()
  // If the "company" is actually a personal email domain, don't show it.
  if (domain && PERSONAL_EMAIL_DOMAINS.has(domain)) return null
  if (name) return name
  // Derive from domain: acme.com → Acme
  if (domain) {
    const base = domain.split('.')[0]
    return base.charAt(0).toUpperCase() + base.slice(1)
  }
  return null
}

export interface MaskedSamplePerson {
  id: string              // signed opaque id, reversible on reveal endpoint
  first_name: string      // full
  last_name_masked: string // "C."
  email_masked: string    // "sa***@***.com"
  company: string | null  // full if non-personal domain
  state: string | null
  job_title: string | null
  industry: string | null
  seniority: string | null
}

/** Build a masked sample person from an AL profile. Returns null for unusable rows. */
export function maskProfileForPublic(profile: ALEnrichedProfile): MaskedSamplePerson | null {
  const firstName = profile.FIRST_NAME?.trim()
  if (!firstName) return null

  const uuid = profile.UUID ?? `fallback-${Math.random().toString(36).slice(2)}-${Date.now()}`
  const bestEmail = profile.BUSINESS_EMAIL?.trim() || profile.PERSONAL_EMAILS?.split(/[,;]/)[0]?.trim()
  const masked = maskEmail(bestEmail)
  if (!masked) return null

  return {
    id: signOpaqueId('person', uuid),
    first_name: firstName,
    last_name_masked: maskLastName(profile.LAST_NAME),
    email_masked: masked,
    company: maskCompany(profile),
    state: profile.COMPANY_STATE || profile.PERSONAL_STATE || null,
    job_title: profile.JOB_TITLE || null,
    industry: profile.COMPANY_INDUSTRY || null,
    seniority: profile.SENIORITY_LEVEL || null,
  }
}

/**
 * Fully unmask a profile — used ONLY on the reveal endpoint after the lead has
 * progressed to tier 1+ (qualifier answered, call booked, or trial started).
 */
export interface UnmaskedSamplePerson {
  id: string // still opaque — we don't expose UUIDs even to unlocked users
  first_name: string
  last_name: string
  email: string
  company: string | null
  domain: string | null
  state: string | null
  city: string | null
  job_title: string | null
  seniority: string | null
  industry: string | null
}

export function fullyRevealProfile(profile: ALEnrichedProfile): UnmaskedSamplePerson | null {
  if (!profile.FIRST_NAME) return null
  const bestEmail = profile.BUSINESS_EMAIL?.trim() || profile.PERSONAL_EMAILS?.split(/[,;]/)[0]?.trim()
  if (!bestEmail) return null
  const uuid = profile.UUID ?? `fallback-${Math.random().toString(36).slice(2)}-${Date.now()}`
  return {
    id: signOpaqueId('person', uuid),
    first_name: profile.FIRST_NAME,
    last_name: profile.LAST_NAME ?? '',
    email: bestEmail,
    company: profile.COMPANY_NAME ?? null,
    domain: profile.COMPANY_DOMAIN ?? null,
    state: profile.COMPANY_STATE || profile.PERSONAL_STATE || null,
    city: profile.COMPANY_CITY || profile.PERSONAL_CITY || null,
    job_title: profile.JOB_TITLE ?? null,
    seniority: profile.SENIORITY_LEVEL ?? null,
    industry: profile.COMPANY_INDUSTRY ?? null,
  }
}

// ============================================================================
// Sample-pull tool
// ============================================================================

export interface SampleToolResult {
  summary: string
  segments?: SegmentResult[]
  sample?: {
    /** Pseudo-id we sent the client — round-tripped back for the reveal flow */
    segment_pseudo_id: string
    /** Real AL id — server-side only, stored in audience_builder_sample_views */
    segment_real_id: string
    total_count: number
    sample_count: number
    people: MaskedSamplePerson[]
  }
}

async function runSampleTool(input: Record<string, unknown>): Promise<SampleToolResult> {
  const opaque = String(input.segment_id ?? '')
  const realId = verifyOpaqueId('seg', opaque)
  if (!realId) {
    return { summary: 'Invalid or expired segment reference. Please search again and pick a segment.' }
  }

  const daysBack = Math.min(30, Math.max(1, typeof input.days_back === 'number' ? input.days_back : 30))

  try {
    const response = await previewAudience({
      segment: realId,
      days_back: daysBack,
      limit: 15,
    })

    const profiles = response.result ?? []
    const totalCount = response.count ?? 0

    const masked: MaskedSamplePerson[] = []
    for (const p of profiles) {
      const m = maskProfileForPublic(p)
      if (m) masked.push(m)
      if (masked.length >= 15) break
    }

    if (masked.length === 0) {
      return {
        summary: `No sample profiles are currently available for this segment (total pool size: ${totalCount.toLocaleString()}).`,
      }
    }

    return {
      summary: `Pulled ${masked.length} real in-market profiles from a pool of ~${totalCount.toLocaleString()}. Showing first name, masked email, and company. Full contact details unlock after booking a call.`,
      sample: {
        segment_pseudo_id: opaque,
        segment_real_id: realId,
        total_count: totalCount,
        sample_count: masked.length,
        people: masked,
      },
    }
  } catch (err) {
    return {
      summary: `Could not fetch sample profiles right now: ${err instanceof Error ? err.message : 'unknown error'}. Try another segment or try again in a moment.`,
    }
  }
}

// ============================================================================
// Public tool dispatcher
// ============================================================================

export async function runPublicTool(
  name: PublicToolName,
  input: Record<string, unknown>
): Promise<SampleToolResult> {
  if (!PUBLIC_ALLOWED_TOOLS.has(name)) {
    return { summary: `Tool ${name} is not available in the public copilot.` }
  }

  if (name === 'get_segment_sample') {
    return runSampleTool(input)
  }

  const result = await runTool(name as CopilotToolName, input)
  if (result.segments) {
    return {
      summary: result.summary,
      segments: sanitizeSegmentsForPublic(result.segments),
    }
  }
  return result as SampleToolResult
}
