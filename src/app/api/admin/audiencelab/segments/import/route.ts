/**
 * POST /api/admin/audiencelab/segments/import
 * Accepts raw CSV text — parses and upserts all rows server-side in one call.
 * Single HTTP request = no Vercel rate limiting. Idempotent — safe to re-run.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRole } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { handleApiError } from '@/lib/utils/api-error-handler'
import { safeError } from '@/lib/utils/log-sanitizer'

// ── CSV parser (handles quoted fields) ──────────────────────────────────────
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  const parseRow = (line: string): string[] => {
    const fields: string[] = []
    let cur = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
        else { inQuote = !inQuote }
      } else if (ch === ',' && !inQuote) {
        fields.push(cur); cur = ''
      } else {
        cur += ch
      }
    }
    fields.push(cur)
    return fields
  }

  const headers = parseRow(lines[0]).map(h => h.trim())
  return lines.slice(1).map(line => {
    const vals = parseRow(line)
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = (vals[i] ?? '').trim() })
    return obj
  })
}

function mapRow(row: Record<string, string>) {
  return {
    segment_id:   String(row['segment_id']   || row['Segment ID']   || '').trim(),
    category:     String(row['category']     || row['Category']     || '').trim(),
    sub_category: (row['sub_category'] || row['Sub Category'] || '').trim() || null,
    name:         String(row['name']         || row['Premade']      || '').trim(),
    description:  (row['description']  || row['Premade Description'] || '').trim() || null,
    keywords:     (row['keywords']     || row['Premade Keywords']    || '').trim() || null,
    type:         String(row['type']         || row['Type']         || 'B2C').trim(),
  }
}

const CHUNK = 500

export async function POST(request: NextRequest) {
  try {
    await requireAdminRole()

    const text = await request.text()
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 })
    }

    const rows = parseCSV(text).map(mapRow).filter(r => r.segment_id && r.name)
    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid rows found in CSV' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    let totalCount = 0

    for (let i = 0; i < rows.length; i += CHUNK) {
      const batch = rows.slice(i, i + CHUNK)
      const { error, count } = await adminClient
        .from('al_segment_catalog')
        .upsert(batch, { onConflict: 'segment_id', count: 'exact' })
      if (error) throw error
      totalCount += count ?? batch.length
    }

    return NextResponse.json({ success: true, count: totalCount, total: rows.length })
  } catch (error) {
    safeError('[Admin Segments Import]', error)
    return handleApiError(error)
  }
}
