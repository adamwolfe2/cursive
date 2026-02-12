/**
 * CRM Leads API - Create endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { CRMLeadRepository } from '@/lib/repositories/crm-lead.repository'
import { z } from 'zod'

// Use edge runtime
export const runtime = 'edge'

const createLeadSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  company_industry: z.string().optional(),
  business_type: z.string().optional(),
  title: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  source: z.string().default('manual'),
  status: z.string().default('new'),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = createLeadSchema.parse(body)

    const leadRepo = new CRMLeadRepository()
    const lead = await leadRepo.create({
      workspace_id: user.workspace_id,
      email: validated.email,
      first_name: validated.first_name,
      last_name: validated.last_name,
      phone: validated.phone || undefined,
      company_name: validated.company_name || undefined,
      company_industry: validated.company_industry || undefined,
      business_type: validated.business_type || undefined,
      title: validated.title || undefined,
      city: validated.city || undefined,
      state: validated.state || undefined,
      source: validated.source,
      status: validated.status as import('@/types/crm.types').LeadStatus,
      created_at: new Date().toISOString(),
    })

    // Inngest disabled (Node.js runtime not available on this deployment)
    // Original: inngest.send({ name: 'lead/created', data: { lead_id, workspace_id, source } })

    return NextResponse.json({ success: true, lead })
  } catch (error) {
    console.error('[Create Lead] Error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}
