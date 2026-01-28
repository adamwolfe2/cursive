# Jobs Runbook

**Generated**: 2026-01-28
**Scope**: Background job operations for Lead Marketplace

---

## 1. Overview

All background jobs are managed through **Inngest**. Jobs are organized by domain:

| Domain | Jobs | Schedule |
|--------|------|----------|
| Email Verification | 4 | Mixed (cron + event) |
| Partner Payouts | 4 | Weekly + daily |
| Marketplace Scoring | 5 | Daily + monthly |
| Partner Uploads | 2 | Event + cron |

---

## 2. Job Catalog

### 2.1 Email Verification Jobs

#### `processEmailVerificationQueue`
**Schedule**: Every 5 minutes
**Purpose**: Process pending email verifications via MillionVerifier

```typescript
// Trigger
{ cron: '*/5 * * * *' }

// Configuration
{
  batchSize: 50,
  maxAttempts: 3,
  killSwitch: process.env.EMAIL_VERIFICATION_KILL_SWITCH
}
```

**Manual Trigger**:
```bash
curl -X POST https://app.inngest.com/api/v1/events \
  -H "Authorization: Bearer $INNGEST_EVENT_KEY" \
  -d '{"name": "marketplace/verification.process", "data": {}}'
```

**Troubleshooting**:
- Check `EMAIL_VERIFICATION_KILL_SWITCH` env var
- Verify MillionVerifier API key
- Check `email_verification_queue` table for stuck items

---

#### `queueNewLeadsForVerification`
**Schedule**: Event-triggered (on upload completion)
**Purpose**: Add new leads to verification queue

```typescript
// Trigger
{ event: 'marketplace/upload.completed' }
```

---

#### `reverifyStaleLeads`
**Schedule**: Daily at 3 AM
**Purpose**: Re-verify leads older than 60 days

```typescript
// Trigger
{ cron: '0 3 * * *' }
```

---

#### `updatePartnerVerificationRates`
**Schedule**: Daily at 4 AM
**Purpose**: Update partner verification rate metrics

```typescript
// Trigger
{ cron: '0 4 * * *' }
```

---

### 2.2 Partner Payout Jobs

#### `weeklyPartnerPayouts`
**Schedule**: Monday at 2 AM
**Purpose**: Process weekly payouts to partners

```typescript
// Trigger
{ cron: '0 2 * * 1' }

// Configuration
{
  minPayoutAmount: 25.00,
  stripeConnectEnabled: true
}
```

**Manual Trigger**:
```bash
curl -X POST https://app.inngest.com/api/v1/events \
  -H "Authorization: Bearer $INNGEST_EVENT_KEY" \
  -d '{"name": "marketplace/payout.weekly", "data": {}}'
```

**Troubleshooting**:
- Check partner Stripe Connect account status
- Verify minimum payout threshold
- Check `payouts` table for failed attempts
- Review `idempotency_key` for duplicates

---

#### `triggerManualPayout`
**Schedule**: Event-triggered (admin action)
**Purpose**: Process payout for specific partner

```typescript
// Trigger
{ event: 'marketplace/payout.manual' }

// Data
{ partnerId: string }
```

---

#### `dailyCommissionRelease`
**Schedule**: Daily at 1 AM
**Purpose**: Move commissions past holdback to payable

```typescript
// Trigger
{ cron: '0 1 * * *' }

// Configuration
{
  holdbackDays: 7
}
```

---

#### `reconcilePayouts`
**Schedule**: Weekly on Sunday at 4 AM
**Purpose**: Reconcile payouts with Stripe

```typescript
// Trigger
{ cron: '0 4 * * 0' }
```

---

### 2.3 Marketplace Scoring Jobs

#### `dailyFreshnessDecay`
**Schedule**: Daily at midnight
**Purpose**: Update all lead freshness scores

```typescript
// Trigger
{ cron: '0 0 * * *' }

// Configuration
{
  maxScore: 100,
  midpointDays: 30,
  steepness: 0.15,
  floor: 15
}
```

**Manual Trigger**:
```bash
curl -X POST https://app.inngest.com/api/v1/events \
  -H "Authorization: Bearer $INNGEST_EVENT_KEY" \
  -d '{"name": "marketplace/freshness.decay", "data": {}}'
```

---

#### `dailyPartnerScoreCalculation`
**Schedule**: Daily at 2 AM
**Purpose**: Calculate partner scores from metrics

```typescript
// Trigger
{ cron: '0 2 * * *' }

// Scoring Formula
score = (
  verificationRate * 0.40 +
  freshnessAtSale * 0.25 +
  dataCompleteness * 0.20 +
  (100 - duplicateRate) * 0.15
)
```

---

#### `monthlyVolumeBonusUpdate`
**Schedule**: 1st of month at 3 AM
**Purpose**: Calculate monthly volume bonuses

```typescript
// Trigger
{ cron: '0 3 1 * *' }

// Configuration
{
  volumeThreshold: 500,
  bonusRate: 0.05
}
```

---

#### `processReferralMilestones`
**Schedule**: Daily at 5 AM
**Purpose**: Check and award referral milestones

```typescript
// Trigger
{ cron: '0 5 * * *' }
```

---

#### `updatePartnerDataCompleteness`
**Schedule**: Daily at 6 AM
**Purpose**: Update data completeness metrics

```typescript
// Trigger
{ cron: '0 6 * * *' }
```

---

### 2.4 Partner Upload Jobs

#### `processPartnerUpload`
**Schedule**: Event-triggered
**Purpose**: Process large CSV uploads in chunks

```typescript
// Trigger
{ event: 'partner/upload.process' }

// Configuration
{
  chunkSize: 1000,
  maxConcurrent: 5,
  retries: 3
}
```

**Data**:
```json
{
  "batch_id": "uuid",
  "partner_id": "uuid",
  "storage_path": "partner-uploads/..."
}
```

---

#### `retryStatledUploads`
**Schedule**: Every 10 minutes
**Purpose**: Retry uploads that have stalled

```typescript
// Trigger
{ cron: '*/10 * * * *' }

// Configuration
{
  stallThresholdMinutes: 5,
  maxRetries: 3
}
```

---

## 3. Job Health Monitoring

### Dashboard URL
```
https://app.inngest.com/env/production/functions
```

### Key Metrics

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Success Rate | >99% | 95-99% | <95% |
| Avg Duration | <30s | 30-60s | >60s |
| Queue Depth | <100 | 100-500 | >500 |
| Error Rate | <1% | 1-5% | >5% |

### Alerts

Configure in Inngest dashboard:
- Function failure rate > 5%
- Function duration > 5 minutes
- Concurrency limit reached
- Event processing delayed > 10 minutes

---

## 4. Common Operations

### Pause All Jobs (Emergency)

1. Go to Inngest dashboard
2. Click environment settings
3. Toggle "Pause all functions"

Or via CLI:
```bash
inngest env pause --env production
```

### Restart Failed Job

```bash
curl -X POST https://app.inngest.com/api/v1/events \
  -H "Authorization: Bearer $INNGEST_EVENT_KEY" \
  -d '{
    "name": "inngest/function.invoked",
    "data": {
      "function_id": "partner-upload-processor",
      "run_id": "01HXYZ..."
    }
  }'
```

### Check Job Status

```bash
# Via Inngest API
curl https://app.inngest.com/api/v1/runs/01HXYZ... \
  -H "Authorization: Bearer $INNGEST_API_KEY"
```

### Clear Stuck Queue

```sql
-- Email verification queue
UPDATE email_verification_queue
SET status = 'pending', attempts = 0
WHERE status = 'processing'
AND started_at < NOW() - interval '1 hour';

-- Upload batches
UPDATE partner_upload_batches
SET status = 'pending', retry_count = retry_count + 1
WHERE status = 'processing'
AND updated_at < NOW() - interval '30 minutes';
```

---

## 5. Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `INNGEST_EVENT_KEY` | Event publishing key |
| `INNGEST_SIGNING_KEY` | Webhook signature verification |
| `MILLIONVERIFIER_API_KEY` | Email verification API |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Database access |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `EMAIL_VERIFICATION_KILL_SWITCH` | `false` | Disable email verification |
| `PAYOUT_MIN_AMOUNT` | `25` | Minimum payout threshold |
| `FRESHNESS_FLOOR` | `15` | Minimum freshness score |

---

## 6. Troubleshooting Guide

### Job Not Running

1. Check Inngest dashboard for function status
2. Verify cron expression is correct
3. Check for deployment issues
4. Review function logs

### Job Failing Repeatedly

1. Check error message in Inngest logs
2. Verify environment variables
3. Check external service status (Stripe, MillionVerifier)
4. Review database connectivity

### Job Running Too Slow

1. Check concurrent execution count
2. Review batch size configuration
3. Check database query performance
4. Consider increasing timeout

### Duplicate Processing

1. Verify idempotency keys are working
2. Check `processed_webhook_events` table
3. Review Inngest event deduplication
4. Check for race conditions

---

## 7. Job Dependencies

```
┌─────────────────────────────────────────────────────────┐
│                    Daily Schedule                        │
└─────────────────────────────────────────────────────────┘
         │
         ├─ 00:00 ─ dailyFreshnessDecay
         │              │
         ├─ 01:00 ─ dailyCommissionRelease
         │              │
         ├─ 02:00 ─ dailyPartnerScoreCalculation
         │              │
         ├─ 03:00 ─ reverifyStaleLeads
         │              │
         ├─ 04:00 ─ updatePartnerVerificationRates
         │              │
         ├─ 05:00 ─ processReferralMilestones
         │              │
         └─ 06:00 ─ updatePartnerDataCompleteness

┌─────────────────────────────────────────────────────────┐
│                   Weekly Schedule                        │
└─────────────────────────────────────────────────────────┘

         ├─ Sun 04:00 ─ reconcilePayouts
         │
         └─ Mon 02:00 ─ weeklyPartnerPayouts

┌─────────────────────────────────────────────────────────┐
│                   Monthly Schedule                       │
└─────────────────────────────────────────────────────────┘

         └─ 1st 03:00 ─ monthlyVolumeBonusUpdate
```

---

## 8. Recovery Procedures

### Email Verification Backlog

```sql
-- Check queue depth
SELECT status, COUNT(*) FROM email_verification_queue GROUP BY status;

-- Reset stuck items
UPDATE email_verification_queue
SET status = 'pending', attempts = 0, next_retry_at = NOW()
WHERE status = 'processing' AND started_at < NOW() - interval '1 hour';

-- Increase batch size temporarily
-- In Inngest function, set batchSize: 100
```

### Payout Failure Recovery

1. Check Stripe Connect status for affected partners
2. Verify bank account details
3. Reset payout to `pending`:
```sql
UPDATE payouts
SET status = 'pending', stripe_transfer_id = NULL
WHERE id = 'payout-id' AND status = 'failed';
```
4. Trigger manual payout via Inngest event

### Upload Processing Failure

1. Check `partner_upload_batches` status
2. If file still in storage, retry:
```sql
UPDATE partner_upload_batches
SET status = 'pending', retry_count = retry_count + 1
WHERE id = 'batch-id';
```
3. Trigger reprocessing:
```bash
curl -X POST https://app.inngest.com/api/v1/events \
  -d '{"name": "partner/upload.process", "data": {"batch_id": "...", "partner_id": "...", "storage_path": "..."}}'
```

---

## 9. Performance Tuning

### Batch Sizes

| Job | Default | Min | Max | Recommendation |
|-----|---------|-----|-----|----------------|
| Email Verification | 50 | 10 | 100 | 50 for normal, 100 for backlog |
| Upload Processing | 1000 | 500 | 2000 | 1000 for <50k, 2000 for >50k |
| Freshness Decay | All | - | - | Use SQL function for bulk update |

### Concurrency Limits

| Job | Limit | Reason |
|-----|-------|--------|
| Partner Upload | 5 | Memory constraints |
| Email Verification | 3 | API rate limits |
| Payouts | 1 | Prevent race conditions |

### Timeouts

| Job | Default | Max |
|-----|---------|-----|
| Email Verification | 2 min | 5 min |
| Upload Processing | 10 min | 30 min |
| Payouts | 5 min | 10 min |
| Scoring | 5 min | 15 min |

---

## 10. Incident Response

### Job System Down

1. Check Inngest status page
2. Verify webhook endpoint accessibility
3. Check Vercel function logs
4. Contact Inngest support if needed

### Critical Job Failure

1. Pause affected function
2. Assess data impact
3. Fix underlying issue
4. Replay failed events if needed
5. Resume function

### Data Corruption

1. Stop all related jobs immediately
2. Identify affected records
3. Restore from backup if needed
4. Fix root cause
5. Resume with monitoring

---

*End of Jobs Runbook*
