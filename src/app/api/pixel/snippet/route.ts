import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'

const snippetSchema = z.object({
  snippet: z.string().min(1, 'Snippet is required').max(5000, 'Snippet too long'),
})

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    if (!user.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 })
    }

    const body = await request.json()
    const validated = snippetSchema.parse(body)

    const adminSupabase = createAdminClient()

    const { data: updated, error: updateError } = await adminSupabase
      .from('audiencelab_pixels')
      .update({ snippet: validated.snippet })
      .eq('workspace_id', user.workspace_id)
      .select('snippet')
      .maybeSingle()

    if (updateError) {
      safeError('[API] Snippet update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update snippet' },
        { status: 500 }
      )
    }

    if (!updated) {
      return NextResponse.json(
        { error: 'No pixel found for this workspace' },
        { status: 404 }
      )
    }

    return NextResponse.json({ snippet: updated.snippet })
  } catch (error) {
    safeError('[API] Snippet update error:', error)
    return handleApiError(error)
  }
}
