export const maxDuration = 10

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateExtension, extAuthErrorResponse } from '@/lib/middleware/ext-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const requestSchema = z.object({
  first_name: z.string().min(1).max(200),
  last_name: z.string().min(1).max(200),
  email: z.string().email().max(320).optional(),
  phone: z.string().max(30).optional(),
  company_name: z.string().max(200).optional(),
  company_domain: z.string().max(200).optional(),
  job_title: z.string().max(200).optional(),
  linkedin_url: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateExtension(req, 'ext:save')

    const body = await req.json()
    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const data = parsed.data
    const supabase = createAdminClient()

    // Duplicate check by email within workspace
    if (data.email) {
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('workspace_id', auth.workspaceId)
        .eq('email', data.email)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({
          data: { id: existing.id, duplicate: true },
          message: 'Contact already exists in your workspace',
        })
      }
    }

    // Insert lead
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        workspace_id: auth.workspaceId,
        first_name: data.first_name,
        last_name: data.last_name,
        full_name: `${data.first_name} ${data.last_name}`.trim(),
        email: data.email || null,
        phone: data.phone || null,
        company_name: data.company_name || null,
        job_title: data.job_title || null,
        source: 'chrome_extension',
        status: 'new',
        delivered_at: new Date().toISOString(),
        metadata: {
          company_domain: data.company_domain,
          linkedin: data.linkedin_url,
          city: data.city,
          state: data.state,
          notes: data.notes,
          saved_from: 'cursive_extension',
        },
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
    }

    return NextResponse.json({
      data: { id: lead.id, duplicate: false },
      message: 'Lead saved to workspace',
    })
  } catch (error) {
    return extAuthErrorResponse(error)
  }
}
