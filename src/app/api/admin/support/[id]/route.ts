
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { safeError } from '@/lib/utils/log-sanitizer'

const updateSchema = z.object({
  status: z.enum(['open', 'in_progress', 'responded', 'resolved', 'closed']).optional(),
  admin_notes: z.string().max(5000).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify admin using centralized helper
    await requireAdmin()

    const user = await getCurrentUser()
    if (!user) return unauthorized()
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }
    const { status, admin_notes } = parsed.data

    // Update message using admin client
    const adminSupabase = createAdminClient()
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) {
      updateData.status = status
      if (status === 'responded') {
        updateData.responded_at = new Date().toISOString()
        updateData.responded_by = user.id
      }
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes
    }

    const { data, error } = await adminSupabase
      .from('support_messages')
      .update(updateData)
      .eq('id', id)
      .select('id, user_id, workspace_id, subject, message, status, priority, category, admin_notes, created_at, updated_at')
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ message: data })
  } catch (error) {
    safeError('[Admin] Support message update error:', error)
    return NextResponse.json(
      { error: 'Failed to update support message' },
      { status: 500 }
    )
  }
}
