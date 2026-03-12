/**
 * POST /api/affiliate/track-click
 * Public click tracking — called fire-and-forget from middleware
 */

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHash } from 'crypto'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { partnerCode, referer } = body as { partnerCode?: string; referer?: string }

    if (!partnerCode || typeof partnerCode !== 'string') {
      return NextResponse.json({ success: true }) // silent
    }

    const code = partnerCode.toUpperCase().trim()
    if (!/^[A-Z0-9]{8}$/.test(code)) {
      return NextResponse.json({ success: true }) // silent — invalid format
    }

    const admin = createAdminClient()

    // Look up affiliate by partner code
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id')
      .eq('partner_code', code)
      .eq('status', 'active')
      .maybeSingle()

    if (!affiliate) {
      return NextResponse.json({ success: true }) // silent — not found or inactive
    }

    // Hash IP — never store raw IPs
    const rawIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip')?.trim() ||
      'unknown'
    const ipHash = createHash('sha256').update(rawIp).digest('hex')

    // Insert click record
    await admin.from('affiliate_clicks').insert({
      affiliate_id: affiliate.id,
      ip_hash: ipHash,
      user_agent: request.headers.get('user-agent') || null,
      referer: referer || null,
    })

    return NextResponse.json({ success: true })
  } catch {
    // Never error — this is fire-and-forget
    return NextResponse.json({ success: true })
  }
}
