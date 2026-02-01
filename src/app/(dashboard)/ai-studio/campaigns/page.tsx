/**
 * AI Studio - Campaigns Page
 * Create and manage ad campaigns with pricing tiers
 */

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  ArrowLeft,
  Check,
  Zap,
  TrendingUp,
  Rocket,
  ExternalLink,
  XCircle,
} from 'lucide-react'

interface Creative {
  id: string
  image_url: string
  prompt: string
}

interface CustomerProfile {
  id: string
  name: string
  title: string
}

const PRICING_TIERS = [
  {
    tier: 'starter',
    name: 'Starter',
    price: 300,
    leads: 20,
    icon: Zap,
    color: 'blue',
    features: [
      '20 guaranteed leads',
      '1 ad creative',
      '1 customer profile target',
      'Basic Meta Ads setup',
      'Weekly performance report',
    ],
  },
  {
    tier: 'growth',
    name: 'Growth',
    price: 1000,
    leads: 100,
    icon: TrendingUp,
    color: 'blue',
    popular: true,
    features: [
      '100 guaranteed leads',
      '3 ad creatives',
      'Multi-profile targeting',
      'Advanced Meta Ads optimization',
      'Daily performance monitoring',
      'A/B creative testing',
    ],
  },
  {
    tier: 'scale',
    name: 'Scale',
    price: 1500,
    leads: 200,
    icon: Rocket,
    color: 'blue',
    features: [
      '200 guaranteed leads',
      '5+ ad creatives',
      'Full audience targeting',
      'Premium Meta Ads management',
      'Real-time performance dashboard',
      'Dedicated account manager',
      'Landing page optimization',
    ],
  },
]

export default function CampaignsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get('workspace')

  const [creatives, setCreatives] = useState<Creative[]>([])
  const [profiles, setProfiles] = useState<CustomerProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const [selectedTier, setSelectedTier] = useState<string>('growth')
  const [selectedCreatives, setSelectedCreatives] = useState<string[]>([])
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([])
  const [landingUrl, setLandingUrl] = useState('')

  useEffect(() => {
    if (!workspaceId) {
      router.push('/ai-studio')
      return
    }
    fetchData()
  }, [workspaceId])

  async function fetchData() {
    try {
      const [creativesRes, profilesRes] = await Promise.all([
        fetch(`/api/ai-studio/creatives?workspace=${workspaceId}`),
        fetch(`/api/ai-studio/profiles?workspace=${workspaceId}`),
      ])

      const [creativesData, profilesData] = await Promise.all([
        creativesRes.json(),
        profilesRes.json(),
      ])

      setCreatives(creativesData.creatives || [])
      setProfiles(profilesData.profiles || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreateCampaign() {
    if (!landingUrl.trim()) {
      setCheckoutError('Please enter a landing page URL')
      return
    }

    if (selectedCreatives.length === 0) {
      setCheckoutError('Please select at least one creative')
      return
    }

    try {
      setIsCreatingCheckout(true)
      setCheckoutError(null)

      // Create Stripe checkout session
      const response = await fetch('/api/ai-studio/campaigns/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          tier: selectedTier,
          creativeIds: selectedCreatives,
          profileIds: selectedProfiles,
          landingUrl: landingUrl.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe checkout
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl
      } else {
        throw new Error('No checkout URL returned')
      }

    } catch (error: any) {
      console.error('Checkout error:', error)
      setCheckoutError(error.message || 'Failed to create checkout session')
      setIsCreatingCheckout(false)
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
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div>
            <Button
              onClick={() => router.push(`/ai-studio/creatives?workspace=${workspaceId}`)}
              variant="ghost"
              size="sm"
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Creatives
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Create Campaign</h1>
            <p className="text-sm text-gray-500">
              Choose a plan and we'll run your Meta ads campaign
            </p>
          </div>

          {/* Error Message */}
          {checkoutError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{checkoutError}</p>
              </div>
              <button
                onClick={() => setCheckoutError(null)}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}

        {/* Pricing Tiers */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Select Your Plan
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {PRICING_TIERS.map((tier) => {
              const Icon = tier.icon
              return (
                <Card
                  key={tier.tier}
                  className={`relative p-6 cursor-pointer transition-all bg-white ${
                    selectedTier === tier.tier
                      ? 'border-2 border-blue-500 shadow-md'
                      : 'border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedTier(tier.tier)}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className="rounded-lg bg-blue-100 p-3 border border-blue-200">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{tier.name}</h3>
                      <p className="text-xs text-gray-500">{tier.leads} leads guaranteed</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">
                        ${tier.price.toLocaleString()}
                      </span>
                      <span className="text-gray-500 text-sm">/campaign</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      ${(tier.price / tier.leads).toFixed(2)} per lead
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${
                      selectedTier === tier.tier
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedTier(tier.tier)
                    }}
                  >
                    {selectedTier === tier.tier ? 'Selected' : 'Select Plan'}
                  </Button>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Campaign Configuration */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Select Creatives */}
          <Card className="p-6 bg-white shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Select Ad Creatives
            </h3>
            {creatives.length === 0 ? (
              <p className="text-sm text-gray-500">
                No creatives available. Create some creatives first.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {creatives.slice(0, 6).map((creative) => (
                  <div
                    key={creative.id}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedCreatives.includes(creative.id)
                        ? 'border-blue-500 shadow-md'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => {
                      setSelectedCreatives((prev) =>
                        prev.includes(creative.id)
                          ? prev.filter((id) => id !== creative.id)
                          : [...prev, creative.id]
                      )
                    }}
                  >
                    <img
                      src={creative.image_url}
                      alt={creative.prompt}
                      className="w-full aspect-square object-cover"
                    />
                    {selectedCreatives.includes(creative.id) && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Select Target Audiences */}
          <Card className="p-6 bg-white shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Target Customer Profiles
            </h3>
            {profiles.length === 0 ? (
              <p className="text-sm text-gray-500">
                No customer profiles available.
              </p>
            ) : (
              <div className="space-y-2">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedProfiles.includes(profile.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => {
                      setSelectedProfiles((prev) =>
                        prev.includes(profile.id)
                          ? prev.filter((id) => id !== profile.id)
                          : [...prev, profile.id]
                      )
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-2 ${
                          selectedProfiles.includes(profile.id)
                            ? 'bg-blue-600'
                            : 'bg-gray-200'
                        }`}
                      >
                        {selectedProfiles.includes(profile.id) ? (
                          <Check className="h-4 w-4 text-white" />
                        ) : (
                          <div className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{profile.name}</p>
                        <p className="text-xs text-gray-500">{profile.title}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Landing Page URL */}
        <Card className="p-6 bg-white shadow-sm border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Landing Page
          </h3>
          <div className="flex gap-3">
            <Input
              type="url"
              placeholder="https://yourwebsite.com/landing-page"
              value={landingUrl}
              onChange={(e) => setLandingUrl(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" className="gap-2" disabled title="Coming soon">
              <ExternalLink className="h-4 w-4" />
              Preview (Coming Soon)
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Where should we send the traffic? This will be your Meta ad destination.
          </p>
        </Card>

        {/* Create Campaign Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleCreateCampaign}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!landingUrl.trim() || selectedCreatives.length === 0 || isCreatingCheckout}
          >
            {isCreatingCheckout ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating checkout...
              </>
            ) : (
              <>
                Proceed to Checkout
                <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
              </>
            )}
          </Button>
        </div>
        </div>
      </div>
    </div>
  )
}
