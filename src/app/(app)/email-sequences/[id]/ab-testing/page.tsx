'use client'

/**
 * A/B Testing Page for Email Sequence
 * View and manage A/B experiments tied to this sequence
 */

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ABTestingPanel } from '@/components/email-sequences/ABTestingPanel'
import { PageContainer, PageHeader } from '@/components/layout'
import { Button } from '@/components/ui/button'

export default function SequenceABTestingPage() {
  const params = useParams()
  const sequenceId = params.id as string

  const breadcrumbs = [
    { label: 'Email Sequences', href: '/email-sequences' },
    { label: 'Sequence', href: `/email-sequences/${sequenceId}` },
    { label: 'A/B Tests' },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="A/B Tests"
        description="Run split tests to optimize subject lines, email body, and send times"
        breadcrumbs={breadcrumbs}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/email-sequences/${sequenceId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sequence
            </Link>
          </Button>
        }
      />

      <ABTestingPanel sequenceId={sequenceId} />
    </PageContainer>
  )
}
