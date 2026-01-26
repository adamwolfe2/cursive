/**
 * AI Email Generation API
 * POST /api/ai/generate-email - Generate personalized email using Claude
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateSalesEmail } from '@/lib/services/ai/claude.service'

const generateEmailSchema = z.object({
  lead_id: z.string().uuid().optional(),
  recipient_name: z.string().min(1),
  recipient_title: z.string().optional().default(''),
  recipient_company: z.string().min(1),
  recipient_industry: z.string().optional(),
  value_proposition: z.string().min(1),
  call_to_action: z.string().min(1),
  tone: z.enum(['professional', 'casual', 'friendly', 'urgent']).default('professional'),
  previous_interactions: z.array(z.string()).optional(),
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
      .select('workspace_id, full_name')
      .eq('auth_user_id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get workspace info for sender context
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name, industry_vertical')
      .eq('id', user.workspace_id)
      .single()

    const body = await req.json()
    const {
      lead_id,
      recipient_name,
      recipient_title,
      recipient_company,
      recipient_industry,
      value_proposition,
      call_to_action,
      tone,
      previous_interactions,
    } = generateEmailSchema.parse(body)

    // If lead_id provided, fetch lead data for additional context
    let additionalContext: string[] = []
    if (lead_id) {
      const { data: lead } = await supabase
        .from('leads')
        .select('company_data, contact_data, ai_analysis')
        .eq('id', lead_id)
        .eq('workspace_id', user.workspace_id)
        .single()

      if (lead?.ai_analysis) {
        const analysis = lead.ai_analysis as any
        if (analysis.company?.painPoints) {
          additionalContext.push(`Pain points: ${analysis.company.painPoints.join(', ')}`)
        }
        if (analysis.company?.buyingSignals) {
          additionalContext.push(`Buying signals: ${analysis.company.buyingSignals.join(', ')}`)
        }
      }
    }

    // Generate email using Claude
    const emailDraft = await generateSalesEmail({
      senderName: user.full_name || 'Team Member',
      senderCompany: workspace?.name || 'Cursive',
      senderProduct: workspace?.industry_vertical
        ? `${workspace.industry_vertical} solutions`
        : 'our services',
      recipientName: recipient_name,
      recipientTitle: recipient_title,
      recipientCompany: recipient_company,
      recipientIndustry: recipient_industry,
      valueProposition: value_proposition,
      callToAction: call_to_action,
      tone,
      previousInteractions: [
        ...(previous_interactions || []),
        ...additionalContext,
      ],
    })

    return NextResponse.json({
      success: true,
      email: emailDraft,
    })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('AI email generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
