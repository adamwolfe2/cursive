export const maxDuration = 30

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const requestSchema = z.object({
  industry: z.string().min(1),
  company_description: z.string().optional(),
  packages: z.array(z.string()).optional(),
})

const INDUSTRY_SUGGESTIONS: Record<string, {
  titles: string[]
  pain_points: string[]
  keywords: string[]
}> = {
  'B2B SaaS': {
    titles: ['VP Marketing', 'Head of Growth', 'Director of Demand Gen', 'CMO', 'VP Sales', 'Head of RevOps'],
    pain_points: ['High CAC on paid channels', 'Inbound pipeline slowing down', 'SDR team productivity declining', 'Low MQL to SQL conversion rates'],
    keywords: ['B2B lead generation', 'demand generation', 'outbound sales', 'sales pipeline', 'account-based marketing'],
  },
  'Technology': {
    titles: ['CTO', 'VP Engineering', 'Head of IT', 'Director of Technology', 'VP Product'],
    pain_points: ['Vendor evaluation overload', 'Integration complexity', 'Security compliance requirements', 'Scaling infrastructure costs'],
    keywords: ['enterprise software', 'SaaS tools', 'digital transformation', 'cloud migration', 'tech stack optimization'],
  },
  'Marketing Agency': {
    titles: ['Agency Owner', 'Founder', 'CEO', 'Managing Director', 'Head of Client Services'],
    pain_points: ['Client acquisition inconsistency', 'Relying on referrals only', 'Scaling beyond founder-led sales', 'Differentiating from competitors'],
    keywords: ['agency growth', 'client acquisition', 'white label', 'agency scaling', 'GHL agency'],
  },
  'E-commerce': {
    titles: ['Founder', 'CEO', 'Head of Marketing', 'E-commerce Manager', 'Growth Lead', 'DTC Brand Manager'],
    pain_points: ['Rising Meta/Google ad costs', 'Anonymous visitor identification', 'Email list growth stalled', 'Retargeting limitations'],
    keywords: ['identity resolution', 'website visitor identification', 'retargeting', 'abandoned cart recovery', 'Klaviyo integration'],
  },
  'Financial Services': {
    titles: ['CFO', 'VP Finance', 'Controller', 'Head of Business Development', 'Managing Director'],
    pain_points: ['Compliance-heavy outreach requirements', 'Long sales cycles', 'High-value prospect identification', 'Trust-building at scale'],
    keywords: ['financial services marketing', 'wealth management leads', 'fintech outreach', 'compliance-friendly outbound'],
  },
  'Healthcare': {
    titles: ['VP Operations', 'Practice Manager', 'Chief Medical Officer', 'Head of Business Development'],
    pain_points: ['HIPAA-compliant communication', 'Patient acquisition costs', 'Provider network expansion', 'Digital transformation resistance'],
    keywords: ['healthcare marketing', 'medical practice growth', 'patient acquisition', 'healthtech leads'],
  },
  'Professional Services': {
    titles: ['Managing Partner', 'Director of Business Development', 'VP Client Services', 'Head of Growth'],
    pain_points: ['Project-based revenue unpredictability', 'Relationship-dependent sales', 'Scaling beyond personal network', 'Proposal win rate optimization'],
    keywords: ['consulting leads', 'professional services growth', 'B2B services marketing', 'client pipeline'],
  },
  'Real Estate': {
    titles: ['Broker', 'Team Lead', 'Director of Sales', 'VP of Acquisitions', 'Property Manager'],
    pain_points: ['Lead quality from portals', 'High cost per lead', 'Market timing sensitivity', 'Geographic targeting precision'],
    keywords: ['real estate leads', 'property investor outreach', 'commercial real estate prospecting', 'CRE leads'],
  },
}

// Fallback for unrecognized industries
const DEFAULT_SUGGESTIONS = {
  titles: ['CEO', 'VP Marketing', 'Head of Growth', 'Director of Operations', 'Founder'],
  pain_points: ['Pipeline generation challenges', 'Outbound scalability', 'Lead quality issues', 'Rising customer acquisition costs'],
  keywords: ['lead generation', 'outbound sales', 'demand generation', 'B2B marketing'],
}

/**
 * Returns ICP suggestions based on industry.
 * No auth required — used on the public client form.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { industry } = parsed.data

    // Find best match
    const industryLower = industry.toLowerCase()
    let suggestions = DEFAULT_SUGGESTIONS

    for (const [key, value] of Object.entries(INDUSTRY_SUGGESTIONS)) {
      if (industryLower.includes(key.toLowerCase()) || key.toLowerCase().includes(industryLower)) {
        suggestions = value
        break
      }
    }

    return NextResponse.json({ data: suggestions })
  } catch {
    return NextResponse.json({ data: DEFAULT_SUGGESTIONS })
  }
}
