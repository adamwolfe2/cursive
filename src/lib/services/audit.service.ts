/**
 * Audit Logging Service
 * Comprehensive activity tracking for compliance and debugging
 */

import { createClient } from '@/lib/supabase/server'
import { safeError } from '@/lib/utils/log-sanitizer'

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'view'
  | 'export'
  | 'import'
  | 'login'
  | 'logout'
  | 'approve'
  | 'reject'
  | 'send'
  | 'archive'
  | 'restore'

export type ResourceType =
  | 'campaign'
  | 'lead'
  | 'email_send'
  | 'email_template'
  | 'conversation'
  | 'workspace'
  | 'user'
  | 'integration'
  | 'api_key'
  | 'settings'
  | 'suppression'

export type AuditSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical'

export type SecurityEventCategory = 'authentication' | 'authorization' | 'data_access' | 'configuration'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface AuditLog {
  id: string
  workspaceId: string | null
  userId: string | null
  action: AuditAction
  resourceType: ResourceType
  resourceId: string | null
  oldValues: Record<string, any> | null
  newValues: Record<string, any> | null
  changes: Record<string, any> | null
  ipAddress: string | null
  userAgent: string | null
  requestId: string | null
  apiEndpoint: string | null
  httpMethod: string | null
  metadata: Record<string, any>
  severity: AuditSeverity
  tags: string[]
  durationMs: number | null
  createdAt: string
}

export interface SecurityEvent {
  id: string
  workspaceId: string | null
  userId: string | null
  eventType: string
  eventCategory: SecurityEventCategory
  ipAddress: string | null
  userAgent: string | null
  locationData: Record<string, any> | null
  riskLevel: RiskLevel
  isSuspicious: boolean
  suspiciousReason: string | null
  metadata: Record<string, any>
  createdAt: string
}

export interface CreateAuditLogParams {
  workspaceId?: string
  userId?: string
  action: AuditAction
  resourceType: ResourceType
  resourceId?: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  requestId?: string
  apiEndpoint?: string
  httpMethod?: string
  metadata?: Record<string, any>
  severity?: AuditSeverity
  durationMs?: number
}

export interface AuditLogFilters {
  action?: AuditAction | AuditAction[]
  resourceType?: ResourceType | ResourceType[]
  resourceId?: string
  userId?: string
  severity?: AuditSeverity | AuditSeverity[]
  dateRange?: { start: Date; end: Date }
}

// ============ Audit Logging ============

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<string | null> {
  const supabase = await createClient()

  // Try database function
  const { data, error } = await supabase.rpc('create_audit_log', {
    p_workspace_id: params.workspaceId || null,
    p_user_id: params.userId || null,
    p_action: params.action,
    p_resource_type: params.resourceType,
    p_resource_id: params.resourceId || null,
    p_old_values: params.oldValues || null,
    p_new_values: params.newValues || null,
    p_ip_address: params.ipAddress || null,
    p_user_agent: params.userAgent || null,
    p_request_id: params.requestId || null,
    p_api_endpoint: params.apiEndpoint || null,
    p_http_method: params.httpMethod || null,
    p_metadata: params.metadata || {},
    p_severity: params.severity || 'info',
    p_duration_ms: params.durationMs || null,
  })

  if (error) {
    safeError('[Audit] Failed to create audit log:', error)

    // Fallback to direct insert
    const { data: insertData, error: insertError } = await supabase
      .from('audit_logs')
      .insert({
        workspace_id: params.workspaceId,
        user_id: params.userId,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        old_values: params.oldValues,
        new_values: params.newValues,
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
        request_id: params.requestId,
        api_endpoint: params.apiEndpoint,
        http_method: params.httpMethod,
        metadata: params.metadata || {},
        severity: params.severity || 'info',
        duration_ms: params.durationMs,
      })
      .select('id')
      .maybeSingle()

    return insertError || !insertData ? null : insertData.id
  }

  return data
}

/**
 * Get audit logs
 */
export async function getAuditLogs(
  workspaceId: string,
  filters: AuditLogFilters = {},
  pagination: { page?: number; limit?: number } = {}
): Promise<{ logs: AuditLog[]; total: number }> {
  const supabase = await createClient()

  const page = pagination.page || 1
  const limit = Math.min(pagination.limit || 50, 100)
  const offset = (page - 1) * limit

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'estimated' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (filters.action) {
    if (Array.isArray(filters.action)) {
      query = query.in('action', filters.action)
    } else {
      query = query.eq('action', filters.action)
    }
  }

  if (filters.resourceType) {
    if (Array.isArray(filters.resourceType)) {
      query = query.in('resource_type', filters.resourceType)
    } else {
      query = query.eq('resource_type', filters.resourceType)
    }
  }

  if (filters.resourceId) {
    query = query.eq('resource_id', filters.resourceId)
  }

  if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  }

  if (filters.severity) {
    if (Array.isArray(filters.severity)) {
      query = query.in('severity', filters.severity)
    } else {
      query = query.eq('severity', filters.severity)
    }
  }

  if (filters.dateRange?.start) {
    query = query.gte('created_at', filters.dateRange.start.toISOString())
  }
  if (filters.dateRange?.end) {
    query = query.lte('created_at', filters.dateRange.end.toISOString())
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch audit logs: ${error.message}`)
  }

  return {
    logs: (data || []).map(mapAuditLog),
    total: count || 0,
  }
}

/**
 * Get activity for a specific resource
 */
export async function getResourceActivity(
  resourceType: ResourceType,
  resourceId: string,
  limit: number = 50
): Promise<AuditLog[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_resource_activity', {
    p_resource_type: resourceType,
    p_resource_id: resourceId,
    p_limit: limit,
  })

  if (error) {
    // Fallback
    const { data: fallbackData } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })
      .limit(limit)

    return (fallbackData || []).map(mapAuditLog)
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    action: row.action,
    userId: row.user_id,
    changes: row.changes,
    createdAt: row.created_at,
    // Partial data
    workspaceId: null,
    resourceType: resourceType,
    resourceId: resourceId,
    oldValues: null,
    newValues: null,
    ipAddress: null,
    userAgent: null,
    requestId: null,
    apiEndpoint: null,
    httpMethod: null,
    metadata: {},
    severity: 'info',
    tags: [],
    durationMs: null,
  }))
}

// ============ Security Events ============

/**
 * Log a security event
 */
export async function logSecurityEvent(params: {
  eventType: string
  eventCategory: SecurityEventCategory
  workspaceId?: string
  userId?: string
  ipAddress?: string
  userAgent?: string
  riskLevel?: RiskLevel
  isSuspicious?: boolean
  suspiciousReason?: string
  metadata?: Record<string, any>
}): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('log_security_event', {
    p_event_type: params.eventType,
    p_event_category: params.eventCategory,
    p_workspace_id: params.workspaceId || null,
    p_user_id: params.userId || null,
    p_ip_address: params.ipAddress || null,
    p_user_agent: params.userAgent || null,
    p_risk_level: params.riskLevel || 'low',
    p_is_suspicious: params.isSuspicious || false,
    p_suspicious_reason: params.suspiciousReason || null,
    p_metadata: params.metadata || {},
  })

  if (error) {
    safeError('[Audit] Failed to log security event:', error)
    return null
  }

  return data
}

/**
 * Get security events
 */
export async function getSecurityEvents(
  workspaceId: string,
  filters: {
    eventType?: string
    eventCategory?: SecurityEventCategory
    riskLevel?: RiskLevel
    isSuspicious?: boolean
    dateRange?: { start: Date; end: Date }
  } = {},
  pagination: { page?: number; limit?: number } = {}
): Promise<{ events: SecurityEvent[]; total: number }> {
  const supabase = await createClient()

  const page = pagination.page || 1
  const limit = Math.min(pagination.limit || 50, 100)
  const offset = (page - 1) * limit

  let query = supabase
    .from('security_events')
    .select('*', { count: 'estimated' })
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (filters.eventType) {
    query = query.eq('event_type', filters.eventType)
  }
  if (filters.eventCategory) {
    query = query.eq('event_category', filters.eventCategory)
  }
  if (filters.riskLevel) {
    query = query.eq('risk_level', filters.riskLevel)
  }
  if (filters.isSuspicious !== undefined) {
    query = query.eq('is_suspicious', filters.isSuspicious)
  }
  if (filters.dateRange?.start) {
    query = query.gte('created_at', filters.dateRange.start.toISOString())
  }
  if (filters.dateRange?.end) {
    query = query.lte('created_at', filters.dateRange.end.toISOString())
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch security events: ${error.message}`)
  }

  return {
    events: (data || []).map(mapSecurityEvent),
    total: count || 0,
  }
}

// ============ Convenience Functions ============

/**
 * Log a campaign action
 */
export async function logCampaignAction(
  workspaceId: string,
  userId: string,
  campaignId: string,
  action: AuditAction,
  details?: { oldValues?: Record<string, any>; newValues?: Record<string, any>; metadata?: Record<string, any> }
): Promise<void> {
  await createAuditLog({
    workspaceId,
    userId,
    action,
    resourceType: 'campaign',
    resourceId: campaignId,
    oldValues: details?.oldValues,
    newValues: details?.newValues,
    metadata: details?.metadata,
  })
}

/**
 * Log a lead action
 */
export async function logLeadAction(
  workspaceId: string,
  userId: string,
  leadId: string,
  action: AuditAction,
  details?: { oldValues?: Record<string, any>; newValues?: Record<string, any>; metadata?: Record<string, any> }
): Promise<void> {
  await createAuditLog({
    workspaceId,
    userId,
    action,
    resourceType: 'lead',
    resourceId: leadId,
    oldValues: details?.oldValues,
    newValues: details?.newValues,
    metadata: details?.metadata,
  })
}

/**
 * Log an email action
 */
export async function logEmailAction(
  workspaceId: string,
  userId: string | undefined,
  emailSendId: string,
  action: AuditAction,
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    workspaceId,
    userId,
    action,
    resourceType: 'email_send',
    resourceId: emailSendId,
    metadata,
  })
}

/**
 * Log a settings change
 */
export async function logSettingsChange(
  workspaceId: string,
  userId: string,
  oldSettings: Record<string, any>,
  newSettings: Record<string, any>
): Promise<void> {
  await createAuditLog({
    workspaceId,
    userId,
    action: 'update',
    resourceType: 'settings',
    resourceId: workspaceId,
    oldValues: oldSettings,
    newValues: newSettings,
    severity: 'warning', // Settings changes are notable
  })
}

/**
 * Log a login event
 */
export async function logLoginEvent(
  workspaceId: string,
  userId: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logSecurityEvent({
    eventType: success ? 'login_success' : 'login_failed',
    eventCategory: 'authentication',
    workspaceId,
    userId,
    ipAddress,
    userAgent,
    riskLevel: success ? 'low' : 'medium',
    isSuspicious: !success,
    suspiciousReason: success ? undefined : 'Failed login attempt',
  })
}

/**
 * Log data export
 */
export async function logDataExport(
  workspaceId: string,
  userId: string,
  exportType: string,
  rowCount: number,
  ipAddress?: string
): Promise<void> {
  await createAuditLog({
    workspaceId,
    userId,
    action: 'export',
    resourceType: 'workspace',
    resourceId: workspaceId,
    ipAddress,
    metadata: {
      export_type: exportType,
      row_count: rowCount,
    },
    severity: 'info',
  })

  // Also log as security event for compliance
  await logSecurityEvent({
    eventType: 'data_export',
    eventCategory: 'data_access',
    workspaceId,
    userId,
    ipAddress,
    metadata: {
      export_type: exportType,
      row_count: rowCount,
    },
  })
}

// ============ Helper Functions ============

function mapAuditLog(row: any): AuditLog {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    oldValues: row.old_values,
    newValues: row.new_values,
    changes: row.changes,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    requestId: row.request_id,
    apiEndpoint: row.api_endpoint,
    httpMethod: row.http_method,
    metadata: row.metadata || {},
    severity: row.severity,
    tags: row.tags || [],
    durationMs: row.duration_ms,
    createdAt: row.created_at,
  }
}

function mapSecurityEvent(row: any): SecurityEvent {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    eventType: row.event_type,
    eventCategory: row.event_category,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    locationData: row.location_data,
    riskLevel: row.risk_level,
    isSuspicious: row.is_suspicious,
    suspiciousReason: row.suspicious_reason,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  }
}
