/**
 * Tests for GHL client utilities.
 *
 * Network-touching functions are mocked. Pure utilities (phone normalization,
 * etc.) are tested directly because they're called on every visitor sync and
 * a regression here would cause silent data corruption in customer GHL CRMs.
 */

import { describe, it, expect } from 'vitest'
import { normalizePhoneE164 } from '@/lib/marketplace/ghl/client'
import { isValidShopDomain } from '@/lib/marketplace/shopify/client'

describe('normalizePhoneE164', () => {
  it('returns null for null/undefined/empty input', () => {
    expect(normalizePhoneE164(null)).toBe(null)
    expect(normalizePhoneE164(undefined)).toBe(null)
    expect(normalizePhoneE164('')).toBe(null)
  })

  it('formats a 10-digit US number with +1', () => {
    expect(normalizePhoneE164('4155551234')).toBe('+14155551234')
  })

  it('formats a 10-digit number with parens and dashes', () => {
    expect(normalizePhoneE164('(415) 555-1234')).toBe('+14155551234')
  })

  it('formats an 11-digit number starting with 1 as +1XXXXXXXXXX', () => {
    expect(normalizePhoneE164('14155551234')).toBe('+14155551234')
  })

  it('preserves already-E164 numbers', () => {
    expect(normalizePhoneE164('+14155551234')).toBe('+14155551234')
  })

  it('strips spaces from already-E164 numbers', () => {
    expect(normalizePhoneE164('+1 415 555 1234')).toBe('+14155551234')
  })

  it('returns null for inputs that cannot be normalized to a valid E.164', () => {
    expect(normalizePhoneE164('555')).toBe(null) // too short
    expect(normalizePhoneE164('abc')).toBe(null)
    expect(normalizePhoneE164('123456789')).toBe(null) // 9 digits, not US
  })

  it('returns null when only non-digit characters are present', () => {
    expect(normalizePhoneE164('---')).toBe(null)
  })
})

describe('isValidShopDomain', () => {
  it('accepts canonical *.myshopify.com', () => {
    expect(isValidShopDomain('test-shop.myshopify.com')).toBe(true)
    expect(isValidShopDomain('a.myshopify.com')).toBe(true)
  })

  it('rejects spoofed domains', () => {
    expect(isValidShopDomain('test-shop.myshopify.com.attacker.com')).toBe(false)
    expect(isValidShopDomain('attacker.com/myshopify.com')).toBe(false)
    expect(isValidShopDomain('https://test-shop.myshopify.com')).toBe(false)
  })

  it('rejects empty/null/undefined', () => {
    expect(isValidShopDomain(null)).toBe(false)
    expect(isValidShopDomain(undefined)).toBe(false)
    expect(isValidShopDomain('')).toBe(false)
  })

  it('rejects non-myshopify.com hosts', () => {
    expect(isValidShopDomain('test-shop.shopify.com')).toBe(false)
    expect(isValidShopDomain('shop.evil.com')).toBe(false)
  })
})
