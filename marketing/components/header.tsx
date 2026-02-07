"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useState } from "react"
import { Menu, X, ChevronDown, Eye, Users, Mail, Target, Database, Shield, Building2, ShoppingCart, Code, Briefcase, Home, Store } from "lucide-react"

interface DropdownItem {
  href: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavLink {
  href?: string
  label: string
  dropdown?: DropdownItem[]
}

const navLinks: NavLink[] = [
  {
    label: "Products",
    dropdown: [
      {
        href: "/marketplace",
        label: "Lead Marketplace",
        description: "Browse & buy verified B2B leads with credits",
        icon: ShoppingCart,
      },
      {
        href: "/pixel",
        label: "Visitor Pixel",
        description: "See who's visiting your website ($750/mo)",
        icon: Eye,
      },
      {
        href: "/custom-audiences",
        label: "Custom Audiences",
        description: "We build targeted lists to your exact spec",
        icon: Users,
      },
      {
        href: "/platform",
        label: "Platform Overview",
        description: "The complete Cursive platform",
        icon: Database,
      },
    ],
  },
  {
    label: "Services",
    dropdown: [
      {
        href: "/services#data",
        label: "Cursive Data",
        description: "Verified leads delivered monthly ($1k/mo)",
        icon: Database,
      },
      {
        href: "/services#outbound",
        label: "Cursive Outbound",
        description: "Done-for-you email campaigns ($2.5k/mo)",
        icon: Mail,
      },
      {
        href: "/services#pipeline",
        label: "Cursive Pipeline",
        description: "Full-stack AI SDR solution ($5k/mo)",
        icon: Target,
      },
      {
        href: "/venture-studio",
        label: "Venture Studio",
        description: "White-glove partnership ($25k+/mo)",
        icon: Building2,
      },
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
                alt="Cursive logo"
                width={32}
                height={32}
                className="w-8 h-8"
                priority
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

                  {/* Dropdown Menu - Mega Menu Style */}
                  {link.dropdown && openDropdown === link.label && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[600px] z-50"
                    >
                      {/* Invisible bridge to prevent dropdown from closing */}
                      <div className="absolute top-0 left-0 right-0 h-2" />

                      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6">
                      <div className="grid grid-cols-2 gap-3">
                        {link.dropdown.map((item) => {
                          const Icon = item.icon
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F7F9FB] transition-colors group"
                            >
                              <div className="w-10 h-10 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                <Icon className="w-5 h-5 text-gray-600 group-hover:text-[#007AFF] transition-colors" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 mb-0.5 group-hover:text-[#007AFF] transition-colors">
                                  {item.label}
                                </div>
                                <div className="text-sm text-gray-600 leading-snug">
                                  {item.description}
                                </div>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </nav>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Button size="sm" variant="outline" href="https://leads.meetcursive.com/signup?source=header" target="_blank">
                Try Free Leads
              </Button>
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
                          <div className="ml-2 mt-2 space-y-2">
                            {link.dropdown.map((item) => {
                              const Icon = item.icon
                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-[#F7F9FB] transition-colors"
                                >
                                  <div className="w-8 h-8 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Icon className="w-4 h-4 text-gray-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 text-sm mb-0.5">
                                      {item.label}
                                    </div>
                                    <div className="text-xs text-gray-600 leading-snug">
                                      {item.description}
                                    </div>
                                  </div>
                                </Link>
                              )
                            })}
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
                <Button
                  variant="outline"
                  className="w-full"
                  href="https://leads.meetcursive.com/signup?source=header"
                  target="_blank"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Try Free Leads
                </Button>
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
