/**
 * Reseller Admin — mint a reseller + API key (PLATFORM ADMIN ONLY)
 *   POST /api/reseller/admin/keys
 *
 * Creates a reseller (or attaches a new key to an existing one) and returns the
 * raw API key ONCE. The raw key is never stored — only its sha256 hash.
 *
 * This is the internal onboarding surface: a platform admin mints the partner's
 * key, then hands it over. Self-serve key management is out of scope for v1.
 */

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePlatformAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateApiKey } from '@/lib/reseller/api-key.service'
import { safeError } from '@/lib/utils/log-sanitizer'

const bodySchema = z.object({
  // Provide either an existing reseller_id, or a name to create a new reseller.
  reseller_id: z.string().uuid().optional(),
  name: z.string().min(1).max(200).optional(),
  key_name: z.string().max(200).optional(),
  // Constrain to the scopes requireReseller enforces and the DB default grants.
  scopes: z.array(z.enum(['pixels:read', 'pixels:write'])).optional(),
  period_kind: z.enum(['month', 'day']).optional(),
  lead_cap_per_period: z.number().int().min(0).nullable().optional(),
  default_lead_cap_per_period: z.number().int().min(0).nullable().optional(),
  default_throttle_mode: z.boolean().optional(),
}).refine((o) => o.reseller_id || o.name, 'Provide reseller_id or name')

export async function POST(request: NextRequest) {
  try {
    await requirePlatformAdmin()
  } catch {
    return NextResponse.json({ error: 'Platform admin access required' }, { status: 403 })
  }

  try {
    const input = bodySchema.parse(await request.json())
    const supabase = createAdminClient()

    let resellerId = input.reseller_id ?? null

    if (!resellerId) {
      const { data: reseller, error } = await supabase
        .from('resellers')
        .insert({
          name: input.name!,
          period_kind: input.period_kind ?? 'month',
          lead_cap_per_period: input.lead_cap_per_period ?? null,
          default_lead_cap_per_period: input.default_lead_cap_per_period ?? null,
          default_throttle_mode: input.default_throttle_mode ?? false,
        })
        .select('id')
        .maybeSingle()
      if (error || !reseller) {
        safeError('[ResellerAdmin] create reseller failed:', error)
        return NextResponse.json({ error: 'Failed to create reseller' }, { status: 500 })
      }
      resellerId = reseller.id
    } else {
      // Verify the reseller exists before attaching a key.
      const { data: existing } = await supabase.from('resellers').select('id').eq('id', resellerId).maybeSingle()
      if (!existing) return NextResponse.json({ error: 'Reseller not found' }, { status: 404 })
    }

    const { rawKey, keyHash, keyPrefix } = await generateApiKey()

    const { error: keyErr } = await supabase.from('reseller_api_keys').insert({
      reseller_id: resellerId,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      name: input.key_name ?? null,
      ...(input.scopes ? { scopes: input.scopes } : {}),
    })
    if (keyErr) {
      safeError('[ResellerAdmin] create key failed:', keyErr)
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
    }

    return NextResponse.json(
      {
        reseller_id: resellerId,
        key_prefix: keyPrefix,
        // Returned ONCE — the raw key is not stored and cannot be retrieved again.
        api_key: rawKey,
        docs_url: '/reseller/docs',
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues.slice(0, 5) }, { status: 400 })
    }
    safeError('[ResellerAdmin] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
