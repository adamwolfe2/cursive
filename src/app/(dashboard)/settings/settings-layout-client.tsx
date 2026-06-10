'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PageContainer, PageHeader } from '@/components/layout'
import { useDashboard } from '@/lib/contexts/dashboard-context'

const settingsTabs = [
  { label: 'Profile', href: '/settings' },
  { label: 'Client Profile', href: '/settings/client-profile' },
  { label: 'Branding', href: '/settings/branding' },
  { label: 'Billing', href: '/settings/billing' },
  { label: 'Team', href: '/settings/team' },
  { label: 'Security', href: '/settings/security' },
  { label: 'Notifications', href: '/settings/notifications' },
  { label: 'Email Accounts', href: '/settings/email-accounts' },
  { label: 'Integrations', href: '/settings/integrations' },
  { label: 'Pixel', href: '/settings/pixel' },
  { label: 'API Keys', href: '/settings/api-keys' },
  { label: 'Webhooks', href: '/settings/webhooks' },
]

// A funnel / managed buyer only needs the essentials. Hides the agency /
// marketplace surfaces (client profile, branding, email accounts, integrations,
// API keys, webhooks, team) that bloat their settings.
const MANAGED_TAB_HREFS = new Set([
  '/settings',
  '/settings/pixel',
  '/settings/billing',
])

export function SettingsLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { managed } = useDashboard()
  const tabs = managed
    ? settingsTabs.filter((t) => MANAGED_TAB_HREFS.has(t.href))
    : settingsTabs

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings' },
        ]}
      />

      {/* Navigation Tabs */}
      <div className="-mx-4 mb-6 border-b border-border px-4 md:mx-0 md:px-0">
        <nav className="-mb-px flex space-x-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap border-b-2 px-3 py-4 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {children}
    </PageContainer>
  )
}
