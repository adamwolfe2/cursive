// Structured Logging Service
// Provides consistent, structured logging across the application

import pino from 'pino'

// Configure logger based on environment
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  // Pretty print in development
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    },
  }),

  // JSON format in production for log aggregation
  ...(isProduction && {
    formatters: {
      level: (label) => {
        return { level: label }
      },
    },
  }),

  // Base fields included in all logs
  base: {
    env: process.env.NODE_ENV,
    app: 'openinfo',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },

  // Timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,
})

// Log levels:
// - trace: Very detailed, typically not needed
// - debug: Detailed debug information
// - info: Informational messages
// - warn: Warning messages
// - error: Error messages
// - fatal: Fatal errors that crash the app

/**
 * Create a child logger with additional context
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context)
}

/**
 * Log an API request
 */
export function logRequest(req: {
  method: string
  url: string
  headers?: Record<string, string | string[] | undefined>
  userId?: string
  workspaceId?: string
  ip?: string
}) {
  logger.info({
    type: 'request',
    method: req.method,
    url: req.url,
    userId: req.userId,
    workspaceId: req.workspaceId,
    ip: req.ip,
    userAgent: req.headers?.['user-agent'],
  }, 'HTTP Request')
}

/**
 * Log an API response
 */
export function logResponse(res: {
  method: string
  url: string
  status: number
  duration: number
  userId?: string
  workspaceId?: string
}) {
  const level = res.status >= 500 ? 'error' : res.status >= 400 ? 'warn' : 'info'

  logger[level]({
    type: 'response',
    method: res.method,
    url: res.url,
    status: res.status,
    duration: res.duration,
    userId: res.userId,
    workspaceId: res.workspaceId,
  }, 'HTTP Response')
}

/**
 * Log an error with full context
 */
export function logError(error: Error | unknown, context?: Record<string, any>) {
  const errorObj = error instanceof Error ? {
    name: error.name,
    message: error.message,
    stack: error.stack,
  } : {
    message: String(error),
  }

  logger.error({
    type: 'error',
    error: errorObj,
    ...context,
  }, error instanceof Error ? error.message : 'Unknown error')
}

/**
 * Log a security event
 */
export function logSecurityEvent(event: {
  type: 'auth_failed' | 'rate_limit_exceeded' | 'suspicious_activity' | 'unauthorized_access'
  userId?: string
  workspaceId?: string
  ip?: string
  details?: Record<string, any>
}) {
  logger.warn({
    type: 'security',
    securityEventType: event.type,
    userId: event.userId,
    workspaceId: event.workspaceId,
    ip: event.ip,
    ...event.details,
  }, `Security Event: ${event.type}`)
}

/**
 * Log a business event
 */
export function logBusinessEvent(event: {
  type: 'lead_generated' | 'query_created' | 'export_completed' | 'subscription_created' | 'credit_consumed'
  userId?: string
  workspaceId?: string
  metadata?: Record<string, any>
}) {
  logger.info({
    type: 'business',
    eventType: event.type,
    userId: event.userId,
    workspaceId: event.workspaceId,
    ...event.metadata,
  }, `Business Event: ${event.type}`)
}

/**
 * Log a performance metric
 */
export function logPerformance(metric: {
  operation: string
  duration: number
  success: boolean
  metadata?: Record<string, any>
}) {
  const level = metric.duration > 5000 ? 'warn' : 'debug'

  logger[level]({
    type: 'performance',
    operation: metric.operation,
    duration: metric.duration,
    success: metric.success,
    ...metric.metadata,
  }, `Performance: ${metric.operation} (${metric.duration}ms)`)
}

/**
 * Log a database query (debug only)
 */
export function logQuery(query: {
  table: string
  operation: 'select' | 'insert' | 'update' | 'delete'
  duration?: number
  rowCount?: number
}) {
  logger.debug({
    type: 'database',
    table: query.table,
    operation: query.operation,
    duration: query.duration,
    rowCount: query.rowCount,
  }, `DB Query: ${query.operation} on ${query.table}`)
}

/**
 * Log a background job event
 */
export function logJob(job: {
  name: string
  status: 'started' | 'completed' | 'failed'
  duration?: number
  error?: Error
  metadata?: Record<string, any>
}) {
  const level = job.status === 'failed' ? 'error' : 'info'

  logger[level]({
    type: 'job',
    jobName: job.name,
    status: job.status,
    duration: job.duration,
    error: job.error ? {
      name: job.error.name,
      message: job.error.message,
      stack: job.error.stack,
    } : undefined,
    ...job.metadata,
  }, `Job ${job.status}: ${job.name}`)
}

/**
 * Create a timing wrapper for operations
 */
export async function withTiming<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  const startTime = Date.now()
  let success = true

  try {
    const result = await fn()
    return result
  } catch (error) {
    success = false
    throw error
  } finally {
    const duration = Date.now() - startTime
    logPerformance({
      operation,
      duration,
      success,
      metadata: context,
    })
  }
}

/**
 * Redact sensitive data from logs
 */
export function redactSensitive(data: any): any {
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'ssn']

  if (typeof data !== 'object' || data === null) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(redactSensitive)
  }

  const redacted: any = {}
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
      redacted[key] = '[REDACTED]'
    } else if (typeof value === 'object') {
      redacted[key] = redactSensitive(value)
    } else {
      redacted[key] = value
    }
  }

  return redacted
}

// Export default logger
export default logger
