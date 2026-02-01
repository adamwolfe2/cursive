'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/accounts', label: 'Accounts' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/partners', label: 'Partners' },
  { href: '/admin/marketplace', label: 'Marketplace' },
  { href: '/admin/payouts', label: 'Payouts' },
  { href: '/admin/analytics', label: 'Analytics' },
]

export function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-zinc-300 hover:text-white"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile menu panel */}
      <div
        className={cn(
          'fixed top-16 left-0 right-0 z-50 bg-zinc-900 border-b border-zinc-800 transform transition-transform duration-200 md:hidden',
          isOpen ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <nav className="px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                )}
              >
                {item.label}
              </Link>
            )
          })}
          <div className="border-t border-zinc-800 pt-3 mt-3">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              Exit Admin
            </Link>
          </div>
        </nav>
      </div>
    </>
  )
}
