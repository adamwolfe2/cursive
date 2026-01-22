# Phase 9: Settings & Integrations Documentation

## Overview

Phase 9 implements settings pages for profile management, notifications, security, and third-party integrations including Slack and Zapier for multi-channel lead delivery.

## Pages Structure

```
src/app/(dashboard)/
├── settings/
│   ├── page.tsx                # Profile settings
│   ├── notifications/page.tsx   # Notification preferences
│   ├── security/page.tsx        # Security & password
│   └── billing/page.tsx         # Billing (from Phase 8)
└── integrations/page.tsx       # Third-party integrations
```

## Features

### 1. Profile Settings (`/settings`)

**Features**:
- Update full name
- Display email (read-only)
- Workspace information display
- Referral code and link with copy buttons
- Credits remaining counter
- Plan badge with upgrade link

**Navigation Tabs**:
- Profile (active)
- Notifications
- Security
- Billing

**Form Submission**:
- Uses TanStack Query mutation
- Calls PATCH /api/users/me
- Shows success/error messages
- Auto-refreshes data on success

**Referral System**:
- Copy referral code button
- Copy referral link button
- Format: `https://domain.com/signup?ref={code}`

### 2. Notification Settings (`/settings/notifications`)

**Email Notifications**:
- Lead Delivery Emails toggle
- Weekly Digest toggle
- Master "All Email Notifications" toggle

**Slack Notifications**:
- Enable/disable Slack notifications
- Requires Slack connection
- Warning if not connected with link to integrations page

**Notification Preferences**:
- Display notification email address (read-only)
- All toggles use switch UI components

**State Management**:
- Real-time toggle updates
- Saves immediately on change
- Success notifications

### 3. Security Settings (`/settings/security`)

**Change Password Form**:
- Current password field
- New password field (min 8 characters)
- Confirm password field
- Validation before submission
- POST /api/auth/change-password

**Active Sessions**:
- Display current session
- Last activity timestamp
- Email address
- "Active" badge

**Sign Out**:
- Sign out button
- Redirects to login page

**Delete Account**:
- Danger zone with red styling
- Confirmation dialog
- Placeholder for future implementation

### 4. Integrations Page (`/integrations`)

**Available Integrations**:
- Slack - Multi-channel lead notifications
- Zapier - Connect to 5,000+ apps

**Coming Soon Section**:
- Salesforce
- HubSpot
- Pipedrive
- Google Sheets
- Microsoft Teams
- Discord

**Custom Webhooks**:
- Webhook URL input
- Pro plan required
- Save webhook button

**Info Banner**:
- Explains multi-channel delivery
- Pro plan requirement note

## Components

### SlackIntegration Component

**Location**: `src/components/integrations/slack-integration.tsx`

**Props**:
```typescript
interface SlackIntegrationProps {
  user: any
  isPro: boolean
}
```

**Features**:
- Visual status indicator (connected/disconnected)
- Connect button (opens OAuth flow)
- Disconnect button with confirmation
- Test connection button
- Pro plan requirement check
- Upgrade prompt for free users

**Connected State**:
- Green success banner
- Webhook URL display (truncated)
- Notification types badges
- Configuration section

**Actions**:
1. **Connect**: Redirects to `/api/integrations/slack/oauth`
2. **Disconnect**: POST `/api/integrations/slack/disconnect`
3. **Test**: Send test notification to Slack

**Pro Plan Gating**:
- Shows yellow warning if not Pro
- Disables connect button
- Links to pricing page

### ZapierIntegration Component

**Location**: `src/components/integrations/zapier-integration.tsx`

**Props**:
```typescript
interface ZapierIntegrationProps {
  user: any
  isPro: boolean
}
```

**Features**:
- Generate webhook URL
- Show/hide webhook URL
- Copy to clipboard
- Revoke webhook
- Usage instructions
- Payload example

**Webhook Generation**:
- POST `/api/integrations/zapier/generate`
- Returns unique webhook URL
- Stores in user.zapier_webhook_url

**Webhook Display**:
- Monospace font for URL
- Copy button
- Collapsible section

**Instructions Section**:
- 6-step Zapier setup guide
- Blue info box styling
- JSON payload example with syntax highlighting

**Actions**:
1. **Generate**: Create new webhook URL
2. **Revoke**: DELETE webhook URL
3. **Copy**: Copy URL to clipboard
4. **Show/Hide**: Toggle URL visibility

## API Routes (To Be Implemented)

### PATCH /api/users/me

Update user profile and preferences.

**Request Body**:
```json
{
  "full_name": "Jane Doe",
  "notification_preferences": {
    "email_notifications": true,
    "slack_notifications": false,
    "lead_delivery_email": true,
    "weekly_digest": false
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "full_name": "Jane Doe",
    "notification_preferences": { ...}
  }
}
```

### POST /api/auth/change-password

Change user password.

**Request Body**:
```json
{
  "current_password": "current123",
  "new_password": "newpass123"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Response (Error)**:
```json
{
  "error": "Current password is incorrect"
}
```

### POST /api/auth/signout

Sign out current user.

**Response**:
```json
{
  "success": true
}
```

### GET /api/integrations/slack/oauth

Redirect to Slack OAuth authorization.

**Flow**:
1. Generate state token
2. Build OAuth URL with required scopes
3. Redirect to Slack authorization page
4. Slack redirects back to `/api/integrations/slack/callback`
5. Exchange code for access token
6. Store webhook URL in database
7. Redirect to `/integrations?slack=connected`

**Required Scopes**:
- `incoming-webhook` - Send messages to Slack
- `chat:write` - Write messages

### POST /api/integrations/slack/disconnect

Disconnect Slack integration.

**Response**:
```json
{
  "success": true,
  "message": "Slack disconnected successfully"
}
```

### POST /api/integrations/zapier/generate

Generate Zapier webhook URL.

**Response**:
```json
{
  "success": true,
  "data": {
    "webhook_url": "https://api.openinfo.com/webhooks/zapier/{unique-id}"
  }
}
```

### POST /api/integrations/zapier/revoke

Revoke Zapier webhook URL.

**Response**:
```json
{
  "success": true,
  "message": "Webhook revoked successfully"
}
```

## Database Schema Updates

### Users Table (New Fields)

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email_notifications": true,
  "slack_notifications": false,
  "lead_delivery_email": true,
  "weekly_digest": false
}'::jsonb,
ADD COLUMN IF NOT EXISTS slack_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS zapier_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS custom_webhook_url TEXT;
```

**notification_preferences JSONB Structure**:
```json
{
  "email_notifications": true,
  "slack_notifications": false,
  "lead_delivery_email": true,
  "weekly_digest": false
}
```

### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_users_slack_webhook ON users(slack_webhook_url);
CREATE INDEX IF NOT EXISTS idx_users_zapier_webhook ON users(zapier_webhook_url);
```

## Slack OAuth Flow

### 1. Initiate OAuth

```typescript
// GET /api/integrations/slack/oauth
const clientId = process.env.SLACK_CLIENT_ID
const redirectUri = `${baseUrl}/api/integrations/slack/callback`
const scopes = 'incoming-webhook,chat:write'
const state = generateStateToken()

// Store state in session
await redis.set(`slack_state:${userId}`, state, { ex: 600 })

// Redirect to Slack
const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`
redirect(authUrl)
```

### 2. Handle Callback

```typescript
// GET /api/integrations/slack/callback
const { code, state } = query

// Verify state token
const storedState = await redis.get(`slack_state:${userId}`)
if (state !== storedState) {
  throw new Error('Invalid state token')
}

// Exchange code for access token
const response = await fetch('https://slack.com/api/oauth.v2.access', {
  method: 'POST',
  body: new URLSearchParams({
    code,
    client_id: process.env.SLACK_CLIENT_ID,
    client_secret: process.env.SLACK_CLIENT_SECRET,
    redirect_uri: redirectUri,
  }),
})

const data = await response.json()

// Store webhook URL
await supabase
  .from('users')
  .update({ slack_webhook_url: data.incoming_webhook.url })
  .eq('id', userId)

// Redirect to integrations page
redirect('/integrations?slack=connected')
```

### 3. Send Slack Notification

```typescript
async function sendSlackNotification(webhookUrl: string, lead: Lead) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🔥 New Hot Lead',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Company:*\n${lead.company_data.name}`,
            },
            {
              type: 'mrkdwn',
              text: `*Contact:*\n${lead.contact_data.name}`,
            },
            {
              type: 'mrkdwn',
              text: `*Email:*\n${lead.contact_data.email}`,
            },
            {
              type: 'mrkdwn',
              text: `*Intent Score:*\n${lead.intent_data.score}`,
            },
          ],
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View in OpenInfo',
              },
              url: `https://app.openinfo.com/leads/${lead.id}`,
            },
          ],
        },
      ],
    }),
  })
}
```

## Zapier Webhook Implementation

### Generate Webhook URL

```typescript
// POST /api/integrations/zapier/generate
async function generateZapierWebhook(userId: string) {
  const webhookId = crypto.randomUUID()
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/webhooks/zapier/${webhookId}`

  await supabase
    .from('users')
    .update({ zapier_webhook_url: webhookUrl })
    .eq('id', userId)

  return webhookUrl
}
```

### Send to Zapier Webhook

```typescript
async function sendToZapier(webhookUrl: string, lead: Lead) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lead_id: lead.id,
      company: {
        name: lead.company_data.name,
        domain: lead.company_data.domain,
        industry: lead.company_data.industry,
      },
      contact: {
        name: lead.contact_data.name,
        email: lead.contact_data.email,
        title: lead.contact_data.title,
      },
      intent_score: lead.intent_data.score,
      intent_signals: lead.intent_data.signals,
      created_at: lead.created_at,
    }),
  })
}
```

## Security Considerations

### 1. OAuth State Token

- Generate cryptographically secure random state
- Store in Redis/session with 10-minute expiration
- Verify on callback to prevent CSRF

### 2. Webhook URL Security

- Use UUID for Zapier webhook IDs (unpredictable)
- Validate webhook ownership before sending
- Allow users to revoke/regenerate webhooks

### 3. Password Change

- Verify current password before allowing change
- Use Supabase Auth API for password updates
- Enforce minimum 8 character length
- Invalidate sessions after password change

### 4. Integration Scoping

- Slack webhooks scoped to specific channel
- No access to read messages or user data
- Minimal OAuth scopes requested

## UI/UX Patterns

### Tab Navigation

All settings pages share common tab navigation:
```tsx
<nav className="-mb-px flex space-x-8">
  <Link href="/settings" className={activeClass}>Profile</Link>
  <Link href="/settings/notifications" className={inactiveClass}>Notifications</Link>
  <Link href="/settings/security" className={inactiveClass}>Security</Link>
  <Link href="/settings/billing" className={inactiveClass}>Billing</Link>
</nav>
```

### Toggle Switches

Consistent toggle pattern across notification settings:
```tsx
<button
  onClick={() => handleToggle('setting_name', !value)}
  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
    value ? 'bg-blue-600' : 'bg-gray-200'
  }`}
>
  <span
    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
      value ? 'translate-x-6' : 'translate-x-1'
    }`}
  />
</button>
```

### Success/Error Messages

Temporary notifications with auto-dismiss:
```tsx
{successMessage && (
  <div className="rounded-lg bg-green-50 border border-green-200 p-4">
    <div className="flex">
      <svg className="h-5 w-5 text-green-400" />
      <p className="ml-3 text-sm font-medium text-green-800">
        {successMessage}
      </p>
    </div>
  </div>
)}
```

## Testing Checklist

- [ ] Profile update saves successfully
- [ ] Email field is read-only
- [ ] Referral code copies to clipboard
- [ ] Referral link copies to clipboard
- [ ] Credits remaining displays correctly
- [ ] Plan badge shows correct plan
- [ ] Upgrade link visible for free users
- [ ] Notification toggles update immediately
- [ ] Slack toggle disabled without connection
- [ ] Email notifications toggle works
- [ ] Password change validates correctly
- [ ] Password change requires current password
- [ ] New passwords must match
- [ ] Minimum 8 characters enforced
- [ ] Sign out redirects to login
- [ ] Slack connect button redirects to OAuth
- [ ] Slack disconnect confirmation works
- [ ] Slack test notification sends
- [ ] Zapier webhook generates successfully
- [ ] Zapier webhook URL copies
- [ ] Zapier webhook revoke confirmation
- [ ] Pro plan gates integrations correctly
- [ ] Upgrade prompts link to pricing
- [ ] Tab navigation works on all pages
- [ ] Loading states show during requests
- [ ] Error messages display clearly

## Environment Variables

```bash
# Slack OAuth
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_SIGNING_SECRET=your_slack_signing_secret

# Redis (for OAuth state storage)
REDIS_URL=redis://localhost:6379
```

## Next Steps (Future Enhancements)

1. **API Keys**: Generate API keys for programmatic access
2. **Webhook Logs**: View history of webhook deliveries
3. **Webhook Retries**: Automatic retry on failure with exponential backoff
4. **Email Templates**: Customize lead delivery email templates
5. **Notification Scheduling**: Set quiet hours for notifications
6. **Multi-workspace**: Support multiple workspaces per user
7. **Team Settings**: Invite team members, manage roles
8. **Audit Log**: Track all settings changes
9. **2FA**: Two-factor authentication for security
10. **Session Management**: View and revoke all active sessions

---

**Last Updated**: 2026-01-22
**Phase Status**: ✅ Complete
