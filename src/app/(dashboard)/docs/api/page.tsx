import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Documentation | Cursive',
  description: 'Reference documentation for Cursive platform API endpoints',
}

// ─── Reusable sub-components ────────────────────────────────────────────────

function MethodBadge({ method }: { method: 'GET' | 'POST' | 'DELETE' | 'PATCH' }) {
  const colors: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-700 border-blue-200',
    POST: 'bg-green-100 text-green-700 border-green-200',
    DELETE: 'bg-red-100 text-red-700 border-red-200',
    PATCH: 'bg-amber-100 text-amber-700 border-amber-200',
  }
  return (
    <span
      className={`inline-block rounded border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${colors[method]}`}
    >
      {method}
    </span>
  )
}

function EndpointPath({ path }: { path: string }) {
  return (
    <code className="ml-2 font-mono text-[13px] text-foreground">{path}</code>
  )
}

function SectionHeader({ id, title }: { id: string; title: string }) {
  return (
    <h2
      id={id}
      className="mb-4 mt-10 border-b border-zinc-200 pb-2 text-base font-semibold text-foreground first:mt-0"
    >
      {title}
    </h2>
  )
}

function EndpointBlock({
  method,
  path,
  description,
  auth,
  rateLimit,
  params,
  body,
  response,
  errors,
}: {
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH'
  path: string
  description: string
  auth: string
  rateLimit?: string
  params?: { name: string; type: string; required: boolean; description: string }[]
  body?: { name: string; type: string; required: boolean; description: string }[]
  response: string
  errors: { code: number; description: string }[]
}) {
  return (
    <div className="mb-8 rounded-lg border border-zinc-200 bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
        <MethodBadge method={method} />
        <EndpointPath path={path} />
      </div>

      {/* Body */}
      <div className="divide-y divide-zinc-100 px-4 py-3 text-[13px]">
        {/* Description */}
        <div className="pb-3">
          <p className="text-muted-foreground">{description}</p>
          <div className="mt-2 flex flex-wrap gap-4 text-[12px]">
            <span>
              <span className="font-medium text-foreground">Auth:</span>{' '}
              <span className="text-muted-foreground">{auth}</span>
            </span>
            {rateLimit && (
              <span>
                <span className="font-medium text-foreground">Rate limit:</span>{' '}
                <span className="text-muted-foreground">{rateLimit}</span>
              </span>
            )}
          </div>
        </div>

        {/* Query params */}
        {params && params.length > 0 && (
          <div className="py-3">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              Query Parameters
            </p>
            <div className="space-y-2">
              {params.map((p) => (
                <div key={p.name} className="flex flex-wrap items-start gap-2">
                  <code className="shrink-0 rounded bg-zinc-50 px-1.5 py-0.5 font-mono text-[12px] text-foreground">
                    {p.name}
                  </code>
                  <span className="shrink-0 text-[11px] text-zinc-400">{p.type}</span>
                  {p.required ? (
                    <span className="shrink-0 rounded bg-red-50 px-1 py-0.5 text-[10px] font-semibold uppercase text-red-600">
                      required
                    </span>
                  ) : (
                    <span className="shrink-0 rounded bg-zinc-100 px-1 py-0.5 text-[10px] font-semibold uppercase text-zinc-500">
                      optional
                    </span>
                  )}
                  <span className="text-muted-foreground">{p.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Body fields */}
        {body && body.length > 0 && (
          <div className="py-3">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              Request Body
            </p>
            <div className="space-y-2">
              {body.map((f) => (
                <div key={f.name} className="flex flex-wrap items-start gap-2">
                  <code className="shrink-0 rounded bg-zinc-50 px-1.5 py-0.5 font-mono text-[12px] text-foreground">
                    {f.name}
                  </code>
                  <span className="shrink-0 text-[11px] text-zinc-400">{f.type}</span>
                  {f.required ? (
                    <span className="shrink-0 rounded bg-red-50 px-1 py-0.5 text-[10px] font-semibold uppercase text-red-600">
                      required
                    </span>
                  ) : (
                    <span className="shrink-0 rounded bg-zinc-100 px-1 py-0.5 text-[10px] font-semibold uppercase text-zinc-500">
                      optional
                    </span>
                  )}
                  <span className="text-muted-foreground">{f.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Response shape */}
        <div className="py-3">
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground/70">
            Response (200)
          </p>
          <pre className="overflow-x-auto rounded bg-zinc-50 p-3 font-mono text-[12px] leading-relaxed text-foreground">
            {response}
          </pre>
        </div>

        {/* Error codes */}
        {errors.length > 0 && (
          <div className="pt-3">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              Error Codes
            </p>
            <div className="space-y-1">
              {errors.map((e) => (
                <div key={e.code} className="flex gap-3 text-[12px]">
                  <code className="w-10 shrink-0 font-mono font-semibold text-foreground">
                    {e.code}
                  </code>
                  <span className="text-muted-foreground">{e.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ApiDocsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">API Reference</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          REST API documentation for Cursive platform. All endpoints require authentication
          via a valid session cookie (browser) or Supabase JWT (server-to-server).
        </p>
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-[13px] text-blue-800">
          <span className="font-semibold">Base URL:</span>{' '}
          <code className="font-mono">https://leads.meetcursive.com/api</code>
          <span className="ml-4 font-semibold">Content-Type:</span>{' '}
          <code className="font-mono">application/json</code>
        </div>
      </div>

      {/* Two-column layout: sticky sidebar + main content */}
      <div className="flex gap-8">
        {/* Sticky sidebar */}
        <aside className="hidden w-48 shrink-0 lg:block">
          <nav className="sticky top-6 space-y-1 text-[13px]">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Resources
            </p>
            <a href="#marketplace" className="block text-muted-foreground hover:text-foreground">
              Marketplace
            </a>
            <a href="#leads" className="block text-muted-foreground hover:text-foreground">
              Leads
            </a>
            <a href="#credits" className="block text-muted-foreground hover:text-foreground">
              Credits
            </a>
            <a href="#webhooks" className="block text-muted-foreground hover:text-foreground">
              Webhooks
            </a>
            <a href="#pixel" className="block text-muted-foreground hover:text-foreground">
              Pixel
            </a>
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">

          {/* ── MARKETPLACE ───────────────────────────────────────────── */}
          <SectionHeader id="marketplace" title="Marketplace" />

          <EndpointBlock
            method="GET"
            path="/api/marketplace/leads"
            description="Browse and search marketplace leads. Returns a paginated list of available leads matching the specified filters. Leads are scoped to those not yet purchased by the requesting workspace."
            auth="Session cookie or Bearer JWT"
            rateLimit="60 requests / minute per user"
            params={[
              { name: 'industries', type: 'string (comma-separated)', required: false, description: 'Filter by industry. Max 20 values. Example: industries=Technology,Finance' },
              { name: 'states', type: 'string (comma-separated)', required: false, description: 'Filter by US state. Max 50 values. Example: states=CA,TX,NY' },
              { name: 'companySizes', type: 'string (comma-separated)', required: false, description: 'Filter by company size band. Max 20 values.' },
              { name: 'seniorityLevels', type: 'string (comma-separated)', required: false, description: 'Filter by seniority. Max 20 values. Example: seniorityLevels=C-Suite,VP' },
              { name: 'intentScoreMin', type: 'number (0–100)', required: false, description: 'Minimum intent score threshold.' },
              { name: 'intentScoreMax', type: 'number (0–100)', required: false, description: 'Maximum intent score threshold.' },
              { name: 'freshnessMin', type: 'number (0–100)', required: false, description: 'Minimum freshness score.' },
              { name: 'hasPhone', type: 'boolean', required: false, description: 'When true, only return leads with a phone number.' },
              { name: 'hasVerifiedEmail', type: 'boolean', required: false, description: 'When true, only return leads with a verified email.' },
              { name: 'priceMin', type: 'number', required: false, description: 'Minimum lead price in USD.' },
              { name: 'priceMax', type: 'number', required: false, description: 'Maximum lead price in USD.' },
              { name: 'limit', type: 'integer (1–100)', required: false, description: 'Page size. Default 20.' },
              { name: 'offset', type: 'integer (≥ 0)', required: false, description: 'Pagination offset. Default 0.' },
              { name: 'orderBy', type: 'enum', required: false, description: 'Sort field: price | intent_score | freshness_score | created_at' },
              { name: 'orderDirection', type: 'enum', required: false, description: 'Sort direction: asc | desc' },
            ]}
            response={`{
  "leads": [
    {
      "id": "uuid",
      "first_name": "Jane",
      "last_name": "Smith",
      "company_name": "Acme Corp",
      "company_industry": "Technology",
      "job_title": "VP of Sales",
      "state": "California",
      "state_code": "CA",
      "intent_score_calculated": 82,
      "freshness_score": 91,
      "marketplace_price": 0.15,
      "has_phone": true,
      "has_verified_email": true
    }
  ],
  "total": 4231,
  "limit": 20,
  "offset": 0
}`}
            errors={[
              { code: 400, description: 'Invalid filters — details array included in response' },
              { code: 401, description: 'Not authenticated' },
              { code: 429, description: 'Rate limit exceeded — 60 req/min per user' },
              { code: 500, description: 'Internal error' },
            ]}
          />

          <EndpointBlock
            method="POST"
            path="/api/marketplace/purchase"
            description="Purchase one or more marketplace leads using workspace credits or Stripe. Credit purchases are atomic — credits are deducted and leads are marked sold in a single database transaction. Supports idempotency keys for safe retries."
            auth="Session cookie or Bearer JWT"
            rateLimit="10 requests / minute per user"
            body={[
              { name: 'leadIds', type: 'string[] (UUID)', required: true, description: 'Array of lead IDs to purchase. Min 1, max 100.' },
              { name: 'paymentMethod', type: '"credits" | "stripe"', required: false, description: 'Payment method. Default: "credits". Stripe creates a checkout session instead of an immediate purchase.' },
              { name: 'idempotencyKey', type: 'string (UUID)', required: false, description: 'Optional idempotency key. Safe to retry with the same key — duplicate requests return the cached response.' },
            ]}
            response={`// Credit payment (immediate purchase):
{
  "success": true,
  "purchase": { "id": "uuid", "status": "completed", ... },
  "leads": [ { "id": "uuid", "email": "jane@acme.com", ... } ],
  "totalPrice": 0.30,
  "creditsRemaining": 94.70
}

// Stripe payment (checkout redirect):
{
  "success": true,
  "checkoutUrl": "https://checkout.stripe.com/...",
  "purchaseId": "uuid",
  "totalPrice": 0.30,
  "leadCount": 2
}`}
            errors={[
              { code: 400, description: 'Invalid request body or insufficient credits' },
              { code: 401, description: 'Not authenticated' },
              { code: 404, description: 'Workspace not found' },
              { code: 409, description: 'Lead(s) no longer available or request already in progress' },
              { code: 429, description: 'Rate limit exceeded — 10 req/min per user' },
              { code: 500, description: 'Internal error' },
            ]}
          />

          <EndpointBlock
            method="GET"
            path="/api/marketplace/purchase"
            description="Retrieve details of a specific purchase, including the full lead data unlocked by the purchase."
            auth="Session cookie or Bearer JWT"
            params={[
              { name: 'purchaseId', type: 'string (UUID)', required: true, description: 'The purchase ID returned by POST /api/marketplace/purchase.' },
            ]}
            response={`{
  "purchase": {
    "id": "uuid",
    "status": "completed",
    "total_price": 0.30,
    "payment_method": "credits",
    "created_at": "2026-02-20T12:00:00Z"
  },
  "leads": [
    {
      "id": "uuid",
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane@acme.com",
      "phone": "+15551234567",
      "company_name": "Acme Corp",
      "job_title": "VP of Sales"
    }
  ]
}`}
            errors={[
              { code: 400, description: 'Missing or invalid purchaseId' },
              { code: 401, description: 'Not authenticated' },
              { code: 403, description: 'Workspace not found' },
              { code: 404, description: 'Purchase not found' },
              { code: 500, description: 'Internal error' },
            ]}
          />

          <EndpointBlock
            method="GET"
            path="/api/marketplace/saved-searches"
            description="List all saved search filter presets for the authenticated workspace, ordered newest-first."
            auth="Session cookie or Bearer JWT"
            response={`{
  "savedSearches": [
    {
      "id": "uuid",
      "name": "CA Tech Leads",
      "filters": {
        "industries": ["Technology"],
        "states": ["CA"],
        "intentScoreMin": 70
      },
      "created_at": "2026-02-01T10:00:00Z",
      "updated_at": "2026-02-01T10:00:00Z"
    }
  ]
}`}
            errors={[
              { code: 401, description: 'Not authenticated' },
              { code: 500, description: 'Internal error' },
            ]}
          />

          <EndpointBlock
            method="POST"
            path="/api/marketplace/saved-searches"
            description="Save a named filter preset for the authenticated workspace. Saved searches are per-user (not shared across the workspace by default)."
            auth="Session cookie or Bearer JWT"
            body={[
              { name: 'name', type: 'string (1–100 chars)', required: true, description: 'Display name for the saved search.' },
              { name: 'filters', type: 'object', required: true, description: 'Arbitrary filter object to persist (same shape as GET /api/marketplace/leads query params).' },
            ]}
            response={`{
  "savedSearch": {
    "id": "uuid",
    "name": "CA Tech Leads",
    "filters": { "industries": ["Technology"], "states": ["CA"] },
    "created_at": "2026-02-20T12:00:00Z"
  }
}`}
            errors={[
              { code: 400, description: 'Invalid request body' },
              { code: 401, description: 'Not authenticated' },
              { code: 500, description: 'Internal error' },
            ]}
          />

          {/* ── LEADS ─────────────────────────────────────────────────── */}
          <SectionHeader id="leads" title="Leads" />

          <EndpointBlock
            method="POST"
            path="/api/leads/bulk"
            description="Perform a bulk action on one or more leads or lead assignments. Supports status updates, tagging, assignment, deletion (owner/admin only), and CSV export."
            auth="Session cookie or Bearer JWT"
            body={[
              {
                name: 'action',
                type: 'enum',
                required: true,
                description:
                  'Action to perform: update_status | assign | add_tags | remove_tags | delete | export | archive | unarchive | tag | export_csv',
              },
              {
                name: 'lead_ids',
                type: 'string[] (UUID)',
                required: true,
                description: 'IDs of leads or lead assignments to act on. Min 1, max 100.',
              },
              { name: 'status', type: 'enum', required: false, description: 'Required for update_status. Values: new | contacted | qualified | proposal | negotiation | won | lost' },
              { name: 'assigned_to', type: 'string (UUID)', required: false, description: 'Required for assign. User ID to assign leads to.' },
              { name: 'tag_ids', type: 'string[] (UUID)', required: false, description: 'Required for add_tags / remove_tags. Max 50 tag IDs.' },
              { name: 'tag_name', type: 'string (1–50 chars)', required: false, description: 'Required for tag action. Finds or creates a tag with this name.' },
              { name: 'note', type: 'string (max 500 chars)', required: false, description: 'Optional note attached to status change.' },
            ]}
            response={`// JSON actions:
{
  "success": true,
  "data": {
    "affected": 5,
    "message": "Updated 5 leads to contacted"
  }
}

// export_csv action: returns text/csv attachment`}
            errors={[
              { code: 400, description: 'Missing required action-specific params or invalid input' },
              { code: 401, description: 'Not authenticated' },
              { code: 500, description: 'Internal error' },
            ]}
          />

          <EndpointBlock
            method="GET"
            path="/api/leads/enrichment-history"
            description="Returns recent enrichment activity (last 50 entries) and summary statistics for the authenticated workspace. Used for credit usage transparency on the billing page."
            auth="Session cookie or Bearer JWT"
            response={`{
  "enrichments": [
    {
      "id": "uuid",
      "lead_id": "uuid",
      "status": "success",
      "credits_used": 1,
      "fields_added": ["phone", "linkedin_url"],
      "created_at": "2026-02-20T10:00:00Z"
    }
  ],
  "stats": {
    "total": 142,
    "successful": 138,
    "today": 6
  }
}`}
            errors={[
              { code: 400, description: 'Workspace not found' },
              { code: 401, description: 'Not authenticated' },
              { code: 500, description: 'Internal error' },
            ]}
          />

          {/* ── CREDITS ───────────────────────────────────────────────── */}
          <SectionHeader id="credits" title="Credits" />

          <EndpointBlock
            method="GET"
            path="/api/marketplace/credits/auto-recharge"
            description="Retrieve the current auto-recharge settings for the authenticated workspace. Auto-recharge automatically tops up credits when the balance drops below the configured threshold."
            auth="Session cookie or Bearer JWT"
            response={`{
  "data": {
    "enabled": true,
    "threshold": 25,
    "recharge_amount": "growth"
  }
}`}
            errors={[
              { code: 401, description: 'Not authenticated' },
              { code: 404, description: 'Workspace not found' },
              { code: 500, description: 'Internal error' },
            ]}
          />

          <EndpointBlock
            method="POST"
            path="/api/marketplace/credits/auto-recharge"
            description="Save auto-recharge settings for the authenticated workspace. Settings are merged into the workspace's JSONB settings column."
            auth="Session cookie or Bearer JWT"
            body={[
              { name: 'enabled', type: 'boolean', required: true, description: 'Whether auto-recharge is active.' },
              { name: 'threshold', type: 'integer (1–500)', required: true, description: 'Credit balance at which auto-recharge triggers.' },
              { name: 'recharge_amount', type: '"starter" | "growth" | "scale" | "enterprise"', required: true, description: 'Credit package to purchase when threshold is hit.' },
            ]}
            response={`{
  "success": true,
  "data": {
    "enabled": true,
    "threshold": 25,
    "recharge_amount": "growth",
    "updated_at": "2026-02-20T12:00:00Z"
  }
}`}
            errors={[
              { code: 400, description: 'Invalid request body — threshold or recharge_amount out of range' },
              { code: 401, description: 'Not authenticated' },
              { code: 404, description: 'Workspace not found' },
              { code: 500, description: 'Internal error' },
            ]}
          />

          {/* ── WEBHOOKS ──────────────────────────────────────────────── */}
          <SectionHeader id="webhooks" title="Webhooks" />

          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            <span className="font-semibold">Signature verification:</span> All outbound webhook
            deliveries include an <code className="font-mono">X-Cursive-Signature</code> header in
            Stripe-style format:{' '}
            <code className="font-mono">t=&#123;unix_timestamp&#125;,v1=&#123;hmac_sha256&#125;</code>.
            The HMAC is computed over <code className="font-mono">&#123;timestamp&#125;.&#123;raw_body&#125;</code>{' '}
            using your webhook secret.
          </div>

          <EndpointBlock
            method="GET"
            path="/api/webhooks/outbound"
            description="List all outbound webhook endpoints configured for the authenticated workspace. Includes the 5 most recent delivery attempts per webhook for status monitoring."
            auth="Session cookie or Bearer JWT"
            response={`{
  "data": [
    {
      "id": "uuid",
      "name": "CRM Sync",
      "url": "https://your-server.com/hooks/cursive",
      "events": ["lead.received", "lead.purchased"],
      "is_active": true,
      "created_at": "2026-01-15T09:00:00Z",
      "updated_at": "2026-01-15T09:00:00Z",
      "recent_deliveries": [
        {
          "id": "uuid",
          "status": "delivered",
          "response_status": 200,
          "created_at": "2026-02-20T11:00:00Z"
        }
      ]
    }
  ]
}`}
            errors={[
              { code: 401, description: 'Not authenticated' },
              { code: 500, description: 'Internal error' },
            ]}
          />

          <EndpointBlock
            method="POST"
            path="/api/webhooks/outbound"
            description="Create a new outbound webhook endpoint. Returns a plaintext signing secret — this is the only time the secret is returned in full. Store it immediately."
            auth="Session cookie or Bearer JWT"
            body={[
              { name: 'url', type: 'string (URL)', required: true, description: 'HTTPS endpoint that will receive webhook POST requests.' },
              { name: 'events', type: 'string[]', required: true, description: 'Event types to subscribe to. At least one required. Allowed values: lead.received | lead.enriched | lead.purchased | credit.purchased' },
              { name: 'name', type: 'string (max 100 chars)', required: false, description: 'Optional display name for the webhook.' },
            ]}
            response={`{
  "data": {
    "id": "uuid",
    "name": "CRM Sync",
    "url": "https://your-server.com/hooks/cursive",
    "events": ["lead.received", "lead.purchased"],
    "is_active": true,
    "created_at": "2026-02-20T12:00:00Z",
    "secret": "a3f9...<64 hex chars>",
    "secret_warning": "Save this secret — it will never be shown again."
  }
}`}
            errors={[
              { code: 400, description: 'Invalid URL or unsupported event types' },
              { code: 401, description: 'Not authenticated' },
              { code: 500, description: 'Internal error' },
            ]}
          />

          <div className="mb-8 rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-100 px-4 py-3">
              <p className="text-[13px] font-semibold text-foreground">Webhook Event Payloads</p>
            </div>
            <div className="space-y-4 px-4 py-3 text-[13px]">
              <div>
                <p className="mb-1 font-medium">lead.received</p>
                <pre className="overflow-x-auto rounded bg-zinc-50 p-3 font-mono text-[12px] leading-relaxed">
{`{
  "event": "lead.received",
  "timestamp": "2026-02-20T12:00:00Z",
  "lead": {
    "id": "uuid",
    "email": "jane@acme.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "company_name": "Acme Corp",
    "job_title": "VP of Sales"
  }
}`}
                </pre>
              </div>
              <div>
                <p className="mb-1 font-medium">lead.purchased</p>
                <pre className="overflow-x-auto rounded bg-zinc-50 p-3 font-mono text-[12px] leading-relaxed">
{`{
  "event": "lead.purchased",
  "timestamp": "2026-02-20T12:00:00Z",
  "purchase_id": "uuid",
  "lead": {
    "id": "uuid",
    "email": "jane@acme.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "company_name": "Acme Corp",
    "company_industry": "Technology",
    "phone": "+15551234567"
  }
}`}
                </pre>
              </div>
              <div>
                <p className="mb-1 font-medium">credit.purchased</p>
                <pre className="overflow-x-auto rounded bg-zinc-50 p-3 font-mono text-[12px] leading-relaxed">
{`{
  "event": "credit.purchased",
  "timestamp": "2026-02-20T12:00:00Z",
  "credits_added": 500,
  "new_balance": 594.70
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* ── PIXEL ─────────────────────────────────────────────────── */}
          <SectionHeader id="pixel" title="Pixel" />

          <EndpointBlock
            method="GET"
            path="/api/pixel/verify"
            description="Check whether the workspace's AudienceLab pixel has received any events within the last 7 days. Use this to confirm pixel installation is working."
            auth="Session cookie or Bearer JWT"
            response={`// Pixel installed and firing:
{
  "verified": true,
  "lastEventAt": "2026-02-20T11:45:00Z",
  "eventCount": 47,
  "pixelId": "AL-abc123"
}

// Pixel not yet installed or no recent events:
{
  "verified": false,
  "lastEventAt": null,
  "eventCount": 0,
  "pixelId": null
}`}
            errors={[
              { code: 400, description: 'Workspace not found' },
              { code: 401, description: 'Not authenticated' },
              { code: 500, description: 'Internal error' },
            ]}
          />

          {/* ── COMMON PATTERNS ───────────────────────────────────────── */}
          <h2 className="mb-4 mt-10 border-b border-zinc-200 pb-2 text-base font-semibold text-foreground">
            Common Patterns
          </h2>

          <div className="space-y-4 text-[13px]">
            <div className="rounded-lg border border-zinc-200 bg-white px-4 py-4">
              <p className="mb-2 font-semibold">Authentication</p>
              <p className="text-muted-foreground">
                All endpoints verify authentication server-side. In a browser context, session
                cookies are sent automatically. For server-to-server calls, pass the Supabase
                JWT as a Bearer token:{' '}
                <code className="rounded bg-zinc-50 px-1 font-mono">Authorization: Bearer &lt;token&gt;</code>
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white px-4 py-4">
              <p className="mb-2 font-semibold">Rate Limiting</p>
              <p className="text-muted-foreground">
                When a rate limit is exceeded the API returns HTTP 429 with headers:{' '}
                <code className="rounded bg-zinc-50 px-1 font-mono">X-RateLimit-Limit</code>,{' '}
                <code className="rounded bg-zinc-50 px-1 font-mono">X-RateLimit-Remaining</code>,{' '}
                <code className="rounded bg-zinc-50 px-1 font-mono">X-RateLimit-Reset</code>,{' '}
                <code className="rounded bg-zinc-50 px-1 font-mono">Retry-After</code>.
              </p>
              <table className="mt-3 w-full text-[12px]">
                <thead>
                  <tr className="border-b border-zinc-100 text-left text-muted-foreground">
                    <th className="pb-1 font-medium">Endpoint</th>
                    <th className="pb-1 font-medium">Limit</th>
                    <th className="pb-1 font-medium">Window</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  <tr>
                    <td className="py-1 font-mono">GET /api/marketplace/leads</td>
                    <td className="py-1">60 requests</td>
                    <td className="py-1">1 minute</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-mono">POST /api/marketplace/purchase</td>
                    <td className="py-1">10 requests</td>
                    <td className="py-1">1 minute</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white px-4 py-4">
              <p className="mb-2 font-semibold">Idempotency</p>
              <p className="text-muted-foreground">
                The <code className="rounded bg-zinc-50 px-1 font-mono">POST /api/marketplace/purchase</code> endpoint
                accepts an optional{' '}
                <code className="rounded bg-zinc-50 px-1 font-mono">idempotencyKey</code> (UUID) in the request body.
                Supplying the same key for a repeat request returns the original cached response
                without re-charging credits. Keys persist across failed attempts so retries are safe.
              </p>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white px-4 py-4">
              <p className="mb-2 font-semibold">Error Shape</p>
              <p className="mb-2 text-muted-foreground">All error responses follow a consistent shape:</p>
              <pre className="overflow-x-auto rounded bg-zinc-50 p-3 font-mono text-[12px]">
{`{
  "error": "Human-readable message",
  "details": { "fieldName": ["Validation message"] }  // optional
}`}
              </pre>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
