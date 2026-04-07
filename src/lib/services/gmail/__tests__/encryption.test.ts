/**
 * Token encryption — round-trip + tamper-detection tests
 *
 * Verifies the AES-256-GCM helpers used to store OAuth refresh tokens
 * at rest in email_accounts.oauth_refresh_token_ct.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { randomBytes } from 'crypto'

// Provide a deterministic key for the test so we don't depend on env state
beforeAll(() => {
  process.env.OAUTH_TOKEN_ENCRYPTION_KEY = randomBytes(32).toString('base64')
})

import { encryptToken, decryptToken } from '@/lib/services/gmail/encryption'

describe('token encryption', () => {
  it('round-trips an ASCII string', () => {
    const plaintext = '1//04xyzREFRESH-TOKEN-FROM-GOOGLE-abc123'
    const ct = encryptToken(plaintext)
    expect(ct).not.toContain(plaintext)
    expect(decryptToken(ct)).toBe(plaintext)
  })

  it('round-trips a UTF-8 string with multibyte characters', () => {
    const plaintext = 'tóken-with-üñîçödé-✓'
    const ct = encryptToken(plaintext)
    expect(decryptToken(ct)).toBe(plaintext)
  })

  it('produces a different ciphertext for the same plaintext (random IV)', () => {
    const plaintext = 'same-secret'
    const a = encryptToken(plaintext)
    const b = encryptToken(plaintext)
    expect(a).not.toBe(b)
    expect(decryptToken(a)).toBe(plaintext)
    expect(decryptToken(b)).toBe(plaintext)
  })

  it('rejects tampered ciphertext (auth tag mismatch)', () => {
    const ct = encryptToken('important-token')
    // Flip one byte in the middle (likely inside the ciphertext payload)
    const buf = Buffer.from(ct, 'base64')
    buf[14] = buf[14] ^ 0xff
    const tampered = buf.toString('base64')
    expect(() => decryptToken(tampered)).toThrow()
  })

  it('rejects truncated ciphertext', () => {
    const ct = encryptToken('important-token')
    const buf = Buffer.from(ct, 'base64')
    const truncated = buf.subarray(0, buf.length - 8).toString('base64')
    expect(() => decryptToken(truncated)).toThrow()
  })

  it('throws on empty input', () => {
    expect(() => encryptToken('')).toThrow()
    expect(() => decryptToken('')).toThrow()
  })
})
