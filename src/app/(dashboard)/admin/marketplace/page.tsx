import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Marketplace Admin | Cursive' }
import { DollarSign, Users, ShoppingCart, Package } from 'lucide-react'
import { format } from 'date-fns'

export default async function AdminMarketplacePage() {
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

  // Get marketplace stats
  const [
    { count: totalLeads },
    { count: listedLeads },
    { count: totalPurchases },
    { data: revenueData },
    { count: activePartners },
    { count: pendingPartners },
    { data: recentPurchases },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('is_marketplace_listed', true),
    supabase
      .from('marketplace_purchases')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed') as any,
    supabase.from('marketplace_purchases').select('total_price').eq('status', 'completed') as any,
    supabase
      .from('partners')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active') as any,
    supabase
      .from('partners')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending') as any,
    supabase
      .from('marketplace_purchases')
      .select('*, users(email)')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10) as any,
  ]) as any[]

  const totalRevenue = revenueData?.reduce((sum: number, p: any) => sum + (p.total_price || 0), 0) || 0

  return (
    <div className="container space-y-8 py-8">
      <h1 className="text-3xl font-bold">Marketplace Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPurchases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Listed</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listedLeads?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">of {totalLeads?.toLocaleString()} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePartners}</div>
            <p className="text-xs text-muted-foreground">{pendingPartners} pending approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Purchases */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPurchases?.map((purchase: any) => (
              <div key={purchase.id} className="flex items-center justify-between border-b pb-4">
                <div>
                  <p className="font-medium">{purchase.total_leads || 0} leads</p>
                  <p className="text-sm text-muted-foreground">
                    {purchase.users?.email || 'Unknown'} •{' '}
                    {format(new Date(purchase.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <p className="font-bold">${(purchase.total_price || 0).toFixed(2)}</p>
              </div>
            ))}
            {recentPurchases?.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-foreground">No purchases yet</p>
                <p className="text-xs text-muted-foreground mt-1">Marketplace purchases will appear here when users buy leads.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
