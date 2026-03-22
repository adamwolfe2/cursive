// Onboarding Form Validation Schemas
// Zod schemas for each step of the client onboarding form

import { z } from 'zod'
import { PACKAGE_SLUGS } from '@/types/onboarding'

// ---------------------------------------------------------------------------
// Step 1: Company Info
// ---------------------------------------------------------------------------

export const companyInfoSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(200),
  company_website: z.string().url('Must be a valid URL'),
  industry: z.string().min(1, 'Industry is required'),
  primary_contact_name: z.string().min(1, 'Contact name is required').max(200),
  primary_contact_email: z.string().email('Must be a valid email'),
  primary_contact_phone: z.string().min(7, 'Phone number is required').max(30),
  billing_contact_name: z.string().optional().default(''),
  billing_contact_email: z
    .string()
    .optional()
    .default('')
    .refine((val) => val === '' || z.string().email().safeParse(val).success, {
      message: 'Must be a valid email if provided',
    }),
  team_members: z.string().optional().default(''),
  communication_channel: z.string().min(1, 'Communication channel is required'),
  slack_url: z.string().optional().default(''),
  referral_source: z.string().optional().default(''),
  referral_detail: z.string().optional().default(''),
})

export type CompanyInfoData = z.infer<typeof companyInfoSchema>

// ---------------------------------------------------------------------------
// Step 2: Package Selection
// ---------------------------------------------------------------------------

export const packagesSchema = z.object({
  packages_selected: z
    .array(z.enum(PACKAGE_SLUGS))
    .min(1, 'Select at least one package'),
})

export type PackagesData = z.infer<typeof packagesSchema>

// ---------------------------------------------------------------------------
// Step 3: Commercial Approvals
// ---------------------------------------------------------------------------

export const commercialSchema = z.object({
  setup_fee: z.coerce.number({ required_error: 'Setup fee is required' }).min(0),
  recurring_fee: z.coerce.number().min(0).nullable().optional(),
  billing_cadence: z.enum(['monthly', 'quarterly', 'annual'], {
    required_error: 'Billing cadence is required',
  }),
  outbound_tier: z.string().optional().default(''),
  custom_tier_details: z.string().optional().default(''),
  payment_method: z.string().min(1, 'Payment method is required'),
  invoice_email: z
    .string()
    .optional()
    .default('')
    .refine((val) => val === '' || z.string().email().safeParse(val).success, {
      message: 'Must be a valid email if provided',
    }),
  domain_cost_acknowledged: z.boolean().default(false),
  audience_cost_acknowledged: z.boolean().default(false),
  pixel_cost_acknowledged: z.boolean().default(false),
  additional_audience_noted: z.boolean().default(false),
})

export type CommercialData = z.infer<typeof commercialSchema>

// ---------------------------------------------------------------------------
// Step 4: ICP Intake
// ---------------------------------------------------------------------------

export const icpIntakeSchema = z.object({
  icp_description: z
    .string()
    .min(1, 'ICP description is required')
    .max(500, 'ICP description must be under 500 characters'),
  target_industries: z.array(z.string()).min(1, 'Select at least one industry'),
  sub_industries: z.array(z.string()).optional().default([]),
  target_company_sizes: z.array(z.string()).min(1, 'Select at least one company size'),
  target_titles: z.array(z.string()).min(1, 'Add at least one target title'),
  target_geography: z.array(z.string()).min(1, 'Select at least one geography'),
  specific_regions: z.string().optional().default(''),
  must_have_traits: z.string().optional().default(''),
  exclusion_criteria: z.string().optional().default(''),
  pain_points: z.string().min(1, 'Pain points are required'),
  intent_keywords: z.array(z.string()).optional().default([]),
  competitor_names: z.array(z.string()).optional().default([]),
  best_customers: z.string().optional().default(''),
  sample_accounts: z.string().optional().default(''),
})

export type ICPIntakeData = z.infer<typeof icpIntakeSchema>

// ---------------------------------------------------------------------------
// Step 5: Outbound Email Setup (conditional: outbound or bundle)
// ---------------------------------------------------------------------------

export const emailSetupSchema = z.object({
  sending_volume: z.string().min(1, 'Sending volume is required'),
  lead_volume: z.string().min(1, 'Lead volume is required'),
  start_timeline: z.string().min(1, 'Start timeline is required'),
  sender_names: z.string().min(1, 'Sender names are required'),
  domain_variations: z.string().min(1, 'Domain variations are required'),
  domain_provider: z.string().min(1, 'Domain provider is required'),
  existing_domains: z.string().optional().default(''),
  copy_tone: z.string().min(1, 'Copy tone is required'),
  primary_cta: z.string().min(1, 'Primary CTA is required'),
  custom_cta: z.string().optional().default(''),
  calendar_link: z.string().url('Must be a valid URL'),
  reply_routing_email: z.string().email('Must be a valid email'),
  backup_reply_email: z
    .string()
    .optional()
    .default('')
    .refine((val) => val === '' || z.string().email().safeParse(val).success, {
      message: 'Must be a valid email if provided',
    }),
  compliance_disclaimers: z.string().optional().default(''),
})

export type EmailSetupData = z.infer<typeof emailSetupSchema>

// ---------------------------------------------------------------------------
// Step 6: Pixel Setup (conditional: super_pixel or bundle)
// ---------------------------------------------------------------------------

export const pixelSetupSchema = z.object({
  pixel_urls: z.string().min(1, 'Pixel URLs are required'),
  uses_gtm: z.string().min(1, 'GTM usage is required'),
  gtm_container_id: z.string().optional().default(''),
  pixel_installer: z.string().min(1, 'Pixel installer is required'),
  developer_email: z
    .string()
    .optional()
    .default('')
    .refine((val) => val === '' || z.string().email().safeParse(val).success, {
      message: 'Must be a valid email if provided',
    }),
  pixel_delivery: z.array(z.string()).min(1, 'Select at least one delivery method'),
  pixel_delivery_other: z.string().optional().default(''),
  pixel_crm_name: z.string().optional().default(''),
  conversion_events: z.string().optional().default(''),
  monthly_traffic: z.string().min(1, 'Monthly traffic estimate is required'),
  audience_refresh: z.string().optional().default(''),
})

export type PixelSetupData = z.infer<typeof pixelSetupSchema>

// ---------------------------------------------------------------------------
// Step 7: Use Case & Delivery
// ---------------------------------------------------------------------------

export const useCaseSchema = z.object({
  data_use_cases: z.array(z.string()).min(1, 'Select at least one use case'),
  primary_crm: z.string().min(1, 'Primary CRM is required'),
  custom_platform: z.string().optional().default(''),
  data_format: z.string().min(1, 'Data format is required'),
  audience_count: z.string().min(1, 'Audience count is required'),
  has_existing_list: z.string().min(1, 'This field is required'),
})

export type UseCaseData = z.infer<typeof useCaseSchema>

// ---------------------------------------------------------------------------
// Step 8: Content & Approvals
// ---------------------------------------------------------------------------

export const contentApprovalsSchema = z.object({
  copy_approval: z.literal(true, {
    errorMap: () => ({ message: 'Copy approval is required to proceed' }),
  }),
  sender_identity_approval: z.boolean().default(false),
})

export type ContentApprovalsData = z.infer<typeof contentApprovalsSchema>

// ---------------------------------------------------------------------------
// Step 9: Legal & Sign-off
// ---------------------------------------------------------------------------

export const legalSchema = z.object({
  sow_signed: z.literal(true, {
    errorMap: () => ({ message: 'SOW must be signed' }),
  }),
  payment_confirmed: z.literal(true, {
    errorMap: () => ({ message: 'Payment must be confirmed' }),
  }),
  data_usage_ack: z.literal(true, {
    errorMap: () => ({ message: 'Data usage acknowledgement is required' }),
  }),
  privacy_ack: z.literal(true, {
    errorMap: () => ({ message: 'Privacy acknowledgement is required' }),
  }),
  billing_terms_ack: z.literal(true, {
    errorMap: () => ({ message: 'Billing terms acknowledgement is required' }),
  }),
  additional_notes: z.string().optional().default(''),
  signature_name: z.string().min(1, 'Signature name is required'),
  signature_date: z.string().min(1, 'Signature date is required'),
})

export type LegalData = z.infer<typeof legalSchema>

// ---------------------------------------------------------------------------
// Combined full form schema
// ---------------------------------------------------------------------------

export const onboardingFormSchema = z
  .object({
    // Step 1
    ...companyInfoSchema.shape,
    // Step 2
    ...packagesSchema.shape,
    // Step 3
    ...commercialSchema.shape,
    // Step 4
    ...icpIntakeSchema.shape,
    // Step 5 (optional fields — validated conditionally)
    sending_volume: z.string().optional().default(''),
    lead_volume: z.string().optional().default(''),
    start_timeline: z.string().optional().default(''),
    sender_names: z.string().optional().default(''),
    domain_variations: z.string().optional().default(''),
    domain_provider: z.string().optional().default(''),
    existing_domains: z.string().optional().default(''),
    copy_tone: z.string().optional().default(''),
    primary_cta: z.string().optional().default(''),
    custom_cta: z.string().optional().default(''),
    calendar_link: z.string().optional().default(''),
    reply_routing_email: z.string().optional().default(''),
    backup_reply_email: z.string().optional().default(''),
    compliance_disclaimers: z.string().optional().default(''),
    // Step 6 (optional fields — validated conditionally)
    pixel_urls: z.string().optional().default(''),
    uses_gtm: z.string().optional().default(''),
    gtm_container_id: z.string().optional().default(''),
    pixel_installer: z.string().optional().default(''),
    developer_email: z.string().optional().default(''),
    pixel_delivery: z.array(z.string()).optional().default([]),
    pixel_delivery_other: z.string().optional().default(''),
    pixel_crm_name: z.string().optional().default(''),
    conversion_events: z.string().optional().default(''),
    monthly_traffic: z.string().optional().default(''),
    audience_refresh: z.string().optional().default(''),
    // Step 7
    ...useCaseSchema.shape,
    // Step 8
    copy_approval: z.boolean().default(false),
    sender_identity_approval: z.boolean().default(false),
    // Step 9
    sow_signed: z.boolean().default(false),
    payment_confirmed: z.boolean().default(false),
    data_usage_ack: z.boolean().default(false),
    privacy_ack: z.boolean().default(false),
    billing_terms_ack: z.boolean().default(false),
    additional_notes: z.string().optional().default(''),
    signature_name: z.string().optional().default(''),
    signature_date: z.string().optional().default(''),
  })
  .superRefine((data, ctx) => {
    const packages = data.packages_selected
    const needsOutbound =
      packages.includes('outbound') || packages.includes('bundle')
    const needsPixel =
      packages.includes('super_pixel') || packages.includes('bundle')

    // Validate outbound fields when outbound/bundle is selected
    if (needsOutbound) {
      if (!data.sending_volume) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Sending volume is required for outbound packages',
          path: ['sending_volume'],
        })
      }
      if (!data.lead_volume) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Lead volume is required for outbound packages',
          path: ['lead_volume'],
        })
      }
      if (!data.start_timeline) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Start timeline is required for outbound packages',
          path: ['start_timeline'],
        })
      }
      if (!data.sender_names) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Sender names are required for outbound packages',
          path: ['sender_names'],
        })
      }
      if (!data.domain_variations) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Domain variations are required for outbound packages',
          path: ['domain_variations'],
        })
      }
      if (!data.domain_provider) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Domain provider is required for outbound packages',
          path: ['domain_provider'],
        })
      }
      if (!data.copy_tone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Copy tone is required for outbound packages',
          path: ['copy_tone'],
        })
      }
      if (!data.primary_cta) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Primary CTA is required for outbound packages',
          path: ['primary_cta'],
        })
      }
      if (!data.calendar_link || !z.string().url().safeParse(data.calendar_link).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A valid calendar link URL is required for outbound packages',
          path: ['calendar_link'],
        })
      }
      if (
        !data.reply_routing_email ||
        !z.string().email().safeParse(data.reply_routing_email).success
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A valid reply routing email is required for outbound packages',
          path: ['reply_routing_email'],
        })
      }
    }

    // Validate pixel fields when pixel/bundle is selected
    if (needsPixel) {
      if (!data.pixel_urls) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Pixel URLs are required for pixel packages',
          path: ['pixel_urls'],
        })
      }
      if (!data.uses_gtm) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'GTM usage is required for pixel packages',
          path: ['uses_gtm'],
        })
      }
      if (!data.pixel_installer) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Pixel installer is required for pixel packages',
          path: ['pixel_installer'],
        })
      }
      if (!data.pixel_delivery || data.pixel_delivery.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least one delivery method is required for pixel packages',
          path: ['pixel_delivery'],
        })
      }
      if (!data.monthly_traffic) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Monthly traffic estimate is required for pixel packages',
          path: ['monthly_traffic'],
        })
      }
    }

    // Legal validations (always required for final submission)
    if (!data.sow_signed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'SOW must be signed',
        path: ['sow_signed'],
      })
    }
    if (!data.payment_confirmed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Payment must be confirmed',
        path: ['payment_confirmed'],
      })
    }
    if (!data.data_usage_ack) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Data usage acknowledgement is required',
        path: ['data_usage_ack'],
      })
    }
    if (!data.privacy_ack) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Privacy acknowledgement is required',
        path: ['privacy_ack'],
      })
    }
    if (!data.billing_terms_ack) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Billing terms acknowledgement is required',
        path: ['billing_terms_ack'],
      })
    }
    if (!data.signature_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Signature name is required',
        path: ['signature_name'],
      })
    }
    if (!data.signature_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Signature date is required',
        path: ['signature_date'],
      })
    }
    if (!data.copy_approval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Copy approval is required to proceed',
        path: ['copy_approval'],
      })
    }
  })

export type OnboardingFormSchemaData = z.infer<typeof onboardingFormSchema>

// ---------------------------------------------------------------------------
// Step schema map (for per-step validation)
// ---------------------------------------------------------------------------

export const STEP_SCHEMAS = {
  'company-info': companyInfoSchema,
  packages: packagesSchema,
  commercial: commercialSchema,
  icp: icpIntakeSchema,
  'email-setup': emailSetupSchema,
  'pixel-setup': pixelSetupSchema,
  'use-case': useCaseSchema,
  content: contentApprovalsSchema,
  legal: legalSchema,
} as const

export type StepId = keyof typeof STEP_SCHEMAS
