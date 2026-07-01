/**
 * Reseller API-Key Authentication
 *
 * Resellers are NOT Supabase auth users. They authenticate with an API key in
 * the Authorization header. This guard resolves the key to a reseller, enforces
 * status + scope, and stamps last_used_at (best-effort).
 */

import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'
import { extractBearerKey, hashApiKey } from './api-key.service'
import type { Reseller } from './types'

export type ResellerAuthResult =
  | { ok: true; reseller: Reseller; keyId: string; scopes: string[] }
  | { ok: false; status: 401 | 403; error: string }

/**
 * Authenticate a reseller request by API key.
 * @param requiredScope - optional scope the key must hold (e.g. 'pixels:write').
 */
export async function requireReseller(
  request: NextRequest,
  requiredScope?: string,
): Promise<ResellerAuthResult> {
  const rawKey = extractBearerKey(request.headers.get('authorization'))
  if (!rawKey) {
    return { ok: false, status: 401, error: 'Missing or malformed API key' }
  }

  const supabase = createAdminClient()
  const keyHash = await hashApiKey(rawKey)

  const { data: keyRow, error: keyErr } = await supabase
    .from('reseller_api_keys')
    .select('id, reseller_id, scopes, revoked')
    .eq('key_hash', keyHash)
    .maybeSingle()

  if (keyErr) {
    safeError('[ResellerAuth] key lookup failed:', keyErr)
    return { ok: false, status: 401, error: 'Invalid API key' }
  }
  if (!keyRow || keyRow.revoked) {
    return { ok: false, status: 401, error: 'Invalid or revoked API key' }
  }

  const scopes: string[] = (keyRow.scopes as string[] | null) ?? []
  if (requiredScope && !scopes.includes(requiredScope)) {
    return { ok: false, status: 403, error: `API key missing required scope: ${requiredScope}` }
  }

  const { data: reseller, error: resErr } = await supabase
    .from('resellers')
    .select('*')
    .eq('id', keyRow.reseller_id)
    .maybeSingle()

  if (resErr || !reseller) {
    return { ok: false, status: 401, error: 'Reseller not found' }
  }
  if ((reseller as Reseller).status !== 'active') {
    return { ok: false, status: 403, error: 'Reseller account is suspended' }
  }

  // Best-effort last_used_at stamp — never block the request on it.
  void supabase
    .from('reseller_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRow.id)
    .then(({ error }) => {
      if (error) safeError('[ResellerAuth] last_used_at stamp failed:', error)
    })

  return { ok: true, reseller: reseller as Reseller, keyId: keyRow.id, scopes }
}
