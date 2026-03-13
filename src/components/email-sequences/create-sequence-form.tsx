'use client'

/**
 * Create Email Sequence Form
 * Initial form to create a new sequence
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const createSequenceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  trigger_type: z.enum([
    'manual',
    'segment',
    'lead_added',
    'lead_scored',
    'time_based',
  ]),
})

type CreateSequenceForm = z.infer<typeof createSequenceSchema>

export function CreateSequenceForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [triggerType, setTriggerType] = useState<string>('manual')

  const form = useForm<CreateSequenceForm>({
    resolver: zodResolver(createSequenceSchema),
    defaultValues: {
      name: '',
      description: '',
      trigger_type: 'manual',
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: CreateSequenceForm) => {
      const response = await fetch('/api/email-sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create sequence')
      }
      return response.json()
    },
    onSuccess: (data) => {
      toast.success('Sequence created')
      queryClient.invalidateQueries({ queryKey: ['email-sequences'] })
      router.push(`/email-sequences/${data.sequence.id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const onSubmit = (data: CreateSequenceForm) => {
    createMutation.mutate(data)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sequence Details</CardTitle>
        <CardDescription>
          Provide basic information about your email sequence
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Sequence Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Welcome Series"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose of this sequence"
              rows={3}
              {...form.register('description')}
            />
          </div>

          {/* Trigger Type */}
          <div className="space-y-2">
            <Label htmlFor="trigger_type">
              Trigger Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={triggerType}
              onValueChange={(value) => {
                setTriggerType(value)
                form.setValue('trigger_type', value as any)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">
                  <div>
                    <div className="font-medium">Manual</div>
                    <div className="text-xs text-muted-foreground">
                      Manually enroll leads
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="segment">
                  <div>
                    <div className="font-medium">Segment Based</div>
                    <div className="text-xs text-muted-foreground">
                      Trigger when lead joins segment
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="lead_added">
                  <div>
                    <div className="font-medium">New Lead</div>
                    <div className="text-xs text-muted-foreground">
                      Trigger when new lead is added
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="lead_scored">
                  <div>
                    <div className="font-medium">Lead Scored</div>
                    <div className="text-xs text-muted-foreground">
                      Trigger when lead reaches score threshold
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="time_based">
                  <div>
                    <div className="font-medium">Time Based</div>
                    <div className="text-xs text-muted-foreground">
                      Trigger at specific times
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.trigger_type && (
              <p className="text-sm text-red-600">
                {form.formState.errors.trigger_type.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !form.formState.isValid}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Sequence'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
