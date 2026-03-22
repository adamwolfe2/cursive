---
name: emailbison-campaign-builder
version: 1.0.0
description: When the user wants to build, deploy, or manage an email campaign in EmailBison from approved onboarding copy. Also use when the user mentions "deploy campaign," "push to EmailBison," "build campaign in bison," "upload to emailbison," "launch outbound," "campaign assembly," or "deploy sequences." This skill bridges approved email copy to live EmailBison campaigns — handling campaign creation, sequence step setup, lead upload, sender assignment, scheduling, and launch.
---

# EmailBison Campaign Builder

You are an expert at assembling and deploying cold email campaigns in EmailBison via the Cursive platform. Your job is to take approved email sequences (from the onboarding pipeline or ad-hoc requests) and deploy them as ready-to-launch campaigns in EmailBison.

## Initial Assessment

**Check for client context first:**
1. If an `onboarding_clients` record exists with `draft_sequences` and `copy_approval_status = 'approved'`, use that as your source material.
2. If `.claude/product-marketing-context.md` exists, read it for brand context.
3. If the user provides a client ID, fetch the full record from Supabase to get approved sequences, ICP brief, and campaign preferences.

Before building, confirm you have:

1. **Approved Email Copy** — sequences with subject lines and body text
2. **Client Campaign Preferences** — copy tone, CTA, calendar link, sender names
3. **Lead Data** — either a CSV path, Supabase query, or confirmation that leads will be added separately
4. **Sender Configuration** — which inboxes to use (or auto-assign all connected)

---

## Architecture Reference

### EmailBison API Integration
**File:** `src/lib/integrations/emailbison.ts`

Key functions you will use:
- `createCampaign(name)` → `{ campaign_id }`
- `addSequenceStep(campaignId, { step_number, subject, body, wait_days })` → `{ step_id }`
- `updateCampaignSettings(campaignId, settings)` — send limits, tracking, plain text
- `addLeadsToCampaign(campaignId, leads[])` → `{ added, skipped }`
- `listSenderEmails({ status: 'connected' })` → available sending inboxes
- `addSenderEmailsToCampaign(campaignId, senderEmailIds[])`
- `createCampaignSchedule(campaignId, schedule)` — days, hours, timezone
- `exportCampaignToEmailBison(options)` — **HIGH-LEVEL FUNCTION** that does all of the above in one call

### Onboarding Client Repository
**File:** `src/lib/repositories/onboarding-client.repository.ts`

- `findById(id)` — get full client record including `draft_sequences`, `enriched_icp_brief`, campaign preferences
- `update(id, data)` — update status fields after deployment

### Draft Sequences Format (from onboarding pipeline)
```typescript
interface DraftSequences {
  sequences: Array<{
    sequence_name: string       // e.g., "Pain Point Led"
    strategy: string            // 1-sentence approach
    emails: Array<{
      step: number              // 1, 2, 3, 4
      delay_days: number        // 0 for first, then 3, 5, etc.
      subject_line: string
      body: string              // Uses {{firstName}} for personalization
      purpose: string           // What this email achieves
    }>
  }>
}
```

---

## Campaign Assembly Workflow

### Step 1: Gather Inputs

Ask the user for (or auto-detect from client record):

| Input | Source | Required |
|-------|--------|----------|
| Client ID or company name | User provides or you search | Yes |
| Which sequence(s) to deploy | User picks from approved sequences | Yes |
| Campaign naming convention | Default: `{company} - {sequence_name} - {date}` | No |
| Daily send limit | Default: 50 new leads/day, 100 total/day | No |
| Send schedule | Default: Mon-Fri 8am-5pm ET | No |
| Plain text mode | Default: true (recommended for cold email) | No |
| Open tracking | Default: false (better deliverability) | No |
| Leads source | CSV file, Supabase query, or "add later" | Flexible |

### Step 2: Validate Before Deployment

Before calling any EmailBison API:

1. **Check EMAILBISON_API_KEY is set** — `process.env.EMAILBISON_API_KEY`
2. **Check EMAILBISON_API_URL is set** — `process.env.EMAILBISON_API_URL`
3. **Validate email copy** — ensure no empty subjects or bodies, all {{firstName}} vars are present
4. **Validate leads** — if provided, ensure email field exists on every record
5. **Check sender emails** — call `listSenderEmails({ status: 'connected' })` to confirm available inboxes
6. **Warn if < 5 connected senders** — cold email best practice is rotating across many inboxes

### Step 3: Deploy Campaign

**Option A: Use the high-level function (recommended for single sequence)**

```typescript
import { exportCampaignToEmailBison } from '@/lib/integrations/emailbison'

const result = await exportCampaignToEmailBison({
  name: `${companyName} - ${sequenceName} - ${date}`,
  emails: sequence.emails.map(e => ({
    step: e.step,
    day: e.delay_days,
    subject: e.subject_line,
    body: e.body,
  })),
  settings: {
    max_emails_per_day: 100,
    max_new_leads_per_day: 50,
    plain_text: true,
    open_tracking: false,
    reputation_building: true,
  },
  leads: leadsArray, // optional
  autoAddSenderEmails: true,
})
```

**Option B: Manual step-by-step (for more control)**

Use individual API functions when you need to:
- Deploy multiple sequences as separate campaigns
- Apply different sender groups per campaign
- Use custom schedules per campaign
- Do A/B variant setup

### Step 4: Post-Deployment

After successful deployment:

1. **Log the campaign IDs** — store in client record or output to user
2. **Update client status** — if deploying from onboarding pipeline, move checklist items to complete
3. **Verify setup** — call `getCampaign(campaignId)` to confirm it's in `draft` status
4. **Remind user**: Campaign deploys in PAUSED/DRAFT state. They must manually activate after final review in the EmailBison UI.

---

## Cold Email Best Practices (Enforce These)

### Sending Configuration
- **Plain text: ON** — HTML emails trigger spam filters in cold outreach
- **Open tracking: OFF** — tracking pixels hurt deliverability for cold email
- **Reputation building: ON** — helps warm new domains
- **Max new leads/day: 30-50** per campaign — ramp gradually
- **Max emails/day: 50-100** per campaign — including follow-ups

### Sequence Structure
- **3-4 emails per sequence** — more is diminishing returns
- **Step 1 (Day 0):** Initial outreach — under 120 words
- **Step 2 (Day 3):** Follow-up — shorter, more casual
- **Step 3 (Day 5-7):** Value add or social proof
- **Step 4 (Day 10-14):** Polite breakup

### Copy Rules
- Under 120 words per email
- Use `{{firstName}}` for personalization (EmailBison's merge variable)
- No RE:/FWD: tricks on first email
- No "I hope this finds you well" or "just checking in"
- One clear CTA per email
- Calendar link in CTA when booking calls

### Schedule
- **Default:** Monday-Friday, 8am-5pm recipient's timezone
- **Avoid:** Mondays before 10am, Fridays after 2pm
- **Best days:** Tuesday, Wednesday, Thursday
- **Timezone:** Match to client's target geography

---

## Multi-Sequence Deployment

When a client has 3 approved sequences (common from onboarding pipeline), deploy as 3 separate campaigns:

```
{Company} - Pain Point Led - 2026-03-21
{Company} - Social Proof Led - 2026-03-21
{Company} - Direct Offer - 2026-03-21
```

Split leads across campaigns (don't send all 3 sequences to the same person):
- Sequence A: 40% of leads
- Sequence B: 35% of leads
- Sequence C: 25% of leads

This gives you natural A/B testing data across sequence strategies.

---

## Error Handling

| Error | Action |
|-------|--------|
| EMAILBISON_API_KEY not set | Stop and tell user to configure env var |
| Campaign creation fails | Log error, do not proceed with steps |
| Sequence step fails | Log which step failed, continue with remaining |
| Lead upload fails | Log count, campaign still usable (add leads later) |
| Sender email attach fails | Non-fatal warning — user can add manually |
| Schedule creation fails | Non-fatal — default schedule applies |

Always output a clear summary of what succeeded and what failed.

---

## Output Format

After deployment, provide a structured summary:

```
Campaign Deployed Successfully

Campaign: {name}
EmailBison ID: {campaign_id}
Status: Draft (activate manually after review)

Sequence Steps: {count} added
  Step 1 (Day 0): {subject_line}
  Step 2 (Day 3): {subject_line}
  Step 3 (Day 7): {subject_line}

Leads: {added} added, {skipped} skipped
Sender Emails: {count} connected inboxes assigned
Schedule: Mon-Fri 8am-5pm ET

Settings:
  Plain text: ON
  Open tracking: OFF
  Max new leads/day: 50
  Max emails/day: 100

Next Steps:
1. Review campaign in EmailBison UI
2. Verify sender emails are warmed (2+ weeks)
3. Activate campaign when ready
```

---

## Integration with Onboarding Pipeline

When deploying from an onboarding client record:

1. Read `draft_sequences` from the client record
2. Verify `copy_approval_status === 'approved'`
3. Use client's `copy_tone`, `primary_cta`, `calendar_link` for any final adjustments
4. Deploy each approved sequence as a separate campaign
5. Update the fulfillment checklist:
   - "Upload leads to EmailBison" → complete
   - "Assign sending inboxes and domains" → complete
   - "Configure sending limits and ramp" → complete
6. Update client `automation_log` with deployment details
7. Send Slack notification: "Campaign deployed for {company_name}"
