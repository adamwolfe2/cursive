/**
 * AI Studio - Knowledge Base Page
 * Display AI-generated company intelligence
 */

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { GradientCard, GradientBadge } from '@/components/ui/gradient-card'
import { PageContainer, PageHeader, PageSection } from '@/components/layout/page-container'
import { PageLoading } from '@/components/ui/loading-states'
import { EmptyState } from '@/components/ui/empty-states'
import { ArrowLeft, ArrowRight, BookOpen, Target, Megaphone, MessageSquare, XCircle } from 'lucide-react'

interface KnowledgeBase {
  company_overview: string
  products_services: {
    name: string
    description: string
    target_audience: string
  }[]
  target_audience: string
  value_proposition: string[]
  brand_voice: {
    tone: string
    energy_level: string
    communication_style: string
  }
  key_messages: string[]
}

interface BrandWorkspace {
  id: string
  name: string
  url: string
  logo_url: string | null
  knowledge_base: KnowledgeBase | null
  extraction_status: string
}

export default function KnowledgePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get('workspace')

  const [workspace, setWorkspace] = useState<BrandWorkspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) {
      router.push('/ai-studio')
      return
    }
    fetchWorkspace()
  }, [workspaceId])

  async function fetchWorkspace() {
    try {
      const response = await fetch('/api/ai-studio/workspaces')
      const data = await response.json()
      const found = data.workspaces?.find((w: BrandWorkspace) => w.id === workspaceId)
      setWorkspace(found || null)
    } catch (error) {
      console.error('Failed to load workspace:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <PageLoading message="Loading knowledge base..." />
  }

  if (!workspace || !workspace.knowledge_base) {
    return (
      <PageContainer>
        <EmptyState
          icon={XCircle}
          title="Knowledge Base Not Found"
          description="Unable to load the knowledge base for this workspace."
          action={{
            label: 'Back to AI Studio',
            onClick: () => router.push('/ai-studio')
          }}
        />
      </PageContainer>
    )
  }

  const kb = workspace.knowledge_base

  return (
    <PageContainer maxWidth="wide">
      <div className="mb-6">
        <Button
          onClick={() => router.push(`/ai-studio/branding?workspace=${workspaceId}`)}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Branding
        </Button>
      </div>

      {/* Header */}
      <GradientCard variant="primary" className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Knowledge Base</h1>
                <p className="text-sm text-muted-foreground">{workspace.name}</p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => router.push(`/ai-studio/profiles?workspace=${workspaceId}`)}
            size="lg"
          >
            Next: Customer Profiles
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </GradientCard>

      {/* Company Overview */}
      <PageSection
        title="Company Overview"
        description="AI-generated analysis of your company"
      >
        <GradientCard variant="accent">
          <p className="text-foreground leading-relaxed whitespace-pre-line">
            {kb.company_overview}
          </p>
        </GradientCard>
      </PageSection>

      {/* Products & Services */}
      <PageSection
        title="Products & Services"
        description="Your product lineup and target audiences"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {kb.products_services.map((product, index) => (
            <GradientCard key={index} variant="subtle">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                {product.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
              <div className="pt-3 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Target Audience
                </p>
                <p className="text-sm text-foreground">{product.target_audience}</p>
              </div>
            </GradientCard>
          ))}
        </div>
      </PageSection>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Target Audience */}
        <PageSection
          title="Target Audience"
          description="Who you serve"
        >
          <GradientCard variant="subtle">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <p className="text-foreground leading-relaxed">
                {kb.target_audience}
              </p>
            </div>
          </GradientCard>
        </PageSection>

        {/* Brand Voice */}
        <PageSection
          title="Brand Voice"
          description="How you communicate"
        >
          <GradientCard variant="subtle">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Tone
                    </p>
                    <p className="text-sm text-foreground">{kb.brand_voice.tone}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Energy Level
                    </p>
                    <p className="text-sm text-foreground">{kb.brand_voice.energy_level}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Communication Style
                    </p>
                    <p className="text-sm text-foreground">{kb.brand_voice.communication_style}</p>
                  </div>
                </div>
              </div>
            </div>
          </GradientCard>
        </PageSection>
      </div>

      {/* Value Propositions */}
      <PageSection
        title="Value Propositions"
        description="What makes you unique"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kb.value_proposition.map((prop, index) => (
            <GradientCard
              key={index}
              variant="subtle"
              className="hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary text-primary-foreground w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-sm text-foreground leading-relaxed">{prop}</p>
              </div>
            </GradientCard>
          ))}
        </div>
      </PageSection>

      {/* Key Messages */}
      <PageSection
        title="Key Messages"
        description="Core talking points for your brand"
      >
        <GradientCard variant="accent">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              Use these messages in your marketing materials
            </h3>
          </div>
          <ul className="space-y-3">
            {kb.key_messages.map((message, index) => (
              <li key={index} className="flex items-start gap-3 group">
                <span className="text-primary mt-1 text-lg">•</span>
                <p className="text-foreground flex-1 leading-relaxed">{message}</p>
              </li>
            ))}
          </ul>
        </GradientCard>
      </PageSection>
    </PageContainer>
  )
}
