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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/lib/hooks/use-toast'

const statusOptions = ['Active', 'Prospect', 'Inactive', 'Lost'] as const
const seniorityOptions = ['C-Level', 'VP', 'Director', 'Manager', 'Individual Contributor'] as const

const createContactSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  company_id: z.string().uuid().optional(),
  linkedin_url: z.string().url('Invalid URL').or(z.literal('')).optional(),
  status: z.enum(statusOptions).default('Prospect'),
  seniority_level: z.enum(seniorityOptions).optional(),
})

type CreateContactFormData = z.infer<typeof createContactSchema>

interface CreateContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateContactDialog({ open, onOpenChange }: CreateContactDialogProps) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateContactFormData>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      status: 'Prospect',
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: CreateContactFormData) => {
      const response = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create contact')
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success('Contact created successfully')
      queryClient.invalidateQueries({ queryKey: ['crm', 'contacts'] })
      reset()
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create contact')
    },
  })

  const onSubmit = async (data: CreateContactFormData) => {
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
          <DialogTitle>Create New Contact</DialogTitle>
          <DialogDescription>
            Add a new contact to your CRM. Required fields are marked with *.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  {...register('first_name')}
                  placeholder="John"
                  disabled={isSubmitting}
                />
                {errors.first_name && (
                  <p className="text-sm text-red-600">{errors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  {...register('last_name')}
                  placeholder="Doe"
                  disabled={isSubmitting}
                />
                {errors.last_name && (
                  <p className="text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="VP of Sales"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seniority_level">Seniority Level</Label>
              <Select
                onValueChange={(value) => setValue('seniority_level', value as typeof seniorityOptions[number])}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select seniority level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="C-Level">C-Level</SelectItem>
                  <SelectItem value="VP">VP</SelectItem>
                  <SelectItem value="Director">Director</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Individual Contributor">
                    Individual Contributor
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Contact Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="john@company.com"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="+1 (555) 123-4567"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                {...register('linkedin_url')}
                placeholder="https://linkedin.com/in/johndoe"
                disabled={isSubmitting}
              />
              {errors.linkedin_url && (
                <p className="text-sm text-red-600">{errors.linkedin_url.message}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Status</h3>
            <div className="space-y-2">
              <Label htmlFor="status">Contact Status</Label>
              <Select
                defaultValue="Prospect"
                onValueChange={(value) => setValue('status', value as typeof statusOptions[number])}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Prospect">Prospect</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
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
              {isSubmitting ? 'Creating...' : 'Create Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
