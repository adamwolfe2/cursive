"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { START_CTA_LABEL, startUrl } from "@/lib/cta"
import { BOOK_CALL, NAV_LINKS, type NavItem } from "./nav-config"
import { FOCUS_RING, NAV_ICONS } from "./nav-icons"

interface MobileMenuProps {
  id: string
  onClose: () => void
}

function MobileItem({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const Icon = NAV_ICONS[item.icon]
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={`flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-[#f3f8ff] active:bg-[#eaf3ff] ${FOCUS_RING}`}
    >
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f3f8ff] text-[#007AFF]">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold text-[#0f172a]">{item.label}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-[#475569]">{item.description}</span>
      </span>
    </Link>
  )
}

/** Full-height mobile panel under the header: every destination visible, no nested toggles, CTAs pinned to the bottom. */
export function MobileMenu({ id, onClose }: MobileMenuProps) {
  const reduce = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  // Focus the first link on open; make the page behind the panel inert so Tab cannot reach it.
  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>("nav a")?.focus()
    const behind = Array.from(document.querySelectorAll<HTMLElement>("main#main-content, footer"))
    behind.forEach((el) => el.setAttribute("inert", ""))
    return () => behind.forEach((el) => el.removeAttribute("inert"))
  }, [])

  // Lock page scroll while open; close if the viewport grows past the mobile breakpoint.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const mq = window.matchMedia("(min-width: 768px)")
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) onClose()
    }
    mq.addEventListener("change", onChange)
    return () => {
      document.body.style.overflow = previous
      mq.removeEventListener("change", onChange)
    }
  }, [onClose])

  return (
    <motion.div
      id={id}
      ref={panelRef}
      initial={reduce ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: reduce ? 0 : 0.18, ease: "easeOut" }}
      className="fixed inset-x-0 bottom-0 top-16 z-[60] flex flex-col bg-white md:hidden"
    >
      <nav aria-label="Mobile" className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4">
        {NAV_LINKS.map((link) =>
          link.groups ? (
            <section key={link.label} aria-label={link.label} className="mb-5">
              <h2 className="px-3 pb-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">{link.label}</h2>
              {link.groups.map((group) => (
                <div key={group.title} className="mb-1">
                  {link.label === "Products" && (
                    <p className="px-3 pb-0.5 pt-2 text-[13px] font-semibold text-[#0066DD]">{group.title}</p>
                  )}
                  {group.items.map((item) => (
                    <MobileItem key={item.href} item={item} onClose={onClose} />
                  ))}
                </div>
              ))}
              {link.footer && (
                <div className="mt-1 border-t border-[#e3eeff] pt-2">
                  <MobileItem item={link.footer} onClose={onClose} />
                </div>
              )}
            </section>
          ) : (
            <Link
              key={link.label}
              href={link.href!}
              onClick={onClose}
              className={`mb-5 block rounded-xl px-3 py-3 text-[17px] font-semibold text-[#0f172a] transition-colors hover:bg-[#f3f8ff] ${FOCUS_RING}`}
            >
              {link.label}
            </Link>
          ),
        )}
      </nav>
      <div className="border-t border-[#e3eeff] bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <Button className={`w-full ${FOCUS_RING}`} href={startUrl("nav-mobile")} onClick={onClose}>
          {START_CTA_LABEL}
        </Button>
        <Button
          variant="outline"
          className={`mt-2 w-full ${FOCUS_RING}`}
          href={BOOK_CALL.href}
          target="_blank"
          onClick={onClose}
        >
          {BOOK_CALL.label}
        </Button>
      </div>
    </motion.div>
  )
}
