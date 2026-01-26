'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavBar() {
  const pathname = usePathname()

  const navItems = [
    { name: 'Admin Dashboard', href: '/admin/dashboard' },
    { name: 'Marketplace', href: '/marketplace' },
    { name: 'API Tests', href: '/api-test' }
  ]

  return (
    <nav className="bg-white border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-[15px] font-medium text-zinc-900">
              Cursive
            </Link>
            <div className="flex gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[13px] font-medium transition-colors hover:text-zinc-900 ${
                    pathname === item.href
                      ? 'text-zinc-900 border-b-2 border-zinc-900 pb-[18px]'
                      : 'text-zinc-600'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="text-[13px] text-zinc-500">
            Lead Routing Platform
          </div>
        </div>
      </div>
    </nav>
  )
}
