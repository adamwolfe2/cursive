'use client'

/**
 * Sequence Steps List Component
 * Display and manage steps within a sequence
 */

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Mail, Clock, Trash2, Edit, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import { EditStepDialog } from './edit-step-dialog'

interface Step {
  id: string
  step_order: number
  name: string
  template_id: string | null
  delay_days: number
  delay_hours: number
  delay_minutes: number
  subject: string | null
  body: string | null
  sent_count: number
  opened_count: number
  clicked_count: number
  replied_count: number
  email_templates?: {
    id: string
    name: string
    subject: string
  }
}

interface SequenceStepsListProps {
  steps: Step[]
  sequenceId: string
  sequenceStatus: string
}

export function SequenceStepsList({
  steps,
  sequenceId,
  sequenceStatus,
}: SequenceStepsListProps) {
  const queryClient = useQueryClient()
  const [editingStep, setEditingStep] = useState<Step | null>(null)

  const deleteStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      const response = await fetch(
        `/api/email-sequences/${sequenceId}/steps/${stepId}`,
        {
          method: 'DELETE',
        }
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete step')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-sequence', sequenceId] })
      toast.success('Step deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const sortedSteps = [...steps].sort((a, b) => a.step_order - b.step_order)

  const getDelayText = (step: Step) => {
    const parts = []
    if (step.delay_days > 0) parts.push(`${step.delay_days}d`)
    if (step.delay_hours > 0) parts.push(`${step.delay_hours}h`)
    if (step.delay_minutes > 0) parts.push(`${step.delay_minutes}m`)

    if (parts.length === 0) return 'Immediately'
    return `Wait ${parts.join(' ')}`
  }

  const getOpenRate = (step: Step) => {
    if (step.sent_count === 0) return 0
    return Math.round((step.opened_count / step.sent_count) * 100)
  }

  return (
    <div className="space-y-4">
      {sortedSteps.map((step, index) => (
        <div key={step.id}>
          {/* Delay Indicator */}
          {index > 0 && (
            <div className="flex items-center justify-center py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{getDelayText(step)}</span>
                <ArrowDown className="h-4 w-4" />
              </div>
            </div>
          )}

          {/* Step Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">Step {step.step_order + 1}</Badge>
                    <CardTitle className="text-base">{step.name}</CardTitle>
                  </div>
                  <CardDescription>
                    {step.email_templates ? (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Template: {step.email_templates.name}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {step.subject || 'No subject'}
                      </span>
                    )}
                  </CardDescription>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingStep(step)}
                    disabled={sequenceStatus === 'active'}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (
                        confirm('Are you sure you want to delete this step?')
                      ) {
                        deleteStepMutation.mutate(step.id)
                      }
                    }}
                    disabled={
                      sequenceStatus === 'active' ||
                      deleteStepMutation.isPending
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Stats */}
            {step.sent_count > 0 && (
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-semibold">{step.sent_count}</div>
                    <div className="text-xs text-muted-foreground">Sent</div>
                  </div>
                  <div>
                    <div className="font-semibold">{getOpenRate(step)}%</div>
                    <div className="text-xs text-muted-foreground">Opened</div>
                  </div>
                  <div>
                    <div className="font-semibold">{step.clicked_count}</div>
                    <div className="text-xs text-muted-foreground">Clicked</div>
                  </div>
                  <div>
                    <div className="font-semibold">{step.replied_count}</div>
                    <div className="text-xs text-muted-foreground">Replied</div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      ))}

      {/* Edit Step Dialog */}
      {editingStep && (
        <EditStepDialog
          open={!!editingStep}
          onOpenChange={(open) => {
            if (!open) setEditingStep(null)
          }}
          step={editingStep}
          sequenceId={sequenceId}
        />
      )}
    </div>
  )
}
