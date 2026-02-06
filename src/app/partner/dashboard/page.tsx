/**
 * Partner Dashboard Page
 * Shows partner performance metrics, uploaded leads, and earnings
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PartnerRepository } from '@/lib/repositories/partner.repository'
import { StatsCards } from '@/components/partner/StatsCards'
import { UploadedLeadsTable } from '@/components/partner/UploadedLeadsTable'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PartnerDashboard() {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  // Get user profile
  const { data: user } = await supabase
    .from('users')
    .select('id, full_name, role, partner_approved')
    .eq('auth_user_id', authUser.id)
    .single()

  if (!user) redirect('/login')
  if (user.role !== 'partner') redirect('/dashboard')

  // Partners are auto-approved, but check just in case
  if (!user.partner_approved) {
    redirect('/login?error=Partner account not approved')
  }

  // Fetch partner data using repository
  const partnerRepo = new PartnerRepository()

  const [analytics, credits, uploadedLeadsData] = await Promise.all([
    partnerRepo.getPartnerAnalytics(user.id),
    partnerRepo.getPartnerCredits(user.id),
    partnerRepo.getPartnerUploadedLeads(user.id, 50, 0), // First 50 leads
  ])

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Partner Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user.full_name || 'Partner'}
          </p>
        </div>
        <Link href="/partner/upload">
          <Button size="lg">Upload Leads</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <StatsCards analytics={analytics} credits={credits} />

      {/* Uploaded Leads Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Your Uploaded Leads</h2>
          {uploadedLeadsData.leads.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing {uploadedLeadsData.leads.length} of {uploadedLeadsData.total} leads
            </p>
          )}
        </div>
        <UploadedLeadsTable leads={uploadedLeadsData.leads} />
      </div>
    </div>
  )
}
