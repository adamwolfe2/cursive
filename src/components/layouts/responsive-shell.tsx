'use client'

import { ReactNode, useState } from 'react'
import { MobileMenu } from '@/components/ui/mobile-menu'

interface ResponsiveShellProps {
  children: ReactNode
  sidebar: ReactNode
  header?: ReactNode
  mobileMenuTriggerClassName?: string
}

/**
 * Responsive layout shell with sidebar
 * - Mobile: Hamburger menu with drawer
 * - Desktop: Fixed sidebar (256px)
 */
export function ResponsiveShell({
  children,
  sidebar,
  header,
}: ResponsiveShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gradient-cursive-soft">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden lg:block lg:w-64 border-r border-blue-100/50 bg-white/80 backdrop-blur-sm">
        {sidebar}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header with Mobile Menu */}
          {header && (
            <header className="border-b border-blue-100/50 bg-white/80 backdrop-blur-sm">
              {header}
            </header>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Menu - Only visible on mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <MobileMenu
          isOpen={mobileMenuOpen}
          onOpen={() => setMobileMenuOpen(true)}
          onClose={() => setMobileMenuOpen(false)}
        >
          {sidebar}
        </MobileMenu>
      </div>
    </div>
  )
}

/**
 * Sidebar content wrapper
 * Provides consistent styling for sidebar navigation
 */
export function SidebarContent({ children }: { children: ReactNode }) {
  return (
    <div className="p-6">
      {children}
    </div>
  )
}

/**
 * Sidebar section component
 */
interface SidebarSectionProps {
  title: string
  children: ReactNode
}

export function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
        {title}
      </h3>
      <nav className="space-y-1.5">
        {children}
      </nav>
    </div>
  )
}

/**
 * Responsive header component
 */
interface ResponsiveHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  showMobileMenu?: boolean
  mobileMenuContent?: ReactNode
}

export function ResponsiveHeader({
  title,
  description,
  actions,
  showMobileMenu = false,
  mobileMenuContent
}: ResponsiveHeaderProps) {
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false)

  return (
    <div className="px-4 sm:px-6 py-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Mobile Menu Button */}
          {showMobileMenu && mobileMenuContent && (
            <div className="lg:hidden flex-shrink-0">
              <MobileMenu
                isOpen={headerMenuOpen}
                onOpen={() => setHeaderMenuOpen(true)}
                onClose={() => setHeaderMenuOpen(false)}
              >
                {mobileMenuContent}
              </MobileMenu>
            </div>
          )}

          {/* Title & Description */}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-cursive bg-clip-text text-transparent truncate">
              {title}
            </h1>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-1.5 truncate">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
