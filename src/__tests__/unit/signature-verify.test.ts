/**
 * Unit tests for marketplace webhook signature verifiers.
 * Real keypairs/secrets are generated with node:crypto and used to produce
 * genuinely valid signatures — no reimplemented "reference" crypto here.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { generateKeyPairSync, sign as cryptoSign, createHmac } from 'crypto'
import {
  verifyGhlWebhookSignature,
  verifyShopifyWebhookSignature,
  verifyShopifyOAuthHmac,
} from '@/lib/marketplace/signature-verify'

describe('verifyGhlWebhookSignature', () => {
  let publicKeyPem: string
  let privateKeyPem: string
  let otherPublicKeyPem: string

  beforeAll(() => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519')
    publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }) as string
    privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string

    const other = generateKeyPairSync('ed25519')
    otherPublicKeyPem = other.publicKey.export({ type: 'spki', format: 'pem' }) as string
  })

  function signBody(body: string, pem: string = privateKeyPem): string {
    const sig = cryptoSign(null, Buffer.from(body, 'utf-8'), pem)
    return sig.toString('base64')
  }

  it('accepts a genuinely valid Ed25519 signature', () => {
    const body = JSON.stringify({ event: 'contact.created', id: 'abc123' })
    const signature = signBody(body)
    expect(verifyGhlWebhookSignature(body, signature, publicKeyPem)).toBe(true)
  })

  it('accepts a Buffer body identically to the equivalent string', () => {
    const body = 'raw-body-payload'
    const signature = signBody(body)
    expect(verifyGhlWebhookSignature(Buffer.from(body, 'utf-8'), signature, publicKeyPem)).toBe(
      true,
    )
  })

  it('rejects a tampered body', () => {
    const body = JSON.stringify({ event: 'contact.created', id: 'abc123' })
    const signature = signBody(body)
    const tampered = JSON.stringify({ event: 'contact.created', id: 'abc124' })
    expect(verifyGhlWebhookSignature(tampered, signature, publicKeyPem)).toBe(false)
  })

  it('rejects a signature produced with the wrong private key', () => {
    const body = 'some webhook payload'
    const signature = signBody(body, privateKeyPem)
    // Verify against a DIFFERENT public key than the one that signed it
    expect(verifyGhlWebhookSignature(body, signature, otherPublicKeyPem)).toBe(false)
  })

  it('fails closed on malformed base64 signature', () => {
    const body = 'payload'
    expect(verifyGhlWebhookSignature(body, 'not-valid-base64!!!', publicKeyPem)).toBe(false)
  })

  it('fails closed on malformed PEM public key', () => {
    const body = 'payload'
    const signature = signBody(body)
    expect(verifyGhlWebhookSignature(body, signature, 'not a real pem key')).toBe(false)
  })

  it('rejects when signature header is missing', () => {
    expect(verifyGhlWebhookSignature('payload', null, publicKeyPem)).toBe(false)
    expect(verifyGhlWebhookSignature('payload', '', publicKeyPem)).toBe(false)
  })

  it('rejects when public key is empty', () => {
    const body = 'payload'
    const signature = signBody(body)
    expect(verifyGhlWebhookSignature(body, signature, '')).toBe(false)
  })

  it('does not throw on any malformed input', () => {
    expect(() => verifyGhlWebhookSignature('x', 'garbage', 'garbage')).not.toThrow()
  })
})

describe('verifyShopifyWebhookSignature', () => {
  const apiSecret = 'shpss_test_secret_1234567890'

  function hmacFor(body: string, secret: string = apiSecret): string {
    return createHmac('sha256', secret).update(Buffer.from(body, 'utf-8')).digest('base64')
  }

  it('accepts a genuinely valid HMAC signature', () => {
    const body = JSON.stringify({ order_id: 1001 })
    const hmac = hmacFor(body)
    expect(verifyShopifyWebhookSignature(body, hmac, apiSecret)).toBe(true)
  })

  it('accepts a Buffer body identically to the equivalent string', () => {
    const body = 'raw-shopify-body'
    const hmac = hmacFor(body)
    expect(verifyShopifyWebhookSignature(Buffer.from(body, 'utf-8'), hmac, apiSecret)).toBe(true)
  })

  it('rejects a tampered body', () => {
    const body = JSON.stringify({ order_id: 1001 })
    const hmac = hmacFor(body)
    const tampered = JSON.stringify({ order_id: 1002 })
    expect(verifyShopifyWebhookSignature(tampered, hmac, apiSecret)).toBe(false)
  })

  it('rejects when computed with the wrong secret', () => {
    const body = 'payload'
    const hmac = hmacFor(body, 'a-completely-different-secret')
    expect(verifyShopifyWebhookSignature(body, hmac, apiSecret)).toBe(false)
  })

  it('fails closed on malformed base64 hmac header', () => {
    expect(verifyShopifyWebhookSignature('payload', '!!!not-base64!!!', apiSecret)).toBe(false)
  })

  it('rejects when hmac header is missing', () => {
    expect(verifyShopifyWebhookSignature('payload', null, apiSecret)).toBe(false)
    expect(verifyShopifyWebhookSignature('payload', '', apiSecret)).toBe(false)
  })

  it('rejects when api secret is empty', () => {
    const body = 'payload'
    const hmac = hmacFor(body)
    expect(verifyShopifyWebhookSignature(body, hmac, '')).toBe(false)
  })

  it('does not throw on any malformed input', () => {
    expect(() => verifyShopifyWebhookSignature('x', 'garbage', 'y')).not.toThrow()
  })
})

describe('verifyShopifyOAuthHmac', () => {
  const apiSecret = 'shpss_oauth_test_secret'

  function buildSignedParams(
    params: Record<string, string>,
    secret: string = apiSecret,
  ): URLSearchParams {
    const entries = Object.entries(params).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    const message = entries.map(([k, v]) => `${k}=${v}`).join('&')
    const hmac = createHmac('sha256', secret).update(message).digest('hex')
    const qp = new URLSearchParams(params)
    qp.set('hmac', hmac)
    return qp
  }

  it('accepts a genuinely valid OAuth callback HMAC', () => {
    const params = buildSignedParams({
      code: 'abc123',
      shop: 'my-shop.myshopify.com',
      state: 'nonce-1',
      timestamp: '1700000000',
    })
    expect(verifyShopifyOAuthHmac(params, apiSecret)).toBe(true)
  })

  it('rejects when a signed param is tampered with after signing', () => {
    const params = buildSignedParams({
      code: 'abc123',
      shop: 'my-shop.myshopify.com',
    })
    params.set('shop', 'attacker-shop.myshopify.com')
    expect(verifyShopifyOAuthHmac(params, apiSecret)).toBe(false)
  })

  it('rejects when computed with the wrong secret', () => {
    const params = buildSignedParams(
      { code: 'abc123', shop: 'my-shop.myshopify.com' },
      'wrong-secret',
    )
    expect(verifyShopifyOAuthHmac(params, apiSecret)).toBe(false)
  })

  it('ignores the legacy signature param and hmac param when building the message', () => {
    const params = buildSignedParams({ code: 'abc123', shop: 'my-shop.myshopify.com' })
    params.set('signature', 'should-be-excluded-from-message')
    // hmac was computed without 'signature', so it should still verify
    expect(verifyShopifyOAuthHmac(params, apiSecret)).toBe(true)
  })

  it('fails closed on malformed (non-hex) hmac param', () => {
    const params = new URLSearchParams({ code: 'abc123', hmac: 'not-hex-zzz!!' })
    expect(verifyShopifyOAuthHmac(params, apiSecret)).toBe(false)
  })

  it('rejects when hmac param is missing', () => {
    const params = new URLSearchParams({ code: 'abc123' })
    expect(verifyShopifyOAuthHmac(params, apiSecret)).toBe(false)
  })

  it('rejects when api secret is empty', () => {
    const params = buildSignedParams({ code: 'abc123' })
    expect(verifyShopifyOAuthHmac(params, '')).toBe(false)
  })

  it('does not throw on any malformed input', () => {
    const params = new URLSearchParams({ hmac: 'garbage' })
    expect(() => verifyShopifyOAuthHmac(params, 'secret')).not.toThrow()
  })
})
