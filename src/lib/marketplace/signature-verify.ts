// Marketplace webhook signature verifiers
//
// GHL: Ed25519 with X-GHL-Signature header. GHL publishes a public key
// at https://services.leadconnectorhq.com/oauth/openid/jwks (or in their
// developer portal under app settings). We verify the raw request body
// against the signature using the public key.
//
// Shopify: HMAC-SHA256 with X-Shopify-Hmac-Sha256 header. Symmetric key
// is the Shopify app's API secret. We compute HMAC over raw body and
// compare timing-safe.
//
// All verification operates on the RAW request body — never on parsed
// JSON, since serializer differences invalidate signatures.

import { createHmac, timingSafeEqual, verify as cryptoVerify, createPublicKey } from 'crypto'

// ---------------------------------------------------------------------------
// GHL — Ed25519
// ---------------------------------------------------------------------------

/**
 * Verify a GHL marketplace webhook signature.
 *
 * GHL publishes their Ed25519 public key in the developer portal. Pass it
 * here as a PEM-formatted string (env: GHL_WEBHOOK_PUBLIC_KEY).
 *
 * @param rawBody The raw request body as a Buffer or string
 * @param signatureHeader Value of the X-GHL-Signature header (base64-encoded)
 * @param publicKeyPem Ed25519 public key in PEM format
 */
export function verifyGhlWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null,
  publicKeyPem: string,
): boolean {
  if (!signatureHeader) return false
  if (!publicKeyPem) return false

  try {
    const bodyBuf = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf-8') : rawBody
    const sigBuf = Buffer.from(signatureHeader, 'base64')

    const publicKey = createPublicKey({
      key: publicKeyPem,
      format: 'pem',
    })

    // Ed25519 verification — algorithm parameter must be null per Node crypto docs
    return cryptoVerify(null, bodyBuf, publicKey, sigBuf)
  } catch {
    // Any malformed signature/key fails closed. Don't leak why.
    return false
  }
}

// ---------------------------------------------------------------------------
// Shopify — HMAC-SHA256
// ---------------------------------------------------------------------------

/**
 * Verify a Shopify webhook HMAC signature.
 *
 * Shopify HMACs the raw body with the app's API secret and sends the
 * base64-encoded result in the X-Shopify-Hmac-Sha256 header.
 *
 * @param rawBody The raw request body as a Buffer or string
 * @param hmacHeader Value of the X-Shopify-Hmac-Sha256 header (base64-encoded)
 * @param apiSecret Shopify app's API secret (env: SHOPIFY_API_SECRET)
 */
export function verifyShopifyWebhookSignature(
  rawBody: string | Buffer,
  hmacHeader: string | null,
  apiSecret: string,
): boolean {
  if (!hmacHeader) return false
  if (!apiSecret) return false

  try {
    const bodyBuf = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf-8') : rawBody
    const computed = createHmac('sha256', apiSecret).update(bodyBuf).digest()
    const provided = Buffer.from(hmacHeader, 'base64')

    if (computed.length !== provided.length) return false
    return timingSafeEqual(computed, provided)
  } catch {
    return false
  }
}

/**
 * Verify a Shopify OAuth callback HMAC. Shopify signs OAuth callback
 * query params (excluding `hmac` itself) with the API secret.
 *
 * @param queryParams URLSearchParams from the OAuth callback URL
 * @param apiSecret Shopify app's API secret
 */
export function verifyShopifyOAuthHmac(
  queryParams: URLSearchParams,
  apiSecret: string,
): boolean {
  const providedHmac = queryParams.get('hmac')
  if (!providedHmac) return false
  if (!apiSecret) return false

  // Build the message: all params sorted alphabetically, joined as key=value&key=value
  // EXCLUDING the hmac param itself (and the legacy 'signature' param if present)
  const params: [string, string][] = []
  queryParams.forEach((value, key) => {
    if (key !== 'hmac' && key !== 'signature') {
      params.push([key, value])
    }
  })
  params.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  const message = params.map(([k, v]) => `${k}=${v}`).join('&')

  try {
    const computed = createHmac('sha256', apiSecret).update(message).digest('hex')
    const provided = Buffer.from(providedHmac, 'hex')
    const computedBuf = Buffer.from(computed, 'hex')

    if (computedBuf.length !== provided.length) return false
    return timingSafeEqual(computedBuf, provided)
  } catch {
    return false
  }
}
