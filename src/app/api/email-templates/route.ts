/**
 * Email Templates API
 * CRUD for reusable email templates
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'


const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
  variables: z.array(z.string()).optional(),
  preview_text: z.string().max(200).optional(),
})

// GET /api/email-templates - List templates
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'

    const supabase = await createClient()

    let query = supabase
      .from('email_templates')
      .select('*')
      .eq('workspace_id', user.workspace_id)
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: templates, error } = await query

    if (error) {
      safeError('Failed to fetch email templates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({ templates })
  } catch (error) {
    safeError('Email templates GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/email-templates - Create template
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createTemplateSchema.parse(body)

    const supabase = await createClient()

    const { data: template, error } = await supabase
      .from('email_templates')
      .insert({
        workspace_id: user.workspace_id,
        user_id: user.id,
        name: validated.name,
        description: validated.description,
        subject: validated.subject,
        body: validated.body,
        variables: validated.variables || [],
        preview_text: validated.preview_text,
        status: 'draft',
      })
      .select()
      .maybeSingle()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Template name already exists' },
          { status: 400 }
        )
      }
      safeError('Failed to create email template:', error)
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    safeError('Email templates POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
