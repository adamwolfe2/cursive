/**
 * CRM Leads API - Create endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { CRMLeadRepository } from '@/lib/repositories/crm-lead.repository'
import { inngest } from '@/inngest/client'
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
      uploaded_by_user_id: user.id,
      partner_id: user.partner_id || null,
      email: validated.email,
      first_name: validated.first_name,
      last_name: validated.last_name,
      phone: validated.phone || null,
      company_name: validated.company_name || null,
      company_industry: validated.company_industry || null,
      business_type: validated.business_type || null,
      title: validated.title || null,
      city: validated.city || null,
      state: validated.state || null,
      source: validated.source,
      status: validated.status,
      created_at: new Date().toISOString(),
    })

    // Emit lead/created event for notifications (non-blocking)
    try {
      inngest.send({
        name: 'lead/created',
        data: {
          lead_id: lead.id,
          workspace_id: user.workspace_id,
          source: validated.source,
        },
      }).catch((err: unknown) => {
        console.error('[Create Lead] Failed to emit lead/created event:', err)
      })
    } catch {
      // Best-effort: don't fail lead creation if event emission fails
    }

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
