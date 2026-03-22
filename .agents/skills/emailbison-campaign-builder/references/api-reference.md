# EmailBison API Quick Reference

## Base Configuration
- **API URL:** `process.env.EMAILBISON_API_URL` (default: `https://send.meetcursive.com`)
- **Auth:** Bearer token via `process.env.EMAILBISON_API_KEY`
- **Integration file:** `src/lib/integrations/emailbison.ts`

## Key Endpoints Used

### Campaign Lifecycle
```
POST   /api/campaigns                              → Create campaign
GET    /api/campaigns/:id                           → Get campaign details
PATCH  /api/campaigns/:id                           → Update settings
POST   /api/campaigns/:id/pause                     → Pause campaign
```

### Sequence Steps
```
POST   /api/campaigns/sequence-steps                → Add step (campaign_id in body)
DELETE /api/campaigns/sequence-steps/:id             → Delete step
POST   /api/campaigns/sequence-steps/:id/send-test  → Test email
PATCH  /api/campaigns/:id/sequences/variants/:vid   → Toggle variant
```

### Leads
```
POST   /api/campaigns/:id/leads                     → Add leads to campaign
POST   /api/campaigns/:id/leads/move                → Move leads between campaigns
POST   /api/leads                                   → Create/update lead (global)
```

### Sender Emails
```
GET    /api/sender-emails?status=connected           → List connected senders
POST   /api/campaigns/:id/attach-sender-emails       → Assign senders to campaign
POST   /api/campaigns/:id/remove-sender-emails       → Remove senders
```

### Scheduling
```
GET    /api/campaigns/schedule/templates             → List schedule templates
POST   /api/campaigns/:id/create-schedule-from-template → Apply template
POST   /api/campaigns/:id/schedule                   → Custom schedule
```

### Tags
```
POST   /api/tags                                     → Create tag
POST   /api/tags/attach-to-leads                     → Tag leads
POST   /api/tags/remove-from-leads                   → Untag leads
```

## Lead Data Format
```typescript
interface EmailBisonLead {
  email: string              // Required
  first_name?: string
  last_name?: string
  company_name?: string
  custom_variables?: Array<{
    name: string
    value: string
  }>
}
```

## Campaign Settings Defaults (Cold Email)
```typescript
{
  max_emails_per_day: 100,
  max_new_leads_per_day: 50,
  plain_text: true,
  open_tracking: false,
  reputation_building: true,
  can_unsubscribe: true,
}
```

## Default Schedule
```typescript
{
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: false,
  sunday: false,
  start_hour: 8,
  end_hour: 17,
  timezone: 'America/New_York',
}
```

## Sequence Step Format
```typescript
{
  step_number: 1,           // Sequential from 1
  subject: "Subject line",
  body: "Email body with {{firstName}} merge var",
  wait_days: 3,             // Days to wait before sending (relative to previous step)
}
```

## Rate Limiting
- Add 200ms delay between sequential API calls
- Batch lead uploads (max ~1000 per request recommended)
- Campaign creation is idempotent by name within a short window
