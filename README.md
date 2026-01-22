# OpenInfo Platform

A multi-tenant B2B lead intelligence platform that identifies companies actively researching specific topics.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Background Jobs**: Inngest
- **Payments**: Stripe
- **Email**: Resend
- **Styling**: TailwindCSS + shadcn/ui
- **State Management**: TanStack Query
- **Form Handling**: React Hook Form + Zod

## Features

- 🔍 Topic-based company intent tracking
- 👥 Multi-tenant architecture with custom branding
- 📊 Lead enrichment via DataShopper + Clay APIs
- ⚡ Background job processing with Inngest
- 💳 Stripe subscription billing (Free & Pro plans)
- 📧 Automated lead delivery via email/Slack
- 🔐 Row-level security (RLS) policies
- 📈 Trending topics dashboard
- 👤 People search with credit system

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase account
- Stripe account (for billing)
- DataShopper API key
- Clay API key
- Resend API key (for emails)
- Inngest account

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd openinfo-platform
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Fill in your environment variables in `.env.local`

5. Run database migrations:
```bash
pnpm supabase db push
```

6. Start the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
openinfo-platform/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── (auth)/            # Auth pages (login, signup)
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── queries/          # Query wizard components
│   │   ├── leads/            # Lead management components
│   │   └── ...
│   ├── lib/                   # Utility functions
│   │   ├── supabase/         # Supabase clients
│   │   ├── repositories/     # Database access layer
│   │   ├── services/         # Business logic
│   │   └── integrations/     # External API clients
│   ├── inngest/              # Background jobs
│   └── types/                # TypeScript types
├── supabase/
│   └── migrations/           # Database migrations
└── tests/                    # Test files
```

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript compiler check
- `pnpm test` - Run unit tests
- `pnpm test:e2e` - Run E2E tests
- `pnpm format` - Format code with Prettier

### Multi-Tenant Architecture

The platform supports multi-tenancy via:
- **Subdomains**: `{workspace-slug}.openinfo.com`
- **Custom domains**: `leads.yourcompany.com`
- **RLS policies**: All database queries are automatically filtered by workspace

### Security Checklist

Before every commit, ensure:
1. ✅ No hardcoded secrets
2. ✅ All user inputs validated (Zod)
3. ✅ SQL injection prevented
4. ✅ XSS prevention
5. ✅ CSRF protection
6. ✅ Authentication on protected routes
7. ✅ RLS policies tested
8. ✅ Error messages sanitized

## Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Environment Variables

See `.env.example` for required environment variables.

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
