# System Architecture

## Overview

The platform is a multi-tenant B2B lead generation and email outreach system built with:
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + Auth)
- **Background Jobs**: Inngest for event-driven and scheduled tasks
- **External Services**: EmailBison (email delivery), Claude AI (enrichment/classification)

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Dashboard   │  │  Campaigns   │  │   Leads      │  │  Templates   │     │
│  │  Components  │  │  Components  │  │  Components  │  │  Components  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      API Routes (/api/*)                              │   │
│  │   /campaigns  /leads  /templates  /notifications  /exports           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SERVICES LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐   │
│  │  Campaign Services   │  │   Email Services     │  │  AI Services     │   │
│  │  - state-machine     │  │  - email-campaigns   │  │  - claude        │   │
│  │  - suppression       │  │  - email-composer    │  │  - enrichment    │   │
│  │  - send-limits       │  │                      │  │  - reply-class   │   │
│  │  - timezone-sched    │  │                      │  │                  │   │
│  │  - ab-testing        │  │                      │  │                  │   │
│  │  - conversation      │  │                      │  │                  │   │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────┘   │
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐   │
│  │  Audit Service       │  │  Notification Svc    │  │  Export Service  │   │
│  │  - audit logging     │  │  - preferences       │  │  - CSV/JSON      │   │
│  │  - security events   │  │  - digest queue      │  │  - leads/sends   │   │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATABASE (Supabase)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         Core Tables                                  │    │
│  │  workspaces  users  leads  email_campaigns  email_sends             │    │
│  │  campaign_leads  client_profiles  email_templates                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Campaign Tables                                 │    │
│  │  campaign_reviews  email_template_variants  ab_experiments          │    │
│  │  email_conversations  conversation_messages  suppressed_emails      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      System Tables                                   │    │
│  │  notifications  notification_preferences  workspace_settings        │    │
│  │  workspace_integrations  workspace_api_keys  onboarding_steps       │    │
│  │  failed_jobs  audit_logs  security_events                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  All tables have RLS policies for workspace isolation                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKGROUND JOBS (Inngest)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Campaign Pipeline                               │    │
│  │  campaign/status-changed → campaign/batch-enrich → campaign/lead-   │    │
│  │  added → campaign/compose-email → campaign/email-approved →         │    │
│  │  campaign/send-email → campaign/email-sent                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Scheduled Jobs (Cron)                           │    │
│  │  - activateScheduledCampaigns (every 15 min)                        │    │
│  │  - processCampaignSequences (every hour)                            │    │
│  │  - resetDailySendCounts (midnight UTC)                              │    │
│  │  - autoCompleteCampaigns (hourly)                                   │    │
│  │  - retryFailedJobs (every 30 min)                                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Reply Processing                                │    │
│  │  emailbison/reply-received → processReply → Claude classification   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  EmailBison  │  │   Claude AI  │  │    Stripe    │  │  GoHighLevel │     │
│  │  Email Send  │  │  Enrichment  │  │   Billing    │  │   CRM Sync   │     │
│  │  Webhooks    │  │  Reply Class │  │   Webhooks   │  │   OAuth      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Email Campaign Flow

### 1. Campaign Creation
```
User → Create Campaign UI → /api/campaigns POST
  → Create email_campaigns record (status: draft)
  → Select templates, configure targeting
  → Add value propositions and trust signals
```

### 2. Lead Addition
```
User → Add leads to campaign → /api/campaigns/[id]/leads POST
  → Create campaign_leads records (status: pending)
  → Emit campaign/lead-added event
```

### 3. Enrichment Pipeline
```
campaign/lead-added event → enrichCampaignLead function
  → Call Claude AI for research
  → Extract company_summary, recent_news, key_challenges
  → Update campaign_leads (status: ready, enrichment_data populated)
```

### 4. Review & Approval
```
User → Submit for review → campaign.status: pending_review
  → Internal review: approve/reject
  → Client review (optional)
  → campaign.status: approved
```

### 5. Activation
```
User → Activate campaign → campaign.status: active
  OR
Schedule → activateScheduledCampaigns cron → campaign.status: active
```

### 6. Sequence Processing
```
processCampaignSequences cron (hourly)
  → Find active campaigns
  → Get leads ready for send (timezone-aware)
  → Emit campaign/compose-email for each lead
```

### 7. Email Composition
```
campaign/compose-email event → composeCampaignEmail function
  → Select best template (intelligent matching)
  → Apply A/B variant (if experiment active)
  → Compose personalized email using enrichment data
  → Create email_sends record (status: pending_approval)
```

### 8. Sending
```
Auto-send or manual approval → email_sends.status: approved
  → campaign/send-email event
  → Check suppression list
  → Check daily send limits
  → Send via EmailBison
  → Update email_sends (status: sent, sent_at)
  → Update campaign_leads (current_step++, last_email_sent_at)
```

### 9. Reply Handling
```
EmailBison webhook → /api/webhooks/emailbison/reply POST
  → Emit emailbison/reply-received event
  → processReply function
  → Claude AI classification (sentiment, intent)
  → Update campaign_leads status
  → Create conversation thread
```

## Key Services

### Campaign State Machine
`src/lib/services/campaign/campaign-state-machine.ts`

Valid transitions:
```
draft → pending_review
pending_review → approved | rejected | draft
approved → scheduled | active | draft
rejected → draft
scheduled → active | paused | draft
active → paused | completed
paused → active | completed | draft
completed → draft
```

### Suppression Service
`src/lib/services/campaign/suppression.service.ts`

- Tracks suppressed emails (bounced, unsubscribed, spam-reported)
- Checks before sending
- Auto-adds on bounce/unsubscribe webhooks

### Send Limits Service
`src/lib/services/campaign/send-limits.service.ts`

- Campaign-level daily limits
- Workspace-level daily limits
- Automatic reset at midnight UTC

### Timezone Scheduling Service
`src/lib/services/campaign/timezone-scheduling.service.ts`

- Calculates optimal send time based on recipient timezone
- Respects business hours (9 AM - 6 PM recipient time)
- Respects campaign send window configuration

### A/B Testing Service
`src/lib/services/campaign/ab-testing.service.ts`

- Template variant management
- Experiment lifecycle
- Statistical significance calculation (Z-test)
- Auto-winner selection

### Conversation Service
`src/lib/services/campaign/conversation.service.ts`

- Thread grouping via subject normalization
- Message timeline
- Read/unread tracking

## Database Schema Highlights

### Multi-Tenant Isolation
Every table includes `workspace_id` with RLS policy:
```sql
CREATE POLICY "Workspace isolation" ON table_name
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE auth_user_id = auth.uid()
    )
  );
```

### Campaign Lead States
```
pending → enriching → ready → awaiting_approval → in_sequence
                                                      ↓
                                               replied/positive/negative/completed
                                                      ↓
                                                    bounced
```

### Email Send States
```
pending_approval → approved → sent → opened → clicked → replied
                                           ↓
                                        bounced
```

## Performance Considerations

### Database Indexes
- `campaign_leads(campaign_id, status)` - sequence processing
- `email_sends(campaign_id, status)` - batch operations
- `notifications(user_id, read_at)` - unread counts
- `leads(workspace_id, created_at)` - lead listing

### Inngest Throttling
- Email composition: 20/minute
- Email sending: 30/minute
- Enrichment: 10/minute
- Reply processing: 20/minute

### Caching
- React Query for client-side data caching
- Supabase connection pooling
- Template caching in memory during composition

## Security Measures

### Authentication
- Supabase Auth with @supabase/ssr
- Session-based authentication
- Role-based access control (admin, user, client)

### API Security
- All routes require authentication (except webhooks)
- Webhook signature verification
- Zod input validation on all endpoints
- Workspace isolation enforced on every query

### Data Protection
- API keys stored with SHA-256 hash
- Sensitive data masked in responses
- Audit logging for compliance
- Security event tracking

## Deployment Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Vercel      │────▶│    Supabase     │────▶│    Inngest      │
│   (Next.js)     │     │  (PostgreSQL)   │     │  (Background)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                                │
        ▼                                                ▼
┌─────────────────┐                             ┌─────────────────┐
│   EmailBison    │                             │   Claude AI     │
│   (Email API)   │                             │  (Anthropic)    │
└─────────────────┘                             └─────────────────┘
```
