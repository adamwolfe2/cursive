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

    const result = await generateIcpFromProduct(product_text)

    return NextResponse.json({ data: result })
  } catch (error) {
    return handleApiError(error)
  }
}
