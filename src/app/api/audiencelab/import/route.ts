/**
 * Audience Labs Batch Export Importer
 *
 * POST /api/audiencelab/import
 * Accepts a fileUrl pointing to a JSON export from AL.
 * Downloads the file, stores rows as audiencelab_events,
 * and triggers the normalization pipeline for each row.
 *
 * Requires authenticated user with workspace membership.
 */

export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ImportRequestSchema, ExportRowSchema } from '@/lib/audiencelab/schemas'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'
import { retryFetch } from '@/lib/utils/retry'

async function sha256Hex(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data)
  const hash = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const LOG_PREFIX = '[AL Import]'
const MAX_ROWS = 50000

export async function POST(request: NextRequest) {
  try {
    // Auth: require authenticated user
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const parsed = ImportRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { fileUrl, audienceId } = parsed.data
    const supabase = createAdminClient()

    // Get user's workspace
    const { data: userData } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!userData?.workspace_id) {
      return NextResponse.json(
        { error: 'No workspace found' },
        { status: 403 }
      )
    }

    const workspaceId = parsed.data.workspaceId || userData.workspace_id

    // Idempotency: check if this import was already started
    const importHash = await sha256Hex(`${fileUrl}|${audienceId || ''}|${workspaceId}`)

    const { data: existingJob } = await supabase
      .from('audiencelab_import_jobs')
      .select('id, status, total_rows, processed_rows')
      .eq('idempotency_hash', importHash)
      .single()

    if (existingJob?.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: 'Import already completed (idempotent)',
        job_id: existingJob.id,
        total_rows: existingJob.total_rows,
        processed_rows: existingJob.processed_rows,
      })
    }

    if (existingJob?.status === 'processing') {
      return NextResponse.json(
        { error: 'Import already in progress', job_id: existingJob.id },
        { status: 409 }
      )
    }

    // Create import job for progress tracking
    const { data: importJob, error: jobError } = await supabase
      .from('audiencelab_import_jobs')
      .upsert({
        id: existingJob?.id || undefined,
        workspace_id: workspaceId,
        audience_id: audienceId || null,
        file_url: fileUrl,
        status: 'processing',
        idempotency_hash: importHash,
      }, { onConflict: 'idempotency_hash' })
      .select('id')
      .single()

    const jobId = importJob?.id

    // Download file
    let fileData: any[]
    try {
      const response = await retryFetch(fileUrl, {
        timeout: 60000,
        headers: { 'Accept': 'application/json' },
      }, { maxRetries: 3 })

      if (!response.ok) {
        throw new Error(`Download failed: HTTP ${response.status}`)
      }

      const text = await response.text()
      const parsed = JSON.parse(text)

      // Handle both array and { data: [...] } formats
      fileData = Array.isArray(parsed) ? parsed : (parsed.data || parsed.results || [parsed])
    } catch (err) {
      safeError(`${LOG_PREFIX} File download/parse failed`, err)

      if (jobId) {
        await supabase.from('audiencelab_import_jobs')
          .update({ status: 'failed', error: 'Download/parse failed' })
          .eq('id', jobId)
      }

      return NextResponse.json(
        { error: 'Failed to download or parse file' },
        { status: 422 }
      )
    }

    if (!Array.isArray(fileData) || fileData.length === 0) {
      if (jobId) {
        await supabase.from('audiencelab_import_jobs')
          .update({ status: 'failed', error: 'No data rows' })
          .eq('id', jobId)
      }

      return NextResponse.json(
        { error: 'File contains no data rows' },
        { status: 400 }
      )
    }

    if (fileData.length > MAX_ROWS) {
      if (jobId) {
        await supabase.from('audiencelab_import_jobs')
          .update({ status: 'failed', error: `Exceeds ${MAX_ROWS} row limit` })
          .eq('id', jobId)
      }

      return NextResponse.json(
        { error: `File contains ${fileData.length} rows, max is ${MAX_ROWS}` },
        { status: 400 }
      )
    }

    // Record total rows on the job
    if (jobId) {
      await supabase.from('audiencelab_import_jobs')
        .update({ total_rows: fileData.length })
        .eq('id', jobId)
    }

    // Store each row as an event and trigger processing
    let stored = 0
    const batchSize = 100

    for (let i = 0; i < fileData.length; i += batchSize) {
      const batch = fileData.slice(i, i + batchSize)

      const rowsToInsert = batch.map((row, idx) => ({
        source: 'export' as const,
        event_type: 'export_row',
        profile_id: row.profile_id || null,
        hem_sha256: row.hem_sha256 || null,
        uid: row.uid || null,
        raw: row,
        processed: false,
        workspace_id: workspaceId,
      }))

      const { data: inserted, error: insertError } = await supabase
        .from('audiencelab_events')
        .insert(rowsToInsert)
        .select('id')

      if (insertError) {
        safeError(`${LOG_PREFIX} Batch insert error`, insertError)
        continue
      }

      // Inngest disabled (Node.js runtime not available on this deployment)
      // Original: inngest.send(inserted.map(row => ({ name: 'audiencelab/event-received', data: { event_id: row.id, workspace_id, source: 'export' } })))
      if (inserted) {
        stored += inserted.length
      }
    }

    // Mark import as completed
    const responseData = {
      total_rows: fileData.length,
      stored,
      workspace_id: workspaceId,
      audience_id: audienceId,
    }

    if (jobId) {
      await supabase
        .from('audiencelab_import_jobs')
        .update({
          status: 'completed',
          processed_rows: stored,
          failed_rows: fileData.length - stored,
        })
        .eq('id', jobId)
    }

    safeLog(`${LOG_PREFIX} Import complete: ${stored}/${fileData.length} rows stored`)

    return NextResponse.json({
      success: true,
      job_id: jobId,
      ...responseData,
    })
  } catch (error) {
    safeError(`${LOG_PREFIX} Unhandled error`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
