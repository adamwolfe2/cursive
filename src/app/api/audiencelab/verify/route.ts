/**
 * AudienceLab API Verification Endpoint
 *
 * Admin-only endpoint to test ALL AL REST API capabilities.
 * Tests: health, pixels, audiences, attributes, preview, enrich.
 *
 * GET /api/audiencelab/verify
 * GET /api/audiencelab/verify?enrich=test@example.com
 * GET /api/audiencelab/verify?preview=true&industry=HVAC&state=FL
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  listPixels,
  listAudiences,
  enrich,
  healthCheck,
  getAudienceAttributes,
  previewAudience,
} from '@/lib/audiencelab/api-client'

export async function GET(request: NextRequest) {
  // Auth check — admin only
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  if (!userData || userData.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const results: Record<string, unknown> = {}
  const searchParams = request.nextUrl.searchParams
  const enrichEmail = searchParams.get('enrich')
  const doPreview = searchParams.get('preview') === 'true'
  const previewIndustry = searchParams.get('industry')
  const previewState = searchParams.get('state')

  // Test 1: Health check (calls listPixels)
  try {
    results.health = await healthCheck()
  } catch (err) {
    results.health = { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }

  // Test 2: List pixels
  try {
    const pixels = await listPixels()
    results.pixels = { count: pixels.length, data: pixels }
  } catch (err) {
    results.pixels = { error: err instanceof Error ? err.message : 'Unknown error' }
  }

  // Test 3: List audiences
  try {
    const audiences = await listAudiences({ limit: 5 })
    results.audiences = audiences
  } catch (err) {
    results.audiences = { error: err instanceof Error ? err.message : 'Unknown error' }
  }

  // Test 4: Discover audience attributes (segments, industries)
  const attributeTests = ['segments', 'industries', 'sic'] as const
  for (const attr of attributeTests) {
    try {
      const values = await getAudienceAttributes(attr)
      results[`attributes_${attr}`] = {
        count: values.length,
        sample: values.slice(0, 5),
      }
    } catch (err) {
      results[`attributes_${attr}`] = {
        error: err instanceof Error ? err.message : 'Unknown error',
        note: 'Endpoint may not exist — this is expected if AL API does not support attribute discovery',
      }
    }
  }

  // Test 5: Preview audience (optional, triggered by ?preview=true)
  if (doPreview) {
    try {
      const filters: Record<string, unknown> = {}
      if (previewIndustry) filters.industries = [previewIndustry]
      if (previewState) filters.state = [previewState]

      const preview = await previewAudience({ filters })
      results.audience_preview = preview
    } catch (err) {
      results.audience_preview = {
        error: err instanceof Error ? err.message : 'Unknown error',
        note: 'Endpoint may not exist — this is expected if AL API does not support audience preview',
      }
    }
  }

  // Test 6: Enrich (optional, only if email param provided)
  if (enrichEmail) {
    try {
      const enrichResult = await enrich({ filter: { email: enrichEmail } })
      results.enrich = enrichResult
    } catch (err) {
      results.enrich = { error: err instanceof Error ? err.message : 'Unknown error' }
    }
  }

  return NextResponse.json({
    api_key_configured: !!process.env.AUDIENCELAB_ACCOUNT_API_KEY,
    timestamp: new Date().toISOString(),
    endpoints_tested: [
      'GET /pixels (health + list)',
      'GET /audiences',
      ...attributeTests.map(a => `GET /audiences/attributes/${a}`),
      ...(doPreview ? ['POST /audiences/preview'] : []),
      ...(enrichEmail ? ['POST /enrich'] : []),
    ],
    usage: '?enrich=test@example.com to test enrichment, ?preview=true&industry=HVAC&state=FL to test audience preview',
    results,
  })
}
