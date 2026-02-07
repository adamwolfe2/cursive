import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/helpers'
import { PartnerRepository } from '@/lib/repositories/partner.repository'
import { EarningsClient } from './components/EarningsClient'
import { ArrowLeft, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Earnings | Partner Dashboard',
  description: 'View your earnings breakdown and commission history',
}

async function getEarningsData() {
  const user = await getCurrentUser()

  if (!user || !user.linked_partner_id) {
    redirect('/login')
  }

  const repo = new PartnerRepository()

  // Get earnings history
  const { earnings, total } = await repo.getEarningsHistory(user.linked_partner_id, {
    limit: 100,
  })

  // Get partner stats for summary
  const partner = await repo.findById(user.linked_partner_id)

  return {
    earnings,
    total,
    partnerId: user.linked_partner_id,
    partnerStats: {
      totalEarnings: partner?.total_earnings || 0,
      pendingBalance: partner?.pending_balance || 0,
      availableBalance: partner?.available_balance || 0,
      totalLeadsSold: partner?.total_leads_sold || 0,
      commissionRate: partner?.base_commission_rate || 0.30,
    }
  }
}

function EarningsLoading() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="h-96 bg-muted/20 animate-pulse rounded-lg" />
    </div>
  )
}

export default async function PartnerEarningsPage() {
  const { earnings, total, partnerId, partnerStats } = await getEarningsData()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-zinc-50">
      {/* Header */}
      <div className="border-b border-primary/10 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Link href="/partner">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Track your commission earnings and transaction history
                </p>
              </div>
            </div>
            <Link href="/partner/payouts">
              <Button variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                Payouts
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<EarningsLoading />}>
          <EarningsClient
            initialEarnings={earnings}
            totalCount={total}
            partnerId={partnerId}
            stats={partnerStats}
          />
        </Suspense>
      </div>
    </div>
  )
}
