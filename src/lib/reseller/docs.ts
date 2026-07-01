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
    summary: 'Deactivate a pixel. Stops inbound identification AND outbound lead delivery.',
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
    'v1 = HMAC-SHA256(signing_secret, `${t}.${raw_request_body}`), hex-encoded. Recompute and compare in constant time to verify authenticity.',
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
    'Delivered via HTTP POST with up to 5 attempts and exponential backoff (0s, 2s, 6s, 15s, 30s). Respond 2xx to acknowledge. Non-2xx 4xx (except 408/429) are treated as permanent and not retried.',
}

export const RESELLER_QUICKSTART = [
  '1. Get your API key from Cursive (rk_live_...). Send it as `Authorization: Bearer <key>`.',
  '2. Create a pixel for a customer: POST /api/reseller/v1/pixels with { website_url, external_customer_ref, destination_url }.',
  '3. Install the returned embed_snippet on that customer\'s website (before </head>).',
  '4. Stand up an HTTPS endpoint at destination_url that accepts POST application/json.',
  '5. Verify each request: recompute HMAC-SHA256(signing_secret, `${t}.${body}`) and compare to the X-Cursive-Signature v1 value.',
  '6. Route lead.identified payloads into your own product (your user tables, CRM, etc.).',
]
