// Partner Upload Initiation - Storage-First Approach
// For large files (>5MB), returns a signed URL for direct upload to storage
// Then triggers background processing via Inngest

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { inngest } from '@/inngest/client'

const SMALL_FILE_THRESHOLD = 5 * 1024 * 1024 // 5MB - files under this use direct upload
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB max
const MAX_ROWS = 100000 // 100k rows max

const initiateSchema = z.object({
  file_name: z.string().min(1).max(255),
  file_size: z.number().min(1).max(MAX_FILE_SIZE),
  file_type: z.enum(['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  estimated_rows: z.number().min(1).max(MAX_ROWS).optional(),
})

export async function POST(request: NextRequest) {
  const adminClient = createAdminClient()

  try {
    const apiKey = request.headers.get('X-API-Key')

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }

    // Validate partner
    const { data: partner, error: partnerError } = await adminClient
      .from('partners')
      .select('id, name, is_active, status')
      .eq('api_key', apiKey)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    if (!partner.is_active || partner.status === 'suspended') {
      return NextResponse.json({ error: 'Partner account is suspended' }, { status: 403 })
    }

    // Parse and validate request
    const body = await request.json()
    const parseResult = initiateSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({
        error: 'Invalid request',
        details: parseResult.error.issues,
      }, { status: 400 })
    }

    const { file_name, file_size, file_type, estimated_rows } = parseResult.data

    // Determine upload strategy
    const useStorageFirst = file_size > SMALL_FILE_THRESHOLD

    // Generate storage path
    const timestamp = Date.now()
    const sanitizedFileName = file_name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `partner-uploads/${partner.id}/${timestamp}_${sanitizedFileName}`

    // Create upload batch record
    const { data: batch, error: batchError } = await adminClient
      .from('partner_upload_batches')
      .insert({
        partner_id: partner.id,
        file_name: file_name,
        file_size_bytes: file_size,
        file_type: file_type.includes('csv') ? 'csv' : 'xlsx',
        total_rows: estimated_rows || 0,
        status: useStorageFirst ? 'pending' : 'validating',
        storage_path: useStorageFirst ? storagePath : null,
        chunk_size: calculateOptimalChunkSize(estimated_rows),
      })
      .select('id')
      .single()

    if (batchError) {
      console.error('Failed to create upload batch:', batchError)
      return NextResponse.json({
        error: 'Failed to initiate upload',
      }, { status: 500 })
    }

    if (useStorageFirst) {
      // Generate signed upload URL
      const { data: signedUrl, error: urlError } = await adminClient
        .storage
        .from('partner-uploads')
        .createSignedUploadUrl(storagePath)

      if (urlError) {
        console.error('Failed to create signed URL:', urlError)
        // Fallback to direct upload if storage fails
        return NextResponse.json({
          batch_id: batch.id,
          upload_strategy: 'direct',
          direct_upload_url: `/api/partner/upload`,
          message: 'Storage unavailable, use direct upload',
        })
      }

      return NextResponse.json({
        batch_id: batch.id,
        upload_strategy: 'storage_first',
        signed_url: signedUrl.signedUrl,
        token: signedUrl.token,
        storage_path: storagePath,
        expires_in_seconds: 3600, // 1 hour
        max_file_size: MAX_FILE_SIZE,
        callback_url: `/api/partner/upload/complete`,
        instructions: [
          'Upload file to signed_url using PUT request',
          'Include Content-Type header matching file type',
          'After upload completes, POST to callback_url with batch_id',
          'Poll /api/partner/upload/status/{batch_id} for progress',
        ],
      })
    } else {
      // Small file - use direct upload
      return NextResponse.json({
        batch_id: batch.id,
        upload_strategy: 'direct',
        direct_upload_url: `/api/partner/upload`,
        max_file_size: SMALL_FILE_THRESHOLD,
        message: 'File size allows direct upload',
      })
    }
  } catch (error: unknown) {
    console.error('Upload initiation error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Initiation failed: ${message}` }, { status: 500 })
  }
}

/**
 * Calculate optimal chunk size based on estimated rows
 * Balances memory usage vs. number of database transactions
 */
function calculateOptimalChunkSize(estimatedRows?: number): number {
  if (!estimatedRows) return 1000

  // For very large files, use larger chunks to reduce transactions
  if (estimatedRows > 50000) return 2000
  if (estimatedRows > 20000) return 1500

  return 1000
}
