# Cursive - B2B Lead Marketplace Platform

A multi-tenant SaaS platform for buying and selling verified B2B leads. Built with Next.js 15, Supabase, Stripe, and Inngest.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/adamwolfe2/cursive)

## 🚀 Features

### Core Functionality
- **Query Wizard**: 5-step wizard to create targeted lead queries with topic search, location filters, company size, and industry filters
- **Daily Lead Generation**: Automated background jobs discover new companies with intent signals matching your queries
- **Intent Scoring**: Hot/Warm/Cold lead classification based on research signal strength
- **Contact Enrichment**: Clay API integration finds decision-makers at target companies
- **Multi-Channel Delivery**: Email, Slack, and webhook delivery of new leads

### People Search
- **Credit-Based System**: Search for contacts at any company
- **Email Reveal**: Pay 1 credit to reveal email addresses
- **Email Masking**: Emails hidden until revealed (e.g., `jo**@ac**.com`)
- **Advanced Filters**: Job title, seniority, department, location

### Trends Dashboard
- **Top Gainers/Losers**: Discover emerging and declining topics
- **Trend Charts**: 12-week historical volume data with Recharts
- **Quick Tracking**: Create queries from trending topics with one click

### Billing & Plans
- **Free Plan**: $0/month, 3 credits/day, 1 query
- **Pro Plan**: $50/month, 1000 credits/day, 5 queries, multi-channel delivery
- **Stripe Integration**: Checkout, webhooks, Customer Portal
- **Plan Enforcement**: Database-level limits enforced via RLS policies

### Settings & Integrations
- **Profile Management**: Update name, view workspace info, referral program
- **Notifications**: Email and Slack notification preferences
- **Security**: Password change, session management
- **Slack Integration**: OAuth-based Slack workspace connection
- **Zapier Webhooks**: Connect to 5,000+ apps

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- TailwindCSS
- shadcn/ui components
- TanStack Query (React Query)
- TanStack Table
- React Hook Form + Zod
- Recharts
- Headless UI

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL + Auth + Real-time)
- Supabase SSR (@supabase/ssr)
- Row-Level Security (RLS) policies

**External Services:**
- DataShopper API (company discovery)
- Clay API (contact enrichment)
- Stripe (payments)
- Resend (email delivery)
- Inngest (background jobs)

**Background Jobs:**
- Daily lead generation (2 AM cron)
- Lead enrichment (event-driven)
- Lead delivery (email/Slack/webhooks)
- Platform uploads (industry-specific CRMs)
- Credit reset (midnight UTC)
- Weekly trends calculation

## 📋 Prerequisites

- Node.js 18+ and pnpm
- Supabase account
- Stripe account (for billing)
- DataShopper API key
- Clay API key
- Resend API key
- Inngest account

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/adamwolfe2/cursive.git
cd cursive
pnpm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in all required variables (see [Environment Variables](#environment-variables) section).

### 3. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run all migrations in order:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

3. Generate TypeScript types:

```bash
pnpm supabase gen types typescript --project-id your-project-id > src/types/database.types.ts
```

### 4. Set Up Stripe

1. Create products and prices in Stripe Dashboard
2. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Configure webhook events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Environment Variables

### Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# DataShopper API
DATASHOPPER_API_KEY=your_datashopper_key
DATASHOPPER_API_URL=https://api.datashopper.com/v1

# Clay API
CLAY_API_KEY=your_clay_key
CLAY_API_URL=https://api.clay.com/v1

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxx

# Resend (Email)
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Inngest
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Cursive
```

### Optional

```bash
# Slack OAuth (for integrations)
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret

# Redis (for OAuth state storage)
REDIS_URL=redis://localhost:6379
```

## 🏛️ Architecture

### System Overview

Cursive follows a **multi-tenant SaaS architecture** with strict workspace isolation enforced at the database level via Row Level Security (RLS) policies.

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Next.js 15 (App Router + Edge Runtime) │
│  ─────────────────────────────────────  │
│  • Server Components (default)          │
│  • API Routes (/api/*)                  │
│  • Middleware (auth + routing)          │
└──────┬──────────────────────────────────┘
       │
       ├──────────────┬───────────────┬────────────┐
       ▼              ▼               ▼            ▼
┌──────────┐   ┌──────────┐   ┌──────────┐  ┌──────────┐
│ Supabase │   │  Stripe  │   │ Inngest  │  │  Resend  │
│ (Auth +  │   │(Payments)│   │  (Jobs)  │  │  (Email) │
│ Database)│   └──────────┘   └──────────┘  └──────────┘
└──────────┘
     │
     └─ PostgreSQL with RLS
        • Multi-tenant isolation
        • Real-time subscriptions
        • Soft delete support
```

### Key Design Patterns

**1. Multi-Tenancy**
- Every table includes `workspace_id` foreign key
- RLS policies enforce workspace isolation on ALL queries
- No cross-tenant data leakage possible

**2. Repository Pattern**
```typescript
// All DB access goes through repositories
const repo = new LeadRepository()
const leads = await repo.findByWorkspace(workspaceId)

// Never direct Supabase calls in components/routes
```

**3. Error Handling (Phase 2)**
```typescript
// Centralized user-friendly error messages
import { getErrorMessage } from '@/lib/utils/error-messages'

try {
  // ...
} catch (error) {
  return NextResponse.json(
    { error: getErrorMessage(error) },
    { status: 500 }
  )
}
```

**4. Financial Integrity (Phase 1)**
- All financial tables use `ON DELETE RESTRICT` foreign keys
- CHECK constraints prevent invalid amounts
- Nightly balance audits detect discrepancies

**5. Performance Optimization (Phase 4)**
- Composite indexes on hot query paths
- Materialized views for aggregations (refreshed hourly)
- SQL aggregation functions replace in-app iteration

**6. GDPR Compliance (Phase 5)**
- Soft delete with 30-day grace period
- Automatic hard deletion after retention period
- Audit trail for all deletions

### Data Flow Examples

**Marketplace Purchase Flow:**
```
User clicks "Buy Leads"
  ↓
POST /api/marketplace/purchase
  ↓
Verify credits/payment
  ↓
Start transaction
  ↓
Create marketplace_purchase
  ↓
Create purchase_items (with partner attribution)
  ↓
Create partner_earnings (pending status)
  ↓
Deduct credits from workspace
  ↓
Send success response
  ↓
Inngest event: "purchase.completed"
  ↓
Update partner balances
  ↓
Send confirmation email (Resend)
```

**Commission Processing Flow (Inngest):**
```
Monthly cron (1st of month)
  ↓
Query pending_holdback commissions
  ↓
Filter by commission_payable_at < NOW()
  ↓
Update status to "payable"
  ↓
Update partner.available_balance
  ↓
Create audit_log entries
  ↓
Send notification to partners
```

### Security Architecture

**Authentication Layer:**
- Supabase Auth (JWT-based sessions)
- SSR-compatible cookie handling (`@supabase/ssr`)
- Session refresh handled automatically

**Authorization Layer:**
- RLS policies at database level (cannot be bypassed)
- Admin role checks in API routes
- Workspace isolation enforced by RLS

**Input Validation:**
- Zod schemas on all API endpoints
- Type-safe form handling (React Hook Form + Zod)
- CSV injection prevention (Phase 3)

**Rate Limiting (Phase 1):**
- Database-backed rate limiter
- Fails closed on errors (rejects requests if DB unavailable)
- 100 requests/minute per user

### Performance Considerations

**Database Optimizations (Phase 4):**
- 10+ composite indexes on critical paths
- Materialized view for partner earnings (50ms vs 5s)
- SQL aggregation for admin dashboards (100x faster)

**Caching Strategy:**
- React Query for client-side caching
- Stale-while-revalidate patterns
- Optimistic updates for instant UX

**Edge Runtime:**
- API routes run on Vercel Edge Network
- Global low-latency responses
- Automatic geographic routing

### Background Jobs (Inngest)

**Scheduled Jobs:**
- `nightly-balance-audit` - 2 AM daily (Phase 1)
- `refresh-earnings-view` - Hourly (Phase 4)
- `commission-processing` - 1st of month
- `permanent-delete-old-soft-deletes` - Daily (Phase 5)

**Event-Driven Jobs:**
- `purchase.completed` → Update balances
- `lead.verified` → Enable marketplace listing
- `webhook.retry` → Manual retry failed webhooks (Phase 5)

### Deployment Architecture

```
GitHub (main branch)
  ↓ push
Vercel Build
  ↓ success
Automatic Deployment (Edge Network)
  ↓
Production (leads.meetcursive.com)
  │
  ├─ Supabase (database + auth)
  ├─ Stripe (webhooks)
  ├─ Inngest (background jobs)
  └─ Resend (transactional email)
```

**Rollback Strategy:**
- Instant Vercel deployment rollback (<30s)
- Database migration rollback files (Phase 6)
- Blue-green deployment for zero-downtime

### Monitoring & Observability

**Application Monitoring:**
- Vercel Analytics (response time, error rate)
- Supabase Dashboard (query performance)
- Inngest Dashboard (job success rate)

**Database Monitoring:**
- `pg_stat_statements` for slow queries
- Index usage tracking
- Connection pool monitoring

**Alerting:**
- Error rate >1% → Slack notification
- Response time >2s → Email alert
- Failed webhooks → Admin dashboard (Phase 3)
- Balance discrepancies → Nightly alert (Phase 1)

## 🏗️ Project Structure

```
openinfo-platform/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Auth pages
│   │   ├── (dashboard)/         # Protected app pages
│   │   ├── api/                 # API routes
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── queries/             # Query wizard
│   │   ├── leads/               # Lead management
│   │   ├── people-search/       # People search
│   │   ├── trends/              # Trends dashboard
│   │   ├── billing/             # Billing components
│   │   └── integrations/        # Integration components
│   ├── lib/
│   │   ├── supabase/            # Supabase clients
│   │   ├── repositories/        # Database access layer
│   │   ├── services/            # Business logic
│   │   ├── integrations/        # External APIs
│   │   ├── stripe/              # Stripe integration
│   │   └── auth/                # Auth helpers
│   ├── inngest/
│   │   ├── client.ts
│   │   └── functions/           # Background jobs
│   ├── types/
│   └── middleware.ts            # Auth + multi-tenant routing
├── supabase/
│   └── migrations/              # Database migrations
├── CLAUDE.md                    # Development guidelines
├── DEPLOYMENT.md                # Deployment guide
└── package.json
```

## 📚 Documentation

### Core Documentation
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Live snapshot — file counts, baselines, data flow, subsystem map. Start here when onboarding to the code.
- **[CLAUDE.md](./CLAUDE.md)**: Development guidelines and best practices
- **[docs/deployment.md](./docs/deployment.md)**: Complete deployment guide for Vercel + Supabase
- **[docs/database-schema.md](./docs/database-schema.md)**: Database schema with RLS policies
- **[docs/api-reference.md](./docs/api-reference.md)**: REST API endpoint documentation

### Platform Excellence Roadmap (2026-02-13)

Six-phase production polish initiative:

1. **Phase 1:** Critical Security & Data Integrity ✅
   - Workspace isolation for financial tables
   - Foreign key protection (`RESTRICT` vs `SET NULL`)
   - Financial amount validation
   - Nightly balance audits

2. **Phase 2:** UX Foundation Layer ✅
   - Centralized error messages
   - Password strength indicators
   - Empty state components
   - Form validation improvements

3. **Phase 3:** Error Handling & Validation ✅
   - Webhook idempotency
   - CSV injection prevention
   - Enhanced email validation
   - Retry logic with exponential backoff

4. **Phase 4:** Performance & Indexes ✅
   - 10+ composite indexes
   - SQL aggregation functions
   - Materialized views
   - Batch query optimizations

5. **Phase 5:** Missing Features & APIs ✅
   - GDPR-compliant soft delete
   - Saved filter presets
   - Bulk operations
   - Webhook retry API

6. **Phase 6:** Polish & Developer Experience ✅
   - Migration rollback files
   - Accessibility improvements (ARIA labels)
   - Documentation (this file!)
   - TypeScript type improvements

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for detailed deployment instructions.

### Database Migrations

Migrations run automatically when connected to Supabase. To run manually:

```bash
supabase db push
```

### Background Jobs

Inngest functions are automatically registered when deployed. Verify in Inngest dashboard.

## 🔒 Security

- **RLS Policies**: Every table has Row-Level Security policies for multi-tenant isolation
- **Authentication**: Supabase Auth with @supabase/ssr patterns
- **Webhook Verification**: All webhooks verify signatures
- **Input Validation**: Zod schemas validate all API inputs
- **SQL Injection**: Prevented via parameterized queries
- **XSS**: React escapes output by default
- **CSRF**: SameSite cookies

See **[CLAUDE.md](./CLAUDE.md)** for security checklist.

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## 📊 Database Schema

The platform uses PostgreSQL via Supabase with 12+ tables:

- `workspaces` - Multi-tenant workspaces
- `users` - User profiles with plan and credits
- `queries` - Saved lead queries
- `leads` - Generated leads with intent data
- `global_topics` - Trending topics
- `trends` - Topic volume over time
- `people_search_results` - People search cache
- `credit_usage` - Credit consumption logs
- `billing_events` - Stripe events
- `integrations` - Third-party connections
- `saved_searches` - Saved people searches
- `export_jobs` - CSV export tracking

See migration files in `supabase/migrations/` for complete schema.

## 🎯 Architecture Decisions

### Repository Pattern
All database access goes through repositories for:
- Testability
- Consistent error handling
- Potential migration path

### API Routes vs Server Actions
Using API routes for all mutations for:
- Better error handling
- Easier rate limiting
- Clearer types

### Multi-Tenant Strategy
Hybrid approach:
- Subdomain routing (e.g., `demo.openinfo.com`)
- Custom domain support for enterprise
- RLS policies enforce workspace isolation

### Background Jobs (Inngest)
Event-driven architecture:
- Cron jobs for scheduled tasks
- Event-based for lead pipeline
- Built-in retries and monitoring

### State Management
React Query only (no Zustand/Redux):
- Server state is 90% of the app
- Simpler architecture
- Automatic caching and revalidation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

Follow patterns in [CLAUDE.md](./CLAUDE.md):
- Use @supabase/ssr patterns (NEVER deprecated client patterns)
- All database access through repositories
- RLS policies before exposing tables
- Test-Driven Development (80%+ coverage)
- Multi-tenant filtering in EVERY query
- Run security checklist before commits

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built following patterns from [everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

## 📧 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/adamwolfe2/cursive/issues)
- Email: support@openinfo.com

---

**Built with ❤️ using Next.js, Supabase, and Stripe**
