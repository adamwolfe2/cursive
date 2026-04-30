// API: Regenerate Email Copy for Onboarding Client
// Accepts AUTOMATION_SECRET header OR valid admin auth.
// Fires the Inngest event to regenerate email sequences with optional feedback.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { inngest } from '@/inngest/client'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const bodySchema = z.object({
  client_id: z.string().uuid('client_id must be a valid UUID'),
  feedback: z.string().optional(),
})

async function isAuthorized(request: NextRequest): Promise<boolean> {
  // Check automation secret first
  const secret = request.headers.get('x-automation-secret')
  const expectedSecret = process.env.AUTOMATION_SECRET
  if (expectedSecret && secret === expectedSecret) {
    return true
  }

  // Fall back to admin auth
  try {
    const { requireAdmin } = await import('@/lib/auth/admin')
    await requireAdmin()
    return true
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request)
    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { client_id, feedback } = parsed.data

    await inngest.send({
      name: 'onboarding/regenerate-copy' as const,
      data: { client_id, feedback },
    })

    safeLog(`[Automation Regenerate Copy] Copy regeneration triggered for client ${client_id}`)

    return NextResponse.json({ triggered: true, client_id })
  } catch (error: unknown) {
    safeError('[Automation Regenerate Copy] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
