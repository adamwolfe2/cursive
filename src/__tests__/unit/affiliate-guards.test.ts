/**
 * Affiliate invariant guards — unit tests.
 *
 * Covers the pure predicates that protect launch blockers:
 *   B2 self-referral rejection (isSelfReferral)
 *   B3 non-negative transfer clamp (clampTransferCents / isTransferable)
 */

import { describe, it, expect } from 'vitest'
import {
  isSelfReferral,
  clampTransferCents,
  isTransferable,
  type AffiliateIdentity,
} from '@/lib/affiliate/guards'

const AFFILIATE: AffiliateIdentity = {
  email: 'partner@example.com',
  userId: 'auth_partner_123',
  workspaceId: 'ws_partner_abc',
}

describe('isSelfReferral (B2)', () => {
  it('blocks exact email self-referral', () => {
    expect(isSelfReferral(AFFILIATE, { email: 'partner@example.com' })).toBe(true)
  })

  it('blocks email self-referral case/space-insensitively', () => {
    expect(isSelfReferral(AFFILIATE, { email: '  PARTNER@Example.com ' })).toBe(true)
  })

  it('blocks self-referral by auth user id', () => {
    expect(isSelfReferral(AFFILIATE, { userId: 'auth_partner_123' })).toBe(true)
  })

  it('blocks self-referral by owned workspace id', () => {
    expect(isSelfReferral(AFFILIATE, { workspaceId: 'ws_partner_abc' })).toBe(true)
  })

  it('blocks when any single dimension matches even if others differ', () => {
    expect(
      isSelfReferral(AFFILIATE, {
        email: 'someone-else@example.com',
        userId: 'auth_other',
        workspaceId: 'ws_partner_abc', // <- match
      })
    ).toBe(true)
  })

  it('allows a genuine third-party referral', () => {
    expect(
      isSelfReferral(AFFILIATE, {
        email: 'lead@other.com',
        userId: 'auth_lead_999',
        workspaceId: 'ws_lead_zzz',
      })
    ).toBe(false)
  })

  it('does NOT match on null/undefined/empty identity values (no false positives)', () => {
    expect(isSelfReferral(AFFILIATE, {})).toBe(false)
    expect(isSelfReferral(AFFILIATE, { email: null, userId: null, workspaceId: null })).toBe(false)
    expect(
      isSelfReferral({ email: null, userId: null, workspaceId: null }, { email: 'partner@example.com' })
    ).toBe(false)
    // Two empty emails must not be treated as equal
    expect(isSelfReferral({ email: '', userId: '', workspaceId: '' }, { email: '', userId: '', workspaceId: '' })).toBe(
      false
    )
  })

  it('does not collide user id with workspace id across fields', () => {
    // affiliate.userId equals referred.workspaceId — different dimensions, no match
    expect(isSelfReferral(AFFILIATE, { workspaceId: 'auth_partner_123' })).toBe(false)
  })
})

describe('clampTransferCents / isTransferable (B3)', () => {
  it('passes positive integer cents through', () => {
    expect(clampTransferCents(15000)).toBe(15000)
    expect(isTransferable(15000)).toBe(true)
  })

  it('clamps zero and negative nets to 0 (never a ≤0 transfer)', () => {
    expect(clampTransferCents(0)).toBe(0)
    expect(clampTransferCents(-2500)).toBe(0)
    expect(isTransferable(0)).toBe(false)
    expect(isTransferable(-1)).toBe(false)
  })

  it('floors fractional cents', () => {
    expect(clampTransferCents(150.9)).toBe(150)
  })

  it('treats NaN/Infinity as non-transferable', () => {
    expect(clampTransferCents(NaN)).toBe(0)
    expect(clampTransferCents(Infinity)).toBe(0)
    expect(isTransferable(NaN)).toBe(false)
  })
})
