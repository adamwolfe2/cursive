/**
 * MCP Server — Cursive (Intent Loop)
 *
 * Stateless JSON-RPC 2.0 endpoint exposing AudienceLab enrichment as MCP tools
 * for AI agents (Claude Desktop, Claude Code, Cursor, Rox, etc.).
 *
 * Protocol: Model Context Protocol 2025-03-26, transported as plain
 * JSON-RPC 2.0 over HTTP POST (no SSE, no session state). This is wire-
 * compatible with `claude mcp add --transport http` and Claude Desktop's
 * remote HTTP transport.
 *
 * Security:
 *  - Bearer auth via workspace API key scoped `mcp:access`
 *  - Two-layer rate limiting: 'mcp-request' outer (60/min/workspace) +
 *    per-tool 'lead-enrich' (30/min/workspace) for cost-sensitive tools
 *  - Every tool call logged to api_usage_log for forensic cost tracking
 *  - Tool responses are field-whitelisted — raw AL responses never leak
 *
 * Tools shipped:
 *  - enrich_person: email/name → identity profile
 *  - lookup_company: company name or domain → firmographics
 *  - pull_in_market_identities: live in-market buyers within workspace targeting
 *  - get_intent_signals: recent behavioral events for a known identity
 *
 * Cross-workspace isolation:
 *  - Every tool resolves the caller's workspace from the bearer token and
 *    enforces workspace_id in all DB queries.
 *  - pull_in_market_identities loads the caller's user_targeting rows and
 *    refuses to broaden beyond configured industries/states — caller args
 *    can only NARROW the filter.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateBearer,
  BearerAuthError,
  bearerAuthErrorResponse,
} from '@/lib/middleware/bearer-api-auth'
import { withRateLimit } from '@/lib/middleware/rate-limiter'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  enrich,
  previewAudience,
  buildWorkspaceAudienceFilters,
  AudienceLabUnfilteredError,
  type ALEnrichedProfile,
} from '@/lib/audiencelab/api-client'
import { safeError } from '@/lib/utils/log-sanitizer'

// Hard caps — defense-in-depth. Never let agent loops explode these.
const PULL_MAX_RECORDS = 50
const PULL_MAX_DAYS_BACK = 7
const INTENT_SIGNALS_MAX_RESULTS = 20
const INTENT_SIGNALS_DEFAULT_HOURS = 24
const INTENT_SIGNALS_MAX_HOURS = 168 // 7 days

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MCP_PROTOCOL_VERSION = '2025-03-26'
const MCP_SERVER_NAME = 'cursive-mcp'
const MCP_SERVER_VERSION = '0.1.0'
const REQUIRED_SCOPE = 'mcp:access'

// ─── JSON-RPC types ────────────────────────────────────────────────────────

interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: string | number | null
  method: string
  params?: unknown
}

interface JsonRpcError {
  code: number
  message: string
  data?: unknown
}

const ERROR_PARSE = -32700
const ERROR_INVALID_REQUEST = -32600
const ERROR_METHOD_NOT_FOUND = -32601
const ERROR_INVALID_PARAMS = -32602
const ERROR_INTERNAL = -32603
const ERROR_TOOL_FAILURE = -32000
const ERROR_RATE_LIMITED = -32001

function rpcSuccess(id: string | number | null | undefined, result: unknown): NextResponse {
  return NextResponse.json({ jsonrpc: '2.0', id: id ?? null, result })
}

function rpcError(
  id: string | number | null | undefined,
  error: JsonRpcError,
  httpStatus = 200
): NextResponse {
  return NextResponse.json(
    { jsonrpc: '2.0', id: id ?? null, error },
    { status: httpStatus }
  )
}

// ─── Tool registry ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'enrich_person',
    description:
      'Enrich a person record with AudienceLab identity data: emails (personal + business), phones, company, job title, demographics, and intent signals. Uses a continuously refreshed identity graph. Requires at least one identifying field.',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', description: 'Work or personal email' },
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        phone: { type: 'string', description: 'Phone number in any common format' },
        company: { type: 'string', description: 'Company name (free-form)' },
        city: { type: 'string' },
        state: { type: 'string' },
        zip: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'lookup_company',
    description:
      'Look up a company by domain and return firmographics: industry, SIC/NAICS, employee count, revenue, HQ location, LinkedIn URL. Pass the company domain (e.g. "nvidia.com"), not the company name.',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Company domain like "nvidia.com"' },
      },
      required: ['domain'],
      additionalProperties: false,
    },
  },
  {
    name: 'pull_in_market_identities',
    description:
      'Pull a sample of in-market identities matching the caller workspace\'s targeting (industries + geographies). ' +
      'Data refreshes every 6 hours via the AudienceLab intent graph. Returns up to 50 sanitized profiles with SHA-256 ' +
      'hashed emails, job title, company, and location. Caller args can only NARROW workspace targeting — never broaden. ' +
      'Rate limited to 5 pulls per hour per workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        industries: {
          type: 'array',
          items: { type: 'string' },
          description: 'Industry names to narrow to. Must be a subset of workspace targeting. Omit for all configured industries.',
        },
        states: {
          type: 'array',
          items: { type: 'string' },
          description: 'State codes (e.g. ["CA","TX"]) to narrow to. Must be a subset of workspace targeting. Omit for all configured states.',
        },
        days_back: {
          type: 'integer',
          minimum: 1,
          maximum: 7,
          description: 'How many days of intent signal freshness to include. Defaults to 7, hard-capped at 7.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_intent_signals',
    description:
      'Retrieve recent behavioral intent events for a known identity from the caller workspace\'s pixel. ' +
      'Requires either hem_sha256 (the SHA-256 hashed email identifier) or profile_id. Returns the last 20 events ' +
      'within the lookback window. Workspace-isolated — cannot query other workspaces\' event streams.',
    inputSchema: {
      type: 'object',
      properties: {
        hem_sha256: { type: 'string', description: 'SHA-256 hashed email (hex). Obtain via enrich_person or pull_in_market_identities.' },
        profile_id: { type: 'string', description: 'AudienceLab profile id.' },
        hours: {
          type: 'integer',
          minimum: 1,
          maximum: INTENT_SIGNALS_MAX_HOURS,
          description: `Lookback window in hours. Defaults to ${INTENT_SIGNALS_DEFAULT_HOURS}, hard-capped at ${INTENT_SIGNALS_MAX_HOURS} (7 days).`,
        },
      },
      additionalProperties: false,
    },
  },
] as const

// ─── Tool implementations ──────────────────────────────────────────────────

interface ToolContext {
  req: NextRequest
  workspaceId: string
  userId: string
}

type ToolResult = {
  content: Array<{ type: 'text'; text: string }>
  structuredContent: Record<string, unknown>
}

async function toolEnrichPerson(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolResult> {
  // At least one identifying field required
  const hasIdentifier =
    typeof args.email === 'string' ||
    typeof args.phone === 'string' ||
    (typeof args.first_name === 'string' && typeof args.last_name === 'string')
  if (!hasIdentifier) {
    throw new ToolError(
      ERROR_INVALID_PARAMS,
      'enrich_person requires at least one of: email, phone, or (first_name + last_name).'
    )
  }

  // Per-tool rate limit reused from existing 'lead-enrich' tier (30/min/workspace)
  const perToolLimit = await withRateLimit(
    ctx.req,
    'lead-enrich',
    `workspace:${ctx.workspaceId}`
  )
  if (perToolLimit) {
    throw new ToolError(
      ERROR_RATE_LIMITED,
      'Per-tool rate limit exceeded for enrich_person (lead-enrich: 30/min/workspace).'
    )
  }

  const filter: Record<string, string> = {}
  if (typeof args.email === 'string') filter.email = args.email
  if (typeof args.first_name === 'string') filter.first_name = args.first_name
  if (typeof args.last_name === 'string') filter.last_name = args.last_name
  if (typeof args.phone === 'string') filter.phone = args.phone
  if (typeof args.company === 'string') filter.company = args.company
  if (typeof args.city === 'string') filter.city = args.city
  if (typeof args.state === 'string') filter.state = args.state
  if (typeof args.zip === 'string') filter.zip = args.zip

  let response
  try {
    response = await enrich({ filter })
  } catch (err) {
    safeError('[mcp:enrich_person] AudienceLab enrich failed:', err)
    throw new ToolError(
      ERROR_TOOL_FAILURE,
      'Enrichment provider error. The request was well-formed but the upstream provider failed.'
    )
  }

  const profile = response.result?.[0]
  if (!profile || !hasPersonData(profile)) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ found: false, message: 'No match in identity graph.' }),
        },
      ],
      structuredContent: { found: false, profile: null },
    }
  }

  const sanitized = sanitizePersonProfile(profile)
  return {
    content: [{ type: 'text', text: JSON.stringify({ found: true, profile: sanitized }) }],
    structuredContent: { found: true, profile: sanitized },
  }
}

async function toolLookupCompany(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolResult> {
  const rawDomain = typeof args.domain === 'string' ? args.domain.trim().toLowerCase() : ''
  if (!rawDomain) {
    throw new ToolError(ERROR_INVALID_PARAMS, 'lookup_company requires the `domain` field.')
  }
  // Strip protocol, path, and leading "www." so callers can pass either
  // "https://nvidia.com/about" or "nvidia.com" and we normalize.
  const domain = rawDomain
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '')

  // Reject anything that isn't a plausible domain (avoid AL 400s on garbage).
  if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(domain)) {
    throw new ToolError(
      ERROR_INVALID_PARAMS,
      `Domain "${rawDomain}" is not a valid domain format. Expected e.g. "nvidia.com".`
    )
  }

  const perToolLimit = await withRateLimit(
    ctx.req,
    'lead-enrich',
    `workspace:${ctx.workspaceId}`
  )
  if (perToolLimit) {
    throw new ToolError(
      ERROR_RATE_LIMITED,
      'Per-tool rate limit exceeded for lookup_company (lead-enrich: 30/min/workspace).'
    )
  }

  let response
  try {
    response = await enrich({ filter: { company_domain: domain } })
  } catch (err) {
    safeError('[mcp:lookup_company] AudienceLab enrich failed:', err)
    throw new ToolError(
      ERROR_TOOL_FAILURE,
      'Enrichment provider error. The request was well-formed but the upstream provider failed.'
    )
  }

  const profile = response.result?.[0]
  if (!profile || !hasCompanyData(profile)) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            found: false,
            message: `No company data found for domain "${domain}".`,
          }),
        },
      ],
      structuredContent: { found: false, company: null },
    }
  }

  const sanitized = sanitizeCompanyProfile(profile)
  return {
    content: [{ type: 'text', text: JSON.stringify({ found: true, company: sanitized }) }],
    structuredContent: { found: true, company: sanitized },
  }
}

/** AL sometimes returns a profile with all nullish fields — treat those as "no data". */
function hasPersonData(p: ALEnrichedProfile): boolean {
  return Boolean(
    p.FIRST_NAME ||
      p.LAST_NAME ||
      p.PERSONAL_EMAILS ||
      p.BUSINESS_EMAIL ||
      p.MOBILE_PHONE ||
      p.JOB_TITLE ||
      p.COMPANY_NAME
  )
}

function hasCompanyData(p: ALEnrichedProfile): boolean {
  return Boolean(p.COMPANY_NAME || p.COMPANY_DOMAIN || p.COMPANY_INDUSTRY)
}

async function toolPullInMarketIdentities(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolResult> {
  // Strict per-tool rate limit — this is the most expensive tool because it
  // hits AL preview API (billable) and can return up to 50 records.
  const perToolLimit = await withRateLimit(
    ctx.req,
    'mcp-segment-pull',
    `workspace:${ctx.workspaceId}`
  )
  if (perToolLimit) {
    throw new ToolError(
      ERROR_RATE_LIMITED,
      'Per-tool rate limit exceeded for pull_in_market_identities (mcp-segment-pull: 5/hour/workspace).'
    )
  }

  // Load the caller workspace's targeting preferences — this is the security
  // boundary for this tool. Any call that doesn't intersect with configured
  // targeting returns empty.
  const admin = createAdminClient()
  const { data: targetingRows, error: targetingErr } = await admin
    .from('user_targeting')
    .select('target_industries, target_states, target_cities, target_zips')
    .eq('workspace_id', ctx.workspaceId)
    .eq('is_active', true)

  if (targetingErr) {
    safeError('[mcp:pull_in_market_identities] targeting load failed:', targetingErr)
    throw new ToolError(ERROR_TOOL_FAILURE, 'Failed to load workspace targeting preferences.')
  }

  if (!targetingRows || targetingRows.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            found: false,
            message:
              'No active targeting configured for this workspace. Add targeting preferences in Settings → Targeting before using this tool.',
          }),
        },
      ],
      structuredContent: { found: false, identities: [], reason: 'no_targeting_configured' },
    }
  }

  // Union all active targeting rows in the workspace to form the authoritative
  // set of industries/states/cities/zips the workspace is allowed to query.
  const workspaceIndustries = new Set<string>()
  const workspaceStates = new Set<string>()
  const workspaceCities = new Set<string>()
  const workspaceZips = new Set<string>()
  for (const row of targetingRows) {
    for (const v of row.target_industries ?? []) workspaceIndustries.add(v)
    for (const v of row.target_states ?? []) workspaceStates.add(v)
    for (const v of row.target_cities ?? []) workspaceCities.add(v)
    for (const v of row.target_zips ?? []) workspaceZips.add(v)
  }

  // Parse caller narrowing args. If provided, they must be a SUBSET of the
  // workspace's configured values. We intersect — never union, never replace.
  const requestedIndustries = Array.isArray(args.industries)
    ? (args.industries as unknown[]).filter((v): v is string => typeof v === 'string')
    : null
  const requestedStates = Array.isArray(args.states)
    ? (args.states as unknown[]).filter((v): v is string => typeof v === 'string')
    : null

  const effectiveIndustries = requestedIndustries
    ? requestedIndustries.filter((v) => workspaceIndustries.has(v))
    : Array.from(workspaceIndustries)
  const effectiveStates = requestedStates
    ? requestedStates.filter((v) => workspaceStates.has(v))
    : Array.from(workspaceStates)

  // If caller specified narrowing but none of it intersects workspace targeting,
  // return empty rather than fall through to the workspace's full targeting.
  if (requestedIndustries && effectiveIndustries.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            found: false,
            message:
              'None of the requested industries are in your workspace targeting. Narrow to a subset of your configured industries.',
          }),
        },
      ],
      structuredContent: {
        found: false,
        identities: [],
        reason: 'narrowing_outside_workspace_targeting',
        allowed_industries: Array.from(workspaceIndustries),
      },
    }
  }
  if (requestedStates && effectiveStates.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            found: false,
            message:
              'None of the requested states are in your workspace targeting. Narrow to a subset of your configured states.',
          }),
        },
      ],
      structuredContent: {
        found: false,
        identities: [],
        reason: 'narrowing_outside_workspace_targeting',
        allowed_states: Array.from(workspaceStates),
      },
    }
  }

  // Build the AL filter. Cities/zips stay at workspace level — the tool's
  // narrowing args don't expose them in v1 (too many footguns in free-text zip).
  const segmentFilters = buildWorkspaceAudienceFilters({
    industries: effectiveIndustries.length > 0 ? effectiveIndustries : undefined,
    states: effectiveStates.length > 0 ? effectiveStates : undefined,
    cities: workspaceCities.size > 0 ? Array.from(workspaceCities) : undefined,
    zips: workspaceZips.size > 0 ? Array.from(workspaceZips) : undefined,
  })

  // Parse and hard-cap days_back
  const rawDays = args.days_back
  const daysBack =
    typeof rawDays === 'number' && rawDays >= 1 && rawDays <= PULL_MAX_DAYS_BACK
      ? Math.floor(rawDays)
      : PULL_MAX_DAYS_BACK

  // Call AL preview — this is the billable action. Hard-capped at 50 records.
  let preview
  try {
    preview = await previewAudience({
      days_back: daysBack,
      filters: segmentFilters,
      limit: PULL_MAX_RECORDS,
      include_dnc: false,
    })
  } catch (err) {
    if (err instanceof AudienceLabUnfilteredError) {
      safeError('[mcp:pull_in_market_identities] unfiltered response refused:', err)
      throw new ToolError(
        ERROR_TOOL_FAILURE,
        'Audience query returned an unfiltered response and was refused for safety. Try narrowing your filters.'
      )
    }
    safeError('[mcp:pull_in_market_identities] previewAudience failed:', err)
    throw new ToolError(
      ERROR_TOOL_FAILURE,
      'Audience preview failed upstream. The request was well-formed but the provider errored.'
    )
  }

  const records = (preview.result ?? []).slice(0, PULL_MAX_RECORDS)
  const sanitized = records.map(sanitizeInMarketIdentity)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          found: sanitized.length,
          total_count: preview.count ?? null,
          window: { days_back: daysBack },
          filters_applied: {
            industries: effectiveIndustries,
            states: effectiveStates,
          },
          identities: sanitized,
        }),
      },
    ],
    structuredContent: {
      found: sanitized.length,
      total_count: preview.count ?? null,
      window: { days_back: daysBack },
      filters_applied: {
        industries: effectiveIndustries,
        states: effectiveStates,
      },
      identities: sanitized,
    },
  }
}

async function toolGetIntentSignals(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolResult> {
  const hemSha256 = typeof args.hem_sha256 === 'string' ? args.hem_sha256.trim() : ''
  const profileId = typeof args.profile_id === 'string' ? args.profile_id.trim() : ''

  if (!hemSha256 && !profileId) {
    throw new ToolError(
      ERROR_INVALID_PARAMS,
      'get_intent_signals requires at least one of: hem_sha256 or profile_id.'
    )
  }

  const rawHours = args.hours
  const hours =
    typeof rawHours === 'number' && rawHours >= 1 && rawHours <= INTENT_SIGNALS_MAX_HOURS
      ? Math.floor(rawHours)
      : INTENT_SIGNALS_DEFAULT_HOURS

  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  // Critical: workspace_id filter MUST be present — this is the security
  // boundary for cross-workspace isolation. We use the admin client so RLS
  // does not apply; the filter is explicit.
  const admin = createAdminClient()
  let query = admin
    .from('audiencelab_events')
    .select('event_type, source, pixel_id, received_at, hem_sha256, profile_id')
    .eq('workspace_id', ctx.workspaceId)
    .gte('received_at', since)
    .order('received_at', { ascending: false })
    .limit(INTENT_SIGNALS_MAX_RESULTS)

  if (hemSha256 && profileId) {
    // Both identifiers supplied — OR them so we don't miss events that only
    // carry one of the two identifiers
    query = query.or(`hem_sha256.eq.${hemSha256},profile_id.eq.${profileId}`)
  } else if (hemSha256) {
    query = query.eq('hem_sha256', hemSha256)
  } else {
    query = query.eq('profile_id', profileId)
  }

  const { data, error } = await query

  if (error) {
    safeError('[mcp:get_intent_signals] query failed:', error)
    throw new ToolError(ERROR_TOOL_FAILURE, 'Failed to query intent signals.')
  }

  const events = (data ?? []).map((e) => ({
    event_type: e.event_type ?? null,
    source: e.source ?? null,
    pixel_id: e.pixel_id ?? null,
    received_at: e.received_at ?? null,
    hem_sha256: e.hem_sha256 ?? null,
    profile_id: e.profile_id ?? null,
  }))

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          found: events.length,
          window_hours: hours,
          events,
        }),
      },
    ],
    structuredContent: {
      found: events.length,
      window_hours: hours,
      events,
    },
  }
}

// ─── Field whitelists (never spread raw AL responses) ──────────────────────

function sanitizePersonProfile(p: ALEnrichedProfile): Record<string, unknown> {
  return {
    first_name: p.FIRST_NAME ?? null,
    last_name: p.LAST_NAME ?? null,
    personal_emails: p.PERSONAL_EMAILS ?? null,
    business_email: p.BUSINESS_EMAIL ?? null,
    personal_phone: p.PERSONAL_PHONE ?? null,
    mobile_phone: p.MOBILE_PHONE ?? null,
    job_title: p.JOB_TITLE ?? null,
    department: p.DEPARTMENT ?? null,
    seniority_level: p.SENIORITY_LEVEL ?? null,
    company_name: p.COMPANY_NAME ?? null,
    company_domain: p.COMPANY_DOMAIN ?? null,
    company_industry: p.COMPANY_INDUSTRY ?? null,
    personal_city: p.PERSONAL_CITY ?? null,
    personal_state: p.PERSONAL_STATE ?? null,
    income_range: p.INCOME_RANGE ?? null,
    age_range: p.AGE_RANGE ?? null,
    sha256_personal_email: p.SHA256_PERSONAL_EMAIL ?? null,
    sha256_business_email: p.SHA256_BUSINESS_EMAIL ?? null,
  }
}

function sanitizeCompanyProfile(p: ALEnrichedProfile): Record<string, unknown> {
  return {
    company_name: p.COMPANY_NAME ?? null,
    company_domain: p.COMPANY_DOMAIN ?? null,
    company_industry: p.COMPANY_INDUSTRY ?? null,
    company_sic: p.COMPANY_SIC ?? null,
    company_naics: p.COMPANY_NAICS ?? null,
    company_employee_count: p.COMPANY_EMPLOYEE_COUNT ?? null,
    company_revenue: p.COMPANY_REVENUE ?? null,
    company_city: p.COMPANY_CITY ?? null,
    company_state: p.COMPANY_STATE ?? null,
    company_zip: p.COMPANY_ZIP ?? null,
    company_phone: p.COMPANY_PHONE ?? null,
    company_linkedin_url: p.COMPANY_LINKEDIN_URL ?? null,
  }
}

/**
 * Sanitize a bulk-pulled in-market identity. Intentionally LESS detailed than
 * enrich_person because these are batch-returned speculative matches —
 * return hashed identifiers and summary fields only. Agents should call
 * enrich_person on a specific hem_sha256 to get full contact details.
 */
function sanitizeInMarketIdentity(p: ALEnrichedProfile): Record<string, unknown> {
  return {
    sha256_personal_email: p.SHA256_PERSONAL_EMAIL ?? null,
    sha256_business_email: p.SHA256_BUSINESS_EMAIL ?? null,
    first_name_initial: typeof p.FIRST_NAME === 'string' && p.FIRST_NAME.length > 0
      ? `${p.FIRST_NAME[0]}.`
      : null,
    last_name: p.LAST_NAME ?? null,
    job_title: p.JOB_TITLE ?? null,
    seniority_level: p.SENIORITY_LEVEL ?? null,
    department: p.DEPARTMENT ?? null,
    company_name: p.COMPANY_NAME ?? null,
    company_domain: p.COMPANY_DOMAIN ?? null,
    company_industry: p.COMPANY_INDUSTRY ?? null,
    company_employee_count: p.COMPANY_EMPLOYEE_COUNT ?? null,
    state: p.PERSONAL_STATE ?? p.COMPANY_STATE ?? null,
    city: p.PERSONAL_CITY ?? p.COMPANY_CITY ?? null,
  }
}

// ─── Tool dispatch ─────────────────────────────────────────────────────────

class ToolError extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.code = code
    this.name = 'ToolError'
  }
}

type ToolName =
  | 'enrich_person'
  | 'lookup_company'
  | 'pull_in_market_identities'
  | 'get_intent_signals'

const TOOL_HANDLERS: Record<ToolName, (args: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult>> = {
  enrich_person: toolEnrichPerson,
  lookup_company: toolLookupCompany,
  pull_in_market_identities: toolPullInMarketIdentities,
  get_intent_signals: toolGetIntentSignals,
}

function isKnownTool(name: string): name is ToolName {
  return name in TOOL_HANDLERS
}

// ─── Usage logging ─────────────────────────────────────────────────────────

async function logUsage(params: {
  workspaceId: string
  userId: string
  endpoint: string
  statusCode: number
  responseTimeMs: number
  req: NextRequest
  requestSize: number
}) {
  try {
    const admin = createAdminClient()
    const forwarded = params.req.headers.get('x-forwarded-for') ?? null
    const ip = forwarded ? forwarded.split(',')[0].trim() : null
    await admin.from('api_usage_log').insert({
      workspace_id: params.workspaceId,
      user_id: params.userId,
      endpoint: params.endpoint,
      method: 'POST',
      status_code: params.statusCode,
      response_time_ms: params.responseTimeMs,
      ip_address: ip,
      user_agent: params.req.headers.get('user-agent'),
      request_size_bytes: params.requestSize,
    })
  } catch (err) {
    // Logging must never block the request path
    safeError('[mcp] api_usage_log insert failed:', err)
  }
}

// ─── POST handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Authenticate
  let auth
  try {
    auth = await authenticateBearer(req, REQUIRED_SCOPE)
  } catch (err) {
    if (err instanceof BearerAuthError) return bearerAuthErrorResponse(err)
    safeError('[mcp] bearer auth failed:', err)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Outer rate limit (envelope — all methods count)
  const outerLimited = await withRateLimit(
    req,
    'mcp-request',
    `workspace:${auth.workspaceId}`
  )
  if (outerLimited) return outerLimited

  // 3. Parse JSON-RPC body
  const rawBody = await req.text()
  const requestSize = new TextEncoder().encode(rawBody).length

  let rpc: JsonRpcRequest
  try {
    rpc = JSON.parse(rawBody)
  } catch {
    return rpcError(null, { code: ERROR_PARSE, message: 'Parse error: invalid JSON' })
  }

  if (!rpc || typeof rpc !== 'object' || rpc.jsonrpc !== '2.0' || typeof rpc.method !== 'string') {
    return rpcError(rpc?.id, {
      code: ERROR_INVALID_REQUEST,
      message: 'Invalid JSON-RPC 2.0 request',
    })
  }

  // 4. Dispatch
  const start = performance.now()
  let statusCode = 200
  let endpointLabel = `mcp:${rpc.method}`

  try {
    switch (rpc.method) {
      case 'initialize': {
        return rpcSuccess(rpc.id, {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
        })
      }

      case 'notifications/initialized':
      case 'notifications/cancelled': {
        // JSON-RPC notifications: no id, no response body expected
        return new NextResponse(null, { status: 204 })
      }

      case 'ping': {
        return rpcSuccess(rpc.id, {})
      }

      case 'tools/list': {
        return rpcSuccess(rpc.id, { tools: TOOLS })
      }

      case 'tools/call': {
        const params = (rpc.params ?? {}) as { name?: string; arguments?: Record<string, unknown> }
        const toolName = typeof params.name === 'string' ? params.name : ''
        const toolArgs = (params.arguments ?? {}) as Record<string, unknown>

        if (!toolName) {
          statusCode = 400
          return rpcError(rpc.id, { code: ERROR_INVALID_PARAMS, message: 'Missing tool name in params.name' })
        }

        if (!isKnownTool(toolName)) {
          statusCode = 404
          return rpcError(rpc.id, { code: ERROR_METHOD_NOT_FOUND, message: `Unknown tool: ${toolName}` })
        }

        endpointLabel = `mcp:${toolName}`
        try {
          const result = await TOOL_HANDLERS[toolName](toolArgs, {
            req,
            workspaceId: auth.workspaceId,
            userId: auth.userId,
          })
          return rpcSuccess(rpc.id, result)
        } catch (err) {
          if (err instanceof ToolError) {
            statusCode = err.code === ERROR_RATE_LIMITED ? 429 : 400
            return rpcError(rpc.id, { code: err.code, message: err.message })
          }
          safeError(`[mcp:${toolName}] unhandled tool error:`, err)
          statusCode = 500
          return rpcError(rpc.id, { code: ERROR_INTERNAL, message: 'Internal tool error' })
        }
      }

      default: {
        statusCode = 404
        return rpcError(rpc.id, {
          code: ERROR_METHOD_NOT_FOUND,
          message: `Method not found: ${rpc.method}`,
        })
      }
    }
  } catch (err) {
    safeError('[mcp] dispatch error:', err)
    statusCode = 500
    return rpcError(rpc.id, { code: ERROR_INTERNAL, message: 'Internal server error' })
  } finally {
    const responseTimeMs = Math.round(performance.now() - start)
    // Fire-and-forget usage log — never awaited into the response path latency
    void logUsage({
      workspaceId: auth.workspaceId,
      userId: auth.userId,
      endpoint: endpointLabel,
      statusCode,
      responseTimeMs,
      req,
      requestSize,
    })
  }
}

// Preflight: allow Claude Desktop / Claude Code to probe the endpoint
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}
