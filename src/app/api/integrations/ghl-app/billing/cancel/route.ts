/**
 * GHL marketplace — billing cancel hook.
 *
 * Hit when the agency closes the Stripe Checkout window without completing
 * payment. We clear the install context cookie and redirect to a
 * user-friendly cancel page.
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://leads.meetcursive.com').replace(/\/$/, '')

  const response = NextResponse.redirect(`${baseUrl}/?ghl_billing=cancelled`)
  response.cookies.set('ghl_billing_context', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
