/**
 * Admin Layout
 * Cursive Platform
 *
 * Protected layout for admin pages with role-based authentication.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserWithRole } from '@/lib/auth/roles'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminNav from './_components/AdminNav'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // SECURITY: Use getUser() for server-side JWT verification
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?error=unauthorized')
  }

  const userWithRole = await getUserWithRole(user)
  if (!userWithRole || (userWithRole.role !== 'owner' && userWithRole.role !== 'admin')) {
    redirect('/dashboard?error=admin_required')
  }

  const adminEmail = userWithRole.email || user.email || 'Admin'

  let needsApprovalCount = 0
  try {
    const adminClient = createAdminClient()
    const { count } = await adminClient
      .from('email_replies')
      .select('id', { count: 'exact', head: true })
      .eq('draft_status', 'needs_approval')
    needsApprovalCount = count || 0
  } catch { /* non-fatal */ }

  return (
    <div className="min-h-screen bg-zinc-50">
      <AdminNav adminEmail={adminEmail} needsApprovalCount={needsApprovalCount} />
      <main>{children}</main>
    </div>
  )
}
