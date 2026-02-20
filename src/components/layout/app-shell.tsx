'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/design-system'
import { Sidebar, SidebarMobile } from './sidebar'
import { Header } from './header'

// Navigation item configuration
interface NavItemConfig {
  name: string
  href: string
  icon: React.ReactNode
  subText?: string
  section: 'leads' | 'crm' | 'actions' | 'account' | 'admin'
  adminOnly?: boolean
  badge?: number
  children?: { name: string; href: string }[]
}

// Section labels displayed as uppercase headers in the sidebar
export const sectionLabels: Record<string, string> = {
  leads: 'Your Leads',
  crm: 'CRM',
  actions: 'Take Action',
  account: 'Account',
  admin: 'Admin',
}

// Navigation items for the sidebar
// Items marked with adminOnly: true are only visible to admin/owner roles
const navigationItems: NavItemConfig[] = [
  // ── Your Leads ──
  {
    name: 'Dashboard',
    href: '/dashboard',
    section: 'leads',
    subText: 'Overview & activity',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    name: 'Daily Leads',
    href: '/leads',
    section: 'leads',
    subText: 'Fresh leads every morning',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
        />
      </svg>
    ),
  },
  {
    name: 'Website Visitors',
    href: '/website-visitors',
    section: 'leads',
    subText: 'See who\'s on your site',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    ),
  },
  {
    name: 'My Leads',
    href: '/my-leads',
    section: 'leads',
    subText: 'Assigned leads & preferences',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    children: [
      { name: 'Assigned Leads', href: '/my-leads' },
      { name: 'Targeting Preferences', href: '/my-leads/preferences' },
    ],
  },
  // ── CRM ──
  {
    name: 'Lead Manager',
    href: '/crm/leads',
    section: 'crm',
    subText: 'Full CRM & pipeline',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
    children: [
      { name: 'All Leads', href: '/crm/leads' },
      { name: 'Contacts', href: '/crm/contacts' },
      { name: 'Companies', href: '/crm/companies' },
      { name: 'Deals', href: '/crm/deals' },
    ],
  },
  {
    name: 'Lead Database',
    href: '/lead-database',
    section: 'leads',
    subText: 'Browse & buy verified leads',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
        />
      </svg>
    ),
  },
  // ── Take Action ──
  {
    name: 'Activate',
    href: '/activate',
    section: 'actions',
    subText: 'Launch outreach campaigns',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    name: 'Refer & Earn',
    href: '/marketplace/referrals',
    section: 'actions',
    subText: 'Earn credits for referrals',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
  },
  // People Search removed — requires Clay API (not configured)
  // Route still accessible at /people-search for future use
  // ── Account ──
  {
    name: 'Settings',
    href: '/settings',
    section: 'account',
    subText: 'Profile, billing & pixel',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    children: [
      { name: 'Profile', href: '/settings' },
      { name: 'Billing', href: '/settings/billing' },
      { name: 'Pixel & Tracking', href: '/settings/pixel' },
      { name: 'Integrations', href: '/settings/integrations' },
      { name: 'Notifications', href: '/settings/notifications' },
      { name: 'Security', href: '/settings/security' },
    ],
  },
  {
    name: 'API Docs',
    href: '/docs/api',
    section: 'account',
    subText: 'Endpoint reference',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
    ),
  },
  // ── Admin Only ──
  {
    name: 'AI Studio',
    href: '/ai-studio',
    section: 'admin',
    adminOnly: true,
    icon: (
      <img src="/cursive-logo.png" alt="Cursive" className="h-5 w-5 object-contain" />
    ),
  },
  {
    name: 'Lead Data',
    href: '/data',
    section: 'admin',
    adminOnly: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
        />
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
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
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
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
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
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
        />
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
  }
  workspace?: {
    name: string
    logoUrl?: string | null
  }
  todayLeadCount?: number
}

export function AppShell({ children, user, workspace, todayLeadCount }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Filter navigation items based on user role
  // Admin and owner can see all items, regular members can't see admin-only items
  const isAdmin = user?.role === 'admin' || user?.role === 'owner'
  const filteredNavItems = navigationItems
    .filter((item) => {
      if ('adminOnly' in item && item.adminOnly) {
        return isAdmin
      }
      return true
    })
    .map((item) => {
      // Attach today's lead count badge to the Dashboard nav item
      if (item.href === '/dashboard' && todayLeadCount && todayLeadCount > 0) {
        return { ...item, badge: todayLeadCount }
      }
      return item
    })

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
        <Sidebar items={filteredNavItems} />
      </div>

      {/* Mobile sidebar */}
      <SidebarMobile
        items={filteredNavItems}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <Header
          user={user}
          workspace={workspace}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        {/* Credits low persistent banner */}
        {user && typeof user.creditsRemaining === 'number' && user.creditsRemaining <= 3 && (
          <div className={cn(
            'flex items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8 text-sm',
            user.creditsRemaining === 0
              ? 'bg-red-600 text-white'
              : 'bg-amber-500 text-white'
          )}>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>
                {user.creditsRemaining === 0
                  ? 'You\'re out of enrichment credits — leads can\'t be enriched until you top up.'
                  : `Only ${user.creditsRemaining} enrichment credit${user.creditsRemaining === 1 ? '' : 's'} remaining.`}
              </span>
            </div>
            <Link
              href="/settings/billing"
              className="shrink-0 rounded-md border border-white/40 px-3 py-1 text-xs font-semibold hover:bg-white/10 transition-colors"
            >
              Buy Credits
            </Link>
          </div>
        )}
        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  )
}
