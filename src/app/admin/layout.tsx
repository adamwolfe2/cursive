/**
 * Admin Layout
 * Cursive Platform
 *
 * Protected layout for admin pages with role-based authentication.
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}
import { createClient } from '@/lib/supabase/server'
import { getUserWithRole } from '@/lib/auth/roles'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminNav from './_components/AdminNav'
import KeyboardShortcuts from '@/components/admin/KeyboardShortcuts'

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

  const adminClient = createAdminClient()

  let needsApprovalCount = 0
  let upcomingBookingsCount = 0
  try {
    const [repliesRes, bookingsRes] = await Promise.all([
      adminClient
        .from('email_replies')
        .select('id', { count: 'exact', head: true })
        .eq('draft_status', 'needs_approval'),
      adminClient
        .from('cal_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'upcoming'),
    ])
    needsApprovalCount = repliesRes.count || 0
    upcomingBookingsCount = bookingsRes.count || 0
  } catch { /* non-fatal */ }

  return (
    <div className="min-h-screen bg-zinc-50">
      <AdminNav adminEmail={adminEmail} needsApprovalCount={needsApprovalCount} upcomingBookingsCount={upcomingBookingsCount} />
      <main>{children}</main>
      <KeyboardShortcuts />
    </div>
  )
}
