import Link from "next/link"
import { Metadata } from "next"
import { Container } from "@/components/ui/container"

export const metadata: Metadata = {
  title: "Page Not Found | Cursive",
  description: "The page you're looking for doesn't exist or has been moved.",
}

export default function NotFound() {
  return (
    <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-white">
      <Container className="py-24">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Badge */}
          <p className="text-9xl font-bold text-[#007AFF]/10 select-none leading-none mb-6">
            404
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4">
            Page not found
          </h1>

          <p className="text-lg text-zinc-600 mb-10 max-w-md mx-auto">
            Sorry, the page you are looking for does not exist or has been moved.
            Let us help you find what you need.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-base rounded-lg bg-[#007AFF] text-white hover:bg-[#0066DD] transition-all duration-200"
            >
              Go Home
            </Link>
            <Link
              href="/platform"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-base rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200"
            >
              View Our Platform
            </Link>
          </div>

          {/* Popular Links */}
          <div className="border-t border-gray-200 pt-10">
            <p className="text-sm font-medium text-zinc-900 mb-6">
              Popular pages you might be looking for
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/pricing"
                className="group rounded-xl border border-gray-200 p-5 text-left hover:border-[#007AFF]/30 hover:shadow-sm transition-all duration-200"
              >
                <p className="font-medium text-zinc-900 group-hover:text-[#007AFF] transition-colors mb-1">
                  Pricing
                </p>
                <p className="text-sm text-zinc-600">
                  Plans for every stage of growth
                </p>
              </Link>
              <Link
                href="/marketplace"
                className="group rounded-xl border border-gray-200 p-5 text-left hover:border-[#007AFF]/30 hover:shadow-sm transition-all duration-200"
              >
                <p className="font-medium text-zinc-900 group-hover:text-[#007AFF] transition-colors mb-1">
                  Lead Marketplace
                </p>
                <p className="text-sm text-zinc-600">
                  Browse and buy verified B2B leads
                </p>
              </Link>
              <Link
                href="/blog"
                className="group rounded-xl border border-gray-200 p-5 text-left hover:border-[#007AFF]/30 hover:shadow-sm transition-all duration-200"
              >
                <p className="font-medium text-zinc-900 group-hover:text-[#007AFF] transition-colors mb-1">
                  Blog
                </p>
                <p className="text-sm text-zinc-600">
                  Guides, insights, and best practices
                </p>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
