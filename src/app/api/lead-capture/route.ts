import { NextRequest, NextResponse } from 'next/server'
import { safeError } from '@/lib/utils/log-sanitizer'
import { withRateLimit } from '@/lib/middleware/rate-limiter'
import { z } from 'zod'
import { handleApiError } from '@/lib/utils/api-error-handler'

const leadCaptureSchema = z.object({
  email: z.string().email(),
  name: z.string().max(200).optional(),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  company: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  website: z.string().max(500).optional(),
  industry: z.string().max(200).optional(),
  monthly_visitors: z.string().max(100).optional(),
  message: z.string().max(2000).optional(),
  source: z.string().max(100).optional(),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
}).passthrough()

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await withRateLimit(req, 'public-form')
    if (rateLimited) return rateLimited

    const body = leadCaptureSchema.parse(await req.json())
    const webhookUrl = process.env.NEXT_PUBLIC_LEAD_WEBHOOK_URL

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          timestamp: new Date().toISOString(),
          source: 'superpixel_calculator',
        }),
      }).catch((err) => safeError('[LeadCapture] Pixel notify failed:', err))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
