'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ChevronDown, Menu, X } from 'lucide-react'

// ─── Nav structure ────────────────────────────────────────────────────────────

const PRIMARY = [
  { href: '/admin/ops',       label: 'Ops Hub' },
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/accounts',  label: 'Accounts' },
  { href: '/admin/revenue',   label: 'Revenue' },
]

const GROUPS = [
  {
    label: 'Clients',
    items: [
      { href: '/admin/services/subscriptions', label: 'Services' },
      { href: '/admin/waitlist',               label: 'Waitlist' },
      { href: '/admin/support',                label: 'Support' },
      { href: '/admin/requests',               label: 'Feedback' },
      { href: '/admin/premium-requests',       label: 'Upgrades' },
    ],
  },
  {
    label: 'Data',
    items: [
      { href: '/admin/leads',              label: 'Leads' },
      { href: '/admin/custom-audiences',   label: 'Audiences' },
      { href: '/admin/audiencelab/pixels',   label: 'Pixels' },
      { href: '/admin/audiencelab/segments', label: 'Segments' },
    ],
  },
  {
    label: 'Partners',
    items: [
      { href: '/admin/affiliates', label: 'Applications' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/admin/payouts',           label: 'Payouts' },
      { href: '/admin/api',               label: 'API Costs' },
      { href: '/admin/credit-usage',      label: 'Credit Usage' },
      { href: '/admin/enrichment-costs',  label: 'Intel Costs' },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { href: '/admin/analytics',                  label: 'Analytics' },
      { href: '/admin/operations-health',          label: 'Ops Health' },
      { href: '/admin/failed-operations',          label: 'Failed Ops' },
      { href: '/admin/failed-jobs',                label: 'Failed Jobs' },
      { href: '/admin/monitoring/dedup-enrichment',label: 'Dedup' },
      { href: '/admin/email-deliverability',       label: 'Deliverability' },
      { href: '/admin/email-stats',                label: 'Email Stats' },
      { href: '/admin/dedup-stats',                label: 'Dedup Stats' },
      { href: '/admin/audit-logs',                 label: 'Audit Logs' },
    ],
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminNavProps {
  adminEmail: string
  needsApprovalCount: number
  upcomingBookingsCount?: number
}

// ─── Dropdown ────────────────────────────────────────────────────────────────

function NavDropdown({
  label,
  items,
  pathname,
}: {
  label: string
  items: { href: string; label: string }[]
  pathname: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isActive = items.some((i) => pathname.startsWith(i.href))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on navigation
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
          isActive
            ? 'text-zinc-900 bg-zinc-100 font-medium'
            : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
        }`}
      >
        {label}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 py-1 min-w-[160px]">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2 text-[13px] transition-colors ${
                pathname.startsWith(item.href)
                  ? 'text-zinc-900 bg-zinc-50 font-medium'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminNav({ adminEmail, needsApprovalCount, upcomingBookingsCount = 0 }: AdminNavProps) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer on navigation
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link href="/admin/ops" className="flex items-center gap-2 flex-shrink-0">
              <div className="relative h-7 w-7 overflow-hidden rounded-lg flex-shrink-0">
                <Image src="/cursive-logo.png" alt="Cursive" fill className="object-contain" priority />
              </div>
              <span className="text-sm font-semibold text-zinc-900 hidden sm:block">Cursive Admin</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5 ml-4">
              {/* Primary links */}
              {PRIMARY.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
                    pathname.startsWith(href)
                      ? 'text-zinc-900 bg-zinc-100 font-medium'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  {label}
                  {href === '/admin/ops' && upcomingBookingsCount > 0 && (
                    <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
                      {upcomingBookingsCount > 9 ? '9+' : upcomingBookingsCount}
                    </span>
                  )}
                </Link>
              ))}

              {/* AI SDR with badge */}
              <Link
                href="/admin/sdr"
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
                  pathname.startsWith('/admin/sdr')
                    ? 'text-zinc-900 bg-zinc-100 font-medium'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                AI SDR
                {needsApprovalCount > 0 && (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {needsApprovalCount > 9 ? '9+' : needsApprovalCount}
                  </span>
                )}
              </Link>

              {/* Grouped dropdowns */}
              {GROUPS.map((group) => (
                <NavDropdown
                  key={group.label}
                  label={group.label}
                  items={group.items}
                  pathname={pathname}
                />
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-zinc-400 hidden xl:block truncate max-w-[160px]">{adminEmail}</span>
              <Link
                href="/dashboard"
                className="hidden sm:block px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors whitespace-nowrap"
              >
                Exit Admin
              </Link>

              {/* Hamburger — tablet + mobile */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-md hover:bg-zinc-100 transition-colors"
                aria-label="Open menu"
              >
                <Menu size={20} className="text-zinc-600" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile / Tablet Drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-xl flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-zinc-100 flex-shrink-0">
              <span className="text-sm font-semibold text-zinc-900">Menu</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-100"
              >
                <X size={18} className="text-zinc-500" />
              </button>
            </div>

            {/* Drawer content */}
            <div className="flex-1 overflow-y-auto py-3">
              {/* Primary links */}
              <div className="px-3 mb-2">
                {PRIMARY.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center justify-between px-3 py-2.5 text-sm rounded-md mb-0.5 transition-colors ${
                      pathname.startsWith(href)
                        ? 'text-zinc-900 bg-zinc-100 font-medium'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    {label}
                    {href === '/admin/ops' && upcomingBookingsCount > 0 && (
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
                        {upcomingBookingsCount > 9 ? '9+' : upcomingBookingsCount}
                      </span>
                    )}
                  </Link>
                ))}
                <Link
                  href="/admin/sdr"
                  className={`flex items-center justify-between px-3 py-2.5 text-sm rounded-md mb-0.5 transition-colors ${
                    pathname.startsWith('/admin/sdr')
                      ? 'text-zinc-900 bg-zinc-100 font-medium'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  AI SDR
                  {needsApprovalCount > 0 && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {needsApprovalCount > 9 ? '9+' : needsApprovalCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Grouped sections */}
              {GROUPS.map((group) => (
                <div key={group.label} className="px-3 mb-2">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    {group.label}
                  </div>
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center px-3 py-2 text-sm rounded-md mb-0.5 transition-colors ${
                        pathname.startsWith(item.href)
                          ? 'text-zinc-900 bg-zinc-100 font-medium'
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>

            {/* Drawer footer */}
            <div className="border-t border-zinc-100 p-4 flex-shrink-0">
              <div className="text-[12px] text-zinc-400 mb-3 truncate">{adminEmail}</div>
              <Link
                href="/dashboard"
                className="block w-full text-center px-4 py-2 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Exit Admin
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  )
}
