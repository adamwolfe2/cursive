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
 * Tools shipped in this slice:
 *  - enrich_person: email/name → identity profile
 *  - lookup_company: company name or domain → firmographics
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateBearer,
  BearerAuthError,
  bearerAuthErrorResponse,
} from '@/lib/middleware/bearer-api-auth'
import { withRateLimit } from '@/lib/middleware/rate-limiter'
import { createAdminClient } from '@/lib/supabase/admin'
import { enrich, type ALEnrichedProfile } from '@/lib/audiencelab/api-client'
import { safeError } from '@/lib/utils/log-sanitizer'

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
      'Look up a company by name or domain and return firmographics: industry, SIC/NAICS, employee count, revenue, HQ location, LinkedIn URL.',
    inputSchema: {
      type: 'object',
      properties: {
        company: { type: 'string', description: 'Company name or domain' },
      },
      required: ['company'],
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
  if (!profile) {
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
    content: [{ type: 'text', text: JSON.stringify(sanitized) }],
    structuredContent: { found: true, profile: sanitized },
  }
}

async function toolLookupCompany(
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolResult> {
  const company = typeof args.company === 'string' ? args.company.trim() : ''
  if (!company) {
    throw new ToolError(ERROR_INVALID_PARAMS, 'lookup_company requires the `company` field.')
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
    response = await enrich({ filter: { company } })
  } catch (err) {
    safeError('[mcp:lookup_company] AudienceLab enrich failed:', err)
    throw new ToolError(
      ERROR_TOOL_FAILURE,
      'Enrichment provider error. The request was well-formed but the upstream provider failed.'
    )
  }

  const profile = response.result?.[0]
  if (!profile) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ found: false, message: 'No matching company found.' }),
        },
      ],
      structuredContent: { found: false, company: null },
    }
  }

  const sanitized = sanitizeCompanyProfile(profile)
  return {
    content: [{ type: 'text', text: JSON.stringify(sanitized) }],
    structuredContent: { found: true, company: sanitized },
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

// ─── Tool dispatch ─────────────────────────────────────────────────────────

class ToolError extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.code = code
    this.name = 'ToolError'
  }
}

type ToolName = 'enrich_person' | 'lookup_company'

const TOOL_HANDLERS: Record<ToolName, (args: Record<string, unknown>, ctx: ToolContext) => Promise<ToolResult>> = {
  enrich_person: toolEnrichPerson,
  lookup_company: toolLookupCompany,
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
