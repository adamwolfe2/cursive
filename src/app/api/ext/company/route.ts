/**
 * POST /api/ext/company — company firmographics endpoint.
 *
 * Clay-compatible company enrichment by domain. Workspace API key with
 * scope `ext:company` required via `Authorization: Bearer <key>` header.
 *
 * Rate limit: 30/min per workspace (lead-enrich tier).
 * Daily cap: 500 billable calls per workspace per rolling 24h.
 * Cost trail: one api_usage_log row per request.
 *
 * Request body:
 *   { domain: string }  // e.g. "nvidia.com" — accepts URLs, strips protocol
 *
 * Response:
 *   { found: boolean, data: { company_name, company_domain, company_industry, ... } | null }
 */

import { NextRequest, NextResponse } from 'next/server'
import { withExtGuard, getParsedBody } from '@/lib/middleware/ext-api-guard'
import { enrich, type ALEnrichedProfile } from '@/lib/audiencelab/api-client'
import { safeError } from '@/lib/utils/log-sanitizer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface CompanyBody {
  domain?: string
}

function normalizeDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '')
}

function isValidDomain(d: string): boolean {
  return /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(d)
}

function sanitizeCompany(p: ALEnrichedProfile): Record<string, unknown> {
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

function hasCompanyData(p: ALEnrichedProfile): boolean {
  return Boolean(p.COMPANY_NAME || p.COMPANY_DOMAIN || p.COMPANY_INDUSTRY)
}

export const POST = withExtGuard(
  { requiredScope: 'ext:company', endpointLabel: 'ext:company', rateLimitTier: 'lead-enrich' },
  async (req: NextRequest) => {
    const body = getParsedBody<CompanyBody>(req)

    if (!body.domain || typeof body.domain !== 'string') {
      return {
        status: 400,
        body: { error: 'Field `domain` is required.' },
      }
    }

    const domain = normalizeDomain(body.domain)
    if (!isValidDomain(domain)) {
      return {
        status: 400,
        body: { error: `"${body.domain}" is not a valid domain. Expected e.g. "nvidia.com".` },
      }
    }

    try {
      const response = await enrich({ filter: { company_domain: domain } })
      const profile = response.result?.[0]

      if (!profile || !hasCompanyData(profile)) {
        return {
          status: 200,
          body: { found: false, data: null, provider: 'audiencelab' },
        }
      }

      return {
        status: 200,
        body: {
          found: true,
          data: sanitizeCompany(profile),
          provider: 'audiencelab',
        },
      }
    } catch (err) {
      safeError('[ext:company] AudienceLab enrich failed:', err)
      return {
        status: 502,
        body: { error: 'Enrichment provider error', provider: 'audiencelab' },
      }
    }
  }
)

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
