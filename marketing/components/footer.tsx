import { Container } from "@/components/ui/container"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-12">
      <Container>
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
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
            </div>
            <p className="text-gray-600 text-sm">
              AI-powered lead generation and outbound automation for B2B companies.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-gray-900 mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/services#data" className="hover:text-[#007AFF] transition-colors">
                  Cursive Data
                </Link>
              </li>
              <li>
                <Link href="/services#outbound" className="hover:text-[#007AFF] transition-colors">
                  Cursive Outbound
                </Link>
              </li>
              <li>
                <Link href="/services#pipeline" className="hover:text-[#007AFF] transition-colors">
                  Cursive Pipeline
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-gray-900 mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/platform#ai-studio" className="hover:text-[#007AFF] transition-colors">
                  AI Studio
                </Link>
              </li>
              <li>
                <Link href="/platform#people-search" className="hover:text-[#007AFF] transition-colors">
                  People Search
                </Link>
              </li>
              <li>
                <Link href="/platform#marketplace" className="hover:text-[#007AFF] transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/platform#tracking" className="hover:text-[#007AFF] transition-colors">
                  Visitor Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-gray-900 mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/about" className="hover:text-[#007AFF] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#007AFF] transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-[#007AFF] transition-colors">
                  Resources
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[#007AFF] transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#007AFF] transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[#007AFF] transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <a
                  href="https://cal.com/adamwolfe/cursive-ai-audit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#007AFF] transition-colors"
                >
                  Book a Call
                </a>
              </li>
              <li>
                <a
                  href="https://leads.meetcursive.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#007AFF] transition-colors"
                >
                  Login
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Cursive. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/privacy" className="hover:text-[#007AFF] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#007AFF] transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}
