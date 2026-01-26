# Master Lead Database - 30 Phase Implementation Roadmap

A comprehensive plan to transform Cursive into a complete lead generation, enrichment, and outreach platform.

---

## SECTION A: FOUNDATION & DATA INFRASTRUCTURE (Phases 1-5)

### Phase 1: Database Schema Optimization
- Audit and optimize `leads` table schema for extensibility
- Add indexes for common query patterns (workspace_id, enrichment_status, created_at)
- Create `lead_sources` table to track where leads originate
- Add `lead_activities` table for tracking all lead interactions
- Implement soft deletes and archiving strategy

### Phase 2: Lead Import Infrastructure
- Create unified lead import pipeline
- Support CSV/Excel file uploads with column mapping UI
- Add Zapier webhook receiver for automated imports
- Build API endpoint for programmatic lead submission
- Implement duplicate detection (by email, phone, company)

### Phase 3: Lead Deduplication Engine
- Build fuzzy matching algorithm for company names
- Implement email normalization (remove +aliases, lowercase)
- Phone number normalization (E.164 format)
- Create merge UI for handling duplicate leads
- Track lead merge history for audit trail

### Phase 4: Lead Scoring Framework
- Design configurable scoring rules engine
- Implement default scoring based on completeness
- Add engagement-based scoring (opens, clicks, replies)
- Create firmographic scoring (company size, industry, location)
- Build scoring dashboard with distribution visualization

### Phase 5: Lead Segmentation & Tags
- Create `tags` and `lead_tags` tables
- Build tag management UI (create, edit, delete, merge)
- Add bulk tagging operations
- Implement smart segments (saved filters)
- Create segment-based views in leads table

---

## SECTION B: ENRICHMENT ENGINE (Phases 6-12)

### Phase 6: Enrichment Queue System
- Create `enrichment_jobs` table for queue management
- Implement priority-based processing
- Add rate limiting per enrichment source
- Build retry logic with exponential backoff
- Create enrichment status dashboard

### Phase 7: Open-Source Email Enrichment
- Integrate email verification (check MX, SMTP handshake)
- Build email pattern detection (firstname@, f.lastname@)
- Implement email guessing from name + domain
- Add disposable email detection
- Create email confidence scoring

### Phase 8: Company Data Enrichment
- Website scraping for company details (size, description)
- Extract social links from websites
- Parse structured data (schema.org, meta tags)
- Industry classification using ML model
- Tech stack detection (BuiltWith-style analysis)

### Phase 9: Contact Discovery
- Build LinkedIn profile finder (name + company -> profile)
- Integrate open data sources (Clearbit alternatives)
- Create professional network graph
- Find decision makers by job title patterns
- Role/seniority classification

### Phase 10: Phone Number Enrichment
- Phone number validation (format, carrier lookup)
- Mobile vs landline detection
- Area code to location mapping
- DNC list checking
- Phone confidence scoring

### Phase 11: Social Media Enrichment
- Find company social profiles (LinkedIn, Twitter, Facebook)
- Extract engagement metrics where public
- Find contact social profiles
- Profile picture extraction and storage
- Social presence scoring

### Phase 12: Real-Time Enrichment Pipeline
- Trigger enrichment on lead creation
- Background enrichment worker with Inngest
- Progressive enrichment (start with fast sources)
- Enrichment completion webhooks
- Real-time UI updates via Supabase Realtime

---

## SECTION C: ADVANCED LEAD ACQUISITION (Phases 13-17)

### Phase 13: Web Scraping Infrastructure
- Create `scraping_jobs` table with scheduling
- Implement headless browser service (Puppeteer/Playwright)
- Add proxy rotation for reliability
- Build scraping rules engine (CSS selectors, XPath)
- Implement rate limiting per domain

### Phase 14: Business Directory Scrapers
- Yelp business scraper
- Google Maps/Places data extraction
- BBB directory scraper
- Industry-specific directories
- Chamber of Commerce listings

### Phase 15: Intent Signal Detection
- Job posting monitoring (indicate growth/need)
- Funding announcement tracking
- Technology adoption signals
- Review monitoring (G2, Capterra)
- News/press release tracking

### Phase 16: Competitor Lead Capture
- Track competitors' customer reviews
- Monitor competitors' case studies
- Alternative/comparison site monitoring
- Technology switch detection
- Contract expiration prediction

### Phase 17: API Integrations for Lead Sources
- Apollo.io API integration
- ZoomInfo connector
- Clearbit API wrapper
- Hunter.io integration
- FullContact enrichment

---

## SECTION D: OUTREACH INFRASTRUCTURE (Phases 18-24)

### Phase 18: Email Sending Infrastructure
- Create `email_accounts` table for connected accounts
- OAuth integration for Gmail/Outlook
- SMTP/IMAP credential storage
- Sending domain verification (SPF, DKIM, DMARC)
- Email warmup tracking

### Phase 19: Email Campaign Builder
- Drag-and-drop email template builder
- Variable substitution ({{first_name}}, {{company}})
- A/B testing framework for subject lines
- Preview and test send functionality
- Template library with categories

### Phase 20: Email Sequences
- Multi-step sequence builder
- Conditional branching (if opened, if clicked)
- Time-based delays (wait 2 days)
- Sequence analytics (per-step metrics)
- Pause/resume sequence controls

### Phase 21: SMS/Text Messaging
- Twilio integration for SMS
- Create `sms_templates` table
- Two-way SMS with conversation threading
- SMS sequences with delays
- Opt-out handling (STOP keyword)

### Phase 22: GoHighLevel Integration
- GHL OAuth connection
- Contact sync (Cursive -> GHL)
- Pipeline/opportunity creation
- Trigger GHL workflows from Cursive
- Sync activities back to Cursive

### Phase 23: AI Voice Outreach
- Integration with AI voice provider (Bland.ai, Retell.ai)
- Call script builder with branching logic
- Voice template library
- Call recording storage and transcription
- Call outcome tracking and analytics

### Phase 24: Ringless Voicemail
- Slybroadcast or Drop.co integration
- RVM template creation and storage
- Scheduling RVM drops
- Delivery confirmation tracking
- RVM campaign analytics

---

## SECTION E: AUTOMATION & INTELLIGENCE (Phases 25-28)

### Phase 25: Workflow Automation Engine
- Create `workflows` and `workflow_steps` tables
- Visual workflow builder UI
- Trigger conditions (new lead, status change, time-based)
- Action library (send email, add tag, assign, notify)
- Workflow execution logging

### Phase 26: AI-Powered Lead Qualification
- Train model on historical lead quality
- Auto-scoring based on enrichment data
- Ideal customer profile matching
- Churn risk prediction
- Next best action recommendations

### Phase 27: Conversation Intelligence
- Email reply parsing and sentiment analysis
- Call transcription analysis
- Objection detection and categorization
- Interest signal extraction
- Auto-suggest responses

### Phase 28: Smart Scheduling
- Optimal send time calculation
- Time zone aware scheduling
- Calendar integration for follow-ups
- Meeting scheduler (Calendly-style)
- Auto-retry scheduling for bounces

---

## SECTION F: ANALYTICS & OPTIMIZATION (Phases 29-30)

### Phase 29: Advanced Analytics Dashboard
- Funnel visualization (leads -> qualified -> contacted -> won)
- Channel attribution (which sources convert best)
- Rep performance leaderboards
- Revenue attribution to campaigns
- Cohort analysis for lead aging

### Phase 30: Platform Health & Maintenance
- Automated data quality monitoring
- Stale lead detection and cleanup
- Email deliverability monitoring
- API usage and cost tracking
- Performance optimization (query analysis, caching)

---

## Implementation Notes

### Priority Order
Phases are designed to build on each other. Recommended execution order:
1. **Critical Path**: 1-2, 6-8, 18-20 (core lead + enrichment + email)
2. **High Value**: 3-5, 12, 21-22 (data quality + real-time + SMS/GHL)
3. **Expansion**: 13-17, 23-24 (advanced acquisition + voice)
4. **Intelligence**: 25-28 (automation + AI)
5. **Optimization**: 29-30 (analytics + maintenance)

### Technical Considerations
- Use Inngest for all background jobs (enrichment, sending, scraping)
- Implement circuit breakers for external API calls
- Use database transactions for multi-table operations
- Cache frequently accessed data (company info, templates)
- Consider read replicas for analytics queries

### Security Requirements
- Encrypt API credentials at rest
- Audit log all outbound communications
- Implement rate limiting on all public APIs
- GDPR/CCPA compliance for contact data
- SOC2 considerations for enterprise sales

---

*Last Updated: 2026-01-24*
