# Feature Flags & Configuration

## Environment-Based Configuration

### Core Settings

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `http://localhost:3000` | Yes |
| `NEXT_PUBLIC_APP_NAME` | Application name | `OpenInfo` | No |

### Database

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | - | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | - | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | - | Yes |

### Email Service (EmailBison)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EMAILBISON_API_KEY` | EmailBison API key | - | Yes (for email) |
| `EMAILBISON_API_URL` | EmailBison API base URL | `https://api.emailbison.com` | No |
| `EMAILBISON_WEBHOOK_SECRET` | Webhook signature secret | - | Yes (for webhooks) |

### AI Services

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ANTHROPIC_API_KEY` | Claude API key | - | Yes (for enrichment) |
| `OPENAI_API_KEY` | OpenAI API key (fallback) | - | No |

### Billing (Stripe)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `STRIPE_SECRET_KEY` | Stripe secret key | - | Yes (for billing) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | - | Yes (for billing) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature secret | - | Yes (for webhooks) |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Pro plan monthly price ID | - | Yes (for billing) |
| `STRIPE_PRO_YEARLY_PRICE_ID` | Pro plan yearly price ID | - | No |

### Background Jobs (Inngest)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `INNGEST_EVENT_KEY` | Inngest event key | - | Yes |
| `INNGEST_SIGNING_KEY` | Inngest signing key | - | Yes |

## Feature Toggles

### Campaign Features

| Feature | Variable | Default | Description |
|---------|----------|---------|-------------|
| Auto-send emails | `campaign.auto_send` | `false` | Auto-send approved emails without manual trigger |
| A/B Testing | Built-in | Enabled | Template variant testing |
| Send Windows | `campaign.schedule_config` | Business hours | Restrict sending to specific hours |
| Sequence Steps | `campaign.sequence_steps` | `3` | Number of follow-up emails |

### Email Features

| Feature | Variable | Default | Description |
|---------|----------|---------|-------------|
| Email tracking | Built-in | Enabled | Open and click tracking |
| Link rewriting | Built-in | Enabled | Tracking links |
| Unsubscribe link | Built-in | Required | CAN-SPAM compliance |

### Workspace Features

| Feature | Database Field | Default | Description |
|---------|----------------|---------|-------------|
| Daily send limit | `workspace_settings.daily_send_limit` | `1000` | Max emails per day |
| Send window start | `workspace_settings.send_window_start` | `09:00` | Earliest send time |
| Send window end | `workspace_settings.send_window_end` | `18:00` | Latest send time |
| Send days | `workspace_settings.send_days` | `[1,2,3,4,5]` | Days to send (Mon-Fri) |

### Notification Features

| Feature | Database Field | Default | Description |
|---------|----------------|---------|-------------|
| Email notifications | `notification_preferences.email_*` | `true` | Email notifications |
| In-app notifications | `notification_preferences.in_app_*` | `true` | In-app notifications |
| Quiet hours | `notification_preferences.quiet_hours_*` | Disabled | Suppress during hours |

## Rate Limits

### API Rate Limits

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| General API | 100 requests | Per minute |
| Export endpoints | 10 requests | Per minute |
| Import endpoints | 5 requests | Per minute |
| Webhook endpoints | Unlimited | - |

### Inngest Throttling

| Function | Limit | Description |
|----------|-------|-------------|
| `composeCampaignEmail` | 20/minute | Email composition |
| `sendApprovedEmail` | 30/minute | Email sending |
| `enrichCampaignLead` | 10/minute | Lead enrichment |
| `processReply` | 20/minute | Reply processing |

### Service Limits

| Service | Limit | Description |
|---------|-------|-------------|
| EmailBison | Varies by plan | Email sending |
| Claude API | Based on tier | AI enrichment |
| Supabase | Based on plan | Database connections |

## Plan-Based Features

### Free Plan
- 3 credits/day
- 1 active query
- Basic lead data
- Email notifications only

### Pro Plan ($50/month)
- 1000 credits/day
- 5 active queries
- Full enrichment
- Multi-channel delivery
- Export capabilities
- API access

### Enterprise (Custom)
- Unlimited credits
- Unlimited queries
- Custom integrations
- Dedicated support
- SLA guarantees

## Debug Flags

### Development Mode

```typescript
// Check if in development
if (process.env.NODE_ENV === 'development') {
  // Enable verbose logging
  // Skip rate limiting
  // Use mock services
}
```

### Mock Services

| Variable | Description | Usage |
|----------|-------------|-------|
| `MOCK_EMAIL_SEND` | Skip actual email sending | Testing |
| `MOCK_AI_ENRICHMENT` | Use mock enrichment data | Testing |
| `MOCK_WEBHOOKS` | Log webhooks without processing | Testing |

## Configuration Priority

1. Environment variables (highest priority)
2. Workspace settings (database)
3. User preferences (database)
4. System defaults (code)

## Adding New Features

When adding a new feature flag:

1. **Add environment variable** (if needed):
   - Update `.env.example` with new variable
   - Document in this file

2. **Add database field** (if user-configurable):
   - Create migration
   - Add to workspace_settings or user_preferences

3. **Add type definition**:
   - Update `src/types/` with new types

4. **Add API support**:
   - Add to settings API if user-configurable

5. **Document**:
   - Update this file
   - Update README if user-facing
