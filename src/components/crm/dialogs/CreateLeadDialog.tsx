'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix'
import { useToast } from '@/lib/hooks/use-toast'

const createLeadSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email too long')
    .refine(
      (email) => !email.includes('..') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      { message: 'Invalid email format' }
    ),
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[\d\s\-\+\(\)\.]+$/.test(val),
      { message: 'Invalid phone number format' }
    ),
  company_name: z.string().max(200, 'Company name too long').optional(),
  company_industry: z.string().max(100, 'Industry too long').optional(),
  business_type: z.string().max(50, 'Business type too long').optional(),
  title: z.string().max(100, 'Title too long').optional(),
  city: z.string().max(100, 'City too long').optional(),
  state: z.string().max(50, 'State too long').optional(),
  source: z.string().max(100, 'Source too long').optional(),
  status: z.string().max(50, 'Status too long').optional(),
})

type CreateLeadForm = z.infer<typeof createLeadSchema>

interface CreateLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateLeadDialog({ open, onOpenChange, onSuccess }: CreateLeadDialogProps) {
  const [error, setError] = React.useState<string | null>(null)
  const toast = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateLeadForm>({
    resolver: zodResolver(createLeadSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data: CreateLeadForm) => {
    setError(null)

    try {
      const response = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create lead')
      }

      toast.success('Lead created successfully')
      onSuccess?.()
      onOpenChange(false)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lead')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" aria-describedby="create-lead-description">
        <DialogHeader>
          <DialogTitle>Create New Lead</DialogTitle>
          <DialogDescription id="create-lead-description">
            Add a new lead to your CRM. Fill in as much information as you have.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                {...register('first_name')}
                disabled={isSubmitting}
                aria-required="true"
                aria-invalid={!!errors.first_name}
                aria-describedby={errors.first_name ? 'first_name-error' : undefined}
              />
              {errors.first_name && (
                <p id="first_name-error" className="text-xs text-red-600" role="alert">{errors.first_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                {...register('last_name')}
                disabled={isSubmitting}
                aria-required="true"
                aria-invalid={!!errors.last_name}
                aria-describedby={errors.last_name ? 'last_name-error' : undefined}
              />
              {errors.last_name && (
                <p id="last_name-error" className="text-xs text-red-600" role="alert">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              disabled={isSubmitting}
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-red-600" role="alert">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              disabled={isSubmitting}
              aria-required="false"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              {...register('company_name')}
              disabled={isSubmitting}
              aria-required="false"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_industry">Industry</Label>
              <Input id="company_industry" {...register('company_industry')} placeholder="e.g., Healthcare, Technology" disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_type">Business Type</Label>
              <Input id="business_type" {...register('business_type')} placeholder="e.g., Medical Spa, Retail" disabled={isSubmitting} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input id="title" {...register('title')} placeholder="e.g., CEO, Marketing Director" disabled={isSubmitting} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register('city')} disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...register('state')} placeholder="e.g., CA, NY" disabled={isSubmitting} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input id="source" {...register('source')} placeholder="manual" disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Input id="status" {...register('status')} placeholder="new" disabled={isSubmitting} />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
