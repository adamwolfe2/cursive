/**
 * Campaign Success Page
 * Shown after successful Stripe checkout
 */

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react'

interface Campaign {
  id: string
  tier: string
  tier_price: number
  leads_guaranteed: number
  payment_status: string
  campaign_status: string
  landing_url: string
  created_at: string
}

export default function CampaignSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const campaignId = searchParams.get('campaign_id')

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId || !campaignId) {
      setError('Missing session or campaign information')
      setIsLoading(false)
      return
    }

    // Poll for campaign status update (webhook might take a moment)
    let attempts = 0
    const maxAttempts = 10

    const pollCampaign = async () => {
      try {
        const response = await fetch(`/api/ai-studio/campaigns/${campaignId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load campaign')
        }

        setCampaign(data.campaign)

        // If payment is still pending and we haven't hit max attempts, poll again
        if (data.campaign.payment_status === 'pending' && attempts < maxAttempts) {
          attempts++
          setTimeout(pollCampaign, 2000) // Poll every 2 seconds
        } else {
          setIsLoading(false)

          // If still pending after max attempts, show warning
          if (data.campaign.payment_status === 'pending') {
            setError('Payment confirmation is taking longer than expected. Your campaign will be activated once payment is confirmed.')
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load campaign')
        setIsLoading(false)
      }
    }

    pollCampaign()
  }, [sessionId, campaignId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FA]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-gray-600">Processing your campaign...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FA]">
        <Card className="p-12 max-w-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/ai-studio')}>
            Back to AI Studio
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Card className="p-12 text-center bg-white shadow-sm border border-gray-200">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center border-4 border-green-200">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Campaign Created Successfully! 🎉
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Your Meta ads campaign is being set up and will launch within 24-48 hours.
          </p>

          {/* What Happens Next */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold text-gray-900 mb-4">What happens next:</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">1.</span>
                <p className="text-gray-700">
                  Our team will review your creatives and landing page
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">2.</span>
                <p className="text-gray-700">
                  We'll set up your Meta Ads campaign with optimized targeting
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">3.</span>
                <p className="text-gray-700">
                  Your campaign will launch and start generating leads
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">4.</span>
                <p className="text-gray-700">
                  You'll receive daily updates on lead generation progress
                </p>
              </li>
            </ul>
          </div>

          {/* Campaign Details */}
          {campaign && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Campaign ID</p>
                  <p className="font-mono text-sm text-gray-900">{campaign.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tier</p>
                  <p className="text-sm text-gray-900 font-medium capitalize">{campaign.tier}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Guaranteed Leads</p>
                  <p className="text-sm text-gray-900 font-medium">{campaign.leads_guaranteed} leads</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <p className="text-sm text-gray-900 font-medium capitalize">
                    {campaign.payment_status === 'paid' ?
                      <span className="text-green-600">Payment Confirmed</span> :
                      <span className="text-yellow-600">Processing Payment...</span>
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => router.push('/ai-studio')}
              variant="outline"
              size="lg"
            >
              Back to AI Studio
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-primary hover:bg-primary/90"
              size="lg"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Support */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Questions? Contact us at{' '}
              <a href="mailto:hello@meetcursive.com" className="text-primary hover:underline">
                hello@meetcursive.com
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
