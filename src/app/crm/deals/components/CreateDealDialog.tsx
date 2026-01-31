'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
} from '@/components/ui/select'
import { useToast } from '@/lib/hooks/use-toast'

const stageOptions = ['Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] as const

const createDealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  description: z.string().optional(),
  value: z.number().min(0).default(0),
  currency: z.string().default('USD'),
  stage: z.enum(stageOptions).default('Qualified'),
  probability: z.number().min(0).max(100).default(0),
  close_date: z.string().optional(),
})

type CreateDealFormData = z.infer<typeof createDealSchema>

interface CreateDealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateDealDialog({ open, onOpenChange }: CreateDealDialogProps) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateDealFormData>({
    resolver: zodResolver(createDealSchema),
    defaultValues: {
      stage: 'Qualified',
      currency: 'USD',
      value: 0,
      probability: 0,
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: CreateDealFormData) => {
      const response = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create deal')
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Deal created successfully')
      queryClient.invalidateQueries({ queryKey: ['crm', 'deals'] })
      reset()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create deal')
    },
  })

  const onSubmit = async (data: CreateDealFormData) => {
    setIsSubmitting(true)
    try {
      await createMutation.mutateAsync(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Deal</DialogTitle>
          <DialogDescription>
            Add a new deal to your pipeline. Track opportunities from qualification to close.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="name">
                Deal Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Acme Corp - Enterprise License"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Brief description of the deal..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Deal Details */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Deal Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Deal Value</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  {...register('value', { valueAsNumber: true })}
                  placeholder="50000"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  defaultValue="USD"
                  onValueChange={(value) => setValue('currency', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <Select
                  defaultValue="Qualified"
                  onValueChange={(value) => setValue('stage', value as typeof stageOptions[number])}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="Proposal">Proposal</SelectItem>
                    <SelectItem value="Negotiation">Negotiation</SelectItem>
                    <SelectItem value="Closed Won">Closed Won</SelectItem>
                    <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="probability">Probability (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  {...register('probability', { valueAsNumber: true })}
                  placeholder="50"
                  disabled={isSubmitting}
                />
                {errors.probability && (
                  <p className="text-sm text-red-600">{errors.probability.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="close_date">Expected Close Date</Label>
              <Input
                id="close_date"
                type="date"
                {...register('close_date')}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Deal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
