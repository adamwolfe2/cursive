/**
 * Workspace Integrations API
 * Manage external service integrations
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth/helpers'
import { handleApiError, unauthorized, success, badRequest, notFound } from '@/lib/utils/api-error-handler'
import { z } from 'zod'
import {
  getIntegrations,
  getIntegration,
  upsertIntegration,
  disconnectIntegration,
  type IntegrationProvider,
} from '@/lib/services/workspace-settings.service'

const providerSchema = z.enum([
  'emailbison',
  'ghl',
  'slack',
  'zapier',
  'hubspot',
  'salesforce',
  'custom_webhook',
])

const upsertSchema = z.object({
  provider: providerSchema,
  name: z.string().max(100).optional(),
  config: z.record(z.any()).optional(),
  credentials: z.record(z.any()).optional(),
})

const disconnectSchema = z.object({
  action: z.literal('disconnect'),
  provider: providerSchema,
})

/**
 * GET /api/workspace/integrations
 * List all integrations
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const provider = request.nextUrl.searchParams.get('provider') as IntegrationProvider | null

    if (provider) {
      const integration = await getIntegration(user.workspace_id, provider)
      if (!integration) {
        return notFound('Integration not found')
      }
      return success({
        integration: {
          id: integration.id,
          provider: integration.provider,
          name: integration.name,
          is_connected: integration.isConnected,
          config: integration.config,
          status: integration.status,
          last_sync_at: integration.lastSyncAt,
          last_error: integration.lastError,
        },
      })
    }

    const integrations = await getIntegrations(user.workspace_id)

    return success({
      integrations: integrations.map((i) => ({
        id: i.id,
        provider: i.provider,
        name: i.name,
        is_connected: i.isConnected,
        status: i.status,
        last_sync_at: i.lastSyncAt,
        last_error: i.lastError,
      })),
      available_providers: [
        { key: 'emailbison', name: 'EmailBison', description: 'Email sending and tracking' },
        { key: 'ghl', name: 'GoHighLevel', description: 'CRM and automation' },
        { key: 'slack', name: 'Slack', description: 'Team notifications' },
        { key: 'zapier', name: 'Zapier', description: 'Workflow automation' },
        { key: 'hubspot', name: 'HubSpot', description: 'CRM integration' },
        { key: 'salesforce', name: 'Salesforce', description: 'CRM integration' },
        { key: 'custom_webhook', name: 'Custom Webhook', description: 'Send data to any endpoint' },
      ],
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/workspace/integrations
 * Create or update an integration
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json()
    const validated = upsertSchema.parse(body)

    const result = await upsertIntegration(user.workspace_id, validated.provider, {
      name: validated.name,
      config: validated.config,
      credentials: validated.credentials,
      isConnected: true,
      status: 'connected',
    })

    if (!result.success) {
      return badRequest(result.error || 'Failed to save integration')
    }

    return success({
      message: 'Integration saved',
      integration: {
        id: result.integration!.id,
        provider: result.integration!.provider,
        is_connected: result.integration!.isConnected,
        status: result.integration!.status,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/workspace/integrations
 * Disconnect an integration
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const provider = request.nextUrl.searchParams.get('provider') as IntegrationProvider | null

    if (!provider) {
      return badRequest('provider query parameter is required')
    }

    const result = await disconnectIntegration(user.workspace_id, provider)

    if (!result.success) {
      return badRequest('Failed to disconnect integration')
    }

    return success({
      message: 'Integration disconnected',
      provider,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
