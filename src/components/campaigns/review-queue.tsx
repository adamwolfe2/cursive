'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer, PageHeader } from '@/components/layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
} from '@/components/ui/modal'
import { FormField, FormLabel, FormTextarea } from '@/components/ui/form'

interface CampaignReview {
  id: string
  campaign_id: string
  review_type: 'internal' | 'client'
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested'
  submitted_at: string
  campaign: {
    id: string
    name: string
    description?: string
    sequence_steps: number
    target_industries?: string[]
    value_propositions: Array<{ name: string; description: string }>
  }
}

export function ReviewQueue() {
  const router = useRouter()
  const [reviews, setReviews] = useState<CampaignReview[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReview, setSelectedReview] = useState<CampaignReview | null>(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'changes_requested' | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [])

  async function fetchReviews() {
    try {
      const response = await fetch('/api/campaigns/reviews')
      if (response.ok) {
        const result = await response.json()
        setReviews(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const openReviewModal = (review: CampaignReview, action: 'approve' | 'reject' | 'changes_requested') => {
    setSelectedReview(review)
    setReviewAction(action)
    setReviewNotes('')
    setReviewModalOpen(true)
  }

  const submitReview = async () => {
    if (!selectedReview || !reviewAction) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/campaigns/${selectedReview.campaign_id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: reviewAction,
          notes: reviewNotes,
        }),
      })

      if (response.ok) {
        setReviewModalOpen(false)
        fetchReviews() // Refresh the list
      } else {
        const result = await response.json()
        console.error('Review failed:', result.error)
      }
    } catch (error) {
      console.error('Failed to submit review:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <PageContainer>
      <PageHeader
        title="Review Queue"
        description="Review and approve campaigns before they go live"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Campaigns', href: '/campaigns' },
          { label: 'Review Queue' },
        ]}
      />

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-4" />
              <div className="h-3 bg-muted rounded w-1/2 mb-2" />
              <div className="h-3 bg-muted rounded w-1/4" />
            </Card>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No pending reviews"
          description="All campaigns have been reviewed. New campaigns submitted for review will appear here."
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">{review.campaign.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {review.review_type} review
                    </Badge>
                  </div>
                  {review.campaign.description && (
                    <p className="text-sm text-muted-foreground">{review.campaign.description}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Submitted {formatDate(review.submitted_at)}
                </span>
              </div>

              {/* Campaign Summary */}
              <div className="grid grid-cols-3 gap-4 mb-4 p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-xs text-muted-foreground">Email Steps</p>
                  <p className="text-sm font-medium">{review.campaign.sequence_steps}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target Industries</p>
                  <p className="text-sm font-medium">
                    {review.campaign.target_industries?.length || 'All'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Value Props</p>
                  <p className="text-sm font-medium">
                    {review.campaign.value_propositions?.length || 0}
                  </p>
                </div>
              </div>

              {/* Value Propositions Preview */}
              {review.campaign.value_propositions && review.campaign.value_propositions.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Value Propositions:</p>
                  <ul className="text-sm space-y-1">
                    {review.campaign.value_propositions.slice(0, 3).map((vp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>
                          <strong>{vp.name}:</strong> {vp.description}
                        </span>
                      </li>
                    ))}
                    {review.campaign.value_propositions.length > 3 && (
                      <li className="text-muted-foreground">
                        +{review.campaign.value_propositions.length - 3} more...
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/campaigns/${review.campaign_id}`)}
                >
                  View Full Details
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openReviewModal(review, 'changes_requested')}
                  >
                    Request Changes
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openReviewModal(review, 'reject')}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => openReviewModal(review, 'approve')}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        className="max-w-md"
      >
        <ModalHeader onClose={() => setReviewModalOpen(false)}>
          <ModalTitle>
            {reviewAction === 'approve'
              ? 'Approve Campaign'
              : reviewAction === 'reject'
              ? 'Reject Campaign'
              : 'Request Changes'}
          </ModalTitle>
          <ModalDescription>
            {reviewAction === 'approve'
              ? 'This campaign will be approved and ready to send.'
              : reviewAction === 'reject'
              ? 'This campaign will be rejected and sent back to draft.'
              : 'Request changes before approval.'}
          </ModalDescription>
        </ModalHeader>
        <ModalContent>
          <FormField>
            <FormLabel htmlFor="review-notes">
              {reviewAction === 'approve' ? 'Notes (optional)' : 'Notes'}
            </FormLabel>
            <FormTextarea
              id="review-notes"
              placeholder={
                reviewAction === 'approve'
                  ? 'Any notes for the campaign creator...'
                  : 'Explain what needs to be changed...'
              }
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={4}
            />
          </FormField>
        </ModalContent>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setReviewModalOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant={reviewAction === 'reject' ? 'destructive' : 'default'}
            onClick={submitReview}
            loading={submitting}
            disabled={reviewAction !== 'approve' && !reviewNotes.trim()}
          >
            {reviewAction === 'approve'
              ? 'Approve'
              : reviewAction === 'reject'
              ? 'Reject'
              : 'Request Changes'}
          </Button>
        </ModalFooter>
      </Modal>
    </PageContainer>
  )
}
