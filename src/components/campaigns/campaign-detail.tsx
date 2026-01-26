'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface Campaign {
  id: string
  name: string
  description?: string
  status: string
  sequence_steps: number
  days_between_steps: number[]
  matching_mode: string
  target_industries?: string[]
  target_company_sizes?: string[]
  target_seniorities?: string[]
  target_regions?: string[]
  value_propositions: Array<{ id: string; name: string; description: string }>
  trust_signals: Array<{ id: string; type: string; content: string }>
  created_at: string
  scheduled_start_at?: string
}

interface CampaignDetailProps {
  campaignId: string
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

export function CampaignDetail({ campaignId }: CampaignDetailProps) {
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCampaign() {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}`)
        if (response.ok) {
          const result = await response.json()
          setCampaign(result.data)
        } else {
          setError('Campaign not found')
        }
      } catch (err) {
        setError('Failed to load campaign')
      } finally {
        setLoading(false)
      }
    }
    fetchCampaign()
  }, [campaignId])

  const submitForReview = async () => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit' }),
      })

      if (response.ok) {
        const result = await response.json()
        setCampaign(result.data)
      } else {
        const result = await response.json()
        setError(result.error || 'Failed to submit for review')
      }
    } catch (err) {
      setError('Failed to submit for review')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </PageContainer>
    )
  }

  if (error || !campaign) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-destructive">{error || 'Campaign not found'}</p>
          <Button variant="outline" onClick={() => router.push('/campaigns')} className="mt-4">
            Back to Campaigns
          </Button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={campaign.name}
        description={campaign.description}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Campaigns', href: '/campaigns' },
          { label: campaign.name },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Badge variant={STATUS_COLORS[campaign.status]?.variant || 'secondary'} className="text-sm">
              {STATUS_COLORS[campaign.status]?.label || campaign.status}
            </Badge>
            {campaign.status === 'draft' && (
              <Button onClick={submitForReview} loading={submitting}>
                Submit for Review
              </Button>
            )}
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Campaign Settings */}
            <Card className="p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">Campaign Settings</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Email Steps</dt>
                  <dd className="text-sm font-medium">{campaign.sequence_steps}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Template Matching</dt>
                  <dd className="text-sm font-medium capitalize">{campaign.matching_mode}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Total Duration</dt>
                  <dd className="text-sm font-medium">
                    {campaign.days_between_steps.reduce((sum, d) => sum + d, 0)} days
                  </dd>
                </div>
                {campaign.scheduled_start_at && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Scheduled Start</dt>
                    <dd className="text-sm font-medium">
                      {new Date(campaign.scheduled_start_at).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>

            {/* Targeting */}
            <Card className="p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">Targeting</h3>
              {(!campaign.target_industries?.length &&
                !campaign.target_company_sizes?.length &&
                !campaign.target_seniorities?.length &&
                !campaign.target_regions?.length) ? (
                <p className="text-sm text-muted-foreground">No targeting filters (all leads)</p>
              ) : (
                <div className="space-y-3">
                  {campaign.target_industries && campaign.target_industries.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Industries</p>
                      <div className="flex flex-wrap gap-1">
                        {campaign.target_industries.map((i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {campaign.target_company_sizes && campaign.target_company_sizes.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Company Sizes</p>
                      <div className="flex flex-wrap gap-1">
                        {campaign.target_company_sizes.map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {campaign.target_seniorities && campaign.target_seniorities.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Seniorities</p>
                      <div className="flex flex-wrap gap-1">
                        {campaign.target_seniorities.map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {campaign.target_regions && campaign.target_regions.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Regions</p>
                      <div className="flex flex-wrap gap-1">
                        {campaign.target_regions.map((r) => (
                          <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Value Propositions */}
            <Card className="p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">Value Propositions</h3>
              {campaign.value_propositions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No value propositions specified</p>
              ) : (
                <ul className="space-y-2">
                  {campaign.value_propositions.map((vp) => (
                    <li key={vp.id} className="text-sm">
                      <strong className="text-foreground">{vp.name}:</strong>{' '}
                      <span className="text-muted-foreground">{vp.description}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Trust Signals */}
            <Card className="p-6">
              <h3 className="text-sm font-medium text-foreground mb-4">Trust Signals</h3>
              {campaign.trust_signals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No trust signals specified</p>
              ) : (
                <ul className="space-y-2">
                  {campaign.trust_signals.map((ts) => (
                    <li key={ts.id} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="text-xs shrink-0">
                        {ts.type.replace('_', ' ')}
                      </Badge>
                      <span className="text-foreground">{ts.content}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leads">
          <Card className="p-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Manage leads enrolled in this campaign</p>
              <Button onClick={() => router.push(`/campaigns/${campaignId}/leads`)}>
                Manage Campaign Leads
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Analytics coming soon</p>
              <p className="text-sm text-muted-foreground mt-2">
                Track open rates, reply rates, and campaign performance here.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
