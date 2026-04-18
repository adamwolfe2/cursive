# Audience Labs SuperPixel Webhook — Portable Integration Spec

> A standalone spec for integrating AL SuperPixel webhooks into any downstream CRM.
> Extracted from AL's public docs + live-API reverse engineering.
> Last verified: 2026-04-17

---

## 1. What this enables

1. Your CRM programmatically creates an AL pixel for a customer's website.
2. The customer pastes one `<script>` tag into their site.
3. Every identified visitor is POSTed in real time to a webhook endpoint on your CRM.
4. Your CRM upserts that visitor as a Contact/Lead.

No AL dashboard access is required for any of this — the pixel + webhook are both created via API.

---

## 2. Authentication

| Purpose | Credential | Where |
|---|---|---|
| Create/list/delete pixels | `X-Api-Key: <AL_ACCOUNT_API_KEY>` | Header on outbound calls to `https://api.audiencelab.io` |
| Receive webhooks | `x-audiencelab-secret` OR `x-audiencelab-signature` | Inbound header on webhook requests |

- Account API key is issued from AL's dashboard under API Keys.
- Webhook secret is a shared string you generate yourself. You pass it when creating the pixel (some AL tenants hardcode it at the account level — confirm with AL support if the header is missing).

---

## 3. Create a pixel (outbound)

### Endpoint
```
POST https://api.audiencelab.io/pixels
Headers:
  Content-Type: application/json
  X-Api-Key: <AL_ACCOUNT_API_KEY>
```

### Request
```json
{
  "websiteName": "Acme Corp",
  "websiteUrl": "https://acme.com",
  "webhookUrl": "https://your-crm.com/api/webhooks/al/superpixel"
}
```

### Response (200)
```json
{
  "pixel_id": "003daacb-d261-421c-9781-311df9c381d8",
  "install_url": "https://cdn.audiencelab.io/pixel/003daacb-d261-421c-9781-311df9c381d8.js",
  "script": "<script src=\"https://cdn.audiencelab.io/pixel/...js\" defer></script>",
  "website_name": "Acme Corp",
  "website_url": "https://acme.com",
  "webhook_url": "https://your-crm.com/api/webhooks/al/superpixel",
  "created_at": "2026-04-17T12:34:56Z"
}
```

Store the returned `pixel_id` — it's the stable key for routing incoming webhook events back to the correct tenant.

### Other pixel endpoints
- `GET  /pixels` → paginated list `{ data: Pixel[], page, page_size, total, total_pages }`
- `DELETE /pixels/{id}` → 204 No Content
- `GET  /pixels/{id}/v4?page=1&page_size=500` → richer resolution fields (DNC flags, career history, psychographics, URL tracking) — pull-based alternative to the webhook

---

## 4. Install on the customer's site

```html
<script src="https://cdn.audiencelab.io/pixel/<pixel_id>.js" defer></script>
```
Place in `<head>`. Runs alongside Google Analytics without conflict.

Optional init config (client-side, controls which events fire):
```js
SuperPixel.init({
  trackEvents: {
    copy: true,
    page_view: true,
    exit_intent: true,
    deep_scroll: false,
    idle_user: true,
    video_engagement: true,
    all_clicks: false,
    file_downloads: true,
    all_form_submissions: true
  }
});
```
Disable `all_clicks` for high-traffic sites — it fires on every click and balloons webhook volume.

---

## 5. Webhook payload

AL POSTs `application/json` to your `webhookUrl` whenever an event is captured and resolved.

### Wrapper variants

Payloads arrive in one of three shapes. Handle all three.

```json
// (a) Single event
{ "pixel_id": "...", "hem_sha256": "...", "event": "page_view", ... }

// (b) Array of events
[ { ... }, { ... } ]

// (c) Wrapped in `result`
{ "result": [ { ... }, { ... } ] }
```

### Top-level event fields

| Field | Type | Notes |
|---|---|---|
| `pixel_id` | UUID | Route back to tenant on this key. Always present on enriched events. |
| `event` / `event_type` | string | See event types below. Accept both keys. |
| `event_timestamp` | ISO 8601 | e.g. `"2025-05-29T23:52:53Z"` |
| `ip_address` / `ip` | string | Visitor IP (`ip_address` on enriched, `ip` on auth). |
| `user_agent` | string | |
| `hem_sha256` | string | SHA-256 of lowercased email — identity key when email is hashed. |
| `hem` | string | MD5 of email — appears on `authentication` events only. |
| `uid` | string | AL internal unique ID (links devices/browsers). |
| `profile_id` | string | AL profile ID (dedupe key). |
| `cookie_id` | string | Browser cookie. |
| `maid_id` | string | Mobile Ad ID. |
| `activity_start_date` | ISO 8601 | Session window start (enriched events). |
| `activity_end_date` | ISO 8601 | Session window end. |
| `email_raw` | string | Plaintext email — only on `authentication` events where the user submitted it. |
| `landing_url` / `page_url` / `page_title` / `referrer` | string | Page context. |
| `event_data` | object (nested) | Interactive element metadata (see §7). |
| `resolution` | object (nested) | Full PII profile when resolution succeeds (see §8). |

### Example — authentication event (user submitted email in a form)
```json
{
  "pixel_id": "003daacb-d261-421c-9781-311df9c381d8",
  "cookie_id": "a1f2c3d4e5",
  "event": "authentication",
  "email_raw": "user@example.com",
  "hem": "4d186321c1a7f0f354b297e8914ab240",
  "ip": "192.168.0.1",
  "user_agent": "Mozilla/5.0"
}
```

### Example — enriched page view with full resolution
```json
{
  "pixel_id": "003daacb-d261-421c-9781-311df9c381d8",
  "hem_sha256": "1458ee23320e30d920f099f57b11000b89ab82a7456bf39dd663d9d0858fd88d",
  "event": "page_view",
  "event_timestamp": "2025-05-29T23:52:53Z",
  "ip_address": "35.191.85.117",
  "activity_start_date": "2025-05-29T23:52:53Z",
  "activity_end_date": "2025-05-29T23:53:53Z",
  "page_url": "https://acme.com/pricing",
  "resolution": {
    "FIRST_NAME": "Jane",
    "LAST_NAME": "Doe",
    "PERSONAL_EMAILS": "jane@gmail.com",
    "BUSINESS_EMAIL": "jane@acme.com",
    "PERSONAL_EMAIL_VALIDATION_STATUS": "Valid (esp)",
    "MOBILE_PHONE": "+15551234567",
    "MOBILE_PHONE_DNC": "false",
    "COMPANY_NAME": "Acme Corp",
    "COMPANY_DOMAIN": "acme.com",
    "JOB_TITLE": "VP Marketing",
    "INDIVIDUAL_LINKEDIN_URL": "https://linkedin.com/in/janedoe",
    "PERSONAL_CITY": "Austin",
    "STATE": "TX",
    "ZIP": "78701"
  }
}
```

---

## 6. Event types

| Event | Fires when |
|---|---|
| `authentication` | User submits a form or logs in — carries `email_raw` and `hem`. |
| `page_view` | Full page load. |
| `copy` | User copies text/content. |
| `exit_intent` | Mouse moves toward browser chrome (likely tab close). |
| `deep_scroll` | User scrolls past 75% of page. |
| `idle_user` | User inactive for configured duration (default 60s). |
| `video_engagement` | Video play / pause / complete. |
| `all_clicks` | Every click (high volume — disable unless needed). |
| `file_downloads` | PDF / DOC / ZIP / etc. download. |
| `all_form_submissions` | Any form submit event. |

---

## 7. `event_data` — nested interactive metadata

`event_data` varies by event type. Treat it as opaque JSON and store the raw object; only parse the keys you care about. For example, `all_clicks` includes the clicked element's selector, text, and href.

---

## 8. `resolution` — nested PII payload

Only populated when deterministic resolution succeeds (typically after an `authentication` event, then carried forward on subsequent enriched events for that profile).

### Identity
`UUID`, `FIRST_NAME`, `LAST_NAME`, `SHA256_PERSONAL_EMAIL`, `SHA256_BUSINESS_EMAIL`

### Contact
`PERSONAL_EMAILS` (comma-separated), `BUSINESS_EMAIL`, `PERSONAL_VERIFIED_EMAILS`, `BUSINESS_VERIFIED_EMAILS`, `PERSONAL_PHONE`, `MOBILE_PHONE`, `MOBILE_PHONE_DNC`, `DIRECT_NUMBER`, `DIRECT_NUMBER_DNC`, `ALL_LANDLINES`, `LANDLINE_DNC`, `ALL_MOBILES`, `MOBILE_DNC`

### Email validation
`PERSONAL_EMAIL_VALIDATION_STATUS`, `BUSINESS_EMAIL_VALIDATION_STATUS` — one of `Valid (esp)`, `Valid`, `Catch-all`, `Unknown`, `Invalid`
`PERSONAL_EMAIL_LAST_SEEN_BY_ESP_DATE`, `BUSINESS_EMAIL_LAST_SEEN_BY_ESP_DATE` — ISO dates

### Company
`COMPANY_NAME`, `COMPANY_DOMAIN`, `COMPANY_INDUSTRY`, `COMPANY_SIC`, `COMPANY_NAICS`, `COMPANY_ADDRESS`, `COMPANY_CITY`, `COMPANY_STATE`, `COMPANY_ZIP`, `COMPANY_PHONE`, `COMPANY_EMPLOYEE_COUNT`, `COMPANY_REVENUE`, `COMPANY_LINKEDIN_URL`, `COMPANY_DESCRIPTION`

### Professional
`JOB_TITLE`, `HEADLINE`, `DEPARTMENT`, `SENIORITY_LEVEL`, `INFERRED_YEARS_EXPERIENCE`, `COMPANY_NAME_HISTORY`, `JOB_TITLE_HISTORY`, `EDUCATION_HISTORY`

### Social
`INDIVIDUAL_LINKEDIN_URL`, `INDIVIDUAL_TWITTER_URL`, `INDIVIDUAL_FACEBOOK_URL`, `SKILLS`, `INTERESTS`

### Address
`PERSONAL_ADDRESS`, `PERSONAL_CITY`, `PERSONAL_STATE` (or `STATE`), `PERSONAL_ZIP` (or `ZIP`), `PERSONAL_ZIP4`

### Demographics
`GENDER`, `AGE`, `AGE_RANGE`, `INCOME_RANGE`, `NET_WORTH`, `HOMEOWNER`, `MARRIED`, `CHILDREN`

### Skiptrace (offline match)
`SKIPTRACE_NAME`, `SKIPTRACE_ADDRESS`, `SKIPTRACE_CITY`, `SKIPTRACE_STATE`, `SKIPTRACE_ZIP`, `SKIPTRACE_MATCH_SCORE`, `SKIPTRACE_MATCH_BY`, `SKIPTRACE_CREDIT_RATING`, `SKIPTRACE_WIRELESS_NUMBERS`, `SKIPTRACE_LANDLINE_NUMBERS`, `SKIPTRACE_IP`, `SKIPTRACE_B2B_ADDRESS`, `SKIPTRACE_B2B_PHONE`, `SKIPTRACE_B2B_WEBSITE`, `SKIPTRACE_B2B_WIRELESS`, `SKIPTRACE_B2B_LANDLINE`

Note: enriched events sometimes ship fields at the top level (flat) *and* sometimes nested under `resolution`, `event_data.resolution`, or `event.data.resolution`. Always flatten defensively before consuming.

---

## 9. Security

### Option A — shared secret (simpler)
On inbound, compare header in constant time:
```
x-audiencelab-secret: <AL_WEBHOOK_SECRET>
```

### Option B — HMAC-SHA256 (stronger)
```
x-audiencelab-signature: sha256=<hex_hmac_of_raw_body>
```
Compute `HMAC-SHA256(AL_WEBHOOK_SECRET, raw_request_body)` and compare in constant time. Also accept `x-webhook-signature` as an alias.

Enforce both:
- Reject bodies larger than 3 MB.
- Require `Content-Type: application/json`.
- Idempotency: SHA-256 the raw body, store, reject duplicates within 24h.

---

## 10. Recommended lead-worthiness gate

Not every webhook event should create a Lead. AL fires on anonymous page_views too. Apply this gate before upsert:

```
isLead = (
  resolution.PERSONAL_EMAIL_VALIDATION_STATUS in {"Valid (esp)", "Valid"} OR
  resolution.BUSINESS_EMAIL_VALIDATION_STATUS in {"Valid (esp)", "Valid"}
) AND FIRST_NAME AND LAST_NAME AND deliverability_score >= 60
```

Deliverability score (0–100):
| Validation | Points |
|---|---|
| `Valid (esp)` | 40 |
| `Valid` | 30 |
| `Catch-all` | 15 |
| `Unknown` | 5 |
| `Invalid` | 0 |

Add points for presence of phone, company domain, recent `LAST_SEEN_BY_ESP_DATE` (< 30 days), and skiptrace match.

---

## 11. Minimal receiver — Next.js edge route

```typescript
// app/api/webhooks/al/superpixel/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const SECRET = process.env.AL_WEBHOOK_SECRET!

async function hmacSha256Hex(key: string, msg: string): Promise<string> {
  const enc = new TextEncoder()
  const k = await crypto.subtle.importKey(
    'raw', enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(msg))
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

async function verify(req: NextRequest, body: string): Promise<boolean> {
  const sharedSecret = req.headers.get('x-audiencelab-secret')
  if (sharedSecret) return timingSafeEqual(sharedSecret, SECRET)

  const sig = req.headers.get('x-audiencelab-signature')
            ?? req.headers.get('x-webhook-signature')
  if (!sig) return false
  const expected = await hmacSha256Hex(SECRET, body)
  return timingSafeEqual(sig.replace(/^sha256=/, ''), expected)
}

function flatten(p: any): any {
  return { ...p, ...(p.resolution ?? {}), ...(p.event_data ?? {}) }
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  if (raw.length > 3 * 1024 * 1024) return new NextResponse('Too large', { status: 413 })
  if (!(await verify(req, raw))) return new NextResponse('Unauthorized', { status: 401 })

  const parsed = JSON.parse(raw)
  const events = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.result) ? parsed.result
    : [parsed]

  for (const ev of events) {
    const e = flatten(ev)
    // 1. Resolve tenant: lookup workspace by e.pixel_id
    // 2. Upsert Contact by primary email (PERSONAL_EMAILS || BUSINESS_EMAIL)
    // 3. Append activity (event_type, page_url, event_timestamp)
    // 4. Enqueue async enrichment / scoring
  }

  return NextResponse.json({ ok: true })
}
```

Key points:
- Always read the raw body *before* JSON-parsing so HMAC verification works.
- Respond `200 {ok:true}` within 250 ms. Do processing async (queue/worker).
- Return 401 on bad signature — AL will retry.

---

## 12. Tenant routing

Store a mapping when you create the pixel:

```
pixels_table:
  pixel_id (PK)       → UUID from AL
  workspace_id (FK)   → your internal tenant
  website_domain      → customer's site
  is_active           → boolean
  created_at
```

On every inbound webhook, resolve the tenant **strictly by `pixel_id`**. Never fall back to domain matching or admin defaults — that causes cross-tenant data leaks.

---

## 13. Contact upsert — field map

Suggested mapping AL resolution → Contact model:

| Contact field | AL source (first non-empty) |
|---|---|
| `email` | `PERSONAL_EMAILS.split(',')[0]` or `BUSINESS_EMAIL` |
| `email_hashed` | `hem_sha256` |
| `first_name` | `FIRST_NAME` |
| `last_name` | `LAST_NAME` |
| `phone` | `MOBILE_PHONE` or `PERSONAL_PHONE` or `DIRECT_NUMBER` |
| `company_name` | `COMPANY_NAME` |
| `company_domain` | `COMPANY_DOMAIN` |
| `job_title` | `JOB_TITLE` |
| `seniority` | `SENIORITY_LEVEL` |
| `linkedin_url` | `INDIVIDUAL_LINKEDIN_URL` |
| `city` / `state` / `zip` | `PERSONAL_CITY` / `STATE` / `ZIP` |
| `external_id` | `profile_id` (stable dedup key) |

Upsert key: `(workspace_id, email)` preferred, fallback to `(workspace_id, profile_id)`.

---

## 14. Testing

1. Use `https://webhook.site` temporarily as `webhookUrl` when creating a pixel.
2. Load the pixel on a staging page and submit a test form.
3. Confirm you see an `authentication` event with `email_raw` + `hem`.
4. Within ~30s, AL fires a follow-up enriched event with the `resolution` block.
5. Swap `webhookUrl` to your real endpoint via the AL dashboard or `DELETE /pixels/{id}` + re-create.

---

## 15. Gotchas

- **`all_clicks` spam** — default off unless the customer really needs it.
- **Flat vs nested fields** — always flatten `resolution` / `event_data` / `event.data`.
- **Duplicate events** — AL may retry on 5xx responses; dedupe on `(pixel_id, profile_id, event_timestamp, event_type)`.
- **Comma-separated values** — `PERSONAL_EMAILS`, `ALL_MOBILES`, etc. can be comma-delimited. Split before use.
- **Trial limits / quotas** — enforce your own per-tenant daily cap. AL does not throttle.
- **Trailing slash in `webhookUrl`** — AL does not normalize. Don't double-slash.
- **GDPR / CCPA** — honor `MOBILE_PHONE_DNC` / `LANDLINE_DNC` before outbound dialing. Respect DNC flags for contact attempts.

---

## 16. Sources

- Public KB: https://audiencelab.crisp.help/en/
- SuperPixel install guide: https://audiencelab.crisp.help/en/article/installing-the-superpixel-and-syncing-data-1x0jdmy/
- V3 SuperPixel payload spec: https://docs.audiencelab.io/superpixel/3R2xsGUFPBQpxgzaZJNRP4/v3-superpixel-documentation/53RGL83M96NcAsznwPW46W
- Set-up webhook article: https://docs.audiencelab.io/superpixel/3R2xsGUFPBQpxgzaZJNRP4/set-up-the-web-hook/3R2xsGUFPzFHF4yvaRoc4E
- Contact data field guide: https://docs.audiencelab.io/contact-data--fields-/3XJYTNzou94SzARC1zf1Fy/fields-guide-/3XJYTNzouekshyUGzZp7k2
- API base: `https://api.audiencelab.io` (auth `X-Api-Key`, no public OpenAPI spec)

---

## 17. Support

AL publishes no public OpenAPI/Swagger. When in doubt:
- Email AL support for field additions / deprecations.
- Reverse-engineer live responses (log raw payload to storage for the first week of integration).
- Compare against the reference implementation in this repo: `src/lib/audiencelab/api-client.ts` and `src/app/api/webhooks/audiencelab/superpixel/route.ts`.
