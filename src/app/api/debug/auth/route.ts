import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as never)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  let workspaceId: string | null = null
  let role: string | null = null

  if (user) {
    const adminSupabase = createAdminClient()
    const { data: userRecord } = await adminSupabase
      .from('users')
      .select('workspace_id, role')
      .eq('auth_user_id', user.id)
      .single()

    workspaceId = userRecord?.workspace_id ?? null
    role = userRecord?.role ?? null
  }

  return NextResponse.json({
    hasSession: !!session,
    userId: user?.id ?? null,
    email: user?.email ?? null,
    workspaceId,
    role,
    path: req.nextUrl.pathname,
    timestamp: new Date().toISOString(),
  })
}
