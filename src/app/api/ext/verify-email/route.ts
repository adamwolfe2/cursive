export const maxDuration = 15

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateExtension, extAuthErrorResponse } from '@/lib/middleware/ext-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const requestSchema = z.object({
  email: z.string().email().max(320),
})

// Basic email validation checks (no external service needed)
function quickValidate(email: string): { valid: boolean; reason?: string } {
  // Format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, reason: 'Invalid format' }
  }

  // Disposable domain check
  const disposableDomains = [
    'tempmail.com', 'guerrillamail.com', 'mailinator.com', 'yopmail.com',
    'throwaway.email', 'temp-mail.org', 'dispostable.com', '10minutemail.com',
    'trashmail.com', 'fakeinbox.com',
  ]
  const domain = email.split('@')[1]?.toLowerCase()
  if (disposableDomains.includes(domain)) {
    return { valid: false, reason: 'Disposable email domain' }
  }

  // Role-based check
  const roleAddresses = ['info', 'support', 'admin', 'sales', 'hello', 'contact', 'noreply', 'no-reply', 'webmaster', 'postmaster']
  const local = email.split('@')[0]?.toLowerCase()
  if (roleAddresses.includes(local)) {
    return { valid: false, reason: 'Role-based email address' }
  }

  return { valid: true }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateExtension(req, 'ext:verify')

    const body = await req.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const { email } = parsed.data
    const supabase = createAdminClient()

    // Deduct 1 credit
    const { data: creditResult } = await supabase.rpc('atomic_deduct_credits', {
      p_user_id: auth.userId,
      p_amount: 1,
    })

    if (!creditResult) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    }

    // Quick validation
    const quickResult = quickValidate(email)
    if (!quickResult.valid) {
      return NextResponse.json({
        data: {
          email,
          status: 'invalid',
          confidence: 100,
          reason: quickResult.reason,
          checks: { format: false, disposable: quickResult.reason === 'Disposable email domain', role_based: quickResult.reason === 'Role-based email address' },
        },
        credits_used: 1,
      })
    }

    // Try MillionVerifier if available
    let verificationResult: { status: string; confidence: number } = { status: 'unknown', confidence: 50 }

    const mvApiKey = process.env.MILLIONVERIFIER_API_KEY
    if (mvApiKey) {
      try {
        const res = await fetch(
          `https://api.millionverifier.com/api/v3/?api=${mvApiKey}&email=${encodeURIComponent(email)}`,
          { signal: AbortSignal.timeout(8000) }
        )
        if (res.ok) {
          const data = await res.json()
          const statusMap: Record<string, string> = {
            ok: 'valid',
            catch_all: 'catch_all',
            disposable: 'invalid',
            invalid: 'invalid',
            unknown: 'unknown',
            error: 'unknown',
          }
          verificationResult = {
            status: statusMap[data.result] || statusMap[data.status] || 'unknown',
            confidence: data.result === 'ok' ? 95 : data.result === 'catch_all' ? 60 : data.result === 'invalid' ? 95 : 50,
          }
        }
      } catch {
        // MillionVerifier failed — return basic validation only
      }
    }

    return NextResponse.json({
      data: {
        email,
        status: verificationResult.status,
        confidence: verificationResult.confidence,
        checks: { format: true, disposable: false, role_based: false },
      },
      credits_used: 1,
    })
  } catch (error) {
    return extAuthErrorResponse(error)
  }
}
