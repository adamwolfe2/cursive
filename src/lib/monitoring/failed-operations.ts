/**
 * Failed Operations Management
 * Handles recording and retrieval of failed operations from dead letter queue
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { safeLog, safeError } from '@/lib/utils/log-sanitizer'

export type OperationType = 'email' | 'webhook' | 'job'

export interface FailedOperation {
  id: string
  operation_type: OperationType
  operation_id: string | null
  event_data: any
  error_message: string
  error_stack: string | null
  retry_count: number
  last_retry_at: string | null
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
}

export interface RecordFailedOperationParams {
  operationType: OperationType
  operationId?: string
  eventData: any
  errorMessage: string
  errorStack?: string
  retryCount?: number
}

/**
 * Record a failed operation in the dead letter queue
 */
export async function recordFailedOperation(params: RecordFailedOperationParams): Promise<string | null> {
  try {
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from('failed_operations')
      .insert({
        operation_type: params.operationType,
        operation_id: params.operationId || null,
        event_data: params.eventData,
        error_message: params.errorMessage,
        error_stack: params.errorStack || null,
        retry_count: params.retryCount || 0,
        last_retry_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle()

    if (error) {
      safeError('[Failed Operations] Error recording failed operation', error)
      return null
    }

    if (!data) {
      return null
    }

    safeLog(`[Failed Operations] Recorded failed ${params.operationType} operation`, {
      id: data.id,
      operationId: params.operationId,
    })

    return data.id
  } catch (error) {
    safeError('[Failed Operations] Failed to record failed operation', error)
    return null
  }
}

/**
 * Get failed operations with optional filters
 */
export async function getFailedOperations(filters?: {
  operationType?: OperationType
  resolved?: boolean
  limit?: number
  offset?: number
}): Promise<FailedOperation[]> {
  try {
    const adminClient = createAdminClient()

    let query = adminClient
      .from('failed_operations')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.operationType) {
      query = query.eq('operation_type', filters.operationType)
    }

    if (filters?.resolved !== undefined) {
      if (filters.resolved) {
        query = query.not('resolved_at', 'is', null)
      } else {
        query = query.is('resolved_at', null)
      }
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      safeError('[Failed Operations] Error fetching failed operations', error)
      return []
    }

    return data || []
  } catch (error) {
    safeError('[Failed Operations] Failed to fetch failed operations', error)
    return []
  }
}

/**
 * Get count of unresolved failed operations
 */
export async function getUnresolvedCount(operationType?: OperationType): Promise<number> {
  try {
    const adminClient = createAdminClient()

    let query = adminClient
      .from('failed_operations')
      .select('id', { count: 'exact', head: true })
      .is('resolved_at', null)

    if (operationType) {
      query = query.eq('operation_type', operationType)
    }

    const { count, error } = await query

    if (error) {
      safeError('[Failed Operations] Error counting unresolved operations', error)
      return 0
    }

    return count || 0
  } catch (error) {
    safeError('[Failed Operations] Failed to count unresolved operations', error)
    return 0
  }
}

/**
 * Mark a failed operation as resolved
 */
export async function resolveFailedOperation(id: string, resolvedBy?: string): Promise<boolean> {
  try {
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('failed_operations')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy || null,
      })
      .eq('id', id)

    if (error) {
      safeError('[Failed Operations] Error resolving failed operation', error)
      return false
    }

    safeLog(`[Failed Operations] Resolved failed operation ${id}`)
    return true
  } catch (error) {
    safeError('[Failed Operations] Failed to resolve failed operation', error)
    return false
  }
}

/**
 * Retry a failed operation
 */
export async function retryFailedOperation(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = createAdminClient()

    // Get the failed operation
    const { data: operation, error: fetchError } = await adminClient
      .from('failed_operations')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (fetchError || !operation) {
      return { success: false, error: 'Failed operation not found' }
    }

    // Update retry count and timestamp
    await adminClient
      .from('failed_operations')
      .update({
        retry_count: (operation.retry_count || 0) + 1,
        last_retry_at: new Date().toISOString(),
      })
      .eq('id', id)

    // Re-trigger the event based on operation type
    // This will be imported where needed to avoid circular dependencies
    const { inngest } = await import('@/inngest/client')

    let eventName: string | null = null
    let eventData: any = operation.event_data

    switch (operation.operation_type) {
      case 'email':
        // Determine which email event to trigger
        if (eventData.purchaseId) {
          eventName = 'purchase/email.send'
        } else if (eventData.creditPurchaseId) {
          eventName = 'purchase/credit-email.send'
        }
        break
      case 'webhook':
        eventName = 'stripe/webhook.received'
        break
      case 'job':
        // Handle job retries based on eventData
        break
    }

    if (!eventName) {
      return { success: false, error: 'Unknown operation type or missing event data' }
    }

    // Send the event
    await inngest.send({
      name: eventName as any,
      data: eventData,
    })

    safeLog(`[Failed Operations] Retrying failed operation ${id}`, {
      operationType: operation.operation_type,
      eventName,
    })

    return { success: true }
  } catch (error) {
    safeError('[Failed Operations] Failed to retry failed operation', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get failure statistics for dashboard
 */
export async function getFailureStats(timeWindow: string = '24h'): Promise<{
  emailFailures: number
  webhookFailures: number
  jobFailures: number
  totalUnresolved: number
  failureRate: {
    email: number
    webhook: number
  }
}> {
  try {
    const adminClient = createAdminClient()

    // Calculate time window
    const now = new Date()
    const windowHours = parseInt(timeWindow.replace('h', ''))
    const windowStart = new Date(now.getTime() - windowHours * 60 * 60 * 1000)

    // Get failure counts by type
    const { data: failures } = await adminClient
      .from('failed_operations')
      .select('operation_type')
      .gte('created_at', windowStart.toISOString())

    const emailFailures = failures?.filter((f) => f.operation_type === 'email').length || 0
    const webhookFailures = failures?.filter((f) => f.operation_type === 'webhook').length || 0
    const jobFailures = failures?.filter((f) => f.operation_type === 'job').length || 0

    // Get total unresolved
    const totalUnresolved = await getUnresolvedCount()

    // Calculate failure rates (would need total attempt counts from somewhere)
    // For now, return 0 as placeholder
    const failureRate = {
      email: 0,
      webhook: 0,
    }

    return {
      emailFailures,
      webhookFailures,
      jobFailures,
      totalUnresolved,
      failureRate,
    }
  } catch (error) {
    safeError('[Failed Operations] Failed to get failure stats', error)
    return {
      emailFailures: 0,
      webhookFailures: 0,
      jobFailures: 0,
      totalUnresolved: 0,
      failureRate: { email: 0, webhook: 0 },
    }
  }
}
