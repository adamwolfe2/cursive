// API Route: Parse unstructured context into structured onboarding data
// POST /api/onboarding/parse-context

export const maxDuration = 60 // Claude parsing can take 15-30s

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { parseIntakeContext } from '@/lib/services/onboarding/ai-intake-parser'
import type { ContextFormat, TemplateData } from '@/types/onboarding-templates'

const requestSchema = z.object({
  raw_context: z.string().min(10, 'Context must be at least 10 characters').max(250000),
  context_format: z.enum(['call_notes', 'email_thread', 'transcript', 'client_brief', 'mixed']).default('mixed'),
  template_data: z.record(z.unknown()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    // Auth check — must be authenticated admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!dbUser || !['admin', 'owner'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate request body
    const body = await req.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { raw_context, context_format, template_data } = parsed.data

    // Call AI parser
    const result = await parseIntakeContext(
      raw_context,
      context_format as ContextFormat,
      template_data as TemplateData | undefined
    )

    return NextResponse.json({ data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to parse context: ${message}` },
      { status: 500 }
    )
  }
}
