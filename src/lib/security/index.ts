/**
 * Security Utilities
 * OpenInfo Platform
 *
 * Comprehensive security utilities for the application.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

// ============================================
// CSRF PROTECTION
// ============================================

const CSRF_TOKEN_LENGTH = 32
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_COOKIE_NAME = '__csrf'

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

/**
 * Create CSRF token response with cookie
 */
export function setCsrfCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
  return response
}

/**
 * Validate CSRF token from request
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  if (!cookieToken || !headerToken) {
    return false
  }

  try {
    const cookieBuffer = Buffer.from(cookieToken)
    const headerBuffer = Buffer.from(headerToken)

    if (cookieBuffer.length !== headerBuffer.length) {
      return false
    }

    return timingSafeEqual(cookieBuffer, headerBuffer)
  } catch {
    return false
  }
}

// ============================================
// INPUT SANITIZATION
// ============================================

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  }

  return input.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char])
}

/**
 * Sanitize for SQL (prevent injection)
 * Note: Always use parameterized queries - this is a fallback
 */
export function sanitizeSql(input: string): string {
  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/;/g, '') // Remove semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comments
    .replace(/\*\//g, '')
    .replace(/xp_/gi, '') // Remove extended stored procedures
    .replace(/UNION/gi, '') // Remove UNION statements
    .replace(/SELECT/gi, '') // Remove SELECT statements
    .replace(/INSERT/gi, '') // Remove INSERT statements
    .replace(/UPDATE/gi, '') // Remove UPDATE statements
    .replace(/DELETE/gi, '') // Remove DELETE statements
    .replace(/DROP/gi, '') // Remove DROP statements
}

/**
 * Sanitize URL to prevent open redirect
 */
export function sanitizeUrl(url: string, allowedHosts?: string[]): string | null {
  try {
    const parsed = new URL(url, process.env.NEXT_PUBLIC_APP_URL)

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }

    // If allowed hosts specified, validate
    if (allowedHosts && allowedHosts.length > 0) {
      if (!allowedHosts.includes(parsed.host)) {
        return null
      }
    }

    return parsed.href
  } catch {
    return null
  }
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .substring(0, 255) // Limit length
}

/**
 * Deep sanitize an object
 */
export function deepSanitize<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeHtml(value)
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeHtml(item)
          : typeof item === 'object' && item !== null
            ? deepSanitize(item as Record<string, unknown>)
            : item
      )
    } else if (typeof value === 'object' && value !== null) {
      result[key] = deepSanitize(value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }

  return result as T
}

// ============================================
// RATE LIMITING
// ============================================

interface RateLimitEntry {
  count: number
  resetAt: number
  blocked?: boolean
}

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  blockDuration?: number // How long to block after limit exceeded
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  Array.from(rateLimitStore.entries()).forEach(([key, entry]) => {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  })
}, 60000) // Clean up every minute

/**
 * Check rate limit for a key
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number; retryAfter?: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // Check if blocked
  if (entry?.blocked && entry.resetAt > now) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  // Create or reset entry
  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    }
    rateLimitStore.set(key, newEntry)

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetAt,
    }
  }

  // Increment count
  entry.count++

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    if (config.blockDuration) {
      entry.blocked = true
      entry.resetAt = now + config.blockDuration
    }

    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const rateLimitConfigs = {
  // General API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    blockDuration: 60 * 1000,
  },
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    blockDuration: 15 * 60 * 1000,
  },
  // Search/query endpoints (more expensive)
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    blockDuration: 60 * 1000,
  },
  // Export endpoints
  export: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    blockDuration: 60 * 60 * 1000,
  },
  // Webhook endpoints
  webhook: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    blockDuration: 60 * 1000,
  },
}

// ============================================
// PASSWORD UTILITIES
// ============================================

const PASSWORD_MIN_LENGTH = 8
const PASSWORD_PATTERNS = {
  lowercase: /[a-z]/,
  uppercase: /[A-Z]/,
  number: /[0-9]/,
  special: /[!@#$%^&*(),.?":{}|<>]/,
}

export interface PasswordStrengthResult {
  score: number // 0-4
  feedback: string[]
  isValid: boolean
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = []
  let score = 0

  if (password.length < PASSWORD_MIN_LENGTH) {
    feedback.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  } else {
    score++
  }

  if (!PASSWORD_PATTERNS.lowercase.test(password)) {
    feedback.push('Add lowercase letters')
  } else {
    score++
  }

  if (!PASSWORD_PATTERNS.uppercase.test(password)) {
    feedback.push('Add uppercase letters')
  } else {
    score++
  }

  if (!PASSWORD_PATTERNS.number.test(password)) {
    feedback.push('Add numbers')
  } else {
    score++
  }

  if (!PASSWORD_PATTERNS.special.test(password)) {
    feedback.push('Add special characters')
  } else {
    score++
  }

  // Bonus for length
  if (password.length >= 12) {
    score++
  }

  return {
    score: Math.min(score, 4),
    feedback,
    isValid: score >= 3 && password.length >= PASSWORD_MIN_LENGTH,
  }
}

// ============================================
// SIGNATURE VERIFICATION
// ============================================

/**
 * Generate HMAC signature
 */
export function generateSignature(
  payload: string,
  secret: string,
  algorithm = 'sha256'
): string {
  return createHmac(algorithm, secret).update(payload).digest('hex')
}

/**
 * Verify HMAC signature
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm = 'sha256'
): boolean {
  const expected = generateSignature(payload, secret, algorithm)

  try {
    const signatureBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expected)

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false
    }

    return timingSafeEqual(signatureBuffer, expectedBuffer)
  } catch {
    return false
  }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const parts = signature.split(',')
  const timestamp = parts.find((p) => p.startsWith('t='))?.split('=')[1]
  const v1Signature = parts.find((p) => p.startsWith('v1='))?.split('=')[1]

  if (!timestamp || !v1Signature) {
    return false
  }

  const signedPayload = `${timestamp}.${payload}`
  const expectedSignature = generateSignature(signedPayload, secret)

  return verifySignature(signedPayload, v1Signature, secret)
}

// ============================================
// AUDIT LOGGING
// ============================================

export interface AuditLogEntry {
  timestamp: string
  action: string
  userId?: string
  workspaceId?: string
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, unknown>
  ip?: string
  userAgent?: string
}

const auditLogs: AuditLogEntry[] = []

/**
 * Log an audit event
 */
export function logAuditEvent(entry: Omit<AuditLogEntry, 'timestamp'>): void {
  const logEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  }

  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    console.log('[AUDIT]', JSON.stringify(logEntry))
  } else {
    console.log('[AUDIT]', logEntry)
  }

  // Keep in memory for development (limit to last 1000)
  auditLogs.push(logEntry)
  if (auditLogs.length > 1000) {
    auditLogs.shift()
  }
}

/**
 * Get recent audit logs (development only)
 */
export function getAuditLogs(limit = 100): AuditLogEntry[] {
  return auditLogs.slice(-limit)
}

// ============================================
// SECURITY HEADERS
// ============================================

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Enable XSS filter
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  )

  // Content Security Policy (adjust based on your needs)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co",
        "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join('; ')
    )
  }

  return response
}

// ============================================
// IP UTILITIES
// ============================================

/**
 * Get client IP from request
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'unknown'
}

/**
 * Check if IP is in a blocklist
 */
export function isIpBlocked(ip: string, blocklist: string[]): boolean {
  return blocklist.includes(ip)
}

// ============================================
// TOKEN UTILITIES
// ============================================

/**
 * Generate a secure random token
 */
export function generateSecureToken(length = 32): string {
  return randomBytes(length).toString('hex')
}

/**
 * Generate an API key
 */
export function generateApiKey(prefix = 'oi'): string {
  const key = generateSecureToken(24)
  return `${prefix}_${key}`
}

/**
 * Hash an API key for storage
 */
export function hashApiKey(apiKey: string): string {
  return createHmac('sha256', process.env.API_KEY_SECRET || 'default-secret')
    .update(apiKey)
    .digest('hex')
}
