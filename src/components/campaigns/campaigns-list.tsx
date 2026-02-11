'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useTier } from '@/lib/hooks/use-tier'
import { InlineFeatureLock } from '@/components/gates/FeatureLock'
import { ServiceLimitBanner } from '@/components/limits/ServiceLimitBanner'

interface Campaign {
  id: string
  name: string
  description?: string
  status: 'draft' | 'pending_review' | 'approved' | 'active' | 'paused' | 'completed' | 'cancelled'
  sequence_steps: number
  created_at: string
  scheduled_start_at?: string
}

interface CampaignUsage {
  used: number
  limit: number | null
  withinLimit: boolean
}

const STATUS_COLORS: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  draft: { variant: 'secondary', label: 'Draft' },
  pending_review: { variant: 'default', label: 'Pending Review' },
  approved: { variant: 'outline', label: 'Approved' },
  active: { variant: 'default', label: 'Active' },
  paused: { variant: 'secondary', label: 'Paused' },
  completed: { variant: 'outline', label: 'Completed' },
  cancelled: { variant: 'destructive', label: 'Cancelled' },
}

export function CampaignsList() {
  const router = useRouter()
  const { hasFeature, limits, tierName, canUpgrade, isLoading: tierLoading } = useTier()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [usage, setUsage] = useState<CampaignUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  const hasCampaignsFeature = hasFeature('campaigns')
  const campaignLimit = limits.campaigns

  useEffect(() => {
    async function fetchCampaigns() {
      setLoading(true)
      setError(null)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      try {
        const params = activeTab !== 'all' ? `?status=${activeTab}&includeUsage=true` : '?includeUsage=true'
        const response = await fetch(`/api/campaigns${params}`, {
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to load campaigns (HTTP ${response.status})`)
        }

        const result = await response.json()
        setCampaigns(result.data || [])
        setUsage(result.usage || null)
      } catch (error) {
        clearTimeout(timeoutId)
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            setError('Request timed out. Please try again.')
          } else {
            setError(error.message)
          }
        } else {
          setError('Failed to load campaigns')
        }

        // Still show empty state on error
        setCampaigns([])
      } finally {
        setLoading(false)
      }
    }
    fetchCampaigns()
  }, [activeTab])

  // Check if at limit
  const atLimit = usage && usage.limit !== null && usage.used >= usage.limit

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // If campaigns feature is not available, show upgrade prompt
  if (!tierLoading && !hasCampaignsFeature) {
    return (
      <PageContainer>
        <PageHeader
          title="Campaigns"
          description="Manage your email outreach campaigns"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Campaigns' },
          ]}
        />
        <InlineFeatureLock
          feature="campaigns"
          requiredTier="Cursive Outbound"
          requiredTierSlug="cursive-outbound"
        />
        <div className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-12 text-center opacity-50 pointer-events-none">
          <EmptyState
            icon={() => (
              <svg className="h-12 w-12 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
            title="No campaigns yet"
            description="Create your first email outreach campaign"
          />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Campaigns"
        description="Manage your email outreach campaigns"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Campaigns' },
        ]}
        actions={
          <div className="flex items-center gap-4">
            {/* Usage indicator */}
            {usage && (
              <div className="text-sm text-zinc-500">
                <span className="font-medium text-zinc-700">{usage.used}</span>
                {usage.limit !== null ? (
                  <span> / {usage.limit} campaigns</span>
                ) : (
                  <span> campaigns</span>
                )}
              </div>
            )}
            <Button
              onClick={() => router.push('/campaigns/new')}
              disabled={atLimit}
              title={atLimit ? 'Campaign limit reached' : undefined}
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Campaign
            </Button>
          </div>
        }
      />

      {/* Limit warning */}
      <ServiceLimitBanner resource="campaigns" threshold={80} dismissible />

      {atLimit && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Campaign limit reached</h3>
              <p className="mt-1 text-sm text-red-700">
                You&apos;ve reached your {tierName} plan limit of {usage?.limit} campaigns.
                {canUpgrade && ' Upgrade to create more campaigns.'}
              </p>
              {canUpgrade && (
                <Link
                  href="/settings/billing"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-amber-800 hover:text-amber-900"
                >
                  Upgrade Plan
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="pending_review">Pending Review</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                  <div className="h-3 bg-muted rounded w-1/2 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="mt-4 text-sm font-medium text-red-900">Failed to load campaigns</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          ) : campaigns.length === 0 ? (
            <EmptyState
              title="No campaigns yet"
              description="Create your first campaign to start reaching out to prospects."
              action={
                <Button onClick={() => router.push('/campaigns/new')}>Create Campaign</Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <Card
                  key={campaign.id}
                  className="p-6 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => router.push(`/campaigns/${campaign.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-foreground truncate pr-2">{campaign.name}</h3>
                    <Badge variant={STATUS_COLORS[campaign.status]?.variant || 'secondary'}>
                      {STATUS_COLORS[campaign.status]?.label || campaign.status}
                    </Badge>
                  </div>

                  {campaign.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {campaign.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{campaign.sequence_steps} email steps</span>
                    <span>Created {formatDate(campaign.created_at)}</span>
                  </div>

                  {campaign.scheduled_start_at && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Scheduled: {formatDate(campaign.scheduled_start_at)}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
