import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { parse } from 'csv-parse/sync'

// Industry mapping
const INDUSTRY_MAP: Record<string, string> = {
  hvac: 'HVAC',
  roofing: 'Roofing',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  solar: 'Solar',
  'real estate': 'Real Estate',
  'real_estate': 'Real Estate',
  realestate: 'Real Estate',
  insurance: 'Insurance',
  landscaping: 'Landscaping',
  'pest control': 'Pest Control',
  cleaning: 'Cleaning Services',
  auto: 'Auto Services',
  legal: 'Legal Services',
  financial: 'Financial Services',
  healthcare: 'Healthcare',
}

const VALID_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]

function normalizeIndustry(industry: string): string | null {
  const normalized = industry?.toLowerCase().trim()
  return INDUSTRY_MAP[normalized] || null
}

function normalizeState(state: string): string | null {
  const normalized = state?.toUpperCase().trim()
  return VALID_STATES.includes(normalized) ? normalized : null
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key')

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }

    const supabase = await createServerClient()

    // Validate partner
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id, payout_rate')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single()

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Parse CSV
    const csvContent = await file.text()
    let records: any[]

    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    } catch (e: any) {
      return NextResponse.json({
        success: false,
        total: 0,
        successful: 0,
        failed: 0,
        errors: [`CSV parsing error: ${e.message}`],
      })
    }

    // Get workspaces for routing
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, name, allowed_industries, allowed_regions')

    // Process leads
    const results = {
      total: records.length,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      const rowNum = i + 2

      try {
        if (!row.first_name || !row.last_name || !row.email) {
          results.errors.push(`Row ${rowNum}: Missing required fields`)
          results.failed++
          continue
        }

        const state = normalizeState(row.state)
        if (!state) {
          results.errors.push(`Row ${rowNum}: Invalid state`)
          results.failed++
          continue
        }

        const industry = normalizeIndustry(row.industry)
        if (!industry) {
          results.errors.push(`Row ${rowNum}: Invalid industry`)
          results.failed++
          continue
        }

        // Find matching workspace
        const matchingWorkspace = workspaces?.find((w) => {
          const matchesIndustry = w.allowed_industries?.includes(industry)
          const matchesState = w.allowed_regions?.includes(state)
          return matchesIndustry && matchesState
        })

        if (!matchingWorkspace) {
          results.errors.push(`Row ${rowNum}: No matching business`)
          results.failed++
          continue
        }

        // Insert lead
        const { error: insertError } = await supabase.from('leads').insert({
          workspace_id: matchingWorkspace.id,
          partner_id: partner.id,
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          phone: row.phone || null,
          company_name: row.company_name || `${row.first_name}'s Request`,
          company_industry: industry,
          company_location: {
            city: row.city || null,
            state: state,
            country: 'US',
          },
          intent_signal: row.intent_signal || null,
          source: 'partner',
          lead_score: 60,
          utm_source: row.utm_source || `partner_${partner.id}`,
          enrichment_status: 'pending',
          delivery_status: 'pending',
        } as any)

        if (insertError) {
          results.errors.push(`Row ${rowNum}: ${insertError.message}`)
          results.failed++
          continue
        }

        results.successful++
      } catch (e: any) {
        results.errors.push(`Row ${rowNum}: ${e.message}`)
        results.failed++
      }
    }

    // Update partner earnings
    if (results.successful > 0) {
      const earnings = results.successful * Number(partner.payout_rate)
      await supabase.rpc('increment_partner_earnings', {
        p_partner_id: partner.id,
        p_amount: earnings,
      }).catch(() => {
        // Function might not exist yet - that's ok
      })
    }

    return NextResponse.json({
      success: results.failed === 0,
      ...results,
    })
  } catch (error: any) {
    console.error('Partner upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
