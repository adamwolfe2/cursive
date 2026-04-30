// Chrome Extension Auth Middleware
// Validates workspace API keys from x-cursive-api-key header
// Uses admin client since extension requests have no session cookies

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface ExtAuthResult {
  workspaceId: string
  scopes: string[]
  userId: string
}

async function sha256Hex(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data)
  const hash = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Authenticate a Chrome extension request using workspace API key.
 * Returns workspace context or throws with appropriate HTTP error.
 */
export async function authenticateExtension(
  req: NextRequest,
  requiredScope?: string
): Promise<ExtAuthResult> {
  const apiKey = req.headers.get('x-cursive-api-key')

  if (!apiKey) {
    throw new ExtAuthError('Missing x-cursive-api-key header', 401)
  }

  const keyHash = await sha256Hex(apiKey)
  const supabase = createAdminClient()

  const { data: keyRecord, error } = await supabase
    .from('workspace_api_keys')
    .select('workspace_id, scopes, is_active, expires_at, rate_limit_per_minute, rate_limit_per_day')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !keyRecord) {
    throw new ExtAuthError('Invalid API key', 401)
  }

  // Check expiration
  if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
    throw new ExtAuthError('API key expired', 401)
  }

  // Check scope
  const scopes = (keyRecord.scopes || []) as string[]
  if (requiredScope && !scopes.includes(requiredScope) && !scopes.includes('*')) {
    throw new ExtAuthError(`Missing required scope: ${requiredScope}`, 403)
  }

  // Update last_used_at (fire-and-forget)
  supabase
    .from('workspace_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', keyHash)
    .then(() => {})

  // Get the workspace owner's user ID for credit operations
  const { data: owner } = await supabase
    .from('users')
    .select('id')
    .eq('workspace_id', keyRecord.workspace_id)
    .eq('role', 'owner')
    .maybeSingle()

  if (!owner) {
    // Fallback: get any admin user in the workspace
    const { data: admin } = await supabase
      .from('users')
      .select('id')
      .eq('workspace_id', keyRecord.workspace_id)
      .in('role', ['admin', 'owner'])
      .limit(1)
      .maybeSingle()

    if (!admin) {
      throw new ExtAuthError('No active user found for this workspace', 500)
    }

    return {
      workspaceId: keyRecord.workspace_id,
      scopes,
      userId: admin.id,
    }
  }

  return {
    workspaceId: keyRecord.workspace_id,
    scopes,
    userId: owner.id,
  }
}

/**
 * Custom error class for extension auth failures
 */
export class ExtAuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ExtAuthError'
    this.status = status
  }
}

/**
 * Helper to create an error response from ExtAuthError
 */
export function extAuthErrorResponse(error: unknown): NextResponse {
  if (error instanceof ExtAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
