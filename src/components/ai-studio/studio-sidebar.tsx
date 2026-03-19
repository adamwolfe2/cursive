'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/design-system'
import {
  Home,
  Palette,
  BookOpen,
  Users,
  Tag,
  Sparkles,
  Megaphone,
} from 'lucide-react'

const aiStudioNavItems = [
  {
    name: 'Home',
    href: '/ai-studio',
    icon: <Home className="h-5 w-5" />,
  },
  {
    name: 'Branding',
    href: '/ai-studio/branding',
    icon: <Palette className="h-5 w-5" />,
  },
  {
    name: 'Knowledge Base',
    href: '/ai-studio/knowledge',
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    name: 'Customer Profiles',
    href: '/ai-studio/profiles',
    icon: <Users className="h-5 w-5" />,
  },
  {
    name: 'Offers',
    href: '/ai-studio/offers',
    icon: <Tag className="h-5 w-5" />,
  },
  {
    name: 'Creatives',
    href: '/ai-studio/creatives',
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    name: 'Campaigns',
    href: '/ai-studio/campaigns',
    icon: <Megaphone className="h-5 w-5" />,
  },
]

export function StudioSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get('workspace')

  // Add workspace query param to hrefs if it exists
  const getHrefWithWorkspace = (href: string) => {
    if (workspaceId) {
      return `${href}?workspace=${workspaceId}`
    }
    return href
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-background">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <div className="flex items-center gap-2">
          <Image src="/cursive-logo.png" alt="AI Studio" width={24} height={24} className="h-6 w-6 object-contain" />
          <span className="text-lg font-semibold text-foreground">AI Studio</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {aiStudioNavItems.map((item) => {
            // Exact match for Home, startsWith for others
            const isActive =
              item.href === '/ai-studio'
                ? pathname === '/ai-studio'
                : pathname.startsWith(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={getHrefWithWorkspace(item.href)}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
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
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
    </aside>
  )
}
