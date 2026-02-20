/**
 * Admin Premium Feature Requests Page
 * View and manage premium feature requests from users
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PremiumRequestsClient } from './PremiumRequestsClient'

export const metadata = {
  title: 'Premium Feature Requests | Admin',
  description: 'Manage premium feature requests',
}

export default async function AdminPremiumRequestsPage() {
  const supabase = await createClient()

  // Check auth
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect('/login')
  }

  // Check if user is admin/owner
  const { data: userProfile } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_user_id', session.user.id)
    .maybeSingle()

  if (!userProfile || !['admin', 'owner'].includes(userProfile.role)) {
    redirect('/dashboard')
  }

  // Fetch all premium feature requests
  const { data: requests } = await supabase
    .from('premium_feature_requests')
    .select(`
      *,
      workspace:workspaces!workspace_id(id, name, slug),
      user:users!user_id(id, email, full_name),
      reviewer:users!reviewed_by(id, email, full_name)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Premium Feature Requests</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Review and approve requests for premium features
        </p>
      </div>

      <PremiumRequestsClient initialRequests={requests || []} />
    </div>
  )
}
