// Retry logic with exponential backoff and timeout support

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  timeout?: number // Request timeout in milliseconds
  onRetry?: (attempt: number, error: Error) => void
  shouldRetry?: (error: Error) => boolean
}

/**
 * Default timeout for API requests (30 seconds)
 */
export const DEFAULT_TIMEOUT = 30000

/**
 * Timeout error class
 */
export class TimeoutError extends Error {
  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms`)
    this.name = 'TimeoutError'
  }
}

/**
 * Create an AbortController with timeout
 */
export function createTimeoutController(timeout: number): {
  controller: AbortController
  timeoutId: NodeJS.Timeout
} {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  return { controller, timeoutId }
}

/**
 * Fetch with timeout support
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit & { timeout?: number }
): Promise<Response> {
  const timeout = init?.timeout ?? DEFAULT_TIMEOUT

  const { controller, timeoutId } = createTimeoutController(timeout)

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    })
    return response
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(timeout)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export class RetryError extends Error {
  constructor(
    message: string,
    public lastError: Error,
    public attempts: number
  ) {
    super(message)
    this.name = 'RetryError'
  }
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Function to retry
 * @param options - Retry options
 * @returns Promise resolving to the function result
 *
 * @example
 * const data = await retry(
 *   () => fetch('/api/data').then(r => r.json()),
 *   { maxRetries: 3 }
 * )
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    onRetry,
    shouldRetry = (error: Error) => {
      // Retry on network errors and 5xx errors
      if (error.message.includes('fetch')) return true
      if (error.message.includes('Network')) return true
      if (error.message.includes('timeout')) return true
      if (error.message.includes('500')) return true
      if (error.message.includes('502')) return true
      if (error.message.includes('503')) return true
      if (error.message.includes('504')) return true
      return false
    },
  } = options

  let lastError: Error | null = null
  let attempt = 0

  while (attempt <= maxRetries) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      attempt++

      // Check if we should retry
      if (attempt > maxRetries || !shouldRetry(lastError)) {
        break
      }

      // Call onRetry callback
      onRetry?.(attempt, lastError)

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay)

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // All retries failed
  throw new RetryError(
    `Failed after ${attempt} attempts: ${lastError?.message}`,
    lastError!,
    attempt
  )
}

/**
 * Retry a fetch request with exponential backoff and timeout
 *
 * @param input - Fetch input (URL or Request)
 * @param init - Fetch init options (supports timeout)
 * @param options - Retry options
 * @returns Promise resolving to the Response
 *
 * @example
 * const response = await retryFetch('/api/data', {
 *   method: 'POST',
 *   body: JSON.stringify(data),
 *   timeout: 10000
 * })
 */
export async function retryFetch(
  input: RequestInfo | URL,
  init?: RequestInit & { timeout?: number },
  options: RetryOptions = {}
): Promise<Response> {
  const timeout = init?.timeout ?? options.timeout ?? DEFAULT_TIMEOUT

  return retry(async () => {
    const response = await fetchWithTimeout(input, { ...init, timeout })

    // Throw on 5xx errors to trigger retry, but not 4xx (client errors)
    if (response.status >= 500) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response
  }, {
    ...options,
    shouldRetry: options.shouldRetry ?? ((error: Error) => {
      // Retry on network/timeout errors and 5xx errors
      if (error instanceof TimeoutError) return true
      if (error.message.includes('fetch')) return true
      if (error.message.includes('Network')) return true
      if (error.message.includes('ECONNREFUSED')) return true
      if (error.message.includes('ENOTFOUND')) return true
      if (error.message.includes('500')) return true
      if (error.message.includes('502')) return true
      if (error.message.includes('503')) return true
      if (error.message.includes('504')) return true
      return false
    }),
  })
}

/**
 * Retry a fetch request and parse JSON with exponential backoff
 *
 * @param input - Fetch input (URL or Request)
 * @param init - Fetch init options
 * @param options - Retry options
 * @returns Promise resolving to the parsed JSON
 *
 * @example
 * const data = await retryFetchJson('/api/data')
 */
export async function retryFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<T> {
  const response = await retryFetch(input, init, options)
  return response.json()
}
