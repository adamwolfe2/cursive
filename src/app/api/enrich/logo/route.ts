/**
 * Logo Fetch API
 * GET /api/enrich/logo?domain=example.com - Quick logo lookup
 *
 * Returns logo URL for a domain. Used for real-time logo preview
 * during onboarding when user enters their website.
 */


import { NextRequest, NextResponse } from 'next/server'
import { getCompanyEnrichmentService } from '@/lib/services/company-enrichment.service'
import { safeError } from '@/lib/utils/log-sanitizer'
import { withRateLimit } from '@/lib/middleware/rate-limiter'

export async function GET(request: NextRequest) {
  try {
    const rateLimited = await withRateLimit(request, 'public-form')
    if (rateLimited) return rateLimited

    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      )
    }

    const enrichmentService = getCompanyEnrichmentService()
    const logoUrl = await enrichmentService.fetchLogo(domain)

    return NextResponse.json({
      success: !!logoUrl,
      logoUrl,
      domain,
    })
  } catch (error: unknown) {
    safeError('[Logo Fetch] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logo' },
      { status: 500 }
    )
  }
}
