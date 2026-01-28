// Partner Upload Status - Polling Endpoint
// Returns current processing status and progress for an upload batch

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{ batchId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { batchId } = await params
  const adminClient = createAdminClient()

  try {
    const apiKey = request.headers.get('X-API-Key')

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }

    // Validate partner
    const { data: partner, error: partnerError } = await adminClient
      .from('partners')
      .select('id')
      .eq('api_key', apiKey)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Get batch status
    const { data: batch, error: batchError } = await adminClient
      .from('partner_upload_batches')
      .select(`
        id,
        partner_id,
        file_name,
        status,
        total_rows,
        processed_rows,
        valid_rows,
        invalid_rows,
        duplicate_rows,
        marketplace_listed,
        progress_percent,
        rows_per_second,
        estimated_completion_at,
        error_message,
        rejected_rows_url,
        started_at,
        completed_at,
        created_at
      `)
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    if (batch.partner_id !== partner.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Calculate elapsed time
    let elapsedSeconds: number | null = null
    if (batch.started_at) {
      const startTime = new Date(batch.started_at).getTime()
      const endTime = batch.completed_at
        ? new Date(batch.completed_at).getTime()
        : Date.now()
      elapsedSeconds = Math.round((endTime - startTime) / 1000)
    }

    // Build response based on status
    const response: Record<string, unknown> = {
      batch_id: batch.id,
      file_name: batch.file_name,
      status: batch.status,
      progress: {
        total_rows: batch.total_rows,
        processed_rows: batch.processed_rows || 0,
        percent: Math.round((batch.progress_percent || 0) * 100) / 100,
      },
      results: {
        valid: batch.valid_rows || 0,
        invalid: batch.invalid_rows || 0,
        duplicates: batch.duplicate_rows || 0,
        marketplace_listed: batch.marketplace_listed || 0,
      },
      timing: {
        started_at: batch.started_at,
        completed_at: batch.completed_at,
        elapsed_seconds: elapsedSeconds,
        rows_per_second: batch.rows_per_second
          ? Math.round(batch.rows_per_second)
          : null,
        estimated_completion: batch.estimated_completion_at,
      },
    }

    // Add error info if failed
    if (batch.status === 'failed' && batch.error_message) {
      response.error = batch.error_message
    }

    // Add rejected rows download if available
    if (batch.rejected_rows_url) {
      response.rejected_rows_url = batch.rejected_rows_url
    }

    // Add completion summary if done
    if (batch.status === 'completed') {
      response.summary = {
        success_rate: batch.total_rows
          ? Math.round(((batch.valid_rows || 0) / batch.total_rows) * 100)
          : 0,
        duplicate_rate: batch.total_rows
          ? Math.round(((batch.duplicate_rows || 0) / batch.total_rows) * 100)
          : 0,
        processing_time_seconds: elapsedSeconds,
        leads_available_for_sale: batch.marketplace_listed || 0,
      }
    }

    return NextResponse.json(response)
  } catch (error: unknown) {
    console.error('Upload status error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Status check failed: ${message}` }, { status: 500 })
  }
}
