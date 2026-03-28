// Bearer API Key Auth Middleware
// Validates workspace API keys from the Authorization: Bearer header.
// Used by external API consumers who pass keys generated in Settings > API Keys.
// Keys are stored in workspace_api_keys table, hashed with SHA-256.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface BearerAuthResult {
  workspaceId: string
  userId: string
  scopes: string[]
}

async function sha256Hex(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data)
  const hash = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Authenticate a request using a workspace API key supplied as a Bearer token.
 *
 * Accepts:
 *   Authorization: Bearer <api_key>
 *
 * Returns workspace context on success, or throws a BearerAuthError.
 */
export async function authenticateBearer(
  req: NextRequest,
  requiredScope?: string
): Promise<BearerAuthResult> {
  const authHeader = req.headers.get('authorization')

  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    throw new BearerAuthError('Missing or malformed Authorization header. Use: Authorization: Bearer <api_key>', 401)
  }

  const apiKey = authHeader.slice(7).trim()

  if (!apiKey) {
    throw new BearerAuthError('API key must not be empty', 401)
  }

  const keyHash = await sha256Hex(apiKey)
  const supabase = createAdminClient()

  const { data: keyRecord, error } = await supabase
    .from('workspace_api_keys')
    .select('id, workspace_id, scopes, is_active, expires_at')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !keyRecord) {
    throw new BearerAuthError('Invalid API key', 401)
  }

  // Check expiration
  if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
    throw new BearerAuthError('API key has expired', 401)
  }

  const scopes = (keyRecord.scopes || []) as string[]

  // Check required scope
  if (requiredScope && !scopes.includes(requiredScope) && !scopes.includes('*')) {
    throw new BearerAuthError(`Insufficient scope. Required: ${requiredScope}`, 403)
  }

  // Update last_used_at (fire-and-forget, non-blocking)
  supabase
    .from('workspace_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRecord.id)
    .then(() => {})

  // Resolve a userId: prefer workspace owner, fall back to any admin
  const { data: owner } = await supabase
    .from('users')
    .select('id')
    .eq('workspace_id', keyRecord.workspace_id)
    .eq('role', 'owner')
    .maybeSingle()

  if (owner) {
    return { workspaceId: keyRecord.workspace_id, userId: owner.id, scopes }
  }

  const { data: admin } = await supabase
    .from('users')
    .select('id')
    .eq('workspace_id', keyRecord.workspace_id)
    .in('role', ['admin', 'owner'])
    .limit(1)
    .maybeSingle()

  if (!admin) {
    throw new BearerAuthError('No active user found for this workspace', 500)
  }

  return { workspaceId: keyRecord.workspace_id, userId: admin.id, scopes }
}

/**
 * Custom error class for Bearer auth failures.
 */
export class BearerAuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'BearerAuthError'
    this.status = status
  }
}

/**
 * Build an error NextResponse from a BearerAuthError (or any unknown error).
 */
export function bearerAuthErrorResponse(error: unknown): NextResponse {
  if (error instanceof BearerAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
