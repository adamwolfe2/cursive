"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useState } from "react"
import { Menu, X } from "lucide-react"

const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/platform", label: "Platform" },
  { href: "/about", label: "About" },
  { href: "/resources", label: "Resources" },
  { href: "/blog", label: "Blog" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
              <Link href="/services" className="text-gray-700 hover:text-[#007AFF] transition-colors">
                Services
              </Link>
              <Link href="/pricing" className="text-gray-700 hover:text-[#007AFF] transition-colors">
                Pricing
              </Link>
              <Link href="/platform" className="text-gray-700 hover:text-[#007AFF] transition-colors">
                Platform
              </Link>
              <Link href="/resources" className="text-gray-700 hover:text-[#007AFF] transition-colors">
                Resources
              </Link>
              <Link href="/blog" className="text-gray-700 hover:text-[#007AFF] transition-colors">
                Blog
              </Link>
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
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-gray-900 hover:bg-[#F7F9FB] hover:text-[#007AFF] rounded-lg transition-colors"
                  >
                    {link.label}
                  </Link>
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
