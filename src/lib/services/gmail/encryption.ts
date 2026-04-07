/**
 * Token Encryption — AES-256-GCM at rest for OAuth refresh tokens.
 *
 * Format: base64(IV(12) || ciphertext || authTag(16))
 *
 * Used by:
 *   - src/lib/services/gmail/email-account.service.ts (connect / refresh)
 *
 * Key source: process.env.OAUTH_TOKEN_ENCRYPTION_KEY (32 bytes, base64).
 * Generate a new key with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // GCM standard
const TAG_LENGTH = 16

let cachedKey: Buffer | null = null

function getKey(): Buffer {
  if (cachedKey) return cachedKey
  const raw = process.env.OAUTH_TOKEN_ENCRYPTION_KEY
  if (!raw) {
    throw new Error('OAUTH_TOKEN_ENCRYPTION_KEY environment variable is not set')
  }
  const buf = Buffer.from(raw, 'base64')
  if (buf.length !== 32) {
    throw new Error(
      `OAUTH_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes (got ${buf.length}). Run: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
    )
  }
  cachedKey = buf
  return buf
}

/**
 * Encrypt a UTF-8 plaintext string. Returns a base64 blob containing
 * IV + ciphertext + auth tag concatenated.
 */
export function encryptToken(plaintext: string): string {
  if (!plaintext) throw new Error('encryptToken: plaintext is empty')
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, ciphertext, tag]).toString('base64')
}

/**
 * Decrypt a base64 blob produced by encryptToken().
 */
export function decryptToken(blob: string): string {
  if (!blob) throw new Error('decryptToken: blob is empty')
  const key = getKey()
  const buf = Buffer.from(blob, 'base64')
  if (buf.length < IV_LENGTH + TAG_LENGTH + 1) {
    throw new Error('decryptToken: blob is too short to be valid')
  }
  const iv = buf.subarray(0, IV_LENGTH)
  const tag = buf.subarray(buf.length - TAG_LENGTH)
  const ciphertext = buf.subarray(IV_LENGTH, buf.length - TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plaintext.toString('utf8')
}
