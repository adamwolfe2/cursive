/**
 * AI Studio - Branding Page
 * Stunning visual display of extracted brand DNA
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'

interface BrandData {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
  typography: {
    heading: string
    body: string
  }
  headline: string
  images: string[]
  screenshot?: string
}

interface BrandWorkspace {
  id: string
  name: string
  url: string
  logo_url: string | null
  favicon_url: string | null
  brand_data: BrandData
  extraction_status: 'processing' | 'completed' | 'failed'
  extraction_error: string | null
  created_at: string
}

export default function BrandingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get('workspace')

  const [workspace, setWorkspace] = useState<BrandWorkspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pollAttemptsRef = useRef(0)
  const MAX_POLL_ATTEMPTS = 60 // 60 attempts * 3 seconds = 3 minutes max

  useEffect(() => {
    if (!workspaceId) {
      router.push('/ai-studio')
      return
    }

    fetchWorkspace()
    pollAttemptsRef.current = 0

    const interval = setInterval(() => {
      if (workspace?.extraction_status === 'processing') {
        pollAttemptsRef.current += 1

        if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
          clearInterval(interval)
          setError('Extraction is taking longer than expected. Please refresh the page to check status.')
          return
        }

        fetchWorkspace()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [workspaceId, workspace?.extraction_status])

  async function fetchWorkspace() {
    try {
      const response = await fetch('/api/ai-studio/workspaces')
      const data = await response.json()

      const found = data.workspaces?.find((w: BrandWorkspace) => w.id === workspaceId)
      if (found) {
        setWorkspace(found)
      } else {
        setError('Workspace not found')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load workspace')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FA]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600 text-lg">Loading brand workspace...</p>
        </div>
      </div>
    )
  }

  if (error || !workspace) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FA]">
        <div className="text-center max-w-md">
          <XCircle className="h-16 w-16 mx-auto text-red-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error || 'Workspace not found'}</p>
          <Button onClick={() => router.push('/ai-studio')} size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to AI Studio
          </Button>
        </div>
      </div>
    )
  }

  if (workspace.extraction_status === 'processing') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FA]">
        <div className="text-center max-w-md">
          <Loader2 className="h-16 w-16 animate-spin mx-auto text-blue-600 mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Analyzing {workspace.name}
          </h2>
          <p className="text-gray-600 mb-4">
            We're extracting your brand DNA from {workspace.url}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              This may take 30-60 seconds. We'll automatically refresh when ready.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (workspace.extraction_status === 'failed') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FA]">
        <div className="text-center max-w-md">
          <XCircle className="h-16 w-16 mx-auto text-red-600 mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Extraction Failed
          </h2>
          <p className="text-gray-600 mb-6">
            {workspace.extraction_error || 'Failed to extract brand DNA'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push('/ai-studio')} variant="outline" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => window.location.reload()} size="lg">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const brandData = workspace.brand_data

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/ai-studio')}
            variant="ghost"
            className="mb-4"
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to AI Studio
          </Button>

          <Card className="p-6 bg-white shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {workspace.logo_url && (
                  <img
                    src={workspace.logo_url}
                    alt={workspace.name}
                    className="h-16 w-16 rounded object-contain bg-gray-50 border border-gray-200 p-2"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {workspace.name}
                  </h1>
                  <p className="text-sm text-gray-600">{workspace.url}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Brand DNA extracted</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => router.push(`/ai-studio/knowledge?workspace=${workspace.id}`)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next: Knowledge Base
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Logo Section */}
        {workspace.logo_url && (
          <Card className="p-6 bg-white shadow-sm border border-gray-200 mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Logo
            </h2>
            <div className="flex items-center justify-center bg-gray-50 rounded-lg p-8 border border-gray-200">
              <img
                src={workspace.logo_url}
                alt={workspace.name}
                className="h-24 w-auto object-contain"
              />
            </div>
          </Card>
        )}

        {/* Typography */}
        <Card className="p-6 bg-white shadow-sm border border-gray-200 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Typography
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Heading Font</p>
              <p
                className="text-3xl font-bold text-gray-900"
                style={{ fontFamily: brandData.typography.heading }}
              >
                {brandData.typography.heading}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Body Font</p>
              <p
                className="text-xl text-gray-900"
                style={{ fontFamily: brandData.typography.body }}
              >
                {brandData.typography.body}
              </p>
            </div>
          </div>
        </Card>

        {/* Colors */}
        <Card className="p-6 bg-white shadow-sm border border-gray-200 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Colors
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(brandData.colors).map(([name, color]) => (
              <div key={name}>
                <div
                  className="h-24 rounded-lg border border-gray-200 shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-900 capitalize">{name}</p>
                  <p className="text-xs font-mono text-gray-600">{color}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Value Proposition */}
        <Card className="p-6 bg-white shadow-sm border border-gray-200 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Value Proposition
          </h2>
          <p className="text-2xl font-bold text-gray-900 leading-tight">
            {brandData.headline}
          </p>
        </Card>

        {/* Website Screenshot */}
        {brandData.screenshot && (
          <Card className="p-6 bg-white shadow-sm border border-gray-200 mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Website Preview
            </h2>
            <div className="rounded-lg overflow-hidden border border-gray-200">
              <img
                src={brandData.screenshot}
                alt="Website screenshot"
                className="w-full"
              />
            </div>
          </Card>
        )}

        {/* Brand Images Gallery */}
        {brandData.images && brandData.images.length > 0 && (
          <Card className="p-6 bg-white shadow-sm border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Brand Imagery
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {brandData.images.slice(0, 8).map((image, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden border border-gray-200 shadow-sm"
                >
                  <img
                    src={image}
                    alt={`Brand image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
