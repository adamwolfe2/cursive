"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { ArrowRight, Calendar, Clock, User } from "lucide-react"
import Link from "next/link"

export default function BlogPage() {
  return (
    <main className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              The Cursive
              <span className="block font-cursive text-6xl lg:text-7xl text-gray-900 mt-2">
                Blog
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              Insights, strategies, and tips for B2B lead generation and sales automation.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Featured Post */}
      <section className="py-24 bg-white">
        <Container>
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2">Featured</h2>
            <p className="text-gray-600">Our latest and most popular content</p>
          </div>

          <Link href="/blog/ai-sdr-vs-human-bdr">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid lg:grid-cols-2 gap-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <div className="text-6xl font-bold mb-4">AI vs Human</div>
                  <div className="text-2xl">The Ultimate BDR Showdown</div>
                </div>
              </div>
              <div className="p-8 flex flex-col justify-center">
                <div className="inline-block px-3 py-1 bg-primary text-white rounded-full text-sm font-medium mb-4 w-fit">
                  AI & Automation
                </div>
                <h3 className="text-3xl font-bold mb-4">
                  AI SDR vs. Human BDR: Which Drives More Pipeline in 2026?
                </h3>
                <p className="text-gray-600 mb-6">
                  We compared our AI SDR against a team of 3 human BDRs over 90 days.
                  The results surprised even us.
                </p>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Feb 1, 2026</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>8 min read</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        </Container>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <Container>
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2">Latest Articles</h2>
            <p className="text-gray-600">Fresh insights on B2B growth and lead generation</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <motion.article
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 h-full flex flex-col"
                >
                  <div className={`aspect-video ${post.color} flex items-center justify-center`}>
                    <post.icon className="w-16 h-16 text-white" />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="inline-block px-3 py-1 bg-blue-100 text-primary rounded-full text-xs font-medium mb-3 w-fit">
                      {post.category}
                    </div>
                    <h3 className="text-xl font-bold mb-3">{post.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 flex-1">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{post.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </div>
                </motion.article>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Newsletter CTA */}
      <section className="py-24 bg-white">
        <Container>
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white shadow-2xl max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Get Weekly
              <span className="block font-cursive text-5xl lg:text-6xl mt-2">
                Growth Tips
              </span>
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join 5,000+ B2B leaders getting actionable lead gen strategies every week.
            </p>
            <div className="max-w-md mx-auto flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
              />
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-gray-100"
              >
                Subscribe
              </Button>
            </div>
            <p className="text-sm opacity-75 mt-4">No spam. Unsubscribe anytime.</p>
          </div>
        </Container>
      </section>
    </main>
  )
}

// Blog Posts Data
import { TrendingUp, Target, Zap } from "lucide-react"

const blogPosts = [
  {
    slug: "cold-email-2026",
    title: "Cold Email in 2026: What's Still Working (And What's Not)",
    excerpt: "The cold email landscape has changed dramatically. Here's what top performers are doing differently.",
    category: "Email Marketing",
    date: "Jan 28, 2026",
    readTime: "6 min read",
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
    icon: Target,
  },
  {
    slug: "icp-targeting-guide",
    title: "The 5-Step Framework for Perfect ICP Targeting",
    excerpt: "Stop wasting money on bad leads. Learn how to define and target your ideal customer profile.",
    category: "Strategy",
    date: "Jan 21, 2026",
    readTime: "10 min read",
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
    icon: TrendingUp,
  },
  {
    slug: "scaling-outbound",
    title: "How to Scale Outbound Without Killing Quality",
    excerpt: "Go from 10 emails/day to 200+ without sacrificing personalization or deliverability.",
    category: "Scaling",
    date: "Jan 14, 2026",
    readTime: "7 min read",
    color: "bg-gradient-to-br from-green-500 to-green-600",
    icon: Zap,
  },
]
