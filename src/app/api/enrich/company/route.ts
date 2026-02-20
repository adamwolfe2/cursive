/**
 * Company Enrichment API
 * POST /api/enrich/company - Enrich company data from domain/website
 * GET /api/enrich/company?domain=example.com - Quick logo/basic info lookup
 */


import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { getCompanyEnrichmentService } from '@/lib/services/company-enrichment.service'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { safeError } from '@/lib/utils/log-sanitizer'
import { z } from 'zod'

// Domain validation schema
const domainSchema = z.string().min(1).max(255).regex(
  /^[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z0-9][a-zA-Z0-9-]*)*\.[a-zA-Z]{2,}$/,
  'Invalid domain format'
)

const enrichRequestSchema = z.object({
  domain: z.string().max(255).optional(),
  website: z.string().max(500).optional(),
  saveToWorkspace: z.boolean().default(false),
}).refine(data => data.domain || data.website, {
  message: 'Domain or website URL is required',
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validationResult = enrichRequestSchema.safeParse(body)

    if (!validationResult.success) {
      if (validationResult.error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request', details: validationResult.error.errors },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { domain, website, saveToWorkspace } = validationResult.data

    // Accept either domain or website URL (refine guarantees at least one exists)
    const targetDomain = (domain || website) as string

    const enrichmentService = getCompanyEnrichmentService()

    let result
    if (saveToWorkspace) {
      // Enrich and save to workspace
      result = await enrichmentService.enrichWorkspace(
        user.workspace_id,
        targetDomain,
        {
          useClearbit: true,
          useFirecrawl: true,
          useLogoApi: true,
          fetchLogo: true,
          fetchCompanyData: true,
          useCache: true,
        }
      )
    } else {
      // Just enrich without saving
      result = await enrichmentService.enrichFromDomain(targetDomain, {
        useClearbit: true,
        useFirecrawl: true,
        useLogoApi: true,
        fetchLogo: true,
        fetchCompanyData: true,
        useCache: true,
      })
    }

    return NextResponse.json({
      success: result.success,
      source: result.source,
      data: result.data,
      enrichedAt: result.enrichedAt,
    })
  } catch (error: any) {
    safeError('[Company Enrichment POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to enrich company' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting for public endpoint
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    const enrichRateConfig = { windowMs: 60 * 1000, max: 30 }
    const rateLimitResult = checkRateLimit(`enrich-company:${clientIp}`, enrichRateConfig)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
            'X-RateLimit-Limit': String(enrichRateConfig.max),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          },
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const rawDomain = searchParams.get('domain')

    if (!rawDomain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      )
    }

    // Validate domain format
    const domainResult = domainSchema.safeParse(rawDomain)
    if (!domainResult.success) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      )
    }
    const domain = domainResult.data

    const enrichmentService = getCompanyEnrichmentService()

    // Quick lookup - just logo and basic info
    const result = await enrichmentService.enrichFromDomain(domain, {
      useClearbit: true,
      useFirecrawl: false, // Skip scraping for quick lookup
      useTavily: false,
      useLogoApi: true,
      fetchLogo: true,
      fetchCompanyData: true,
      useCache: true,
      cacheTtlMinutes: 60 * 24 * 7, // Cache for 7 days
    })

    return NextResponse.json({
      success: result.success,
      data: {
        name: result.data.name,
        domain: result.data.domain,
        logoUrl: result.data.logoUrl,
        faviconUrl: result.data.faviconUrl,
        industry: result.data.industry,
        employeeRange: result.data.employeeRange,
        description: result.data.description?.substring(0, 200),
      },
    })
  } catch (error: any) {
    safeError('[Company Enrichment GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to lookup company' },
      { status: 500 }
    )
  }
}
