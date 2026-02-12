/**
 * Structured Logging Utility
 * Provides consistent logging across the platform
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

export interface LogContext {
  userId?: string
  workspaceId?: string
  requestId?: string
  ip?: string
  userAgent?: string
  [key: string]: any
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
  duration?: number
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Pretty format for development
      const emoji = {
        debug: '🐛',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
        critical: '🚨',
      }[entry.level]

      return `${emoji} [${entry.level.toUpperCase()}] ${entry.message}${
        entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : ''
      }${entry.error ? ` | Error: ${entry.error.message}` : ''}`
    } else {
      // JSON format for production (for log aggregation)
      return JSON.stringify(entry)
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      }
    }

    const formatted = this.formatLog(entry)

    switch (level) {
      case 'debug':
        if (this.isDevelopment) console.debug(formatted)
        break
      case 'info':
        console.info(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'error':
      case 'critical':
        console.error(formatted)
        break
    }

    // In production, also send to external monitoring service
    if (this.isProduction && (level === 'error' || level === 'critical')) {
      this.sendToMonitoring(entry)
    }
  }

  private sendToMonitoring(entry: LogEntry): void {
    // Send to Sentry for error tracking
    try {
      // Dynamically import Sentry to avoid issues if not configured
      import('./sentry').then(({ captureError, captureMessage }) => {
        if (entry.error) {
          const error = new Error(entry.error.message)
          error.name = entry.error.name
          error.stack = entry.error.stack

          captureError(error, {
            tags: {
              level: entry.level,
              ...entry.context,
            },
            extra: entry.context,
          })
        } else {
          captureMessage(entry.message, entry.level === 'critical' ? 'error' : entry.level === 'warn' ? 'warning' : entry.level as any, {
            tags: entry.context as Record<string, string>,
            extra: entry.context,
          })
        }
      }).catch(() => {
        // Sentry not available, just log
        console.error('MONITORING:', JSON.stringify(entry))
      })
    } catch (error) {
      // Fallback to console
      console.error('MONITORING:', JSON.stringify(entry))
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.log('warn', message, context, error)
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error)
  }

  critical(message: string, context?: LogContext, error?: Error): void {
    this.log('critical', message, context, error)
  }

  /**
   * Track API request performance
   */
  apiRequest(params: {
    method: string
    path: string
    status: number
    duration: number
    userId?: string
    workspaceId?: string
    error?: Error
  }): void {
    const { method, path, status, duration, userId, workspaceId, error } = params
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info'

    this.log(
      level,
      `${method} ${path} ${status} - ${duration}ms`,
      {
        method,
        path,
        status: String(status),
        duration,
        userId,
        workspaceId,
      },
      error
    )
  }

  /**
   * Track background job execution
   */
  job(params: {
    jobName: string
    status: 'started' | 'completed' | 'failed'
    duration?: number
    error?: Error
    context?: LogContext
  }): void {
    const { jobName, status, duration, error, context } = params
    const level = status === 'failed' ? 'error' : 'info'

    this.log(
      level,
      `Job ${jobName} ${status}${duration ? ` (${duration}ms)` : ''}`,
      { jobName, status, ...context },
      error
    )
  }

  /**
   * Track payment events
   */
  payment(params: {
    event: string
    amount?: number
    currency?: string
    status: 'success' | 'failed'
    userId?: string
    error?: Error
  }): void {
    const { event, amount, currency, status, userId, error } = params
    const level = status === 'failed' ? 'error' : 'info'

    this.log(
      level,
      `Payment ${event} ${status}${amount ? ` - ${currency} ${amount / 100}` : ''}`,
      { event, amount, currency, status, userId },
      error
    )
  }
}

export const logger = new Logger()
