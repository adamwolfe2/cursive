# Cursive Partner API Documentation

Version: 1.0
Base URL: `https://leads.meetcursive.com/api`

## Overview

The Cursive Partner API allows partners to programmatically upload leads, track earnings, and manage payouts. All API requests require authentication using an API key.

## Authentication

Include your API key in the `Authorization` header:

```http
Authorization: Bearer YOUR_API_KEY
```

Get your API key from the Partner Dashboard: https://leads.meetcursive.com/partner/settings

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Lead Upload | 10 requests/hour |
| Dashboard | 100 requests/minute |
| Earnings | 100 requests/minute |

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: When the limit resets (ISO 8601)

## Endpoints

### 1. Upload Leads

**`POST /api/partner/upload`**

Upload leads in bulk via CSV or JSON.

**Request Headers:**
```http
Authorization: Bearer YOUR_API_KEY
Content-Type: multipart/form-data
```

**Request Body (CSV Upload):**
```http
file: (binary CSV file)
```

**Request Body (JSON Upload):**
```json
{
  "leads": [
    {
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "company_name": "Acme Corp",
      "job_title": "CTO",
      "industry": "technology",
      "company_size": "51-200",
      "state": "CA",
      "intent_score": 85,
      "notes": "Interested in our platform"
    }
  ]
}
```

**Required Fields:**
- `email` (unique)
- At least one of: `full_name`, `first_name` + `last_name`

**Optional Fields:**
- `phone`
- `company_name`
- `job_title`
- `industry` (see Industries list)
- `company_size` (1-10, 11-50, 51-200, 201-500, 501-1000, 1000+)
- `state` (US states only)
- `seniority` (C-Suite, VP, Director, Manager, IC)
- `intent_score` (0-100)
- `freshness_score` (0-100)
- `linkedin_url`
- `notes`

**Response (Success):**
```json
{
  "success": true,
  "batch_id": "batch_123abc",
  "stats": {
    "total": 100,
    "accepted": 95,
    "rejected": 5,
    "duplicates": 3
  },
  "message": "Upload processing started"
}
```

**Response (Error):**
```json
{
  "error": "Invalid CSV format",
  "details": "Missing required column: email"
}
```

**Status Codes:**
- `200`: Upload accepted and processing
- `400`: Invalid request (bad CSV, missing fields)
- `401`: Unauthorized (invalid API key)
- `429`: Rate limit exceeded
- `500`: Server error

---

### 2. Get Upload Status

**`GET /api/partner/upload/status/:batchId`**

Check the status of a batch upload.

**Request:**
```http
GET /api/partner/upload/status/batch_123abc
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "batch_id": "batch_123abc",
  "status": "completed",
  "progress": {
    "total": 100,
    "processed": 100,
    "accepted": 95,
    "rejected": 5
  },
  "errors": [
    {
      "row": 23,
      "email": "invalid@",
      "reason": "Invalid email format"
    }
  ],
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:32:15Z"
}
```

**Status Values:**
- `pending`: Upload queued
- `processing`: Currently processing
- `completed`: Finished successfully
- `failed`: Processing failed

---

### 3. Get Dashboard Stats

**`GET /api/partner/dashboard`**

Get partner dashboard statistics.

**Request:**
```http
GET /api/partner/dashboard
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "stats": {
    "total_uploads": 45,
    "total_leads_uploaded": 12500,
    "leads_sold": 3200,
    "leads_available": 9300,
    "total_earnings": 4800.00,
    "pending_balance": 1200.00,
    "available_balance": 3600.00,
    "paid_out": 0.00,
    "verification_pass_rate": 96.5,
    "average_lead_price": 1.50
  },
  "recent_sales": [
    {
      "lead_id": "lead_abc123",
      "sold_at": "2024-01-15T14:23:00Z",
      "sale_price": 2.50,
      "commission": 0.75,
      "buyer_industry": "technology"
    }
  ],
  "top_industries": [
    { "industry": "technology", "sales": 120, "revenue": 180.00 },
    { "industry": "healthcare", "sales": 95, "revenue": 142.50 }
  ]
}
```

---

### 4. Get Earnings

**`GET /api/partner/earnings`**

Get detailed earnings breakdown.

**Query Parameters:**
- `start_date` (optional): ISO 8601 date (e.g., 2024-01-01)
- `end_date` (optional): ISO 8601 date
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50, max: 100)

**Request:**
```http
GET /api/partner/earnings?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "summary": {
    "total_earnings": 4800.00,
    "pending": 1200.00,
    "available": 3600.00,
    "paid_out": 0.00
  },
  "earnings": [
    {
      "earning_id": "earn_abc123",
      "lead_id": "lead_xyz789",
      "sold_at": "2024-01-15T14:23:00Z",
      "sale_price": 2.50,
      "commission_rate": 0.30,
      "commission_amount": 0.75,
      "status": "available",
      "payout_id": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 3200,
    "pages": 64
  }
}
```

**Earning Status:**
- `pending`: In 30-day holdback period
- `available`: Ready for payout
- `paid_out`: Included in completed payout

---

### 5. Request Payout

**`POST /api/partner/payouts/request`**

Request a payout of available balance.

**Minimum Payout:** $50.00

**Request:**
```http
POST /api/partner/payouts/request
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "amount": 500.00
}
```

**Response:**
```json
{
  "payout_id": "payout_abc123",
  "amount": 500.00,
  "status": "pending",
  "requested_at": "2024-01-15T16:00:00Z",
  "estimated_arrival": "2024-01-17T00:00:00Z"
}
```

**Status Codes:**
- `200`: Payout created
- `400`: Amount below minimum or exceeds available balance
- `401`: Unauthorized
- `403`: Stripe Connect account not linked

---

### 6. Get Payout History

**`GET /api/partner/payouts`**

Get payout history.

**Request:**
```http
GET /api/partner/payouts
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "payouts": [
    {
      "payout_id": "payout_abc123",
      "amount": 500.00,
      "status": "completed",
      "requested_at": "2024-01-15T16:00:00Z",
      "completed_at": "2024-01-17T08:30:00Z",
      "stripe_transfer_id": "tr_1abc234"
    },
    {
      "payout_id": "payout_xyz789",
      "amount": 250.00,
      "status": "pending",
      "requested_at": "2024-01-20T10:00:00Z",
      "estimated_arrival": "2024-01-22T00:00:00Z"
    }
  ]
}
```

**Payout Status:**
- `pending`: Processing
- `completed`: Sent to bank account
- `failed`: Payment failed (funds returned to available balance)
- `cancelled`: Cancelled by admin

---

## Webhooks

Cursive can send webhooks to notify you of important events. Configure webhooks in the Partner Dashboard.

### Events

**`lead.sold`** - A lead was purchased

```json
{
  "event": "lead.sold",
  "timestamp": "2024-01-15T14:23:00Z",
  "data": {
    "lead_id": "lead_abc123",
    "sold_at": "2024-01-15T14:23:00Z",
    "sale_price": 2.50,
    "commission": 0.75,
    "buyer_industry": "technology"
  }
}
```

**`payout.completed`** - Payout sent to bank account

```json
{
  "event": "payout.completed",
  "timestamp": "2024-01-17T08:30:00Z",
  "data": {
    "payout_id": "payout_abc123",
    "amount": 500.00,
    "stripe_transfer_id": "tr_1abc234"
  }
}
```

**`payout.failed`** - Payout failed

```json
{
  "event": "payout.failed",
  "timestamp": "2024-01-17T08:30:00Z",
  "data": {
    "payout_id": "payout_abc123",
    "amount": 500.00,
    "reason": "Insufficient funds"
  }
}
```

### Webhook Security

All webhooks include an `X-Cursive-Signature` header for verification:

```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
```

---

## Industries

Supported industry values:

- `technology`
- `healthcare`
- `finance`
- `real_estate`
- `insurance`
- `education`
- `manufacturing`
- `retail`
- `hospitality`
- `construction`
- `legal`
- `consulting`
- `marketing`
- `other`

---

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_API_KEY` | API key missing or invalid |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INVALID_CSV` | CSV format error |
| `DUPLICATE_EMAIL` | Lead with email already exists |
| `INVALID_FIELD` | Field validation failed |
| `INSUFFICIENT_BALANCE` | Payout amount exceeds available balance |
| `PAYOUT_MINIMUM` | Amount below $50 minimum |
| `STRIPE_NOT_CONNECTED` | Stripe Connect account not linked |
| `BATCH_NOT_FOUND` | Upload batch ID not found |

---

## Code Examples

### Python

```python
import requests

API_KEY = "your_api_key_here"
BASE_URL = "https://leads.meetcursive.com/api"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Upload leads
leads_data = {
    "leads": [
        {
            "full_name": "John Doe",
            "email": "john@example.com",
            "company_name": "Acme Corp",
            "job_title": "CTO",
            "industry": "technology"
        }
    ]
}

response = requests.post(
    f"{BASE_URL}/partner/upload",
    json=leads_data,
    headers=headers
)

print(response.json())

# Get dashboard
response = requests.get(
    f"{BASE_URL}/partner/dashboard",
    headers=headers
)

print(response.json())
```

### Node.js

```javascript
const axios = require('axios');

const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://leads.meetcursive.com/api';

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

// Upload leads
async function uploadLeads() {
  const response = await axios.post(`${BASE_URL}/partner/upload`, {
    leads: [
      {
        full_name: 'John Doe',
        email: 'john@example.com',
        company_name: 'Acme Corp',
        job_title: 'CTO',
        industry: 'technology'
      }
    ]
  }, { headers });

  console.log(response.data);
}

// Get dashboard
async function getDashboard() {
  const response = await axios.get(`${BASE_URL}/partner/dashboard`, { headers });
  console.log(response.data);
}

uploadLeads();
getDashboard();
```

---

## Support

For API support, contact: partners@meetcursive.com

For bugs or feature requests: https://github.com/adamwolfe2/leadme/issues

---

**Last Updated:** January 2024
**API Version:** 1.0
