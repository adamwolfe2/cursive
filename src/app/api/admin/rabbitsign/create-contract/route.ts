export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin, getCurrentAdminEmail } from '@/lib/auth/admin'
import { createContractFromTemplate, buildContractFields } from '@/lib/integrations/rabbitsign'
import { OUTBOUND_TIERS } from '@/app/admin/deal-calculator/pricing-config'

const requestSchema = z.object({
  templateId: z.string().optional(),
  companyName: z.string().min(1),
  contactName: z.string().min(1),
  contactEmail: z.string().email(),
  setupFee: z.number().min(0),
  monthlyFee: z.number().min(0),
  infraMonthly: z.number().min(0),
  domainAnnualCost: z.number().min(0).optional(),
  inboxMonthlyCost: z.number().min(0).optional(),
  domains: z.number().int().min(0).optional(),
  inboxes: z.number().int().min(0).optional(),
  packages: z.array(z.string()),
  billingCadence: z.string(),
  outboundTier: z.string().nullable(),
  initialTerm: z.string().optional(),
  startDate: z.string().optional(),
  notes: z.string().optional(),
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

    const templateId = (parsed.data.templateId || process.env.RABBITSIGN_CONTRACT_TEMPLATE_ID || '').trim()
    if (!templateId) {
      return NextResponse.json(
        { error: 'No contract template ID. Enter one in the form or set RABBITSIGN_CONTRACT_TEMPLATE_ID.' },
        { status: 503 }
      )
    }

    const { contactName, contactEmail, startDate, templateId: _t, ...rest } = parsed.data

    // Resolve tier details for volume + name
    const tierConfig = OUTBOUND_TIERS.find((t) => t.id === rest.outboundTier)

    const senderFieldValues = buildContractFields({
      ...rest,
      contactName,
      contactEmail,
      startDate: startDate || new Date().toISOString().split('T')[0],
      outboundTierName: tierConfig?.name,
      emailsPerMonth: tierConfig?.emailsPerMonth,
      domains: rest.domains ?? tierConfig?.domains,
      inboxes: rest.inboxes ?? tierConfig?.inboxes,
    })

    // Company-side signer (AM Collective). Defaults to current admin's email
    // and a hardcoded display name; override via env if a dedicated signing
    // identity is required.
    const adminEmail = await getCurrentAdminEmail()
    const companySignerName = (process.env.AM_COLLECTIVE_SIGNER_NAME || 'Adam Wolfe').trim()
    const companySignerEmail = (process.env.AM_COLLECTIVE_SIGNER_EMAIL || adminEmail || '').trim()
    if (!companySignerEmail) {
      return NextResponse.json(
        { error: 'No company-side signer email. Set AM_COLLECTIVE_SIGNER_EMAIL or sign in.' },
        { status: 503 }
      )
    }

    const folder = await createContractFromTemplate({
      templateId,
      title: `Cursive AI SOW — ${rest.companyName}`,
      summary: `Scope of work and service agreement for ${rest.companyName}`,
      senderFieldValues,
      roles: [
        {
          roleName: 'AM Collective',
          signerName: companySignerName,
          signerEmail: companySignerEmail,
        },
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
