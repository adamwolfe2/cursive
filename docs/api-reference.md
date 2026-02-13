# API Reference

Cursive REST API documentation for all public endpoints.

**Base URL:** `https://leads.meetcursive.com/api`
**Authentication:** Session-based (Supabase Auth)
**Rate Limiting:** 100 requests/minute per user

---

## Table of Contents

- [Authentication](#authentication)
- [Marketplace](#marketplace)
- [Leads](#leads)
- [Campaigns](#campaigns)
- [Partners](#partners)
- [Filters](#filters)
- [Admin](#admin)
- [Webhooks](#webhooks)
- [Error Handling](#error-handling)

---

## Authentication

### Sign Up

**POST** `/api/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

**Errors:**
- `400` - `user_already_exists`: Email already registered
- `400` - `weak_password`: Password doesn't meet requirements

---

### Sign In

**POST** `/api/auth/signin`

Authenticate existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "workspace_id": "uuid"
  },
  "session": {
    "access_token": "jwt-token",
    "expires_at": "2026-02-14T00:00:00Z"
  }
}
```

---

### Sign Out

**POST** `/api/auth/signout`

End current session.

**Response:** `200 OK`
```json
{
  "message": "Signed out successfully"
}
```

---

## Marketplace

### List Marketplace Leads

**GET** `/api/marketplace/leads`

Browse available leads for purchase.

**Query Parameters:**
- `industry` (string) - Filter by industry
- `state` (string) - Filter by US state
- `min_price` (number) - Minimum lead price
- `max_price` (number) - Maximum lead price
- `freshness_min` (number) - Minimum freshness score (0-100)
- `limit` (number, default: 50) - Results per page
- `offset` (number, default: 0) - Pagination offset

**Response:** `200 OK`
```json
{
  "leads": [
    {
      "id": "uuid",
      "first_name": "Jane",
      "last_name": "Smith",
      "company_name": "Tech Corp",
      "job_title": "VP of Sales",
      "industry": "Technology",
      "state": "CA",
      "marketplace_price": 15.50,
      "freshness_score": 95
    }
  ],
  "total": 1234,
  "has_more": true
}
```

---

### Purchase Leads

**POST** `/api/marketplace/purchase`

Buy leads using credits or payment method.

**Request Body:**
```json
{
  "lead_ids": ["uuid1", "uuid2"],
  "payment_method": "credits",
  "stripe_payment_intent_id": null
}
```

**Response:** `201 Created`
```json
{
  "purchase": {
    "id": "uuid",
    "total_amount": 31.00,
    "lead_count": 2,
    "status": "completed"
  },
  "remaining_credits": 100.00
}
```

**Errors:**
- `400` - `insufficient_credits`: Not enough credits
- `409` - `leads_already_purchased`: One or more leads already owned
- `410` - `leads_no_longer_available`: Leads purchased by another user

---

## Leads

### List My Leads

**GET** `/api/leads`

Get all leads owned by current workspace.

**Query Parameters:**
- `status` (string) - Filter by verification status
- `source` (string) - `marketplace`, `import`, `api`
- `search` (string) - Search by email, name, company
- `limit` (number, default: 50)
- `offset` (number, default: 0)

**Response:** `200 OK`
```json
{
  "leads": [
    {
      "id": "uuid",
      "email": "lead@company.com",
      "first_name": "John",
      "last_name": "Doe",
      "company_name": "Example Inc",
      "job_title": "CEO",
      "phone": "+1-555-0100",
      "verification_status": "approved",
      "created_at": "2026-02-10T12:00:00Z"
    }
  ],
  "total": 42
}
```

---

### Get Single Lead

**GET** `/api/leads/:leadId`

Retrieve detailed information for a specific lead.

**Response:** `200 OK`
```json
{
  "lead": {
    "id": "uuid",
    "email": "lead@company.com",
    "first_name": "John",
    "last_name": "Doe",
    "company_name": "Example Inc",
    "job_title": "CEO",
    "phone": "+1-555-0100",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "notes": "Interested in Q2 2026",
    "verification_status": "approved",
    "created_at": "2026-02-10T12:00:00Z"
  }
}
```

**Errors:**
- `404` - Lead not found or not owned by workspace

---

### Update Lead

**PATCH** `/api/leads/:leadId`

Update lead information.

**Request Body:**
```json
{
  "first_name": "Jonathan",
  "notes": "Updated notes"
}
```

**Allowed Fields:**
- `first_name`, `last_name`, `company_name`, `job_title`
- `phone`, `linkedin_url`, `notes`

**Response:** `200 OK`
```json
{
  "success": true,
  "lead": {
    "id": "uuid",
    "first_name": "Jonathan",
    "notes": "Updated notes"
  }
}
```

---

### Delete Lead (Soft Delete)

**DELETE** `/api/leads/:leadId`

**Added Phase 5** - GDPR-compliant soft deletion.

**Response:** `200 OK`
```json
{
  "success": true,
  "deleted": {
    "id": "uuid",
    "email": "lead@company.com",
    "deleted_at": "2026-02-13T14:00:00Z"
  },
  "message": "Lead deleted successfully. Will be permanently removed after 30 days."
}
```

**Notes:**
- Lead marked as deleted but retained for 30 days
- Automatically hard-deleted after grace period
- Creates audit log entry

---

### Bulk Update Leads

**PATCH** `/api/leads/bulk`

**Added Phase 5** - Update multiple leads at once.

**Request Body:**
```json
{
  "lead_ids": ["uuid1", "uuid2", "uuid3"],
  "status": "approved"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "updated": 3
}
```

**Errors:**
- `400` - `lead_ids` required (max 1000)
- `400` - Some leads not found

---

## Campaigns

### Create Campaign

**POST** `/api/campaigns`

Create new email outreach campaign.

**Request Body:**
```json
{
  "name": "Q1 Outreach",
  "subject": "{{first_name}}, let's connect",
  "body": "Hi {{first_name}},\\n\\nI noticed...",
  "from_name": "Sales Team",
  "from_email": "sales@yourcompany.com"
}
```

**Response:** `201 Created`
```json
{
  "campaign": {
    "id": "uuid",
    "name": "Q1 Outreach",
    "status": "draft",
    "created_at": "2026-02-13T14:00:00Z"
  }
}
```

---

### Import Leads to Campaign

**POST** `/api/campaigns/:campaignId/leads/import`

Upload CSV of leads to campaign.

**Request:** `multipart/form-data`
- `file` (CSV file)

**CSV Columns:**
- `email` (required)
- `first_name`, `last_name`, `company_name`, `job_title`

**Response:** `200 OK`
```json
{
  "imported": 100,
  "skipped": 5,
  "duplicates": 3,
  "invalid": 2
}
```

**Notes:**
- **Phase 3:** CSV values sanitized to prevent injection attacks
- **Phase 4:** Batch duplicate detection (100x faster than sequential)

---

## Partners

### Get Partner Earnings

**GET** `/api/partner/earnings`

Retrieve earnings breakdown for authenticated partner.

**Query Parameters:**
- `status` (string) - `pending`, `available`, `paid`
- `start_date` (ISO date)
- `end_date` (ISO date)

**Response:** `200 OK`
```json
{
  "earnings": [
    {
      "id": "uuid",
      "lead_id": "uuid",
      "amount": 10.50,
      "status": "available",
      "created_at": "2026-02-01T00:00:00Z"
    }
  ],
  "summary": {
    "pending": 150.00,
    "available": 500.00,
    "paid": 2000.00,
    "total": 2650.00
  }
}
```

**Notes:**
- **Phase 4:** Uses `partner_earnings_summary` materialized view for instant loading

---

### Request Payout

**POST** `/api/partner/payouts`

Request withdrawal of available balance.

**Request Body:**
```json
{
  "amount": 500.00,
  "payment_method": "bank_transfer",
  "payment_details": {
    "account_number": "****1234",
    "routing_number": "111000025"
  }
}
```

**Response:** `201 Created`
```json
{
  "payout": {
    "id": "uuid",
    "amount": 500.00,
    "status": "pending",
    "estimated_completion": "2026-02-20T00:00:00Z"
  }
}
```

**Errors:**
- `400` - `insufficient_balance`: Amount exceeds available balance
- `400` - `minimum_payout`: Minimum payout is $50

---

## Filters

### List Saved Filters

**GET** `/api/filters?type=marketplace`

**Added Phase 5** - Get user's saved filter presets.

**Query Parameters:**
- `type` (required) - `marketplace`, `leads`, `campaigns`, `partners`, `audit_logs`, `earnings`
- `include_shared` (boolean) - Include workspace shared filters

**Response:** `200 OK`
```json
{
  "filters": {
    "own": [
      {
        "id": "uuid",
        "name": "California Tech Companies",
        "filter_type": "marketplace",
        "filters": {
          "industries": ["Technology"],
          "states": ["CA"],
          "min_price": 10,
          "max_price": 50
        },
        "is_default": true
      }
    ],
    "shared": []
  }
}
```

---

### Create Saved Filter

**POST** `/api/filters`

**Added Phase 5** - Save a filter preset.

**Request Body:**
```json
{
  "name": "High-Value East Coast",
  "filter_type": "marketplace",
  "filters": {
    "states": ["NY", "MA", "CT"],
    "min_price": 50
  },
  "is_default": false,
  "is_shared": true
}
```

**Response:** `201 Created`
```json
{
  "filter": {
    "id": "uuid",
    "name": "High-Value East Coast",
    "filter_type": "marketplace",
    "filters": { "..." },
    "is_default": false,
    "is_shared": true
  }
}
```

---

### Update Saved Filter

**PATCH** `/api/filters`

**Added Phase 5** - Modify existing filter.

**Request Body:**
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "is_default": true
}
```

**Response:** `200 OK`
```json
{
  "filter": {
    "id": "uuid",
    "name": "Updated Name",
    "is_default": true
  }
}
```

---

### Delete Saved Filter

**DELETE** `/api/filters?id=:filterId`

**Added Phase 5** - Remove filter preset.

**Response:** `200 OK`
```json
{
  "success": true
}
```

---

## Admin

Admin endpoints require platform admin authentication.

### List Admin Webhooks

**GET** `/api/admin/webhooks`

**Added Phase 3** - View webhook event history.

**Response:** `200 OK`
```json
{
  "webhooks": [
    {
      "id": "uuid",
      "stripe_event_id": "evt_xxx",
      "event_type": "checkout.session.completed",
      "processed_at": "2026-02-13T12:00:00Z",
      "error_message": null,
      "retry_count": 0
    }
  ]
}
```

---

### Retry Failed Webhook

**POST** `/api/admin/webhooks/:webhookId/retry`

**Added Phase 5** - Manually reprocess failed webhook.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Webhook successfully retried",
  "webhook_id": "uuid",
  "event_type": "checkout.session.completed"
}
```

**Errors:**
- `404` - Webhook event not found
- `400` - Invalid webhook payload
- `500` - Retry failed (includes error details)

---

### Get Webhook Details

**GET** `/api/admin/webhooks/:webhookId`

**Added Phase 5** - View single webhook event.

**Response:** `200 OK`
```json
{
  "webhook": {
    "id": "uuid",
    "stripe_event_id": "evt_xxx",
    "event_type": "checkout.session.completed",
    "payload": { "..." },
    "processed_at": "2026-02-13T12:00:00Z",
    "processing_duration_ms": 145,
    "error_message": null
  }
}
```

---

### Admin Payout Dashboard

**GET** `/api/admin/payouts`

View all partner payout requests.

**Query Parameters:**
- `status` (string) - `pending`, `approved`, `completed`, `rejected`
- `partner_id` (UUID) - Filter by partner

**Response:** `200 OK`
```json
{
  "payouts": [
    {
      "id": "uuid",
      "partner": {
        "id": "uuid",
        "company_name": "Acme Leads"
      },
      "amount": 500.00,
      "status": "pending",
      "created_at": "2026-02-10T00:00:00Z"
    }
  ],
  "totals": {
    "pending_amount": 2500.00,
    "approved_amount": 1000.00,
    "completed_amount": 50000.00,
    "rejected_amount": 100.00
  }
}
```

**Notes:**
- **Phase 4:** `totals` calculated via `get_payout_totals()` SQL function (100x faster than in-app)

---

## Webhooks

Cursive sends webhook notifications for key events.

### Stripe Webhook

**POST** `/api/webhooks/stripe`

Receives Stripe payment events.

**Supported Events:**
- `checkout.session.completed` - Marketplace purchase completed
- `payment_intent.succeeded` - Credit card payment succeeded
- `payment_intent.payment_failed` - Payment failed

**Notes:**
- **Phase 3:** Webhook idempotency via `webhook_events` table
- Duplicate events automatically rejected
- Failed events can be retried via Admin API

---

## Error Handling

All endpoints follow consistent error response format:

**Error Response:**
```json
{
  "error": "Human-readable error message",
  "details": {
    "field": "validation_error_message"
  }
}
```

### HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Resource conflict (e.g., duplicate)
- `410 Gone` - Resource no longer available
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Error Messages

**Phase 2** introduced centralized error messages (`src/lib/utils/error-messages.ts`):

- Generic database errors → `"Something went wrong. Please try again."`
- `user_already_exists` → `"This email is already registered. Try signing in instead."`
- `insufficient_credits` → `"You don't have enough credits. Purchase more or use a credit card."`
- `leads_no_longer_available` → `"Some leads were purchased by another user. Try different leads."`

**Benefits:**
- User-friendly messages (no Supabase internals exposed)
- Consistent across all endpoints
- Actionable guidance

---

## Rate Limiting

**Phase 1** improved rate limiter to fail closed on errors:

- **Limit:** 100 requests/minute per user
- **Window:** Rolling 60-second window
- **Response Header:** `X-RateLimit-Remaining: 95`
- **Exceeded:** `429 Too Many Requests`

**Fail-Closed Behavior (Phase 1):**
If rate limit database is unavailable, requests are rejected (not allowed through).

---

## Authentication

All API requests require authentication via Supabase session:

**Cookie-Based:**
```bash
curl -X GET https://leads.meetcursive.com/api/leads \\
  --cookie "sb-access-token=..."
```

**JWT Bearer Token:**
```bash
curl -X GET https://leads.meetcursive.com/api/leads \\
  -H "Authorization: Bearer eyJhbGci..."
```

---

## Pagination

List endpoints use offset-based pagination:

**Request:**
```
GET /api/leads?limit=50&offset=100
```

**Response:**
```json
{
  "leads": [...],
  "total": 500,
  "has_more": true
}
```

**Best Practices:**
- Default `limit`: 50
- Maximum `limit`: 1000
- Use `offset` for page navigation

---

## Versioning

API version included in URL path (future):

- **Current:** No versioning (all endpoints are v1 implicitly)
- **Future:** `/api/v2/leads`

Breaking changes will introduce new version.

---

## SDKs & Client Libraries

**Official:**
- None yet (REST API only)

**Community:**
- Coming soon

**Code Examples:**

```javascript
// Fetch marketplace leads
const response = await fetch('/api/marketplace/leads?industry=Technology&state=CA')
const { leads } = await response.json()

// Purchase leads
const purchaseResponse = await fetch('/api/marketplace/purchase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lead_ids: ['uuid1', 'uuid2'],
    payment_method: 'credits'
  })
})
```

---

## Changelog

### 2026-02-13 (Phase 3-5)
- **Added:** `/api/filters` (saved filter presets)
- **Added:** `/api/leads/:id` (DELETE for soft delete)
- **Added:** `/api/leads/bulk` (bulk status updates)
- **Added:** `/api/admin/webhooks/:id/retry` (manual webhook retry)
- **Added:** Webhook idempotency via `webhook_events` table
- **Improved:** Error messages centralized and user-friendly

### 2026-02-13 (Phase 1-2)
- **Improved:** RLS policies use `auth.uid()` instead of `auth.email()`
- **Improved:** Rate limiter fails closed on errors
- **Added:** `/api/admin/payouts` uses SQL aggregation

---

## Support

**Issues:** https://github.com/adamwolfe2/cursive/issues
**Email:** support@meetcursive.com

**Last Updated:** 2026-02-13 (Phase 6)
