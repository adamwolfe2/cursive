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
  const [activeTab, setActiveTab] = useState('all')

  const hasCampaignsFeature = hasFeature('campaigns')
  const campaignLimit = limits.campaigns

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const params = activeTab !== 'all' ? `?status=${activeTab}&includeUsage=true` : '?includeUsage=true'
        const response = await fetch(`/api/campaigns${params}`)
        if (response.ok) {
          const result = await response.json()
          setCampaigns(result.data || [])
          setUsage(result.usage || null)
        }
      } catch (error) {
        console.error('Failed to fetch campaigns:', error)
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
        <div className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
            <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-zinc-900">Campaigns require a paid plan</h3>
          <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto">
            Create and manage email outreach campaigns to connect with your leads at scale.
            Upgrade to a paid plan to unlock this feature.
          </p>
          {canUpgrade && (
            <Link
              href="/settings/billing"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              Upgrade to Starter
            </Link>
          )}
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
      {atLimit && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <svg className="h-5 w-5 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-amber-800">Campaign limit reached</h3>
              <p className="mt-1 text-sm text-amber-700">
                You've reached your {tierName} plan limit of {usage?.limit} campaigns.
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
