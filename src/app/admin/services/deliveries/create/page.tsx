import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DeliveryCreateForm } from '@/components/admin/DeliveryCreateForm'

export default async function CreateDeliveryPage() {
  const supabase = await createClient()

  // Check admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('auth_user_id', user.id)
    .single() as { data: { role: string } | null }

  if (!userData || (userData.role !== 'admin' && userData.role !== 'owner')) {
    redirect('/dashboard')
  }

  // Get all active subscriptions
  const { data: subscriptions } = await supabase
    .from('service_subscriptions')
    .select(`
      id,
      status,
      workspace_id,
      onboarding_completed,
      onboarding_data,
      workspaces (
        name
      ),
      service_tiers (
        name,
        slug
      ),
      users!inner (
        email,
        full_name
      )
    `)
    .in('status', ['onboarding', 'active'])
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">
          Create New Delivery
        </h1>
        <p className="text-zinc-600">
          Upload a lead list or report for a customer
        </p>
      </div>

      <DeliveryCreateForm subscriptions={subscriptions || []} />
    </div>
  )
}
