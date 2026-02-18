import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'


const snippetSchema = z.object({
  snippet: z.string().min(1, 'Snippet is required').max(5000, 'Snippet too long'),
})

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workspace_id from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 })
    }

    const body = await request.json()
    const validated = snippetSchema.parse(body)

    const adminSupabase = createAdminClient()

    const { data: updated, error: updateError } = await adminSupabase
      .from('audiencelab_pixels')
      .update({ snippet: validated.snippet })
      .eq('workspace_id', userData.workspace_id)
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    safeError('[API] Snippet update error:', error)
    return NextResponse.json(
      { error: 'Failed to update snippet' },
      { status: 500 }
    )
  }
}
