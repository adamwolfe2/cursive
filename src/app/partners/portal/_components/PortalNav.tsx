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
  { href: '/partners/portal/links', label: 'Links', icon: Link2 },
  { href: '/partners/portal/achievements', label: 'Tiers', icon: Trophy },
  { href: '/partners/portal/agreement', label: 'Agreement', icon: FileSignature },
] as const

export function PortalNav() {
  const pathname = usePathname()

  return (
    <nav className="-mx-4 mb-5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max gap-2">
        {NAV.map((item) => {
          const exact = 'exact' in item && item.exact
          const active = exact ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                active
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:text-gray-900'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
