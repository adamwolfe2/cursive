/**
 * Mock Utilities
 * OpenInfo Platform
 *
 * Reusable mocks for testing.
 */

import { vi } from 'vitest'

// ============================================
// SUPABASE MOCK
// ============================================

export interface MockSupabaseClient {
  auth: {
    getSession: ReturnType<typeof vi.fn>
    getUser: ReturnType<typeof vi.fn>
    signInWithPassword: ReturnType<typeof vi.fn>
    signUp: ReturnType<typeof vi.fn>
    signOut: ReturnType<typeof vi.fn>
    onAuthStateChange: ReturnType<typeof vi.fn>
  }
  from: ReturnType<typeof vi.fn>
}

export function createMockSupabaseClient(): MockSupabaseClient {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: [], error: null }),
  }

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      }),
    },
    from: vi.fn().mockReturnValue(mockQueryBuilder),
  }
}

// ============================================
// ROUTER MOCK
// ============================================

export interface MockRouter {
  push: ReturnType<typeof vi.fn>
  replace: ReturnType<typeof vi.fn>
  back: ReturnType<typeof vi.fn>
  forward: ReturnType<typeof vi.fn>
  refresh: ReturnType<typeof vi.fn>
  prefetch: ReturnType<typeof vi.fn>
  pathname: string
  query: Record<string, string>
}

export function createMockRouter(overrides: Partial<MockRouter> = {}): MockRouter {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    pathname: '/',
    query: {},
    ...overrides,
  }
}

// ============================================
// FETCH MOCK
// ============================================

export interface FetchMockResponse {
  ok: boolean
  status: number
  statusText: string
  json: () => Promise<unknown>
  text: () => Promise<string>
  headers: Headers
}

export function createFetchMock(
  response: unknown,
  options: Partial<FetchMockResponse> = {}
): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
    headers: new Headers(),
    ...options,
  } as FetchMockResponse)
}

export function createFetchErrorMock(
  error: { message: string; status?: number } = { message: 'Fetch error', status: 500 }
): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: false,
    status: error.status || 500,
    statusText: 'Internal Server Error',
    json: () => Promise.resolve({ error: error.message }),
    text: () => Promise.resolve(error.message),
    headers: new Headers(),
  } as FetchMockResponse)
}

// ============================================
// USER MOCK DATA
// ============================================

export interface MockUser {
  id: string
  auth_user_id: string
  email: string
  full_name: string
  workspace_id: string
  plan: string
  daily_credits_used: number
  daily_credit_limit: number
  created_at: string
  updated_at: string
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'user-123',
    auth_user_id: 'auth-123',
    email: 'test@example.com',
    full_name: 'Test User',
    workspace_id: 'workspace-123',
    plan: 'pro',
    daily_credits_used: 0,
    daily_credit_limit: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

// ============================================
// WORKSPACE MOCK DATA
// ============================================

export interface MockWorkspace {
  id: string
  name: string
  subdomain: string
  owner_id: string
  plan: string
  created_at: string
  updated_at: string
}

export function createMockWorkspace(overrides: Partial<MockWorkspace> = {}): MockWorkspace {
  return {
    id: 'workspace-123',
    name: 'Test Workspace',
    subdomain: 'test',
    owner_id: 'user-123',
    plan: 'pro',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

// ============================================
// QUERY MOCK DATA
// ============================================

export interface MockQuery {
  id: string
  workspace_id: string
  topic: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  results_count: number
  created_at: string
  updated_at: string
}

export function createMockQuery(overrides: Partial<MockQuery> = {}): MockQuery {
  return {
    id: 'query-123',
    workspace_id: 'workspace-123',
    topic: 'kubernetes',
    status: 'completed',
    results_count: 50,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

// ============================================
// LEAD MOCK DATA
// ============================================

export interface MockLead {
  id: string
  workspace_id: string
  query_id: string
  company_name: string
  company_domain: string
  industry: string
  employee_count: string
  location: string
  intent_score: number
  created_at: string
}

export function createMockLead(overrides: Partial<MockLead> = {}): MockLead {
  return {
    id: 'lead-123',
    workspace_id: 'workspace-123',
    query_id: 'query-123',
    company_name: 'Acme Corp',
    company_domain: 'acme.com',
    industry: 'Technology',
    employee_count: '100-500',
    location: 'San Francisco, CA',
    intent_score: 85,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

// ============================================
// LIST GENERATORS
// ============================================

export function createMockList<T>(
  factory: (index: number) => T,
  count: number
): T[] {
  return Array.from({ length: count }, (_, index) => factory(index))
}

export function createMockLeadList(count: number): MockLead[] {
  return createMockList(
    (index) =>
      createMockLead({
        id: `lead-${index}`,
        company_name: `Company ${index}`,
        company_domain: `company${index}.com`,
        intent_score: Math.floor(Math.random() * 100),
      }),
    count
  )
}

export function createMockQueryList(count: number): MockQuery[] {
  return createMockList(
    (index) =>
      createMockQuery({
        id: `query-${index}`,
        topic: `Topic ${index}`,
        results_count: Math.floor(Math.random() * 100),
        status: ['pending', 'processing', 'completed', 'failed'][index % 4] as MockQuery['status'],
      }),
    count
  )
}

// ============================================
// ASYNC HELPERS
// ============================================

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  { timeout = 1000, interval = 50 } = {}
): Promise<void> {
  const startTime = Date.now()

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('waitFor timed out')
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
}

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Flush all pending promises
 */
export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}
