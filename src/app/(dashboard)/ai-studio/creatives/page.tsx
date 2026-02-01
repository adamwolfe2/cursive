/**
 * AI Studio - Creatives Page
 * Generate and manage ad creatives (VIBIZ-inspired UI)
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
  ArrowRight,
  Image as ImageIcon,
  User,
  Monitor,
  Zap,
  Megaphone,
  ArrowUp,
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 pb-64">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <Button
              onClick={() => router.push(`/ai-studio/offers?workspace=${workspaceId}`)}
              variant="ghost"
              size="sm"
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Offers
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Creatives</h1>
            <p className="text-sm text-gray-500">AI-generated ad creatives</p>
          </div>

          <Button
            onClick={() => router.push(`/ai-studio/campaigns?workspace=${workspaceId}`)}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            Next: Campaigns
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Error Message */}
        {generationError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{generationError}</p>
            </div>
            <button
              onClick={() => setGenerationError(null)}
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Creatives Gallery */}
        <div>
          {creatives.length === 0 ? (
            <Card className="p-12 text-center bg-white shadow-sm border border-gray-200">
              <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No creatives yet
              </h3>
              <p className="text-gray-600">
                Use the generator below to create your first ad creative
              </p>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {creatives.map((creative) => (
                <Card
                  key={creative.id}
                  className="overflow-hidden bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="relative aspect-square bg-gray-50">
                    <img
                      src={creative.image_url}
                      alt={creative.prompt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {creative.prompt}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {creative.style_preset && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded border border-blue-200">
                          {creative.style_preset}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200">
                        {FORMATS.find((f) => f.value === creative.format)?.label || creative.format}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

