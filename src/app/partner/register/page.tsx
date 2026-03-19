'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'

// Partner registration schema
const partnerRegisterSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters'),
  company_name: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(200, 'Company name must be less than 200 characters'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.length === 0) return true // Optional field
        // Validate phone format: +1 (555) 123-4567 or similar
        return /^\+?\d{1,3}[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/.test(val.replace(/\s/g, ''))
      },
      { message: 'Invalid phone number format' }
    ),
})

type PartnerRegisterForm = z.infer<typeof partnerRegisterSchema>

export default function PartnerRegisterPage() {
  const _router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PartnerRegisterForm>({
    resolver: zodResolver(partnerRegisterSchema),
    mode: 'onBlur',
  })

  const onSubmit = async (data: PartnerRegisterForm) => {
    setError(null)

    try {
      // Step 1: Create partner record
      const registerResponse = await fetch('/api/partner/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json()
        throw new Error(errorData.error || 'Failed to register')
      }

      const { partnerId } = await registerResponse.json()

      // Step 2: Initiate Stripe Connect onboarding
      const connectResponse = await fetch('/api/partner/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId }),
      })

      if (!connectResponse.ok) {
        const errorData = await connectResponse.json()
        throw new Error(errorData.error || 'Failed to create Stripe Connect account')
      }

      const { url } = await connectResponse.json()

      // Redirect to Stripe onboarding
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete registration')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-zinc-50 py-20">
      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-zinc-900 mb-4">
            Become a Partner
          </h1>
          <p className="text-xl text-zinc-600">
            Join our marketplace and earn revenue by providing quality B2B leads
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg border border-zinc-200">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-900 mb-2">Earn Revenue</h3>
            <p className="text-sm text-zinc-600">
              Get paid for every lead you provide. Commissions start at 30% and scale with performance.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-zinc-200">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-900 mb-2">Fast Payouts</h3>
            <p className="text-sm text-zinc-600">
              Automated weekly payouts via Stripe Connect. No minimum threshold, get paid as you earn.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-zinc-200">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-900 mb-2">Performance Tracking</h3>
            <p className="text-sm text-zinc-600">
              Access real-time analytics on your lead performance, sales, and earnings.
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-8">
          <h2 className="text-2xl font-bold text-zinc-900 mb-6">
            Partner Registration
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-2">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                disabled={isSubmitting}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-zinc-300'
                }`}
                placeholder="Your full name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-2">
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                disabled={isSubmitting}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-zinc-300'
                }`}
                placeholder="you@company.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-zinc-700 mb-2">
                Company Name *
              </label>
              <input
                id="company_name"
                type="text"
                {...register('company_name')}
                disabled={isSubmitting}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.company_name ? 'border-red-300' : 'border-zinc-300'
                }`}
                placeholder="Your company name"
                aria-invalid={!!errors.company_name}
                aria-describedby={errors.company_name ? 'company-name-error' : undefined}
              />
              {errors.company_name && (
                <p id="company-name-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.company_name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 mb-2">
                Phone Number (optional)
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                disabled={isSubmitting}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.phone ? 'border-red-300' : 'border-zinc-300'
                }`}
                placeholder="+1 (555) 123-4567"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? 'phone-error' : undefined}
              />
              {errors.phone && (
                <p id="phone-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg transition-colors"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  'Continue to Stripe Connect'
                )}
              </Button>
            </div>

            <p className="text-xs text-zinc-500 text-center">
              By continuing, you agree to connect your Stripe account for receiving payouts.
              You&apos;ll be redirected to Stripe to complete onboarding.
            </p>
          </form>
        </div>

        {/* How it Works */}
        <div className="mt-12 bg-zinc-50 rounded-xl p-8">
          <h3 className="text-lg font-semibold text-zinc-900 mb-6">How it Works</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h4 className="font-medium text-zinc-900 mb-1">Register & Connect</h4>
                <p className="text-sm text-zinc-600">
                  Complete registration and connect your Stripe account for secure payouts
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h4 className="font-medium text-zinc-900 mb-1">Upload Leads</h4>
                <p className="text-sm text-zinc-600">
                  Use our API or dashboard to upload quality B2B leads with enrichment data
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h4 className="font-medium text-zinc-900 mb-1">Earn Revenue</h4>
                <p className="text-sm text-zinc-600">
                  Get paid automatically when your leads are sold. Weekly payouts via Stripe.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
