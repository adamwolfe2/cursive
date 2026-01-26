# Cursive Platform - Production Deployment Guide

This document covers Phases 28-40 requirements for production deployment.

## Phase 28-32: Security & Data Integrity

### Authentication Security
- [x] Supabase SSR patterns implemented
- [x] Session refresh on each request
- [x] Role-based access control (owner > admin > member)
- [x] Admin authentication via platform_admins table

### RLS Policy Coverage
- [x] workspaces - Workspace isolation
- [x] users - Multi-level policies
- [x] leads - Workspace isolation
- [x] credit_usage - Workspace isolation
- [x] export_jobs - Workspace isolation
- [x] integrations - Workspace isolation
- [x] partners - Admin-only access (Migration 20260124000012)
- [x] payouts - Admin-only access (Migration 20260124000012)
- [x] payout_requests - Admin-only access
- [x] partner_earnings - Admin-only access
- [x] lead_conversions - Workspace-scoped + admin access

### Input Validation
- [x] Zod schemas for all API endpoints
- [x] HTML sanitization helpers
- [x] SQL injection prevention
- [x] XSS prevention

### Rate Limiting
- [x] In-memory rate limiting (development)
- [ ] Redis-backed rate limiting (production - see below)

### Data Backup
- [ ] Configure Supabase daily backups
- [ ] Document retention policy (30 days recommended)
- [ ] Point-in-time recovery (PITR) enabled

## Phase 33-37: Production Deployment

### Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Inngest
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...

# Email
RESEND_API_KEY=re_...
EMAILBISON_API_KEY=...

# Scraping Services
FIRECRAWL_API_KEY=fc-...
TAVILY_API_KEY=tvly-...

# Application
NEXT_PUBLIC_APP_URL=https://meetcursive.com
```

### Redis Configuration (Production Rate Limiting)

```typescript
// src/lib/redis/client.ts
import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL!)

// Rate limit configuration
export const rateLimit = {
  windowMs: 60000, // 1 minute
  max: 60, // requests per window
}
```

Add Redis URL to environment:
```bash
REDIS_URL=redis://user:password@host:6379
```

### Vercel Deployment Configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "regions": ["iad1"],
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Domain Configuration

1. Add DNS records:
   - A record: @ → Vercel IP
   - CNAME: www → cname.vercel-dns.com

2. Configure SSL certificate (automatic via Vercel)

3. Set up email domain authentication:
   - SPF record for Resend
   - DKIM records for email deliverability

### Stripe Webhook Configuration

1. Create production webhook endpoint:
   - URL: `https://meetcursive.com/api/webhooks/stripe`
   - Events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`

2. Add webhook secret to environment variables

### Inngest Production Setup

1. Deploy Inngest functions:
   ```bash
   npx inngest-cli deploy
   ```

2. Configure function concurrency limits:
   - lead-enrichment: 10 concurrent
   - webhook-delivery: 20 concurrent
   - website-scraper: 5 concurrent

### Monitoring & Alerting

1. **Sentry** for error tracking:
   ```bash
   SENTRY_DSN=https://...
   ```

2. **Vercel Analytics** for performance monitoring

3. **Supabase Dashboard** for database monitoring

### Pre-Launch Checklist

- [ ] All environment variables configured
- [ ] Stripe webhooks verified
- [ ] Email deliverability tested
- [ ] SSL certificate active
- [ ] Database backups verified
- [ ] Rate limiting tested
- [ ] Error monitoring active
- [ ] Log drain configured
- [ ] CDN configured for static assets

## Phase 38-40: Post-Launch Optimization

### Performance Monitoring

1. Set up Vercel Analytics
2. Configure Core Web Vitals monitoring
3. Database query performance tracking

### Lead Delivery SLA

Target: 99.9% uptime for lead delivery

Monitoring:
- Webhook delivery success rate
- Email notification delivery rate
- Average delivery time

### Partner Portal Metrics

- Track partner lead upload volume
- Monitor payout processing time
- Track partner earnings trends

### Business Intelligence

1. Set up analytics dashboards in Supabase
2. Configure automated reports
3. Track key business metrics:
   - Monthly recurring revenue (MRR)
   - Lead conversion rates
   - Partner acquisition cost
   - Customer lifetime value (LTV)

## Rollback Procedures

### Database Rollback

```bash
# Restore from Supabase backup
supabase db restore --backup-id <backup-id>
```

### Application Rollback

```bash
# Vercel deployment rollback
vercel rollback <deployment-id>
```

## Incident Response

1. **P1 (Critical)**: Lead delivery down
   - Response time: 15 minutes
   - Resolution target: 1 hour

2. **P2 (High)**: Payment processing issues
   - Response time: 30 minutes
   - Resolution target: 4 hours

3. **P3 (Medium)**: Feature degradation
   - Response time: 2 hours
   - Resolution target: 24 hours

## Security Contacts

- Platform Admin: adam@meetcursive.com
- Security Issues: security@meetcursive.com
