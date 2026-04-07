/**
 * POST /api/outbound/icp/generate
 *
 * Body: { product_text: string }
 * Returns: IcpGenerationResult — structured filter primitives + summaries
 *
 * Called by the SetupForm "Generate ICP" button on /outbound/new and
 * /outbound/[id]/edit pages.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized } from '@/lib/utils/api-error-handler'
import { generateIcpFromProduct } from '@/lib/services/outbound/icp-generator.service'
import { safeError } from '@/lib/utils/log-sanitizer'

// Anthropic Haiku usually responds in 2-5s, but cold-start + auth can push the
// total above Vercel's default 15s timeout. Bump explicitly so the function
// doesn't get killed mid-call (which appears as a hung spinner client-side).
export const maxDuration = 45

const bodySchema = z.object({
  product_text: z.string().min(10, 'Product description must be at least 10 characters').max(4000),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    if (!user.workspace_id) return unauthorized('No workspace')

    const body = await request.json()
    const { product_text } = bodySchema.parse(body)

    // Hard wall-clock cap so the client always gets a response within ~30s
    const result = await Promise.race([
      generateIcpFromProduct(product_text),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('ICP generation timed out after 30s')), 30_000)
      ),
    ])

    return NextResponse.json({ data: result })
  } catch (error) {
    safeError('[outbound] /api/outbound/icp/generate failed:', error)
    return handleApiError(error)
  }
}
