'use client'

/**
 * Email Sequence Enrollments Page
 * View contacts enrolled in a sequence and track their step progress
 */

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, Users, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/lib/hooks/use-toast'
import { safeError } from '@/lib/utils/log-sanitizer'

type EnrollmentStatus = 'active' | 'paused' | 'completed' | 'unsubscribed' | 'bounced'

interface Enrollment {
  id: string
  status: EnrollmentStatus
  current_step_order: number
  next_send_at: string | null
  emails_sent: number
  emails_opened: number
  emails_clicked: number
  emails_replied: number
  enrolled_at: string
  completed_at: string | null
  unsubscribed_at: string | null
  leads: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    company_name: string | null
  }
  email_sequence_steps: {
    id: string
    step_order: number
    name: string
  } | null
}

interface Sequence {
  id: string
  name: string
}

const STATUS_VARIANT: Record<EnrollmentStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  completed: 'secondary',
  paused: 'outline',
  unsubscribed: 'outline',
  bounced: 'destructive',
}

const STATUS_LABEL: Record<EnrollmentStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  paused: 'Paused',
  unsubscribed: 'Unsubscribed',
  bounced: 'Bounced',
}

type FilterTab = 'all' | EnrollmentStatus

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'unsubscribed', label: 'Unsubscribed' },
  { value: 'bounced', label: 'Bounced' },
]

export default function EnrollmentsPage() {
  const params = useParams()
  const sequenceId = params.id as string
  const toast = useToast()

  const [sequence, setSequence] = useState<Sequence | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [seqRes, enrollRes] = await Promise.all([
        fetch(`/api/email-sequences/${sequenceId}`),
        fetch(`/api/email-sequences/${sequenceId}/enroll?status=all`),
      ])

      if (!seqRes.ok) throw new Error(`Failed to fetch sequence`)
      if (!enrollRes.ok) throw new Error(`Failed to fetch enrollments`)

      const seqData = await seqRes.json()
      const enrollData = await enrollRes.json()

      setSequence(seqData.sequence)
      setEnrollments(enrollData.enrollments ?? [])
    } catch (error) {
      safeError('[EnrollmentsPage]', 'Failed to load enrollments:', error)
      toast.error('Could not load enrollment data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [sequenceId, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const total = enrollments.length
  const activeCount = enrollments.filter((e) => e.status === 'active').length
  const completedCount = enrollments.filter((e) => e.status === 'completed').length
  const unsubscribedCount = enrollments.filter((e) => e.status === 'unsubscribed').length

  const filtered = activeFilter === 'all'
    ? enrollments
    : enrollments.filter((e) => e.status === activeFilter)

  const tabCount = (tab: FilterTab): number => {
    if (tab === 'all') return total
    return enrollments.filter((e) => e.status === tab).length
  }

  const leadName = (e: Enrollment) => {
    const { first_name, last_name, email } = e.leads
    if (first_name || last_name) return [first_name, last_name].filter(Boolean).join(' ')
    return email
  }

  return (
    <PageContainer size="lg">
      <PageHeader
        title={sequence ? `${sequence.name} — Enrollments` : 'Enrollments'}
        description="Track contacts enrolled in this sequence and their progress."
        breadcrumbs={[
          { label: 'Email Sequences', href: '/email-sequences' },
          { label: sequence?.name ?? 'Sequence', href: `/email-sequences/${sequenceId}` },
          { label: 'Enrollments' },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/email-sequences/${sequenceId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sequence
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-muted" />
            ))}
          </div>
          <div className="h-10 w-full rounded-lg bg-muted" />
          <div className="h-64 w-full rounded-lg bg-muted" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2 text-muted-foreground">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{total}</p>
                    <p className="text-sm text-muted-foreground">Total Enrolled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2 text-muted-foreground">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeCount}</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2 text-muted-foreground">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{completedCount}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2 text-muted-foreground">
                    <XCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{unsubscribedCount}</p>
                    <p className="text-sm text-muted-foreground">Unsubscribed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={[
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-colors border',
                  activeFilter === tab.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/40',
                ].join(' ')}
              >
                {tab.label}
                <span className="ml-1.5 text-xs opacity-70">{tabCount(tab.value)}</span>
              </button>
            ))}
          </div>

          {/* Enrollments table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                {activeFilter === 'all'
                  ? 'All Enrollments'
                  : STATUS_LABEL[activeFilter as EnrollmentStatus]}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({filtered.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    {total === 0 ? (
                      <Users className="h-7 w-7 text-muted-foreground" />
                    ) : (
                      <AlertCircle className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    {total === 0 ? 'No enrollments yet' : `No ${activeFilter === 'all' ? '' : STATUS_LABEL[activeFilter as EnrollmentStatus].toLowerCase() + ' '}enrollments`}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {total === 0
                      ? 'Enroll leads into this sequence to start sending automated emails. Go to your leads and use the enroll action.'
                      : 'No enrollments match this filter. Try switching to a different status tab.'}
                  </p>
                  {total === 0 && (
                    <Link
                      href="/crm/leads"
                      className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Users className="h-3.5 w-3.5" />
                      Go to Leads
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30 text-xs uppercase text-muted-foreground">
                        <th className="px-4 py-3 text-left font-medium">Lead</th>
                        <th className="px-4 py-3 text-left font-medium">Email</th>
                        <th className="px-4 py-3 text-left font-medium">Company</th>
                        <th className="px-4 py-3 text-left font-medium">Current Step</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Sent / Opened / Replied</th>
                        <th className="px-4 py-3 text-left font-medium">Enrolled</th>
                        <th className="px-4 py-3 text-left font-medium">Next Send</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filtered.map((enrollment) => (
                        <tr key={enrollment.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-medium">
                            <Link
                              href={`/crm/leads/${enrollment.leads.id}`}
                              className="hover:underline text-foreground"
                            >
                              {leadName(enrollment)}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {enrollment.leads.email}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {enrollment.leads.company_name ?? '—'}
                          </td>
                          <td className="px-4 py-3">
                            {enrollment.email_sequence_steps ? (
                              <span>
                                Step {enrollment.email_sequence_steps.step_order}
                                {enrollment.email_sequence_steps.name && (
                                  <span className="ml-1 text-xs text-muted-foreground">
                                    — {enrollment.email_sequence_steps.name}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                Step {enrollment.current_step_order}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={STATUS_VARIANT[enrollment.status]}>
                              {STATUS_LABEL[enrollment.status]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 tabular-nums text-muted-foreground">
                            {enrollment.emails_sent} / {enrollment.emails_opened} / {enrollment.emails_replied}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(enrollment.enrolled_at), { addSuffix: true })}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {enrollment.next_send_at
                              ? formatDistanceToNow(new Date(enrollment.next_send_at), { addSuffix: true })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  )
}
