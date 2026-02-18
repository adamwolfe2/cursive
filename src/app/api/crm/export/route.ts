/**
 * CRM Lead Export API
 * POST /api/crm/export - Export CRM leads to CSV or XLSX
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, badRequest } from '@/lib/utils/api-error-handler'
import { createClient } from '@/lib/supabase/server'
import { logDataExport } from '@/lib/services/audit.service'
import { z } from 'zod'
import { sanitizeSearchTerm } from '@/lib/utils/sanitize-search'
import { safeError } from '@/lib/utils/log-sanitizer'

const MAX_EXPORT_ROWS = 10_000

const exportRequestSchema = z.object({
  leadIds: z.array(z.string().uuid()).optional(),
  format: z.enum(['csv', 'xlsx']),
  filters: z
    .object({
      status: z.array(z.string()).optional(),
      industries: z.array(z.string()).optional(),
      states: z.array(z.string()).optional(),
      companySizes: z.array(z.string()).optional(),
      intentScoreMin: z.number().min(0).max(100).optional(),
      intentScoreMax: z.number().min(0).max(100).optional(),
      tags: z.array(z.string()).optional(),
      search: z.string().max(200).optional(),
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
    })
    .optional(),
})

const EXPORT_FIELDS = [
  'id',
  'email',
  'first_name',
  'last_name',
  'phone',
  'company_name',
  'company_industry',
  'title',
  'city',
  'state',
  'company_size',
  'source',
  'status',
  'tags',
  'intent_score_calculated',
  'freshness_score',
  'verification_status',
  'linkedin_url',
  'created_at',
  'last_contacted_at',
  'notes',
] as const

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    // 2. Validate input
    const body = await request.json()
    const validated = exportRequestSchema.parse(body)

    // 3. Query leads with workspace isolation
    const supabase = await createClient()

    let query = supabase
      .from('leads')
      .select(EXPORT_FIELDS.join(', '))
      .eq('workspace_id', user.workspace_id)
      .order('created_at', { ascending: false })

    // If specific leadIds provided, filter to those
    if (validated.leadIds && validated.leadIds.length > 0) {
      if (validated.leadIds.length > MAX_EXPORT_ROWS) {
        return badRequest(`Cannot export more than ${MAX_EXPORT_ROWS} leads at once`)
      }
      query = query.in('id', validated.leadIds)
    }

    // Apply filters if no specific IDs
    if (!validated.leadIds && validated.filters) {
      const filters = validated.filters

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }
      if (filters.industries && filters.industries.length > 0) {
        query = query.in('company_industry', filters.industries)
      }
      if (filters.states && filters.states.length > 0) {
        query = query.in('state', filters.states)
      }
      if (filters.companySizes && filters.companySizes.length > 0) {
        query = query.in('company_size', filters.companySizes)
      }
      if (filters.intentScoreMin !== undefined) {
        query = query.gte('intent_score_calculated', filters.intentScoreMin)
      }
      if (filters.intentScoreMax !== undefined) {
        query = query.lte('intent_score_calculated', filters.intentScoreMax)
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }
      if (filters.search) {
        const term = sanitizeSearchTerm(filters.search)
        query = query.or(
          `first_name.ilike.%${term}%,` +
            `last_name.ilike.%${term}%,` +
            `email.ilike.%${term}%,` +
            `company_name.ilike.%${term}%`
        )
      }
    }

    // Enforce max rows
    query = query.limit(MAX_EXPORT_ROWS)

    const { data: leads, error } = await query

    if (error) {
      safeError('[CRM Export] Database error:', error.message)
      throw new Error('Failed to fetch leads for export')
    }

    if (!leads || leads.length === 0) {
      return badRequest('No leads found matching the criteria')
    }

    // 4. Format output
    const timestamp = new Date().toISOString().split('T')[0]

    if (validated.format === 'csv') {
      const csv = convertLeadsToCSV(leads)

      // Log export for audit
      const ipAddress =
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        undefined
      await logDataExport(user.workspace_id, user.id, 'crm_leads_csv', leads.length, ipAddress)

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="crm-leads-${timestamp}.csv"`,
          'X-Row-Count': leads.length.toString(),
        },
      })
    }

    // XLSX format: return as JSON with xlsx content type for client-side processing
    // The client can use a library like SheetJS to convert this to a proper .xlsx file
    const xlsxData = {
      sheets: [
        {
          name: 'CRM Leads',
          headers: EXPORT_FIELDS.map(formatHeader),
          rows: leads.map((lead: Record<string, any>) =>
            EXPORT_FIELDS.map((field) => formatCellValue(lead[field]))
          ),
        },
      ],
      metadata: {
        exportedAt: new Date().toISOString(),
        rowCount: leads.length,
        exportedBy: user.email,
      },
    }

    // Log export for audit
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      undefined
    await logDataExport(user.workspace_id, user.id, 'crm_leads_xlsx', leads.length, ipAddress)

    return new NextResponse(JSON.stringify(xlsxData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="crm-leads-${timestamp}.xlsx.json"`,
        'X-Row-Count': leads.length.toString(),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// ============ Helpers ============

function convertLeadsToCSV(leads: Record<string, any>[]): string {
  const lines: string[] = []

  // Header row
  lines.push(EXPORT_FIELDS.map(formatHeader).join(','))

  // Data rows
  for (const lead of leads) {
    const values = EXPORT_FIELDS.map((field) => escapeCSVValue(lead[field]))
    lines.push(values.join(','))
  }

  return lines.join('\n')
}

function formatHeader(field: string): string {
  return field
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }

  // Handle arrays (e.g., tags)
  if (Array.isArray(value)) {
    const str = value.join('; ')
    return `"${str.replace(/"/g, '""')}"`
  }

  const str = String(value)

  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

function formatCellValue(value: any): string | number | null {
  if (value === null || value === undefined) {
    return null
  }
  if (Array.isArray(value)) {
    return value.join('; ')
  }
  if (typeof value === 'number') {
    return value
  }
  return String(value)
}
