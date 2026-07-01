/**
 * Admin — revoke a reseller API key (PLATFORM ADMIN ONLY)
 *   DELETE /api/admin/reseller/keys/{keyId}
 *
 * Soft-revokes (sets revoked=true) so the key row + audit trail survive. A
 * revoked key fails requireReseller() immediately.
 */

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePlatformAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { safeError } from '@/lib/utils/log-sanitizer'

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ keyId: string }> }) {
  try {
    await requirePlatformAdmin()
  } catch {
    return NextResponse.json({ error: 'Platform admin access required' }, { status: 403 })
  }

  try {
    const { keyId } = await params
    if (!z.string().uuid().safeParse(keyId).success) {
      return NextResponse.json({ error: 'Invalid key id' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('reseller_api_keys')
      .update({ revoked: true })
      .eq('id', keyId)
      .select('id')
      .maybeSingle()

    if (error) {
      safeError('[AdminReseller] key revoke failed:', error)
      return NextResponse.json({ error: 'Failed to revoke key' }, { status: 500 })
    }
    if (!data) return NextResponse.json({ error: 'Key not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('[AdminReseller] key revoke error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
