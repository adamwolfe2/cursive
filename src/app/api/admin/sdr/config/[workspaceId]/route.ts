export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin'
import { SdrConfigRepository } from '@/lib/repositories/sdr-config.repository'
import { safeError } from '@/lib/utils/log-sanitizer'

const configSchema = z.object({
  objective: z.string().optional(),
  language: z.string().optional(),
  do_not_contact_enabled: z.boolean().optional(),
  human_in_the_loop: z.boolean().optional(),
  trigger_phrases: z.array(z.string()).optional(),
  warmup_exclusion_keywords: z.array(z.string()).optional(),
  follow_up_enabled: z.boolean().optional(),
  follow_up_count: z.number().int().min(1).max(5).optional(),
  follow_up_interval_days: z.number().int().min(1).optional(),
  reply_to_no_thanks: z.boolean().optional(),
  no_thanks_template: z.string().nullable().optional(),
  enable_signature: z.boolean().optional(),
  auto_bcc_address: z.string().nullable().optional(),
  notification_email: z.string().email().nullable().optional(),
  cal_booking_url: z.string().nullable().optional(),
  timezone: z.string().optional(),
  availability_start: z.string().optional(),
  availability_end: z.string().optional(),
  exclude_weekends: z.boolean().optional(),
  exclude_holidays: z.boolean().optional(),
  agent_first_name: z.string().nullable().optional(),
  agent_last_name: z.string().nullable().optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await requireAdmin()
    const { workspaceId } = await params
    const repo = new SdrConfigRepository()
    const config = await repo.findByWorkspace(workspaceId)
    return NextResponse.json({ config })
  } catch (error) {
    safeError('[SDR Config GET]', error)
    const isAuthError = error instanceof Error && error.message.includes('Unauthorized')
    return NextResponse.json(
      { error: isAuthError ? 'Unauthorized' : 'Internal server error' },
      { status: isAuthError ? 401 : 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await requireAdmin()
    const { workspaceId } = await params
    const body = await req.json()
    const parsed = configSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }
    const repo = new SdrConfigRepository()
    const config = await repo.upsert(workspaceId, parsed.data)
    return NextResponse.json({ config })
  } catch (error) {
    safeError('[SDR Config PUT]', error)
    const isAuthError = error instanceof Error && error.message.includes('Unauthorized')
    return NextResponse.json(
      { error: isAuthError ? 'Unauthorized' : 'Internal server error' },
      { status: isAuthError ? 401 : 500 }
    )
  }
}
