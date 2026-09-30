# Free-leads follow-up sequence (copy only, not wired, nothing sent)

Source: `2026-09-30-free-leads-conversion-research.md` (touch timing and rungs). Trigger: claim delivered
(`free_lead_events.step = 'delivered'`). Stop the sequence on any upgrade click (`upgrade_*`), a reply, or a booked call.
Merge fields: `{first_name}` (from the claimer's email/name if known, else drop the greeting name), `{domain}`,
`{icp_summary}`, `{lead_name}`, `{lead_title}`, `{lead_company}`, `{why}` (the fit line of the best lead), `{leads_url}`.
Rules: plain text, no emojis, no em dashes, never name the data source, never promise "verified" beyond "checked work email".

## Touch 1. In-app, at lead 26 (already built: locked row + ladder)
Locked row: "Lead 26 and the rest of this week's matches"
Rung 1 headline: "Get 25 new leads like these, every Monday."
Button: "Send me 25 every week"
Sub: "Same profile, fresh people each week. Edit who we look for any time."

## Touch 2. Email, +2 hours after delivery
Subject: How many of the 25 can you reach this week?
Body:
Hi {first_name},

Your 25 leads for {domain} are in your workspace: {leads_url}

Quick question: how many of them can you realistically contact this week? Most founders we talk to get through 10 to 15 before the list goes stale.

If you want a fresh 25 every Monday that match "{icp_summary}", reply "weekly" and I will set it up.

Adam

## Touch 3. Email, day 2
Subject: A first line for {lead_name}
Body:
Hi {first_name},

I picked one lead from your list to show what a first message could look like.

{lead_name}, {lead_title} at {lead_company}. Why they fit: {why}

A first line that tends to get replies:
"Saw {lead_company} is {one concrete observation from their site or title}. We help teams like yours {outcome in their words}. Worth a 15 minute look next week?"

Want us to write and send these on LinkedIn for the whole list? That is what our done-for-you outreach does: {leads_url}

Adam

## Touch 4. LinkedIn (connection note or DM), day 5
"Hi {first_name}, I sent you 25 leads for {domain} on Monday. If any of them missed the mark, tell me which and I will swap them for better fits, no charge. Adam"

## Touch 5. Email, day 9
Subject: Your free workspace goes read-only on day 14
Body:
Hi {first_name},

Heads up: the free workspace with your 25 leads goes read-only on day 14. Export the CSV any time before then: {leads_url}

Two ways to keep going:
1. 25 new leads like these every Monday.
2. We run the LinkedIn outreach for you, so you only take the replies. Weekly leads are included.

Reply with 1 or 2, or book 15 minutes here: https://cal.com/meetcursive/intro

Adam

## Open decisions (Adam)
- Touch 5 depends on a real read-only rule at day 14 (not built). Drop that line until it exists.
- Sender: Adam personally (research favors founder-to-founder) vs a team inbox.
- Sending system: EmailBison (send.meetcursive.com) sequences vs a transactional sender. Suggest EmailBison, triggered from the `delivered` event.
