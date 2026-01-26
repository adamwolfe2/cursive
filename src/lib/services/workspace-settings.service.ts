/**
 * Workspace Settings Service
 * Manages workspace configuration, integrations, and onboarding
 */

import { createClient } from '@/lib/supabase/server'
import { randomBytes, createHash } from 'crypto'

export type IntegrationProvider =
  | 'emailbison'
  | 'ghl'
  | 'slack'
  | 'zapier'
  | 'hubspot'
  | 'salesforce'
  | 'custom_webhook'

export type IntegrationStatus = 'pending' | 'connected' | 'error' | 'disconnected'

export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped'

export interface Integration {
  id: string
  workspaceId: string
  provider: IntegrationProvider
  name: string | null
  isConnected: boolean
  config: Record<string, any>
  status: IntegrationStatus
  lastSyncAt: string | null
  lastError: string | null
  createdAt: string
  updatedAt: string
}

export interface OnboardingStep {
  stepKey: string
  stepOrder: number
  isCompleted: boolean
  completedAt: string | null
  skipped: boolean
  skippedAt: string | null
  stepData: Record<string, any>
}

export interface OnboardingProgress {
  totalSteps: number
  completedSteps: number
  progressPercent: number
  isComplete: boolean
  steps: OnboardingStep[]
}

export interface WorkspaceSettings {
  // Email settings
  defaultSenderName: string | null
  defaultSenderEmail: string | null
  defaultSenderTitle: string | null
  emailSignature: string | null

  // Campaign defaults
  defaultSendWindowStart: string
  defaultSendWindowEnd: string
  defaultTimezone: string
  defaultSendDays: string[]
  defaultDailyLimit: number

  // Branding
  companyName: string | null
  companyWebsite: string | null
  companyLogo: string | null

  // Features
  aiEnrichmentEnabled: boolean
  abTestingEnabled: boolean
  autoSendEnabled: boolean

  // Security
  requireApprovalForFirstEmail: boolean
  maxConcurrentCampaigns: number
}

export interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  scopes: string[]
  rateLimitPerMinute: number
  rateLimitPerDay: number
  isActive: boolean
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

// ============ Workspace Settings ============

/**
 * Get workspace settings
 */
export async function getWorkspaceSettings(workspaceId: string): Promise<WorkspaceSettings> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workspaces')
    .select('settings, sales_co_settings, name')
    .eq('id', workspaceId)
    .single()

  if (error || !data) {
    throw new Error('Failed to fetch workspace settings')
  }

  const settings = data.settings || {}
  const salesCoSettings = data.sales_co_settings || {}

  return {
    defaultSenderName: salesCoSettings.default_sender_name || null,
    defaultSenderEmail: salesCoSettings.default_sender_email || null,
    defaultSenderTitle: salesCoSettings.default_sender_title || null,
    emailSignature: salesCoSettings.email_signature || null,
    defaultSendWindowStart: settings.default_send_window_start || '09:00',
    defaultSendWindowEnd: settings.default_send_window_end || '17:00',
    defaultTimezone: settings.default_timezone || 'America/New_York',
    defaultSendDays: settings.default_send_days || ['mon', 'tue', 'wed', 'thu', 'fri'],
    defaultDailyLimit: settings.default_daily_limit || 50,
    companyName: data.name,
    companyWebsite: settings.company_website || null,
    companyLogo: settings.company_logo || null,
    aiEnrichmentEnabled: settings.ai_enrichment_enabled !== false,
    abTestingEnabled: settings.ab_testing_enabled !== false,
    autoSendEnabled: settings.auto_send_enabled || false,
    requireApprovalForFirstEmail: settings.require_approval_first_email !== false,
    maxConcurrentCampaigns: settings.max_concurrent_campaigns || 10,
  }
}

/**
 * Update workspace settings
 */
export async function updateWorkspaceSettings(
  workspaceId: string,
  updates: Partial<WorkspaceSettings>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get current settings
  const { data: current, error: fetchError } = await supabase
    .from('workspaces')
    .select('settings, sales_co_settings')
    .eq('id', workspaceId)
    .single()

  if (fetchError) {
    return { success: false, error: fetchError.message }
  }

  const settings = { ...(current?.settings || {}) }
  const salesCoSettings = { ...(current?.sales_co_settings || {}) }

  // Map updates to appropriate fields
  if (updates.defaultSenderName !== undefined) {
    salesCoSettings.default_sender_name = updates.defaultSenderName
  }
  if (updates.defaultSenderEmail !== undefined) {
    salesCoSettings.default_sender_email = updates.defaultSenderEmail
  }
  if (updates.defaultSenderTitle !== undefined) {
    salesCoSettings.default_sender_title = updates.defaultSenderTitle
  }
  if (updates.emailSignature !== undefined) {
    salesCoSettings.email_signature = updates.emailSignature
  }
  if (updates.defaultSendWindowStart !== undefined) {
    settings.default_send_window_start = updates.defaultSendWindowStart
  }
  if (updates.defaultSendWindowEnd !== undefined) {
    settings.default_send_window_end = updates.defaultSendWindowEnd
  }
  if (updates.defaultTimezone !== undefined) {
    settings.default_timezone = updates.defaultTimezone
  }
  if (updates.defaultSendDays !== undefined) {
    settings.default_send_days = updates.defaultSendDays
  }
  if (updates.defaultDailyLimit !== undefined) {
    settings.default_daily_limit = updates.defaultDailyLimit
  }
  if (updates.companyWebsite !== undefined) {
    settings.company_website = updates.companyWebsite
  }
  if (updates.companyLogo !== undefined) {
    settings.company_logo = updates.companyLogo
  }
  if (updates.aiEnrichmentEnabled !== undefined) {
    settings.ai_enrichment_enabled = updates.aiEnrichmentEnabled
  }
  if (updates.abTestingEnabled !== undefined) {
    settings.ab_testing_enabled = updates.abTestingEnabled
  }
  if (updates.autoSendEnabled !== undefined) {
    settings.auto_send_enabled = updates.autoSendEnabled
  }
  if (updates.requireApprovalForFirstEmail !== undefined) {
    settings.require_approval_first_email = updates.requireApprovalForFirstEmail
  }
  if (updates.maxConcurrentCampaigns !== undefined) {
    settings.max_concurrent_campaigns = updates.maxConcurrentCampaigns
  }

  // Update workspace
  const updateData: Record<string, any> = {
    settings,
    sales_co_settings: salesCoSettings,
    updated_at: new Date().toISOString(),
  }

  if (updates.companyName !== undefined) {
    updateData.name = updates.companyName
  }

  const { error: updateError } = await supabase
    .from('workspaces')
    .update(updateData)
    .eq('id', workspaceId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true }
}

// ============ Integrations ============

/**
 * Get all integrations for a workspace
 */
export async function getIntegrations(workspaceId: string): Promise<Integration[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workspace_integrations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch integrations: ${error.message}`)
  }

  return (data || []).map(mapIntegration)
}

/**
 * Get a specific integration
 */
export async function getIntegration(
  workspaceId: string,
  provider: IntegrationProvider
): Promise<Integration | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workspace_integrations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('provider', provider)
    .single()

  if (error || !data) {
    return null
  }

  return mapIntegration(data)
}

/**
 * Create or update an integration
 */
export async function upsertIntegration(
  workspaceId: string,
  provider: IntegrationProvider,
  data: {
    name?: string
    isConnected?: boolean
    config?: Record<string, any>
    credentials?: Record<string, any>
    status?: IntegrationStatus
  }
): Promise<{ success: boolean; integration?: Integration; error?: string }> {
  const supabase = await createClient()

  const upsertData: Record<string, any> = {
    workspace_id: workspaceId,
    provider,
    updated_at: new Date().toISOString(),
  }

  if (data.name !== undefined) upsertData.name = data.name
  if (data.isConnected !== undefined) upsertData.is_connected = data.isConnected
  if (data.config) upsertData.config = data.config
  if (data.credentials) upsertData.credentials = data.credentials
  if (data.status) upsertData.status = data.status

  const { data: result, error } = await supabase
    .from('workspace_integrations')
    .upsert(upsertData, { onConflict: 'workspace_id,provider' })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, integration: mapIntegration(result) }
}

/**
 * Disconnect an integration
 */
export async function disconnectIntegration(
  workspaceId: string,
  provider: IntegrationProvider
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('workspace_integrations')
    .update({
      is_connected: false,
      status: 'disconnected',
      credentials: {},
      oauth_data: {},
      updated_at: new Date().toISOString(),
    })
    .eq('workspace_id', workspaceId)
    .eq('provider', provider)

  return { success: !error }
}

// ============ Onboarding ============

/**
 * Initialize onboarding for a workspace
 */
export async function initializeOnboarding(
  workspaceId: string,
  userId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { error } = await supabase.rpc('initialize_onboarding', {
    p_workspace_id: workspaceId,
    p_user_id: userId,
  })

  if (error) {
    // Fallback to manual insert
    const steps = [
      { key: 'connect_email_account', order: 1 },
      { key: 'configure_sender_info', order: 2 },
      { key: 'create_first_campaign', order: 3 },
      { key: 'import_leads', order: 4 },
      { key: 'compose_first_email', order: 5 },
      { key: 'review_and_send', order: 6 },
    ]

    for (const step of steps) {
      await supabase.from('onboarding_steps').upsert(
        {
          workspace_id: workspaceId,
          user_id: userId,
          step_key: step.key,
          step_order: step.order,
        },
        { onConflict: 'workspace_id,user_id,step_key' }
      )
    }
  }

  return { success: true }
}

/**
 * Get onboarding progress
 */
export async function getOnboardingProgress(
  workspaceId: string,
  userId: string
): Promise<OnboardingProgress> {
  const supabase = await createClient()

  // Try database function
  const { data, error } = await supabase.rpc('get_onboarding_progress', {
    p_workspace_id: workspaceId,
    p_user_id: userId,
  })

  if (error || !data) {
    // Fallback to direct query
    const { data: steps } = await supabase
      .from('onboarding_steps')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .order('step_order')

    const stepList = steps || []
    const completed = stepList.filter((s) => s.is_completed || s.skipped).length

    return {
      totalSteps: stepList.length,
      completedSteps: completed,
      progressPercent: stepList.length > 0 ? Math.round((completed / stepList.length) * 100) : 0,
      isComplete: completed >= stepList.length && stepList.length > 0,
      steps: stepList.map((s) => ({
        stepKey: s.step_key,
        stepOrder: s.step_order,
        isCompleted: s.is_completed,
        completedAt: s.completed_at,
        skipped: s.skipped,
        skippedAt: s.skipped_at,
        stepData: s.step_data || {},
      })),
    }
  }

  return {
    totalSteps: data.total_steps,
    completedSteps: data.completed_steps,
    progressPercent: data.progress_percent,
    isComplete: data.is_complete,
    steps: (data.steps || []).map((s: any) => ({
      stepKey: s.step_key,
      stepOrder: s.step_order,
      isCompleted: s.is_completed,
      completedAt: s.completed_at,
      skipped: s.skipped || false,
      skippedAt: s.skipped_at || null,
      stepData: {},
    })),
  }
}

/**
 * Complete an onboarding step
 */
export async function completeOnboardingStep(
  workspaceId: string,
  userId: string,
  stepKey: string,
  stepData: Record<string, any> = {}
): Promise<{ success: boolean; allComplete: boolean }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('complete_onboarding_step', {
    p_workspace_id: workspaceId,
    p_user_id: userId,
    p_step_key: stepKey,
    p_step_data: stepData,
  })

  if (error) {
    // Fallback
    await supabase
      .from('onboarding_steps')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        step_data: stepData,
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .eq('step_key', stepKey)

    return { success: true, allComplete: false }
  }

  return { success: true, allComplete: data || false }
}

/**
 * Skip an onboarding step
 */
export async function skipOnboardingStep(
  workspaceId: string,
  userId: string,
  stepKey: string
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('onboarding_steps')
    .update({
      skipped: true,
      skipped_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .eq('step_key', stepKey)

  return { success: !error }
}

// ============ API Keys ============

/**
 * Create an API key
 */
export async function createApiKey(
  workspaceId: string,
  userId: string,
  data: {
    name: string
    scopes?: string[]
    rateLimitPerMinute?: number
    rateLimitPerDay?: number
    expiresAt?: Date
  }
): Promise<{ success: boolean; apiKey?: { id: string; key: string }; error?: string }> {
  const supabase = await createClient()

  // Generate a random API key
  const keyBytes = randomBytes(32)
  const fullKey = `lm_${keyBytes.toString('hex')}`
  const keyPrefix = fullKey.slice(0, 10)
  const keyHash = createHash('sha256').update(fullKey).digest('hex')

  const { data: result, error } = await supabase
    .from('workspace_api_keys')
    .insert({
      workspace_id: workspaceId,
      user_id: userId,
      name: data.name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      scopes: data.scopes || ['read:leads', 'read:campaigns'],
      rate_limit_per_minute: data.rateLimitPerMinute || 60,
      rate_limit_per_day: data.rateLimitPerDay || 10000,
      expires_at: data.expiresAt?.toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Return the full key only once - it won't be recoverable
  return {
    success: true,
    apiKey: {
      id: result.id,
      key: fullKey,
    },
  }
}

/**
 * Get API keys for a workspace
 */
export async function getApiKeys(workspaceId: string): Promise<ApiKey[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('workspace_api_keys')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch API keys: ${error.message}`)
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    keyPrefix: row.key_prefix,
    scopes: row.scopes || [],
    rateLimitPerMinute: row.rate_limit_per_minute,
    rateLimitPerDay: row.rate_limit_per_day,
    isActive: row.is_active,
    lastUsedAt: row.last_used_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }))
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(
  workspaceId: string,
  keyId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('workspace_api_keys')
    .update({ is_active: false })
    .eq('id', keyId)
    .eq('workspace_id', workspaceId)

  return { success: !error }
}

/**
 * Validate an API key
 */
export async function validateApiKey(
  apiKey: string
): Promise<{ valid: boolean; workspaceId?: string; scopes?: string[] }> {
  const supabase = await createClient()

  const keyHash = createHash('sha256').update(apiKey).digest('hex')

  const { data, error } = await supabase
    .from('workspace_api_keys')
    .select('workspace_id, scopes, is_active, expires_at')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return { valid: false }
  }

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false }
  }

  // Update last used
  await supabase
    .from('workspace_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', keyHash)

  return {
    valid: true,
    workspaceId: data.workspace_id,
    scopes: data.scopes,
  }
}

// ============ Helper Functions ============

function mapIntegration(row: any): Integration {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    provider: row.provider,
    name: row.name,
    isConnected: row.is_connected,
    config: row.config || {},
    status: row.status,
    lastSyncAt: row.last_sync_at,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
