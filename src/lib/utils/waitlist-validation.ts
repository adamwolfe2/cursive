/**
 * Form Validation Schemas
 * Zod schemas for waitlist form validation
 */

import { z } from 'zod'

// Business form validation schema
export const businessFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid work email'),
  companyName: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1, 'Please select an industry'),
  targetLocations: z.string().optional(),
  monthlyLeadNeed: z.string().min(1, 'Please select your lead volume'),
})

// Partner form validation schema
export const partnerFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid work email'),
  companyName: z.string().min(1, 'Company/Agency name is required'),
  partnerType: z.string().min(1, 'Please select a partner type'),
  primaryVerticals: z.string().min(1, 'Please specify your primary verticals'),
  databaseSize: z.string().min(1, 'Please select your database size'),
  enrichmentMethods: z.string().optional(),
  linkedin: z
    .string()
    .min(1, 'LinkedIn profile is required')
    .refine(
      (val) => val.includes('linkedin.com') || val.startsWith('https://linkedin.com'),
      'Please enter a valid LinkedIn URL'
    ),
  website: z.string().optional(),
})

export type BusinessFormData = z.infer<typeof businessFormSchema>
export type PartnerFormData = z.infer<typeof partnerFormSchema>

// Industry options for business form
export const industryOptions = [
  'Solar',
  'HVAC',
  'Insurance',
  'SaaS',
  'Real Estate',
  'Healthcare',
  'Manufacturing',
  'Construction',
  'Financial Services',
  'Other',
] as const

// Partner type options
export const partnerTypeOptions = [
  'Buyer Intent Specialist',
  'Lead Gen Expert',
  'Data Provider',
  'Agency',
  'Other',
] as const

// VSL Question Options
export const businessQ1Options = [
  '10-25 leads',
  '25-50 leads',
  '50-100 leads',
  '100-250 leads',
  '250+ leads',
] as const

export const businessQ2Options = [
  '$0-$500',
  '$500-$2,000',
  '$2,000-$5,000',
  '$5,000-$10,000',
  '$10,000+',
] as const

export const businessQ3Options = [
  'Lead quality is too low',
  'Leads cost too much',
  'Not enough volume',
  "Can't verify buyer intent",
] as const

export const partnerQ1Options = [
  'Under 1,000',
  '1,000-5,000',
  '5,000-25,000',
  '25,000-100,000',
  '100,000+',
] as const

export const partnerQ2Options = [
  'Home Services (Solar, HVAC, Roofing)',
  'B2B Services & SaaS',
  'Insurance & Financial Services',
  'Healthcare & Medical',
  'Real Estate',
  'Multiple Industries',
] as const

export const partnerQ3Options = [
  '$0-$1,000',
  '$1,000-$5,000',
  '$5,000-$15,000',
  '$15,000-$50,000',
  '$50,000+',
  'Prefer not to say',
] as const
