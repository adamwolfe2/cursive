export const maxDuration = 10

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/server'

const requestSchema = z.object({
  clientId: z.string().uuid(),
  stripe_invoice_id: z.string().nullable().optional(),
  stripe_invoice_url: z.string().nullable().optional(),
  stripe_invoice_status: z.string().nullable().optional(),
  rabbitsign_folder_id: z.string().nullable().optional(),
  rabbitsign_status: z.string().nullable().optional(),
  sow_signed: z.boolean().optional(),
  payment_confirmed: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const body = await req.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { clientId, ...updates } = parsed.data

    // Remove undefined keys
    const cleanUpdates: Record<string, string | boolean | null> = {}
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value ?? null
      }
    }

    if (Object.keys(cleanUpdates).length === 0) {
      return NextResponse.json({ data: { updated: false } })
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('onboarding_clients')
      .update(cleanUpdates)
      .eq('id', clientId)

    if (error) {
      return NextResponse.json({ error: 'Failed to update tracking' }, { status: 500 })
    }

    return NextResponse.json({ data: { updated: true } })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
