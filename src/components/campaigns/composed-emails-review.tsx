'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
} from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/lib/hooks/use-toast'

interface EmailSend {
  id: string
  lead_id: string
  template_id: string
  recipient_email: string
  recipient_name: string
  subject: string
  body_html: string
  body_text: string
  status: string
  step_number: number
  composition_metadata: {
    composed_at: string
    value_prop_used?: string
    template_name?: string
  }
  created_at: string
  lead?: {
    company_name: string
    job_title: string
  }
  template?: {
    name: string
  }
}

interface Campaign {
  id: string
  name: string
  status: string
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending_approval: { label: 'Pending Approval', variant: 'secondary' },
  approved: { label: 'Approved', variant: 'default' },
  sent: { label: 'Sent', variant: 'outline' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  failed: { label: 'Failed', variant: 'destructive' },
}

interface ComposedEmailsReviewProps {
  campaignId: string
}

export function ComposedEmailsReview({ campaignId }: ComposedEmailsReviewProps) {
  const router = useRouter()
  const toast = useToast()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [emails, setEmails] = useState<EmailSend[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [approving, setApproving] = useState(false)

  // Preview modal state
  const [previewEmail, setPreviewEmail] = useState<EmailSend | null>(null)
  const [editedSubject, setEditedSubject] = useState('')
  const [editedBody, setEditedBody] = useState('')

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch campaign
        const campaignRes = await fetch(`/api/campaigns/${campaignId}`)
        if (!campaignRes.ok) throw new Error('Failed to fetch campaign')
        const campaignData = await campaignRes.json()
        setCampaign(campaignData.data)

        // Fetch emails pending approval
        const emailsRes = await fetch(`/api/campaigns/${campaignId}/emails`)
        if (emailsRes.ok) {
          const emailsData = await emailsRes.json()
          setEmails(emailsData.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [campaignId])

  // Selection handlers
  const toggleSelection = (emailId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(emailId)) {
        next.delete(emailId)
      } else {
        next.add(emailId)
      }
      return next
    })
  }

  const selectAllPending = () => {
    const pendingIds = emails
      .filter((e) => e.status === 'pending_approval')
      .map((e) => e.id)
    setSelectedIds(new Set(pendingIds))
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  // Approve selected emails
  const approveSelected = async () => {
    if (selectedIds.size === 0) return

    setApproving(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/emails/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_ids: Array.from(selectedIds),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve emails')
      }

      // Update local state
      setEmails((prev) =>
        prev.map((e) =>
          selectedIds.has(e.id) ? { ...e, status: 'approved' } : e
        )
      )
      setSelectedIds(new Set())
      toast.success(`Approved ${selectedIds.size} email(s)`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve')
    } finally {
      setApproving(false)
    }
  }

  // Reject a single email
  const rejectEmail = async (emailId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/emails/${emailId}/reject`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to reject email')
      }

      setEmails((prev) =>
        prev.map((e) => (e.id === emailId ? { ...e, status: 'rejected' } : e))
      )
      toast.success('Email rejected')
    } catch (error) {
      toast.error('Failed to reject email')
    }
  }

  // Open preview modal
  const openPreview = (email: EmailSend) => {
    setPreviewEmail(email)
    setEditedSubject(email.subject)
    setEditedBody(email.body_text)
  }

  // Save edits and approve
  const saveAndApprove = async () => {
    if (!previewEmail) return

    setApproving(true)
    try {
      // If edited, update the email first
      if (editedSubject !== previewEmail.subject || editedBody !== previewEmail.body_text) {
        const updateRes = await fetch(
          `/api/campaigns/${campaignId}/emails/${previewEmail.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: editedSubject,
              body_text: editedBody,
              // Convert text to simple HTML
              body_html: `<p>${editedBody.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`,
            }),
          }
        )

        if (!updateRes.ok) {
          throw new Error('Failed to update email')
        }
      }

      // Approve
      const response = await fetch(`/api/campaigns/${campaignId}/emails/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_ids: [previewEmail.id],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to approve email')
      }

      // Update local state
      setEmails((prev) =>
        prev.map((e) =>
          e.id === previewEmail.id
            ? { ...e, status: 'approved', subject: editedSubject, body_text: editedBody }
            : e
        )
      )
      setPreviewEmail(null)
      toast.success('Email approved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setApproving(false)
    }
  }

  const pendingEmails = emails.filter((e) => e.status === 'pending_approval')
  const approvedEmails = emails.filter((e) => e.status === 'approved')
  const sentEmails = emails.filter((e) => e.status === 'sent')

  if (loading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
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

  return (
    <PageContainer>
      <PageHeader
        title={`${campaign.name} - Email Review`}
        description="Review and approve composed emails before sending"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Campaigns', href: '/campaigns' },
          { label: campaign.name, href: `/campaigns/${campaignId}` },
          { label: 'Emails' },
        ]}
        actions={
          selectedIds.size > 0 && (
            <Button onClick={approveSelected} loading={approving}>
              Approve {selectedIds.size} Selected
            </Button>
          )
        }
      />

      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending">
            Pending ({pendingEmails.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedEmails.length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent ({sentEmails.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingEmails.length === 0 ? (
            <EmptyState
              title="No emails pending approval"
              description="When emails are composed for campaign leads, they'll appear here for review."
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {selectedIds.size} selected
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllPending}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                </div>
              </div>
              <EmailList
                emails={pendingEmails}
                selectedIds={selectedIds}
                onToggleSelection={toggleSelection}
                onPreview={openPreview}
                onReject={rejectEmail}
                showActions
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="approved">
          {approvedEmails.length === 0 ? (
            <EmptyState
              title="No approved emails"
              description="Approved emails will be queued for sending."
            />
          ) : (
            <EmailList
              emails={approvedEmails}
              selectedIds={new Set()}
              onToggleSelection={() => {}}
              onPreview={openPreview}
            />
          )}
        </TabsContent>

        <TabsContent value="sent">
          {sentEmails.length === 0 ? (
            <EmptyState
              title="No sent emails"
              description="Sent emails and their tracking data will appear here."
            />
          ) : (
            <EmailList
              emails={sentEmails}
              selectedIds={new Set()}
              onToggleSelection={() => {}}
              onPreview={openPreview}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Preview/Edit Modal */}
      <Modal
        isOpen={!!previewEmail}
        onClose={() => setPreviewEmail(null)}
        className="max-w-2xl"
      >
        {previewEmail && (
          <>
            <ModalHeader onClose={() => setPreviewEmail(null)}>
              <ModalTitle>Review Email</ModalTitle>
              <ModalDescription>
                To: {previewEmail.recipient_name} ({previewEmail.recipient_email})
              </ModalDescription>
            </ModalHeader>
            <ModalContent>
              <div className="space-y-4">
                {/* Metadata */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Step {previewEmail.step_number}</Badge>
                  <Badge variant="secondary">
                    {previewEmail.template?.name || 'Unknown template'}
                  </Badge>
                  {previewEmail.composition_metadata?.value_prop_used && (
                    <Badge variant="outline">
                      VP: {previewEmail.composition_metadata.value_prop_used}
                    </Badge>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Body
                  </label>
                  <Textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>

                {/* Lead info */}
                <div className="text-xs text-muted-foreground">
                  Lead: {previewEmail.lead?.job_title} at {previewEmail.lead?.company_name}
                </div>
              </div>
            </ModalContent>
            <ModalFooter>
              <Button
                variant="outline"
                onClick={() => {
                  rejectEmail(previewEmail.id)
                  setPreviewEmail(null)
                }}
              >
                Reject
              </Button>
              <Button
                variant="outline"
                onClick={() => setPreviewEmail(null)}
              >
                Cancel
              </Button>
              <Button onClick={saveAndApprove} loading={approving}>
                {editedSubject !== previewEmail.subject ||
                editedBody !== previewEmail.body_text
                  ? 'Save & Approve'
                  : 'Approve'}
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </PageContainer>
  )
}

// Email list component
interface EmailListProps {
  emails: EmailSend[]
  selectedIds: Set<string>
  onToggleSelection: (id: string) => void
  onPreview: (email: EmailSend) => void
  onReject?: (id: string) => void
  showActions?: boolean
}

function EmailList({
  emails,
  selectedIds,
  onToggleSelection,
  onPreview,
  onReject,
  showActions,
}: EmailListProps) {
  return (
    <Card>
      <div className="divide-y divide-border">
        {emails.map((email) => (
          <div key={email.id} className="p-4 flex items-start gap-4">
            {showActions && (
              <Checkbox
                checked={selectedIds.has(email.id)}
                onChange={() => onToggleSelection(email.id)}
                className="mt-1"
              />
            )}

            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onPreview(email)}>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {email.recipient_name}
                </p>
                <Badge
                  variant={STATUS_LABELS[email.status]?.variant || 'secondary'}
                  className="text-xs"
                >
                  {STATUS_LABELS[email.status]?.label || email.status}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Step {email.step_number}
                </Badge>
              </div>
              <p className="text-sm text-foreground truncate mb-1">{email.subject}</p>
              <p className="text-xs text-muted-foreground truncate">
                {email.lead?.company_name} • {email.recipient_email}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onPreview(email)
                }}
              >
                Preview
              </Button>
              {showActions && onReject && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    onReject(email.id)
                  }}
                >
                  Reject
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
