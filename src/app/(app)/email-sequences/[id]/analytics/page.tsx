'use client'

/**
 * Email Sequence Analytics Page
 * Shows per-sequence and per-step performance metrics with funnel visualization
 */

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, MousePointerClick, MessageSquare, Users, Eye } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageContainer, PageHeader } from '@/components/layout'
import { SkeletonStatCard, SkeletonTable } from '@/components/ui/skeleton'
import { StepFunnelChart } from '@/components/email-sequences/step-funnel-chart'
import { safeError } from '@/lib/utils/log-sanitizer'

interface EmailSequenceStep {
  id: string
  step_order: number
  name: string
  subject: string | null
  delay_days: number
  delay_hours: number
  delay_minutes: number
  sent_count: number
  opened_count: number
  clicked_count: number
  replied_count: number
}

interface EmailSequence {
  id: string
  name: string
  description: string | null
  status: 'draft' | 'active' | 'paused' | 'archived'
  total_sent: number
  total_opened: number
  total_clicked: number
  total_replied: number
  total_enrolled: number
  email_sequence_steps: EmailSequenceStep[]
}

function calcRate(numerator: number, denominator: number): string {
  if (!denominator || denominator === 0) return '0%'
  return `${Math.round((numerator / denominator) * 100)}%`
}

function calcRateNum(numerator: number, denominator: number): number {
  if (!denominator || denominator === 0) return 0
  return Math.round((numerator / denominator) * 100)
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  draft: 'bg-gray-100 text-gray-800',
  archived: 'bg-red-100 text-red-800',
}

export default function SequenceAnalyticsPage() {
  const params = useParams()
  const sequenceId = params.id as string

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['email-sequence', sequenceId],
    queryFn: async () => {
      const response = await fetch(`/api/email-sequences/${sequenceId}`)
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'Failed to fetch sequence')
      }
      return response.json() as Promise<{ sequence: EmailSequence }>
    },
    retry: 1,
  })

  if (isError) {
    safeError('Sequence analytics fetch error:', error)
  }

  const sequence = data?.sequence
  const steps = (sequence?.email_sequence_steps ?? [])
    .slice()
    .sort((a, b) => a.step_order - b.step_order)

  const totalSent = sequence?.total_sent ?? 0
  const totalOpened = sequence?.total_opened ?? 0
  const totalClicked = sequence?.total_clicked ?? 0
  const totalReplied = sequence?.total_replied ?? 0
  const totalEnrolled = sequence?.total_enrolled ?? 0

  const breadcrumbs = [
    { label: 'Email Sequences', href: '/email-sequences' },
    { label: sequence?.name ?? 'Sequence', href: `/email-sequences/${sequenceId}` },
    { label: 'Analytics' },
  ]

  return (
    <PageContainer>
      <PageHeader
        title={isLoading ? 'Loading...' : `${sequence?.name ?? 'Sequence'} — Analytics`}
        description={sequence?.description ?? undefined}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center gap-3">
            {sequence && (
              <Badge className={STATUS_COLORS[sequence.status] ?? 'bg-gray-100 text-gray-800'}>
                {sequence.status}
              </Badge>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/email-sequences/${sequenceId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sequence
              </Link>
            </Button>
          </div>
        }
      />

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEnrolled.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalSent.toLocaleString()} emails sent
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calcRate(totalOpened, totalSent)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalOpened.toLocaleString()} of {totalSent.toLocaleString()} opened
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calcRate(totalClicked, totalSent)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalClicked.toLocaleString()} of {totalSent.toLocaleString()} clicked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Reply Rate</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calcRate(totalReplied, totalSent)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalReplied.toLocaleString()} of {totalSent.toLocaleString()} replied
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Step Funnel Visualization */}
      {!isLoading && steps.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Step Funnel</CardTitle>
            <CardDescription>
              Visual breakdown of engagement drop-off across each step
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StepFunnelChart steps={steps} />
          </CardContent>
        </Card>
      )}

      {/* Per-step performance table */}
      <Card>
        <CardHeader>
          <CardTitle>Step-by-Step Performance</CardTitle>
          <CardDescription>
            Email engagement metrics broken down by each sequence step
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable rows={4} columns={9} />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium text-destructive mb-2">Failed to load analytics</p>
              <p className="text-xs text-muted-foreground">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
            </div>
          ) : steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg
                className="h-10 w-10 text-muted-foreground/40 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p className="text-sm font-medium text-foreground">No steps yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Add steps to this sequence to start tracking per-step engagement.
              </p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href={`/email-sequences/${sequenceId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go to Sequence Builder
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">#</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Step Name</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Sent</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Opens</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Open Rate</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Clicks</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Click Rate</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Replies</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Reply Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((step) => {
                    const openRate = calcRateNum(step.opened_count, step.sent_count)
                    const clickRate = calcRateNum(step.clicked_count, step.sent_count)
                    const replyRate = calcRateNum(step.replied_count, step.sent_count)
                    return (
                      <tr
                        key={step.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-muted-foreground font-mono">
                          {step.step_order}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{step.name}</div>
                          {step.subject && (
                            <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                              {step.subject}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {step.sent_count.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {step.opened_count.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge
                            variant={openRate >= 20 ? 'default' : 'secondary'}
                            className="ml-auto"
                          >
                            {openRate}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {step.clicked_count.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge
                            variant={clickRate >= 5 ? 'default' : 'secondary'}
                            className="ml-auto"
                          >
                            {clickRate}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {step.replied_count.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge
                            variant={replyRate >= 5 ? 'default' : 'secondary'}
                            className="ml-auto"
                          >
                            {replyRate}%
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}
