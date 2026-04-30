/**
 * Admin Audience Copilot
 *
 * A Claude-powered chatbot that helps internal admins match ICPs
 * to the right AudienceLab segments. RAG over 19K+ segments with
 * live AL API integration for size previews.
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserWithRole } from '@/lib/auth/roles'
import { CopilotChat } from './_components/CopilotChat'

export const metadata: Metadata = {
  title: 'Audience Copilot · Admin',
  robots: { index: false, follow: false },
}

export default async function CopilotPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?error=unauthorized')
  const userWithRole = await getUserWithRole(user)
  if (!userWithRole || !['owner', 'admin'].includes(userWithRole.role)) {
    redirect('/dashboard?error=admin_required')
  }

  return <CopilotChat adminEmail={userWithRole.email || user.email || 'Admin'} />
}
