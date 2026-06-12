/**
 * POST /api/affiliate/sign-agreement
 * Records the partner's in-portal e-signature for the current agreement version.
 * Stores the drawn signature, the hash of the exact text signed, IP, and UA, and
 * flips the affiliate's agreement_accepted_at so commissions become payable.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAffiliateForUser } from '@/lib/affiliate/portal'
import { AGREEMENT_VERSION, agreementPlainText } from '@/lib/affiliate/agreement'
import { safeError } from '@/lib/utils/log-sanitizer'

const bodySchema = z.object({
  signerName: z.string().min(2).max(120),
  // Strictly a PNG raster data URL (the canvas exports image/png). Rejecting any
  // other scheme — esp. data:image/svg+xml or data:text/html — closes the stored
  // content-injection / XSS vector, since this value is later rendered as an
  // <img src> and offered as a download href.
  signatureSvg: z
    .string()
    .max(500_000)
    .regex(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/, 'Signature must be a PNG image'),
  agreed: z.literal(true),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid signature submission' }, { status: 400 })
    }

    const affiliate = await getAffiliateForUser(authUser.id, authUser.email, !!authUser.email_confirmed_at)
    if (!affiliate) return NextResponse.json({ error: 'Partner account not found' }, { status: 404 })

    const admin = createAdminClient()

    // Lightweight per-user rate limit (signing is a one-time action; block floods).
    const windowStart = new Date(Date.now() - 60_000).toISOString()
    const { count } = await admin
      .from('rate_limit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('key', `sign-agreement:${authUser.id}`)
      .gte('created_at', windowStart)
    if ((count ?? 0) >= 5) {
      return NextResponse.json({ error: 'Too many attempts. Try again shortly.' }, { status: 429 })
    }
    void admin.from('rate_limit_logs').insert({
      key: `sign-agreement:${authUser.id}`,
      limit_type: 'sign-agreement',
      identifier: authUser.id,
    })

    const documentHash = createHash('sha256').update(agreementPlainText()).digest('hex')
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent')?.slice(0, 500) || 'unknown'

    // Idempotent on (affiliate_id, version) — re-signing same version is a no-op insert.
    const { error: insertError } = await admin.from('affiliate_agreements').insert({
      affiliate_id: affiliate.id,
      version: AGREEMENT_VERSION,
      signer_name: parsed.data.signerName.trim(),
      signer_email: affiliate.email,
      signature_svg: parsed.data.signatureSvg,
      document_hash: documentHash,
      signed_ip: ip,
      user_agent: userAgent,
    })

    // Unique-violation = already signed this version; treat as success.
    if (insertError && insertError.code !== '23505') {
      throw new Error(insertError.message)
    }

    await admin
      .from('affiliates')
      .update({
        agreement_accepted_at: new Date().toISOString(),
        agreement_version: AGREEMENT_VERSION,
        user_id: authUser.id,
      })
      .eq('id', affiliate.id)

    return NextResponse.json({ success: true, version: AGREEMENT_VERSION })
  } catch (error) {
    safeError('[affiliate/sign-agreement] Error:', error)
    return NextResponse.json({ error: 'Failed to record signature' }, { status: 500 })
  }
}
