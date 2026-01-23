// Retry logic with exponential backoff

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  onRetry?: (attempt: number, error: Error) => void
  shouldRetry?: (error: Error) => boolean
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
 * Retry a fetch request with exponential backoff
 *
 * @param input - Fetch input (URL or Request)
 * @param init - Fetch init options
 * @param options - Retry options
 * @returns Promise resolving to the Response
 *
 * @example
 * const response = await retryFetch('/api/data', {
 *   method: 'POST',
 *   body: JSON.stringify(data)
 * })
 */
export async function retryFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  return retry(async () => {
    const response = await fetch(input, init)

    // Throw on error status to trigger retry
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response
  }, options)
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
