import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RequestsManagementClient } from './RequestsManagementClient'
import { safeError } from '@/lib/utils/log-sanitizer'

export const metadata = {
  title: 'Feature Requests | Admin | Cursive',
}

export default async function AdminRequestsPage() {
  const supabase = await createClient()

  // Verify admin access
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) {
    redirect('/login?error=unauthorized')
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('auth_user_id', session.user.id)
    .maybeSingle()

  if (!userRecord || (userRecord.role !== 'admin' && userRecord.role !== 'owner')) {
    redirect('/dashboard?error=admin_required')
  }

  // Fetch all feature requests with workspace and user info
  const { data: requests, error } = await supabase
    .from('feature_requests')
    .select(`
      *,
      workspace:workspaces!workspace_id(id, name, slug),
      user:users!user_id(id, email, full_name),
      reviewed_by_user:users!reviewed_by(id, email, full_name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    safeError('[AdminRequests]', 'Failed to fetch feature requests:', error)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Premium Feature Requests</h1>
        <p className="text-zinc-600">
          Manage premium feature requests from customers. Approve requests and track implementation status.
        </p>
      </div>

      <RequestsManagementClient initialRequests={requests || []} />
    </div>
  )
}
