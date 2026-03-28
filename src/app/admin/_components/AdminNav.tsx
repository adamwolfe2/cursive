'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ChevronDown, Menu, X } from 'lucide-react'

// ─── Nav structure ────────────────────────────────────────────────────────────

const PRIMARY = [
  { href: '/admin/ops',             label: 'Ops Hub' },
  { href: '/admin/dashboard',       label: 'Dashboard' },
  { href: '/admin/accounts',        label: 'Accounts' },
  { href: '/admin/revenue',         label: 'Revenue' },
  { href: '/admin/onboarding',      label: 'Onboarding' },
  { href: '/admin/autoresearch',    label: 'Autoresearch' },
  { href: '/admin/sdr',             label: 'AI SDR' },
  { href: '/admin/deal-calculator', label: 'Deal Calculator' },
  { href: '/admin/onboarding/new',  label: 'New Client' },
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
    label: 'Campaigns',
    items: [
      { href: '/admin/campaigns', label: 'Campaigns' },
      { href: '/admin/templates', label: 'Templates' },
      { href: '/admin/agents',    label: 'AI Agents' },
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
      { href: '/admin/classifications',            label: 'Classifications' },
    ],
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminNavProps {
  adminEmail: string
  needsApprovalCount: number
  upcomingBookingsCount?: number
}

// ─── Collapsible group ────────────────────────────────────────────────────────

function SidebarGroup({
  label,
  items,
  pathname,
  onNavigate,
}: {
  label: string
  items: { href: string; label: string }[]
  pathname: string
  onNavigate: () => void
}) {
  const isActive = items.some((i) => pathname.startsWith(i.href))
  const [open, setOpen] = useState(isActive)

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
          isActive
            ? 'text-zinc-900 font-medium'
            : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
        }`}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
        <ChevronDown
          size={14}
          className={`text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="ml-1 mt-0.5">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center px-3 py-1.5 text-[13px] rounded-md mb-0.5 transition-colors ${
                pathname.startsWith(item.href)
                  ? 'text-zinc-900 bg-zinc-100 font-medium'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on navigation
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  const closeSidebar = () => setSidebarOpen(false)

  // Find current page label for the header
  const currentLabel = (() => {
    for (const p of PRIMARY) {
      if (pathname.startsWith(p.href)) return p.label
    }
    if (pathname.startsWith('/admin/sdr')) return 'AI SDR'
    for (const g of GROUPS) {
      for (const item of g.items) {
        if (pathname.startsWith(item.href)) return item.label
      }
    }
    return 'Admin'
  })()

  return (
    <>
      {/* Slim top bar — logo, current page, hamburger */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
        <div className="flex items-center justify-between h-12 px-4">
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-zinc-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={18} className="text-zinc-600" />
            </button>
            <Link href="/admin/ops" className="flex items-center gap-2">
              <div className="relative h-6 w-6 overflow-hidden rounded-lg flex-shrink-0">
                <Image src="/cursive-logo.png" alt="Cursive" fill className="object-contain" priority />
              </div>
              <span className="text-sm font-semibold text-zinc-900">Cursive</span>
            </Link>
          </div>

          {/* Center: current page */}
          <span className="text-sm text-zinc-500 font-medium">{currentLabel}</span>

          {/* Right: email + exit */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 hidden sm:block truncate max-w-[140px]">{adminEmail}</span>
            <Link
              href="/dashboard"
              className="px-2.5 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors"
            >
              Exit
            </Link>
          </div>
        </div>
      </header>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-xl flex flex-col transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-zinc-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative h-6 w-6 overflow-hidden rounded-lg flex-shrink-0">
              <Image src="/cursive-logo.png" alt="Cursive" fill className="object-contain" />
            </div>
            <span className="text-sm font-semibold text-zinc-900">Admin</span>
          </div>
          <button
            onClick={closeSidebar}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-100"
          >
            <X size={16} className="text-zinc-400" />
          </button>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-y-auto py-3 px-2">
          {/* Primary links */}
          <div className="mb-3">
            {PRIMARY.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={closeSidebar}
                className={`flex items-center justify-between px-3 py-2 text-sm rounded-md mb-0.5 transition-colors ${
                  pathname.startsWith(href)
                    ? 'text-zinc-900 bg-zinc-100 font-medium'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
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
            <Link
              href="/admin/sdr"
              onClick={closeSidebar}
              className={`flex items-center justify-between px-3 py-2 text-sm rounded-md mb-0.5 transition-colors ${
                pathname.startsWith('/admin/sdr')
                  ? 'text-zinc-900 bg-zinc-100 font-medium'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              AI SDR
              {needsApprovalCount > 0 && (
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {needsApprovalCount > 9 ? '9+' : needsApprovalCount}
                </span>
              )}
            </Link>
          </div>

          {/* Divider */}
          <div className="border-t border-zinc-100 my-2" />

          {/* Grouped sections with collapsible dropdowns */}
          {GROUPS.map((group) => (
            <SidebarGroup
              key={group.label}
              label={group.label}
              items={group.items}
              pathname={pathname}
              onNavigate={closeSidebar}
            />
          ))}
        </div>

        {/* Quick links to other sections */}
        <div className="border-t border-zinc-100 p-2 flex-shrink-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-3 py-1">Quick Links</div>
          <Link href="/marketplace" onClick={closeSidebar} className="flex items-center px-3 py-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-md">
            Marketplace
          </Link>
          <Link href="/developers" onClick={closeSidebar} className="flex items-center px-3 py-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-md">
            API Docs
          </Link>
          <Link href="/admin/api-costs" onClick={closeSidebar} className="flex items-center px-3 py-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 rounded-md">
            API Costs
          </Link>
        </div>

        {/* Sidebar footer */}
        <div className="border-t border-zinc-100 p-3 flex-shrink-0">
          <div className="text-[11px] text-zinc-400 mb-2 truncate">{adminEmail}</div>
          <Link
            href="/dashboard"
            className="block w-full text-center px-3 py-1.5 text-xs font-medium text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Exit Admin
          </Link>
        </div>
      </div>
    </>
  )
}
