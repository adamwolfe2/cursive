'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/design-system'

interface SidebarItem {
  name: string
  href: string
  icon: React.ReactNode
  badge?: string | number
  children?: { name: string; href: string }[]
}

interface WorkspaceInfo {
  name: string
  website_url?: string | null
  branding?: {
    logo_url?: string | null
    primary_color?: string
  } | null
  industry_vertical?: string
}

interface SidebarProps {
  items: SidebarItem[]
  workspace?: WorkspaceInfo | null
  className?: string
}

function CursiveLogo() {
  return (
    <div className="relative h-8 w-8 overflow-hidden rounded-lg">
      <Image
        src="/logo.png"
        alt="Cursive"
        fill
        className="object-contain"
        priority
      />
    </div>
  )
}

export function Sidebar({ items, workspace, className }: SidebarProps) {
  const pathname = usePathname()

  // Show workspace logo if available
  const showWorkspaceLogo = workspace?.branding?.logo_url

  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col border-r border-border bg-background',
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <CursiveLogo />
          <span className="text-lg font-semibold text-foreground">Cursive</span>
        </Link>
      </div>

      {/* Business Info Section */}
      {workspace && (
        <div className="border-b border-border px-4 py-4">
          <div className="flex items-center gap-3">
            {showWorkspaceLogo ? (
              <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-border bg-muted">
                <Image
                  src={workspace.branding!.logo_url!}
                  alt={workspace.name}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    // Hide image on error
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600">
                <span className="text-sm font-bold">
                  {workspace.name?.charAt(0)?.toUpperCase() || 'B'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {workspace.name}
              </p>
              {workspace.website_url && (
                <a
                  href={workspace.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary truncate block"
                >
                  {workspace.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              )}
              {!workspace.website_url && workspace.industry_vertical && (
                <p className="text-xs text-muted-foreground truncate">
                  {workspace.industry_vertical}
                </p>
              )}
            </div>
          </div>
          <Link
            href="/settings"
            className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
          >
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Edit Business Profile
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const hasChildren = item.children && item.children.length > 0

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center',
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.name}</span>
                  {item.badge !== undefined && (
                    <span
                      className={cn(
                        'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>

                {/* Children */}
                {hasChildren && isActive && (
                  <ul className="mt-1 ml-4 space-y-1 border-l border-border pl-4">
                    {item.children!.map((child) => {
                      const isChildActive = pathname === child.href
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={cn(
                              'block rounded-lg px-3 py-1.5 text-sm transition-colors',
                              isChildActive
                                ? 'text-primary font-medium'
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {child.name}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground">Need help?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Contact support@meetcursive.com
          </p>
          <a
            href="mailto:support@meetcursive.com"
            className="mt-2 inline-flex items-center text-xs font-medium text-primary hover:underline"
          >
            Contact support
            <svg className="ml-1 h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
      </div>
    </aside>
  )
}

// Collapsible sidebar for mobile
export function SidebarMobile({
  items,
  workspace,
  isOpen,
  onClose,
}: SidebarProps & { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname()

  React.useEffect(() => {
    onClose()
  }, [pathname, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
        <Sidebar items={items} workspace={workspace} className="h-full shadow-enterprise-xl" />
      </div>
    </>
  )
}
