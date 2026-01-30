import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

// Diagnostic endpoint to check cookies and session
export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  // Get Supabase cookies specifically
  const supabaseCookies = allCookies.filter(c =>
    c.name.startsWith('sb-') ||
    c.name.includes('auth-token') ||
    c.name.includes('supabase')
  )

  // Try to read session
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  return NextResponse.json({
    totalCookies: allCookies.length,
    allCookieNames: allCookies.map(c => c.name),
    supabaseCookies: supabaseCookies.map(c => ({
      name: c.name,
      valueLength: c.value?.length || 0,
      hasValue: !!c.value,
    })),
    session: {
      exists: !!session,
      userId: session?.user?.id || null,
      userEmail: session?.user?.email || null,
      expiresAt: session?.expires_at || null,
    },
    error: error?.message || null,
    adminBypassCookie: cookieStore.get('admin_bypass_waitlist')?.value || null,
  })
}
