'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  FormField,
  FormLabel,
  FormInput,
  FormSelect,
  FormTextarea,
  FormCheckbox,
  FormError,
  FormSuccess,
} from '@/components/ui/form'

// Example schema
const exampleSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  age: z.number().min(18, 'Must be at least 18 years old').optional(),
  country: z.string().min(1, 'Please select a country'),
  bio: z.string().min(10, 'Bio must be at least 10 characters').optional(),
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms',
  }),
  newsletter: z.boolean().optional(),
})

type ExampleFormData = z.infer<typeof exampleSchema>

/**
 * Comprehensive example demonstrating all form validation features
 */
export function ValidatedFormExample() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<ExampleFormData>({
    resolver: zodResolver(exampleSchema),
    mode: 'onBlur', // Validate on blur
  })

  const onSubmit = async (data: ExampleFormData) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSuccess('Form submitted successfully!')
      reset()
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-zinc-900 mb-6">
          Validated Form Example
        </h2>

        <FormSuccess message={success || undefined} className="mb-6" />
        <FormError message={error || undefined} className="mb-6" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Text Input with Required */}
          <FormField error={errors.full_name}>
            <FormLabel htmlFor="full_name" required>
              Full Name
            </FormLabel>
            <FormInput
              id="full_name"
              type="text"
              placeholder="Your full name"
              disabled={loading}
              error={errors.full_name}
              {...register('full_name')}
            />
          </FormField>

          {/* Email Input */}
          <FormField error={errors.email}>
            <FormLabel htmlFor="email" required>
              Email Address
            </FormLabel>
            <FormInput
              id="email"
              type="email"
              placeholder="john@example.com"
              disabled={loading}
              error={errors.email}
              {...register('email')}
            />
          </FormField>

          {/* Number Input with Optional */}
          <FormField error={errors.age}>
            <FormLabel
              htmlFor="age"
              optional
              hint="Must be 18 or older"
            >
              Age
            </FormLabel>
            <FormInput
              id="age"
              type="number"
              placeholder="25"
              disabled={loading}
              error={errors.age}
              {...register('age', { valueAsNumber: true })}
            />
          </FormField>

          {/* Select Dropdown */}
          <FormField error={errors.country}>
            <FormLabel htmlFor="country" required>
              Country
            </FormLabel>
            <FormSelect
              id="country"
              disabled={loading}
              error={errors.country}
              {...register('country')}
            >
              <option value="">Select a country</option>
              <option value="us">United States</option>
              <option value="uk">United Kingdom</option>
              <option value="ca">Canada</option>
              <option value="au">Australia</option>
            </FormSelect>
          </FormField>

          {/* Textarea */}
          <FormField error={errors.bio}>
            <FormLabel
              htmlFor="bio"
              optional
              hint="Tell us about yourself"
            >
              Bio
            </FormLabel>
            <FormTextarea
              id="bio"
              rows={4}
              placeholder="I am a..."
              disabled={loading}
              error={errors.bio}
              {...register('bio')}
            />
          </FormField>

          {/* Required Checkbox */}
          <FormField error={errors.terms}>
            <FormCheckbox
              id="terms"
              label="I agree to the terms and conditions"
              error={errors.terms}
              {...register('terms')}
            />
          </FormField>

          {/* Optional Checkbox */}
          <FormField error={errors.newsletter}>
            <FormCheckbox
              id="newsletter"
              label="Subscribe to newsletter"
              error={errors.newsletter}
              {...register('newsletter')}
            />
          </FormField>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !isValid}
              className="flex-1 h-9 px-4 text-[13px] font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Form'}
            </button>
            <button
              type="button"
              onClick={() => reset()}
              disabled={loading}
              className="h-9 px-4 text-[13px] font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg transition-all duration-150 disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Validation Status */}
        <div className="mt-6 pt-6 border-t border-zinc-200">
          <h3 className="text-sm font-medium text-zinc-900 mb-2">
            Validation Status
          </h3>
          <div className="space-y-1">
            <p className="text-[13px] text-zinc-600">
              Form Valid: <span className={isValid ? 'text-blue-600' : 'text-red-600'}>
                {isValid ? 'Yes' : 'No'}
              </span>
            </p>
            <p className="text-[13px] text-zinc-600">
              Errors: {Object.keys(errors).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
