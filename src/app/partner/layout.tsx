'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Upload,
  History,
  DollarSign,
  Banknote,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

interface PartnerLayoutProps {
  children: React.ReactNode
}

export default function PartnerLayout({ children }: PartnerLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const navItems = [
    {
      label: 'Dashboard',
      href: '/partner/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Upload Leads',
      href: '/partner/upload',
      icon: Upload,
    },
    {
      label: 'Upload History',
      href: '/partner/uploads',
      icon: History,
    },
    {
      label: 'Earnings',
      href: '/partner/earnings',
      icon: DollarSign,
    },
    {
      label: 'Payouts',
      href: '/partner/payouts',
      icon: Banknote,
    },
    {
      label: 'Settings',
      href: '/partner/settings',
      icon: Settings,
    },
  ]

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 md:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-md p-2 hover:bg-zinc-800"
          >
            {isSidebarOpen ? (
              <X className="h-5 w-5 text-zinc-400" />
            ) : (
              <Menu className="h-5 w-5 text-zinc-400" />
            )}
          </button>
          <span className="font-semibold text-white">Partner Portal</span>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 border-r border-zinc-800 bg-zinc-950 transition-transform duration-200 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex h-14 items-center border-b border-zinc-800 px-4">
          <Link href="/partner/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/90">
              <span className="text-sm font-bold text-white">C</span>
            </div>
            <span className="font-semibold text-white">Partner Portal</span>
          </Link>
        </div>

        <nav className="p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  onClick={() => isMobile && setIsSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 border-t border-zinc-800 pt-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Back to Dashboard
            </button>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main
        className={`min-h-screen pt-14 transition-all duration-200 md:pt-0 ${
          isSidebarOpen ? 'md:ml-64' : ''
        }`}
      >
        <div className="p-4 md:p-8">{children}</div>
      </main>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}
