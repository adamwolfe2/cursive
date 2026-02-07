import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { inngest } from '@/inngest/client'
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
  'home services': 'Home Services',
  'home_services': 'Home Services',
  landscaping: 'Landscaping',
  'pest control': 'Pest Control',
  'pest_control': 'Pest Control',
  cleaning: 'Cleaning Services',
  'cleaning services': 'Cleaning Services',
  auto: 'Auto Services',
  'auto services': 'Auto Services',
  legal: 'Legal Services',
  'legal services': 'Legal Services',
  financial: 'Financial Services',
  'financial services': 'Financial Services',
  healthcare: 'Healthcare',
}

// Valid US state codes
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

function calculateLeadScore(lead: any): number {
  let score = 50 // Base score

  // Intent signal strength
  if (lead.intent_signal?.length > 20) score += 15
  if (lead.intent_signal?.toLowerCase().includes('urgent')) score += 10
  if (lead.intent_signal?.toLowerCase().includes('need')) score += 5

  // Contact completeness
  if (lead.email) score += 10
  if (lead.phone) score += 10

  // Location completeness
  if (lead.city) score += 5
  if (lead.zip) score += 5

  return Math.min(100, score)
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization (throws if not admin)
    await requireAdmin()

    const supabase = await createClient()

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const source = formData.get('source') as string || 'admin_upload'

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
        routing_summary: {},
      })
    }

    // Get all workspaces for routing
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, name, allowed_industries, allowed_regions')

    // Process leads
    const results = {
      total: records.length,
      successful: 0,
      failed: 0,
      errors: [] as string[],
      routing_summary: {} as Record<string, number>,
    }

    // Track created leads for event emission
    const createdLeads: Array<{ id: string; workspace_id: string }> = []

    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      const rowNum = i + 2 // Account for header row

      try {
        // Validate required fields
        if (!row.first_name || !row.last_name) {
          results.errors.push(`Row ${rowNum}: Missing first_name or last_name`)
          results.failed++
          continue
        }

        if (!row.email) {
          results.errors.push(`Row ${rowNum}: Missing email`)
          results.failed++
          continue
        }

        const state = normalizeState(row.state)
        if (!state) {
          results.errors.push(`Row ${rowNum}: Invalid state code "${row.state}"`)
          results.failed++
          continue
        }

        const industry = normalizeIndustry(row.industry)
        if (!industry) {
          results.errors.push(`Row ${rowNum}: Invalid industry "${row.industry}"`)
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
          results.errors.push(`Row ${rowNum}: No matching workspace for ${industry} in ${state}`)
          results.failed++
          continue
        }

        // Calculate lead score
        const leadScore = calculateLeadScore(row)

        // Insert lead
        const { data: insertedLead, error: insertError } = await supabase.from('leads').insert({
          workspace_id: matchingWorkspace.id,
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          phone: row.phone || null,
          company_name: row.company_name || `${row.first_name}'s Request`,
          company_industry: industry,
          company_location: {
            address: row.address || null,
            city: row.city || null,
            state: state,
            zip: row.zip || null,
            country: 'US',
          },
          intent_signal: row.intent_signal || null,
          source: source,
          lead_score: leadScore,
          utm_source: row.utm_source || null,
          utm_medium: row.utm_medium || null,
          utm_campaign: row.utm_campaign || null,
          enrichment_status: 'pending',
          delivery_status: 'pending',
        } as any).select('id').single()

        if (insertError) {
          results.errors.push(`Row ${rowNum}: ${insertError.message}`)
          results.failed++
          continue
        }

        results.successful++
        if (insertedLead) {
          createdLeads.push({ id: insertedLead.id, workspace_id: matchingWorkspace.id })
        }

        // Track routing summary
        const workspaceName = matchingWorkspace.name
        results.routing_summary[workspaceName] = (results.routing_summary[workspaceName] || 0) + 1

      } catch (e: any) {
        console.error('[Bulk Upload] Row error:', e)
        results.errors.push(`Row ${rowNum}: Failed to process`)
        results.failed++
      }
    }

    // Emit lead/created events for all uploaded leads (non-blocking)
    if (createdLeads.length > 0) {
      try {
        const events = createdLeads.map((lead) => ({
          name: 'lead/created' as const,
          data: {
            lead_id: lead.id,
            workspace_id: lead.workspace_id,
            source: source,
          },
        }))
        inngest.send(events).catch((err: unknown) => {
          console.error('[Admin Bulk Upload] Failed to emit lead/created events:', err)
        })
      } catch {
        // Best-effort: don't fail upload if event emission fails
      }
    }

    return NextResponse.json({
      success: results.failed === 0,
      ...results,
    })

  } catch (error: any) {
    console.error('[Admin Bulk Upload] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
