'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

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
          setSubmitError('This email is already on the waitlist.')
        } else if (result.details) {
          const firstError = result.details[0]
          setSubmitError(firstError?.message || 'Please check your information.')
        } else {
          setSubmitError(result.error || 'Something went wrong. Please try again.')
        }
        return
      }

      setSubmitSuccess(true)
      reset()
      onSuccess?.()
    } catch {
      setSubmitError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-1">
          You&apos;re on the list
        </h3>
        <p className="text-sm text-zinc-600">
          We&apos;ll notify you when early access opens.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {submitError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-zinc-700 mb-1.5">
            First name <span className="text-red-500">*</span>
          </label>
          <input
            id="first_name"
            type="text"
            autoComplete="given-name"
            inputMode="text"
            className={`w-full min-h-[44px] px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.first_name ? 'border-red-300' : 'border-zinc-300'
            }`}
            {...register('first_name')}
          />
          {errors.first_name && (
            <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Last name <span className="text-red-500">*</span>
          </label>
          <input
            id="last_name"
            type="text"
            autoComplete="family-name"
            inputMode="text"
            className={`w-full min-h-[44px] px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.last_name ? 'border-red-300' : 'border-zinc-300'
            }`}
            {...register('last_name')}
          />
          {errors.last_name && (
            <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1.5">
          Work email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          className={`w-full min-h-[44px] px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
            errors.email ? 'border-red-300' : 'border-zinc-300'
          }`}
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="industry" className="block text-sm font-medium text-zinc-700 mb-1.5">
          Industry <span className="text-zinc-400 font-normal">(optional)</span>
        </label>
        <input
          id="industry"
          type="text"
          inputMode="text"
          placeholder="e.g., Solar, HVAC, Insurance"
          className="w-full min-h-[44px] px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-zinc-400"
          {...register('industry')}
        />
      </div>

      <div>
        <label htmlFor="linkedin_url" className="block text-sm font-medium text-zinc-700 mb-1.5">
          LinkedIn <span className="text-zinc-400 font-normal">(optional)</span>
        </label>
        <input
          id="linkedin_url"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="https://linkedin.com/in/yourprofile"
          className={`w-full min-h-[44px] px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-zinc-400 ${
            errors.linkedin_url ? 'border-red-300' : 'border-zinc-300'
          }`}
          {...register('linkedin_url')}
        />
        {errors.linkedin_url && (
          <p className="mt-1 text-xs text-red-600">{errors.linkedin_url.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full min-h-[44px] bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isSubmitting ? 'Joining...' : 'Get Early Access'}
      </button>

      <p className="text-xs text-zinc-500 text-center">
        No spam. Unsubscribe anytime.
      </p>
    </form>
  )
}
