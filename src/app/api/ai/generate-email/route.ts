/**
 * AI Email Generation API
 * POST /api/ai/generate-email - Generate personalized email using Claude
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { createClient } from '@/lib/supabase/server'
import { generateSalesEmail } from '@/lib/services/ai/claude.service'
import { withRateLimit, getRequestIdentifier } from '@/lib/middleware/rate-limiter'

/** Structure of the ai_analysis JSONB column on leads */
interface LeadAiAnalysis {
  company?: {
    painPoints?: string[]
    buyingSignals?: string[]
    competitors?: string[]
    opportunities?: string[]
  }
  contact?: {
    interests?: string[]
    communicationStyle?: string
  }
  score?: number
  summary?: string
}

const generateEmailSchema = z.object({
  lead_id: z.string().uuid().optional(),
  recipient_name: z.string().min(1).max(100),
  recipient_title: z.string().max(100).optional().default(''),
  recipient_company: z.string().min(1).max(200),
  recipient_industry: z.string().max(100).optional(),
  value_proposition: z.string().min(1).max(500),
  call_to_action: z.string().min(1).max(200),
  tone: z.enum(['professional', 'casual', 'friendly', 'urgent']).default('professional'),
  previous_interactions: z.array(z.string().max(200)).max(10).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    // Rate limit: AI email generation is expensive (Claude API) — 100/hour per user
    const rateLimitResponse = await withRateLimit(req, 'ai-generate-email', getRequestIdentifier(req, user.id))
    if (rateLimitResponse) return rateLimitResponse

    const supabase = await createClient()

    // Get workspace info for sender context
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name, industry_vertical')
      .eq('id', user.workspace_id)
      .maybeSingle()

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
        .maybeSingle()

      if (lead?.ai_analysis) {
        const analysis = lead.ai_analysis as LeadAiAnalysis
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
  } catch (error) {
    return handleApiError(error)
  }
}
