/**
 * Developer Logger
 * OpenInfo Platform
 *
 * Structured logging utilities for development and debugging.
 */

// ============================================
// TYPES
// ============================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  context?: Record<string, unknown>
  error?: Error
  stack?: string
}

export interface LoggerConfig {
  enabled: boolean
  minLevel: LogLevel
  includeTimestamp: boolean
  includeContext: boolean
  colorize: boolean
  prefix?: string
}

// ============================================
// LOG LEVEL UTILITIES
// ============================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[90m', // Gray
  info: '\x1b[36m',  // Cyan
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
}

const RESET_COLOR = '\x1b[0m'

// ============================================
// LOGGER CLASS
// ============================================

class Logger {
  private config: LoggerConfig

  constructor(config?: Partial<LoggerConfig>) {
    const isDev = process.env.NODE_ENV === 'development'

    this.config = {
      enabled: isDev,
      minLevel: isDev ? 'debug' : 'warn',
      includeTimestamp: true,
      includeContext: true,
      colorize: true,
      ...config,
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel]
  }

  private formatMessage(entry: LogEntry): string {
    const parts: string[] = []

    // Timestamp
    if (this.config.includeTimestamp) {
      const time = entry.timestamp.toISOString().split('T')[1].slice(0, 12)
      parts.push(`[${time}]`)
    }

    // Prefix
    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`)
    }

    // Level
    const levelStr = entry.level.toUpperCase().padEnd(5)
    if (this.config.colorize && typeof window === 'undefined') {
      parts.push(`${LOG_COLORS[entry.level]}${levelStr}${RESET_COLOR}`)
    } else {
      parts.push(levelStr)
    }

    // Message
    parts.push(entry.message)

    return parts.join(' ')
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
    }

    const formattedMessage = this.formatMessage(entry)

    // Select console method
    const consoleFn =
      level === 'debug'
        ? console.debug
        : level === 'info'
        ? console.info
        : level === 'warn'
        ? console.warn
        : console.error

    // Log message
    if (context && this.config.includeContext) {
      consoleFn(formattedMessage, context)
    } else {
      consoleFn(formattedMessage)
    }
  }

  /**
   * Log debug message (verbose development info)
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context)
  }

  /**
   * Log info message (general information)
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context)
  }

  /**
   * Log warning message (potential issues)
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context)
  }

  /**
   * Log error message with optional error object
   */
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const errorContext = {
      ...context,
      ...(error instanceof Error
        ? { errorMessage: error.message, errorStack: error.stack }
        : { error }),
    }
    this.log('error', message, errorContext)
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix,
    })
  }

  /**
   * Log the start of an operation
   */
  start(operation: string, context?: Record<string, unknown>): () => void {
    const startTime = performance.now()
    this.debug(`Starting: ${operation}`, context)

    return () => {
      const duration = performance.now() - startTime
      this.debug(`Completed: ${operation}`, { ...context, durationMs: duration.toFixed(2) })
    }
  }

  /**
   * Create a timed operation
   */
  async time<T>(operation: string, fn: () => T | Promise<T>, context?: Record<string, unknown>): Promise<T> {
    const end = this.start(operation, context)
    try {
      const result = await fn()
      end()
      return result
    } catch (error) {
      this.error(`Failed: ${operation}`, error, context)
      throw error
    }
  }

  /**
   * Group related log messages
   */
  group(label: string, fn: () => void): void {
    if (!this.config.enabled) {
      fn()
      return
    }

    console.group(label)
    try {
      fn()
    } finally {
      console.groupEnd()
    }
  }

  /**
   * Log a table of data
   */
  table(data: unknown[], columns?: string[]): void {
    if (!this.shouldLog('debug')) return
    console.table(data, columns)
  }

  /**
   * Assert a condition
   */
  assert(condition: boolean, message: string, context?: Record<string, unknown>): void {
    if (!condition) {
      this.error(`Assertion failed: ${message}`, undefined, context)
      if (process.env.NODE_ENV === 'development') {
        throw new Error(`Assertion failed: ${message}`)
      }
    }
  }

  /**
   * Configure the logger
   */
  configure(config: Partial<LoggerConfig>): void {
    Object.assign(this.config, config)
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const logger = new Logger()

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Create a scoped logger for a specific module
 * @example
 * const log = createLogger('AuthService')
 * log.info('User logged in', { userId: '123' })
 */
export function createLogger(scope: string): Logger {
  return logger.child(scope)
}

/**
 * Log function execution time
 * @example
 * const result = await logTime('fetchUsers', async () => {
 *   return await api.getUsers()
 * })
 */
export async function logTime<T>(
  operation: string,
  fn: () => T | Promise<T>
): Promise<T> {
  return logger.time(operation, fn)
}

/**
 * Development-only console.log wrapper
 * Only logs in development environment
 */
export function devLog(...args: unknown[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[DEV]', ...args)
  }
}

/**
 * Development-only console.warn wrapper
 */
export function devWarn(...args: unknown[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[DEV]', ...args)
  }
}

/**
 * Development-only console.error wrapper
 */
export function devError(...args: unknown[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.error('[DEV]', ...args)
  }
}
