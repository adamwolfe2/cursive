'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import Image from 'next/image'
import { StepWizard } from '@/components/onboarding/client-intake/StepWizard'
import { CompanyInfoStep } from '@/components/onboarding/client-intake/CompanyInfoStep'
import { PackageSelectionStep } from '@/components/onboarding/client-intake/PackageSelectionStep'
import { ICPIntakeStep } from '@/components/onboarding/client-intake/ICPIntakeStep'
import { EmailSetupStep } from '@/components/onboarding/client-intake/EmailSetupStep'
import { PixelSetupStep } from '@/components/onboarding/client-intake/PixelSetupStep'
import { UseCaseStep } from '@/components/onboarding/client-intake/UseCaseStep'
import { ContentApprovalsStep } from '@/components/onboarding/client-intake/ContentApprovalsStep'
import { LegalStep } from '@/components/onboarding/client-intake/LegalStep'
import { ReviewStep } from '@/components/onboarding/client-intake/ReviewStep'
import { submitOnboardingForm } from './actions'
import { getActiveSteps } from '@/types/onboarding'
import { PACKAGE_SLUGS } from '@/types/onboarding'
import type { OnboardingFormData, PackageSlug, PendingFile } from '@/types/onboarding'

// Fields to validate per step ID
const STEP_FIELDS: Record<string, (keyof OnboardingFormData)[]> = {
  'company-info': ['company_name', 'company_website', 'industry', 'primary_contact_name', 'primary_contact_email', 'communication_channel'],
  'packages': ['packages_selected'],
  'icp': ['icp_description', 'target_industries', 'target_titles', 'target_company_sizes', 'target_geography', 'pain_points'],
  'email-setup': ['sender_names'],
  'pixel-setup': ['pixel_urls'],
  'use-case': ['data_use_cases', 'primary_crm', 'data_format', 'audience_count', 'has_existing_list'],
  'content': [],
  'legal': ['sow_signed', 'data_usage_ack', 'privacy_ack', 'billing_terms_ack', 'signature_name'],
  'review': [],
}

/** Sanitize a URL param: strip HTML tags and limit to 500 chars */
function sanitizeParam(value: string | null): string {
  if (!value) return ''
  return value.replace(/<[^>]*>/g, '').slice(0, 500)
}

function parsePackagesParam(param: string | null): PackageSlug[] {
  if (!param) return []
  const sanitized = sanitizeParam(param)
  const slugs = sanitized.split(',').map(s => s.trim()).filter(Boolean)
  return slugs.filter((s): s is PackageSlug => (PACKAGE_SLUGS as readonly string[]).includes(s))
}

function parseSetupFee(param: string | null): number | null {
  if (!param) return null
  const sanitized = sanitizeParam(param)
  const parsed = parseFloat(sanitized)
  return Number.isNaN(parsed) ? null : parsed
}

function parsePrefillParams(searchParams: URLSearchParams) {
  try {
    return {
      company: sanitizeParam(searchParams.get('company')),
      name: sanitizeParam(searchParams.get('name')),
      email: sanitizeParam(searchParams.get('email')),
      packages: parsePackagesParam(searchParams.get('packages')),
      setup_fee: parseSetupFee(searchParams.get('setup_fee')),
      tier: sanitizeParam(searchParams.get('tier')),
    }
  } catch {
    // Malformed params should never crash the form
    return {
      company: '',
      name: '',
      email: '',
      packages: [] as PackageSlug[],
      setup_fee: null,
      tier: '',
    }
  }
}

function OnboardingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Parse URL params for pre-fill (sanitized)
  const prefill = parsePrefillParams(searchParams)

  const methods = useForm<OnboardingFormData>({
    mode: 'onTouched',
    defaultValues: {
      company_name: prefill.company,
      company_website: '',
      industry: '',
      primary_contact_name: prefill.name,
      primary_contact_email: prefill.email,
      primary_contact_phone: '',
      billing_contact_name: '',
      billing_contact_email: '',
      team_members: '',
      communication_channel: '',
      slack_url: '',
      referral_source: '',
      referral_detail: '',
      packages_selected: prefill.packages,
      setup_fee: prefill.setup_fee,
      recurring_fee: null,
      billing_cadence: '',
      outbound_tier: prefill.tier,
      custom_tier_details: '',
      payment_method: '',
      invoice_email: '',
      domain_cost_acknowledged: false,
      audience_cost_acknowledged: false,
      pixel_cost_acknowledged: false,
      additional_audience_noted: false,
      icp_description: '',
      target_industries: [],
      sub_industries: [],
      target_company_sizes: [],
      target_titles: [],
      target_geography: [],
      specific_regions: '',
      must_have_traits: '',
      exclusion_criteria: '',
      pain_points: '',
      intent_keywords: [],
      competitor_names: [],
      best_customers: '',
      sample_accounts: '',
      sending_volume: '',
      lead_volume: '',
      start_timeline: '',
      sender_names: '',
      domain_variations: '',
      domain_provider: '',
      existing_domains: '',
      copy_tone: '',
      primary_cta: '',
      custom_cta: '',
      calendar_link: '',
      reply_routing_email: '',
      backup_reply_email: '',
      compliance_disclaimers: '',
      pixel_urls: '',
      uses_gtm: '',
      gtm_container_id: '',
      pixel_installer: '',
      developer_email: '',
      pixel_delivery: [],
      pixel_delivery_other: '',
      pixel_crm_name: '',
      conversion_events: '',
      monthly_traffic: '',
      audience_refresh: '',
      data_use_cases: [],
      primary_crm: '',
      custom_platform: '',
      data_format: '',
      audience_count: '',
      has_existing_list: '',
      copy_approval: false,
      sender_identity_approval: false,
      sow_signed: false,
      payment_confirmed: false,
      data_usage_ack: false,
      privacy_ack: false,
      billing_terms_ack: false,
      additional_notes: '',
      signature_name: '',
      signature_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      website_url_confirm: '',
    },
  })

  const [currentStep, setCurrentStep] = React.useState(0)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  // Warn before navigating away with unsaved changes
  React.useEffect(() => {
    const isDirty = methods.formState.isDirty
    if (!isDirty || isSubmitting) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [methods.formState.isDirty, isSubmitting])

  // File state
  const [files, setFiles] = React.useState<Record<string, PendingFile | null>>({
    brand_guidelines: null,
    deck: null,
    testimonials: null,
    sample_offers: null,
    examples: null,
    existing_list: null,
  })

  const setFile = (key: string) => (file: PendingFile | null) => {
    setFiles((prev: Record<string, PendingFile | null>) => ({ ...prev, [key]: file }))
  }

  // Watch packages to compute active steps
  const watchedPackages = methods.watch('packages_selected') ?? []
  const activeSteps = React.useMemo(() => getActiveSteps(watchedPackages), [watchedPackages])

  // Clamp currentStep when activeSteps shrinks (e.g. user goes back and deselects packages)
  React.useEffect(() => {
    setCurrentStep((prev: number) => {
      const maxIndex = activeSteps.length - 1
      return prev > maxIndex ? maxIndex : prev
    })
  }, [activeSteps])

  // Validate current step and advance
  const handleNext = async (): Promise<boolean> => {
    const currentStepId = activeSteps[currentStep]?.id
    if (!currentStepId) return false

    const fieldsToValidate = STEP_FIELDS[currentStepId] ?? []
    const isValid = await methods.trigger(fieldsToValidate as any)

    if (isValid) {
      setCurrentStep((prev: number) => Math.min(prev + 1, activeSteps.length - 1))
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return true
    }
    return false
  }

  const handleBack = () => {
    setCurrentStep((prev: number) => Math.max(prev - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEditStep = (stepIndex: number) => {
    setCurrentStep(stepIndex)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    setSubmitError(null)

    // Validate all legal fields before submit
    const legalValid = await methods.trigger([
      'sow_signed', 'data_usage_ack', 'privacy_ack', 'billing_terms_ack', 'signature_name',
    ] as any)
    if (!legalValid) {
      handleEditStep(activeSteps.findIndex((s: { id: string }) => s.id === 'legal'))
      return
    }

    setIsSubmitting(true)
    try {
      const formData = methods.getValues()

      // Build FormData for file uploads
      const fileFormData = new FormData()
      for (const [, pendingFile] of Object.entries(files)) {
        if (pendingFile && pendingFile.file) {
          fileFormData.append('files', pendingFile.file)
          fileFormData.append('fileTypes', pendingFile.type)
        }
      }

      const result = await submitOnboardingForm(formData, fileFormData)

      if (result.success) {
        // Store company name for success page
        const companyParam = encodeURIComponent(formData.company_name || '')
        router.push(`/client-onboarding/success?company=${companyParam}`)
      } else {
        setSubmitError(result.error ?? 'Submission failed. Please try again.')
      }
    } catch (error: any) {
      console.error('Submit error:', error)
      setSubmitError(error.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render the current step
  const renderStep = () => {
    const stepId = activeSteps[currentStep]?.id
    switch (stepId) {
      case 'company-info':
        return <CompanyInfoStep />
      case 'packages':
        return <PackageSelectionStep />
      case 'icp':
        return <ICPIntakeStep />
      case 'email-setup':
        return (
          <EmailSetupStep
            examplesFile={files.examples}
            onExamplesFileChange={setFile('examples')}
          />
        )
      case 'pixel-setup':
        return <PixelSetupStep />
      case 'use-case':
        return (
          <UseCaseStep
            existingListFile={files.existing_list}
            onExistingListFileChange={setFile('existing_list')}
          />
        )
      case 'content':
        return (
          <ContentApprovalsStep
            brandGuidelinesFile={files.brand_guidelines}
            onBrandGuidelinesChange={setFile('brand_guidelines')}
            deckFile={files.deck}
            onDeckChange={setFile('deck')}
            testimonialsFile={files.testimonials}
            onTestimonialsChange={setFile('testimonials')}
            sampleOffersFile={files.sample_offers}
            onSampleOffersChange={setFile('sample_offers')}
          />
        )
      case 'legal':
        return <LegalStep />
      case 'review':
        return <ReviewStep onEditStep={handleEditStep} files={files} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Image
            src="/cursive-logo.png"
            alt="Cursive"
            width={120}
            height={40}
            className="h-8 w-auto"
            priority
          />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Client Onboarding</p>
            {methods.watch('company_name') && (
              <p className="text-sm font-medium text-[#0F172A]">{methods.watch('company_name')}</p>
            )}
          </div>
        </div>
      </header>

      {/* Main Form */}
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm sm:p-10">
          <FormProvider {...methods}>
            <form onSubmit={(e) => e.preventDefault()}>
              {/* Honeypot field — hidden from real users, catches bots */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
                {...methods.register('website_url_confirm')}
              />
              {submitError && (
                <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">{submitError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubmitError(null)}
                    className="shrink-0 rounded p-1 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <StepWizard
                activeSteps={activeSteps}
                currentStep={currentStep}
                onNext={handleNext}
                onBack={handleBack}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              >
                {renderStep()}
              </StepWizard>
            </form>
          </FormProvider>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <p className="text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Cursive. All rights reserved. Your data is encrypted and stored securely.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <React.Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Loading onboarding form...</p>
        </div>
      </div>
    }>
      <OnboardingPageContent />
    </React.Suspense>
  )
}
