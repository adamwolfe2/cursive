import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateExtension, extAuthErrorResponse } from '@/lib/middleware/ext-auth'

const requestSchema = z.object({
  email: z.string().email().max(320),
})

// Basic email validation checks — free for extension users, no credits consumed
function quickValidate(email: string): {
  status: 'valid' | 'invalid'
  confidence: number
  reason?: string
  checks: { format: boolean; disposable: boolean; role_based: boolean }
} {
  // Format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: 'invalid', confidence: 100, reason: 'Invalid format', checks: { format: false, disposable: false, role_based: false } }
  }

  // Disposable domain check
  const disposableDomains = [
    'tempmail.com', 'guerrillamail.com', 'mailinator.com', 'yopmail.com',
    'throwaway.email', 'temp-mail.org', 'dispostable.com', '10minutemail.com',
    'trashmail.com', 'fakeinbox.com',
  ]
  const domain = email.split('@')[1]?.toLowerCase()
  if (disposableDomains.includes(domain)) {
    return { status: 'invalid', confidence: 100, reason: 'Disposable email domain', checks: { format: true, disposable: true, role_based: false } }
  }

  // Role-based check
  const roleAddresses = ['info', 'support', 'admin', 'sales', 'hello', 'contact', 'noreply', 'no-reply', 'webmaster', 'postmaster']
  const local = email.split('@')[0]?.toLowerCase()
  if (roleAddresses.includes(local)) {
    return { status: 'invalid', confidence: 90, reason: 'Role-based email address', checks: { format: true, disposable: false, role_based: true } }
  }

  return { status: 'valid', confidence: 70, checks: { format: true, disposable: false, role_based: false } }
}

export async function POST(req: NextRequest) {
  try {
    await authenticateExtension(req, 'ext:verify')

    const body = await req.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const { email } = parsed.data

    // Free basic validation — no credits consumed, no external API calls.
    // Deep verification is handled internally by AudienceLab on the platform side.
    const result = quickValidate(email)

    return NextResponse.json({
      data: {
        email,
        status: result.status,
        confidence: result.confidence,
        reason: result.reason,
        checks: result.checks,
      },
      credits_used: 0,
    })
  } catch (error) {
    return extAuthErrorResponse(error)
  }
}
