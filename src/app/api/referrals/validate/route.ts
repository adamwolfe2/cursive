// Referral Code Validation API
// Validate a referral code and return referrer info

import { NextRequest, NextResponse } from 'next/server'
import { lookupReferralCode } from '@/lib/services/referral.service'
import { safeError } from '@/lib/utils/log-sanitizer'

// Simple in-memory rate limiter: max 10 code checks per IP per minute
const rlMap = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  let entry = rlMap.get(ip)
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + 60_000 }
  }
  entry.count++
  rlMap.set(ip, entry)
  return entry.count <= 10
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const code = request.nextUrl.searchParams.get('code')

    if (!code || code.length > 64) {
      return NextResponse.json({ error: 'Code required' }, { status: 400 })
    }

    const result = await lookupReferralCode(code)

    if (!result || !result.valid) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid referral code',
      })
    }

    return NextResponse.json({
      valid: true,
      referrerType: result.referrerType,
      referrerName: result.referrerName,
    })
  } catch (error) {
    safeError('Failed to validate referral code:', error)
    return NextResponse.json(
      { error: 'Failed to validate code' },
      { status: 500 }
    )
  }
}
