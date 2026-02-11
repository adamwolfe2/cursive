'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PageContainer, PageHeader } from '@/components/layout'

const settingsTabs = [
  { label: 'Profile', href: '/settings' },
  { label: 'Client Profile', href: '/settings/client-profile' },
  { label: 'Branding', href: '/settings/branding' },
  { label: 'Billing', href: '/settings/billing' },
  { label: 'Security', href: '/settings/security' },
  { label: 'Notifications', href: '/settings/notifications' },
  { label: 'Integrations', href: '/settings/integrations' },
  { label: 'Pixel', href: '/settings/pixel' },
]

export default function SettingsLayout({
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
      <div className="mb-6 border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {settingsTabs.map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
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
