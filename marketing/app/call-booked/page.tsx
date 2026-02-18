"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  CheckCircle2, ArrowRight, Eye, Target, Zap, Users,
  BarChart3, Mail, Send, Globe, Database, Filter,
  Building2, ShoppingCart, Briefcase, DollarSign,
  GraduationCap, Home, Megaphone, Sparkles,
  TrendingUp, Shield, Clock, Phone, MapPin, Layers,
  ChevronRight, BookOpen, CreditCard, Star, Award,
  MessageSquare, Calendar, Search, Link2, Repeat,
  Gift, ArrowDown, Check
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import React, { useState } from "react"

function CycleStep({ icon: Icon, label, subtitle, delay }: { icon: React.ComponentType<{ className?: string }>; label: string; subtitle: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="flex flex-col items-center w-[110px]"
    >
      <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center shadow-sm mb-1.5">
        <Icon className="h-5 w-5 text-[#007AFF]" />
      </div>
      <span className="text-xs font-semibold text-gray-900 mb-0.5">{label}</span>
      <span className="text-[10px] text-gray-500 text-center leading-tight">{subtitle}</span>
    </motion.div>
  )
}

export default function CallBookedPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      {/* Human View */}
      <HumanView>
        <main>

          {/* ============================================ */}
          {/* SECTION 1: Hero - Confirmation + Action Items */}
          {/* ============================================ */}
          <section className="pt-28 pb-16 bg-white">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-4xl mx-auto"
              >
                {/* Animated green checkmark */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </motion.div>
                </motion.div>

                <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-4">
                  You&apos;re In.
                </h1>
                <p className="font-cursive text-6xl lg:text-7xl text-gray-500 mb-10">
                  Your Call is Booked.
                </p>

                {/* 3 Action Items - Horizontal */}
                <div className="max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-start gap-4 md:gap-3">
                    {/* Step 1 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-[#F7F9FB] rounded-xl p-5 border border-gray-200 text-center"
                    >
                      <span className="text-4xl font-light text-gray-200 block mb-2">1</span>
                      <div className="w-10 h-10 bg-[#007AFF] rounded-full flex items-center justify-center mx-auto mb-3">
                        <Mail className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-gray-900 font-medium mb-1">Confirm your meeting</p>
                      <p className="text-sm text-gray-500">Check your email and add it to your calendar. Your time is valuable — and so is ours.</p>
                    </motion.div>

                    {/* Arrow 1 */}
                    <div className="hidden md:flex items-center justify-center pt-12">
                      <ChevronRight className="h-5 w-5 text-gray-300" />
                    </div>

                    {/* Step 2 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.75 }}
                      className="bg-[#F7F9FB] rounded-xl p-5 border border-gray-200 text-center"
                    >
                      <span className="text-4xl font-light text-gray-200 block mb-2">2</span>
                      <div className="w-10 h-10 bg-[#007AFF] rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-gray-900 font-medium mb-1">Explore Cursive below</p>
                      <p className="text-sm text-gray-500">See case studies, FAQs, services, and everything Cursive can do for your business.</p>
                    </motion.div>

                    {/* Arrow 2 */}
                    <div className="hidden md:flex items-center justify-center pt-12">
                      <ChevronRight className="h-5 w-5 text-gray-300" />
                    </div>

                    {/* Step 3 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                      className="bg-[#F7F9FB] rounded-xl p-5 border border-gray-200 text-center"
                    >
                      <span className="text-4xl font-light text-gray-200 block mb-2">3</span>
                      <div className="w-10 h-10 bg-[#007AFF] rounded-full flex items-center justify-center mx-auto mb-3">
                        <Gift className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-gray-900 font-medium mb-1">Grab your free gift</p>
                      <p className="text-sm text-gray-500">Scroll to the bottom — we have something special waiting for you.</p>
                    </motion.div>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="mt-8"
                >
                  <ArrowDown className="h-5 w-5 text-gray-300 mx-auto animate-bounce" />
                </motion.div>
              </motion.div>
            </Container>
          </section>

          {/* ============================================ */}
          {/* SECTION 2: What is Cursive?                  */}
          {/* ============================================ */}
          <section className="py-20 bg-[#F7F9FB]">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center max-w-4xl mx-auto mb-16"
              >
                <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide">THE PLATFORM</span>
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6">
                  What is <span className="font-cursive text-6xl lg:text-7xl text-gray-500">Cursive</span>?
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-6">
                  Cursive is the all-in-one growth platform that identifies your website visitors, builds targeted audiences from 420M+ verified contacts, and runs automated outbound campaigns — so you can turn anonymous traffic into revenue.
                </p>
                <p className="text-lg text-gray-500 leading-relaxed max-w-3xl mx-auto">
                  Tools like ZoomInfo, Apollo, and RB2B are great for simple, single-channel solutions. But they only give you one piece of the pie. You deserve the whole thing when it comes to growth and driving revenue for your business. Cursive replaces your entire stack with one platform that compounds — every channel, every signal, every interaction feeding the next.
                </p>
              </motion.div>

              {/* 4 Key Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {[
                  { stat: "420M+", label: "Verified Contacts", icon: Database },
                  { stat: "70%", label: "Visitor Identification Rate", icon: Eye },
                  { stat: "200+", label: "Integrations", icon: Link2 },
                  { stat: "95%+", label: "Email Deliverability", icon: Mail },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-xl p-6 border border-gray-200 text-center"
                  >
                    <item.icon className="h-8 w-8 text-[#007AFF] mx-auto mb-3" />
                    <div className="text-3xl lg:text-4xl font-light text-gray-900 mb-1">{item.stat}</div>
                    <div className="text-sm text-gray-500">{item.label}</div>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* ============================================ */}
          {/* SECTION 3: Philosophy - 3 Alternating Blocks  */}
          {/* ============================================ */}
          <section className="py-20 bg-white">
            <Container>
              <div className="max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-16"
                >
                  <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide">OUR PHILOSOPHY</span>
                  <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                    Why We Built Cursive:
                  </h2>
                  <p className="font-cursive text-3xl lg:text-4xl text-gray-500 mb-6">
                    Recursive Intelligence
                  </p>
                  <div className="inline-block bg-white rounded-xl px-8 py-4 border border-gray-200 shadow-sm">
                    <p className="text-sm text-[#007AFF] font-medium tracking-wide mb-1">re·cur·sive <span className="text-gray-400">(adj.)</span></p>
                    <p className="text-lg text-gray-900">A system that improves itself by learning from itself.</p>
                  </div>
                </motion.div>

                {/* Block 1: Text Left, Cycle Diagram Right */}
                <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="space-y-6"
                  >
                    <p className="text-xl text-gray-900 leading-relaxed font-medium">
                      We&apos;re betting everything on a simple premise: AI will compound. Your business should too.
                    </p>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      Every model getting smarter teaches the next model to be smarter. Every pattern learned improves the next pattern. Every iteration compounds on the last. This is recursive intelligence — the exponential curve that will define everything.
                    </p>
                    <p className="text-lg text-gray-600 leading-relaxed">
                      <strong className="text-gray-900">Your business is the only system not doing this.</strong> Your customers convert and you forget why. Your campaigns end and the learnings disappear. Your targeting resets with every new hire. Employees leave with knowledge. Decisions get forgotten. Patterns don&apos;t transfer.
                    </p>

                    {/* The Compounding Effect */}
                    <div className="space-y-3 mt-2">
                      <p className="text-lg font-semibold text-gray-900">The Cycle That Compounds</p>
                      <div className="space-y-1.5 text-base text-gray-600">
                        <p>Monday&apos;s visitors inform Tuesday&apos;s targeting.</p>
                        <p>This week&apos;s conversions improve next week&apos;s messaging.</p>
                        <p>Last month&apos;s patterns prevent next month&apos;s mistakes.</p>
                        <p>Every interaction makes your lookalike audiences sharper.</p>
                        <p>Every data point lowers your CAC and increases your LTV.</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Cycle Diagram - Grid layout */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center"
                  >
                    {/* Row 1: Identify (top center) */}
                    <div className="flex justify-center mb-3">
                      <CycleStep icon={Eye} label="Identify" subtitle="High-intent visitors & engagement signals" delay={0.3} />
                    </div>

                    {/* Row 2: Learn (left) + Logo (center) + Enrich (right) */}
                    <div className="flex items-center gap-4 lg:gap-6 mb-3">
                      <CycleStep icon={Sparkles} label="Learn" subtitle="Feed insights back into targeting" delay={0.75} />

                      <div className="relative flex-shrink-0">
                        <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center">
                          <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white rounded-full flex items-center justify-center shadow-lg border border-[#007AFF]/20">
                            <Image
                              src="/cursive-logo.png"
                              alt="Cursive"
                              width={40}
                              height={40}
                              className="w-10 h-10"
                            />
                          </div>
                        </div>
                        {/* Arrows */}
                        <Repeat className="absolute -top-1 left-1/2 -translate-x-1/2 h-3 w-3 text-gray-300" />
                        <Repeat className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-3 w-3 text-gray-300 rotate-180" />
                      </div>

                      <CycleStep icon={Database} label="Enrich" subtitle="Turn signals into actionable data & lookalikes" delay={0.45} />
                    </div>

                    {/* Row 3: Convert (left) + Reach (right) */}
                    <div className="flex items-start gap-12 lg:gap-20">
                      <CycleStep icon={TrendingUp} label="Convert" subtitle="Close deals with messaging that already worked" delay={0.6} />
                      <CycleStep icon={Send} label="Reach" subtitle="Multi-channel outreach informed by past wins" delay={0.55} />
                    </div>
                  </motion.div>
                </div>

                {/* Block 2: Centered Conclusion */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="max-w-3xl mx-auto text-center"
                >
                  <p className="text-xl text-gray-900 font-light leading-relaxed mb-3">
                    &quot;While your competitors treat every lead like the first lead they&apos;ve ever gotten, Cursive treats every lead like the thousandth. <em>Because it is.</em>&quot;
                  </p>
                  <p className="text-base text-gray-500">The result: your CAC drops, your LTV rises, your growth compounds instead of plateaus.</p>
                </motion.div>
              </div>
            </Container>
          </section>

          {/* ============================================ */}
          {/* SECTION 4: Everything Cursive Can Do          */}
          {/* ============================================ */}
          <section className="py-20 bg-[#F7F9FB]">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide">SOLUTIONS</span>
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  One Platform. Every Growth Channel.
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Everything you need to find, reach, and convert your ideal customers.
                </p>
              </motion.div>

              {/* 12 solutions = 4 rows of 3 */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {[
                  {
                    icon: Eye,
                    title: "Visitor Identification",
                    description: "See who's on your site right now. Identify up to 70% of anonymous B2B traffic with company + individual data.",
                    href: "/visitor-identification",
                  },
                  {
                    icon: Users,
                    title: "Audience Builder",
                    description: "Build unlimited custom audiences from 280M US consumer and 140M+ business profiles. Filter by intent, firmographics, technographics, and more.",
                    href: "/audience-builder",
                  },
                  {
                    icon: Target,
                    title: "Intent Data",
                    description: "Track 60B+ behaviors & URLs scanned weekly. Know who's actively researching solutions like yours before they fill out a form.",
                    href: "/intent-audiences",
                  },
                  {
                    icon: Send,
                    title: "Outbound Campaigns",
                    description: "AI-powered email campaigns with personalized messaging. We handle domain setup, warmup, deliverability, and optimization.",
                    href: "/services",
                  },
                  {
                    icon: MapPin,
                    title: "Direct Mail",
                    description: "Trigger automated postcards and letters to high-intent prospects. 3-5x higher response rates than email alone.",
                    href: "/direct-mail",
                  },
                  {
                    icon: Filter,
                    title: "Custom Audiences",
                    description: "Need a specific audience we don't have? We'll build it from scratch — by industry, geography, seniority, intent signals, or any custom criteria.",
                    href: "/custom-audiences",
                  },
                  {
                    icon: Link2,
                    title: "CRM Integrations",
                    description: "Native sync with Salesforce, HubSpot, and 200+ tools. Two-way data flow keeps everything current.",
                    href: "/integrations",
                  },
                  {
                    icon: Globe,
                    title: "Website Pixel",
                    description: "Lightweight tracking pixel installed in 5 minutes. Works on any platform. GDPR/CCPA compliant.",
                    href: "/pixel",
                  },
                  {
                    icon: Megaphone,
                    title: "Retargeting",
                    description: "Build audiences from identified visitors and retarget across Google, Meta, LinkedIn, and display networks.",
                    href: "/audience-builder",
                  },
                  {
                    icon: ShoppingCart,
                    title: "Lead Marketplace",
                    description: "Browse and buy verified leads on-demand with credits. Filter by industry, title, company size, and intent score.",
                    href: "/marketplace",
                  },
                  {
                    icon: Database,
                    title: "Data Enrichment",
                    description: "Enrich any contact or company record with 100+ data points. Waterfall enrichment checks multiple sources for maximum coverage.",
                    href: "/integrations",
                  },
                  {
                    icon: BarChart3,
                    title: "Attribution & Analytics",
                    description: "Track every touchpoint from first visit to closed deal. Multi-touch attribution shows exactly what's driving revenue.",
                    href: "/visitor-identification",
                  },
                ].map((solution, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={solution.href}
                      className="block bg-white rounded-xl p-6 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all h-full group"
                    >
                      <solution.icon className="h-8 w-8 text-[#007AFF] mb-4" />
                      <h3 className="text-xl text-gray-900 mb-3 font-medium group-hover:text-[#007AFF] transition-colors">
                        {solution.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-sm mb-4">
                        {solution.description}
                      </p>
                      <div className="text-[#007AFF] text-sm font-medium flex items-center gap-2">
                        Learn more <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* ============================================ */}
          {/* SECTION 5: Service Tiers - Clear Pricing      */}
          {/* ============================================ */}
          <section className="py-20 bg-white">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide">PRICING</span>
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  Choose Your Growth Path
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Self-serve credits for instant access, or done-for-you services for hands-off growth.
                </p>
              </motion.div>

              {/* Self-Serve: Lead Marketplace */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-5xl mx-auto mb-16"
              >
                <div className="bg-[#F7F9FB] rounded-2xl p-8 lg:p-10 border border-gray-200">
                  <div className="text-sm font-medium text-[#007AFF] mb-2">SELF-SERVE</div>
                  <h3 className="text-3xl font-light text-gray-900 mb-2">Lead Marketplace</h3>
                  <p className="text-gray-600 mb-8">Buy credits, find leads instantly. No commitment required.</p>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                      { name: "Starter", price: "$99", credits: "100 credits" },
                      { name: "Growth", price: "$399", credits: "500 credits" },
                      { name: "Scale", price: "$699", credits: "1,000 credits" },
                      { name: "Enterprise", price: "$2,999", credits: "5,000 credits" },
                    ].map((pkg, i) => (
                      <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 text-center">
                        <div className="text-sm font-medium text-gray-500 mb-1">{pkg.name}</div>
                        <div className="text-2xl font-light text-gray-900 mb-1">{pkg.price}</div>
                        <div className="text-sm text-gray-500">{pkg.credits}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center">
                    <Button href="/marketplace">
                      Start Free — 100 Credits Included
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Done-For-You Services */}
              <div className="max-w-6xl mx-auto">
                <div className="text-sm font-medium text-[#007AFF] mb-4 text-center">DONE-FOR-YOU SERVICES</div>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {[
                    {
                      name: "Cursive Data",
                      price: "$1,000",
                      period: "/mo",
                      popular: false,
                      features: [
                        "Monthly verified lead lists",
                        "Custom ICP targeting",
                        "500-2,000 leads/month",
                        "CRM integration",
                        "Dedicated account manager",
                      ],
                    },
                    {
                      name: "Cursive Outbound",
                      price: "$2,500",
                      period: "/mo",
                      popular: true,
                      features: [
                        "Everything in Data",
                        "Done-for-you email campaigns",
                        "AI personalization",
                        "Domain setup & warmup",
                        "200+ emails/day",
                        "Campaign optimization",
                      ],
                    },
                    {
                      name: "Cursive Pipeline",
                      price: "$5,000",
                      period: "/mo",
                      popular: false,
                      features: [
                        "Everything in Outbound",
                        "Multi-channel (email, LinkedIn, direct mail)",
                        "Dedicated success manager",
                        "Full pipeline management",
                        "Weekly strategy calls",
                        "AI SDR automation",
                      ],
                    },
                  ].map((tier, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className={`relative bg-white rounded-xl p-6 border ${
                        tier.popular
                          ? "border-[#007AFF] shadow-lg ring-1 ring-[#007AFF]"
                          : "border-gray-200"
                      }`}
                    >
                      {tier.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#007AFF] text-white text-xs font-medium px-4 py-1 rounded-full">
                          Most Popular
                        </div>
                      )}
                      <h4 className="text-xl font-medium text-gray-900 mb-2">{tier.name}</h4>
                      <div className="mb-4">
                        <span className="text-3xl font-light text-gray-900">{tier.price}</span>
                        <span className="text-gray-500">{tier.period}</span>
                      </div>
                      <ul className="space-y-3 mb-6">
                        {tier.features.map((feature, j) => (
                          <li key={j} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        href="https://cal.com/cursive/30min"
                        target="_blank"
                        className="w-full"
                        variant={tier.popular ? "default" : "outline"}
                      >
                        Book a Call
                      </Button>
                    </motion.div>
                  ))}
                </div>

                {/* Venture Studio - Light theme */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <Link
                    href="/venture-studio"
                    className="block bg-gradient-to-r from-[#F7F9FB] to-blue-50 rounded-xl p-6 lg:p-8 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="text-sm text-[#007AFF] font-medium mb-1">WHITE-GLOVE</div>
                        <h4 className="text-2xl font-light text-gray-900 mb-2">Venture Studio</h4>
                        <p className="text-gray-600 max-w-xl">
                          Dedicated team, custom integrations, weekly strategy sessions. For companies that want a fully embedded growth partner.
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-3xl font-light text-gray-900">$25,000+</span>
                          <span className="text-gray-500">/mo</span>
                        </div>
                        <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-[#007AFF] transition-colors" />
                      </div>
                    </div>
                  </Link>
                </motion.div>

                <div className="text-center mt-8">
                  <Button variant="link" href="/pricing">
                    See full pricing details <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Container>
          </section>

          {/* ============================================ */}
          {/* SECTION 6: Proven Results - Case Studies      */}
          {/* ============================================ */}
          <section className="py-20 bg-[#F7F9FB]">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide">RESULTS</span>
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  Real Results From Real Companies
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  See how companies like yours are using Cursive to drive pipeline and revenue.
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {[
                  {
                    industry: "AI SaaS Company",
                    stat: "$11M",
                    label: "Revenue Generated",
                    detail: "40x ROI in 30 days",
                    icon: Sparkles,
                  },
                  {
                    industry: "Insurtech Startup",
                    stat: "5x",
                    label: "CPC Reduction",
                    detail: "1,200+ leads in 90 days",
                    icon: Shield,
                  },
                  {
                    industry: "Medical Technology",
                    stat: "$24M",
                    label: "Pipeline Generated",
                    detail: "In 3 days, 600+ qualified leads",
                    icon: Award,
                  },
                  {
                    industry: "E-Commerce Brand",
                    stat: "$200K",
                    label: "Revenue in 90 Days",
                    detail: "500 new customers acquired",
                    icon: ShoppingCart,
                  },
                ].map((study, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-xl p-8 border border-gray-200"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-[#F7F9FB] rounded-lg border border-gray-200 flex items-center justify-center">
                        <study.icon className="h-5 w-5 text-[#007AFF]" />
                      </div>
                      <span className="text-sm text-gray-500 font-medium">{study.industry}</span>
                    </div>
                    <div className="text-4xl font-light text-gray-900 mb-1">{study.stat}</div>
                    <div className="text-gray-600 mb-2">{study.label}</div>
                    <div className="text-sm text-[#007AFF] font-medium">{study.detail}</div>
                  </motion.div>
                ))}
              </div>

              <div className="text-center mt-10">
                <Button variant="outline" href="/case-studies">
                  View All Case Studies <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Container>
          </section>

          {/* ============================================ */}
          {/* SECTION 7: How It Works - 4-Step Process      */}
          {/* ============================================ */}
          <section className="py-20 bg-white">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide">HOW IT WORKS</span>
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  From Website Visitor to Your Customer in 4 Steps
                </h2>
              </motion.div>

              <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">

                  {[
                    {
                      step: "01",
                      title: "We Learn Your ICP",
                      description: "Share your ideal customer profile. We map it against our database of 420M+ contacts to find your best-fit prospects.",
                      icon: Search,
                    },
                    {
                      step: "02",
                      title: "We Find Your Buyers",
                      description: "Identify website visitors, build targeted audiences, and surface leads with active buying intent.",
                      icon: Target,
                    },
                    {
                      step: "03",
                      title: "We Reach Them",
                      description: "Launch automated multi-channel outreach: email, LinkedIn, direct mail. Personalized at scale.",
                      icon: Send,
                    },
                    {
                      step: "04",
                      title: "You Close Deals",
                      description: "Qualified meetings land on your calendar. Your CRM stays updated. Pipeline grows predictably.",
                      icon: TrendingUp,
                    },
                  ].map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 }}
                      className="relative text-center"
                    >
                      <div className="text-5xl font-light text-gray-200 mb-4">{step.step}</div>
                      <div className="w-16 h-16 rounded-2xl bg-[#F7F9FB] border border-gray-200 flex items-center justify-center mx-auto mb-4 relative z-10">
                        <step.icon className="h-8 w-8 text-[#007AFF]" />
                      </div>
                      {/* Arrow between steps (desktop) */}
                      {i < 3 && (
                        <div className="hidden lg:block absolute top-[68px] -right-4 z-20">
                          <ChevronRight className="h-5 w-5 text-[#007AFF]/40" />
                        </div>
                      )}
                      {/* Arrow between steps (mobile) */}
                      {i < 3 && (
                        <div className="lg:hidden flex justify-center my-2 md:hidden">
                          <ArrowDown className="h-4 w-4 text-gray-300" />
                        </div>
                      )}
                      <h3 className="text-xl text-gray-900 mb-3 font-medium">{step.title}</h3>
                      <p className="text-gray-600 leading-relaxed text-sm">{step.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Container>
          </section>

          {/* ============================================ */}
          {/* SECTION 8: Industry Solutions                 */}
          {/* ============================================ */}
          <section className="py-20 bg-[#F7F9FB]">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide">INDUSTRIES</span>
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  Built For Your Industry
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Cursive adapts to the unique needs of your vertical with pre-built audiences and proven playbooks.
                </p>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                {[
                  { name: "B2B Software", href: "/industries/b2b-software", icon: Layers },
                  { name: "E-Commerce", href: "/industries/ecommerce", icon: ShoppingCart },
                  { name: "Agencies", href: "/industries/agencies", icon: Briefcase },
                  { name: "Financial Services", href: "/industries/financial-services", icon: DollarSign },
                  { name: "Real Estate", href: "/industries/real-estate", icon: Home },
                  { name: "Education", href: "/industries/education", icon: GraduationCap },
                  { name: "Healthcare", href: "/industries/healthcare", icon: Building2 },
                  { name: "Franchises", href: "/industries/franchises", icon: Globe },
                ].map((industry, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={industry.href}
                      className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-200 hover:border-[#007AFF] hover:shadow-md transition-all group"
                    >
                      <industry.icon className="h-5 w-5 text-[#007AFF] flex-shrink-0" />
                      <span className="text-gray-900 text-sm font-medium group-hover:text-[#007AFF] transition-colors">
                        {industry.name}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400 ml-auto flex-shrink-0" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* ============================================ */}
          {/* SECTION 9: Integrations with Real Logos       */}
          {/* ============================================ */}
          <section className="py-20 bg-white">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center max-w-4xl mx-auto"
              >
                <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide">INTEGRATIONS</span>
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6">
                  Works With Your Existing Stack
                </h2>
                <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
                  Cursive connects natively with your CRM, ad platforms, email tools, and more. Two-way data sync keeps everything current.
                </p>

                {/* Integration logos in even grid - 4 rows of 4 = 16 */}
                <div className="grid grid-cols-4 md:grid-cols-8 gap-4 mb-10 max-w-4xl mx-auto">
                  {[
                    { name: "Salesforce", logo: "/integrations/salesforce.svg" },
                    { name: "HubSpot", logo: "/integrations/hubspot-svgrepo-com.svg" },
                    { name: "Slack", logo: "/integrations/slack-svgrepo-com.svg" },
                    { name: "Google Ads", logo: "/integrations/google-ads-svgrepo-com.svg" },
                    { name: "Meta", logo: "/integrations/meta-color.svg" },
                    { name: "LinkedIn", logo: "/integrations/linkedin.svg" },
                    { name: "Mailchimp", logo: "/integrations/mailchimp logo.jpg" },
                    { name: "Zapier", logo: "/integrations/zapier.png" },
                    { name: "Shopify", logo: "/integrations/shopify.svg" },
                    { name: "Stripe", logo: "/integrations/stripe logo.png" },
                    { name: "Gmail", logo: "/integrations/gmail.svg" },
                    { name: "Apollo", logo: "/integrations/apollo.svg" },
                    { name: "Klaviyo", logo: "/integrations/klaviyo.svg" },
                    { name: "Calendly", logo: "/integrations/calendly.svg" },
                    { name: "Notion", logo: "/integrations/notion.svg" },
                    { name: "Airtable", logo: "/integrations/airtable-svgrepo-com.svg" },
                  ].map((tool, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-[#F7F9FB] rounded-xl p-4 border border-gray-200 flex flex-col items-center justify-center gap-2 hover:border-[#007AFF]/30 hover:shadow-sm transition-all aspect-square"
                    >
                      <Image
                        src={tool.logo}
                        alt={tool.name}
                        width={28}
                        height={28}
                        className="w-7 h-7 object-contain"
                      />
                      <span className="text-[10px] text-gray-600 font-medium text-center leading-tight">{tool.name}</span>
                    </motion.div>
                  ))}
                </div>

                <p className="text-gray-500 mb-6">...and 200+ more</p>

                <Button variant="outline" href="/integrations">
                  View All Integrations <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </Container>
          </section>

          {/* ============================================ */}
          {/* SECTION 10: MASSIVE FAQ                       */}
          {/* ============================================ */}
          <section className="py-20 bg-[#F7F9FB]">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <span className="text-sm text-[#007AFF] mb-4 block font-medium tracking-wide">FAQ</span>
                <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                  Everything You Might Be Wondering
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Get answers to the most common questions before your call.
                </p>
              </motion.div>

              <div className="max-w-4xl mx-auto">
                {/* About Cursive */}
                <div className="mb-10">
                  <h3 className="text-lg font-medium text-[#007AFF] mb-4">About Cursive</h3>
                  <div className="space-y-3">
                    {[
                      {
                        question: "What exactly is Cursive?",
                        answer: "Cursive is an all-in-one growth platform that combines website visitor identification, audience building from 420M+ verified contacts, and automated multi-channel outbound campaigns. Instead of juggling 5-10 different tools, Cursive gives you everything in one platform — from identifying who's on your website to putting meetings on your calendar.",
                      },
                      {
                        question: "How is Cursive different from other lead gen tools?",
                        answer: "Two big differences: First, recursive intelligence — every interaction makes the system smarter. Your visitor data feeds your audience building, which feeds your outbound, which feeds your conversion data, which feeds better targeting. It compounds. Second, we do identification AND outreach, not just one or the other. Most tools give you a list and walk away. Cursive takes you from anonymous visitor all the way to booked meeting.",
                      },
                      {
                        question: "Who is Cursive built for?",
                        answer: "B2B companies of all sizes, digital agencies, e-commerce brands — anyone who wants more qualified leads without hiring a massive sales team. Our sweet spot is companies doing $1M-$100M in revenue who need to scale their pipeline predictably. But we work with startups and enterprises alike.",
                      },
                      {
                        question: "How long has Cursive been around?",
                        answer: "Cursive was founded by growth operators who got tired of bad data and fragmented tools. We built what we wished existed: one platform that handles the entire top-of-funnel. Our team has collectively generated over $500M in pipeline for clients across dozens of industries.",
                      },
                    ].map((faq, i) => {
                      const idx = i
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.03 }}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                        >
                          <button
                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                            className="w-full px-6 py-5 flex items-start justify-between text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-gray-900 font-medium pr-4">{faq.question}</span>
                            <span className="text-gray-400 text-2xl flex-shrink-0">{openFaq === idx ? "\u2212" : "+"}</span>
                          </button>
                          {openFaq === idx && (
                            <div className="px-6 pb-5">
                              <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {/* Visitor Identification */}
                <div className="mb-10">
                  <h3 className="text-lg font-medium text-[#007AFF] mb-4">Visitor Identification</h3>
                  <div className="space-y-3">
                    {[
                      {
                        question: "How does visitor identification work?",
                        answer: "We provide a lightweight JavaScript pixel you add to your site (takes about 5 minutes). When visitors land on your pages, Cursive uses multi-source data enrichment — including IP intelligence, device fingerprinting, and email graph matching — to identify up to 70% of your B2B traffic. You get company name, individual contact info, and behavioral data in real-time.",
                      },
                      {
                        question: "What data do you provide for identified visitors?",
                        answer: "For companies: name, industry, employee count, revenue, location, tech stack, and funding info. For individuals: name, job title, seniority, department, verified email address, phone number, and LinkedIn profile. Plus behavioral data: which pages they visited, how long they spent, and whether they're a return visitor.",
                      },
                      {
                        question: "Is your pixel GDPR/CCPA compliant?",
                        answer: "Yes, 100%. Cursive is built privacy-first. We use hashed identifiers (no plain-text PII storage), honor all industry opt-out lists, support right-to-forget requests automatically, and integrate with consent management platforms. We comply with GDPR, CCPA, and all major regional privacy regulations.",
                      },
                      {
                        question: "How accurate is the identification?",
                        answer: "We average a 70% identification rate for B2B traffic — significantly higher than the industry average of 20-30%. For matched records, our data accuracy exceeds 95%. We continuously verify and re-enrich data to maintain this quality.",
                      },
                    ].map((faq, i) => {
                      const idx = 100 + i
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.03 }}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                        >
                          <button
                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                            className="w-full px-6 py-5 flex items-start justify-between text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-gray-900 font-medium pr-4">{faq.question}</span>
                            <span className="text-gray-400 text-2xl flex-shrink-0">{openFaq === idx ? "\u2212" : "+"}</span>
                          </button>
                          {openFaq === idx && (
                            <div className="px-6 pb-5">
                              <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {/* Data & Audiences */}
                <div className="mb-10">
                  <h3 className="text-lg font-medium text-[#007AFF] mb-4">Data & Audiences</h3>
                  <div className="space-y-3">
                    {[
                      {
                        question: "How big is your database?",
                        answer: "Our database includes 280M consumer profiles, 140M+ business profiles, and we track 60B+ behaviors & URLs scanned weekly. Combined, that's 420M+ verified contacts across virtually every industry, geography, and company size. It's one of the largest B2B and B2C contact databases available.",
                      },
                      {
                        question: "What filters can I use to build audiences?",
                        answer: "You can filter by industry, company size, revenue, geographic location, job title, seniority level, department, intent signals, technographics (what software they use), funding status, hiring signals, and more. You can combine any number of filters to build hyper-targeted lists that match your exact ICP.",
                      },
                      {
                        question: "How fresh is the data?",
                        answer: "Our data is continuously updated and re-verified in real-time. Unlike batch-processing tools that update monthly or quarterly, Cursive validates contact information at the point of delivery. If an email bounces, we replace it at no charge. You always get the most current data available.",
                      },
                      {
                        question: "Can I build custom audiences?",
                        answer: "Absolutely. If our standard filters don't cover your needs, we'll build a custom audience from scratch. Any criteria — niche industries, specific technologies, geographic micro-markets, behavioral signals — you name it, we'll source it. Just tell us what you need on your call.",
                      },
                    ].map((faq, i) => {
                      const idx = 200 + i
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.03 }}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                        >
                          <button
                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                            className="w-full px-6 py-5 flex items-start justify-between text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-gray-900 font-medium pr-4">{faq.question}</span>
                            <span className="text-gray-400 text-2xl flex-shrink-0">{openFaq === idx ? "\u2212" : "+"}</span>
                          </button>
                          {openFaq === idx && (
                            <div className="px-6 pb-5">
                              <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {/* Services & Pricing */}
                <div className="mb-10">
                  <h3 className="text-lg font-medium text-[#007AFF] mb-4">Services & Pricing</h3>
                  <div className="space-y-3">
                    {[
                      {
                        question: "How much does Cursive cost?",
                        answer: "Self-serve marketplace credits start at $99 for 100 credits. Done-for-you services start at $1,000/month for Cursive Data, $2,500/month for Cursive Outbound, and $5,000/month for Cursive Pipeline. All plans are flat monthly pricing with no per-lead or per-visitor fees. No surprises on your invoice.",
                      },
                      {
                        question: "Do you charge per visitor or per lead?",
                        answer: "No. All done-for-you plans are flat monthly pricing. You won't see variable charges based on visitor volume or lead count. This makes budgeting predictable and eliminates the fear of unexpected costs as your traffic grows.",
                      },
                      {
                        question: "Is there a free trial?",
                        answer: "Yes. Free accounts get 100 marketplace credits to test our data quality and search capabilities. For done-for-you services, we don't offer free trials because they require significant setup and customization — but we're confident you'll see ROI within the first month.",
                      },
                      {
                        question: "What's included in done-for-you services?",
                        answer: "It depends on the tier. Cursive Data gives you monthly verified lead lists with custom ICP targeting. Cursive Outbound adds done-for-you email campaigns with AI personalization, domain setup, and warmup. Cursive Pipeline includes everything plus multi-channel outreach (email, LinkedIn, direct mail), a dedicated success manager, and full pipeline management.",
                      },
                      {
                        question: "Can I cancel anytime?",
                        answer: "Yes. All plans are month-to-month with no long-term contracts. Give us 30 days notice and you're free to go. Annual plans are available and save 20%, but they're entirely optional.",
                      },
                    ].map((faq, i) => {
                      const idx = 300 + i
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.03 }}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                        >
                          <button
                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                            className="w-full px-6 py-5 flex items-start justify-between text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-gray-900 font-medium pr-4">{faq.question}</span>
                            <span className="text-gray-400 text-2xl flex-shrink-0">{openFaq === idx ? "\u2212" : "+"}</span>
                          </button>
                          {openFaq === idx && (
                            <div className="px-6 pb-5">
                              <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {/* Getting Started */}
                <div className="mb-10">
                  <h3 className="text-lg font-medium text-[#007AFF] mb-4">Getting Started</h3>
                  <div className="space-y-3">
                    {[
                      {
                        question: "How long does setup take?",
                        answer: "Pixel installation: 5 minutes (copy-paste a JavaScript snippet). Marketplace: instant access, start searching immediately. Done-for-you services: 1-3 weeks for full onboarding depending on the tier. We handle everything — domain setup, CRM integration, campaign configuration. You just approve and we launch.",
                      },
                      {
                        question: "What happens on our call?",
                        answer: "We'll spend 30 minutes reviewing your current lead generation setup, mapping your ideal customer profile, showing you matching leads in our database in real-time, and recommending the best plan for your goals. No hard sell — just a strategic conversation about what's possible.",
                      },
                      {
                        question: "Do I need technical expertise?",
                        answer: "Not at all. Our pixel is a simple copy-paste install that works on any platform (WordPress, Webflow, Shopify, custom builds). CRM integrations are one-click. And if you choose done-for-you services, we handle everything technical. You focus on closing deals.",
                      },
                      {
                        question: "What if I already use another tool?",
                        answer: "Cursive complements or replaces most lead gen tools. Many customers switch from tools like ZoomInfo, Apollo, Clearbit, or 6sense and consolidate everything into Cursive. We'll help you evaluate the overlap during your call and can often save you money by replacing multiple subscriptions.",
                      },
                      {
                        question: "What results can I expect?",
                        answer: "Results vary by industry and starting point, but typical customers see a 3x pipeline increase within 90 days. Our case studies show outcomes ranging from 5x CPC reduction to $24M in pipeline generated. We'll give you realistic projections based on your specific situation during your call.",
                      },
                      {
                        question: "What if Cursive isn't a good fit?",
                        answer: "We'll tell you honestly. During your call, if we don't think Cursive can deliver meaningful ROI for your specific situation, we'll say so. We'd rather build a long-term relationship based on trust than oversell. No pressure, ever.",
                      },
                      {
                        question: "Can I start small and scale up?",
                        answer: "Absolutely. Many customers start with Cursive Data at $1,000/month or even just marketplace credits, prove the ROI, and then upgrade to Outbound or Pipeline. There's no commitment to jump to a higher tier. Scale at your own pace.",
                      },
                    ].map((faq, i) => {
                      const idx = 400 + i
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.03 }}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                        >
                          <button
                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                            className="w-full px-6 py-5 flex items-start justify-between text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-gray-900 font-medium pr-4">{faq.question}</span>
                            <span className="text-gray-400 text-2xl flex-shrink-0">{openFaq === idx ? "\u2212" : "+"}</span>
                          </button>
                          {openFaq === idx && (
                            <div className="px-6 pb-5">
                              <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Container>
          </section>

          {/* ============================================ */}
          {/* SECTION 11: Free Gift - Marketplace Access    */}
          {/* ============================================ */}
          <section className="py-24 bg-white">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-3xl mx-auto"
              >
                {/* Gift reveal */}
                <div className="text-center mb-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-20 h-20 bg-[#007AFF]/10 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <Gift className="h-10 w-10 text-[#007AFF]" />
                  </motion.div>
                  <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
                    Your Free Gift
                  </h2>
                  <p className="font-cursive text-2xl lg:text-3xl text-gray-500 mb-6">
                    As promised.
                  </p>
                  <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto mb-8">
                    As a thank you for booking a call, get free access to the Cursive Lead Marketplace. Browse leads in your industry, see our data quality firsthand, and come to your call already knowing exactly what Cursive can do for you.
                  </p>
                </div>

                <div className="bg-[#F7F9FB] rounded-2xl p-8 lg:p-10 border border-gray-200 text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-[#007AFF] rounded-xl flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-2xl font-light text-gray-900">Lead Marketplace</h3>
                  </div>
                  <p className="text-gray-600 mb-2">100 free credits included. No credit card required.</p>
                  <p className="text-sm text-gray-500 mb-8">Search by industry, title, company size, intent score, and more. Export leads instantly.</p>

                  <div className="flex flex-col items-center gap-4">
                    <Button href="https://leads.meetcursive.com/signup?source=call-booked-gift" target="_blank" size="lg">
                      Try the Marketplace Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#007AFF]" /> 100 free credits</span>
                      <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#007AFF]" /> No credit card</span>
                      <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-[#007AFF]" /> Instant access</span>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-10">
                  <p className="text-sm text-gray-400">
                    Questions before your call? Email us at{" "}
                    <a href="mailto:hello@meetcursive.com" className="text-[#007AFF] hover:underline">
                      hello@meetcursive.com
                    </a>
                  </p>
                </div>
              </motion.div>
            </Container>
          </section>

        </main>
      </HumanView>

      {/* ============================================ */}
      {/* Machine View - AEO-Optimized                 */}
      {/* ============================================ */}
      <MachineView>
        <MachineContent>
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl text-gray-900 font-bold mb-4">CALL BOOKED - CURSIVE GROWTH PLATFORM OVERVIEW</h1>
            <p className="text-gray-700 leading-relaxed">
              Comprehensive overview of the Cursive growth platform. Cursive is an all-in-one system for website visitor identification, audience building from 420M+ verified contacts, and automated multi-channel outbound campaigns. Designed for B2B companies, agencies, and e-commerce brands seeking predictable pipeline growth.
            </p>
          </div>

          <MachineSection title="Platform Overview">
            <p className="text-gray-700 mb-4">
              Cursive combines visitor identification, audience building, and outbound automation into a single recursive intelligence platform. Every interaction makes the system smarter through feedback loops: identify visitors, enrich data, reach prospects, convert leads, learn from outcomes, and optimize targeting. Unlike point solutions like ZoomInfo, Apollo, or RB2B that only handle one piece of the growth puzzle, Cursive replaces your entire stack with one compounding platform.
            </p>
            <MachineList items={[
              "420M+ verified contacts (280M consumer, 140M+ business)",
              "70% average visitor identification rate for B2B traffic",
              "200+ native integrations (Salesforce, HubSpot, Pipedrive, Slack, and more)",
              "95%+ email deliverability on verified contacts",
              "60B+ behaviors & URLs scanned weekly tracked",
            ]} />
          </MachineSection>

          <MachineSection title="Core Solutions">
            <MachineList items={[
              { label: "Visitor Identification", href: "https://www.meetcursive.com/visitor-identification", description: "Identify up to 70% of anonymous B2B website traffic with company + individual data" },
              { label: "Audience Builder", href: "https://www.meetcursive.com/audience-builder", description: "Build custom audiences from 280M US consumer and 140M+ business profiles" },
              { label: "Intent Data", href: "https://www.meetcursive.com/intent-audiences", description: "Track 60B+ behaviors & URLs scanned weekly to find active buyers" },
              { label: "Outbound Campaigns", href: "https://www.meetcursive.com/services", description: "AI-powered email campaigns with domain setup, warmup, and optimization" },
              { label: "Direct Mail", href: "https://www.meetcursive.com/direct-mail", description: "Automated postcards and letters to high-intent prospects" },
              { label: "Custom Audiences", href: "https://www.meetcursive.com/custom-audiences", description: "Custom audience building by any criteria" },
              { label: "CRM Integrations", href: "https://www.meetcursive.com/integrations", description: "Native sync with 200+ tools" },
              { label: "Website Pixel", href: "https://www.meetcursive.com/pixel", description: "5-minute install, GDPR/CCPA compliant tracking" },
              { label: "Lead Marketplace", href: "https://www.meetcursive.com/marketplace", description: "Browse and buy verified leads on-demand with credits" },
              { label: "Data Enrichment", href: "https://www.meetcursive.com/data-enrichment", description: "Enrich contacts with 100+ data points via waterfall enrichment" },
              { label: "Attribution & Analytics", href: "https://www.meetcursive.com/attribution", description: "Multi-touch attribution from first visit to closed deal" },
            ]} />
          </MachineSection>

          <MachineSection title="Pricing">
            <p className="text-gray-700 mb-4">Self-serve and done-for-you pricing options:</p>
            <MachineList items={[
              "Self-Serve Marketplace: Starter $99/100 credits, Growth $399/500 credits, Scale $699/1,000 credits, Enterprise $2,999/5,000 credits",
              "Cursive Data: $1,000/month - Monthly verified lead lists, custom ICP targeting, 500-2,000 leads/month, CRM integration",
              "Cursive Outbound: $2,500/month - Everything in Data + done-for-you email campaigns, AI personalization, 200+ emails/day",
              "Cursive Pipeline: $5,000/month - Everything in Outbound + multi-channel outreach, dedicated success manager, full pipeline management",
              "Venture Studio: $25,000+/month - White-glove service, dedicated team, custom integrations, weekly strategy",
            ]} />
            <MachineList items={[
              { label: "View Full Pricing", href: "https://www.meetcursive.com/pricing", description: "Detailed pricing for all plans and add-ons" },
            ]} />
          </MachineSection>

          <MachineSection title="Case Studies">
            <MachineList items={[
              "AI SaaS Company: $11M revenue, 40x ROI in 30 days",
              "Insurtech Startup: 5x CPC reduction, 1,200+ leads in 90 days",
              "Medical Technology: $24M pipeline in 3 days, 600+ qualified leads",
              "E-Commerce Brand: $200K revenue in 90 days, 500 new customers",
            ]} />
            <MachineList items={[
              { label: "View All Case Studies", href: "https://www.meetcursive.com/case-studies", description: "Detailed results from Cursive customers across industries" },
            ]} />
          </MachineSection>

          <MachineSection title="Industries Served">
            <MachineList items={[
              { label: "B2B Software", href: "https://www.meetcursive.com/industries/b2b-software" },
              { label: "E-Commerce", href: "https://www.meetcursive.com/industries/ecommerce" },
              { label: "Agencies", href: "https://www.meetcursive.com/industries/agencies" },
              { label: "Financial Services", href: "https://www.meetcursive.com/industries/financial-services" },
              { label: "Real Estate", href: "https://www.meetcursive.com/industries/real-estate" },
              { label: "Education", href: "https://www.meetcursive.com/industries/education" },
              { label: "Healthcare", href: "https://www.meetcursive.com/industries/healthcare" },
              { label: "Franchises", href: "https://www.meetcursive.com/industries/franchises" },
            ]} />
          </MachineSection>

          <MachineSection title="How It Works">
            <MachineList items={[
              "Step 1: Share your ideal customer profile (ICP). We map it against 420M+ contacts.",
              "Step 2: Identify website visitors, build targeted audiences, surface leads with buying intent.",
              "Step 3: Launch automated multi-channel outreach: email, LinkedIn, direct mail. Personalized at scale.",
              "Step 4: Qualified meetings land on your calendar. CRM stays updated. Pipeline grows predictably.",
            ]} />
          </MachineSection>

          <MachineSection title="Frequently Asked Questions">
            <div className="space-y-4">
              <div>
                <p className="text-gray-900 font-medium mb-1">What is Cursive?</p>
                <p className="text-gray-700">All-in-one growth platform combining visitor identification, audience building from 420M+ contacts, and automated outbound campaigns.</p>
              </div>
              <div>
                <p className="text-gray-900 font-medium mb-1">How is Cursive different from other lead gen tools?</p>
                <p className="text-gray-700">Recursive intelligence: every interaction makes the system smarter. Plus Cursive handles identification AND outreach, not just one or the other. Tools like ZoomInfo and Apollo only solve one piece of the puzzle.</p>
              </div>
              <div>
                <p className="text-gray-900 font-medium mb-1">How does visitor identification work?</p>
                <p className="text-gray-700">Lightweight pixel + multi-source data enrichment identifies up to 70% of B2B traffic with company and individual-level data.</p>
              </div>
              <div>
                <p className="text-gray-900 font-medium mb-1">Is Cursive GDPR/CCPA compliant?</p>
                <p className="text-gray-700">Yes. Privacy-first architecture with hashed IDs, opt-out honoring, consent management, and regional compliance.</p>
              </div>
              <div>
                <p className="text-gray-900 font-medium mb-1">How much does Cursive cost?</p>
                <p className="text-gray-700">Self-serve credits from $99. Done-for-you services from $1,000/month. All flat pricing, no per-lead or per-visitor fees.</p>
              </div>
              <div>
                <p className="text-gray-900 font-medium mb-1">What results can I expect?</p>
                <p className="text-gray-700">Typical customers see 3x pipeline increase within 90 days. Case study results range from 5x CPC reduction to $24M in pipeline generated.</p>
              </div>
            </div>
          </MachineSection>

          <MachineSection title="Get Started">
            <MachineList items={[
              { label: "Book a Call", href: "https://cal.com/cursive/30min", description: "30-minute strategy call to review your ICP and see matching leads" },
              { label: "Lead Marketplace (Free Gift)", href: "https://leads.meetcursive.com/signup?source=call-booked-gift", description: "Try the marketplace free with 100 credits — no credit card required" },
              { label: "View Pricing", href: "https://www.meetcursive.com/pricing", description: "See all plans and pricing details" },
              { label: "Contact Us", href: "https://www.meetcursive.com/contact", description: "Email hello@meetcursive.com for questions" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </>
  )
}
