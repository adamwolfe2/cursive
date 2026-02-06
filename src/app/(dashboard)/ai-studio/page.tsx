/**
 * AI Studio - Home Page
 * Brand extraction with Cursive design system
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GradientCard, GradientButton } from '@/components/ui/gradient-card'
import { PageContainer, PageHeader } from '@/components/layout/page-container'
import { PageLoading } from '@/components/ui/loading-states'
import { EmptyState } from '@/components/ui/empty-states'
import {
  Globe,
  Check,
  Image as ImageIcon,
  Palette,
  Type,
  MessageSquare,
  Wand2,
  ArrowRight,
  ChevronRight,
  XCircle,
  Sparkles,
  Clock,
  Mail,
} from 'lucide-react'
import Link from 'next/link'
import { getServiceLink } from '@/lib/stripe/payment-links'

interface BrandWorkspace {
  id: string
  name: string
  url: string
  logo_url: string | null
  extraction_status: 'processing' | 'completed' | 'failed'
  created_at: string
}

interface LoadingStep {
  id: string
  label: string
  icon: any
  status: 'pending' | 'loading' | 'complete'
}

const loadingSteps: LoadingStep[] = [
  { id: '1', label: 'Capturing website', icon: Globe, status: 'pending' },
  { id: '2', label: 'Extracting screenshots', icon: ImageIcon, status: 'pending' },
  { id: '3', label: 'Analyzing brand colors', icon: Palette, status: 'pending' },
  { id: '4', label: 'Identifying typography', icon: Type, status: 'pending' },
  { id: '5', label: 'Understanding brand voice', icon: MessageSquare, status: 'pending' },
  { id: '6', label: 'Generating insights', icon: Wand2, status: 'pending' },
]

export default function AIStudioPage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<BrandWorkspace[]>([])
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true)
  const [userName, setUserName] = useState<string>('there')
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [currentLoadingSteps, setLoadingSteps] = useState<LoadingStep[]>(loadingSteps)

  useEffect(() => {
    fetchWorkspaces()
    fetchUserName()
  }, [])

  async function fetchUserName() {
    try {
      const response = await fetch('/api/auth/user')
      const data = await response.json()
      if (data.user?.full_name) {
        const firstName = data.user.full_name.split(' ')[0]
        setUserName(firstName)
      }
    } catch (error) {
      console.error('Failed to fetch user name:', error)
    }
  }

  async function fetchWorkspaces() {
    try {
      const response = await fetch('/api/ai-studio/workspaces')
      const data = await response.json()
      setWorkspaces(data.workspaces || [])
    } catch (error) {
      console.error('Failed to load workspaces:', error)
    } finally {
      setIsLoadingWorkspaces(false)
    }
  }

  async function handleExtract() {
    if (!url.trim()) return

    setIsExtracting(true)
    setExtractionError(null)
    setLoadingSteps(steps => steps.map(s => ({ ...s, status: 'pending' as const })))
    setScreenshot(null)

    let pollInterval: NodeJS.Timeout | null = null
    let timeoutId: NodeJS.Timeout | null = null

    try {
      const response = await fetch('/api/ai-studio/brand/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract brand DNA')
      }

      const workspaceId = data.workspaceId

      let currentStep = 0
      let consecutiveErrors = 0
      const MAX_CONSECUTIVE_ERRORS = 3

      pollInterval = setInterval(async () => {
        try {
          const progressRes = await fetch('/api/ai-studio/workspaces')

          if (!progressRes.ok) {
            throw new Error(`API returned ${progressRes.status}`)
          }

          const progressData = await progressRes.json()
          const workspace = progressData.workspaces?.find((w: any) => w.id === workspaceId)

          if (!workspace) {
            return
          }

          consecutiveErrors = 0

          if (workspace.brand_data?.screenshot && !screenshot) {
            setScreenshot(workspace.brand_data.screenshot)
          }

          if (workspace.extraction_status === 'processing') {
            if (currentStep < currentLoadingSteps.length) {
              setLoadingSteps(prev => prev.map((step, idx) =>
                idx < currentStep ? { ...step, status: 'complete' as const } :
                idx === currentStep ? { ...step, status: 'loading' as const } :
                step
              ))
              currentStep++
            }
          } else if (workspace.extraction_status === 'completed') {
            setLoadingSteps(prev => prev.map(s => ({ ...s, status: 'complete' as const })))
            if (pollInterval) clearInterval(pollInterval)
            if (timeoutId) clearTimeout(timeoutId)

            setTimeout(() => {
              router.push(`/ai-studio/branding?workspace=${workspaceId}`)
            }, 1000)
          } else if (workspace.extraction_status === 'failed') {
            if (pollInterval) clearInterval(pollInterval)
            if (timeoutId) clearTimeout(timeoutId)
            setIsExtracting(false)
            setExtractionError(workspace.extraction_error || 'Extraction failed')
          }
        } catch (error) {
          console.error('Polling error:', error)
          consecutiveErrors++

          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            if (pollInterval) clearInterval(pollInterval)
            if (timeoutId) clearTimeout(timeoutId)
            setIsExtracting(false)
            setExtractionError('Unable to check extraction status. Please refresh and try again.')
          }
        }
      }, 2000)

      timeoutId = setTimeout(() => {
        if (pollInterval) clearInterval(pollInterval)
        setIsExtracting(false)
        setExtractionError('Extraction timed out. The API may be overloaded. Please try again.')
      }, 30000)

    } catch (error: any) {
      if (pollInterval) clearInterval(pollInterval)
      if (timeoutId) clearTimeout(timeoutId)
      setExtractionError(error.message || 'Failed to extract brand DNA')
      setIsExtracting(false)
    }
  }

  if (isLoadingWorkspaces) {
    return <PageLoading message="Loading your brand workspaces..." />
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome back, ${userName}!`}
        description="Enter your website to create on-brand content, or select a workspace."
      />

      {/* URL Input Section */}
      <GradientCard variant="primary" className="mb-8">
        <form onSubmit={(e) => { e.preventDefault(); handleExtract(); }} className="space-y-4">
          <div className="relative">
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://stripe.com"
              disabled={isExtracting}
              className="h-14 text-lg pr-32 bg-background"
            />
            <div className="absolute right-2 top-2">
              <GradientButton
                type="submit"
                disabled={!url.trim() || isExtracting}
                className="h-10"
              >
                {isExtracting ? 'Analyzing...' : 'Extract Brand'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </GradientButton>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            We'll analyze your brand and generate content, or select a workspace.
          </p>
        </form>
      </GradientCard>

      {/* Extraction Loading State */}
      {isExtracting && (
        <GradientCard variant="subtle" className="mb-8">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Analyzing your brand...
              </h3>
              <p className="text-sm text-muted-foreground">
                This usually takes 30-90 seconds
              </p>
            </div>

            <div className="grid gap-3">
              {currentLoadingSteps.map((step) => (
                <div
                  key={step.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background/50"
                >
                  <div className={`
                    flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center
                    ${step.status === 'complete' ? 'bg-primary/20 text-primary' :
                      step.status === 'loading' ? 'bg-primary/10 text-primary' :
                      'bg-muted text-muted-foreground'}
                  `}>
                    {step.status === 'complete' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span className={`
                    text-sm font-medium
                    ${step.status === 'complete' ? 'text-foreground' :
                      step.status === 'loading' ? 'text-primary' :
                      'text-muted-foreground'}
                  `}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {screenshot && (
              <div className="rounded-lg overflow-hidden border border-border">
                <img src={screenshot} alt="Website preview" className="w-full" />
              </div>
            )}
          </div>
        </GradientCard>
      )}

      {/* Error State */}
      {extractionError && (
        <GradientCard className="mb-8 border-destructive/50">
          <div className="flex gap-3">
            <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-destructive mb-1">Extraction Failed</h4>
              <p className="text-sm text-muted-foreground">{extractionError}</p>
            </div>
          </div>
        </GradientCard>
      )}

      {/* Existing Workspaces */}
      {workspaces.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Your Brand Workspaces</h2>
            <span className="text-sm text-muted-foreground">{workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
              <GradientCard
                key={workspace.id}
                variant="subtle"
                className="cursor-pointer hover:shadow-md transition-all duration-200 group"
                noPadding
              >
                <div
                  onClick={() => router.push(`/ai-studio/branding?workspace=${workspace.id}`)}
                  className="p-6"
                >
                  <div className="flex items-start gap-3 mb-4">
                    {workspace.logo_url ? (
                      <img
                        src={workspace.logo_url}
                        alt={workspace.name}
                        className="h-12 w-12 rounded-lg object-contain bg-background border border-border p-2"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-1 truncate group-hover:text-primary transition-colors">
                        {workspace.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">{workspace.url}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    {workspace.extraction_status === 'completed' && (
                      <div className="flex items-center gap-1 text-primary">
                        <Check className="h-3 w-3" />
                        <span>Ready</span>
                      </div>
                    )}
                    {workspace.extraction_status === 'processing' && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </GradientCard>
            ))}
          </div>

          {/* Service Tier Upsell */}
          <GradientCard variant="subtle" className="mt-8 border-primary/20">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Ready to launch campaigns?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  We'll build and run email campaigns using your brand voice. Done-for-you outreach that converts.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={getServiceLink('outbound')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors"
                  >
                    Explore Outbound
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <Link
                    href="/services"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-border hover:bg-muted text-foreground font-medium rounded-lg transition-colors"
                  >
                    View All Services
                  </Link>
                </div>
              </div>
            </div>
          </GradientCard>
        </div>
      ) : !isExtracting && (
        <EmptyState
          icon={Sparkles}
          title="No brand workspaces yet"
          description="Enter a website URL above to extract brand DNA and start creating on-brand content."
        />
      )}
    </PageContainer>
  )
}
