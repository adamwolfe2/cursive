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

  // SECURITY: platform admins only (platform_admins table). Do NOT gate on
  // users.role — every customer is 'owner' of their own workspace and would
  // otherwise reach the cross-tenant admin panel.
  const adminClient = createAdminClient()
  const { data: platformAdmin } = await adminClient
    .from('platform_admins')
    .select('id, email')
    .eq('email', user.email ?? '')
    .eq('is_active', true)
    .maybeSingle()
  if (!platformAdmin) {
    redirect('/dashboard?error=admin_required')
  }

  const adminEmail = platformAdmin.email || user.email || 'Admin'

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
