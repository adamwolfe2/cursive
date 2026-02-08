/**
 * Partner Auth Wrapper
 * Server component that verifies partner role before rendering children
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isApprovedPartner, getUserWithRole } from '@/lib/auth/roles'

export async function PartnerAuthWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?error=unauthorized')
  }

  // Get user with role
  const user = await getUserWithRole(authUser)
  if (!user) {
    redirect('/login?error=user_not_found')
  }

  // Check if user has partner role
  if (user.role !== 'partner') {
    redirect('/dashboard?error=partner_access_required')
  }

  // Check if partner is approved
  const approved = await isApprovedPartner(authUser)
  if (!approved) {
    redirect('/partner/pending?status=awaiting_approval')
  }

  return <>{children}</>
}
