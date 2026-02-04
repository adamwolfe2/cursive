"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useState } from "react"
import { Menu, X, ChevronDown } from "lucide-react"

interface NavLink {
  href?: string
  label: string
  dropdown?: { href: string; label: string }[]
}

const navLinks: NavLink[] = [
  { href: "/services", label: "Services" },
  {
    label: "Solutions",
    dropdown: [
      { href: "/visitor-identification", label: "Visitor Identification" },
      { href: "/audience-builder", label: "Audience Builder" },
      { href: "/direct-mail", label: "Direct Mail" },
      { href: "/intent-audiences", label: "Intent Audiences" },
      { href: "/clean-room", label: "Data Clean Room" },
      { href: "/data-access", label: "Data Access" },
    ],
  },
  {
    label: "Industries",
    dropdown: [
      { href: "/industries/financial-services", label: "Financial Services" },
      { href: "/industries/ecommerce", label: "eCommerce" },
      { href: "/industries/b2b-software", label: "B2B Software" },
      { href: "/industries/agencies", label: "Agencies" },
      { href: "/industries/home-services", label: "Home Services" },
      { href: "/industries/retail", label: "Retail" },
    ],
  },
  { href: "/pricing", label: "Pricing" },
  { href: "/resources", label: "Resources" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200"
      >
        <Container>
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/cursive-logo.png"
                alt="Cursive"
                width={32}
                height={32}
                className="w-8 h-8"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => link.dropdown && setOpenDropdown(link.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  {link.dropdown ? (
                    <button className="flex items-center gap-1 text-gray-700 hover:text-[#007AFF] transition-colors">
                      {link.label}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  ) : (
                    <Link href={link.href!} className="text-gray-700 hover:text-[#007AFF] transition-colors">
                      {link.label}
                    </Link>
                  )}

                  {/* Dropdown Menu */}
                  {link.dropdown && openDropdown === link.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                    >
                      {link.dropdown.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#F7F9FB] hover:text-[#007AFF] transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </div>
              ))}
            </nav>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="https://leads.meetcursive.com"
                target="_blank"
                className="text-gray-700 hover:text-[#007AFF] transition-colors"
              >
                Login
              </Link>
              <Button size="sm" href="https://cal.com/adamwolfe/cursive-ai-audit" target="_blank">
                Book a Call
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-[#007AFF] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </Container>
      </motion.header>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 300, mass: 0.8 }}
              className="fixed top-16 right-0 bottom-0 w-full max-w-sm bg-white z-50 md:hidden overflow-y-auto shadow-2xl"
            >
              <nav className="flex flex-col p-6 space-y-1">
                {navLinks.map((link) => (
                  <div key={link.label}>
                    {link.dropdown ? (
                      <div>
                        <button
                          onClick={() => setOpenDropdown(openDropdown === link.label ? null : link.label)}
                          className="w-full px-4 py-3 text-left text-gray-900 hover:bg-[#F7F9FB] hover:text-[#007AFF] rounded-lg transition-colors flex items-center justify-between"
                        >
                          {link.label}
                          <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === link.label ? 'rotate-180' : ''}`} />
                        </button>
                        {openDropdown === link.label && (
                          <div className="ml-4 mt-1 space-y-1">
                            {link.dropdown.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#F7F9FB] hover:text-[#007AFF] rounded-lg transition-colors"
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={link.href!}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-3 text-gray-900 hover:bg-[#F7F9FB] hover:text-[#007AFF] rounded-lg transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </div>
                ))}

                <div className="border-t border-gray-200 my-4" />

                {/* Mobile CTA Buttons */}
                <Link
                  href="https://leads.meetcursive.com"
                  target="_blank"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-gray-900 hover:bg-[#F7F9FB] hover:text-[#007AFF] rounded-lg transition-colors"
                >
                  Login
                </Link>
                <Button
                  className="w-full"
                  href="https://cal.com/adamwolfe/cursive-ai-audit"
                  target="_blank"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Book a Call
                </Button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
