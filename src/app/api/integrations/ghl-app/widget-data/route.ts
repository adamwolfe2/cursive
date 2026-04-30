/**
 * GHL CustomJS widget — data endpoint.
 *
 * Called from inside the GHL CRM dashboard (the widget loads as injected
 * JavaScript and fetches this endpoint with the GHL location_id and a
 * workspace API key). Returns visitor counts + sync stats for the
 * matching install.
 *
 * Auth model:
 *   1. Widget reads GHL Custom Value `identity_pixel_id` (set at install)
 *   2. Widget calls this endpoint with ?pixel_id=<uuid>
 *   3. We look up app_installs by pixel_id, return scoped data
 *   4. No session cookie, no API key — pixel_id is a low-sensitivity
 *      identifier (already stored as GHL Custom Value, agency users see it).
 *      We DO NOT return tokens, lead PII, or sensitive workspace data here —
 *      only aggregate counts.
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const QuerySchema = z.object({
  pixel_id: z.string().uuid(),
})

// CORS — widget runs in GHL's domain, must be allowed
function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

export async function GET(req: NextRequest) {
  try {
    const { pixel_id } = QuerySchema.parse({
      pixel_id: req.nextUrl.searchParams.get('pixel_id'),
    })

    const admin = createAdminClient()

    // Look up install by pixel_id
    const { data: install } = await admin
      .from('app_installs')
      .select('id, workspace_id, external_name, pixel_deployment_status, sync_visitors_enabled, last_visitor_sync_at, visitor_sync_count')
      .eq('source', 'ghl')
      .eq('pixel_id', pixel_id)
      .maybeSingle()

    if (!install) {
      return NextResponse.json(
        { error: 'Install not found' },
        { status: 404, headers: corsHeaders() },
      )
    }

    // Fetch visitor counts (24h, 7d, 30d) — aggregate-only, no PII
    const now = Date.now()
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString()
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [twentyFour, seven, thirty, highIntent] = await Promise.all([
      admin
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', install.workspace_id)
        .gte('created_at', dayAgo),
      admin
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', install.workspace_id)
        .gte('created_at', weekAgo),
      admin
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', install.workspace_id)
        .gte('created_at', monthAgo),
      admin
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', install.workspace_id)
        .gte('created_at', weekAgo)
        .gte('intent_score_calculated', 80),
    ])

    return NextResponse.json(
      {
        location_name: install.external_name,
        pixel_status: install.pixel_deployment_status,
        sync_enabled: install.sync_visitors_enabled,
        last_sync_at: install.last_visitor_sync_at,
        synced_count: install.visitor_sync_count,
        visitors: {
          last_24h: twentyFour.count ?? 0,
          last_7d: seven.count ?? 0,
          last_30d: thirty.count ?? 0,
        },
        high_intent_7d: highIntent.count ?? 0,
        cursive_url: `${(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://leads.meetcursive.com').replace(/\/$/, '')}/dashboard`,
      },
      { headers: corsHeaders() },
    )
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load widget data' },
      { status: 400, headers: corsHeaders() },
    )
  }
}
