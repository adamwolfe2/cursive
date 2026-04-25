/**
 * Tests for marketplace webhook signature verifiers.
 *
 * These verifiers are SECURITY CRITICAL — every test failure here is a
 * potential webhook spoofing or replay vector. Cover happy path + every
 * known failure mode (missing header, wrong key, tampered body, replay).
 */

import { describe, it, expect } from 'vitest'
import { createHmac, generateKeyPairSync, sign as cryptoSign } from 'crypto'
import {
  verifyShopifyWebhookSignature,
  verifyShopifyOAuthHmac,
  verifyGhlWebhookSignature,
} from '@/lib/marketplace/signature-verify'

// ---------------------------------------------------------------------------
// Shopify webhook HMAC
// ---------------------------------------------------------------------------

describe('verifyShopifyWebhookSignature', () => {
  const secret = 'test-shopify-secret'
  const body = '{"order_id":12345,"total":"99.99"}'

  function computeShopifyHmac(b: string, s: string): string {
    return createHmac('sha256', s).update(b).digest('base64')
  }

  it('accepts a valid signature', () => {
    const sig = computeShopifyHmac(body, secret)
    expect(verifyShopifyWebhookSignature(body, sig, secret)).toBe(true)
  })

  it('accepts when body is provided as Buffer', () => {
    const sig = computeShopifyHmac(body, secret)
    expect(verifyShopifyWebhookSignature(Buffer.from(body), sig, secret)).toBe(true)
  })

  it('rejects when body has been tampered with', () => {
    const sig = computeShopifyHmac(body, secret)
    expect(verifyShopifyWebhookSignature('{"order_id":99999}', sig, secret)).toBe(false)
  })

  it('rejects when secret is wrong', () => {
    const sig = computeShopifyHmac(body, secret)
    expect(verifyShopifyWebhookSignature(body, sig, 'wrong-secret')).toBe(false)
  })

  it('rejects when header is missing', () => {
    expect(verifyShopifyWebhookSignature(body, null, secret)).toBe(false)
  })

  it('rejects when secret is empty', () => {
    const sig = computeShopifyHmac(body, secret)
    expect(verifyShopifyWebhookSignature(body, sig, '')).toBe(false)
  })

  it('rejects malformed base64 in header without throwing', () => {
    expect(verifyShopifyWebhookSignature(body, '!!!not base64!!!', secret)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Shopify OAuth HMAC (query-param signing)
// ---------------------------------------------------------------------------

describe('verifyShopifyOAuthHmac', () => {
  const secret = 'test-shopify-oauth-secret'

  function buildSignedParams(unsigned: Record<string, string>, s: string): URLSearchParams {
    // Build the canonical message Shopify HMACs (sorted, no `hmac` or `signature`)
    const params = Object.entries(unsigned).sort(([a], [b]) => (a < b ? -1 : 1))
    const message = params.map(([k, v]) => `${k}=${v}`).join('&')
    const hmac = createHmac('sha256', s).update(message).digest('hex')

    const result = new URLSearchParams(unsigned)
    result.set('hmac', hmac)
    return result
  }

  it('accepts a valid OAuth callback signature', () => {
    const params = buildSignedParams(
      {
        code: 'abc123',
        shop: 'test-shop.myshopify.com',
        state: 'csrf-nonce',
        timestamp: '1700000000',
      },
      secret,
    )
    expect(verifyShopifyOAuthHmac(params, secret)).toBe(true)
  })

  it('rejects when a param has been altered post-signing', () => {
    const params = buildSignedParams(
      { code: 'abc123', shop: 'test-shop.myshopify.com', state: 'x', timestamp: '1' },
      secret,
    )
    params.set('shop', 'attacker-shop.myshopify.com')
    expect(verifyShopifyOAuthHmac(params, secret)).toBe(false)
  })

  it('rejects when hmac is missing', () => {
    const params = new URLSearchParams({ code: 'abc', shop: 'test.myshopify.com' })
    expect(verifyShopifyOAuthHmac(params, secret)).toBe(false)
  })

  it('rejects when secret is wrong', () => {
    const params = buildSignedParams(
      { code: 'abc', shop: 'test.myshopify.com', state: 'x' },
      secret,
    )
    expect(verifyShopifyOAuthHmac(params, 'wrong')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// GHL Ed25519 webhook signature
// ---------------------------------------------------------------------------

describe('verifyGhlWebhookSignature', () => {
  // Generate a real Ed25519 keypair for testing
  const { privateKey, publicKey } = generateKeyPairSync('ed25519')
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }) as string

  const body = '{"type":"INSTALL","locationId":"abc","companyId":"xyz"}'

  function signEd25519(b: string): string {
    return cryptoSign(null, Buffer.from(b, 'utf-8'), privateKey).toString('base64')
  }

  it('accepts a valid signature', () => {
    const sig = signEd25519(body)
    expect(verifyGhlWebhookSignature(body, sig, publicKeyPem)).toBe(true)
  })

  it('rejects when body is tampered', () => {
    const sig = signEd25519(body)
    expect(verifyGhlWebhookSignature('{"type":"UNINSTALL"}', sig, publicKeyPem)).toBe(false)
  })

  it('rejects with a different keypair', () => {
    const { publicKey: other } = generateKeyPairSync('ed25519')
    const otherPem = other.export({ type: 'spki', format: 'pem' }) as string
    const sig = signEd25519(body)
    expect(verifyGhlWebhookSignature(body, sig, otherPem)).toBe(false)
  })

  it('rejects when signature header is missing', () => {
    expect(verifyGhlWebhookSignature(body, null, publicKeyPem)).toBe(false)
  })

  it('rejects when public key is empty', () => {
    const sig = signEd25519(body)
    expect(verifyGhlWebhookSignature(body, sig, '')).toBe(false)
  })

  it('rejects malformed PEM without throwing', () => {
    const sig = signEd25519(body)
    expect(verifyGhlWebhookSignature(body, sig, '-----BEGIN GARBAGE-----')).toBe(false)
  })

  it('rejects malformed signature without throwing', () => {
    expect(verifyGhlWebhookSignature(body, '!!!not-base64!!!', publicKeyPem)).toBe(false)
  })
})
