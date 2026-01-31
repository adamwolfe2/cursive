# Production Environment Variables Checklist

**Status**: Phase 4 - Database & Security complete. Environment configuration in progress.

## Critical Variables (MUST configure before production)

### 1. Supabase (✅ Already configured in Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

### 2. Application URLs
```
NEXT_PUBLIC_APP_URL=https://app.meetcursive.com
NEXT_PUBLIC_PRODUCTION_URL=https://app.meetcursive.com
NEXT_PUBLIC_APP_NAME=Cursive
```

### 3. Email Service (REQUIRED for notifications)
```
RESEND_API_KEY=re_...
EMAIL_FROM=Cursive <notifications@meetcursive.com>
SUPPORT_EMAIL=support@meetcursive.com
```
**Action**: Get Resend API key from https://resend.com/api-keys

### 4. Stripe (REQUIRED for billing & payouts)
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...
```
**Actions**:
- Get keys from https://dashboard.stripe.com/apikeys
- Configure webhook endpoint: `https://app.meetcursive.com/api/webhooks/stripe`
- Enable Stripe Connect for partner payouts

### 5. Inngest (Background jobs)
```
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
```
**Action**: Get keys from https://www.inngest.com/

## High Priority Variables (Needed for core features)

### 6. AI Services
```
ANTHROPIC_API_KEY=sk-ant-...
```
**Action**: Get key from https://console.anthropic.com/

### 7. Data Enrichment Providers
```
# Audience Labs (Lead imports)
AUDIENCE_LABS_API_KEY=...
AUDIENCE_LABS_WEBHOOK_SECRET=...

# Clay (Contact enrichment)
CLAY_API_KEY=...
CLAY_WEBHOOK_SECRET=...

# DataShopper (Intent signals)
DATASHOPPER_API_KEY=...
DATASHOPPER_WEBHOOK_SECRET=...
```
**Actions**:
- Configure webhook endpoints for each provider
- Audience Labs: `https://app.meetcursive.com/api/webhooks/audience-labs`
- Clay: `https://app.meetcursive.com/api/webhooks/clay`
- DataShopper: `https://app.meetcursive.com/api/webhooks/datashopper`

### 8. Geocoding (Address validation)
```
GOOGLE_MAPS_API_KEY=AIza...
MAPBOX_ACCESS_TOKEN=pk....
```

### 9. Email Verification
```
MILLIONVERIFIER_API_KEY=...
EMAIL_VERIFICATION_KILL_SWITCH=false
```

## Medium Priority (Optional but recommended)

### 10. Email Bison (AI Email Agent)
```
EMAILBISON_API_KEY=...
EMAILBISON_WEBHOOK_SECRET=...
EMAILBISON_DEFAULT_ACCOUNT_ID=...
```
**Action**: Configure webhook: `https://app.meetcursive.com/api/webhooks/emailbison`

### 11. Monitoring
```
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

### 12. CRM Integrations
```
GHL_CLIENT_ID=...
GHL_CLIENT_SECRET=...
```

## Low Priority (Can configure later)

### 13. SMS & Voice
```
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

### 14. Feature Flags
```
ENABLE_AI_FEATURES=true
ENABLE_VOICE_FEATURES=false
ENABLE_SMS_FEATURES=false
CAMPAIGN_MAX_EMAILS_PER_DAY=200
CAMPAIGN_DEFAULT_EMAIL_DELAY_HOURS=24
CAMPAIGN_ENABLE_AI_MATCHING=true
```

---

## Webhook Endpoints Summary

Configure these webhook URLs with your providers:

| Provider | Webhook URL | Secret Env Var |
|----------|-------------|----------------|
| Stripe | `https://app.meetcursive.com/api/webhooks/stripe` | `STRIPE_WEBHOOK_SECRET` |
| Audience Labs | `https://app.meetcursive.com/api/webhooks/audience-labs` | `AUDIENCE_LABS_WEBHOOK_SECRET` |
| Clay | `https://app.meetcursive.com/api/webhooks/clay` | `CLAY_WEBHOOK_SECRET` |
| DataShopper | `https://app.meetcursive.com/api/webhooks/datashopper` | `DATASHOPPER_WEBHOOK_SECRET` |
| Email Bison | `https://app.meetcursive.com/api/webhooks/emailbison` | `EMAILBISON_WEBHOOK_SECRET` |
| Inngest | `https://app.meetcursive.com/api/inngest` | `INNGEST_SIGNING_KEY` |

---

## Next Steps

1. ✅ **Database migrations applied** (Phase 4 complete)
2. ⏳ **Configure critical env vars in Vercel** (Resend, Stripe webhooks)
3. ⏳ **Wire up email notifications** in webhook handlers
4. ⏳ **Test webhook endpoints** with provider test events
5. ⏳ **Create admin seeding script** to set up first admin user

---

**Last Updated**: 2026-01-30
**Phase**: 4 - Database & Security
