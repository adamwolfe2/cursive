/**
 * Email Template Detail API
 * Get, update, delete individual template
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { safeError } from '@/lib/utils/log-sanitizer'


const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  subject: z.string().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
  preview_text: z.string().max(200).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
})

// GET /api/email-templates/[id] - Get template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (error || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    safeError('Email template GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/email-templates/[id] - Update template
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validated = updateTemplateSchema.parse(body)

    const supabase = await createClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from('email_templates')
      .select('id')
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const { data: template, error } = await supabase
      .from('email_templates')
      .update(validated)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Template name already exists' },
          { status: 400 }
        )
      }
      safeError('Failed to update email template:', error)
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      )
    }

    // Update last_used_at if status changed to active
    if (validated.status === 'active') {
      await supabase
        .from('email_templates')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', id)
    }

    return NextResponse.json({ template })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    safeError('Email template PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/email-templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from('email_templates')
      .select('id')
      .eq('id', id)
      .eq('workspace_id', user.workspace_id)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Check if template is used in any sequences
    const { data: steps } = await supabase
      .from('email_sequence_steps')
      .select('id')
      .eq('template_id', id)
      .limit(1)

    if (steps && steps.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete template that is used in sequences' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id)

    if (error) {
      safeError('Failed to delete email template:', error)
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('Email template DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
