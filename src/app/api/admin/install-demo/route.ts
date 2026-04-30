/**
 * Admin: Marketplace Install Demo
 *
 * Admin-only endpoint that simulates a GHL or Shopify marketplace OAuth
 * callback landing on our provisionFromInstall() function. Lets us watch
 * the whole install flow — workspace creation, pixel provisioning,
 * magic-link generation — without needing GHL/Shopify partner credentials.
 *
 * POST /api/admin/install-demo
 * Body: { source, externalId, externalName, installerEmail, siteUrl }
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/admin'
import { handleApiError } from '@/lib/utils/api-error-handler'
import { provisionFromInstall } from '@/lib/provisioning/install-from-marketplace'

const BodySchema = z.object({
  source: z.enum(['ghl', 'shopify']),
  externalId: z.string().min(1),
  externalName: z.string().min(1),
  installerEmail: z.string().email(),
  siteUrl: z.string().url(),
  installerName: z.string().optional(),
  externalParentId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const params = BodySchema.parse(body)

    const result = await provisionFromInstall({
      source: params.source,
      externalId: params.externalId,
      externalName: params.externalName,
      installerEmail: params.installerEmail,
      installerName: params.installerName,
      siteUrl: params.siteUrl,
      externalParentId: params.externalParentId,
      // Demo: synthesize a fake OAuth token so the row has something plausible
      accessToken: `demo_${params.source}_${crypto.randomUUID()}`,
      scopes: params.source === 'ghl'
        ? ['oauth.readonly', 'oauth.write', 'contacts.readonly', 'contacts.write', 'locations/customValues.readonly', 'locations/customValues.write']
        : ['read_customers', 'read_orders', 'write_pixels', 'read_products', 'write_customers'],
      metadata: {
        demo: true,
        simulated_at: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
