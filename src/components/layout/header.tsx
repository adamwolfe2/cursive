'use client'

import * as React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/design-system'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HeaderNotificationBell } from '@/components/notifications/header-notification-bell'
import { GlobalSearch } from '@/components/search/global-search'
import { Menu, ChevronDown, Settings, CreditCard, Bell, ExternalLink, LogOut } from 'lucide-react'

interface HeaderProps {
  user?: {
    name?: string | null
    email: string
    plan: string
    creditsRemaining: number
    totalCredits: number
    avatarUrl?: string | null
  }
  workspace?: {
    name: string
    logoUrl?: string | null
  }
  onMenuClick?: () => void
  className?: string
}

export function Header({ user, workspace, onMenuClick, className }: HeaderProps) {
  const router = useRouter()

  return (
    <header
      className={cn(
        'sticky top-0 z-sticky flex h-16 items-center border-b border-border bg-background px-4 lg:px-6',
        className
      )}
    >
      {/* Mobile menu button */}
      <button
        type="button"
        className="mr-4 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Workspace info */}
      {workspace && (
        <div className="flex items-center gap-3">
          {workspace.logoUrl ? (
            <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-border bg-muted flex-shrink-0">
              <Image
                src={workspace.logoUrl}
                alt={workspace.name}
                fill
                className="object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-indigo-100 text-primary flex-shrink-0">
              <span className="text-xs font-bold">
                {workspace.name?.charAt(0)?.toUpperCase() || 'B'}
              </span>
            </div>
          )}
          <span className="text-sm font-medium text-foreground">{workspace.name}</span>
        </div>
      )}

      {/* Global Search — center area */}
      <div className="flex flex-1 items-center justify-center px-4">
        <GlobalSearch />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Credits display — visible on all screen sizes */}
        {user && (
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">Credits:</span>
            <span className={cn(
              'text-sm font-semibold',
              user.creditsRemaining === 0 ? 'text-red-600' :
              user.creditsRemaining <= 5 ? 'text-amber-600' :
              user.creditsRemaining <= 20 ? 'text-yellow-600' :
              'text-foreground'
            )}>
              {user.creditsRemaining.toLocaleString()}
            </span>
          </div>
        )}

        {/* Plan badge */}
        {user && (
          <Badge
            variant={user.plan === 'pro' ? 'default' : 'muted'}
            className="hidden sm:inline-flex"
          >
            {user.plan === 'pro' ? 'Pro' : 'Free'}
          </Badge>
        )}

        {/* Notifications */}
        <HeaderNotificationBell />

        {/* User dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted">
              <Avatar
                name={user.name || user.email}
                src={user.avatarUrl}
                size="sm"
              />
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="font-medium text-foreground">
                  {user.name || 'User'}
                </p>
                <p className="text-xs font-normal text-muted-foreground">
                  {user.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings/billing')}>
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings/notifications')}>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings/integrations')}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Integrations
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => { window.location.href = '/auth/signout' }}
                destructive
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
