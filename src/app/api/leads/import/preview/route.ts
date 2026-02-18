/**
 * Lead Import Preview API
 * Cursive Platform
 *
 * Preview and validate CSV data before importing to database.
 */


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { leadDataProcessor } from '@/lib/services/lead-data-processor.service'
import { fieldMapper } from '@/lib/services/field-mapper.service'
import { safeError } from '@/lib/utils/log-sanitizer'

// ============================================
// POST /api/leads/import/preview
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

    // Parse request body
    const body = await req.json()
    const { rows, options } = body as {
      rows: Array<Record<string, string>>
      options?: {
        autoCorrect?: boolean
        validateEmail?: boolean
        normalizePhone?: boolean
        normalizeAddress?: boolean
      }
    }

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: 'Invalid request: rows must be an array' },
        { status: 400 }
      )
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No data rows provided' },
        { status: 400 }
      )
    }

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
    safeError('Import preview error:', error)
    return NextResponse.json(
      { error: 'Failed to preview import' },
      { status: 500 }
    )
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
    safeError('Get fields error:', error)
    return NextResponse.json(
      { error: 'Failed to get field definitions' },
      { status: 500 }
    )
  }
}
