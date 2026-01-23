'use client'

/**
 * Marketing Site Navigation
 * OpenInfo Platform
 *
 * Clean, minimal navigation with smooth animations.
 */

import * as React from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { cn } from '@/lib/design-system'
import { AnimatedButton } from '../ui/animated-components'

// ============================================
// TYPES
// ============================================

interface NavLink {
  label: string
  href: string
  children?: NavLink[]
}

interface NavigationProps {
  className?: string
}

// ============================================
// NAV LINKS
// ============================================

const navLinks: NavLink[] = [
  {
    label: 'Product',
    href: '/product',
    children: [
      { label: 'Features', href: '/features' },
      { label: 'Integrations', href: '/integrations' },
      { label: 'Security', href: '/security' },
      { label: 'Roadmap', href: '/roadmap' },
    ],
  },
  {
    label: 'Solutions',
    href: '/solutions',
    children: [
      { label: 'For Teams', href: '/solutions/teams' },
      { label: 'For Enterprise', href: '/solutions/enterprise' },
      { label: 'For Agencies', href: '/solutions/agencies' },
    ],
  },
  { label: 'Pricing', href: '/pricing' },
  {
    label: 'Resources',
    href: '/resources',
    children: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Blog', href: '/blog' },
      { label: 'Case Studies', href: '/case-studies' },
      { label: 'Help Center', href: '/help' },
    ],
  },
  { label: 'About', href: '/about' },
]

// ============================================
// NAVIGATION COMPONENT
// ============================================

export function Navigation({ className }: NavigationProps) {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50)
  })

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-white/80 backdrop-blur-xl border-b border-neutral-200/50 shadow-sm'
            : 'bg-transparent',
          className
        )}
      >
        <nav className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">O</span>
                </div>
                <span className="font-semibold text-lg text-neutral-900">OpenInfo</span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavItem
                  key={link.href}
                  link={link}
                  isActive={activeDropdown === link.label}
                  onMouseEnter={() => link.children && setActiveDropdown(link.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                />
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Sign in
              </Link>
              <AnimatedButton variant="primary" size="sm">
                Get Started
              </AnimatedButton>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 -mr-2"
              aria-label="Toggle menu"
            >
              <motion.div className="w-6 h-5 relative">
                <motion.span
                  animate={{
                    rotate: isMobileMenuOpen ? 45 : 0,
                    y: isMobileMenuOpen ? 8 : 0,
                  }}
                  className="absolute top-0 left-0 w-6 h-0.5 bg-neutral-900 rounded-full"
                />
                <motion.span
                  animate={{
                    opacity: isMobileMenuOpen ? 0 : 1,
                  }}
                  className="absolute top-2 left-0 w-6 h-0.5 bg-neutral-900 rounded-full"
                />
                <motion.span
                  animate={{
                    rotate: isMobileMenuOpen ? -45 : 0,
                    y: isMobileMenuOpen ? -8 : 0,
                  }}
                  className="absolute top-4 left-0 w-6 h-0.5 bg-neutral-900 rounded-full"
                />
              </motion.div>
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <MobileMenu
            links={navLinks}
            onClose={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ============================================
// NAV ITEM
// ============================================

interface NavItemProps {
  link: NavLink
  isActive: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}

function NavItem({ link, isActive, onMouseEnter, onMouseLeave }: NavItemProps) {
  const hasChildren = link.children && link.children.length > 0

  return (
    <div
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Link
        href={link.href}
        className={cn(
          'px-4 py-2 text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-1',
          'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/50'
        )}
      >
        {link.label}
        {hasChildren && (
          <motion.svg
            animate={{ rotate: isActive ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        )}
      </Link>

      {/* Dropdown */}
      <AnimatePresence>
        {hasChildren && isActive && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-neutral-200/60 overflow-hidden"
          >
            <div className="py-2">
              {link.children?.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="block px-4 py-2.5 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// MOBILE MENU
// ============================================

interface MobileMenuProps {
  links: NavLink[]
  onClose: () => void
}

function MobileMenu({ links, onClose }: MobileMenuProps) {
  const [expandedItems, setExpandedItems] = React.useState<string[]>([])

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 lg:hidden"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
      />

      {/* Menu Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <span className="font-semibold text-lg">Menu</span>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-neutral-600 hover:text-neutral-900"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Links */}
          <div className="flex-1 overflow-y-auto py-4">
            {links.map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {link.children ? (
                  <div>
                    <button
                      onClick={() => toggleExpand(link.label)}
                      className="w-full flex items-center justify-between px-6 py-3 text-left text-neutral-900 font-medium"
                    >
                      {link.label}
                      <motion.svg
                        animate={{ rotate: expandedItems.includes(link.label) ? 180 : 0 }}
                        className="w-5 h-5 text-neutral-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </button>
                    <AnimatePresence>
                      {expandedItems.includes(link.label) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden bg-neutral-50"
                        >
                          {link.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={onClose}
                              className="block px-8 py-2.5 text-sm text-neutral-600 hover:text-neutral-900"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="block px-6 py-3 text-neutral-900 font-medium"
                  >
                    {link.label}
                  </Link>
                )}
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="p-6 border-t border-neutral-200 space-y-3">
            <Link
              href="/login"
              onClick={onClose}
              className="block w-full py-3 text-center text-neutral-600 font-medium"
            >
              Sign in
            </Link>
            <AnimatedButton
              variant="primary"
              size="lg"
              className="w-full"
              onClick={onClose}
            >
              Get Started Free
            </AnimatedButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Navigation
