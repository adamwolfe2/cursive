'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormLabel } from '@/components/ui/form-label'
import { FormInput } from '@/components/ui/form-input'
import { FormError } from '@/components/ui/form-error'
import { Button } from '@/components/ui/button'

// Validation schema
const waitlistSchema = z.object({
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name is too long'),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name is too long'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  industry: z
    .string()
    .max(100, 'Industry is too long')
    .optional(),
  linkedin_url: z
    .string()
    .url('Please enter a valid URL')
    .refine(
      (url) => !url || url.includes('linkedin.com'),
      'Please enter a valid LinkedIn URL'
    )
    .optional()
    .or(z.literal('')),
})

type WaitlistFormData = z.infer<typeof waitlistSchema>

interface WaitlistFormProps {
  source?: string
  onSuccess?: () => void
}

export function WaitlistForm({ source = 'website', onSuccess }: WaitlistFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data: WaitlistFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          linkedin_url: data.linkedin_url || null,
          industry: data.industry || null,
          source,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.code === 'DUPLICATE_EMAIL') {
          setSubmitError('This email is already on the waitlist. We\'ll be in touch soon!')
        } else if (result.details) {
          // Validation error
          const firstError = result.details[0]
          setSubmitError(firstError?.message || 'Please check your information and try again.')
        } else {
          setSubmitError(result.error || 'Something went wrong. Please try again.')
        }
        return
      }

      setSubmitSuccess(true)
      reset()
      onSuccess?.()
    } catch {
      setSubmitError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-zinc-900 mb-2">
          You&apos;re on the list!
        </h3>
        <p className="text-zinc-600">
          Thanks for joining. We&apos;ll notify you as soon as early access opens.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {submitError && <FormError message={submitError} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FormLabel htmlFor="first_name" required>
            First Name
          </FormLabel>
          <FormInput
            id="first_name"
            type="text"
            placeholder="John"
            error={errors.first_name}
            {...register('first_name')}
          />
          {errors.first_name && (
            <p className="mt-1 text-[12px] text-red-600">{errors.first_name.message}</p>
          )}
        </div>

        <div>
          <FormLabel htmlFor="last_name" required>
            Last Name
          </FormLabel>
          <FormInput
            id="last_name"
            type="text"
            placeholder="Smith"
            error={errors.last_name}
            {...register('last_name')}
          />
          {errors.last_name && (
            <p className="mt-1 text-[12px] text-red-600">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div>
        <FormLabel htmlFor="email" required>
          Email
        </FormLabel>
        <FormInput
          id="email"
          type="email"
          placeholder="john@company.com"
          error={errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-[12px] text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <FormLabel htmlFor="industry" optional>
          Industry
        </FormLabel>
        <FormInput
          id="industry"
          type="text"
          placeholder="e.g., Solar, HVAC, Insurance"
          error={errors.industry}
          {...register('industry')}
        />
        {errors.industry && (
          <p className="mt-1 text-[12px] text-red-600">{errors.industry.message}</p>
        )}
      </div>

      <div>
        <FormLabel htmlFor="linkedin_url" optional>
          LinkedIn Profile
        </FormLabel>
        <FormInput
          id="linkedin_url"
          type="url"
          placeholder="https://linkedin.com/in/yourprofile"
          error={errors.linkedin_url}
          {...register('linkedin_url')}
        />
        {errors.linkedin_url && (
          <p className="mt-1 text-[12px] text-red-600">{errors.linkedin_url.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Joining...' : 'Join the Waitlist'}
      </Button>

      <p className="text-center text-[12px] text-zinc-500">
        We&apos;ll only use your email to notify you about early access. No spam, ever.
      </p>
    </form>
  )
}
