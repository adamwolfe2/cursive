/**
 * Reseller API — Auto-Generated Docs Spec (single source of truth)
 *
 * Rendered as HTML at /reseller/docs and served as JSON at
 * /api/reseller/v1/openapi. Keeping one constant means the docs cannot drift
 * from the endpoint list.
 */

export interface DocEndpoint {
  method: string
  path: string
  summary: string
  auth: string
  request?: Record<string, unknown>
  response?: Record<string, unknown>
}

export const RESELLER_API_VERSION = 'v1'
export const RESELLER_API_BASE = '/api/reseller/v1'
/** Absolute production base URL — this is what partners call. */
export const RESELLER_API_ABSOLUTE_BASE = 'https://leads.meetcursive.com/api/reseller/v1'
export const RESELLER_DOCS_URL = 'https://leads.meetcursive.com/reseller/docs'

/**
 * Rate limits partners should design around. Enforced server-side; exceeding a
 * limit returns HTTP 429 with `Retry-After` + `X-RateLimit-*` headers. Back off
 * and retry after the window.
 */
export const RESELLER_RATE_LIMITS = [
  {
    scope: 'POST /pixels (pixel creation)',
    limit: '30 requests / minute per API key',
    on_exceed: '429 Too Many Requests + Retry-After header',
    why: 'Each create provisions a real tracking pixel upstream — protects that pipeline from runaway loops.',
  },
  {
    scope: 'Other v1 endpoints',
    limit: 'Coarse IP throttling applies platform-wide; typical integration traffic is never affected.',
    on_exceed: '429 Too Many Requests',
    why: 'Abuse protection only.',
  },
]

export const RESELLER_ENDPOINTS: DocEndpoint[] = [
  {
    method: 'POST',
    path: '/api/reseller/v1/pixels',
    summary:
      'Create a pixel for one of your end-customers. Idempotent on external_customer_ref — calling again with the same ref returns the existing pixel.',
    auth: 'Bearer <api_key> (scope: pixels:write)',
    request: {
      website_url: 'https://customer-site.com',
      website_name: 'Customer Site (optional)',
      external_customer_ref: 'your-user-id-123',
      destination_url: 'https://your-app.com/hooks/cursive (optional; can set later)',
      signing_secret: 'optional; auto-generated if omitted',
      lead_cap_per_period: 'optional integer; null = inherit reseller default',
      throttle_mode: 'optional boolean; null = inherit reseller default',
    },
    response: {
      pixel_id: 'idp-xxxxxxxx',
      install_url: 'https://cdn.idpixel.app/v1/idp-analytics-<uuid>.min.js',
      embed_snippet: '<script src="https://cdn.idpixel.app/..." defer></script>',
      external_customer_ref: 'your-user-id-123',
      signing_secret: 'whsec_... (store this to verify webhook signatures)',
      existing: false,
    },
  },
  {
    method: 'GET',
    path: '/api/reseller/v1/pixels',
    summary: 'List all pixels you have created, with per-pixel usage counters.',
    auth: 'Bearer <api_key> (scope: pixels:read)',
    response: { pixels: ['{ pixel_id, external_customer_ref, domain, status, leads_delivered_period, leads_delivered_lifetime }'] },
  },
  {
    method: 'GET',
    path: '/api/reseller/v1/pixels/{pixel_id}',
    summary: 'Get one pixel and its usage.',
    auth: 'Bearer <api_key> (scope: pixels:read)',
  },
  {
    method: 'POST',
    path: '/api/reseller/v1/pixels/{pixel_id}/deactivate',
    summary:
      'Deactivate a pixel. Immediately stops outbound lead delivery. NOTE: the tracking snippet keeps identifying visitors until it is removed from the site — remove the embed snippet to stop data capture entirely.',
    auth: 'Bearer <api_key> (scope: pixels:write)',
  },
  {
    method: 'PUT',
    path: '/api/reseller/v1/pixels/{pixel_id}/delivery',
    summary: 'Set or update the lead-delivery destination, signing secret, cap, and throttle for a pixel.',
    auth: 'Bearer <api_key> (scope: pixels:write)',
    request: {
      destination_url: 'https://your-app.com/hooks/cursive',
      signing_secret: 'optional; rotate the HMAC secret',
      lead_cap_per_period: 'optional integer or null',
      throttle_mode: 'optional boolean or null',
    },
  },
  {
    method: 'GET',
    path: '/api/reseller/v1/usage',
    summary: 'Reseller-level usage totals plus a per-pixel breakdown for the current period.',
    auth: 'Bearer <api_key> (scope: pixels:read)',
  },
]

/** The payload we POST to your destination_url for each identified lead. */
export const OUTBOUND_WEBHOOK_SCHEMA = {
  headers: {
    'X-Cursive-Event': 'lead.identified',
    'X-Cursive-Signature': 't=<unix_seconds>,v1=<hmac_sha256_hex>',
    'X-Cursive-Timestamp': '<unix_seconds>',
  },
  signature_note:
    'v1 = HMAC-SHA256(signing_secret, `${t}.${raw_request_body}`), hex-encoded. Recompute and compare in constant time to verify authenticity. Always take `t` from X-Cursive-Signature (it is covered by the HMAC); the standalone X-Cursive-Timestamp header is informational only and is NOT signed.',
  body: {
    event: 'lead.identified',
    pixel_id: 'idp-xxxxxxxx',
    external_customer_ref: 'your-user-id-123',
    identified_at: '2026-07-01T12:00:00.000Z',
    throttled: false,
    lead: {
      email: 'jane@acme.com',
      first_name: 'Jane',
      last_name: 'Doe',
      full_name: 'Jane Doe',
      company: { name: 'Acme Inc', domain: 'acme.com', title: 'VP Marketing' },
      location: { city: 'Austin', state: 'TX' },
      phone: '+15125550142',
    },
  },
  throttled_note:
    'When throttled=true (reseller/pixel throttle mode), the reduced payload omits phone, company.title, and location.',
  delivery_note:
    'Delivered via HTTP POST with up to 5 attempts and exponential backoff. Respond 2xx to acknowledge. 4xx (except 408/429) are treated as permanent and NOT retried; 5xx, 408, 429, and network timeouts are retried. A delivery attempt counts toward your cap and is not refunded on failure.',
}

/**
 * Copy-paste signature verification. The signed string is `${t}.${raw_body}` —
 * you MUST use the RAW request body bytes, before any JSON re-serialization, or
 * the HMAC will not match.
 */
export const SIGNATURE_VERIFICATION_SAMPLES = {
  node: `// Node.js (Express) — verify a Cursive reseller webhook
import crypto from 'node:crypto'

// IMPORTANT: capture the RAW body (Buffer), not a parsed object.
// app.use('/hooks/cursive', express.raw({ type: 'application/json' }))

function verifyCursiveSignature(req, signingSecret) {
  const header = req.get('X-Cursive-Signature') || ''      // "t=1719830400,v1=abc123..."
  // Split each pair on the FIRST '=' only, so values containing '=' survive.
  const parts = Object.fromEntries(
    header.split(',').map((kv) => {
      const i = kv.indexOf('=')
      return i === -1 ? [kv, ''] : [kv.slice(0, i), kv.slice(i + 1)]
    }),
  )
  const t = parts.t
  const received = parts.v1
  if (!t || !received) return false

  const rawBody = req.body.toString('utf8')                // raw bytes as string
  const expected = crypto
    .createHmac('sha256', signingSecret)
    .update(\`\${t}.\${rawBody}\`)
    .digest('hex')

  // Constant-time compare; reject if lengths differ.
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  if (!crypto.timingSafeEqual(a, b)) return false

  // Optional: reject stale timestamps (replay protection), e.g. > 5 min old.
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false
  return true
}

app.post('/hooks/cursive', (req, res) => {
  if (!verifyCursiveSignature(req, process.env.CURSIVE_SIGNING_SECRET)) {
    return res.status(401).send('bad signature')
  }
  const payload = JSON.parse(req.body.toString('utf8'))
  // ... route payload.lead into your product ...
  res.sendStatus(200)
})`,
  python: `# Python (Flask) — verify a Cursive reseller webhook
import hmac, hashlib, time
from flask import Flask, request, abort

app = Flask(__name__)
SIGNING_SECRET = "whsec_...".encode()

def verify_cursive_signature(raw_body: bytes, sig_header: str) -> bool:
    parts = dict(kv.split("=", 1) for kv in sig_header.split(",") if "=" in kv)
    t, received = parts.get("t"), parts.get("v1")
    if not t or not received:
        return False
    signed = f"{t}.".encode() + raw_body            # use RAW body bytes
    expected = hmac.new(SIGNING_SECRET, signed, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(received, expected): # constant-time compare
        return False
    if abs(time.time() - int(t)) > 300:             # optional replay guard
        return False
    return True

@app.post("/hooks/cursive")
def hook():
    raw = request.get_data()                        # raw bytes, unparsed
    if not verify_cursive_signature(raw, request.headers.get("X-Cursive-Signature", "")):
        abort(401)
    payload = request.get_json()
    # ... route payload["lead"] into your product ...
    return "", 200`,
}

export const RESELLER_QUICKSTART = [
  '1. Get your API key from Cursive (rk_live_...). Send it as `Authorization: Bearer <key>`.',
  '2. Create a pixel for a customer: POST /api/reseller/v1/pixels with { website_url, external_customer_ref, destination_url }.',
  '3. Install the returned embed_snippet on that customer\'s website (before </head>).',
  '4. Stand up an HTTPS endpoint at destination_url that accepts POST application/json.',
  '5. Verify each request: recompute HMAC-SHA256(signing_secret, `${t}.${body}`) and compare to the X-Cursive-Signature v1 value.',
  '6. Route lead.identified payloads into your own product (your user tables, CRM, etc.).',
]
