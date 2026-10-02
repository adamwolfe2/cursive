"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronDown, Menu, X } from "lucide-react"
import { START_CTA_LABEL, startUrl } from "@/lib/cta"
import { BOOK_CALL, NAV_LINKS, type NavItem, type NavLink } from "@/components/header/nav-config"
import { FOCUS_RING, NAV_ICONS } from "@/components/header/nav-icons"
import { MobileMenu } from "@/components/header/mobile-menu"

const MOBILE_MENU_ID = "mobile-menu"

function MenuItem({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const Icon = NAV_ICONS[item.icon]
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-[#f3f8ff] ${FOCUS_RING}`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f3f8ff] text-[#007AFF] transition-colors group-hover:bg-white">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-[#0f172a]">{item.label}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-[#475569]">{item.description}</span>
      </span>
    </Link>
  )
}

function DesktopDropdown({ link, onNavigate }: { link: NavLink; onNavigate: () => void }) {
  const groups = link.groups ?? []
  const wide = groups.length > 1
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={`absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 ${wide ? "w-[760px]" : "w-[360px]"}`}
    >
      <div className="rounded-2xl border border-[#e3eeff] bg-white p-4 shadow-[0_24px_60px_-20px_rgb(15_23_42/0.25)]">
        <div className={wide ? "grid grid-cols-3 gap-2" : "grid gap-1"}>
          {groups.map((group) => (
            <div key={group.title}>
              {wide && <p className="px-2.5 pb-1 pt-1 text-[12px] font-semibold text-[#0066DD]">{group.title}</p>}
              {group.items.map((item) => (
                <MenuItem key={item.href} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          ))}
        </div>
        {link.footer && (
          <div className="mt-3 border-t border-[#e3eeff] pt-3">
            <MenuItem item={link.footer} onNavigate={onNavigate} />
          </div>
        )}
      </div>
    </motion.div>
  )
}

function DesktopNavEntry({
  link,
  open,
  onOpen,
  onClose,
}: {
  link: NavLink
  open: boolean
  onOpen: () => void
  onClose: () => void
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const linkClass = `rounded-md px-1 py-1 text-[15px] font-medium text-[#334155] transition-colors hover:text-[#007AFF] ${FOCUS_RING}`

  if (!link.groups) {
    return (
      <Link href={link.href!} className={linkClass}>
        {link.label}
      </Link>
    )
  }

  return (
    <div
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          onClose()
          buttonRef.current?.focus()
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className={`flex items-center gap-1 ${linkClass}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => (open ? onClose() : onOpen())}
      >
        {link.label}
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && <DesktopDropdown link={link} onNavigate={onClose} />}
    </div>
  )
}

export function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  // Any navigation closes every menu (state reset during render, keyed on the route).
  const [menuPath, setMenuPath] = useState(pathname)
  if (menuPath !== pathname) {
    setMenuPath(pathname)
    setMobileOpen(false)
    setOpenMenu(null)
  }

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [mobileOpen])

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e3eeff] bg-white/85 backdrop-blur-lg">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <Link href="/" aria-label="Cursive home" className={`flex items-center gap-2.5 rounded-md ${FOCUS_RING}`}>
              <Image src="/cursive-logo.png" alt="" width={32} height={32} className="h-8 w-8" priority />
              <span className="text-[17px] font-semibold tracking-[-0.01em] text-[#0f172a]">Cursive</span>
            </Link>

            <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
              {NAV_LINKS.map((link) => (
                <DesktopNavEntry
                  key={link.label}
                  link={link}
                  open={openMenu === link.label}
                  onOpen={() => setOpenMenu(link.label)}
                  onClose={() => setOpenMenu(null)}
                />
              ))}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <Button size="sm" variant="outline" href={BOOK_CALL.href} target="_blank" className={FOCUS_RING}>
                {BOOK_CALL.label}
              </Button>
              <Button size="sm" href={startUrl("nav")} className={FOCUS_RING}>
                {START_CTA_LABEL}
              </Button>
            </div>

            <button
              ref={toggleRef}
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className={`-mr-2 grid h-11 w-11 place-items-center rounded-lg text-[#334155] transition-colors hover:text-[#007AFF] md:hidden ${FOCUS_RING}`}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls={MOBILE_MENU_ID}
            >
              {mobileOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>
        </Container>
      </header>

      <AnimatePresence>
        {mobileOpen && <MobileMenu key="mobile-menu" id={MOBILE_MENU_ID} onClose={closeMobile} />}
      </AnimatePresence>
    </>
  )
}
