import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PartnerTable } from '@/components/admin/partner-table'

export default async function AdminPartnersPage() {
  const supabase = await createClient()

  // Verify admin
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: admin } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('email', user.email)
    .eq('is_active', true)
    .single()

  if (!admin) redirect('/dashboard')

  // Get partners by status
  const { data: pendingPartners } = await supabase
    .from('partners')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const { data: activePartners } = await supabase
    .from('partners')
    .select('*')
    .eq('status', 'active')
    .order('quality_score', { ascending: false })

  const { data: suspendedPartners } = await supabase
    .from('partners')
    .select('*')
    .in('status', ['suspended', 'rejected'])
    .order('updated_at', { ascending: false })

  return (
    <div className="container py-8">
      <h1 className="mb-8 text-3xl font-bold">Partner Management</h1>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Approval ({pendingPartners?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="active">Active ({activePartners?.length || 0})</TabsTrigger>
          <TabsTrigger value="suspended">
            Suspended/Rejected ({suspendedPartners?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <PartnerTable partners={pendingPartners || []} showApprovalActions />
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <PartnerTable partners={activePartners || []} showStats />
        </TabsContent>

        <TabsContent value="suspended" className="mt-6">
          <PartnerTable partners={suspendedPartners || []} showReason />
        </TabsContent>
      </Tabs>
    </div>
  )
}
