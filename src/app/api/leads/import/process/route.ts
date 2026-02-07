/**
 * Lead Import Process API
 * Cursive Platform
 *
 * Process and save validated CSV data to database.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { leadDataProcessor, type ProcessedLead } from '@/lib/services/lead-data-processor.service'
import { geocodingService } from '@/lib/services/geocoding.service'
import { inngest } from '@/inngest/client'
import { z } from 'zod'

const importProcessSchema = z.object({
  rows: z.array(z.record(z.string())).min(1, 'At least one row is required'),
  options: z.object({
    autoCorrect: z.boolean().optional(),
    validateEmail: z.boolean().optional(),
    normalizePhone: z.boolean().optional(),
    normalizeAddress: z.boolean().optional(),
    geocode: z.boolean().optional(),
    skipDuplicates: z.boolean().optional(),
    source: z.string().max(100).optional(),
  }).optional(),
  fieldMappings: z.array(z.object({
    sourceHeader: z.string(),
    targetField: z.string().nullable(),
    confidence: z.number().min(0).max(1),
    matchType: z.string(),
  })).optional(),
})

// ============================================
// POST /api/leads/import/process
// ============================================

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's workspace
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData?.workspace_id) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const workspaceId = userData.workspace_id

    // Parse and validate request body
    const body = await req.json()
    const parsed = importProcessSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { rows, options, fieldMappings } = parsed.data

    // Process the data
    const result = await leadDataProcessor.processCSV(rows, {
      autoCorrect: options?.autoCorrect ?? true,
      validateEmail: options?.validateEmail ?? true,
      normalizePhone: options?.normalizePhone ?? true,
      normalizeAddress: options?.normalizeAddress ?? true,
      geocode: options?.geocode ?? false,
      fieldMappings: fieldMappings?.map((m) => ({
        ...m,
        suggestions: [],
        matchType: m.matchType as 'exact' | 'alias' | 'fuzzy' | 'pattern' | 'none',
      })),
    })

    // Filter valid leads
    const validLeads = result.leads.filter((l) => l._valid)

    if (validLeads.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid leads to import',
        summary: result.summary,
        errors: result.errors,
      }, { status: 400 })
    }

    // Check for duplicates if requested
    let leadsToInsert = validLeads
    const duplicateEmails: string[] = []

    if (options?.skipDuplicates) {
      const emails = validLeads
        .map((l) => l.email)
        .filter((e): e is string => !!e)

      // Check existing leads
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('id, contact_data')
        .eq('workspace_id', workspaceId)
        .in('contact_data->email', emails)

      if (existingLeads && existingLeads.length > 0) {
        const existingEmails = new Set(
          existingLeads.map((l) => {
            const contactData = l.contact_data as { email?: string } | null
            return contactData?.email
          }).filter(Boolean)
        )

        leadsToInsert = validLeads.filter((l) => {
          if (l.email && existingEmails.has(l.email)) {
            duplicateEmails.push(l.email)
            return false
          }
          return true
        })
      }
    }

    // Insert leads in batches
    const batchSize = 50
    const insertedIds: string[] = []
    const insertErrors: string[] = []

    for (let i = 0; i < leadsToInsert.length; i += batchSize) {
      const batch = leadsToInsert.slice(i, i + batchSize)

      const leadsToSave = batch.map((lead) => transformLeadForDatabase(lead, workspaceId, options?.source))

      const { data: inserted, error: insertError } = await supabase
        .from('leads')
        .insert(leadsToSave)
        .select('id')

      if (insertError) {
        console.error('Insert error:', insertError)
        insertErrors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${insertError.message}`)
      } else if (inserted) {
        insertedIds.push(...inserted.map((l) => l.id))
      }
    }

    // Trigger geocoding for inserted leads if needed (async)
    if (options?.geocode && insertedIds.length > 0) {
      // This would typically be done via a background job
      // For now, we'll just note it in the response
    }

    // Emit lead/created events for all inserted leads (non-blocking)
    if (insertedIds.length > 0) {
      try {
        const events = insertedIds.map((leadId) => ({
          name: 'lead/created' as const,
          data: {
            lead_id: leadId,
            workspace_id: workspaceId,
            source: options?.source || 'csv_import',
          },
        }))
        inngest.send(events).catch((err: unknown) => {
          console.error('[Import Process] Failed to emit lead/created events:', err)
        })
      } catch {
        // Best-effort: don't fail import if event emission fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        inserted: insertedIds.length,
        duplicatesSkipped: duplicateEmails.length,
        errors: insertErrors.length,
      },
      summary: {
        ...result.summary,
        inserted: insertedIds.length,
        duplicatesSkipped: duplicateEmails.length,
      },
      insertedIds,
      duplicateEmails: duplicateEmails.slice(0, 10), // Sample
      insertErrors,
      warnings: result.warnings,
    })
  } catch (error) {
    console.error('Import process error:', error)
    return NextResponse.json(
      { error: 'Failed to process import' },
      { status: 500 }
    )
  }
}

/**
 * Transform processed lead to database format
 */
function transformLeadForDatabase(
  lead: ProcessedLead,
  workspaceId: string,
  source?: string
): Record<string, unknown> {
  return {
    workspace_id: workspaceId,
    source: source || 'csv_import',

    // Company data as JSONB
    company_data: {
      name: lead.company_name,
      domain: lead.company_domain,
      industry: lead.company_industry,
      size: lead.company_size,
      revenue: lead.company_revenue,
      location: {
        city: lead.city,
        state: lead.state_abbrev || lead.state,
        country: lead.country,
      },
    },

    // Contact data as JSONB
    contact_data: {
      email: lead.email,
      first_name: lead.first_name,
      last_name: lead.last_name,
      full_name: lead.full_name,
      phone: lead.phone,
      phone_formatted: lead.phone_formatted,
      job_title: lead.job_title,
      department: lead.department,
      seniority_level: lead.seniority_level,
      linkedin_url: lead.linkedin_url,
    },

    // Normalized location fields
    city_normalized: lead.city_normalized,
    state_abbrev: lead.state_abbrev,
    state_full: lead.state_full,
    region: lead.region,
    postal_code: lead.postal_code,
    country_code: lead.country_code || 'US',

    // Geocoding
    latitude: lead.latitude,
    longitude: lead.longitude,
    geocoded_at: lead.latitude ? new Date().toISOString() : null,
    geocode_accuracy: lead.geocode_accuracy,
    geocode_source: lead.geocode_source,

    // Normalization metadata
    address_normalized: true,
    normalization_corrections: lead._corrections.length > 0 ? lead._corrections : null,

    // Meta
    enrichment_status: 'pending',
    delivery_status: 'pending',
  }
}
