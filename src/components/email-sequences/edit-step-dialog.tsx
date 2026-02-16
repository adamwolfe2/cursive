'use client'

/**
 * Edit Step Dialog
 * Modal for editing an existing email sequence step
 */

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

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

interface EditStepDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  step: Step
  sequenceId: string
}

export function EditStepDialog({
  open,
  onOpenChange,
  step,
  sequenceId,
}: EditStepDialogProps) {
  const queryClient = useQueryClient()

  const [name, setName] = useState(step.name)
  const [subject, setSubject] = useState(step.subject || '')
  const [body, setBody] = useState(step.body || '')
  const [delayDays, setDelayDays] = useState(step.delay_days)
  const [delayHours, setDelayHours] = useState(step.delay_hours)
  const [delayMinutes, setDelayMinutes] = useState(step.delay_minutes)

  // Reset form when step changes
  useEffect(() => {
    setName(step.name)
    setSubject(step.subject || '')
    setBody(step.body || '')
    setDelayDays(step.delay_days)
    setDelayHours(step.delay_hours)
    setDelayMinutes(step.delay_minutes)
  }, [step])

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const response = await fetch(
        `/api/email-sequences/${sequenceId}/steps/${step.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update step')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-sequence', sequenceId] })
      toast.success('Step updated')
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Step name is required')
      return
    }

    // If using a template, only update name and delays
    // If using inline content, also update subject/body
    const updates: Record<string, unknown> = {
      name: name.trim(),
      delay_days: delayDays,
      delay_hours: delayHours,
      delay_minutes: delayMinutes,
    }

    if (!step.template_id) {
      if (!subject.trim()) {
        toast.error('Subject is required')
        return
      }
      if (!body.trim()) {
        toast.error('Body is required')
        return
      }
      updates.subject = subject.trim()
      updates.body = body.trim()
    }

    updateMutation.mutate(updates)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Step {step.step_order + 1}</DialogTitle>
          <DialogDescription>
            Update the step configuration. {step.template_id ? 'This step uses a template for its content.' : ''}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Step Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Initial outreach"
              required
            />
          </div>

          {/* Delay Settings */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Delay Before Sending
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Days</label>
                <Input
                  type="number"
                  min={0}
                  max={365}
                  value={delayDays}
                  onChange={(e) => setDelayDays(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Hours</label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={delayHours}
                  onChange={(e) => setDelayHours(parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Minutes</label>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Template Info or Inline Content */}
          {step.template_id ? (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="text-gray-500">
                Using template: <span className="font-medium text-gray-700">{step.email_templates?.name || 'Unknown'}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                To change the template, delete this step and create a new one.
              </p>
            </div>
          ) : (
            <>
              {/* Subject */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Subject
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject line"
                  required
                />
              </div>

              {/* Body */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Body
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your email content..."
                  className="w-full min-h-[150px] px-3 py-2 border border-gray-200 rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use {'{{first_name}}'}, {'{{company_name}}'}, {'{{title}}'} for personalization.
                </p>
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
