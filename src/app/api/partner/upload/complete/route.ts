// Partner Upload Completion - Triggers Background Processing
// Called after file is uploaded to storage, triggers Inngest job

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { inngest } from '@/inngest/client'

const completeSchema = z.object({
  batch_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const adminClient = createAdminClient()

  try {
    const apiKey = request.headers.get('X-API-Key')

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }

    // Parse and validate request
    const body = await request.json()
    const parseResult = completeSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({
        error: 'Invalid request',
        details: parseResult.error.issues,
      }, { status: 400 })
    }

    const { batch_id } = parseResult.data

    // Validate partner owns this batch
    const { data: partner, error: partnerError } = await adminClient
      .from('partners')
      .select('id')
      .eq('api_key', apiKey)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Get batch and verify ownership
    const { data: batch, error: batchError } = await adminClient
      .from('partner_upload_batches')
      .select('id, partner_id, storage_path, status, file_size_bytes')
      .eq('id', batch_id)
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    }

    if (batch.partner_id !== partner.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (batch.status !== 'pending') {
      return NextResponse.json({
        error: 'Batch already processed',
        status: batch.status,
      }, { status: 400 })
    }

    if (!batch.storage_path) {
      return NextResponse.json({
        error: 'No storage path for this batch',
      }, { status: 400 })
    }

    // Verify file exists in storage
    const { data: fileExists } = await adminClient
      .storage
      .from('partner-uploads')
      .list(batch.storage_path.split('/').slice(0, -1).join('/'), {
        search: batch.storage_path.split('/').pop(),
      })

    if (!fileExists || fileExists.length === 0) {
      return NextResponse.json({
        error: 'File not found in storage. Please upload the file first.',
      }, { status: 400 })
    }

    // Update batch status
    await adminClient
      .from('partner_upload_batches')
      .update({
        status: 'validating',
        started_at: new Date().toISOString(),
      })
      .eq('id', batch_id)

    // Trigger background processing job
    await inngest.send({
      name: 'partner/upload.process',
      data: {
        batch_id: batch_id,
        partner_id: partner.id,
        storage_path: batch.storage_path,
      },
    })

    return NextResponse.json({
      success: true,
      batch_id: batch_id,
      status: 'validating',
      message: 'Upload received. Processing started.',
      status_url: `/api/partner/upload/status/${batch_id}`,
      estimated_time_seconds: estimateProcessingTime(batch.file_size_bytes || 0),
    })
  } catch (error: unknown) {
    console.error('Upload completion error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Completion failed: ${message}` }, { status: 500 })
  }
}

/**
 * Estimate processing time based on file size
 * ~5k rows per second with validation and dedup
 */
function estimateProcessingTime(fileSizeBytes: number): number {
  // Rough estimate: 100 bytes per row average
  const estimatedRows = fileSizeBytes / 100
  const rowsPerSecond = 5000
  return Math.ceil(estimatedRows / rowsPerSecond)
}
