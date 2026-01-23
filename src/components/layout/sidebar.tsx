'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/design-system'

interface SidebarItem {
  name: string
  href: string
  icon: React.ReactNode
  badge?: string | number
  children?: { name: string; href: string }[]
}

interface SidebarProps {
  items: SidebarItem[]
  className?: string
}

export function Sidebar({ items, className }: SidebarProps) {
  const pathname = usePathname()

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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-foreground">OpenInfo</span>
        </Link>
      </div>

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
            Check our documentation or contact support.
          </p>
          <a
            href="#"
            className="mt-2 inline-flex items-center text-xs font-medium text-primary hover:underline"
          >
            View docs
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
        <Sidebar items={items} className="h-full shadow-enterprise-xl" />
      </div>
    </>
  )
}
