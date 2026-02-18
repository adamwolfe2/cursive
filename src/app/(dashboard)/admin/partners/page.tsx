import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const metadata: Metadata = { title: 'Partners Admin | Cursive' }
import { PartnerTable } from '@/components/admin/partner-table'

export default async function AdminPartnersPage() {
  const supabase = await createClient()

  // Verify admin
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) redirect('/login')

  const { data: admin } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('email', user.email as string)
    .eq('is_active', true)
    .maybeSingle() as { data: any; error: any }

  if (!admin) redirect('/dashboard')

  // Get partners by status
  const { data: pendingPartners } = await (supabase
    .from('partners')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false }) as any) as { data: any[] | null }

  const { data: activePartners } = await (supabase
    .from('partners')
    .select('*')
    .eq('status', 'active')
    .order('quality_score', { ascending: false }) as any) as { data: any[] | null }

  const { data: suspendedPartners } = await (supabase
    .from('partners')
    .select('*')
    .in('status', ['suspended', 'rejected'])
    .order('updated_at', { ascending: false }) as any) as { data: any[] | null }

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
