'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { safeError } from '@/lib/utils/log-sanitizer'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

interface Reply {
  id: string
  campaign_id: string
  email_send_id: string
  lead_id: string
  from_email: string
  from_name: string | null
  subject: string
  body_text: string
  body_html: string | null
  received_at: string
  sentiment: string | null
  intent_score: number | null
  classification_confidence: number | null
  classification_metadata: {
    reasoning?: string
    suggested_action?: string
  } | null
  suggested_response: string | null
  status: string
  reviewed_at: string | null
  review_notes: string | null
  lead?: {
    first_name: string
    last_name: string
    company_name: string
    job_title: string
  }
  email_send?: {
    subject: string
    body_text: string
  }
}

interface Campaign {
  id: string
  name: string
  status: string
}

const SENTIMENT_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  positive: { label: 'Positive', variant: 'default', color: 'text-green-600' },
  negative: { label: 'Negative', variant: 'destructive', color: 'text-red-600' },
  neutral: { label: 'Neutral', variant: 'secondary', color: 'text-gray-600' },
  question: { label: 'Question', variant: 'outline', color: 'text-blue-600' },
  not_interested: { label: 'Not Interested', variant: 'destructive', color: 'text-red-600' },
  out_of_office: { label: 'Out of Office', variant: 'secondary', color: 'text-yellow-600' },
  unsubscribe: { label: 'Unsubscribe', variant: 'destructive', color: 'text-red-600' },
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  new: { label: 'New', variant: 'default' },
  reviewed: { label: 'Reviewed', variant: 'secondary' },
  responded: { label: 'Responded', variant: 'outline' },
  ignored: { label: 'Ignored', variant: 'secondary' },
  archived: { label: 'Archived', variant: 'secondary' },
}

interface ReplyInboxProps {
  campaignId: string
}

export function ReplyInbox({ campaignId }: ReplyInboxProps) {
  const router = useRouter()
  const toast = useToast()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // Reply detail modal
  const [selectedReply, setSelectedReply] = useState<Reply | null>(null)
  const [responseText, setResponseText] = useState('')

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch campaign
        const campaignRes = await fetch(`/api/campaigns/${campaignId}`)
        if (!campaignRes.ok) throw new Error('Failed to fetch campaign')
        const campaignData = await campaignRes.json()
        setCampaign(campaignData.data)

        // Fetch replies
        const repliesRes = await fetch(`/api/campaigns/${campaignId}/replies`)
        if (repliesRes.ok) {
          const repliesData = await repliesRes.json()
          setReplies(repliesData.data || [])
        }
      } catch (error) {
        safeError('[ReplyInbox]', 'Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [campaignId])

  // Open reply detail
  const openReplyDetail = (reply: Reply) => {
    setSelectedReply(reply)
    setResponseText(reply.suggested_response || '')
  }

  // Mark reply as reviewed
  const markAsReviewed = async (replyId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/replies/${replyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'reviewed' }),
      })

      if (!response.ok) throw new Error('Failed to update reply')

      setReplies((prev) =>
        prev.map((r) => (r.id === replyId ? { ...r, status: 'reviewed' } : r))
      )
      toast.success('Reply marked as reviewed')
    } catch (_error) {
      toast.error('Failed to update reply')
    }
  }

  // Mark reply as ignored
  const markAsIgnored = async (replyId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/replies/${replyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ignored' }),
      })

      if (!response.ok) throw new Error('Failed to update reply')

      setReplies((prev) =>
        prev.map((r) => (r.id === replyId ? { ...r, status: 'ignored' } : r))
      )
      setSelectedReply(null)
      toast.success('Reply marked as ignored')
    } catch (_error) {
      toast.error('Failed to update reply')
    }
  }

  // Send response
  const sendResponse = async () => {
    if (!selectedReply || !responseText.trim()) return

    setSending(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/replies/${selectedReply.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body_text: responseText,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send response')
      }

      setReplies((prev) =>
        prev.map((r) => (r.id === selectedReply.id ? { ...r, status: 'responded' } : r))
      )
      setSelectedReply(null)
      toast.success('Response sent successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send response')
    } finally {
      setSending(false)
    }
  }

  // Filter replies by status
  const newReplies = replies.filter((r) => r.status === 'new')
  const reviewedReplies = replies.filter((r) => r.status === 'reviewed')
  const respondedReplies = replies.filter((r) => r.status === 'responded')
  const ignoredReplies = replies.filter((r) => r.status === 'ignored' || r.status === 'archived')

  // Calculate stats
  const positiveReplies = replies.filter((r) => r.sentiment === 'positive')
  const avgIntentScore = replies.length > 0
    ? (replies.reduce((sum, r) => sum + (r.intent_score || 0), 0) / replies.length).toFixed(1)
    : '0'

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
        title={`${campaign.name} - Reply Inbox`}
        description="Review and respond to email replies"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Campaigns', href: '/campaigns' },
          { label: campaign.name, href: `/campaigns/${campaignId}` },
          { label: 'Replies' },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Replies</p>
          <p className="text-2xl font-semibold">{replies.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">New</p>
          <p className="text-2xl font-semibold text-blue-600">{newReplies.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Positive</p>
          <p className="text-2xl font-semibold text-green-600">{positiveReplies.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Avg Intent</p>
          <p className="text-2xl font-semibold">{avgIntentScore}/10</p>
        </Card>
      </div>

      <Tabs defaultValue="new">
        <TabsList className="mb-6">
          <TabsTrigger value="new">
            New ({newReplies.length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Reviewed ({reviewedReplies.length})
          </TabsTrigger>
          <TabsTrigger value="responded">
            Responded ({respondedReplies.length})
          </TabsTrigger>
          <TabsTrigger value="ignored">
            Ignored ({ignoredReplies.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          {newReplies.length === 0 ? (
            <EmptyState
              title="No new replies"
              description="New replies will appear here when leads respond to your emails."
            />
          ) : (
            <ReplyList
              replies={newReplies}
              onSelect={openReplyDetail}
              onMarkReviewed={markAsReviewed}
            />
          )}
        </TabsContent>

        <TabsContent value="reviewed">
          {reviewedReplies.length === 0 ? (
            <EmptyState
              title="No reviewed replies"
              description="Replies you've reviewed but haven't responded to will appear here."
            />
          ) : (
            <ReplyList
              replies={reviewedReplies}
              onSelect={openReplyDetail}
            />
          )}
        </TabsContent>

        <TabsContent value="responded">
          {respondedReplies.length === 0 ? (
            <EmptyState
              title="No responses sent"
              description="Replies you've responded to will appear here."
            />
          ) : (
            <ReplyList
              replies={respondedReplies}
              onSelect={openReplyDetail}
            />
          )}
        </TabsContent>

        <TabsContent value="ignored">
          {ignoredReplies.length === 0 ? (
            <EmptyState
              title="No ignored replies"
              description="Replies you've marked as ignored or archived will appear here."
            />
          ) : (
            <ReplyList
              replies={ignoredReplies}
              onSelect={openReplyDetail}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Reply Detail Modal */}
      <Modal
        isOpen={!!selectedReply}
        onClose={() => setSelectedReply(null)}
        className="max-w-3xl"
      >
        {selectedReply && (
          <>
            <ModalHeader onClose={() => setSelectedReply(null)}>
              <ModalTitle>Reply from {selectedReply.from_name || selectedReply.from_email}</ModalTitle>
              <ModalDescription>
                {selectedReply.lead?.company_name} - {selectedReply.lead?.job_title}
              </ModalDescription>
            </ModalHeader>
            <ModalContent>
              <div className="space-y-4">
                {/* Classification info */}
                <div className="flex flex-wrap gap-2">
                  {selectedReply.sentiment && (
                    <Badge variant={SENTIMENT_CONFIG[selectedReply.sentiment]?.variant || 'secondary'}>
                      {SENTIMENT_CONFIG[selectedReply.sentiment]?.label || selectedReply.sentiment}
                    </Badge>
                  )}
                  {selectedReply.intent_score !== null && (
                    <Badge variant="outline">
                      Intent: {selectedReply.intent_score}/10
                    </Badge>
                  )}
                  <Badge variant={STATUS_CONFIG[selectedReply.status]?.variant || 'secondary'}>
                    {STATUS_CONFIG[selectedReply.status]?.label || selectedReply.status}
                  </Badge>
                </div>

                {/* AI reasoning */}
                {selectedReply.classification_metadata?.reasoning && (
                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                    <p className="font-medium text-muted-foreground mb-1">AI Analysis</p>
                    <p>{selectedReply.classification_metadata.reasoning}</p>
                    {selectedReply.classification_metadata.suggested_action && (
                      <p className="mt-2 text-muted-foreground">
                        Suggested: {selectedReply.classification_metadata.suggested_action}
                      </p>
                    )}
                  </div>
                )}

                {/* Original email sent */}
                {selectedReply.email_send && (
                  <div className="border rounded-lg p-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Original Email Sent</p>
                    <p className="text-sm font-medium mb-1">{selectedReply.email_send.subject}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {selectedReply.email_send.body_text}
                    </p>
                  </div>
                )}

                {/* Reply content */}
                <div className="border rounded-lg p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Their Reply</p>
                  <p className="text-sm font-medium mb-1">{selectedReply.subject}</p>
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedReply.body_text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Received: {new Date(selectedReply.received_at).toLocaleString()}
                  </p>
                </div>

                {/* Response composer */}
                {selectedReply.status !== 'responded' && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Your Response
                      {selectedReply.suggested_response && (
                        <span className="text-muted-foreground font-normal ml-2">
                          (AI suggested)
                        </span>
                      )}
                    </label>
                    <Textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={8}
                      placeholder="Type your response..."
                      className="font-mono text-sm"
                    />
                  </div>
                )}
              </div>
            </ModalContent>
            <ModalFooter>
              {selectedReply.status !== 'responded' && selectedReply.status !== 'ignored' && (
                <Button
                  variant="outline"
                  onClick={() => markAsIgnored(selectedReply.id)}
                >
                  Mark Ignored
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setSelectedReply(null)}
              >
                Close
              </Button>
              {selectedReply.status !== 'responded' && (
                <Button
                  onClick={sendResponse}
                  loading={sending}
                  disabled={!responseText.trim()}
                >
                  Send Response
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </Modal>
    </PageContainer>
  )
}

// Reply list component
interface ReplyListProps {
  replies: Reply[]
  onSelect: (reply: Reply) => void
  onMarkReviewed?: (replyId: string) => void
}

function ReplyList({ replies, onSelect, onMarkReviewed }: ReplyListProps) {
  return (
    <Card>
      <div className="divide-y divide-border">
        {replies.map((reply) => (
          <div
            key={reply.id}
            className="p-4 flex items-start gap-4 hover:bg-muted/50 cursor-pointer"
            onClick={() => onSelect(reply)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {reply.from_name || reply.from_email}
                </p>
                {reply.sentiment && (
                  <Badge
                    variant={SENTIMENT_CONFIG[reply.sentiment]?.variant || 'secondary'}
                    className="text-xs"
                  >
                    {SENTIMENT_CONFIG[reply.sentiment]?.label || reply.sentiment}
                  </Badge>
                )}
                {reply.intent_score !== null && reply.intent_score >= 7 && (
                  <Badge variant="default" className="text-xs bg-green-600">
                    High Intent
                  </Badge>
                )}
              </div>
              <p className="text-sm text-foreground truncate mb-1">{reply.subject}</p>
              <p className="text-xs text-muted-foreground truncate">
                {reply.lead?.company_name} - {new Date(reply.received_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {onMarkReviewed && reply.status === 'new' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkReviewed(reply.id)}
                >
                  Mark Read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelect(reply)}
              >
                View
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
