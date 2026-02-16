/**
 * AI Studio - Offers Page
 * Display and manage products/services
 */

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { GradientCard, GradientBadge } from '@/components/ui/gradient-card'
import { PageContainer, PageHeader, PageSection } from '@/components/layout/page-container'
import { PageLoading } from '@/components/ui/loading-states'
import { EmptyState } from '@/components/ui/empty-states'
import { CreateOfferDialog } from '@/components/ai-studio/create-offer-dialog'
import { ArrowLeft, ArrowRight, Package, Plus, Tag } from 'lucide-react'

interface Offer {
  id: string
  name: string
  description: string
  pricing: string | null
  source: string
  status: string
  created_at: string
}

export default function OffersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get('workspace')

  const [offers, setOffers] = useState<Offer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    if (!workspaceId) {
      router.push('/ai-studio')
      return
    }
    fetchOffers()
  }, [workspaceId])

  async function fetchOffers() {
    try {
      const response = await fetch(`/api/ai-studio/offers?workspace=${workspaceId}`)
      const data = await response.json()
      setOffers(data.offers || [])
    } catch (error) {
      console.error('Failed to load offers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <PageLoading message="Loading offers..." />
  }

  return (
    <PageContainer maxWidth="wide">
      <div className="mb-6">
        <Button
          onClick={() => router.push(`/ai-studio/profiles?workspace=${workspaceId}`)}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customer Profiles
        </Button>
      </div>

      {/* Header */}
      <GradientCard variant="primary" className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Tag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Offers</h1>
              <p className="text-sm text-muted-foreground">Your products and services</p>
            </div>
          </div>

          <Button
            onClick={() => router.push(`/ai-studio/creatives?workspace=${workspaceId}`)}
            size="lg"
          >
            Next: Creatives
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </GradientCard>

      {offers.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No offers yet"
          description="Offers are automatically extracted during brand analysis, or you can add them manually."
          action={{
            label: 'Add Manual Offer',
            onClick: () => setIsCreateDialogOpen(true)
          }}
        />
      ) : (
        <>
          <PageSection
            title={`Your Offers (${offers.length})`}
            description="Products and services extracted from your brand"
          >
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => (
                <GradientCard
                  key={offer.id}
                  variant="subtle"
                  className="hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-1">{offer.name}</h3>
                      {offer.pricing && (
                        <p className="text-sm font-medium text-primary">{offer.pricing}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {offer.description}
                  </p>

                  <div className="flex items-center gap-2 pt-4 border-t border-border">
                    <GradientBadge className="bg-green-500/10 text-green-600 border-green-500/20">
                      Active
                    </GradientBadge>
                    <GradientBadge>
                      {offer.source === 'extracted' ? 'Auto-extracted' : 'Manual'}
                    </GradientBadge>
                  </div>
                </GradientCard>
              ))}
            </div>
          </PageSection>

          {/* Add Offer Button */}
          <div className="flex justify-center pt-6">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Manual Offer
            </Button>
          </div>
        </>
      )}

      {/* Create Offer Dialog */}
      {workspaceId && (
        <CreateOfferDialog
          workspaceId={workspaceId}
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={fetchOffers}
        />
      )}
    </PageContainer>
  )
}
