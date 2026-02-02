/**
 * Lead Import API
 * Handles CSV/Excel import for leads
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { CRMLeadRepository } from '@/lib/repositories/crm-lead.repository'
import { z } from 'zod'

// Use edge runtime for better performance
export const runtime = 'edge'

// CSV parsing for edge runtime (simple implementation)
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

  // Parse rows
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    if (values.length === headers.length) {
      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      rows.push(row)
    }
  }

  return rows
}

const leadSchema = z.object({
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  title: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  source: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    // Check auth
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file type
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are supported' },
        { status: 400 }
      )
    }

    // Read file content
    const text = await file.text()
    const rows = parseCSV(text)

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No data found in CSV file' },
        { status: 400 }
      )
    }

    // Validate and import leads
    const leadRepo = new CRMLeadRepository()
    const results: { success: boolean; row: number; error?: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      try {
        // Validate row data
        const validatedData = leadSchema.parse(row)

        // Create lead
        await leadRepo.create({
          workspace_id: user.workspace_id,
          email: validatedData.email,
          first_name: validatedData.first_name || null,
          last_name: validatedData.last_name || null,
          phone: validatedData.phone || null,
          company_name: validatedData.company_name || null,
          title: validatedData.title || null,
          city: validatedData.city || null,
          state: validatedData.state || null,
          source: validatedData.source || 'import',
          status: 'new',
        })

        results.push({ success: true, row: i + 2 }) // +2 for header and 0-index
      } catch (error) {
        const errorMsg = error instanceof z.ZodError
          ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          : error instanceof Error
          ? error.message
          : 'Unknown error'

        results.push({
          success: false,
          row: i + 2,
          error: errorMsg,
        })
      }
    }

    // Calculate statistics
    const imported = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const errors = results
      .filter(r => !r.success)
      .map(r => `Row ${r.row}: ${r.error}`)

    return NextResponse.json({
      success: imported > 0,
      imported,
      failed,
      total: rows.length,
      errors: errors.slice(0, 10), // Limit error messages
    })
  } catch (error) {
    console.error('[Lead Import] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process import',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
