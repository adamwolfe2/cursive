export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Use admin client to bypass RLS
    const admin = createAdminClient()

    // Check user record
    const { data: user, error: userError } = await admin
      .from('users')
      .select('id, email, workspace_id, role, full_name')
      .eq('auth_user_id', session.user.id)
      .maybeSingle()

    // Check workspace if exists
    let workspace = null
    if (user?.workspace_id) {
      const { data: ws } = await admin
        .from('workspaces')
        .select('id, name, slug')
        .eq('id', user.workspace_id)
        .single()
      workspace = ws
    }

    return NextResponse.json({
      auth_user_id: session.user.id,
      email: session.user.email,
      user_record: user,
      user_error: userError?.message,
      workspace,
      diagnosis: !user
        ? 'No user record found - need to create workspace'
        : !user.workspace_id
        ? 'User exists but no workspace - need onboarding'
        : 'User has workspace - should redirect to dashboard'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
