/**
 * AI Studio - Campaigns Page
 * Create and manage ad campaigns with pricing tiers
 */

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GradientCard, GradientBadge } from '@/components/ui/gradient-card'
import { PageContainer, PageHeader, PageSection } from '@/components/layout/page-container'
import { PageLoading } from '@/components/ui/loading-states'
import {
  Loader2,
  ArrowLeft,
  Check,
  Zap,
  TrendingUp,
  Rocket,
  ExternalLink,
  XCircle,
  Megaphone,
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
    return <PageLoading message="Loading campaign builder..." />
  }

  return (
    <PageContainer maxWidth="wide">
      <div className="mb-6">
        <Button
          onClick={() => router.push(`/ai-studio/creatives?workspace=${workspaceId}`)}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Creatives
        </Button>
      </div>

      {/* Header */}
      <GradientCard variant="primary" className="mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Create Campaign</h1>
            <p className="text-sm text-muted-foreground">
              Choose a plan and we&apos;ll run your Meta ads campaign
            </p>
          </div>
        </div>
      </GradientCard>

      {/* Error Message */}
      {checkoutError && (
        <GradientCard className="mb-8 border-destructive/50">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-destructive">{checkoutError}</p>
            </div>
            <button
              onClick={() => setCheckoutError(null)}
              className="text-destructive hover:text-destructive/80"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </GradientCard>
      )}

      {/* Pricing Tiers */}
      <PageSection
        title="Select Your Plan"
        description="Choose the campaign size that fits your goals"
      >
        <div className="grid gap-6 md:grid-cols-3">
          {PRICING_TIERS.map((tier) => {
            const Icon = tier.icon
            return (
              <GradientCard
                key={tier.tier}
                variant={selectedTier === tier.tier ? 'primary' : 'subtle'}
                className={`relative cursor-pointer transition-all duration-200 ${
                  selectedTier === tier.tier ? 'shadow-lg' : 'hover:shadow-md'
                }`}
                noPadding
              >
                <div onClick={() => setSelectedTier(tier.tier)} className="p-6">
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <GradientBadge className="bg-primary text-primary-foreground border-primary">
                        Most Popular
                      </GradientBadge>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-6">
                    <div className={`rounded-lg p-3 ${
                      selectedTier === tier.tier
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{tier.name}</h3>
                      <p className="text-xs text-muted-foreground">{tier.leads} leads guaranteed</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">
                        ${tier.price.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground text-sm">/campaign</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ${(tier.price / tier.leads).toFixed(2)} per lead
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={selectedTier === tier.tier ? 'default' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedTier(tier.tier)
                    }}
                  >
                    {selectedTier === tier.tier ? 'Selected' : 'Select Plan'}
                  </Button>
                </div>
              </GradientCard>
            )
          })}
        </div>
      </PageSection>

      {/* Campaign Configuration */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Select Creatives */}
        <PageSection
          title="Select Ad Creatives"
          description="Choose which ads to run"
        >
          <GradientCard variant="subtle">
            {creatives.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No creatives available. Create some creatives first.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {creatives.slice(0, 6).map((creative) => (
                  <div
                    key={creative.id}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedCreatives.includes(creative.id)
                        ? 'border-primary shadow-md'
                        : 'border-border hover:border-primary/50'
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
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </GradientCard>
        </PageSection>

        {/* Select Target Audiences */}
        <PageSection
          title="Target Customer Profiles"
          description="Who should see your ads"
        >
          <GradientCard variant="subtle">
            {profiles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No customer profiles available.
              </p>
            ) : (
              <div className="space-y-2">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedProfiles.includes(profile.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
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
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {selectedProfiles.includes(profile.id) ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <div className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{profile.name}</p>
                        <p className="text-xs text-muted-foreground">{profile.title}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GradientCard>
        </PageSection>
      </div>

      {/* Landing Page URL */}
      <PageSection
        title="Landing Page"
        description="Where should we send the traffic?"
      >
        <GradientCard variant="subtle">
          <div className="flex gap-3">
            <Input
              type="url"
              placeholder="https://yourwebsite.com/landing-page"
              value={landingUrl}
              onChange={(e) => setLandingUrl(e.target.value)}
              className="flex-1 bg-background"
            />
            <Button variant="outline" className="gap-2" disabled title="Landing page preview coming soon">
              <ExternalLink className="h-4 w-4" />
              Preview
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            This will be your Meta ad destination URL
          </p>
        </GradientCard>
      </PageSection>

      {/* Create Campaign Button */}
      <div className="flex justify-end pt-8">
        <Button
          onClick={handleCreateCampaign}
          disabled={!landingUrl.trim() || selectedCreatives.length === 0 || isCreatingCheckout}
          size="lg"
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
    </PageContainer>
  )
}
