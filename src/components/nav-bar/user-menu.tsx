/**
 * User Profile Dropdown Menu
 * Shows user info, workspace, settings, and logout
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { User, Settings, CreditCard, Building2, LogOut, ChevronDown } from 'lucide-react'
import { useUser } from '@/hooks/use-user'

export function UserMenu() {
  const { user, logout, isLoading } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Get user initials for avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const initials = getInitials(user.full_name || user.email)

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-primary/10 text-primary'
      case 'admin':
        return 'bg-blue-100 text-blue-700'
      case 'partner':
        return 'bg-purple-100 text-purple-700'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const menuItems = [
    {
      label: 'Profile Settings',
      href: '/settings',
      icon: User,
      show: true,
    },
    {
      label: 'Workspace Settings',
      href: '/settings/workspace',
      icon: Building2,
      show: user.role === 'owner' || user.role === 'admin',
    },
    {
      label: 'Billing & Plan',
      href: '/settings/billing',
      icon: CreditCard,
      show: user.role === 'owner',
    },
    {
      label: 'Team Settings',
      href: '/settings/team',
      icon: Settings,
      show: user.role === 'owner' || user.role === 'admin',
    },
  ].filter((item) => item.show)

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
        className="flex items-center gap-2 h-9 px-3 rounded-lg hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
          {initials}
        </div>

        {/* User Name (hidden on mobile) */}
        <div className="hidden md:flex flex-col items-start">
          <span className="text-sm font-medium text-foreground leading-none">
            {user.full_name || 'User'}
          </span>
          <span className="text-xs text-muted-foreground leading-none mt-0.5 capitalize">
            {user.role}
          </span>
        </div>

        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-lg shadow-lg py-2 z-50"
          role="menu"
          aria-orientation="vertical"
        >
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      user.plan === 'pro' || user.plan === 'enterprise'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {user.plan}
                  </span>
                </div>
              </div>
            </div>

            {/* Credits Badge */}
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Daily Credits</span>
              <span className="font-medium text-foreground">
                {user.credits_remaining.toLocaleString()} / {user.daily_credit_limit.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors focus:outline-none focus:bg-accent"
                  role="menuitem"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Logout */}
          <div className="pt-1 border-t border-border">
            <button
              onClick={() => {
                setIsOpen(false)
                logout()
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors focus:outline-none focus:bg-destructive/10"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
