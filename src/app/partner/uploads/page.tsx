import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/helpers'
import { PartnerRepository } from '@/lib/repositories/partner.repository'
import { UploadHistoryClient } from './components/UploadHistoryClient'
import { ArrowLeft, Upload } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Upload History | Partner Dashboard',
  description: 'View your lead upload batch history and performance',
}

async function getUploadBatches() {
  const user = await getCurrentUser()

  if (!user || !user.linked_partner_id) {
    redirect('/login')
  }

  const repo = new PartnerRepository()
  const { batches, total } = await repo.getUploadBatches(user.linked_partner_id, {
    limit: 50,
  })

  return { batches, total, partnerId: user.linked_partner_id }
}

function UploadHistoryLoading() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-lg" />
      ))}
    </div>
  )
}

export default async function PartnerUploadsPage() {
  const { batches, total, partnerId } = await getUploadBatches()

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
                <h1 className="text-2xl font-bold text-gray-900">Upload History</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Track your lead batch uploads and performance
                </p>
              </div>
            </div>
            <Link href="/partner/upload">
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Leads
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<UploadHistoryLoading />}>
          <UploadHistoryClient initialBatches={batches} totalCount={total} partnerId={partnerId} />
        </Suspense>
      </div>
    </div>
  )
}
