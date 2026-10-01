import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'

const timingSafeEqual = vi.hoisted(() => vi.fn())
vi.mock('node:crypto', async () => {
  // importOriginal yields an empty namespace for builtins under this runner; load the real module via require.
  const { createRequire } = await import('node:module')
  const real = createRequire(import.meta.url)('crypto') as typeof import('node:crypto')
  timingSafeEqual.mockImplementation(real.timingSafeEqual)
  const mocked = { ...real, timingSafeEqual }
  return { ...mocked, default: mocked }
})

import { claimTokenMatches, mayAccessClaim, newClaimToken } from '../rules'

describe('claim link token', () => {
  it('stores only the sha256 of a 32-byte random token', () => {
    const { token, hash } = newClaimToken()
    expect(Buffer.from(token, 'base64url')).toHaveLength(32)
    expect(hash).toBe(createHash('sha256').update(token).digest('hex'))
    expect(hash).not.toContain(token)
    expect(newClaimToken().token).not.toBe(token)
  })

  it('accepts the right token with a constant-time compare', () => {
    const { token, hash } = newClaimToken()
    timingSafeEqual.mockClear()
    expect(claimTokenMatches(token, hash)).toBe(true)
    expect(timingSafeEqual).toHaveBeenCalledTimes(1)
  })

  it('rejects wrong, missing, empty and malformed tokens', () => {
    const { hash } = newClaimToken()
    expect(claimTokenMatches(newClaimToken().token, hash)).toBe(false)
    expect(claimTokenMatches(null, hash)).toBe(false)
    expect(claimTokenMatches(undefined, hash)).toBe(false)
    expect(claimTokenMatches('', hash)).toBe(false)
    expect(claimTokenMatches('x', null)).toBe(false)
    expect(claimTokenMatches('x', 'not-hex')).toBe(false)
  })

  it('a rotated token invalidates the previous link', () => {
    const first = newClaimToken()
    const second = newClaimToken()
    expect(claimTokenMatches(first.token, second.hash)).toBe(false)
  })
})

describe('mayAccessClaim (invariant 1)', () => {
  const { token, hash } = newClaimToken()
  const claim = (status: 'pending' | 'fulfilled', auth_user_id: string | null = null) => ({
    status,
    auth_user_id,
    claim_token_hash: hash,
  })

  it('a session alone cannot fulfill a pending claim', () => {
    expect(mayAccessClaim(claim('pending'), null, 'attacker')).toBe(false)
    expect(mayAccessClaim(claim('pending'), 'guess', 'attacker')).toBe(false)
    expect(mayAccessClaim(claim('pending', 'attacker'), null, 'attacker')).toBe(false)
  })

  it('the emailed token unlocks the claim', () => {
    expect(mayAccessClaim(claim('pending'), token, 'u1')).toBe(true)
  })

  it('only the user who fulfilled can re-read without the token', () => {
    expect(mayAccessClaim(claim('fulfilled', 'u1'), null, 'u1')).toBe(true)
    expect(mayAccessClaim(claim('fulfilled', 'u1'), null, 'u2')).toBe(false)
  })
})
