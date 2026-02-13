// Form Submission Hook with Debouncing
// Prevents double-submission and provides loading state
// Use this hook with react-hook-form for consistent submission handling

import { useState, useCallback } from 'react'
import { UseFormReturn } from 'react-hook-form'

interface UseFormSubmitOptions<TFormData> {
  /**
   * The submit handler function
   */
  onSubmit: (data: TFormData) => Promise<void> | void

  /**
   * Optional callback after successful submission
   */
  onSuccess?: () => void

  /**
   * Optional callback on error
   */
  onError?: (error: Error) => void

  /**
   * Minimum time between submissions in milliseconds
   * Prevents accidental double-clicks
   * @default 500
   */
  debounceMs?: number
}

interface UseFormSubmitReturn {
  /**
   * Whether the form is currently submitting
   */
  isSubmitting: boolean

  /**
   * Error from last submission (if any)
   */
  error: Error | null

  /**
   * Handler function to pass to form's onSubmit
   */
  handleSubmit: (data: any) => Promise<void>

  /**
   * Reset error state
   */
  clearError: () => void
}

/**
 * Hook for handling form submissions with debouncing and error handling
 *
 * Features:
 * - Prevents double-submission
 * - Automatic loading state
 * - Error handling
 * - Debouncing to prevent accidental rapid submissions
 *
 * Usage:
 * ```tsx
 * const form = useForm<SignupFormData>({
 *   resolver: zodResolver(signupSchema),
 * })
 *
 * const { isSubmitting, handleSubmit } = useFormSubmit({
 *   onSubmit: async (data) => {
 *     await apiCall(data)
 *   },
 *   onSuccess: () => {
 *     toast.success('Form submitted!')
 *   },
 * })
 *
 * <form onSubmit={form.handleSubmit(handleSubmit)}>
 *   <Button type="submit" disabled={isSubmitting}>
 *     {isSubmitting ? 'Submitting...' : 'Submit'}
 *   </Button>
 * </form>
 * ```
 */
export function useFormSubmit<TFormData = any>(
  options: UseFormSubmitOptions<TFormData>
): UseFormSubmitReturn {
  const { onSubmit, onSuccess, onError, debounceMs = 500 } = options

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastSubmitTime, setLastSubmitTime] = useState(0)

  const handleSubmit = useCallback(
    async (data: TFormData) => {
      // Prevent double-submission
      if (isSubmitting) {
        return
      }

      // Debounce rapid submissions (prevents accidental double-clicks)
      const now = Date.now()
      if (now - lastSubmitTime < debounceMs) {
        return
      }

      setIsSubmitting(true)
      setError(null)
      setLastSubmitTime(now)

      try {
        await onSubmit(data)
        onSuccess?.()
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [isSubmitting, lastSubmitTime, debounceMs, onSubmit, onSuccess, onError]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isSubmitting,
    error,
    handleSubmit,
    clearError,
  }
}

/**
 * Simpler version for forms without react-hook-form
 *
 * Usage:
 * ```tsx
 * const { isSubmitting, handleSubmit } = useSimpleFormSubmit(async () => {
 *   await apiCall()
 * })
 *
 * <button onClick={handleSubmit} disabled={isSubmitting}>
 *   {isSubmitting ? 'Submitting...' : 'Submit'}
 * </button>
 * ```
 */
export function useSimpleFormSubmit(
  onSubmit: () => Promise<void> | void,
  options?: Omit<UseFormSubmitOptions<void>, 'onSubmit'>
): Omit<UseFormSubmitReturn, 'error' | 'clearError'> {
  const { isSubmitting, handleSubmit } = useFormSubmit({
    onSubmit,
    ...options,
  })

  return {
    isSubmitting,
    handleSubmit: () => handleSubmit(undefined as any),
  }
}

/**
 * HOC to wrap react-hook-form's handleSubmit with debouncing
 * Alternative approach for existing forms
 *
 * Usage:
 * ```tsx
 * const form = useForm()
 *
 * <form onSubmit={withSubmitDebounce(form.handleSubmit(onSubmit))}>
 * ```
 */
export function withSubmitDebounce<T extends (...args: any[]) => any>(
  handler: T,
  debounceMs: number = 500
): T {
  let isSubmitting = false
  let lastSubmitTime = 0

  return ((...args: any[]) => {
    if (isSubmitting) {
      return
    }

    const now = Date.now()
    if (now - lastSubmitTime < debounceMs) {
      return
    }

    isSubmitting = true
    lastSubmitTime = now

    const result = handler(...args)

    // If result is a Promise, reset isSubmitting when done
    if (result instanceof Promise) {
      result.finally(() => {
        isSubmitting = false
      })
    } else {
      isSubmitting = false
    }

    return result
  }) as T
}
