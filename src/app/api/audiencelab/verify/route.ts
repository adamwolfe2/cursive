/**
 * AudienceLab API Verification Endpoint
 *
 * Admin-only endpoint to test ALL AL REST API capabilities.
 * Tests: health, pixels, audiences, attributes, preview, enrich.
 *
 * GET /api/audiencelab/verify
 * GET /api/audiencelab/verify?enrich=test@example.com
 * GET /api/audiencelab/verify?preview=true&industry=HVAC&state=FL
 *
 * Auth: Requires authenticated admin user via Supabase session cookie.
 * Uses Edge runtime so it works on Vercel (Node.js routes hang).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  listPixels,
  listAudiences,
  enrich,
  healthCheck,
  getAudienceAttributes,
  previewAudience,
} from '@/lib/audiencelab/api-client'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  // Auth check — admin only (Edge-compatible cookie read)
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          const cookieHeader = request.headers.get('cookie') || ''
          return cookieHeader.split(';').map(c => {
            const [name, ...rest] = c.trim().split('=')
            return { name, value: rest.join('=') }
          }).filter(c => c.name)
        },
      },
    }
  )

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const { data: userData } = await adminClient
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
    const audiences = await listAudiences({ page_size: 5 })
    results.audiences = { total: audiences.total, page: audiences.page, data: audiences.data?.slice(0, 5) }
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
        note: 'Endpoint may not exist — check AL API docs',
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
      results.audience_preview = {
        count: preview.count,
        job_id: preview.job_id,
        sample_count: preview.result?.length || 0,
      }
    } catch (err) {
      results.audience_preview = {
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  }

  // Test 6: Enrich (optional, only if email param provided)
  if (enrichEmail) {
    try {
      const enrichResult = await enrich({ filter: { email: enrichEmail } })
      results.enrich = {
        found: enrichResult.found,
        result_count: enrichResult.result?.length || 0,
        sample_keys: enrichResult.result?.[0] ? Object.keys(enrichResult.result[0]).slice(0, 15) : [],
      }
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
