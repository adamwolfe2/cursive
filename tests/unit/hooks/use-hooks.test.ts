/**
 * Custom Hooks Tests
 * OpenInfo Platform
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useDebounce,
  useThrottle,
  usePrevious,
  useIsMounted,
  useLocalStorage,
  useToggle,
  useCopyToClipboard,
} from '@/lib/hooks'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))

    expect(result.current).toBe('initial')
  })

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    )

    // Change value
    rerender({ value: 'updated' })

    // Value should not change immediately
    expect(result.current).toBe('initial')

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Now value should be updated
    expect(result.current).toBe('updated')
  })

  it('resets timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'a' } }
    )

    // Rapid changes
    rerender({ value: 'b' })
    act(() => {
      vi.advanceTimersByTime(200)
    })

    rerender({ value: 'c' })
    act(() => {
      vi.advanceTimersByTime(200)
    })

    rerender({ value: 'd' })

    // Value should still be initial
    expect(result.current).toBe('a')

    // Complete debounce
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Should be the last value
    expect(result.current).toBe('d')
  })
})

describe('useThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useThrottle('initial', 500))

    expect(result.current).toBe('initial')
  })

  it('throttles rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 500),
      { initialProps: { value: 'a' } }
    )

    // First change should be immediate (within interval)
    rerender({ value: 'b' })

    // Subsequent rapid changes should be throttled
    rerender({ value: 'c' })
    rerender({ value: 'd' })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('d')
  })
})

describe('usePrevious', () => {
  it('returns undefined on first render', () => {
    const { result } = renderHook(() => usePrevious('initial'))

    expect(result.current).toBeUndefined()
  })

  it('returns previous value after update', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: 'first' } }
    )

    rerender({ value: 'second' })

    expect(result.current).toBe('first')

    rerender({ value: 'third' })

    expect(result.current).toBe('second')
  })
})

describe('useIsMounted', () => {
  it('returns true when mounted', () => {
    const { result } = renderHook(() => useIsMounted())

    expect(result.current()).toBe(true)
  })

  it('returns false after unmount', () => {
    const { result, unmount } = renderHook(() => useIsMounted())

    unmount()

    expect(result.current()).toBe(false)
  })
})

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns initial value when no stored value', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))

    expect(result.current[0]).toBe('default')
  })

  it('returns stored value when exists', () => {
    localStorage.setItem('test-key', JSON.stringify('stored'))

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))

    expect(result.current[0]).toBe('stored')
  })

  it('updates localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))

    act(() => {
      result.current[1]('updated')
    })

    expect(result.current[0]).toBe('updated')
    expect(JSON.parse(localStorage.getItem('test-key') || '')).toBe('updated')
  })

  it('handles objects correctly', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', { name: 'test' })
    )

    act(() => {
      result.current[1]({ name: 'updated' })
    })

    expect(result.current[0]).toEqual({ name: 'updated' })
  })

  it('handles function updates', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0))

    act(() => {
      result.current[1]((prev) => prev + 1)
    })

    expect(result.current[0]).toBe(1)
  })
})

describe('useToggle', () => {
  it('returns initial value', () => {
    const { result } = renderHook(() => useToggle(false))

    expect(result.current[0]).toBe(false)
  })

  it('toggles value', () => {
    const { result } = renderHook(() => useToggle(false))

    act(() => {
      result.current[1]() // toggle
    })

    expect(result.current[0]).toBe(true)

    act(() => {
      result.current[1]() // toggle again
    })

    expect(result.current[0]).toBe(false)
  })

  it('sets specific value', () => {
    const { result } = renderHook(() => useToggle(false))

    act(() => {
      result.current[2](true) // setValue
    })

    expect(result.current[0]).toBe(true)
  })
})

describe('useCopyToClipboard', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useCopyToClipboard())

    expect(result.current[0]).toEqual({ copied: false, error: null })
  })

  it('copies text to clipboard', async () => {
    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      const success = await result.current[1]('test text')
      expect(success).toBe(true)
    })

    expect(result.current[0].copied).toBe(true)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text')
  })

  it('handles copy errors', async () => {
    const error = new Error('Copy failed')
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(error)

    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      const success = await result.current[1]('test text')
      expect(success).toBe(false)
    })

    expect(result.current[0].error).toBe(error)
  })
})
