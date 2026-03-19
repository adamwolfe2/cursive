/**
 * Lead Import Preview API
 * Cursive Platform
 *
 * Preview and validate CSV data before importing to database.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { leadDataProcessor } from '@/lib/services/lead-data-processor.service'
import { fieldMapper } from '@/lib/services/field-mapper.service'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'

const importPreviewSchema = z.object({
  rows: z.array(z.record(z.string())).min(1, 'At least one data row is required').max(10000),
  options: z.object({
    autoCorrect: z.boolean().optional(),
    validateEmail: z.boolean().optional(),
    normalizePhone: z.boolean().optional(),
    normalizeAddress: z.boolean().optional(),
  }).optional(),
})

// ============================================
// POST /api/leads/import/preview
// ============================================

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    // Parse and validate request body
    const body = await req.json()
    const validationResult = importPreviewSchema.safeParse(body)

    if (!validationResult.success) {
      if (validationResult.error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request', details: validationResult.error.errors },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Invalid request: rows must be a non-empty array' },
        { status: 400 }
      )
    }

    const { rows, options } = validationResult.data

    // Preview the import
    const preview = await leadDataProcessor.previewImport(rows, {
      autoCorrect: options?.autoCorrect ?? true,
      validateEmail: options?.validateEmail ?? true,
      normalizePhone: options?.normalizePhone ?? true,
      normalizeAddress: options?.normalizeAddress ?? true,
      geocode: false, // Don't geocode during preview
    })

    return NextResponse.json({
      success: true,
      data: {
        mappings: preview.mappings,
        sampleRows: preview.sampleRows.map((row) => ({
          ...row,
          _raw: undefined, // Don't send raw data back
        })),
        summary: preview.summary,
        standardFields: fieldMapper.getStandardFields().map((f) => ({
          name: f.name,
          type: f.type,
          required: f.required,
          category: f.category,
        })),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// ============================================
// GET /api/leads/import/preview
// Get available standard fields for mapping UI
// ============================================

export async function GET() {
  try {
    const standardFields = fieldMapper.getStandardFields()

    const fieldsByCategory = {
      person: standardFields.filter((f) => f.category === 'person'),
      company: standardFields.filter((f) => f.category === 'company'),
      location: standardFields.filter((f) => f.category === 'location'),
      meta: standardFields.filter((f) => f.category === 'meta'),
    }

    return NextResponse.json({
      success: true,
      data: {
        fields: standardFields.map((f) => ({
          name: f.name,
          type: f.type,
          required: f.required,
          category: f.category,
          aliases: f.aliases.slice(0, 5), // Sample aliases
        })),
        fieldsByCategory,
        requiredFields: standardFields.filter((f) => f.required).map((f) => f.name),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
