// Referral Click Tracker
// Increments the referral_clicks counter for the workspace that owns the code,
// then redirects to /signup?ref=<code> so the link still works for sign-ups.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidReferralCode } from '@/lib/services/referral.service'
import { safeError } from '@/lib/utils/log-sanitizer'
import { checkRateLimit } from '@/lib/utils/rate-limit'

// In-memory rate limit: 5 clicks per IP per hour
const CLICK_RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 5 }

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const ref = searchParams.get('ref')

  // Always redirect — even on bad/missing codes — so the link never dead-ends
  const signupUrl = ref
    ? `/signup?ref=${encodeURIComponent(ref)}`
    : '/signup'

  // Validate code format before touching the DB
  if (!ref || !isValidReferralCode(ref)) {
    return NextResponse.redirect(new URL(signupUrl, request.url), { status: 302 })
  }

  // Rate-limit by IP: 5 clicks per hour
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  const rateLimitKey = `referral-click:${ip}:${ref}`

  const { allowed } = checkRateLimit(rateLimitKey, CLICK_RATE_LIMIT)
  if (!allowed) {
    // Still redirect — just don't count the click
    return NextResponse.redirect(new URL(signupUrl, request.url), { status: 302 })
  }

  try {
    const supabase = createAdminClient()

    // Increment click counter on the matching workspace
    const { error } = await supabase.rpc('increment_referral_clicks', {
      p_referral_code: ref,
    })

    if (error) {
      // Fallback: try a direct update if RPC doesn't exist yet
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id, referral_clicks')
        .eq('referral_code', ref)
        .maybeSingle()

      if (workspace) {
        await supabase
          .from('workspaces')
          .update({ referral_clicks: (workspace.referral_clicks ?? 0) + 1 })
          .eq('id', workspace.id)
      }
    }
  } catch (err) {
    // Non-fatal — still redirect
    safeError('[ReferralTrack] Failed to increment click counter:', err)
  }

  return NextResponse.redirect(new URL(signupUrl, request.url), { status: 302 })
}
