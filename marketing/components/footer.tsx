"use client"

import { Container } from "@/components/ui/container"
import Link from "next/link"
import Image from "next/image"
import { ViewToggle } from "./view-toggle"
import { BOOKING_URL, START_CTA_LABEL, startUrl } from "@/lib/cta"

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-12">
      <Container>
        {/* Brand line and the one action, side by side; stacks on small screens. */}
        <div className="mb-14 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#007AFF]">
              <Image src="/cursive-logo.png" alt="" width={32} height={32} className="h-8 w-8" />
              <span className="text-lg font-semibold tracking-[-0.01em] text-[#0f172a]">Cursive</span>
            </Link>
            <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed text-[#475569]">
              Cursive finds your buyers, reaches them for you, and gives you the system to run it.
            </p>
            <div className="mt-6">
              <ViewToggle />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href={startUrl("footer-cta")}
              className="inline-flex h-11 items-center rounded-xl bg-[#007AFF] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#0066DD] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007AFF]"
            >
              {START_CTA_LABEL}
            </a>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-[15px] font-semibold text-[#0f172a] underline decoration-[#cbd5e1] underline-offset-4 transition-colors hover:decoration-[#007AFF]">
              Book a call
            </a>
          </div>
        </div>

        {/* Main Links - 6-column layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Product */}
          <div>
            <h3 className="text-gray-900 font-medium mb-4">Product</h3>
            <ul className="space-y-0 text-sm text-gray-600 [&_a]:inline-flex [&_a]:min-h-10 [&_a]:items-center sm:space-y-2 sm:[&_a]:min-h-0">
              <li>
                <a href={startUrl("footer-product")} className="hover:text-primary transition-colors">
                  25 free leads
                </a>
              </li>
              <li>
                <Link href={"/#rung-find"} className="hover:text-primary transition-colors">
                  Find them
                </Link>
              </li>
              <li>
                <Link href={"/#rung-reach"} className="hover:text-primary transition-colors">
                  Reach them
                </Link>
              </li>
              <li>
                <Link href={"/#rung-run"} className="hover:text-primary transition-colors">
                  Run it
                </Link>
              </li>
              <li>
                <Link href={"/pixel"} className="hover:text-primary transition-colors">
                  Visitor Pixel
                </Link>
              </li>
              <li>
                <Link href={"/pricing"} className="hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href={"/integrations"} className="hover:text-primary transition-colors">
                  Integrations
                </Link>
              </li>
            </ul>
          </div>

          {/* Industries */}
          <div>
            <h3 className="text-gray-900 font-medium mb-4">Industries</h3>
            <ul className="space-y-0 text-sm text-gray-600 [&_a]:inline-flex [&_a]:min-h-10 [&_a]:items-center sm:space-y-2 sm:[&_a]:min-h-0">
              <li>
                <Link href="/industries/b2b-software" className="hover:text-primary transition-colors">
                  B2B Software
                </Link>
              </li>
              <li>
                <Link href="/industries/agencies" className="hover:text-primary transition-colors">
                  Agencies
                </Link>
              </li>
              <li>
                <Link href="/industries/ecommerce" className="hover:text-primary transition-colors">
                  Ecommerce
                </Link>
              </li>
              <li>
                <Link href="/industries/financial-services" className="hover:text-primary transition-colors">
                  Financial Services
                </Link>
              </li>
              <li>
                <Link href="/industries/education" className="hover:text-primary transition-colors">
                  Education
                </Link>
              </li>
              <li>
                <Link href="/industries/home-services" className="hover:text-primary transition-colors">
                  Home Services
                </Link>
              </li>
              <li>
                <Link href="/industries/franchises" className="hover:text-primary transition-colors">
                  Franchises
                </Link>
              </li>
              <li>
                <Link href="/industries/retail" className="hover:text-primary transition-colors">
                  Retail
                </Link>
              </li>
              <li>
                <Link href="/industries/media-advertising" className="hover:text-primary transition-colors">
                  Media & Advertising
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-gray-900 font-medium mb-4">Resources</h3>
            <ul className="space-y-0 text-sm text-gray-600 [&_a]:inline-flex [&_a]:min-h-10 [&_a]:items-center sm:space-y-2 sm:[&_a]:min-h-0">
              <li>
                <Link href="/blog" className="hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-primary transition-colors">
                  Resource Hub
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/what-is-website-visitor-identification" className="hover:text-primary transition-colors">
                  What Is Visitor ID?
                </Link>
              </li>
              <li>
                <Link href="/what-is-b2b-intent-data" className="hover:text-primary transition-colors">
                  What Is Intent Data?
                </Link>
              </li>
              <li>
                <Link href="/what-is-ai-sdr" className="hover:text-primary transition-colors">
                  What Is an AI SDR?
                </Link>
              </li>
            </ul>
          </div>

          {/* Comparisons */}
          <div>
            <h3 className="text-gray-900 font-medium mb-4">Comparisons</h3>
            <ul className="space-y-0 text-sm text-gray-600 [&_a]:inline-flex [&_a]:min-h-10 [&_a]:items-center sm:space-y-2 sm:[&_a]:min-h-0">
              <li>
                <Link href="/blog/clearbit-alternatives-comparison" className="hover:text-primary transition-colors">
                  Clearbit Alternatives
                </Link>
              </li>
              <li>
                <Link href="/blog/apollo-alternatives-comparison" className="hover:text-primary transition-colors">
                  Apollo Alternatives
                </Link>
              </li>
              <li>
                <Link href="/blog/zoominfo-alternatives-comparison" className="hover:text-primary transition-colors">
                  ZoomInfo Alternatives
                </Link>
              </li>
              <li>
                <Link href="/blog/6sense-alternatives-comparison" className="hover:text-primary transition-colors">
                  6sense Alternatives
                </Link>
              </li>
              <li>
                <Link href="/blog/warmly-alternatives-comparison" className="hover:text-primary transition-colors">
                  Warmly Alternatives
                </Link>
              </li>
              <li>
                <Link href="/blog/apollo-vs-cursive-comparison" className="hover:text-primary transition-colors">
                  Apollo vs Cursive
                </Link>
              </li>
              <li>
                <Link href="/blog/zoominfo-vs-cursive-comparison" className="hover:text-primary transition-colors">
                  ZoomInfo vs Cursive
                </Link>
              </li>
              <li>
                <Link href="/blog/6sense-vs-cursive-comparison" className="hover:text-primary transition-colors">
                  6sense vs Cursive
                </Link>
              </li>
              <li>
                <Link href="/blog/warmly-vs-cursive-comparison" className="hover:text-primary transition-colors">
                  Warmly vs Cursive
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-gray-900 font-medium mb-4">Company</h3>
            <ul className="space-y-0 text-sm text-gray-600 [&_a]:inline-flex [&_a]:min-h-10 [&_a]:items-center sm:space-y-2 sm:[&_a]:min-h-0">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>

          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Cursive. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}
