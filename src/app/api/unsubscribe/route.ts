/**
 * Unsubscribe endpoint for visitor-estimate nurture emails (CAN-SPAM).
 * GET (one-click link from email) and POST both supported.
 * Sets unsubscribed_at on the lead; idempotent and safe to call repeatedly.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'
import { inngest } from '@/inngest/client'

const emailSchema = z.string().email()

/** Escape a user-derived value before reflecting it into HTML. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function confirmationPage(email: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Unsubscribed · Cursive</title>
<style>
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0f0d;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh}
  .card{max-width:440px;text-align:center;padding:40px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:16px}
  h1{font-size:22px;margin:0 0 12px}p{color:rgba(255,255,255,.6);line-height:1.6;margin:0}
  a{color:#34d399;text-decoration:none}
</style></head>
<body><div class="card">
  <h1>You're unsubscribed</h1>
  <p>${escapeHtml(email)} won't receive any more emails from the Cursive visitor estimate. Changed your mind? <a href="https://leads.meetcursive.com/visitor-estimate">Run a new estimate</a>.</p>
</div></body></html>`
}

async function suppress(email: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('visitor_estimate_leads')
    .update({ unsubscribed_at: new Date().toISOString(), nurture_status: 'unsubscribed' })
    .eq('email', email)
  if (error) throw error

  // Cancel any in-flight nurture drip immediately (matches cancelOn in the Inngest fn).
  inngest
    .send({ name: 'visitor-estimate/unsubscribed', data: { email } })
    .catch((err) => safeError('[Unsubscribe] cancel event failed:', err))
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('email') ?? ''
  const parsed = emailSchema.safeParse(raw.toLowerCase().trim())
  if (!parsed.success) {
    return new NextResponse('Invalid unsubscribe link.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
  try {
    await suppress(parsed.data)
  } catch (err) {
    safeError('[Unsubscribe] Failed:', err)
    // Still show success — never reveal internal state, and the link must feel reliable.
  }
  return new NextResponse(confirmationPage(parsed.data), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = emailSchema.safeParse(String(body?.email ?? '').toLowerCase().trim())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    await suppress(parsed.data)
    return NextResponse.json({ success: true })
  } catch (err) {
    safeError('[Unsubscribe] Failed:', err)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
