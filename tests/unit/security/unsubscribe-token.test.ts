import { describe, it, expect, beforeAll } from 'vitest'
import { signUnsubscribeToken, verifyUnsubscribeToken } from '@/lib/utils/unsubscribe-token'

describe('Unsubscribe token — signed one-click links', () => {
  beforeAll(() => {
    process.env.UNSUBSCRIBE_TOKEN_SECRET = 'test-unsubscribe-secret-value'
  })

  it('verifies a token it signed for the same email', () => {
    const email = 'user@example.com'
    const token = signUnsubscribeToken(email)
    expect(token).toBeTruthy()
    expect(verifyUnsubscribeToken(email, token)).toBe(true)
  })

  it('normalizes case/whitespace so the link still works', () => {
    const token = signUnsubscribeToken('user@example.com')
    expect(verifyUnsubscribeToken('  USER@example.com ', token)).toBe(true)
  })

  it('rejects a token bound to a different email (no arbitrary suppression)', () => {
    const token = signUnsubscribeToken('victim@example.com')
    expect(verifyUnsubscribeToken('attacker@example.com', token)).toBe(false)
  })

  it('rejects a tampered or missing token', () => {
    const email = 'user@example.com'
    const token = signUnsubscribeToken(email)
    expect(verifyUnsubscribeToken(email, token.slice(0, -1) + '0')).toBe(false)
    expect(verifyUnsubscribeToken(email, '')).toBe(false)
    expect(verifyUnsubscribeToken(email, null)).toBe(false)
    expect(verifyUnsubscribeToken(email, 'deadbeef')).toBe(false)
  })
})
