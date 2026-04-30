// API: Approve or Request Edits on Onboarding Email Copy
// Admin auth OR automation secret required.
// Updates copy_approval_status and logs the action.
// Includes race condition protection: rejects if copy is still processing.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { OnboardingClientRepository } from '@/lib/repositories/onboarding-client.repository'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

const bodySchema = z.object({
  client_id: z.string().uuid('client_id must be a valid UUID'),
  action: z.enum(['approve', 'needs_edits']),
})

async function isAuthorized(request: NextRequest): Promise<{ authorized: boolean; adminEmail?: string }> {
  // Check automation secret first
  const secret = request.headers.get('x-automation-secret')
  const expectedSecret = process.env.AUTOMATION_SECRET
  if (expectedSecret && secret === expectedSecret) {
    return { authorized: true, adminEmail: 'automation' }
  }

  // Fall back to admin auth
  try {
    const { requireAdmin } = await import('@/lib/auth/admin')
    const admin = await requireAdmin()
    return { authorized: true, adminEmail: admin.email }
  } catch {
    return { authorized: false }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, adminEmail } = await isAuthorized(request)
    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
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

    const { client_id, action } = parsed.data
    const repo = new OnboardingClientRepository()

    // Verify client exists
    const client = await repo.findById(client_id)
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Race condition protection: reject if copy is still being generated
    const copyGenStatus = (client as any).copy_generation_status
    if (copyGenStatus === 'processing' || copyGenStatus === 'regenerating') {
      return NextResponse.json(
        { error: `Cannot ${action} copy while generation is in progress (status: ${copyGenStatus}). Please wait for generation to complete.` },
        { status: 409 }
      )
    }

    const newStatus = action === 'approve' ? 'approved' : 'needs_edits'

    await repo.update(client_id, {
      copy_approval_status: newStatus,
    })

    await repo.appendAutomationLog(client_id, {
      step: `copy_${action}`,
      status: 'complete',
      timestamp: new Date().toISOString(),
    })

    safeLog(
      `[Automation Approve Copy] Copy ${action} by ${adminEmail} for client ${client_id}`
    )

    return NextResponse.json({
      success: true,
      client_id,
      copy_approval_status: newStatus,
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    safeError('[Automation Approve Copy] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
