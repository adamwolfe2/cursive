/**
 * POST /api/start/open (form: t, c) -> 303 to /auth/confirm, which verifies the single-use sign-in
 * code and lands on /start/leads?c=. Only a real click on /start/open reaches this (link scanners
 * GET; they do not POST), so scanners cannot spend the code. Public; grants nothing by itself.
 */
export const runtime = 'nodejs'

import { NextResponse, type NextRequest } from 'next/server'
import { APP_URL } from '@/lib/config/urls'
import { safeWarn } from '@/lib/utils/log-sanitizer'

const TOKEN = /^[A-Za-z0-9_-]{8,200}$/

export async function POST(req: NextRequest) {
  let form: FormData
  try {
    form = await req.formData()
  } catch (err) {
    safeWarn('[start/open] unreadable form', String(err))
    return NextResponse.redirect(new URL('/start', APP_URL), 303)
  }
  const t = String(form.get('t') ?? '')
  const c = String(form.get('c') ?? '')
  if (!TOKEN.test(t) || !TOKEN.test(c)) return NextResponse.redirect(new URL('/start', APP_URL), 303)
  const next = `/start/leads?c=${encodeURIComponent(c)}`
  const confirm = new URL('/auth/confirm', APP_URL)
  confirm.searchParams.set('token_hash', t)
  confirm.searchParams.set('next', next)
  return NextResponse.redirect(confirm, 303)
}
