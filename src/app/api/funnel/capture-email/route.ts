/**
 * POST /api/funnel/capture-email
 *
 * Captures a visitor's email when they click "Show me pricing now" on the VSL
 * gate. Stored in funnel_email_captures so the founder re-engagement cron can
 * email anyone who entered their email but didn't buy. Idempotent per email.
 */
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError, safeLog } from '@/lib/utils/log-sanitizer'
import { handleApiError } from '@/lib/utils/api-error-handler'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  source: z.string().trim().max(40).optional(),
  utm_source: z.string().trim().max(120).optional(),
  utm_medium: z.string().trim().max(120).optional(),
  utm_campaign: z.string().trim().max(120).optional(),
})

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid email' },
        { status: 400, headers: corsHeaders }
      )
    }
    const { email, source, utm_source, utm_medium, utm_campaign } = parsed.data

    const supabase = createAdminClient()
    // Upsert: refresh captured_at on a repeat view; never clobber converted_at.
    const { error } = await supabase
      .from('funnel_email_captures')
      .upsert(
        {
          email,
          source: source || 'pricing_gate',
          utm_source: utm_source ?? null,
          utm_medium: utm_medium ?? null,
          utm_campaign: utm_campaign ?? null,
          captured_at: new Date().toISOString(),
        },
        { onConflict: 'email', ignoreDuplicates: false }
      )

    if (error) {
      safeError('[funnel/capture-email] upsert failed:', error)
      // Never block the pricing reveal on a capture failure.
      return NextResponse.json({ success: true }, { headers: corsHeaders })
    }

    safeLog('[funnel/capture-email] captured', { source: source || 'pricing_gate' })
    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (err) {
    return handleApiError(err)
  }
}
