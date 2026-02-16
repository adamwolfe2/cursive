"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { CategoryCard } from "@/components/blog/category-card"
import { DashboardCTA } from "@/components/dashboard-cta"
import { motion } from "framer-motion"
import { ArrowRight, Calendar, Clock, Eye, Target, Database, TrendingUp, Mail, RotateCcw, BarChart3, Workflow, Filter } from "lucide-react"
import Link from "next/link"
import { HumanView, MachineView, MachineContent, MachineSection, MachineLink, MachineList } from "@/components/view-wrapper"

export function BlogClient() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const filteredPosts = selectedCategory === "all"
    ? blogPosts
    : blogPosts.filter(post => post.categorySlug === selectedCategory)

  return (
    <main className="overflow-hidden">
      <HumanView>
        {/* Hero Section */}
        <section className="relative py-24 bg-white">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              <h1 className="text-5xl lg:text-6xl font-bold mb-6">
                Visitor Identification &
                <span className="block font-cursive text-6xl lg:text-7xl text-gray-900 mt-2">
                  Lead Generation Blog
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Expert guides on visitor identification, intent data, B2B lead generation, and sales automation.
                Learn how to convert anonymous traffic into qualified leads.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm text-gray-600 shadow-sm">
                  <span className="font-medium">5,000+</span> B2B leaders subscribed
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm text-gray-600 shadow-sm">
                  <span className="font-medium">70+</span> expert guides
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm text-gray-600 shadow-sm">
                  <span className="font-medium">Weekly</span> new content
                </div>
              </div>
            </motion.div>
          </Container>
        </section>

        {/* Category Filters */}
        <section className="py-12 bg-white border-b border-gray-200 sticky top-0 z-10">
          <Container>
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
                <Filter className="w-4 h-4" />
                <span className="font-medium">Filter by:</span>
              </div>
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === "all"
                    ? "bg-primary text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Posts
              </button>
              <button
                onClick={() => setSelectedCategory("visitor-tracking")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === "visitor-tracking"
                    ? "bg-primary text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Visitor Identification
              </button>
              <button
                onClick={() => setSelectedCategory("comparisons")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === "comparisons"
                    ? "bg-primary text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Comparisons
              </button>
              <button
                onClick={() => setSelectedCategory("lead-generation")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === "lead-generation"
                    ? "bg-primary text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Lead Generation
              </button>
              <button
                onClick={() => setSelectedCategory("audience-targeting")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === "audience-targeting"
                    ? "bg-primary text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Audience Targeting
              </button>
            </div>
          </Container>
        </section>

        {/* Featured Post */}
        <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
          <Container>
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-white rounded-full text-sm font-medium mb-4">
                <span>Featured Post</span>
              </div>
              <h2 className="text-3xl font-bold mb-2">Latest & Most Popular</h2>
              <p className="text-gray-600">Our most impactful content from this month</p>
            </div>

            <Link href="/blog/ai-sdr-vs-human-bdr">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="grid lg:grid-cols-2 gap-8 bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-all duration-300"
              >
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <div className="text-6xl font-bold mb-4">AI vs Human</div>
                    <div className="text-2xl">The Ultimate BDR Showdown</div>
                  </div>
                </div>
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <div className="inline-block px-3 py-1 bg-primary text-white rounded-full text-sm font-medium mb-4 w-fit">
                    AI & Automation
                  </div>
                  <h3 className="text-3xl font-bold mb-4">
                    AI SDR vs. Human BDR: Which Drives More Pipeline in 2026?
                  </h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    We compared our AI SDR against a team of 3 human BDRs over 90 days.
                    The results surprised even us. Discover which approach wins on cost, speed, and quality.
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
                  <div className="mt-6">
                    <span className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all">
                      Read full comparison
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </motion.div>
            </Link>
          </Container>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-20 bg-white">
          <Container>
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-2">
                {selectedCategory === "all"
                  ? "Latest Articles"
                  : `${blogCategories.find(c => c.slug === selectedCategory)?.title || "Articles"}`}
              </h2>
              <p className="text-gray-600">
                {selectedCategory === "all"
                  ? "Fresh insights on B2B growth and lead generation"
                  : `${filteredPosts.length} article${filteredPosts.length !== 1 ? 's' : ''} in this category`}
              </p>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-gray-400 mb-4">
                  <Database className="w-16 h-16 mx-auto mb-4" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles yet</h3>
                <p className="text-gray-600">Check back soon for new content in this category.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post, index) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`}>
                    <motion.article
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-300 h-full flex flex-col group"
                    >
                      <div className={`aspect-video ${post.color} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                        <post.icon className="w-16 h-16 text-white" />
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <div className="inline-block px-3 py-1 bg-blue-100 text-primary rounded-full text-xs font-medium mb-3 w-fit">
                          {post.category}
                        </div>
                        <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-3">
                          {post.excerpt}
                        </p>
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
            )}
          </Container>
        </section>

        {/* Categories Section */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
          <Container>
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold mb-2">Explore by Category</h2>
              <p className="text-gray-600">Dive deep into topics that matter to your business</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {blogCategories.map((category, index) => (
                <CategoryCard key={category.slug} {...category} index={index} />
              ))}
            </div>
          </Container>
        </section>

        {/* Newsletter CTA */}
        <DashboardCTA
          headline="Want to Put These"
          subheadline="Strategies Into Action?"
          description="See how Cursive helps you identify website visitors, capture intent data, and automate personalized outreach at scale."
        />
      </HumanView>

      <MachineView>
        <MachineContent>
          <h1 className="text-2xl font-bold mb-4">Cursive Blog - Visitor Identification & Lead Generation</h1>

          <p className="text-gray-700 mb-6">
            Expert guides on visitor identification, intent data, B2B lead generation, and sales automation. 70+ articles helping B2B teams convert anonymous website traffic into qualified leads. 5,000+ subscribers.
          </p>

          <MachineSection title="Blog Categories">
            <MachineList items={[
              { label: "Visitor Tracking", href: "/blog/visitor-tracking", description: "12 articles - Learn how to identify anonymous website visitors and turn traffic into qualified leads" },
              { label: "Audience Targeting", href: "/blog/audience-targeting", description: "8 articles - Master B2B audience segmentation and intent-based targeting strategies" },
              { label: "Data Platforms", href: "/blog/data-platforms", description: "15 articles - Explore B2B data enrichment and business intelligence for growth" },
              { label: "Lead Generation", href: "/blog/lead-generation", description: "18 articles - Proven tactics to generate qualified B2B leads with AI-powered automation" },
              { label: "Direct Mail", href: "/blog/direct-mail", description: "6 articles - Automate direct mail campaigns triggered by digital behavior" },
              { label: "Retargeting", href: "/blog/retargeting", description: "10 articles - Re-engage anonymous visitors across email, ads, and direct mail" },
              { label: "Analytics", href: "/blog/analytics", description: "9 articles - Track marketing performance, measure ROI, multi-touch attribution" },
              { label: "CRM Integration", href: "/blog/crm-integration", description: "7 articles - Connect your marketing stack and automate workflows" },
            ]} />
          </MachineSection>

          <MachineSection title="Featured Post">
            <p className="text-gray-700 mb-3">
              <MachineLink href="/blog/ai-sdr-vs-human-bdr">AI SDR vs. Human BDR: Which Drives More Pipeline in 2026?</MachineLink>
            </p>
            <p className="text-gray-700">
              A 90-day head-to-head experiment comparing AI SDR performance against a team of 3 human BDRs on cost, speed, and lead quality. Category: AI & Automation. Published: Feb 1, 2026. Read time: 8 min.
            </p>
          </MachineSection>

          <MachineSection title="Latest Articles">
            <MachineList items={[
              { label: "Cold Email in 2026: What's Still Working (And What's Not)", href: "/blog/cold-email-2026", description: "The cold email landscape has changed dramatically. Here's what top performers are doing differently. Category: Email Marketing. Jan 28, 2026. 6 min read." },
              { label: "The 5-Step Framework for Perfect ICP Targeting", href: "/blog/icp-targeting-guide", description: "Stop wasting money on bad leads. Learn how to define and target your ideal customer profile. Category: Strategy. Jan 21, 2026. 10 min read." },
              { label: "How to Scale Outbound Without Killing Quality", href: "/blog/scaling-outbound", description: "Go from 10 emails/day to 200+ without sacrificing personalization or deliverability. Category: Scaling. Jan 14, 2026. 7 min read." },
            ]} />
          </MachineSection>

          <MachineSection title="Popular Guides">
            <MachineList items={[
              { label: "How to Identify Website Visitors: Complete Technical Guide", href: "/blog/how-to-identify-website-visitors-technical-guide", description: "12 min read - Technical details behind visitor identification technology" },
              { label: "AI SDR vs. Human BDR Comparison", href: "/blog/ai-sdr-vs-human-bdr", description: "8 min read - 90-day experiment comparing AI SDRs against human BDR teams" },
              { label: "Warmly vs. Cursive: Head-to-Head", href: "/blog/warmly-vs-cursive-comparison", description: "10 min read - Feature-by-feature comparison of visitor identification platforms" },
              { label: "What Is WebMCP? A Practical Guide", href: "/blog/what-is-webmcp-guide", description: "8 min read - Google's WebMCP standard for AI agent interactions" },
              { label: "WebMCP Implementation Guide for B2B SaaS", href: "/blog/webmcp-implementation-guide-b2b-saas", description: "Step-by-step code for adding WebMCP to your B2B site" },
              { label: "Clearbit Alternatives: Top Visitor Identification Tools", href: "/blog/clearbit-alternatives-comparison", description: "9 min read - Compare the best alternatives to Clearbit in 2026" },
              { label: "6sense Alternatives Comparison", href: "/blog/6sense-alternatives-comparison", description: "Comprehensive comparison of 6sense alternatives" },
              { label: "ZoomInfo Alternatives Comparison", href: "/blog/zoominfo-alternatives-comparison", description: "Compare the best alternatives to ZoomInfo" },
            ]} />
          </MachineSection>

          <MachineSection title="Comparison Articles">
            <MachineList items={[
              { label: "Cursive vs. Warmly", href: "/blog/warmly-vs-cursive-comparison", description: "Feature-by-feature comparison" },
              { label: "Cursive vs. Apollo", href: "/blog/apollo-vs-cursive-comparison", description: "Visitor identification vs. sales engagement" },
              { label: "Cursive vs. ZoomInfo", href: "/blog/zoominfo-vs-cursive-comparison", description: "Data enrichment comparison" },
              { label: "Cursive vs. 6sense", href: "/blog/6sense-vs-cursive-comparison", description: "Intent data platform comparison" },
              { label: "Cursive vs. RB2B", href: "/blog/cursive-vs-rb2b", description: "Visitor identification comparison" },
              { label: "Cursive vs. Leadfeeder", href: "/blog/cursive-vs-leadfeeder", description: "Website analytics comparison" },
              { label: "Cursive vs. Instantly", href: "/blog/cursive-vs-instantly", description: "Outreach platform comparison" },
              { label: "Cursive vs. Demandbase", href: "/blog/cursive-vs-demandbase", description: "ABM platform comparison" },
              { label: "Cursive vs. Clearbit", href: "/blog/cursive-vs-clearbit", description: "Data enrichment comparison" },
            ]} />
          </MachineSection>

          <MachineSection title="About This Blog">
            <p className="text-gray-700 mb-3">
              The Cursive blog covers B2B marketing, lead generation, visitor identification, intent data, audience targeting, and sales automation. New content published weekly. Topics include practical guides, platform comparisons, data strategy, and AI-powered growth tactics.
            </p>
            <MachineList items={[
              { label: "Cursive Platform", href: "/platform", description: "Visitor identification, intent data, AI outreach" },
              { label: "Pricing", href: "/pricing", description: "Self-serve marketplace + done-for-you services" },
              { label: "Book a Demo", href: "/book", description: "See Cursive in real-time" },
              { label: "Resources", href: "/resources", description: "Guides on visitor identification & lead generation" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}

// Blog Categories Data
const blogCategories = [
  {
    title: "Visitor Tracking",
    description: "Learn how to identify anonymous website visitors and turn traffic into qualified leads.",
    slug: "visitor-tracking",
    icon: Eye,
    gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
    postCount: 12,
  },
  {
    title: "Audience Targeting",
    description: "Master B2B audience segmentation and intent-based targeting strategies.",
    slug: "audience-targeting",
    icon: Target,
    gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
    postCount: 8,
  },
  {
    title: "Data Platforms",
    description: "Explore B2B data enrichment and how to leverage business intelligence for growth.",
    slug: "data-platforms",
    icon: Database,
    gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
    postCount: 15,
  },
  {
    title: "Lead Generation",
    description: "Proven tactics to generate qualified B2B leads with AI-powered automation.",
    slug: "lead-generation",
    icon: TrendingUp,
    gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
    postCount: 18,
  },
  {
    title: "Direct Mail",
    description: "Automate direct mail campaigns triggered by digital behavior for higher conversions.",
    slug: "direct-mail",
    icon: Mail,
    gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
    postCount: 6,
  },
  {
    title: "Retargeting",
    description: "Re-engage anonymous visitors across email, ads, and direct mail channels.",
    slug: "retargeting",
    icon: RotateCcw,
    gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
    postCount: 10,
  },
  {
    title: "Analytics",
    description: "Track marketing performance, measure ROI, and implement multi-touch attribution.",
    slug: "analytics",
    icon: BarChart3,
    gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
    postCount: 9,
  },
  {
    title: "CRM Integration",
    description: "Connect your marketing stack and automate workflows across all your tools.",
    slug: "crm-integration",
    icon: Workflow,
    gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
    postCount: 7,
  },
]

// Blog Posts Data
const blogPosts = [
  {
    slug: "cold-email-2026",
    title: "Cold Email in 2026: What's Still Working (And What's Not)",
    excerpt: "The cold email landscape has changed dramatically. Here's what top performers are doing differently.",
    category: "Email Marketing",
    categorySlug: "lead-generation",
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
    categorySlug: "audience-targeting",
    date: "Jan 21, 2026",
    readTime: "10 min read",
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
    icon: TrendingUp,
  },
  {
    slug: "scaling-outbound",
    title: "How to Scale Outbound Without Killing Quality",
    excerpt: "Go from 10 emails/day to 200+ without sacrificing personalization or deliverability.",
    category: "Scaling",
    categorySlug: "lead-generation",
    date: "Jan 14, 2026",
    readTime: "7 min read",
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
    icon: TrendingUp,
  },
]
