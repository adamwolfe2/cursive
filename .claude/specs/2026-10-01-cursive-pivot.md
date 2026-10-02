# Cursive pivot: find them, reach them, run it (2026-10-01)

Status: positioning agreed in chat with Adam; pricing below is a PROPOSAL awaiting his yes. Nothing built yet.
Branch: `feat/free-leads-fun` (PR #138), worktree `~/cursive-worktrees/free-leads-fun`. Marketing site = `marketing/`
(separate Next app, meetcursive.com, Vercel project `cursive`); app = `src/` (leads.meetcursive.com, Vercel `leadme`).

## Positioning (Adam approved the ladder)
One line: "Cursive finds your buyers, reaches them for you, and gives you the system to run it."
1. Find them (leads, the hook). Paste website -> ICP in a minute -> 25 free leads from 400M+ verified B2B contacts,
   multi-sourced and enriched across several databases. Then credits or a subscription for more.
2. Reach them (outbound, the money). We run LinkedIn and/or email outreach to that same primed list.
3. Run it (operating system, the upgrade). A company dashboard that ties leads, replies, pixel visitors, site chatbot,
   CRM and any API together. Booked by call. (Same build muscle as the AM Collective client dashboards.)
Visitor Pixel stays (do NOT delete); it is an add-on that feeds rung 3.

## The core product loop Adam wants shown ("recursive" learning)
1. Put in your website. 2. Set up targeting (ICP). 3. Refine targeting. 4. Pick the decision makers / titles.
5. Get leads; thumbs up/down the ones you like. 6. Upload past customers / buyers (CSV) -> an ICP agent learns from
both signals and every next batch gets closer to the ideal decision maker. 7. Pay with credits or a subscription to keep
pulling. 8. Next step: run outbound to the primed audience. 9. Next next: the operating system dashboard.
App today already has 1-4 (/start scan, IcpCard edit + refine box, count, approve) and weekly 25 (Ladder, Monday
delivery). Missing: lead feedback (like/dislike), customer-list upload, ICP agent that rescoring/re-filters from them,
credits billing, outbound handoff.

## Pricing PROPOSAL (Adam to approve or change)
Comps: done-for-you LinkedIn/email agencies run $2k to $5k/mo; tools like HeyReach ~$79/seat; lead credits $0.30-$1.
- Free: 25 leads, no card (live).
- Credits (pay as you go, roll over): 100 leads $49 · 500 leads $199 · 2,000 leads $599.
- Leads subscription: Starter $197/mo (100 leads/mo, 25 every Monday, already decided 2026-10-01 with 14-day trial) ·
  Growth $497/mo (500 leads/mo, ICP agent learns from your likes and customer list).
- Outbound, done for you: LinkedIn $1,497/mo (1 sender profile, ~400 connection requests/mo inside LinkedIn's limits,
  copy written and run by us, Growth leads included) · LinkedIn + email $2,497/mo (adds an email domain + inboxes).
  Positioned under agency price because the list is already built and primed.
- Operating system: custom, from $2,500 setup + $500/mo hosting/maintenance. "Book a call".
- Visitor Pixel $97/mo stays as an add-on.
Open: is outbound the main thing to sell (hero CTA stays "Get my 25 leads" either way)?

## Homepage rebuild asks (from Adam, 2026-10-01 evening)
- Example scans must be REAL well-known companies with their real logos, rotating automatically. Delete the category
  tabs (SOC 2 audits / Bookkeeping / Freight). Label clearly as "example scan of acme.com", never imply they are customers.
- Delete the three outdated demos (Visitor Tracking, Audience Builder, Data Enrichment) in the products tour; rebuild
  one demo per rung (find / reach / run) in the current clean style.
- Hero: interactive, mouse-reactive flowing background in Cursive blue (canvas/WebGL field, respects
  prefers-reduced-motion, no layout cost). Make the blue "pop" without going dark.
- Big metric moment: 400M+ verified B2B contacts, multi-sourced and enriched (animated counter, sourced claim only).
- Scroll section: a dictionary entry for "recursive" (headword, pronunciation, part of speech, numbered senses, like
  Merriam-Webster) whose text fills with color as you scroll (scroll-driven, CSS animation-timeline with JS fallback).
  It is the brand idea: Cursive gets closer to your ideal buyer with every batch.
- Pricing section shows the 3 rungs (leads/credits, outbound, OS), not the old Pixel/Audience/Bundle grid.
- Keep: light theme, #007AFF accent on white/pale blue, NO script font, bold sentence-case headings, one CTA label
  "Get my 25 leads", no unverifiable claims (no fake testimonials, no SOC 2/ROI claims unless Adam confirms).

## Agent Reach (github.com/Panniantong/Agent-Reach) verdict: do not integrate into the product
MIT, Python, ~87k stars. It is a local CLI toolkit that gives a coding agent internet reading (web via Jina Reader,
YouTube, RSS, Exa search, and Twitter/Reddit/LinkedIn/Instagram via the user's own browser cookies or OpenCLI).
- Not a server-side, multi-tenant data source: the LinkedIn/X/Reddit paths reuse one person's logged-in cookies,
  which breaks those platforms' terms at SaaS scale and risks bans. It has no contact data, so it cannot replace
  GetLeads for emails.
- Useful bits are its upstreams, which we can call directly if needed: Jina Reader (fallback for sites our fetcher
  cannot read) and Exa search (company research for "why them" lines). Use Agent Reach internally for research only.

## State at handoff
- PR #138 has: count timeout fix (exclude_job_titles dropped from counts), light homepage redesign, /start without
  script font, "Count again" retry, persona gender + AI portrait (fal; account out of credit, so no photos yet).
- Staging: cursive-6a85wglws-am-collective.vercel.app, leadme-evx671gwa-am-collective.vercel.app (share links expire
  2026-10-02 23:30). Preview env now has GETLEADS_API_KEY.
- Blockers for Adam: fal balance (photos), OpenAI credits, Gemini key flagged as leaked (rotate), GitHub Actions
  account locked over billing (migration-lint check red on #138, not code).
- Dev: app `npx next dev -p 3011` (needs EMAILBISON_WEBHOOK_SECRET warning, still serves); marketing
  `cd marketing && rtk proxy npx next dev -p 3012`. Screenshots: Playwright with `channel: 'chrome'`.
  Demo twins: marketing/components/homepage/start-hero-demo.tsx == src/app/start/_components/HeroDemo.tsx (keep identical).
