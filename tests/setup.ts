/**
 * Test Setup File
 * OpenInfo Platform
 *
 * Global test configuration, mocks, and utilities.
 */

import { expect, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// ============================================
// CLEANUP
// ============================================

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// ============================================
// GLOBAL MOCKS
// ============================================

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
class MockIntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []

  constructor(callback: IntersectionObserverCallback) {
    // Store callback for potential use in tests
    ;(this as unknown as { callback: IntersectionObserverCallback }).callback = callback
  }

  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn().mockReturnValue([])
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
})

// Mock ResizeObserver
class MockResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    ;(this as unknown as { callback: ResizeObserverCallback }).callback = callback
  }

  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
})

// Mock requestIdleCallback
Object.defineProperty(window, 'requestIdleCallback', {
  writable: true,
  value: vi.fn((callback: IdleRequestCallback) => {
    return setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 0)
  }),
})

Object.defineProperty(window, 'cancelIdleCallback', {
  writable: true,
  value: vi.fn((id: number) => clearTimeout(id)),
})

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
})

// ============================================
// CUSTOM MATCHERS
// ============================================

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      }
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      }
    }
  },

  toContainObject(received: unknown[], argument: object) {
    const pass = received.some((item) =>
      Object.entries(argument).every(
        ([key, value]) => (item as Record<string, unknown>)[key] === value
      )
    )

    if (pass) {
      return {
        message: () =>
          `expected ${JSON.stringify(received)} not to contain object ${JSON.stringify(argument)}`,
        pass: true,
      }
    } else {
      return {
        message: () =>
          `expected ${JSON.stringify(received)} to contain object ${JSON.stringify(argument)}`,
        pass: false,
      }
    }
  },
})

// ============================================
// CONSOLE MOCKING
// ============================================

// Suppress console.error and console.warn in tests unless explicitly testing for them
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = vi.fn((...args: unknown[]) => {
    // Allow certain errors through
    const message = args[0]
    if (
      typeof message === 'string' &&
      (message.includes('Warning: ReactDOM.render is no longer supported') ||
        message.includes('Warning: An update to') ||
        message.includes('act(...)'))
    ) {
      return
    }
    originalError.apply(console, args)
  })

  console.warn = vi.fn((...args: unknown[]) => {
    // Allow certain warnings through
    const message = args[0]
    if (typeof message === 'string' && message.includes('Warning:')) {
      return
    }
    originalWarn.apply(console, args)
  })
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// ============================================
// TYPE DECLARATIONS
// ============================================

declare module 'vitest' {
  interface Assertion<T = unknown> {
    toBeWithinRange(floor: number, ceiling: number): T
    toContainObject(argument: object): T
  }
  interface AsymmetricMatchersContaining {
    toBeWithinRange(floor: number, ceiling: number): unknown
    toContainObject(argument: object): unknown
  }
}
