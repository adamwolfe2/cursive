# Cursive Leads - B2B Intent Lead Intelligence Platform

A full-stack B2B lead generation platform that identifies companies actively researching specific topics and delivers enriched contact data with intent scoring. Built with Next.js 14, Supabase, Stripe, and Inngest.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/adamwolfe2/leadme)

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
git clone https://github.com/adamwolfe2/leadme.git
cd leadme
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
NEXT_PUBLIC_APP_NAME=OpenInfo
```

### Optional

```bash
# Slack OAuth (for integrations)
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret

# Redis (for OAuth state storage)
REDIS_URL=redis://localhost:6379
```

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

- **[CLAUDE.md](./CLAUDE.md)**: Development guidelines and best practices
- **[DEPLOYMENT.md](./DEPLOYMENT.md)**: Complete deployment guide for Vercel
- **[PHASE_*.md](./PHASE_0_PROJECT_INITIALIZATION.md)**: Detailed implementation documentation for each phase

### Phase Documentation

1. [Phase 0: Project Initialization](./PHASE_0_PROJECT_INITIALIZATION.md)
2. [Phase 1: Database Foundation](./PHASE_1_DATABASE_FOUNDATION.md)
3. [Phase 2: Authentication & Multi-Tenancy](./PHASE_2_AUTH_MULTI_TENANCY.md)
4. [Phase 3: Query Management](./PHASE_3_QUERY_MANAGEMENT.md)
5. [Phase 4: Lead Pipeline](./PHASE_4_LEAD_PIPELINE.md)
6. [Phase 5: Lead Management UI](./PHASE_5_LEAD_MANAGEMENT.md)
7. [Phase 6: People Search](./PHASE_6_PEOPLE_SEARCH.md)
8. [Phase 7: Trends Dashboard](./PHASE_7_TRENDS.md)
9. [Phase 8: Billing Integration](./PHASE_8_BILLING.md)
10. [Phase 9: Settings & Integrations](./PHASE_9_SETTINGS_INTEGRATIONS.md)

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
- GitHub Issues: [Create an issue](https://github.com/adamwolfe2/leadme/issues)
- Email: support@openinfo.com

---

**Built with ❤️ using Next.js, Supabase, and Stripe**
