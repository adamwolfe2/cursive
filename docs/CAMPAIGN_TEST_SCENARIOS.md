# Campaign System Test Scenarios

This document outlines test scenarios for the Sales.co-style campaign system.

## Prerequisites

1. Ensure environment variables are configured (see `.env.example`)
2. Run database migrations: `npx supabase db push`
3. Start the development server: `pnpm dev`
4. Start Inngest dev server: `npx inngest-cli@latest dev`

---

## 1. Campaign Creation Wizard

### 1.1 Basic Campaign Creation

**Steps:**
1. Navigate to `/campaigns/new`
2. Fill in campaign name and description
3. Select a client profile
4. Add value propositions (at least 2)
5. Configure sequence settings (3 steps, 2-day intervals)
6. Submit the form

**Expected Results:**
- Campaign is created with status `draft`
- Redirected to campaign detail page
- Value propositions are saved correctly
- Sequence settings are stored

### 1.2 Campaign Without Client Profile

**Steps:**
1. Try to create campaign without selecting client profile

**Expected Results:**
- Form validation prevents submission
- Error message displayed

---

## 2. Template Browser

### 2.1 Browse Templates

**Steps:**
1. Navigate to `/templates`
2. Apply filters (tone: informal, structure: AIDA)
3. Search by keyword

**Expected Results:**
- Templates filtered correctly
- Search returns relevant results
- Preview shows variable replacement with sample data

### 2.2 Duplicate Template

**Steps:**
1. Click "Duplicate" on a template
2. Verify new template is created

**Expected Results:**
- New template created with "Copy of" prefix
- Original template unchanged

---

## 3. Campaign Leads Management

### 3.1 Add Leads to Campaign

**Steps:**
1. Navigate to `/campaigns/[id]/leads`
2. Click "Add Leads"
3. Search and select leads
4. Confirm addition

**Expected Results:**
- Leads appear in campaign leads list
- Status is `pending`
- Inngest event `campaign/lead-added` is triggered

### 3.2 Bulk Remove Leads

**Steps:**
1. Select multiple leads using checkboxes
2. Click "Remove Selected"

**Expected Results:**
- Selected leads removed from campaign
- Campaign lead count updated

---

## 4. Lead Enrichment Pipeline

### 4.1 Automatic Enrichment (Mock Mode)

**Prerequisites:** `ANTHROPIC_API_KEY` not set

**Steps:**
1. Add a lead to a campaign
2. Check Inngest dashboard for `campaign-lead-enrichment` function

**Expected Results:**
- Function runs successfully with mock data
- `campaign_leads.enrichment_data` populated
- `campaign_leads.status` = `ready`
- `campaign/compose-email` event triggered

### 4.2 Value Proposition Matching

**Steps:**
1. Add lead with specific industry (e.g., "healthcare")
2. Have value prop with matching target segment

**Expected Results:**
- Lead matched to appropriate value prop
- `matched_value_prop_id` set correctly
- `match_reasoning` populated

---

## 5. Email Composition

### 5.1 Template Selection

**Steps:**
1. Trigger composition for an enriched lead
2. Check selected template

**Expected Results:**
- Template selected based on seniority matching
- If no match, default template used
- `template_id` recorded on email_sends

### 5.2 Variable Replacement

**Test Variables:**
```
{{first_name}} → Lead first name
{{company_name}} → Lead company
{{value_prop}} → Matched value proposition
{{company_summary}} → From enrichment data
{{pain_point}} → From challenges
```

**Expected Results:**
- All variables replaced correctly
- No `{{variable}}` patterns remain in final email
- Missing variables replaced with fallback or removed

---

## 6. Email Review Queue

### 6.1 Review Pending Emails

**Steps:**
1. Navigate to `/campaigns/[id]/emails`
2. Click on pending tab
3. Select an email to preview

**Expected Results:**
- Pending emails listed with status badge
- Preview shows subject and body
- Lead info displayed

### 6.2 Edit and Approve

**Steps:**
1. Open email preview modal
2. Edit subject and/or body
3. Click "Save & Approve"

**Expected Results:**
- Email updated in database
- Status changed to `approved`
- `campaign/email-approved` event triggered
- Toast notification shown

### 6.3 Bulk Approve

**Steps:**
1. Select multiple emails with checkboxes
2. Click "Approve X Selected"

**Expected Results:**
- All selected emails approved
- Events triggered for each email
- Selection cleared after approval

### 6.4 Reject Email

**Steps:**
1. Click "Reject" on an email

**Expected Results:**
- Email status changed to `rejected`
- Email removed from pending list

---

## 7. Email Sending

### 7.1 Send Approved Email (Mock Mode)

**Prerequisites:** `EMAILBISON_API_KEY` not set

**Steps:**
1. Approve an email
2. Check Inngest dashboard for `campaign-send-email` function

**Expected Results:**
- Function runs with mock send
- `email_sends.status` = `sent`
- `emailbison_message_id` set (mock ID)
- `campaign_leads.current_step` incremented

### 7.2 Campaign Activation Send Window

**Steps:**
1. Configure campaign with send window (9am-5pm)
2. Approve email outside window

**Expected Results:**
- Email not sent immediately
- `waiting_for_window` status returned

---

## 8. Reply Handling

### 8.1 Reply Webhook Processing

**Steps:**
1. POST to `/api/webhooks/emailbison/campaigns` with reply event
2. Check database and Inngest

**Expected Results:**
- `email_replies` record created
- `campaign_leads.status` = `replied`
- `emailbison/reply-received` event triggered
- AI classification runs (mock)

### 8.2 Reply Classification (Mock)

**Test Cases:**
| Reply Content | Expected Sentiment | Intent Score |
|---------------|-------------------|--------------|
| "I'm interested, tell me more" | positive | 7-8 |
| "Not interested, thanks" | not_interested | 1-2 |
| "Unsubscribe me" | unsubscribe | 0 |
| "I'm out of office" | out_of_office | 5 |
| "What's the pricing?" | question | 6 |

### 8.3 Reply Inbox Review

**Steps:**
1. Navigate to `/campaigns/[id]/replies`
2. Review new reply
3. View AI classification and suggested response
4. Send response

**Expected Results:**
- Reply displayed with sentiment badge
- AI reasoning shown
- Suggested response pre-filled
- Response sent and reply status updated

---

## 9. Analytics Dashboard

### 9.1 View Campaign Analytics

**Steps:**
1. Navigate to `/campaigns/[id]/analytics`

**Expected Results:**
- KPIs displayed (reply rate, positive rate, conversion rate)
- Lead funnel visualization accurate
- Template performance table shows data

### 9.2 Empty State

**Steps:**
1. View analytics for new campaign with no activity

**Expected Results:**
- All metrics show 0
- No errors displayed
- Empty states for performance tables

---

## 10. Client Profile

### 10.1 Create Client Profile

**Steps:**
1. Navigate to `/settings/client-profile`
2. Fill in company info, value props, trust signals
3. Save

**Expected Results:**
- Profile saved to database
- Toast notification shown
- Profile available for campaign selection

### 10.2 Edit Client Profile

**Steps:**
1. Load existing profile
2. Modify fields
3. Save

**Expected Results:**
- Changes persisted
- No duplicate profile created

---

## 11. Webhook Security

### 11.1 Invalid Signature

**Steps:**
1. POST to webhook endpoint with invalid signature

**Expected Results:**
- 401 Unauthorized response
- No database changes

### 11.2 Missing Workspace

**Steps:**
1. POST valid webhook for non-existent campaign

**Expected Results:**
- 404 Not Found response
- Error logged

---

## 12. Error Handling

### 12.1 API Rate Limiting

**Steps:**
1. Trigger many enrichment jobs rapidly

**Expected Results:**
- Inngest throttling applied (10/minute)
- No API errors
- Jobs queued properly

### 12.2 Failed Enrichment Retry

**Steps:**
1. Simulate enrichment failure
2. Check Inngest retries

**Expected Results:**
- Function retried up to 3 times
- Error logged after final failure
- Lead status reflects failure

---

## Manual Verification Checklist

Before deploying, verify:

- [ ] Campaign creation flow works end-to-end
- [ ] Templates display correctly with sample data
- [ ] Leads can be added and enriched
- [ ] Emails are composed with proper variable replacement
- [ ] Approval/rejection workflow functions
- [ ] Mock sending creates proper records
- [ ] Reply classification produces reasonable results
- [ ] Analytics calculate correctly
- [ ] RLS policies enforce workspace isolation
- [ ] All Inngest functions registered and visible in dev

---

## Performance Benchmarks

| Operation | Expected Time |
|-----------|---------------|
| Campaign creation | < 500ms |
| Lead enrichment (mock) | < 1s |
| Email composition | < 500ms |
| Analytics query (1000 leads) | < 2s |
| Reply classification (mock) | < 500ms |

---

## Known Limitations

1. **Mock Mode**: When API keys not set, uses mock data for enrichment/classification
2. **Send Window**: Simple hour-based check, no timezone awareness in MVP
3. **Template Selection**: Basic matching algorithm, could be enhanced with ML
4. **Reply Classification**: Rule-based mock, production needs Claude API
5. **Analytics**: Real-time queries, may need caching for large campaigns
