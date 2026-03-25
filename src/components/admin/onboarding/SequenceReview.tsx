'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const EmailBisonDeployModal = dynamic(() => import('./EmailBisonDeployModal'), { ssr: false })
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  approveSequences,
  requestSequenceEdits,
  regenerateCopy,
} from '@/app/admin/onboarding/actions'
import type { OnboardingClient, EmailSequence, QualityCheckResult, QualityIssue } from '@/types/onboarding'
import SpintaxRenderer from './SpintaxRenderer'
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Mail,
  Clock,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'

interface SequenceReviewProps {
  client: OnboardingClient
}

export default function SequenceReview({ client }: SequenceReviewProps) {
  const [feedback, setFeedback] = useState('')
  const [approving, setApproving] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [showDeploy, setShowDeploy] = useState(false)

  if (client.copy_generation_status === 'not_applicable') {
    return (
      <Card padding="default">
        <CardContent className="flex items-center gap-3 py-6">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No email sequences needed for this client&apos;s packages.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (client.copy_generation_status === 'pending' || client.copy_generation_status === 'processing') {
    return (
      <Card padding="default">
        <CardContent className="space-y-5 py-6">
          <div className="flex flex-col items-center justify-center gap-3 py-4">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">
              {client.copy_generation_status === 'pending'
                ? 'Copy generation pending'
                : 'Generating email sequences'}
              <span className="inline-flex w-6">
                <span className="animate-pulse">...</span>
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              This may take a minute. The page will update automatically.
            </p>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-3/4 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (client.copy_generation_status === 'failed') {
    return (
      <Card padding="default" className="border-destructive/50">
        <CardContent className="space-y-4 py-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">Copy Generation Failed</p>
              <p className="text-xs text-muted-foreground">
                The email sequence generation encountered an error.
              </p>
            </div>
          </div>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Optional: provide feedback for regeneration..."
            rows={2}
          />
          <Button
            variant="outline"
            size="sm"
            loading={regenerating}
            onClick={async () => {
              setRegenerating(true)
              try {
                await regenerateCopy(client.id, feedback || undefined)
              } finally {
                setRegenerating(false)
              }
            }}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Regenerate Copy
          </Button>
        </CardContent>
      </Card>
    )
  }

  // complete state
  const sequences = client.draft_sequences?.sequences ?? []
  const qualityCheck = client.draft_sequences?.quality_check as QualityCheckResult | undefined

  const approvalVariant =
    client.copy_approval_status === 'approved'
      ? 'success'
      : client.copy_approval_status === 'needs_edits'
        ? 'warning'
        : client.copy_approval_status === 'regenerating'
          ? 'info'
          : 'muted'

  return (
    <div className="space-y-4">
      {/* Approval Status Bar */}
      <Card padding="sm">
        <CardContent className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Approval Status:</span>
            <Badge variant={approvalVariant} size="lg" dot>
              {client.copy_approval_status === 'approved'
                ? 'Approved'
                : client.copy_approval_status === 'needs_edits'
                  ? 'Needs Edits'
                  : client.copy_approval_status === 'regenerating'
                    ? 'Regenerating'
                    : 'Pending Review'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="success"
              size="sm"
              loading={approving}
              disabled={client.copy_approval_status === 'approved'}
              onClick={async () => {
                setApproving(true)
                try {
                  await approveSequences(client.id)
                } finally {
                  setApproving(false)
                }
              }}
              leftIcon={<CheckCircle className="h-3.5 w-3.5" />}
            >
              Approve All
            </Button>
            <Button
              variant="outline"
              size="sm"
              loading={requesting}
              onClick={async () => {
                setRequesting(true)
                try {
                  await requestSequenceEdits(client.id)
                } finally {
                  setRequesting(false)
                }
              }}
              leftIcon={<AlertTriangle className="h-3.5 w-3.5" />}
            >
              Needs Edits
            </Button>
            {client.copy_approval_status === 'approved' && client.draft_sequences && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeploy(true)}
                leftIcon={<Mail className="h-3.5 w-3.5" />}
              >
                Deploy to EmailBison
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quality Check Results */}
      {qualityCheck && (
        <Card padding="sm">
          <CardContent className="flex items-center gap-3">
            {qualityCheck.passed ? (
              <>
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-700 font-medium">All quality checks passed</span>
              </>
            ) : (
              <>
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-amber-700 font-medium">
                  {qualityCheck.issues.filter((i: QualityIssue) => i.severity === 'error').length} errors,{' '}
                  {qualityCheck.issues.filter((i: QualityIssue) => i.severity === 'warning').length} warnings
                </span>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sequences */}
      {sequences.length === 0 ? (
        <Card padding="default">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">No sequences generated yet.</p>
          </CardContent>
        </Card>
      ) : (
        sequences.map((seq, idx) => (
          <SequenceAccordion
            key={idx}
            sequence={seq}
            index={idx}
            issues={qualityCheck?.issues?.filter((i: QualityIssue) => i.sequence_index === idx) ?? []}
          />
        ))
      )}

      {/* Regenerate Section */}
      <Card padding="default">
        <CardHeader>
          <CardTitle className="text-base">Regenerate Sequences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 mt-2">
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide feedback or additional instructions for regeneration..."
            rows={3}
          />
          <Button
            variant="outline"
            size="sm"
            loading={regenerating}
            onClick={async () => {
              setRegenerating(true)
              try {
                await regenerateCopy(client.id, feedback || undefined)
                setFeedback('')
              } finally {
                setRegenerating(false)
              }
            }}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Regenerate Copy
          </Button>
        </CardContent>
      </Card>

      {/* EmailBison Deploy Modal */}
      {showDeploy && client.draft_sequences && (
        <EmailBisonDeployModal
          isOpen={showDeploy}
          onClose={() => setShowDeploy(false)}
          client={{
            id: client.id,
            company_name: client.company_name,
            primary_contact_email: client.primary_contact_email,
            reply_routing_email: client.reply_routing_email,
            sender_names: client.sender_names,
          }}
          sequences={client.draft_sequences}
        />
      )}
    </div>
  )
}

function SequenceAccordion({
  sequence,
  index,
  issues,
}: {
  sequence: EmailSequence
  index: number
  issues: QualityIssue[]
}) {
  const [expanded, setExpanded] = useState(false)

  const errorCount = issues.filter((i) => i.severity === 'error').length
  const warningCount = issues.filter((i) => i.severity === 'warning').length

  return (
    <Card padding="none">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <div>
            <span className="text-sm font-semibold">
              Sequence {index + 1}: {sequence.sequence_name}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">{sequence.strategy}</p>
            {sequence.angle && (
              <p className="text-[10px] text-blue-600 mt-0.5">
                Angle: {sequence.angle.category} — {sequence.angle.emotional_driver}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {errorCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-600">
              <ShieldAlert className="h-3 w-3" />
              {errorCount}
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <Shield className="h-3 w-3" />
              {warningCount}
            </span>
          )}
          {errorCount === 0 && warningCount === 0 && issues.length === 0 && (
            <ShieldCheck className="h-4 w-4 text-green-500" />
          )}
          <Badge variant="muted" size="sm">
            {sequence.emails.length} emails
          </Badge>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border divide-y divide-border/50">
          {sequence.emails.map((email, emailIdx) => {
            const emailIssues = issues.filter((i) => i.email_index === emailIdx)
            return (
              <div key={email.step} className="p-4 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="outline" size="sm">
                    Step {email.step}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Day {email.delay_days}
                  </span>
                  <Badge variant="muted" size="sm">
                    {email.purpose}
                  </Badge>
                  {email.word_count && (
                    <span className="text-[10px] text-muted-foreground">
                      {email.word_count} words
                    </span>
                  )}
                </div>

                {/* SpintaxRenderer for subject + body */}
                <SpintaxRenderer
                  subjectLine={email.subject_line}
                  body={email.body}
                  previewText={email.preview_text}
                />

                {/* Why it works + spintax test notes */}
                {(email.why_it_works || email.spintax_test_notes) && (
                  <div className="space-y-1 border-t border-border/50 pt-2">
                    {email.why_it_works && (
                      <p className="text-[11px] text-muted-foreground">
                        <span className="font-semibold">Why it works:</span> {email.why_it_works}
                      </p>
                    )}
                    {email.spintax_test_notes && (
                      <p className="text-[11px] text-muted-foreground">
                        <span className="font-semibold">Testing:</span> {email.spintax_test_notes}
                      </p>
                    )}
                  </div>
                )}

                {/* Quality issues for this email */}
                {emailIssues.length > 0 && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 space-y-1">
                    {emailIssues.map((issue, i) => (
                      <p
                        key={i}
                        className={`text-[11px] ${
                          issue.severity === 'error' ? 'text-red-700' : 'text-amber-700'
                        }`}
                      >
                        <span className="font-semibold">
                          {issue.severity === 'error' ? 'Error' : 'Warning'}:
                        </span>{' '}
                        {issue.detail}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
