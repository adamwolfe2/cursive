/**
 * AI Studio - Offers Page
 * Display and manage products/services
 */

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, ArrowRight, Package, Plus } from 'lucide-react'

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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Button
                onClick={() => router.push(`/ai-studio/profiles?workspace=${workspaceId}`)}
                variant="ghost"
                size="sm"
                className="mb-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Customer Profiles
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Offers</h1>
              <p className="text-sm text-gray-500">Your products and services</p>
            </div>

            <Button
              onClick={() => router.push(`/ai-studio/creatives?workspace=${workspaceId}`)}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              Next: Creatives
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {offers.length === 0 ? (
            <Card className="p-12 text-center bg-white shadow-sm border border-gray-200">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No offers yet
              </h3>
              <p className="text-gray-600 mb-4">
                Offers are automatically extracted during brand analysis
              </p>
              <Button variant="outline" className="gap-2" disabled title="Coming soon">
                <Plus className="h-4 w-4" />
                Add Manual Offer (Coming Soon)
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => (
                <Card key={offer.id} className="p-6 bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="rounded-lg bg-blue-100 p-3 border border-blue-200">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">{offer.name}</h3>
                      {offer.pricing && (
                        <p className="text-sm font-medium text-blue-600">{offer.pricing}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {offer.description}
                  </p>

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">
                      Active
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                      {offer.source === 'extracted' ? 'Auto-extracted' : 'Manual'}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Add Offer Button */}
          {offers.length > 0 && (
            <div className="flex justify-center pt-6">
              <Button variant="outline" className="gap-2" disabled title="Coming soon">
                <Plus className="h-4 w-4" />
                Add Manual Offer (Coming Soon)
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
