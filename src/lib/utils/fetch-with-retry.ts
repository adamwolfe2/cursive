// Fetch with Retry Logic
// Automatically retries failed API calls with exponential backoff
// Prevents transient network errors from breaking user workflows

export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  retries?: number

  /**
   * Base delay in milliseconds before first retry
   * Subsequent retries use exponential backoff
   * @default 1000
   */
  delay?: number

  /**
   * Callback function called before each retry
   * Useful for showing retry notifications to users
   */
  onRetry?: (attempt: number, error: Error) => void

  /**
   * Custom function to determine if error should be retried
   * Return true to retry, false to fail immediately
   * @default Retries on network errors and 5xx status codes
   */
  shouldRetry?: (error: Error, attempt: number) => boolean
}

/**
 * Default retry strategy
 * Retries on network errors and 5xx server errors
 * Does NOT retry on 4xx client errors (bad request, auth, etc.)
 */
function defaultShouldRetry(error: Error): boolean {
  // Network/fetch errors should be retried
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return true
  }

  // Check if error has status code (from API responses)
  if ('status' in error) {
    const status = (error as any).status as number

    // Retry on 5xx server errors
    if (status >= 500 && status < 600) {
      return true
    }

    // Retry on 429 (rate limit)
    if (status === 429) {
      return true
    }

    // Don't retry on 4xx client errors
    return false
  }

  // Default: retry on unknown errors
  return true
}

/**
 * Execute a function with automatic retry logic
 *
 * Usage:
 * ```ts
 * const result = await fetchWithRetry(
 *   () => fetch('/api/data').then(r => r.json()),
 *   { retries: 3, delay: 1000 }
 * )
 * ```
 *
 * @param fetchFn - The function to execute (should return a Promise)
 * @param options - Retry configuration options
 * @returns Promise that resolves with the function result or rejects after all retries
 */
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    delay = 1000,
    onRetry,
    shouldRetry = defaultShouldRetry,
  } = options

  let lastError: Error

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetchFn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // If this is the last attempt, throw the error
      if (attempt === retries) {
        throw lastError
      }

      // Check if we should retry this error
      if (!shouldRetry(lastError, attempt)) {
        throw lastError
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, lastError)
      }

      // Exponential backoff: delay * attempt
      // Attempt 1: 1s, Attempt 2: 2s, Attempt 3: 3s
      const backoffDelay = delay * attempt

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, backoffDelay))
    }
  }

  // This should never be reached due to the throw in the loop
  throw lastError!
}

/**
 * Wrapper for fetch() with automatic retry
 * Convenience function for common fetch use case
 *
 * Usage:
 * ```ts
 * const response = await retryableFetch('/api/data', {
 *   method: 'POST',
 *   body: JSON.stringify(data)
 * })
 * const result = await response.json()
 * ```
 */
export async function retryableFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  return fetchWithRetry(async () => {
    const response = await fetch(input, init)

    // Throw error on non-2xx responses so retry logic can handle them
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as Error & { status: number }
      error.status = response.status
      throw error
    }

    return response
  }, options)
}

/**
 * React Query / TanStack Query compatible wrapper
 * Use with useMutation or useQuery
 *
 * Usage:
 * ```ts
 * const mutation = useMutation({
 *   mutationFn: withRetry((data) => apiCall(data)),
 * })
 * ```
 */
export function withRetry<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options?: RetryOptions
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => fetchWithRetry(() => fn(...args), options)
}
