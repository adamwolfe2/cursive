/**
 * POST /api/ext/lookup — person enrichment endpoint.
 *
 * Clay-compatible identity provider. Workspace API key with scope
 * `ext:lookup` required via `Authorization: Bearer <key>` header.
 *
 * Rate limit: 30/min per workspace (lead-enrich tier).
 * Daily cap: 500 billable calls per workspace per rolling 24h (DEFAULT_DAILY_EXT_CAP).
 * Cost trail: one api_usage_log row per request.
 *
 * Request body (at least one identifier required):
 *   { email?, first_name?, last_name?, phone?, company_domain?, city?, state?, zip? }
 *
 * Response shape (success):
 *   { data: { first_name, last_name, personal_emails, business_email, ... } | null,
 *     found: boolean }
 */

import { NextRequest, NextResponse } from 'next/server'
import { withExtGuard, getParsedBody } from '@/lib/middleware/ext-api-guard'
import { enrich, type ALEnrichedProfile } from '@/lib/audiencelab/api-client'
import { safeError } from '@/lib/utils/log-sanitizer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface LookupBody {
  email?: string
  first_name?: string
  last_name?: string
  phone?: string
  company_domain?: string
  city?: string
  state?: string
  zip?: string
}

function hasIdentifier(body: LookupBody): boolean {
  return Boolean(
    body.email ||
      body.phone ||
      (body.first_name && body.last_name) ||
      body.company_domain
  )
}

function sanitizePerson(p: ALEnrichedProfile): Record<string, unknown> {
  return {
    first_name: p.FIRST_NAME ?? null,
    last_name: p.LAST_NAME ?? null,
    personal_emails: p.PERSONAL_EMAILS ?? null,
    business_email: p.BUSINESS_EMAIL ?? null,
    personal_phone: p.PERSONAL_PHONE ?? null,
    mobile_phone: p.MOBILE_PHONE ?? null,
    mobile_phone_dnc: p.MOBILE_PHONE_DNC ?? null,
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

export const POST = withExtGuard(
  { requiredScope: 'ext:lookup', endpointLabel: 'ext:lookup', rateLimitTier: 'lead-enrich' },
  async (req: NextRequest) => {
    const body = getParsedBody<LookupBody>(req)

    if (!hasIdentifier(body)) {
      return {
        status: 400,
        body: {
          error: 'At least one identifier required: email, phone, (first_name + last_name), or company_domain.',
        },
      }
    }

    const filter: Record<string, string> = {}
    if (body.email) filter.email = body.email
    if (body.first_name) filter.first_name = body.first_name
    if (body.last_name) filter.last_name = body.last_name
    if (body.phone) filter.phone = body.phone
    if (body.company_domain) filter.company_domain = body.company_domain
    if (body.city) filter.city = body.city
    if (body.state) filter.state = body.state
    if (body.zip) filter.zip = body.zip

    try {
      const response = await enrich({ filter })
      const profile = response.result?.[0]

      if (!profile || !hasPersonData(profile)) {
        return {
          status: 200,
          body: { found: false, data: null, provider: 'audiencelab' },
        }
      }

      return {
        status: 200,
        body: {
          found: true,
          data: sanitizePerson(profile),
          provider: 'audiencelab',
        },
      }
    } catch (err) {
      safeError('[ext:lookup] AudienceLab enrich failed:', err)
      return {
        status: 502,
        body: { error: 'Enrichment provider error', provider: 'audiencelab' },
      }
    }
  }
)

// CORS preflight support for browser-based clients
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
