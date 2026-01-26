/**
 * Bulk Lead Upload API Route
 * Cursive Platform
 *
 * Handles CSV file uploads for bulk lead import.
 * Requires authenticated user with workspace access.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'

// CSV column validation schema
const csvRowSchema = z.object({
  company_name: z.string().min(1, 'Company name required'),
  email: z.string().email().optional().nullable(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  job_title: z.string().optional().nullable(),
})

/**
 * Get authenticated user from session
 */
async function getAuthenticatedUser() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore - called from Server Component
          }
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { user: null, supabase }
  }

  // Get user with workspace
  const { data: user } = await supabase
    .from('users')
    .select('id, workspace_id, email')
    .eq('auth_user_id', session.user.id)
    .single()

  return { user, supabase }
}

/**
 * Parse CSV content into records
 */
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter((line) => line.trim())
  if (lines.length < 2) {
    return []
  }

  // Parse headers - handle quoted values
  const headers = lines[0].split(',').map((h) =>
    h.trim().toLowerCase().replace(/['"]/g, '').replace(/\s+/g, '_')
  )

  const records: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length !== headers.length) {
      continue // Skip malformed rows
    }

    const record: Record<string, string> = {}
    headers.forEach((header, idx) => {
      record[header] = values[idx]?.trim() || ''
    })
    records.push(record)
  }

  return records
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current.replace(/^["']|["']$/g, ''))
      current = ''
    } else {
      current += char
    }
  }
  values.push(current.replace(/^["']|["']$/g, ''))

  return values
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { user, supabase } = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const source = (formData.get('source') as string) || 'csv_upload'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return NextResponse.json(
        { error: 'Only CSV files are supported' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Parse CSV
    const text = await file.text()
    const records = parseCSV(text)

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'No valid records found in CSV' },
        { status: 400 }
      )
    }

    // Limit batch size
    const MAX_RECORDS = 5000
    if (records.length > MAX_RECORDS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_RECORDS} records per upload` },
        { status: 400 }
      )
    }

    // Create upload job
    const { data: job, error: jobError } = await supabase
      .from('bulk_upload_jobs')
      .insert({
        workspace_id: user.workspace_id,
        user_id: user.id,
        source,
        filename: file.name,
        total_records: records.length,
        status: 'processing',
      })
      .select('id')
      .single()

    if (jobError) {
      console.error('[Bulk Upload] Failed to create job:', jobError)
      return NextResponse.json(
        { error: 'Failed to create upload job' },
        { status: 500 }
      )
    }

    // Process records
    let successful = 0
    let failed = 0
    const errors: string[] = []
    const routingSummary: Record<string, number> = {}

    // Process in batches
    const BATCH_SIZE = 100
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)

      const leadsToInsert = batch
        .map((record, batchIdx) => {
          // Validate record
          const validation = csvRowSchema.safeParse(record)
          if (!validation.success) {
            errors.push(`Row ${i + batchIdx + 2}: ${validation.error.errors[0].message}`)
            return null
          }

          return {
            workspace_id: user.workspace_id,
            company_name: record.company_name,
            company_industry: record.industry || null,
            company_location: record.state || record.country
              ? {
                  state: record.state || null,
                  country: record.country || 'US',
                }
              : null,
            email: record.email || null,
            first_name: record.first_name || null,
            last_name: record.last_name || null,
            phone: record.phone || null,
            job_title: record.job_title || null,
            source,
            enrichment_status: 'pending',
            delivery_status: 'pending',
            raw_data: {
              upload_job_id: job.id,
              original_row: i + batchIdx + 2,
            },
          }
        })
        .filter(Boolean)

      if (leadsToInsert.length === 0) {
        failed += batch.length
        continue
      }

      const { data: insertedLeads, error: insertError } = await supabase
        .from('leads')
        .insert(leadsToInsert)
        .select('id')

      if (insertError) {
        console.error('[Bulk Upload] Batch insert error:', insertError)
        failed += batch.length
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${insertError.message}`)
        continue
      }

      successful += insertedLeads?.length || 0
      failed += batch.length - (insertedLeads?.length || 0)

      // Route leads
      for (const lead of insertedLeads || []) {
        const { data: routedWorkspaceId } = await supabase.rpc(
          'route_lead_to_workspace',
          {
            p_lead_id: lead.id,
            p_source_workspace_id: user.workspace_id,
          }
        )

        const routeKey = routedWorkspaceId || 'unmatched'
        routingSummary[routeKey] = (routingSummary[routeKey] || 0) + 1
      }
    }

    // Update job status
    await supabase
      .from('bulk_upload_jobs')
      .update({
        status: failed === 0 ? 'completed' : 'completed_with_errors',
        completed_at: new Date().toISOString(),
        successful_records: successful,
        failed_records: failed,
        routing_summary: routingSummary,
        errors: errors.slice(0, 100), // Limit stored errors
      })
      .eq('id', job.id)

    return NextResponse.json({
      id: job.id,
      status: failed === 0 ? 'completed' : 'completed_with_errors',
      total_records: records.length,
      successful_records: successful,
      failed_records: failed,
      routing_summary: routingSummary,
      errors: errors.slice(0, 10), // Return first 10 errors
    })
  } catch (error: any) {
    console.error('[Bulk Upload] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    )
  }
}
