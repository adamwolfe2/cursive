import { Container } from "@/components/ui/container"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-12">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <div className="flex items-center mb-4">
              <img
                src="/cursive-logo.png"
                alt="Cursive"
                className="w-8 h-8"
                loading="lazy"
              />
            </div>
            <p className="text-xl text-gray-900 mb-2 leading-tight">
              We know who's searching for what
            </p>
            <p className="font-cursive text-3xl text-gray-500 mb-4">
              With Cursive
            </p>
            <p className="text-gray-600 text-sm">
              AI-powered lead generation and outbound automation for B2B companies.
            </p>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="text-gray-900 mb-4">Solutions</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/visitor-identification" className="hover:text-[#007AFF] transition-colors">
                  Visitor Identification
                </Link>
              </li>
              <li>
                <Link href="/audience-builder" className="hover:text-[#007AFF] transition-colors">
                  Audience Builder
                </Link>
              </li>
              <li>
                <Link href="/direct-mail" className="hover:text-[#007AFF] transition-colors">
                  Direct Mail
                </Link>
              </li>
              <li>
                <Link href="/intent-audiences" className="hover:text-[#007AFF] transition-colors">
                  Intent Audiences
                </Link>
              </li>
              <li>
                <Link href="/clean-room" className="hover:text-[#007AFF] transition-colors">
                  Data Clean Room
                </Link>
              </li>
              <li>
                <Link href="/data-access" className="hover:text-[#007AFF] transition-colors">
                  Data Access
                </Link>
              </li>
            </ul>
          </div>

          {/* Industries */}
          <div>
            <h3 className="text-gray-900 mb-4">Industries</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/industries/financial-services" className="hover:text-[#007AFF] transition-colors">
                  Financial Services
                </Link>
              </li>
              <li>
                <Link href="/industries/ecommerce" className="hover:text-[#007AFF] transition-colors">
                  eCommerce
                </Link>
              </li>
              <li>
                <Link href="/industries/b2b-software" className="hover:text-[#007AFF] transition-colors">
                  B2B Software
                </Link>
              </li>
              <li>
                <Link href="/industries/agencies" className="hover:text-[#007AFF] transition-colors">
                  Agencies
                </Link>
              </li>
              <li>
                <Link href="/industries/home-services" className="hover:text-[#007AFF] transition-colors">
                  Home Services
                </Link>
              </li>
              <li>
                <Link href="/industries/retail" className="hover:text-[#007AFF] transition-colors">
                  Retail
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-gray-900 mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/platform" className="hover:text-[#007AFF] transition-colors">
                  Overview
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#007AFF] transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="hover:text-[#007AFF] transition-colors">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-[#007AFF] transition-colors">
                  Services
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
