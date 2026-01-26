/**
 * AI Lead Qualification API
 * POST /api/ai/qualify-lead - Qualify a lead using Claude AI
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { qualifyLead, analyzeCompany } from '@/lib/services/ai/claude.service'

const qualifyLeadSchema = z.object({
  lead_id: z.string().uuid(),
  save_results: z.boolean().optional().default(true),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const { lead_id, save_results } = qualifyLeadSchema.parse(body)

    // Fetch lead data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .eq('workspace_id', user.workspace_id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Get workspace ICP settings
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('industry_vertical, allowed_industries, allowed_regions')
      .eq('id', user.workspace_id)
      .single()

    const companyData = lead.company_data as any
    const contactData = lead.contact_data as any

    // Run AI qualification
    const [qualificationResult, companyAnalysis] = await Promise.all([
      qualifyLead(
        {
          companyName: companyData?.name,
          companyDomain: companyData?.domain,
          industry: companyData?.industry,
          companySize: companyData?.size,
          contactName: contactData?.contacts?.[0]?.full_name,
          contactTitle: contactData?.contacts?.[0]?.title,
          contactEmail: contactData?.contacts?.[0]?.email,
          location: companyData?.location?.state || companyData?.location?.country,
          technologies: companyData?.technologies,
          intentSignals: companyData?.intent_signals?.map((s: any) => s.signal_type),
        },
        {
          targetIndustries: workspace?.allowed_industries || [workspace?.industry_vertical || 'Any'],
          targetCompanySize: ['startup', 'small', 'medium', 'large', 'enterprise'],
          targetTitles: ['CEO', 'CTO', 'VP', 'Director', 'Manager', 'Owner', 'Founder'],
          targetLocations: workspace?.allowed_regions || ['US'],
        }
      ),
      analyzeCompany({
        name: companyData?.name,
        domain: companyData?.domain,
        description: companyData?.description,
        industry: companyData?.industry,
      }),
    ])

    // Save results if requested
    if (save_results) {
      await supabase
        .from('leads')
        .update({
          qualification_score: qualificationResult.score,
          qualification_tier: qualificationResult.tier,
          next_action: qualificationResult.nextBestAction,
          ai_analysis: {
            qualification: qualificationResult,
            company: companyAnalysis,
            analyzed_at: new Date().toISOString(),
          },
        })
        .eq('id', lead_id)
        .eq('workspace_id', user.workspace_id) // Workspace isolation

      // Log activity
      await supabase.from('lead_activities').insert({
        lead_id,
        workspace_id: user.workspace_id,
        activity_type: 'enriched',
        description: `AI qualification: ${qualificationResult.tier} (${qualificationResult.score}/100)`,
        metadata: {
          score: qualificationResult.score,
          tier: qualificationResult.tier,
        },
      })
    }

    return NextResponse.json({
      success: true,
      qualification: qualificationResult,
      company_analysis: companyAnalysis,
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('AI qualification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
