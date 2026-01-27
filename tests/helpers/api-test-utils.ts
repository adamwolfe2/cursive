/**
 * API Testing Utilities
 * OpenInfo Platform
 *
 * Helpers for testing API routes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { vi } from 'vitest'

// ============================================
// REQUEST BUILDERS
// ============================================

/**
 * Create a mock NextRequest for testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
    searchParams?: Record<string, string>
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {}, searchParams = {} } = options

  // Build URL with search params
  const urlObj = new URL(url, 'http://localhost:3000')
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value)
  })

  const requestInit: RequestInit = {
    method,
    headers: new Headers({
      'Content-Type': 'application/json',
      ...headers,
    }),
  }

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body)
  }

  return new NextRequest(urlObj.toString(), requestInit)
}

/**
 * Create a mock request with authentication
 */
export function createAuthenticatedRequest(
  url: string,
  options: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
    searchParams?: Record<string, string>
    userId?: string
    workspaceId?: string
  } = {}
): NextRequest {
  const { userId = 'test-user-id', workspaceId = 'test-workspace-id', ...rest } = options

  return createMockRequest(url, {
    ...rest,
    headers: {
      ...rest.headers,
      'x-user-id': userId,
      'x-workspace-id': workspaceId,
    },
  })
}

/**
 * Create a mock request with API key
 */
export function createApiKeyRequest(
  url: string,
  apiKey: string,
  options: {
    method?: string
    body?: unknown
    headers?: Record<string, string>
    searchParams?: Record<string, string>
  } = {}
): NextRequest {
  return createMockRequest(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-API-Key': apiKey,
    },
  })
}

// ============================================
// RESPONSE HELPERS
// ============================================

/**
 * Parse JSON response from NextResponse
 */
export async function parseResponse<T = unknown>(response: NextResponse): Promise<{
  status: number
  data: T
  headers: Record<string, string>
}> {
  const data = await response.json()
  const headers: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    headers[key] = value
  })

  return {
    status: response.status,
    data,
    headers,
  }
}

/**
 * Assert response is successful (2xx status)
 */
export async function expectSuccess<T>(response: NextResponse): Promise<T> {
  const { status, data } = await parseResponse<T>(response)
  if (status < 200 || status >= 300) {
    throw new Error(`Expected success response but got ${status}: ${JSON.stringify(data)}`)
  }
  return data
}

/**
 * Assert response is an error with specific status
 */
export async function expectError(
  response: NextResponse,
  expectedStatus: number
): Promise<{ error: string }> {
  const { status, data } = await parseResponse<{ error: string }>(response)
  if (status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus} but got ${status}: ${JSON.stringify(data)}`)
  }
  return data
}

// ============================================
// MOCK FACTORIES
// ============================================

/**
 * Create a mock user for testing
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'test-user-id',
    auth_user_id: 'auth-user-id',
    workspace_id: 'test-workspace-id',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export interface MockUser {
  id: string
  auth_user_id: string
  workspace_id: string
  email: string
  full_name: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  created_at: string
  updated_at: string
}

/**
 * Create a mock workspace for testing
 */
export function createMockWorkspace(overrides: Partial<MockWorkspace> = {}): MockWorkspace {
  return {
    id: 'test-workspace-id',
    name: 'Test Workspace',
    slug: 'test-workspace',
    subscription_tier: 'professional',
    subscription_status: 'active',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export interface MockWorkspace {
  id: string
  name: string
  slug: string
  subscription_tier: 'free' | 'starter' | 'professional' | 'enterprise'
  subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Create a mock lead for testing
 */
export function createMockLead(overrides: Partial<MockLead> = {}): MockLead {
  return {
    id: 'test-lead-id',
    workspace_id: 'test-workspace-id',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    company_name: 'Acme Corp',
    company_industry: 'Technology',
    lead_score: 75,
    enrichment_status: 'completed',
    delivery_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export interface MockLead {
  id: string
  workspace_id: string
  first_name: string
  last_name: string
  email: string
  company_name: string
  company_industry: string
  lead_score: number
  enrichment_status: 'pending' | 'in_progress' | 'completed' | 'failed'
  delivery_status: 'pending' | 'delivered' | 'failed'
  created_at: string
  updated_at: string
}

// ============================================
// SUPABASE MOCKS
// ============================================

/**
 * Create a mock Supabase client
 */
export function createMockSupabase() {
  const mockSelect = vi.fn().mockReturnThis()
  const mockInsert = vi.fn().mockReturnThis()
  const mockUpdate = vi.fn().mockReturnThis()
  const mockDelete = vi.fn().mockReturnThis()
  const mockEq = vi.fn().mockReturnThis()
  const mockNeq = vi.fn().mockReturnThis()
  const mockGte = vi.fn().mockReturnThis()
  const mockLte = vi.fn().mockReturnThis()
  const mockOrder = vi.fn().mockReturnThis()
  const mockLimit = vi.fn().mockReturnThis()
  const mockRange = vi.fn().mockReturnThis()
  const mockSingle = vi.fn()
  const mockMaybeSingle = vi.fn()

  const chainable = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    neq: mockNeq,
    gte: mockGte,
    lte: mockLte,
    order: mockOrder,
    limit: mockLimit,
    range: mockRange,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
  }

  // Make all methods return the chainable object
  Object.values(chainable).forEach(method => {
    method.mockReturnValue(chainable)
  })

  const mockFrom = vi.fn().mockReturnValue(chainable)
  const mockRpc = vi.fn()

  return {
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
    _mocks: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
      rpc: mockRpc,
    },
  }
}

// ============================================
// AUTH MOCKS
// ============================================

/**
 * Mock the getCurrentUser helper
 */
export function mockGetCurrentUser(user: MockUser | null) {
  return vi.fn().mockResolvedValue(user)
}

/**
 * Mock the requireAdmin helper
 */
export function mockRequireAdmin(isAdmin: boolean) {
  if (isAdmin) {
    return vi.fn().mockResolvedValue(undefined)
  }
  return vi.fn().mockRejectedValue(new Error('Unauthorized'))
}

// ============================================
// TEST UTILITIES
// ============================================

/**
 * Wait for all promises to resolve (useful for testing async operations)
 */
export async function flushPromises(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * Generate a random UUID for testing
 */
export function generateTestUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Create route context for dynamic routes
 */
export function createRouteContext(params: Record<string, string>) {
  return {
    params: Promise.resolve(params),
  }
}
