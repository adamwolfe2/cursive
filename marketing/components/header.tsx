"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import Link from "next/link"
import { motion } from "framer-motion"

export function Header() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200"
    >
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-8 h-8 text-[#007AFF]"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span className="font-[var(--font-great-vibes)] text-2xl text-[#007AFF]">
              Cursive
            </span>
          </Link>

          {/* Navigation */}
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

          {/* CTA Buttons */}
          <div className="flex items-center gap-4">
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
        </div>
      </Container>
    </motion.header>
  )
}
