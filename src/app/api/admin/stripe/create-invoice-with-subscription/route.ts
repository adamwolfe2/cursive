export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin'
import { createDealInvoiceWithSubscription } from '@/lib/integrations/stripe-invoice'

const lineItemSchema = z.object({
  name: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
})

const subscriptionItemSchema = z.object({
  name: z.string(),
  amount: z.number().positive(),
})

const requestSchema = z.object({
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  invoiceLineItems: z.array(lineItemSchema).min(1),
  daysUntilDue: z.number().int().min(1).max(90).default(14),
  memo: z.string().optional(),
  subscriptionItems: z.array(subscriptionItemSchema).min(1),
  billingCadence: z.enum(['monthly', 'quarterly', 'annual']).default('monthly'),
  trialDays: z.number().int().min(1).max(365),
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

    const {
      customerEmail, customerName, invoiceLineItems, daysUntilDue,
      memo, subscriptionItems, billingCadence, trialDays, clientId,
    } = parsed.data

    const result = await createDealInvoiceWithSubscription({
      customerEmail,
      customerName,
      invoiceLineItems,
      daysUntilDue,
      memo,
      subscriptionItems,
      billingCadence,
      trialDays,
      metadata: clientId ? { onboarding_client_id: clientId } : undefined,
    })

    return NextResponse.json({ data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create invoice + subscription'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
