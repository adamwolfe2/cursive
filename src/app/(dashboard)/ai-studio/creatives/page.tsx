/**
 * AI Studio - Creatives Page
 * Generate and manage ad creatives
 */

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GradientCard, GradientBadge } from '@/components/ui/gradient-card'
import { PageContainer, PageHeader, PageSection } from '@/components/layout/page-container'
import { PageLoading } from '@/components/ui/loading-states'
import { EmptyState } from '@/components/ui/empty-states'
import {
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  Sparkles,
  XCircle,
} from 'lucide-react'

interface Creative {
  id: string
  image_url: string
  prompt: string
  style_preset: string | null
  format: string
  created_at: string
  customer_profiles?: { name: string; title: string }
  offers?: { name: string }
}

interface CustomerProfile {
  id: string
  name: string
  title: string
}

interface Offer {
  id: string
  name: string
  description: string
}

const STYLE_PRESETS = [
  'Write with Elegance',
  'Flow of Creativity',
  'Handcrafted Perfection',
  'Timeless Style',
]

const FORMATS = [
  { value: 'square', label: 'Square (1:1)', icon: '1x' },
  { value: 'story', label: 'Story (9:16)', icon: '9:16' },
  { value: 'landscape', label: 'Landscape (16:9)', icon: '16:9' },
]

export default function CreativesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get('workspace')

  const [creatives, setCreatives] = useState<Creative[]>([])
  const [profiles, setProfiles] = useState<CustomerProfile[]>([])
  const [offers, setOffers] = useState<Offer[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Generation inputs
  const [selectedStyle, setSelectedStyle] = useState<string>(STYLE_PRESETS[0])
  const [prompt, setPrompt] = useState('')
  const [selectedIcp, setSelectedIcp] = useState<string>('')
  const [selectedOffer, setSelectedOffer] = useState<string>('')
  const [selectedFormat, setSelectedFormat] = useState<string>('square')

  useEffect(() => {
    if (!workspaceId) {
      router.push('/ai-studio')
      return
    }
    fetchData()
  }, [workspaceId])

  async function fetchData() {
    try {
      const [creativesRes, profilesRes, offersRes] = await Promise.all([
        fetch(`/api/ai-studio/creatives?workspace=${workspaceId}`),
        fetch(`/api/ai-studio/profiles?workspace=${workspaceId}`),
        fetch(`/api/ai-studio/offers?workspace=${workspaceId}`),
      ])

      const [creativesData, profilesData, offersData] = await Promise.all([
        creativesRes.json(),
        profilesRes.json(),
        offersRes.json(),
      ])

      setCreatives(creativesData.creatives || [])
      setProfiles(profilesData.profiles || [])
      setOffers(offersData.offers || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return

    setIsGenerating(true)
    setGenerationError(null)
    try {
      const response = await fetch('/api/ai-studio/creatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          prompt: prompt.trim(),
          stylePreset: selectedStyle,
          format: selectedFormat,
          icpId: selectedIcp || undefined,
          offerId: selectedOffer || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate creative')
      }

      // Add new creative to the list
      setCreatives([data.creative, ...creatives])
      setPrompt('')
    } catch (error: any) {
      setGenerationError(error.message || 'Failed to generate creative')
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return <PageLoading message="Loading creatives..." />
  }

  return (
    <PageContainer maxWidth="wide">
      <div className="mb-6">
        <Button
          onClick={() => router.push(`/ai-studio/offers?workspace=${workspaceId}`)}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Offers
        </Button>
      </div>

      {/* Header */}
      <GradientCard variant="primary" className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Creatives</h1>
              <p className="text-sm text-muted-foreground">AI-generated ad creatives</p>
            </div>
          </div>

          <Button
            onClick={() => router.push(`/ai-studio/campaigns?workspace=${workspaceId}`)}
            size="lg"
          >
            Next: Campaigns
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </GradientCard>

      {/* Error Message */}
      {generationError && (
        <GradientCard className="mb-6 border-destructive/50">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-destructive">{generationError}</p>
            </div>
            <button
              onClick={() => setGenerationError(null)}
              className="text-destructive hover:text-destructive/80"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </GradientCard>
      )}

      {/* Generation Form */}
      <PageSection
        title="Generate New Creative"
        description="Create on-brand ad creatives with AI"
      >
        <GradientCard variant="accent">
          <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="space-y-6">
            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Creative Prompt
              </label>
              <Input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the creative you want to generate..."
                disabled={isGenerating}
                className="bg-background"
              />
            </div>

            {/* Options Grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Style Preset */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Style Preset
                </label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  disabled={isGenerating}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {STYLE_PRESETS.map((style) => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Format
                </label>
                <div className="flex gap-2">
                  {FORMATS.map((format) => (
                    <button
                      key={format.value}
                      type="button"
                      onClick={() => setSelectedFormat(format.value)}
                      disabled={isGenerating}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedFormat === format.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground border border-border hover:bg-muted'
                      }`}
                    >
                      {format.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Profile */}
              {profiles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Target Profile (Optional)
                  </label>
                  <select
                    value={selectedIcp}
                    onChange={(e) => setSelectedIcp(e.target.value)}
                    disabled={isGenerating}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select profile...</option>
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name} - {profile.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Offer */}
              {offers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Offer (Optional)
                  </label>
                  <select
                    value={selectedOffer}
                    onChange={(e) => setSelectedOffer(e.target.value)}
                    disabled={isGenerating}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select offer...</option>
                    {offers.map((offer) => (
                      <option key={offer.id} value={offer.id}>{offer.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                size="lg"
                className="gap-2"
              >
                {isGenerating ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Creative
                  </>
                )}
              </Button>
            </div>
          </form>
        </GradientCard>
      </PageSection>

      {/* Creatives Gallery */}
      <PageSection
        title={creatives.length > 0 ? `Your Creatives (${creatives.length})` : 'Your Creatives'}
        description="Previously generated ad creatives"
      >
        {creatives.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="No creatives yet"
            description="Use the generator above to create your first ad creative"
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {creatives.map((creative) => (
              <GradientCard
                key={creative.id}
                variant="subtle"
                noPadding
                className="overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="relative aspect-square bg-muted">
                  <img
                    src={creative.image_url}
                    alt={creative.prompt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-foreground mb-3 line-clamp-2">
                    {creative.prompt}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {creative.style_preset && (
                      <GradientBadge className="text-xs">
                        {creative.style_preset}
                      </GradientBadge>
                    )}
                    <GradientBadge className="text-xs">
                      {FORMATS.find((f) => f.value === creative.format)?.label || creative.format}
                    </GradientBadge>
                  </div>
                </div>
              </GradientCard>
            ))}
          </div>
        )}
      </PageSection>
    </PageContainer>
  )
}

