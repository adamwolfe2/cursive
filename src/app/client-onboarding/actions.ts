'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { inngest } from '@/inngest/client'
import { safeError } from '@/lib/utils/log-sanitizer'
import type { OnboardingFormData } from '@/types/onboarding'

// --------------------------------------------------------------------------
// Constants
// --------------------------------------------------------------------------

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25 MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
])

// --------------------------------------------------------------------------
// Server-side validation schema
// --------------------------------------------------------------------------

const onboardingFormSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(255),
  company_website: z.string().min(1, 'Company website is required').max(500),
  industry: z.string().min(1, 'Industry is required').max(255),
  primary_contact_name: z.string().min(1, 'Contact name is required').max(255),
  primary_contact_email: z.string().email('Valid email is required').max(320),
  primary_contact_phone: z.string().min(1, 'Phone number is required').max(50),
  billing_contact_name: z.string().max(255).optional().or(z.literal('')),
  billing_contact_email: z.string().max(320).optional().or(z.literal('')),
  team_members: z.string().max(2000).optional().or(z.literal('')),
  communication_channel: z.string().min(1, 'Communication channel is required').max(100),
  slack_url: z.string().max(500).optional().or(z.literal('')),
  referral_source: z.string().max(255).optional().or(z.literal('')),
  referral_detail: z.string().max(1000).optional().or(z.literal('')),
  packages_selected: z.array(z.string()).min(1, 'At least one package is required'),
  setup_fee: z.number().nullable().optional(),
  recurring_fee: z.number().nullable().optional(),
  billing_cadence: z.string().max(100).optional().or(z.literal('')),
  outbound_tier: z.string().max(100).optional().or(z.literal('')),
  custom_tier_details: z.string().max(2000).optional().or(z.literal('')),
  payment_method: z.string().max(100).optional().or(z.literal('')),
  invoice_email: z.string().max(320).optional().or(z.literal('')),
  domain_cost_acknowledged: z.boolean().optional(),
  audience_cost_acknowledged: z.boolean().optional(),
  pixel_cost_acknowledged: z.boolean().optional(),
  additional_audience_noted: z.boolean().optional(),
  icp_description: z.string().max(5000).optional().or(z.literal('')),
  target_industries: z.array(z.string()).optional(),
  sub_industries: z.array(z.string()).optional(),
  target_company_sizes: z.array(z.string()).optional(),
  target_titles: z.array(z.string()).optional(),
  target_geography: z.array(z.string()).optional(),
  specific_regions: z.string().max(2000).optional().or(z.literal('')),
  must_have_traits: z.string().max(2000).optional().or(z.literal('')),
  exclusion_criteria: z.string().max(2000).optional().or(z.literal('')),
  pain_points: z.string().max(5000).optional().or(z.literal('')),
  intent_keywords: z.array(z.string()).optional(),
  competitor_names: z.array(z.string()).optional(),
  best_customers: z.string().max(2000).optional().or(z.literal('')),
  sample_accounts: z.string().max(2000).optional().or(z.literal('')),
  sending_volume: z.string().max(100).optional().or(z.literal('')),
  lead_volume: z.string().max(100).optional().or(z.literal('')),
  start_timeline: z.string().max(100).optional().or(z.literal('')),
  sender_names: z.string().max(1000).optional().or(z.literal('')),
  domain_variations: z.string().max(1000).optional().or(z.literal('')),
  domain_provider: z.string().max(255).optional().or(z.literal('')),
  existing_domains: z.string().max(1000).optional().or(z.literal('')),
  copy_tone: z.string().max(255).optional().or(z.literal('')),
  primary_cta: z.string().max(255).optional().or(z.literal('')),
  custom_cta: z.string().max(1000).optional().or(z.literal('')),
  calendar_link: z.string().max(500).optional().or(z.literal('')),
  reply_routing_email: z.string().max(320).optional().or(z.literal('')),
  backup_reply_email: z.string().max(320).optional().or(z.literal('')),
  compliance_disclaimers: z.string().max(2000).optional().or(z.literal('')),
  pixel_urls: z.string().max(2000).optional().or(z.literal('')),
  uses_gtm: z.string().max(50).optional().or(z.literal('')),
  gtm_container_id: z.string().max(100).optional().or(z.literal('')),
  pixel_installer: z.string().max(255).optional().or(z.literal('')),
  developer_email: z.string().max(320).optional().or(z.literal('')),
  pixel_delivery: z.array(z.string()).optional(),
  pixel_delivery_other: z.string().max(500).optional().or(z.literal('')),
  pixel_crm_name: z.string().max(255).optional().or(z.literal('')),
  conversion_events: z.string().max(2000).optional().or(z.literal('')),
  monthly_traffic: z.string().max(100).optional().or(z.literal('')),
  audience_refresh: z.string().max(100).optional().or(z.literal('')),
  data_use_cases: z.array(z.string()).optional(),
  primary_crm: z.string().max(255).optional().or(z.literal('')),
  custom_platform: z.string().max(255).optional().or(z.literal('')),
  data_format: z.string().max(100).optional().or(z.literal('')),
  audience_count: z.string().max(100).optional().or(z.literal('')),
  has_existing_list: z.string().max(50).optional().or(z.literal('')),
  copy_approval: z.boolean().optional(),
  sender_identity_approval: z.boolean().optional(),
  sow_signed: z.boolean().optional(),
  payment_confirmed: z.boolean().optional(),
  data_usage_ack: z.boolean().optional(),
  privacy_ack: z.boolean().optional(),
  billing_terms_ack: z.boolean().optional(),
  additional_notes: z.string().max(5000).optional().or(z.literal('')),
  signature_name: z.string().max(255).optional().or(z.literal('')),
  signature_date: z.string().max(100).optional().or(z.literal('')),
  // Honeypot — should always be empty
  website_url_confirm: z.string().max(500).optional().or(z.literal('')),
})

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function validateFile(file: File): { valid: boolean; reason?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, reason: `File "${file.name}" exceeds 25 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB)` }
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, reason: `File "${file.name}" has disallowed type: ${file.type || 'unknown'}` }
  }
  return { valid: true }
}

// --------------------------------------------------------------------------
// Main action
// --------------------------------------------------------------------------

export async function submitOnboardingForm(
  formData: OnboardingFormData,
  files: FormData
): Promise<{ success: boolean; clientId?: string; error?: string; fieldErrors?: Record<string, string[]> }> {
  try {
    // ---------------------------------------------------------------
    // (b) Honeypot check — if filled, it is a bot. Return silent success.
    // ---------------------------------------------------------------
    const honeypot = (formData as any).website_url_confirm
    if (honeypot) {
      return { success: true, clientId: 'ok' }
    }

    // ---------------------------------------------------------------
    // (d) Server-side form validation
    // ---------------------------------------------------------------
    const parsed = onboardingFormSchema.safeParse(formData)
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.')
        if (!fieldErrors[key]) fieldErrors[key] = []
        fieldErrors[key].push(issue.message)
      }
      return { success: false, error: 'Validation failed. Please check the highlighted fields.', fieldErrors }
    }

    const validatedData = parsed.data

    const supabase = createAdminClient()

    // ---------------------------------------------------------------
    // (a) Duplicate submission check — same email within the last hour
    // ---------------------------------------------------------------
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: existing } = await supabase
      .from('onboarding_clients')
      .select('id')
      .eq('primary_contact_email', validatedData.primary_contact_email)
      .gte('created_at', oneHourAgo)
      .limit(1)
      .maybeSingle()

    if (existing) {
      return { success: true, clientId: existing.id }
    }

    // ---------------------------------------------------------------
    // (c) Server-side file validation
    // ---------------------------------------------------------------
    const fileEntries = files.getAll('files') as File[]
    const fileTypes = files.getAll('fileTypes') as string[]

    for (const file of fileEntries) {
      if (!file || file.size === 0) continue
      const check = validateFile(file)
      if (!check.valid) {
        return { success: false, error: check.reason }
      }
    }

    // ---------------------------------------------------------------
    // (f) Insert client record BEFORE uploading files
    // ---------------------------------------------------------------
    const { data: client, error: insertError } = await supabase
      .from('onboarding_clients')
      .insert({
        status: 'onboarding',
        company_name: validatedData.company_name,
        company_website: validatedData.company_website,
        industry: validatedData.industry,
        primary_contact_name: validatedData.primary_contact_name,
        primary_contact_email: validatedData.primary_contact_email,
        primary_contact_phone: validatedData.primary_contact_phone,
        billing_contact_name: validatedData.billing_contact_name || null,
        billing_contact_email: validatedData.billing_contact_email || null,
        team_members: validatedData.team_members || null,
        communication_channel: validatedData.communication_channel,
        slack_url: validatedData.slack_url || null,
        referral_source: validatedData.referral_source || null,
        referral_detail: validatedData.referral_detail || null,
        packages_selected: validatedData.packages_selected,
        setup_fee: validatedData.setup_fee ?? null,
        recurring_fee: validatedData.recurring_fee ?? null,
        billing_cadence: validatedData.billing_cadence || null,
        outbound_tier: validatedData.outbound_tier || null,
        custom_tier_details: validatedData.custom_tier_details || null,
        payment_method: validatedData.payment_method || null,
        invoice_email: validatedData.invoice_email || null,
        domain_cost_acknowledged: validatedData.domain_cost_acknowledged ?? false,
        audience_cost_acknowledged: validatedData.audience_cost_acknowledged ?? false,
        pixel_cost_acknowledged: validatedData.pixel_cost_acknowledged ?? false,
        additional_audience_noted: validatedData.additional_audience_noted ?? false,
        icp_description: validatedData.icp_description || null,
        target_industries: validatedData.target_industries ?? [],
        sub_industries: validatedData.sub_industries ?? [],
        target_company_sizes: validatedData.target_company_sizes ?? [],
        target_titles: validatedData.target_titles ?? [],
        target_geography: validatedData.target_geography ?? [],
        specific_regions: validatedData.specific_regions || null,
        must_have_traits: validatedData.must_have_traits || null,
        exclusion_criteria: validatedData.exclusion_criteria || null,
        pain_points: validatedData.pain_points || null,
        intent_keywords: validatedData.intent_keywords ?? [],
        competitor_names: validatedData.competitor_names ?? [],
        best_customers: validatedData.best_customers || null,
        sample_accounts: validatedData.sample_accounts || null,
        sending_volume: validatedData.sending_volume || null,
        lead_volume: validatedData.lead_volume || null,
        start_timeline: validatedData.start_timeline || null,
        sender_names: validatedData.sender_names || null,
        domain_variations: validatedData.domain_variations || null,
        domain_provider: validatedData.domain_provider || null,
        existing_domains: validatedData.existing_domains || null,
        copy_tone: validatedData.copy_tone || null,
        primary_cta: validatedData.primary_cta || null,
        custom_cta: validatedData.custom_cta || null,
        calendar_link: validatedData.calendar_link || null,
        reply_routing_email: validatedData.reply_routing_email || null,
        backup_reply_email: validatedData.backup_reply_email || null,
        compliance_disclaimers: validatedData.compliance_disclaimers || null,
        pixel_urls: validatedData.pixel_urls || null,
        uses_gtm: validatedData.uses_gtm || null,
        gtm_container_id: validatedData.gtm_container_id || null,
        pixel_installer: validatedData.pixel_installer || null,
        developer_email: validatedData.developer_email || null,
        pixel_delivery: validatedData.pixel_delivery ?? [],
        pixel_delivery_other: validatedData.pixel_delivery_other || null,
        pixel_crm_name: validatedData.pixel_crm_name || null,
        conversion_events: validatedData.conversion_events || null,
        monthly_traffic: validatedData.monthly_traffic || null,
        audience_refresh: validatedData.audience_refresh || null,
        data_use_cases: validatedData.data_use_cases ?? [],
        primary_crm: validatedData.primary_crm || null,
        custom_platform: validatedData.custom_platform || null,
        data_format: validatedData.data_format || null,
        audience_count: validatedData.audience_count || null,
        has_existing_list: validatedData.has_existing_list || null,
        copy_approval: validatedData.copy_approval ?? false,
        sender_identity_approval: validatedData.sender_identity_approval ?? false,
        sow_signed: validatedData.sow_signed ?? false,
        payment_confirmed: validatedData.payment_confirmed ?? false,
        data_usage_ack: validatedData.data_usage_ack ?? false,
        privacy_ack: validatedData.privacy_ack ?? false,
        billing_terms_ack: validatedData.billing_terms_ack ?? false,
        additional_notes: validatedData.additional_notes || null,
        signature_name: validatedData.signature_name || null,
        signature_date: validatedData.signature_date || null,
        onboarding_complete: true,
      })
      .select('id')
      .single()

    if (insertError) {
      safeError('[Onboarding]','Failed to insert client record:', insertError.message)
      return { success: false, error: 'Failed to save onboarding data. Please try again.' }
    }

    const clientId = client.id

    // ---------------------------------------------------------------
    // Upload files to storage (now that we have clientId)
    // ---------------------------------------------------------------
    const uploadedFiles: { file_name: string; file_type: string; storage_path: string; file_size: number; mime_type: string }[] = []

    for (let i = 0; i < fileEntries.length; i++) {
      const file = fileEntries[i]
      const fileType = fileTypes[i] ?? 'unknown'

      if (!file || file.size === 0) continue

      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `client-uploads/${validatedData.company_name.replace(/[^a-zA-Z0-9]/g, '_')}/${timestamp}_${safeName}`

      const arrayBuffer = await file.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from('client-uploads')
        .upload(storagePath, arrayBuffer, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        safeError('[Onboarding]',`Failed to upload file ${file.name}:`, uploadError.message)
        continue
      }

      uploadedFiles.push({
        file_name: file.name,
        file_type: fileType,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
      })
    }

    // Insert file records
    if (uploadedFiles.length > 0) {
      const fileRecords = uploadedFiles.map((f) => ({
        client_id: clientId,
        file_name: f.file_name,
        file_type: f.file_type,
        storage_path: f.storage_path,
        file_size: f.file_size,
        mime_type: f.mime_type,
      }))

      const { error: fileInsertError } = await supabase
        .from('client_files')
        .insert(fileRecords)

      if (fileInsertError) {
        safeError('[Onboarding]','Failed to insert file records:', fileInsertError.message)
        // Non-fatal: files uploaded but records failed
      }
    }

    // ---------------------------------------------------------------
    // (e) Fire Inngest event with delivery confirmation + fallback
    // ---------------------------------------------------------------
    try {
      await inngest.send({
        name: 'onboarding/intake-complete',
        data: {
          client_id: clientId,
          company_name: validatedData.company_name,
          packages: validatedData.packages_selected,
          contact_email: validatedData.primary_contact_email,
        },
      })
    } catch (inngestError) {
      safeError('[Onboarding]','Inngest event delivery failed, falling back to direct API call:', inngestError)
      // Fallback: call the intake API endpoint directly
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000')
        await fetch(`${baseUrl}/api/automations/intake`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-automation-secret': process.env.AUTOMATION_SECRET || '',
          },
          body: JSON.stringify({ client_id: clientId }),
        })
      } catch (fallbackError) {
        safeError('[Onboarding]','Fallback intake API call also failed:', fallbackError)
        // Non-fatal: client record is saved, automation can be retried manually
      }
    }

    return { success: true, clientId }
  } catch (error) {
    safeError('[Onboarding] submission error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
