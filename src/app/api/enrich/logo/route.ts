/**
 * Logo Fetch API
 * GET /api/enrich/logo?domain=example.com - Quick logo lookup
 *
 * Returns logo URL for a domain. Used for real-time logo preview
 * during onboarding when user enters their website.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCompanyEnrichmentService } from '@/lib/services/company-enrichment.service'

export async function GET(request: NextRequest) {
  try {
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
  } catch (error: any) {
    console.error('Logo fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch logo' },
      { status: 500 }
    )
  }
}
