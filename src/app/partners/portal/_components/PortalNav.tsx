'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Wallet,
  Link2,
  FileSignature,
  Trophy,
} from 'lucide-react'

const NAV = [
  { href: '/partners/portal', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/partners/portal/referrals', label: 'Referrals', icon: Users },
  { href: '/partners/portal/payouts', label: 'Payouts', icon: Wallet },
  { href: '/partners/portal/links', label: 'Links & Assets', icon: Link2 },
  { href: '/partners/portal/achievements', label: 'Achievements', icon: Trophy },
  { href: '/partners/portal/agreement', label: 'Agreement', icon: FileSignature },
] as const

export function PortalNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-1 border-b border-gray-200 mb-8">
      {NAV.map((item) => {
        const exact = 'exact' in item && item.exact
        const active = exact ? pathname === item.href : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
