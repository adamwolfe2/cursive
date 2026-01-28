// Referral Code Validation API
// Validate a referral code and return referrer info

import { NextRequest, NextResponse } from 'next/server'
import { lookupReferralCode } from '@/lib/services/referral.service'

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code')

    if (!code) {
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
    console.error('Failed to validate referral code:', error)
    return NextResponse.json(
      { error: 'Failed to validate code' },
      { status: 500 }
    )
  }
}
