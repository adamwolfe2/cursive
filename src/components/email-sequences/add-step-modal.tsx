'use client'

/**
 * Add Email Sequence Step Modal
 * Form to add a new step to a sequence
 */

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const addStepSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  template_id: z.string().uuid().optional(),
  subject: z.string().max(200).optional(),
  body: z.string().optional(),
  delay_days: z.number().int().min(0).max(365),
  delay_hours: z.number().int().min(0).max(23),
  delay_minutes: z.number().int().min(0).max(59),
})

type AddStepForm = z.infer<typeof addStepSchema>

interface AddStepModalProps {
  sequenceId: string
  onClose: () => void
}

export function AddStepModal({ sequenceId, onClose }: AddStepModalProps) {
  const [stepType, setStepType] = useState<'template' | 'custom'>('template')
  const queryClient = useQueryClient()

  const form = useForm<AddStepForm>({
    resolver: zodResolver(addStepSchema),
    defaultValues: {
      name: '',
      delay_days: 0,
      delay_hours: 0,
      delay_minutes: 0,
    },
  })

  // Fetch templates
  const { data: templatesData } = useQuery({
    queryKey: ['email-templates', 'active'],
    queryFn: async () => {
      const response = await fetch('/api/email-templates?status=active')
      if (!response.ok) throw new Error('Failed to fetch templates')
      return response.json()
    },
  })

  const templates = templatesData?.templates || []

  const addStepMutation = useMutation({
    mutationFn: async (data: AddStepForm) => {
      const response = await fetch(
        `/api/email-sequences/${sequenceId}/steps`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add step')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-sequence', sequenceId] })
      toast.success('Step added')
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const onSubmit = (data: AddStepForm) => {
    if (stepType === 'template' && !data.template_id) {
      toast.error('Please select a template')
      return
    }

    if (stepType === 'custom' && (!data.subject || !data.body)) {
      toast.error('Please provide both subject and body')
      return
    }

    addStepMutation.mutate(data)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Email Step</DialogTitle>
          <DialogDescription>
            Add a new email to your sequence
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Step Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Welcome Email"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Delay Configuration */}
          <div className="space-y-2">
            <Label>Delay Before Sending</Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="delay_days" className="text-xs">
                  Days
                </Label>
                <Input
                  id="delay_days"
                  type="number"
                  min="0"
                  max="365"
                  {...form.register('delay_days', { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="delay_hours" className="text-xs">
                  Hours
                </Label>
                <Input
                  id="delay_hours"
                  type="number"
                  min="0"
                  max="23"
                  {...form.register('delay_hours', { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="delay_minutes" className="text-xs">
                  Minutes
                </Label>
                <Input
                  id="delay_minutes"
                  type="number"
                  min="0"
                  max="59"
                  {...form.register('delay_minutes', { valueAsNumber: true })}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave all at 0 to send immediately after the previous step
            </p>
          </div>

          {/* Email Content */}
          <Tabs defaultValue="template" value={stepType} onValueChange={(v) => setStepType(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="template">Use Template</TabsTrigger>
              <TabsTrigger value="custom">Custom Email</TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template_id">
                  Select Template <span className="text-red-500">*</span>
                </Label>
                <Select
                  onValueChange={(value) =>
                    form.setValue('template_id', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        No active templates. Create one first.
                      </div>
                    ) : (
                      templates.map((template: any) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {template.subject}
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">
                  Subject Line <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  placeholder="Email subject"
                  {...form.register('subject')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">
                  Email Body <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="body"
                  placeholder="Email content (supports {{variables}})"
                  rows={10}
                  {...form.register('body')}
                />
                <p className="text-xs text-muted-foreground">
                  Available: {"{{first_name}}"}, {"{{last_name}}"}, {"{{company_name}}"}, {"{{title}}"}, {"{{research_brief}}"}, {"{{research_outreach_angle}}"}
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addStepMutation.isPending || !form.formState.isValid}
            >
              {addStepMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Step'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
