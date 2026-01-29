/**
 * Main Navigation Bar
 * Role-based navigation with user menu and mobile support
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/hooks/use-user'
import { UserMenu } from './nav-bar/user-menu'
import { MobileMenu } from './nav-bar/mobile-menu'

interface NavItem {
  name: string
  href: string
  roles?: Array<'owner' | 'admin' | 'member' | 'partner'>
}

export function NavBar() {
  const pathname = usePathname()
  const { user, isLoading } = useUser()

  // Define all possible nav items with role restrictions
  const allNavItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      roles: ['owner', 'admin', 'member'],
    },
    {
      name: 'Marketplace',
      href: '/marketplace',
      roles: ['owner', 'admin', 'member'],
    },
    {
      name: 'Queries',
      href: '/queries',
      roles: ['owner', 'admin', 'member'],
    },
    {
      name: 'Campaigns',
      href: '/campaigns',
      roles: ['owner', 'admin', 'member'],
    },
    {
      name: 'Partner Dashboard',
      href: '/partner',
      roles: ['partner'],
    },
    {
      name: 'Partner Upload',
      href: '/partner/upload',
      roles: ['partner'],
    },
    {
      name: 'Payouts',
      href: '/partner/payouts',
      roles: ['partner'],
    },
    {
      name: 'Admin Dashboard',
      href: '/admin/dashboard',
      roles: ['owner', 'admin'],
    },
    {
      name: 'Admin Accounts',
      href: '/admin/accounts',
      roles: ['owner', 'admin'],
    },
    {
      name: 'API Tests',
      href: '/api-test',
      roles: ['owner', 'admin'],
    },
  ]

  // Filter nav items based on user role
  const navItems = allNavItems.filter((item) => {
    if (!item.roles) return true // No restriction
    if (!user) return false // Not logged in
    return item.roles.includes(user.role)
  })

  return (
    <nav className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left Section: Logo + Desktop Nav */}
          <div className="flex items-center gap-8 flex-1 min-w-0">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-base font-semibold text-foreground hidden sm:inline">
                Cursive
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1 overflow-x-auto">
              {!isLoading &&
                navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      {item.name}
                    </Link>
                  )
                })}
            </div>
          </div>

          {/* Right Section: User Menu + Mobile Menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Skip to main content link (accessibility) */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg"
            >
              Skip to main content
            </a>

            {/* User Menu (Desktop & Mobile) */}
            <UserMenu />

            {/* Mobile Menu Button */}
            <MobileMenu navItems={navItems} />
          </div>
        </div>
      </div>
    </nav>
  )
}
