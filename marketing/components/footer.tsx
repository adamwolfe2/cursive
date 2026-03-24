"use client"

import { Container } from "@/components/ui/container"
import Link from "next/link"
import Image from "next/image"
import { ViewToggle } from "./view-toggle"

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-12">
      <Container>
        {/* Brand and View Toggle - Top Section */}
        <div className="mb-12">
          <div className="flex items-center mb-4">
            <Image
              src="/cursive-logo.png"
              alt="Cursive"
              width={32}
              height={32}
              className="w-8 h-8"
            />
          </div>
          <p className="text-xl text-gray-900 mb-2 leading-tight">
            We know who's searching for what
          </p>
          <p className="font-cursive text-3xl text-gray-500 mb-4">
            With Cursive
          </p>
          <p className="text-gray-600 text-sm mb-6">
            AI-powered lead generation and outbound automation for B2B companies.
          </p>

          {/* View Toggle */}
          <ViewToggle />
        </div>

        {/* Main Links - 6-column layout */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Product */}
          <div>
            <h3 className="text-gray-900 font-medium mb-4">Product</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/platform" className="hover:text-primary transition-colors">
                  Platform Overview
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="hover:text-primary transition-colors">
                  Lead Marketplace
                </Link>
              </li>
              <li>
                <Link href="/pixel" className="hover:text-primary transition-colors">
                  Visitor Pixel
                </Link>
              </li>
              <li>
                <Link href="/visitor-identification" className="hover:text-primary transition-colors">
                  Visitor Identification
                </Link>
              </li>
              <li>
                <Link href="/custom-audiences" className="hover:text-primary transition-colors">
                  Custom Audiences
                </Link>
              </li>
              <li>
                <Link href="/audience-builder" className="hover:text-primary transition-colors">
                  Audience Builder
                </Link>
              </li>
              <li>
                <Link href="/intent-audiences" className="hover:text-primary transition-colors">
                  Intent Data
                </Link>
              </li>
              <li>
                <Link href="/direct-mail" className="hover:text-primary transition-colors">
                  Direct Mail
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="hover:text-primary transition-colors">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="/data-access" className="hover:text-primary transition-colors">
                  Data Access
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-gray-900 font-medium mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/services#data" className="hover:text-primary transition-colors">
                  Cursive Data
                </Link>
              </li>
              <li>
                <Link href="/services#outbound" className="hover:text-primary transition-colors">
                  Cursive Outbound
                </Link>
              </li>
              <li>
                <Link href="/services#pipeline" className="hover:text-primary transition-colors">
                  Cursive Pipeline
                </Link>
              </li>
              <li>
                <Link href="/venture-studio" className="hover:text-primary transition-colors">
                  Venture Studio
                </Link>
              </li>
              <li>
                <Link href="/free-audit" className="hover:text-primary transition-colors">
                  Free AI Audit
                </Link>
              </li>
            </ul>
          </div>

          {/* Industries */}
          <div>
            <h3 className="text-gray-900 font-medium mb-4">Industries</h3>
            <ul className="space-y-2 text-sm text-gray-600">
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
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/blog" className="hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/case-studies" className="hover:text-primary transition-colors">
                  Case Studies
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
            <ul className="space-y-2 text-sm text-gray-600">
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
            <ul className="space-y-2 text-sm text-gray-600">
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
              <li>
                <Link href="/services" className="hover:text-primary transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>

            <h3 className="text-gray-900 font-medium mb-4 mt-8">Get Started</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="https://leads.meetcursive.com/signup" className="hover:text-primary transition-colors">
                  Sign Up Free
                </a>
              </li>
              <li>
                <a href="https://cal.com/cursiveteam/30min" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Book a Demo
                </a>
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
