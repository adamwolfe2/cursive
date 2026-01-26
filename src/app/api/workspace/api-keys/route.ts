/**
 * Workspace API Keys
 * Manage API keys for programmatic access
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, badRequest } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import {
  createApiKey,
  getApiKeys,
  revokeApiKey,
} from '@/lib/services/workspace-settings.service'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).optional(),
  rate_limit_per_minute: z.number().int().min(1).max(1000).optional(),
  rate_limit_per_day: z.number().int().min(1).max(100000).optional(),
  expires_in_days: z.number().int().min(1).max(365).optional(),
})

const revokeSchema = z.object({
  action: z.literal('revoke'),
  key_id: z.string().uuid(),
})

/**
 * GET /api/workspace/api-keys
 * List API keys
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const apiKeys = await getApiKeys(user.workspace_id)

    return success({
      api_keys: apiKeys.map((k) => ({
        id: k.id,
        name: k.name,
        key_prefix: k.keyPrefix,
        scopes: k.scopes,
        rate_limit_per_minute: k.rateLimitPerMinute,
        rate_limit_per_day: k.rateLimitPerDay,
        is_active: k.isActive,
        last_used_at: k.lastUsedAt,
        expires_at: k.expiresAt,
        created_at: k.createdAt,
      })),
      available_scopes: [
        { key: 'read:leads', description: 'Read lead data' },
        { key: 'write:leads', description: 'Create and update leads' },
        { key: 'read:campaigns', description: 'Read campaign data' },
        { key: 'write:campaigns', description: 'Create and update campaigns' },
        { key: 'read:conversations', description: 'Read conversation threads' },
        { key: 'write:conversations', description: 'Reply to conversations' },
        { key: 'read:analytics', description: 'Read analytics and reports' },
      ],
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/workspace/api-keys
 * Create a new API key
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = createSchema.parse(body)

    // Calculate expiration date
    let expiresAt: Date | undefined
    if (validated.expires_in_days) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + validated.expires_in_days)
    }

    const result = await createApiKey(user.workspace_id, user.id, {
      name: validated.name,
      scopes: validated.scopes,
      rateLimitPerMinute: validated.rate_limit_per_minute,
      rateLimitPerDay: validated.rate_limit_per_day,
      expiresAt,
    })

    if (!result.success) {
      return badRequest(result.error || 'Failed to create API key')
    }

    return success({
      message: 'API key created successfully',
      api_key: {
        id: result.apiKey!.id,
        key: result.apiKey!.key, // Only returned once!
      },
      warning: 'Save this key securely. It will not be shown again.',
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/workspace/api-keys
 * Revoke an API key
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const keyId = request.nextUrl.searchParams.get('key_id')

    if (!keyId) {
      return badRequest('key_id query parameter is required')
    }

    const result = await revokeApiKey(user.workspace_id, keyId)

    if (!result.success) {
      return badRequest('Failed to revoke API key')
    }

    return success({
      message: 'API key revoked',
      key_id: keyId,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
