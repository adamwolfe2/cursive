export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin'
import { createDealInvoice } from '@/lib/integrations/mercury'

const requestSchema = z.object({
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  lineItems: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    })
  ).min(1),
  daysUntilDue: z.number().int().min(1).max(90).optional(),
  memo: z.string().optional(),
  sendEmail: z.boolean().default(true),
  clientId: z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const body = await req.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { customerEmail, customerName, lineItems, daysUntilDue, memo, sendEmail, clientId } = parsed.data

    const invoice = await createDealInvoice({
      customerEmail,
      customerName,
      lineItems,
      daysUntilDue,
      memo,
      sendEmail,
      metadata: clientId ? { onboarding_client_id: clientId } : undefined,
    })

    return NextResponse.json({ data: invoice })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create invoice'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
