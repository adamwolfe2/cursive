/**
 * AI Studio - Branding Page
 * Visual display of extracted brand DNA with Cursive design
 */

'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { GradientCard, GradientBadge } from '@/components/ui/gradient-card'
import { PageContainer, PageHeader, PageSection } from '@/components/layout/page-container'
import { PageLoading } from '@/components/ui/loading-states'
import { EmptyState } from '@/components/ui/empty-states'
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Copy, Check } from 'lucide-react'

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
  tagline?: string
  images: string[]
  hero_images?: string[]
  product_images?: string[]
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

function BrandingPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get('workspace')

  const [workspace, setWorkspace] = useState<BrandWorkspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  const pollAttemptsRef = useRef(0)
  const MAX_POLL_ATTEMPTS = 60

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
          setError('Extraction is taking longer than expected. Please refresh the page.')
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

  async function copyColor(color: string) {
    await navigator.clipboard.writeText(color)
    setCopiedColor(color)
    setTimeout(() => setCopiedColor(null), 2000)
  }

  if (isLoading) {
    return <PageLoading message="Loading brand workspace..." />
  }

  if (error || !workspace) {
    return (
      <PageContainer>
        <EmptyState
          icon={XCircle}
          title="Workspace Not Found"
          description={error || 'Unable to load this brand workspace.'}
          action={{
            label: 'Back to AI Studio',
            onClick: () => router.push('/ai-studio')
          }}
        />
      </PageContainer>
    )
  }

  if (workspace.extraction_status === 'processing') {
    return (
      <PageContainer>
        <GradientCard variant="primary" className="text-center py-12">
          <div className="animate-pulse mb-6">
            <div className="h-16 w-16 bg-primary/20 rounded-full mx-auto"></div>
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            Analyzing {workspace.name}
          </h2>
          <p className="text-muted-foreground mb-4">
            Extracting brand DNA from {workspace.url}
          </p>
          <GradientBadge>This may take 30-60 seconds</GradientBadge>
        </GradientCard>
      </PageContainer>
    )
  }

  if (workspace.extraction_status === 'failed') {
    return (
      <PageContainer>
        <EmptyState
          icon={XCircle}
          title="Extraction Failed"
          description={workspace.extraction_error || 'Failed to extract brand DNA from this website.'}
          action={{
            label: 'Try Again',
            onClick: () => window.location.reload()
          }}
          secondaryAction={{
            label: 'Back',
            onClick: () => router.push('/ai-studio')
          }}
        />
      </PageContainer>
    )
  }

  const brandData = workspace.brand_data

  return (
    <PageContainer maxWidth="wide">
      <div className="mb-6">
        <Button
          onClick={() => router.push('/ai-studio')}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to AI Studio
        </Button>
      </div>

      {/* Header */}
      <GradientCard variant="primary" className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {workspace.logo_url && (
              <img
                src={workspace.logo_url}
                alt={workspace.name}
                className="h-16 w-16 rounded-lg object-contain bg-background border border-border p-2"
              />
            )}
            <div>
              <h1 className="text-2xl font-semibold text-foreground mb-1">
                {workspace.name}
              </h1>
              <p className="text-sm text-muted-foreground">{workspace.url}</p>
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary font-medium">Brand DNA extracted</span>
              </div>
            </div>
          </div>

          <Button
            onClick={() => router.push(`/ai-studio/knowledge?workspace=${workspace.id}`)}
            size="lg"
          >
            Next: Knowledge Base
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </GradientCard>

      {/* Colors */}
      <PageSection title="Brand Colors" description="Your brand's color palette">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(brandData.colors).map(([name, color]) => (
            <GradientCard
              key={name}
              variant="subtle"
              className="cursor-pointer group hover:shadow-md transition-all"
              noPadding
            >
              <div onClick={() => copyColor(color)}>
                <div
                  className="h-32 rounded-t-lg"
                  style={{ backgroundColor: color }}
                />
                <div className="p-4">
                  <p className="text-sm font-semibold text-foreground capitalize mb-1">
                    {name}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono text-muted-foreground">{color}</p>
                    {copiedColor === color ? (
                      <Check className="h-3 w-3 text-primary" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                </div>
              </div>
            </GradientCard>
          ))}
        </div>
      </PageSection>

      {/* Typography */}
      <PageSection title="Typography" description="Fonts used in your brand">
        <div className="grid sm:grid-cols-2 gap-4">
          <GradientCard variant="subtle">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Heading Font
            </p>
            <p
              className="text-3xl font-bold text-foreground"
              style={{ fontFamily: brandData.typography.heading }}
            >
              {brandData.typography.heading}
            </p>
          </GradientCard>

          <GradientCard variant="subtle">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Body Font
            </p>
            <p
              className="text-xl text-foreground"
              style={{ fontFamily: brandData.typography.body }}
            >
              {brandData.typography.body}
            </p>
          </GradientCard>
        </div>
      </PageSection>

      {/* Messaging */}
      <PageSection title="Brand Messaging" description="Your value proposition and tagline">
        <GradientCard variant="accent">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Main Headline
              </p>
              <p className="text-2xl font-semibold text-foreground leading-tight">
                {brandData.headline}
              </p>
            </div>
            {brandData.tagline && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Tagline
                </p>
                <p className="text-lg text-foreground">
                  {brandData.tagline}
                </p>
              </div>
            )}
          </div>
        </GradientCard>
      </PageSection>

      {/* Logo */}
      {workspace.logo_url && (
        <PageSection title="Logo" description="Your brand's primary logo">
          <GradientCard variant="subtle">
            <div className="flex items-center justify-center bg-background rounded-lg p-12 border border-border">
              <img
                src={workspace.logo_url}
                alt={workspace.name}
                className="h-32 w-auto object-contain"
              />
            </div>
          </GradientCard>
        </PageSection>
      )}

      {/* Website Screenshot */}
      {brandData.screenshot && (
        <PageSection title="Website Preview" description="Homepage screenshot">
          <GradientCard variant="subtle" noPadding>
            <div className="rounded-lg overflow-hidden">
              <img
                src={brandData.screenshot}
                alt="Website screenshot"
                className="w-full"
              />
            </div>
          </GradientCard>
        </PageSection>
      )}

      {/* Brand Images */}
      {brandData.images && brandData.images.length > 0 && (
        <PageSection title="Brand Imagery" description="Visual assets from your brand">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {brandData.images.slice(0, 8).map((image, index) => (
              <GradientCard
                key={index}
                variant="subtle"
                noPadding
                className="aspect-square overflow-hidden"
              >
                <img
                  src={image}
                  alt={`Brand image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </GradientCard>
            ))}
          </div>
        </PageSection>
      )}
    </PageContainer>
  )
}

export default function BrandingPage() {
  return (
    <Suspense fallback={<div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>}>
      <BrandingPageInner />
    </Suspense>
  )
}
