import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PartnerRepository } from '@/lib/repositories/partner.repository'
import { PartnerDetailClient } from './components/PartnerDetailClient'

export default async function AdminPartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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
    .single() as { data: any; error: any }

  if (!admin) redirect('/dashboard')

  // Get partner details
  const repo = new PartnerRepository()
  const partner = await repo.findById(id)

  if (!partner) {
    redirect('/admin/partners')
  }

  // Get upload batches
  const { batches, total: uploadCount } = await repo.getUploadBatches(id, {
    limit: 20,
  })

  // Get earnings
  const { earnings, total: earningsCount } = await repo.getEarningsHistory(id, {
    limit: 50,
  })

  // Get payouts
  const { payouts } = await repo.getPayouts(id, {
    limit: 20,
  })

  // Get referred partners count
  const { data: referredPartners, count: referredCount } = await (supabase
    .from('partners')
    .select('*', { count: 'exact' })
    .eq('referred_by_partner_id', id) as any) as { data: any[] | null; count: number | null }

  return (
    <PartnerDetailClient
      partner={partner}
      batches={batches}
      uploadCount={uploadCount}
      earnings={earnings}
      earningsCount={earningsCount}
      payouts={payouts}
      referredCount={referredCount || 0}
    />
  )
}
