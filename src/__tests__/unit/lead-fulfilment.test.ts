import { describe, it, expect, vi, beforeEach } from 'vitest'

const recordLeadPurchase = vi.fn()

vi.mock('@/lib/db/repositories/partner.repository', () => ({
  PartnerRepository: class {
    recordLeadPurchase = recordLeadPurchase
  },
}))

vi.mock('@/lib/utils/log-sanitizer', () => ({
  safeError: vi.fn(),
  safeLog: vi.fn(),
}))

import {
  computeLeadPurchaseSplit,
  fulfilLeadPurchase,
  PARTNER_COMMISSION_RATE,
} from '@/lib/marketplace/lead-fulfilment'

const LEAD_ID = '11111111-1111-4111-8111-111111111111'
const BUYER_ID = '22222222-2222-4222-8222-222222222222'
const WORKSPACE_ID = '33333333-3333-4333-8333-333333333333'
const PARTNER_ID = '44444444-4444-4444-8444-444444444444'

type Stubs = {
  existingPurchase?: { id: string } | null
  existingPurchaseError?: unknown
  claimedLeads?: { id: string }[] | null
  updateError?: unknown
}

/** Minimal stand-in for the two chains fulfilLeadPurchase actually calls. */
function stubClient(stubs: Stubs = {}) {
  const updates: unknown[] = []

  const client = {
    from(table: string) {
      if (table === 'lead_purchases') {
        const chain = {
          select: () => chain,
          eq: () => chain,
          maybeSingle: async () => ({
            data: stubs.existingPurchase ?? null,
            error: stubs.existingPurchaseError ?? null,
          }),
        }
        return chain
      }

      if (table === 'leads') {
        const chain = {
          update: (patch: unknown) => {
            updates.push(patch)
            return chain
          },
          eq: () => chain,
          is: () => chain,
          select: async () => ({
            data: stubs.claimedLeads === undefined ? [{ id: LEAD_ID }] : stubs.claimedLeads,
            error: stubs.updateError ?? null,
          }),
        }
        return chain
      }

      throw new Error(`unexpected table ${table}`)
    },
  }

  return { client: client as never, updates }
}

const input = (over: Record<string, unknown> = {}) => ({
  paymentIntentId: 'pi_test_123',
  leadId: LEAD_ID,
  buyerUserId: BUYER_ID,
  buyerWorkspaceId: WORKSPACE_ID,
  partnerId: PARTNER_ID,
  amountInCents: 5000,
  ...over,
})

beforeEach(() => {
  recordLeadPurchase.mockReset()
  recordLeadPurchase.mockResolvedValue({ id: 'purchase-1' })
})

describe('computeLeadPurchaseSplit', () => {
  it('pays the partner 70% and keeps the rest', () => {
    expect(computeLeadPurchaseSplit(5000, true)).toEqual({
      purchasePrice: 50,
      partnerCommission: 35,
      platformFee: 15,
    })
  })

  it('keeps everything when the lead has no partner', () => {
    expect(computeLeadPurchaseSplit(5000, false)).toEqual({
      purchasePrice: 50,
      partnerCommission: 0,
      platformFee: 50,
    })
  })

  it('never lets the two shares drift from the amount charged', () => {
    for (const cents of [1, 5, 7, 99, 333, 1234, 99_999]) {
      const split = computeLeadPurchaseSplit(cents, true)
      expect(split.partnerCommission + split.platformFee).toBeCloseTo(
        split.purchasePrice,
        10
      )
    }
  })

  it('states the rate it is applying', () => {
    expect(PARTNER_COMMISSION_RATE).toBe(0.7)
  })
})

describe('fulfilLeadPurchase', () => {
  it('records the purchase and hands the lead to the buyer', async () => {
    const { client, updates } = stubClient()

    const result = await fulfilLeadPurchase({ ...input(), supabase: client })

    expect(result).toEqual({ status: 'fulfilled', purchaseId: 'purchase-1' })
    expect(recordLeadPurchase).toHaveBeenCalledOnce()
    expect(recordLeadPurchase.mock.calls[0][0]).toMatchObject({
      lead_id: LEAD_ID,
      buyer_user_id: BUYER_ID,
      partner_id: PARTNER_ID,
      purchase_price: 50,
      partner_commission: 35,
      platform_fee: 15,
      stripe_payment_intent_id: 'pi_test_123',
    })
    expect(updates[0]).toMatchObject({
      workspace_id: WORKSPACE_ID,
      assigned_user_id: BUYER_ID,
      status: 'new',
    })
  })

  // The whole point of the webhook fallback: the browser call and the webhook
  // both run for the same payment, and Stripe redelivers on top of that.
  it('does not charge the partner twice when the purchase already exists', async () => {
    const { client } = stubClient({ existingPurchase: { id: 'purchase-1' } })

    const result = await fulfilLeadPurchase({ ...input(), supabase: client })

    expect(result).toEqual({ status: 'already_recorded' })
    expect(recordLeadPurchase).not.toHaveBeenCalled()
  })

  // supabase-js resolves with {data: null, error} rather than rejecting, so an
  // unchecked error reads as "no purchase yet" and records a second one.
  it('refuses to proceed when the idempotency lookup itself failed', async () => {
    const { client } = stubClient({ existingPurchaseError: { message: 'boom' } })

    await expect(fulfilLeadPurchase({ ...input(), supabase: client })).rejects.toThrow(
      /existing lead purchase/i
    )
    expect(recordLeadPurchase).not.toHaveBeenCalled()
  })

  // A zero-row UPDATE is not an error in PostgREST, so the sold_at guard only
  // means something if the returned rows are counted.
  it('reports a double sell when another buyer claimed the lead first', async () => {
    const { client } = stubClient({ claimedLeads: [] })

    const result = await fulfilLeadPurchase({ ...input(), supabase: client })

    expect(result).toEqual({ status: 'double_sell', purchaseId: 'purchase-1' })
  })

  it('throws when the lead update genuinely errors', async () => {
    const { client } = stubClient({ updateError: { message: 'rls' } })

    await expect(fulfilLeadPurchase({ ...input(), supabase: client })).rejects.toThrow(
      /assign purchased lead/i
    )
  })

  it("treats Stripe's 'none' partner sentinel as no partner", async () => {
    const { client } = stubClient()

    await fulfilLeadPurchase({ ...input({ partnerId: 'none' }), supabase: client })

    expect(recordLeadPurchase.mock.calls[0][0]).toMatchObject({
      partner_id: null,
      partner_commission: 0,
      platform_fee: 50,
    })
  })

  it('passes the caller-supplied client through to the repository', async () => {
    const { client } = stubClient()

    await fulfilLeadPurchase({ ...input(), supabase: client })

    expect(recordLeadPurchase.mock.calls[0][1]).toBe(client)
  })
})
