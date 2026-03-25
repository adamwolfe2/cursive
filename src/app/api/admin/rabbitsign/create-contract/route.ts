export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin'
import { createContractFromTemplate, buildContractFields } from '@/lib/integrations/rabbitsign'

const requestSchema = z.object({
  companyName: z.string().min(1),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  setupFee: z.number().min(0),
  monthlyFee: z.number().min(0),
  infraMonthly: z.number().min(0),
  packages: z.array(z.string()),
  billingCadence: z.string(),
  outboundTier: z.string().nullable(),
  startDate: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const templateId = process.env.RABBITSIGN_CONTRACT_TEMPLATE_ID
    if (!templateId) {
      return NextResponse.json(
        { error: 'RabbitSign template not configured. Set RABBITSIGN_CONTRACT_TEMPLATE_ID.' },
        { status: 503 }
      )
    }

    const body = await req.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { contactName, contactEmail, startDate, ...rest } = parsed.data

    const senderFieldValues = buildContractFields({
      ...rest,
      contactName,
      contactEmail,
      startDate: startDate || new Date().toISOString().split('T')[0],
    })

    const folder = await createContractFromTemplate({
      templateId,
      title: `Cursive AI SOW — ${rest.companyName}`,
      summary: `Scope of work and service agreement for ${rest.companyName}`,
      senderFieldValues,
      roles: [
        {
          roleName: 'Client',
          signerName: contactName,
          signerEmail: contactEmail,
        },
      ],
    })

    return NextResponse.json({ data: folder })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create contract'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
