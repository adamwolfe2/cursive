'use client'

import { useCallback, useEffect, useState } from 'react'
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
import type { CopyComment } from '@/types/copy-comments'
import { commentKey, groupCommentsByEmail } from '@/types/copy-comments'
import SpintaxRenderer from './SpintaxRenderer'
import AdminCommentThread from './AdminCommentThread'
import WorkspaceAssignmentPicker from './WorkspaceAssignmentPicker'
import DeploymentStatusCard from './DeploymentStatusCard'
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
  const [comments, setComments] = useState<CopyComment[]>([])
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionInfo, setActionInfo] = useState<string | null>(null)
  const [copyApproval, setCopyApproval] = useState<{
    status: string
    notes: string | null
    updated_at: string
  } | null>(null)

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/onboarding/${client.id}/comments`, { cache: 'no-store' })
      if (!res.ok) return
      const json = (await res.json()) as { comments?: CopyComment[] }
      setComments(json.comments ?? [])
    } catch {
      // silent
    }
  }, [client.id])

  const fetchApprovals = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/onboarding/${client.id}/approvals`, { cache: 'no-store' })
      if (!res.ok) return
      const json = (await res.json()) as {
        approvals?: Array<{ step_type: string; status: string; notes: string | null; updated_at: string }>
      }
      const copy = (json.approvals ?? []).find((a) => a.step_type === 'copy')
      setCopyApproval(copy ?? null)
    } catch {
      // silent
    }
  }, [client.id])

  useEffect(() => {
    fetchComments()
    fetchApprovals()
    const interval = setInterval(() => {
      fetchComments()
      fetchApprovals()
    }, 15000)
    const onFocus = () => {
      fetchComments()
      fetchApprovals()
    }
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [fetchComments, fetchApprovals])

  const commentsByEmail = groupCommentsByEmail(comments)

  if (client.copy_generation_status === 'not_applicable') {
    return (
      <Card padding="default" className="border-slate-200 bg-slate-50/50">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Mail className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-foreground">No email sequences needed</p>
          <p className="max-w-md text-xs text-muted-foreground">
            This client didn&apos;t select an outbound package, so no sequences were generated.
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
            <p className="text-sm font-medium text-foreground inline-flex items-center">
              {client.copy_generation_status === 'pending'
                ? 'Copy generation pending'
                : 'Claude is writing your sequences'}
              <span aria-hidden="true" className="inline-flex ml-0.5">
                <span className="animate-[bounce_1s_infinite_0ms]">.</span>
                <span className="animate-[bounce_1s_infinite_150ms]">.</span>
                <span className="animate-[bounce_1s_infinite_300ms]">.</span>
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              This may take a minute. The page will update automatically.
            </p>
          </div>
          <div className="space-y-3 animate-pulse">
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
      <Card padding="default" className="border-destructive/50 bg-destructive/5">
        <CardContent className="space-y-4 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-destructive">Copy Generation Failed</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                The email sequence generation encountered an error. Optionally provide feedback and retry.
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
            Regenerate
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
      {/* Destination workspace picker — must be set before approve fires the EB push */}
      <WorkspaceAssignmentPicker
        clientId={client.id}
        initialWorkspaceId={client.assigned_workspace_id ?? null}
        isTestClient={client.is_test_client ?? false}
        copyApprovalStatus={client.copy_approval_status}
        campaignDeployed={client.campaign_deployed ?? false}
        defaultCreateName={client.company_name}
      />

      {/* Deployment status — surfaces whether the inline push actually
          ran after approval, with a manual button to retry. Independent
          of Inngest (which is orphaned in prod). */}
      <DeploymentStatusCard
        clientId={client.id}
        copyApprovalStatus={client.copy_approval_status}
        campaignDeployed={client.campaign_deployed ?? false}
        campaignIds={client.emailbison_campaign_ids ?? []}
        isTestClient={client.is_test_client ?? false}
      />

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
                setActionError(null)
                setActionInfo(null)
                try {
                  await approveSequences(client.id)
                  setActionInfo('Approved. EmailBison push triggered.')
                } catch (err) {
                  setActionError(err instanceof Error ? err.message : 'Approval failed. Please try again.')
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
                setActionError(null)
                setActionInfo(null)
                try {
                  await requestSequenceEdits(client.id)
                  setActionInfo('Marked as needing edits.')
                } catch (err) {
                  setActionError(err instanceof Error ? err.message : 'Could not save. Please try again.')
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
          {(actionError || actionInfo) && (
            <div className="col-span-full mt-2 w-full">
              {actionError && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{actionError}</p>
              )}
              {actionInfo && !actionError && (
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">{actionInfo}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client's bulk "Request Changes" note — shown alongside per-email comments so admin sees both sources of feedback. */}
      {copyApproval?.status === 'changes_requested' && copyApproval.notes && (
        <Card padding="default" className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-3 py-3">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-1">
                Client requested changes (bulk note)
              </p>
              <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">
                {copyApproval.notes}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
        <Card padding="default" className="border-amber-200 bg-amber-50/40">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="text-sm font-medium text-foreground">No sequences generated</p>
            <p className="max-w-md text-xs text-muted-foreground">
              Claude returned zero sequences. Click &apos;Regenerate&apos; below to try again.
            </p>
          </CardContent>
        </Card>
      ) : (
        sequences.map((seq, idx) => (
          <SequenceAccordion
            key={idx}
            sequence={seq}
            index={idx}
            issues={qualityCheck?.issues?.filter((i: QualityIssue) => i.sequence_index === idx) ?? []}
            clientId={client.id}
            clientName={client.primary_contact_name ?? client.company_name}
            commentsByEmail={commentsByEmail}
            onCommentsChange={fetchComments}
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
  clientId,
  clientName,
  commentsByEmail,
  onCommentsChange,
}: {
  sequence: EmailSequence
  index: number
  issues: QualityIssue[]
  clientId: string
  clientName: string
  commentsByEmail: Map<string, CopyComment[]>
  onCommentsChange: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  const errorCount = issues.filter((i) => i.severity === 'error').length
  const warningCount = issues.filter((i) => i.severity === 'warning').length
  const openCommentsForSequence = sequence.emails.reduce((n, email) => {
    const k = commentKey(index, email.step)
    return n + (commentsByEmail.get(k)?.filter((c) => c.status === 'open').length ?? 0)
  }, 0)

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
          {openCommentsForSequence > 0 && (
            <Badge variant="warning" size="sm">
              {openCommentsForSequence} open comment{openCommentsForSequence === 1 ? '' : 's'}
            </Badge>
          )}
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

                {/* Client ↔ admin comment thread */}
                <AdminCommentThread
                  clientId={clientId}
                  clientName={clientName}
                  sequenceIndex={index}
                  emailStep={email.step}
                  comments={commentsByEmail.get(commentKey(index, email.step)) ?? []}
                  onChange={onCommentsChange}
                />
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
