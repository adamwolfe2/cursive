# Lead Routing & Bulk Import - Deployment Guide

This guide covers the deployment and configuration of the new lead routing and bulk import system.

## ✅ Implementation Status

All code has been implemented and is ready for deployment:

### Files Created/Updated
1. ✅ Database migration: `supabase/migrations/20260123000001_add_lead_routing.sql`
2. ✅ Lead routing service: `src/lib/services/lead-routing.service.ts`
3. ✅ CSV bulk upload API: `src/app/api/leads/bulk-upload/route.ts`
4. ✅ DataShopper webhook: `src/app/api/webhooks/datashopper/route.ts`
5. ✅ Clay webhook: `src/app/api/webhooks/clay/route.ts`
6. ✅ Audience Labs integration: `src/lib/integrations/audience-labs.ts`
7. ✅ Audience Labs webhook: `src/app/api/webhooks/audience-labs/route.ts`
8. ✅ Inngest background jobs: `src/lib/inngest/functions/bulk-upload-processor.ts`
9. ✅ Inngest function exports: `src/inngest/functions/index.ts`
10. ✅ Inngest serve route: `src/app/api/inngest/route.ts`
11. ✅ Dependencies installed: `papaparse` and `@types/papaparse`
12. ✅ Environment variables documented: `.env.example`

---

## 📋 Pre-Deployment Checklist

### 1. Install Supabase CLI (if not already installed)

```bash
# macOS
brew install supabase/tap/supabase

# or via npm
npm install -g supabase
```

### 2. Link to Supabase Project

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-id

# Or if already initialized
cd /Users/adamwolfe/openinfo-platform
supabase db remote commit
```

### 3. Apply Database Migration

```bash
# Push migration to remote database
supabase db push

# Or apply manually via Supabase Dashboard:
# 1. Go to https://supabase.com/dashboard/project/your-project-id/sql
# 2. Copy contents of supabase/migrations/20260123000001_add_lead_routing.sql
# 3. Execute the SQL
```

### 4. Update Environment Variables

Add these new variables to your `.env.local` and Vercel project settings:

```bash
# DataShopper Webhook Secret (generate with: openssl rand -hex 32)
DATASHOPPER_WEBHOOK_SECRET=your_generated_secret

# Clay Webhook Secret (generate with: openssl rand -hex 32)
CLAY_WEBHOOK_SECRET=your_generated_secret

# Audience Labs Configuration
AUDIENCE_LABS_API_KEY=your_audience_labs_api_key
AUDIENCE_LABS_API_URL=https://api.audiencelabs.com/v1
AUDIENCE_LABS_WEBHOOK_SECRET=your_generated_secret
```

Generate secure secrets:
```bash
openssl rand -hex 32
```

### 5. Deploy to Vercel

```bash
# From project root
vercel --prod

# Or push to main branch if auto-deploy is configured
git add .
git commit -m "feat: add lead routing and bulk import system"
git push origin main
```

---

## 🔧 Post-Deployment Configuration

### 1. Configure Webhook Endpoints

After deployment, configure these webhook URLs in each service:

#### DataShopper
- Webhook URL: `https://yourdomain.com/api/webhooks/datashopper`
- Secret: Use `DATASHOPPER_WEBHOOK_SECRET` value
- Events: `leads.batch`, `leads.single`

#### Clay
- Webhook URL: `https://yourdomain.com/api/webhooks/clay`
- Secret: Use `CLAY_WEBHOOK_SECRET` value
- Events: `enrichment.completed`, `enrichment.failed`

#### Audience Labs
- Webhook URL: `https://yourdomain.com/api/webhooks/audience-labs`
- Secret: Use `AUDIENCE_LABS_WEBHOOK_SECRET` value
- Events: `import.batch`, `import.completed`, `import.failed`

### 2. Verify Inngest Functions Registered

1. Go to Inngest dashboard: https://app.inngest.com
2. Navigate to your app
3. Verify these new functions appear:
   - `bulk-upload-process`
   - `lead-enrich-from-datashopper`
   - `lead-import-from-audience-labs`

### 3. Test Webhook Signatures

Send test webhooks from each service to verify signature validation works:

```bash
# Test DataShopper webhook
curl -X POST https://yourdomain.com/api/webhooks/datashopper \
  -H "Content-Type: application/json" \
  -H "x-datashopper-signature: test" \
  -H "x-datashopper-timestamp: $(date +%s)000" \
  -d '{"event_type":"test"}'

# Test Clay webhook
curl -X POST https://yourdomain.com/api/webhooks/clay \
  -H "Content-Type: application/json" \
  -H "x-clay-signature: test" \
  -H "x-clay-timestamp: $(date +%s)000" \
  -d '{"event_type":"test"}'

# Test Audience Labs webhook
curl -X POST https://yourdomain.com/api/webhooks/audience-labs \
  -H "Content-Type: application/json" \
  -H "x-audiencelabs-signature: test" \
  -d '{"event_type":"test","timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'
```

---

## 🧪 Testing the System

### 1. Create Lead Routing Rules

Use the Supabase dashboard or API to create routing rules:

```sql
-- Example: Route service industry leads to specific workspace
INSERT INTO lead_routing_rules (
  workspace_id,
  rule_name,
  priority,
  conditions,
  destination_workspace_id,
  actions
) VALUES (
  'your-master-workspace-id',
  'Service Industry Routing',
  100,
  '{
    "industries": ["HVAC", "Plumbing", "Electrical", "Landscaping"],
    "countries": ["US"]
  }',
  'service-industry-workspace-id',
  '{
    "assign_to_workspace": true,
    "tag_with": ["service-industry"]
  }'
);

-- Example: Route real estate lawyer leads by region
INSERT INTO lead_routing_rules (
  workspace_id,
  rule_name,
  priority,
  conditions,
  destination_workspace_id,
  actions
) VALUES (
  'your-master-workspace-id',
  'Real Estate Lawyers - Northeast',
  90,
  '{
    "industries": ["Legal Services", "Real Estate"],
    "regions": ["Northeast"]
  }',
  'real-estate-northeast-workspace-id',
  '{
    "assign_to_workspace": true,
    "notify_via": ["email"],
    "tag_with": ["real-estate", "northeast"]
  }'
);
```

### 2. Test CSV Upload

Create a test CSV file (`test-leads.csv`):

```csv
full_name,email,company_name,company_industry,company_location_state,job_title
John Smith,john@example.com,ACME HVAC,HVAC,TX,Owner
Jane Doe,jane@lawfirm.com,Smith & Associates,Legal Services,NY,Partner
```

Upload via API:

```bash
curl -X POST https://yourdomain.com/api/leads/bulk-upload \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -F "file=@test-leads.csv" \
  -F "source=csv"
```

### 3. Test DataShopper Integration

```typescript
// In your application code
import { inngest } from '@/lib/inngest/client'

// Trigger lead from DataShopper
await inngest.send({
  name: 'lead/enrich-from-datashopper',
  data: {
    jobId: 'test-job-id',
    workspaceId: 'your-workspace-id',
    lead: {
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      company_name: 'Test Company',
      company_industry: 'HVAC',
      company_location: { state: 'CA', country: 'US' },
      // ... other fields
    }
  }
})
```

### 4. Monitor Routing

Query routing analytics:

```sql
-- Check routing distribution
SELECT
  destination_workspace_id,
  COUNT(*) as lead_count
FROM leads
WHERE routing_rule_id IS NOT NULL
GROUP BY destination_workspace_id;

-- View routing summary
SELECT
  routing_metadata->'routing_reason' as reason,
  COUNT(*) as count
FROM leads
WHERE routing_metadata IS NOT NULL
GROUP BY routing_metadata->'routing_reason';
```

---

## 🔍 Troubleshooting

### Webhook Signature Validation Fails

**Problem**: Webhooks return 401 "Invalid signature"

**Solutions**:
1. Verify webhook secret matches in both service and `.env`
2. Check timestamp is within 5-minute window
3. Ensure raw body is used for signature verification
4. Test with `event_type: 'test'` first

### Leads Not Routing Correctly

**Problem**: All leads go to source workspace, not routed

**Solutions**:
1. Verify routing rules exist: `SELECT * FROM lead_routing_rules WHERE is_active = true`
2. Check rule priority (higher priority = evaluated first)
3. Verify conditions match lead data exactly (case-sensitive)
4. Check RLS policies allow reading routing rules

### Bulk Upload Jobs Stuck in "Processing"

**Problem**: Job status never changes to "completed"

**Solutions**:
1. Check Inngest dashboard for failed function runs
2. Verify Inngest webhook endpoint is accessible
3. Check for errors in Vercel function logs
4. Manually trigger: `await inngest.send({ name: 'bulk-upload/process', data: {...} })`

### Duplicate Leads Created

**Problem**: Same lead inserted multiple times

**Solutions**:
1. Verify fingerprint generation is consistent
2. Check unique constraint on `(workspace_id, fingerprint)`
3. Ensure duplicate check runs before insert
4. Review bulk upload error logs

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Routing Performance**
   ```sql
   SELECT
     DATE_TRUNC('day', created_at) as date,
     COUNT(*) as total_leads,
     COUNT(routing_rule_id) as routed_leads,
     ROUND(COUNT(routing_rule_id)::numeric / COUNT(*) * 100, 2) as routing_rate
   FROM leads
   GROUP BY DATE_TRUNC('day', created_at)
   ORDER BY date DESC;
   ```

2. **Bulk Upload Success Rate**
   ```sql
   SELECT
     source,
     COUNT(*) as total_jobs,
     COUNT(*) FILTER (WHERE status = 'completed') as completed,
     COUNT(*) FILTER (WHERE status = 'failed') as failed,
     ROUND(AVG(successful_records::numeric / total_records * 100), 2) as avg_success_rate
   FROM bulk_upload_jobs
   GROUP BY source;
   ```

3. **Workspace Lead Distribution**
   ```sql
   SELECT
     w.name as workspace_name,
     COUNT(l.id) as lead_count,
     COUNT(l.id) FILTER (WHERE l.created_at > NOW() - INTERVAL '7 days') as leads_this_week
   FROM workspaces w
   LEFT JOIN leads l ON l.workspace_id = w.id
   GROUP BY w.id, w.name
   ORDER BY lead_count DESC;
   ```

### Inngest Function Monitoring

Monitor these metrics in Inngest dashboard:
- Function run success rate
- Average execution time
- Retry count
- Failed runs with error details

---

## 🚀 Production Best Practices

### 1. Rate Limiting

Implement rate limiting on bulk upload endpoint:

```typescript
// Add to route.ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 uploads per hour
})
```

### 2. Webhook Replay Protection

The current implementation includes timestamp validation (5-minute window). Consider:
- Storing processed webhook IDs in Redis
- Rejecting duplicate webhook IDs within 24 hours

### 3. Data Retention

Set up data retention policies:

```sql
-- Archive old bulk upload jobs (keep 90 days)
DELETE FROM bulk_upload_jobs
WHERE completed_at < NOW() - INTERVAL '90 days';

-- Archive routing logs (keep 1 year)
DELETE FROM leads
WHERE created_at < NOW() - INTERVAL '1 year'
AND delivery_status = 'delivered';
```

### 4. Alerts

Set up alerts for:
- Webhook signature validation failure rate > 5%
- Bulk upload job failure rate > 10%
- Routing rule match rate < 80%
- Inngest function failure rate > 5%

---

## 📝 API Documentation

### CSV Bulk Upload

**Endpoint**: `POST /api/leads/bulk-upload`

**Headers**:
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Body**:
- `file`: CSV file (max 10,000 rows for Pro plan, 100 for Free)
- `source`: `"csv"` (optional)

**Response**:
```json
{
  "success": true,
  "jobId": "uuid",
  "summary": {
    "total": 100,
    "successful": 95,
    "failed": 5,
    "routing": {
      "workspace-1": 60,
      "workspace-2": 35
    }
  }
}
```

### DataShopper Webhook

**Endpoint**: `POST /api/webhooks/datashopper`

**Headers**:
- `x-datashopper-signature`: HMAC-SHA256 signature
- `x-datashopper-timestamp`: Unix timestamp in milliseconds

**Events**:
- `leads.batch`: Batch of leads
- `leads.single`: Single lead
- `test`: Test event

### Clay Webhook

**Endpoint**: `POST /api/webhooks/clay`

**Headers**:
- `x-clay-signature`: HMAC-SHA256 signature
- `x-clay-timestamp`: Unix timestamp in milliseconds

**Events**:
- `enrichment.completed`: Enrichment successful
- `enrichment.failed`: Enrichment failed
- `test`: Test event

### Audience Labs Webhook

**Endpoint**: `POST /api/webhooks/audience-labs`

**Headers**:
- `x-audiencelabs-signature`: HMAC-SHA256 signature

**Events**:
- `import.batch`: Batch of leads (100 per batch)
- `import.completed`: Import job finished
- `import.failed`: Import job failed
- `test`: Test event

---

## ✅ Deployment Complete

Once all steps are completed, the system will:

1. ✅ Accept CSV uploads with automatic validation and routing
2. ✅ Receive leads from DataShopper via webhook
3. ✅ Enrich leads via Clay and receive enriched data
4. ✅ Import bulk leads from Audience Labs
5. ✅ Route all leads based on industry and geography
6. ✅ Process large uploads in background with Inngest
7. ✅ Track job progress and routing analytics
8. ✅ Support multi-tenant white-label workspaces

**Next Steps**:
1. Apply database migration
2. Configure webhook endpoints
3. Create routing rules
4. Test with sample data
5. Monitor in production

---

**Last Updated**: 2026-01-22
**Status**: Ready for deployment
