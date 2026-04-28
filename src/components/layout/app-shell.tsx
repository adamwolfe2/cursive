'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/design-system'
import { Sidebar, SidebarMobile } from './sidebar'
import { Header } from './header'
import { useDismissible } from '@/lib/hooks/use-dismissible'
import {
  LayoutDashboard,
  Users,
  Send,
  Search,
  Settings,
  Briefcase,
  BarChart3,
  Gift,
  Handshake,
  Rocket,
} from 'lucide-react'

export interface NavItemConfig {
  name: string
  href: string
  icon: React.ReactNode
  section: 'main' | 'advanced' | 'admin'
  adminOnly?: boolean
  badge?: number
  requiredPlan?: ('pro' | 'admin' | 'owner')[]
  partnerOnly?: boolean
  children?: { name: string; href: string }[]
}

// Aha-moment-first navigation: 4 main items surface the core flow
// (identified visitors → leads → outreach → settings). Outbound Agent
// and deeper power-user tools live in the Advanced section, hidden until
// a user has completed initial setup. Everything else is admin-only or
// reachable by direct URL but intentionally not in the sidebar.
const navigationItems: NavItemConfig[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    section: 'main',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    name: 'Leads',
    href: '/leads',
    section: 'main',
    icon: <Users className="h-5 w-5" />,
    children: [
      { name: 'Today', href: '/leads' },
      { name: 'All Leads', href: '/leads?tab=all' },
      { name: 'Website Visitors', href: '/website-visitors' },
      { name: 'Preferences', href: '/my-leads/preferences' },
    ],
  },
  {
    name: 'Outreach',
    href: '/outreach',
    section: 'main',
    icon: <Send className="h-5 w-5" />,
    requiredPlan: ['pro', 'admin', 'owner'],
  },
  {
    name: 'Settings',
    href: '/settings',
    section: 'main',
    icon: <Settings className="h-5 w-5" />,
    children: [
      { name: 'Profile', href: '/settings' },
      { name: 'Pixel & Tracking', href: '/settings/pixel' },
      { name: 'Email Accounts', href: '/settings/email-accounts' },
      { name: 'Billing', href: '/settings/billing' },
      { name: 'Team', href: '/settings/team' },
      { name: 'Integrations', href: '/settings/integrations' },
      { name: 'GoHighLevel', href: '/integrations/ghl' },
      { name: 'Shopify', href: '/integrations/shopify' },
    ],
  },

  // ── Advanced — collapsed by default, shown for power users ──
  {
    name: 'Outbound Agent',
    href: '/outbound',
    section: 'advanced',
    icon: <Rocket className="h-5 w-5" />,
    requiredPlan: ['pro', 'admin', 'owner'],
  },
  {
    name: 'Find Leads',
    href: '/find-leads',
    section: 'advanced',
    icon: <Search className="h-5 w-5" />,
  },
  {
    name: 'CRM',
    href: '/crm/leads',
    section: 'advanced',
    icon: <Briefcase className="h-5 w-5" />,
    requiredPlan: ['pro', 'admin', 'owner'],
    children: [
      { name: 'All Leads', href: '/crm/leads' },
      { name: 'Contacts', href: '/crm/contacts' },
      { name: 'Companies', href: '/crm/companies' },
      { name: 'Deals', href: '/crm/deals' },
    ],
  },
  {
    name: 'Analytics',
    href: '/analytics',
    section: 'advanced',
    icon: <BarChart3 className="h-5 w-5" />,
    requiredPlan: ['pro', 'admin', 'owner'],
  },
  {
    name: 'Refer & Earn',
    href: '/referrals',
    section: 'advanced',
    icon: <Gift className="h-5 w-5" />,
  },
  {
    name: 'Partner Hub',
    href: '/affiliate',
    section: 'advanced',
    icon: <Handshake className="h-5 w-5" />,
    partnerOnly: true,
    requiredPlan: ['admin', 'owner'],
  },

  {
    name: 'Queries',
    href: '/queries',
    section: 'admin',
    adminOnly: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    children: [
      { name: 'All Queries', href: '/queries' },
      { name: 'New Query', href: '/queries/new' },
    ],
  },
  {
    name: 'AI Studio',
    href: '/ai-studio',
    section: 'admin',
    adminOnly: true,
    icon: (
      <Image src="/cursive-logo.png" alt="Cursive" width={20} height={20} className="h-5 w-5 object-contain" />
    ),
  },
  {
    name: 'Lead Data',
    href: '/data',
    section: 'admin',
    adminOnly: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
    children: [
      { name: 'All Leads', href: '/leads' },
      { name: 'Discover', href: '/leads/discover' },
      { name: 'Raw Data', href: '/data' },
    ],
  },
  {
    name: 'AI Agents',
    href: '/agents',
    section: 'admin',
    adminOnly: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    children: [
      { name: 'All Agents', href: '/agents' },
      { name: 'Create New', href: '/agents/new' },
    ],
  },
  {
    name: 'Campaigns',
    href: '/campaigns',
    section: 'admin',
    adminOnly: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    children: [
      { name: 'All Campaigns', href: '/campaigns' },
      { name: 'Create New', href: '/campaigns/new' },
      { name: 'Review Queue', href: '/campaigns/reviews' },
    ],
  },
  {
    name: 'Templates',
    href: '/templates',
    section: 'admin',
    adminOnly: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
]

interface AppShellProps {
  children: React.ReactNode
  user?: {
    name?: string | null
    email: string
    plan: string
    role: string
    creditsRemaining: number
    totalCredits: number
    avatarUrl?: string | null
    isPartner?: boolean
  }
  workspace?: {
    name: string
    logoUrl?: string | null
  }
  todayLeadCount?: number
  hotLeadCount?: number
}

const CREDITS_BANNER_PATHS = ['/leads', '/find-leads', '/lead-database', '/people-search', '/website-visitors']

export function AppShell({ children, user, workspace, todayLeadCount, hotLeadCount }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const { dismissed: creditsBannerDismissed, dismiss: dismissCreditsBanner } = useDismissible('cursive_credits_banner_dismissed', 24)
  const pathname = usePathname()

  const isAdmin = user?.role === 'admin' || user?.role === 'owner'
  const userPlan = user?.plan || 'free'
  const isPartner = user?.isPartner || false

  const filteredNavItems = navigationItems
    .filter((item) => {
      if (item.adminOnly) {
        return isAdmin
      }
      if (item.partnerOnly && !isPartner && !isAdmin) {
        return false
      }
      if (item.requiredPlan) {
        if (isAdmin) return true
        return item.requiredPlan.includes(userPlan as 'pro' | 'admin' | 'owner')
      }
      return true
    })
    .map((item) => {
      if (item.href === '/dashboard' && todayLeadCount && todayLeadCount > 0) {
        return { ...item, badge: todayLeadCount }
      }
      if (item.href === '/leads' && hotLeadCount && hotLeadCount > 0) {
        return { ...item, badge: hotLeadCount }
      }
      return item
    })

  return (
    <div className="flex min-h-screen bg-muted/30">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
        <Sidebar items={filteredNavItems} />
      </div>

      <SidebarMobile
        items={filteredNavItems}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* min-w-0 is critical here. Without it, flex children expand to their
          content width and wide tables (e.g. CRM leads table) push the column
          wider than the viewport, causing the table to render BEHIND the
          fixed sidebar. The min-w-0 lets the flex layout constrain properly. */}
      <div className="flex flex-1 flex-col min-w-0 lg:pl-64">
        <Header
          user={user}
          workspace={workspace}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        {user && typeof user.creditsRemaining === 'number' && user.creditsRemaining <= 3 && !creditsBannerDismissed && CREDITS_BANNER_PATHS.some(p => pathname.startsWith(p)) && (
          <div className={cn(
            'flex items-center justify-between gap-4 px-4 py-1.5 sm:px-6 lg:px-8 text-xs',
            user.creditsRemaining === 0
              ? 'bg-red-600 text-white'
              : 'bg-amber-500 text-white'
          )}>
            <div className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>
                {user.creditsRemaining === 0
                  ? 'You\'re out of enrichment credits — leads can\'t be enriched until you top up.'
                  : `Only ${user.creditsRemaining} enrichment credit${user.creditsRemaining === 1 ? '' : 's'} remaining.`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/settings/billing"
                className="shrink-0 rounded-md border border-white/40 px-3 py-1 text-xs font-semibold hover:bg-white/10 transition-colors"
              >
                Buy Credits
              </Link>
              <button
                onClick={dismissCreditsBanner}
                className="shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
                aria-label="Dismiss credits banner"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        <main
          id="main-content"
          className="flex-1 min-w-0 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
