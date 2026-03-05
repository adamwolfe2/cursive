'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Settings,
  LogOut,
  ExternalLink,
} from 'lucide-react'

interface Affiliate {
  first_name: string
  last_name: string
  partner_code: string
  current_tier: number
}

const TIER_NAMES = ['Starter', 'Builder', 'Grower', 'Scaler', 'Pro', 'Elite', 'Legend']

const NAV = [
  { href: '/affiliate/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/affiliate/referrals', label: 'Referrals', icon: Users },
  { href: '/affiliate/commissions', label: 'Commissions', icon: DollarSign },
  { href: '/affiliate/settings', label: 'Settings', icon: Settings },
]

export function AffiliateSidebar({ affiliate }: { affiliate: Affiliate }) {
  const pathname = usePathname()

  return (
    <aside className="w-56 border-r border-zinc-200 bg-white flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-5 border-b border-zinc-100">
        <div className="text-[13px] font-semibold text-zinc-900">
          {affiliate.first_name} {affiliate.last_name}
        </div>
        <div className="text-[11px] text-zinc-400 mt-0.5">
          {TIER_NAMES[affiliate.current_tier] || 'Starter'} · Tier {affiliate.current_tier}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-lg transition-colors ${
                active
                  ? 'bg-zinc-100 text-zinc-900 font-medium'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              <Icon size={14} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-zinc-100 space-y-0.5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 text-[12px] text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-50 transition-colors"
        >
          <ExternalLink size={13} />
          Back to Dashboard
        </Link>
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-2.5 px-3 py-2 text-[12px] text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-50 transition-colors"
        >
          <LogOut size={13} />
          Sign out
        </Link>
      </div>
    </aside>
  )
}
