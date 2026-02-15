'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface CampaignStats {
  total_leads: number
  leads_in_sequence: number
  leads_replied: number
  leads_positive: number
  leads_not_interested: number
  leads_bounced: number
  emails_sent: number
  emails_pending: number
  emails_approved: number
  replies_total: number
  replies_positive: number
  replies_questions: number
  replies_negative: number
}

interface TemplatePerformance {
  template_id: string
  template_name: string
  emails_sent: number
  replies: number
  positive_replies: number
  reply_rate: number
  positive_rate: number
}

interface ValuePropPerformance {
  value_prop_id: string
  value_prop_name: string
  leads_assigned: number
  emails_sent: number
  replies: number
  positive_replies: number
  reply_rate: number
}

interface StepPerformance {
  step_number: number
  emails_sent: number
  replies: number
  reply_rate: number
}

interface Campaign {
  id: string
  name: string
  status: string
  created_at: string
  sequence_settings: {
    total_steps?: number
  } | null
}

interface CampaignAnalyticsProps {
  campaignId: string
}

export function CampaignAnalytics({ campaignId }: CampaignAnalyticsProps) {
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [templatePerf, setTemplatePerf] = useState<TemplatePerformance[]>([])
  const [valuePropPerf, setValuePropPerf] = useState<ValuePropPerformance[]>([])
  const [stepPerf, setStepPerf] = useState<StepPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch campaign
        const campaignRes = await fetch(`/api/campaigns/${campaignId}`)

        // SECURITY: Handle authorization errors properly
        if (campaignRes.status === 403) {
          setError('You do not have permission to view this campaign.')
          setLoading(false)
          return
        }

        if (campaignRes.status === 404) {
          setError('Campaign not found.')
          setLoading(false)
          return
        }

        if (!campaignRes.ok) {
          throw new Error('Failed to fetch campaign')
        }

        const campaignData = await campaignRes.json()

        // SECURITY: Verify campaign data exists before setting
        if (!campaignData?.data) {
          setError('Invalid campaign data received.')
          setLoading(false)
          return
        }

        setCampaign(campaignData.data)

        // Fetch analytics
        const analyticsRes = await fetch(`/api/campaigns/${campaignId}/analytics`)

        // Handle analytics errors gracefully
        if (analyticsRes.status === 403) {
          setError('You do not have permission to view analytics for this campaign.')
          setLoading(false)
          return
        }

        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json()
          setStats(analyticsData.stats)
          setTemplatePerf(analyticsData.template_performance || [])
          setValuePropPerf(analyticsData.value_prop_performance || [])
          setStepPerf(analyticsData.step_performance || [])
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
        setError('Failed to load campaign analytics. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [campaignId])

  if (loading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded" />
        </div>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <svg
              className="h-6 w-6 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Error Loading Campaign</h3>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => router.push('/campaigns')}>
              Back to Campaigns
            </Button>
            <Button onClick={() => router.refresh()}>Try Again</Button>
          </div>
        </div>
      </PageContainer>
    )
  }

  if (!campaign) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-destructive">Campaign not found</p>
          <Button variant="outline" onClick={() => router.push('/campaigns')} className="mt-4">
            Back to Campaigns
          </Button>
        </div>
      </PageContainer>
    )
  }

  // Calculate derived metrics
  const replyRate = stats && stats.emails_sent > 0
    ? ((stats.replies_total / stats.emails_sent) * 100).toFixed(1)
    : '0'
  const positiveRate = stats && stats.replies_total > 0
    ? ((stats.replies_positive / stats.replies_total) * 100).toFixed(1)
    : '0'
  const conversionRate = stats && stats.total_leads > 0
    ? ((stats.leads_positive / stats.total_leads) * 100).toFixed(1)
    : '0'

  return (
    <PageContainer>
      <PageHeader
        title={`${campaign.name} - Analytics`}
        description="Campaign performance metrics and insights"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Campaigns', href: '/campaigns' },
          { label: campaign.name, href: `/campaigns/${campaignId}` },
          { label: 'Analytics' },
        ]}
      />

      {/* Top-level KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Reply Rate"
          value={`${replyRate}%`}
          subtitle={`${stats?.replies_total || 0} of ${stats?.emails_sent || 0} emails`}
          trend={parseFloat(replyRate) >= 5 ? 'positive' : parseFloat(replyRate) >= 2 ? 'neutral' : 'negative'}
        />
        <MetricCard
          title="Positive Rate"
          value={`${positiveRate}%`}
          subtitle={`${stats?.replies_positive || 0} positive replies`}
          trend={parseFloat(positiveRate) >= 30 ? 'positive' : parseFloat(positiveRate) >= 15 ? 'neutral' : 'negative'}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          subtitle={`${stats?.leads_positive || 0} of ${stats?.total_leads || 0} leads`}
          trend={parseFloat(conversionRate) >= 5 ? 'positive' : parseFloat(conversionRate) >= 2 ? 'neutral' : 'negative'}
        />
        <MetricCard
          title="Emails Sent"
          value={String(stats?.emails_sent || 0)}
          subtitle={`${stats?.emails_pending || 0} pending`}
        />
      </div>

      {/* Lead Funnel */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Lead Funnel</h3>
        <div className="flex items-center justify-between">
          <FunnelStep
            label="Total Leads"
            count={stats?.total_leads || 0}
            percentage={100}
          />
          <FunnelArrow />
          <FunnelStep
            label="In Sequence"
            count={stats?.leads_in_sequence || 0}
            percentage={stats && stats.total_leads > 0
              ? Math.round((stats.leads_in_sequence / stats.total_leads) * 100)
              : 0
            }
          />
          <FunnelArrow />
          <FunnelStep
            label="Replied"
            count={stats?.leads_replied || 0}
            percentage={stats && stats.total_leads > 0
              ? Math.round((stats.leads_replied / stats.total_leads) * 100)
              : 0
            }
          />
          <FunnelArrow />
          <FunnelStep
            label="Positive"
            count={stats?.leads_positive || 0}
            percentage={stats && stats.total_leads > 0
              ? Math.round((stats.leads_positive / stats.total_leads) * 100)
              : 0
            }
            highlight
          />
        </div>
        {/* Negative outcomes */}
        <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
          <span>Not Interested: {stats?.leads_not_interested || 0}</span>
          <span>Bounced: {stats?.leads_bounced || 0}</span>
        </div>
      </Card>

      <Tabs defaultValue="templates">
        <TabsList className="mb-6">
          <TabsTrigger value="templates">Template Performance</TabsTrigger>
          <TabsTrigger value="valueprops">Value Propositions</TabsTrigger>
          <TabsTrigger value="steps">Sequence Steps</TabsTrigger>
        </TabsList>

        {/* Template Performance */}
        <TabsContent value="templates">
          <Card>
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Template Performance</h3>
              <p className="text-sm text-muted-foreground">
                Compare reply rates across different email templates
              </p>
            </div>
            {templatePerf.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No template data available yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {templatePerf.map((template) => (
                  <div key={template.template_id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{template.template_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {template.emails_sent} sent • {template.replies} replies
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{(template.reply_rate * 100).toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Reply Rate</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          {(template.positive_rate * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Positive</p>
                      </div>
                      <PerformanceBadge rate={template.reply_rate} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Value Proposition Performance */}
        <TabsContent value="valueprops">
          <Card>
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Value Proposition Performance</h3>
              <p className="text-sm text-muted-foreground">
                See which value propositions resonate with leads
              </p>
            </div>
            {valuePropPerf.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No value proposition data available yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {valuePropPerf.map((vp) => (
                  <div key={vp.value_prop_id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{vp.value_prop_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {vp.leads_assigned} leads • {vp.emails_sent} emails
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{(vp.reply_rate * 100).toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Reply Rate</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{vp.positive_replies}</p>
                        <p className="text-xs text-muted-foreground">Positive</p>
                      </div>
                      <PerformanceBadge rate={vp.reply_rate} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Step Performance */}
        <TabsContent value="steps">
          <Card>
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Sequence Step Performance</h3>
              <p className="text-sm text-muted-foreground">
                Reply rates by sequence step
              </p>
            </div>
            {stepPerf.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No step data available yet
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-end gap-4 h-48">
                  {stepPerf.map((step) => {
                    const maxReplies = Math.max(...stepPerf.map(s => s.emails_sent))
                    const height = maxReplies > 0 ? (step.emails_sent / maxReplies) * 100 : 0

                    return (
                      <div key={step.step_number} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex flex-col items-center">
                          <p className="text-sm font-medium mb-1">
                            {(step.reply_rate * 100).toFixed(0)}%
                          </p>
                          <div
                            className="w-full bg-primary/20 rounded-t relative"
                            style={{ height: `${height}%`, minHeight: '20px' }}
                          >
                            <div
                              className="absolute bottom-0 w-full bg-primary rounded-t"
                              style={{
                                height: `${step.reply_rate * 100}%`,
                                minHeight: step.replies > 0 ? '4px' : '0',
                              }}
                            />
                          </div>
                        </div>
                        <div className="text-center mt-2">
                          <p className="text-sm font-medium">Step {step.step_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {step.emails_sent} sent
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}

// Metric card component
interface MetricCardProps {
  title: string
  value: string
  subtitle: string
  trend?: 'positive' | 'neutral' | 'negative'
}

function MetricCard({ title, value, subtitle, trend }: MetricCardProps) {
  const trendColors = {
    positive: 'text-green-600',
    neutral: 'text-yellow-600',
    negative: 'text-red-600',
  }

  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className={`text-2xl font-semibold ${trend ? trendColors[trend] : ''}`}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </Card>
  )
}

// Funnel step component
interface FunnelStepProps {
  label: string
  count: number
  percentage: number
  highlight?: boolean
}

function FunnelStep({ label, count, percentage, highlight }: FunnelStepProps) {
  return (
    <div className={`text-center p-4 rounded-lg ${highlight ? 'bg-green-50 border border-green-200' : ''}`}>
      <p className={`text-2xl font-semibold ${highlight ? 'text-green-600' : ''}`}>{count}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{percentage}%</p>
    </div>
  )
}

// Funnel arrow component
function FunnelArrow() {
  return (
    <div className="text-muted-foreground text-2xl px-2">→</div>
  )
}

// Performance badge component
function PerformanceBadge({ rate }: { rate: number }) {
  if (rate >= 0.05) {
    return <Badge variant="default" className="bg-green-600">High</Badge>
  }
  if (rate >= 0.02) {
    return <Badge variant="secondary">Average</Badge>
  }
  return <Badge variant="outline">Low</Badge>
}
