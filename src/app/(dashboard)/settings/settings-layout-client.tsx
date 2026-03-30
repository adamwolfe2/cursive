'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PageContainer, PageHeader } from '@/components/layout'

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

export function SettingsLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

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
      <div className="mb-6 border-b border-border -mx-4 px-4 md:mx-0 md:px-0">
        <nav className="-mb-px flex space-x-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {settingsTabs.map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap border-b-2 py-4 px-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
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
