import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/helpers'
import { PartnerRepository } from '@/lib/repositories/partner.repository'
import { SettingsClient } from './components/SettingsClient'
import { ArrowLeft, Settings } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Settings | Partner Dashboard',
  description: 'Manage your payout settings and account preferences',
}

async function getPartnerSettings() {
  const user = await getCurrentUser()

  if (!user || !user.linked_partner_id) {
    redirect('/login')
  }

  const repo = new PartnerRepository()
  const partner = await repo.findById(user.linked_partner_id)

  if (!partner) {
    redirect('/partner')
  }

  // Get payout history
  const { payouts } = await repo.getPayouts(user.linked_partner_id, {
    limit: 10,
  })

  return {
    partner,
    payouts,
  }
}

function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-64 bg-muted/20 animate-pulse rounded-lg" />
      <div className="h-96 bg-muted/20 animate-pulse rounded-lg" />
    </div>
  )
}

export default async function PartnerSettingsPage() {
  const { partner, payouts } = await getPartnerSettings()

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
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your payout settings and account preferences
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<SettingsLoading />}>
          <SettingsClient partner={partner} payouts={payouts} />
        </Suspense>
      </div>
    </div>
  )
}
