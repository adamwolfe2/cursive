"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  Mail, Calendar, MessageCircle, Clock, ArrowRight,
  Eye, Users, Layers, type LucideIcon,
} from "lucide-react"
import { useState } from "react"
import { DashboardCTA } from "@/components/dashboard-cta"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import Link from "next/link"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { GET_LEADS_URL, BOOKING_URL } from "@/lib/cta"

const EASE = [0.22, 1, 0.36, 1] as const

function SectionHeading({ plain, script, sub }: { plain: string; script?: string; sub?: string }) {
  return (
    <div className="text-center mb-14">
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900">
        {plain}
        {script && (
          <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
            {script}
          </span>
        )}
      </h2>
      {sub && (
        <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">{sub}</p>
      )}
    </div>
  )
}

function IconChip({ Icon }: { Icon: LucideIcon }) {
  return (
    <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary" />
    </div>
  )
}

const plans: Array<{ name: string; price: string; icon: LucideIcon; description: string; highlight: boolean }> = [
  {
    name: "Visitor Pixel",
    price: "$97",
    icon: Eye,
    description: "Identify the companies and people visiting your site.",
    highlight: false,
  },
  {
    name: "Pixel + Audience Bundle",
    price: "$247",
    icon: Layers,
    description: "Site traffic and in-market intent in one feed.",
    highlight: true,
  },
  {
    name: "Custom Audience",
    price: "$197",
    icon: Users,
    description: "A fresh weekly list of buyers searching for your product.",
    highlight: false,
  },
]

const faqs = [
  {
    question: "Do I need to talk to sales to get started?",
    answer: "No. Every plan is self-serve. Pick Visitor Pixel ($97/mo), Custom Audience ($197/mo), or the bundle ($247/mo), check out, and you are live in minutes. Booking a call is optional.",
  },
  {
    question: "How quickly will I hear back if I message you?",
    answer: "Within 24 hours, usually much faster. But most teams skip this entirely and just pick a plan to start the same day.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. All plans are month-to-month with no long-term contract and no setup fee. Cancel anytime.",
  },
  {
    question: "Which plan should I pick?",
    answer: "Want to see who is already on your site? Start with the Visitor Pixel. Want a fresh weekly list of in-market buyers? Custom Audience. Want both in one feed? The bundle is the best value.",
  },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  })
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("submitting")
    setErrorMessage("")
    setFieldErrors({})

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setStatus("error")
        if (data.errors && Array.isArray(data.errors)) {
          // Set field-specific errors
          const errors: { [key: string]: string } = {}
          data.errors.forEach((err: { field: string; message: string }) => {
            errors[err.field] = err.message
          })
          setFieldErrors(errors)
          setErrorMessage("Please fix the errors below and try again.")
        } else {
          setErrorMessage(data.error || "Failed to submit form. Please try again.")
        }
        return
      }

      setStatus("success")
      setFormData({ name: "", email: "", company: "", message: "" })
    } catch (error) {
      setStatus("error")
      setErrorMessage("An unexpected error occurred. Please try again later.")
    }
  }

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": "https://www.meetcursive.com/contact#page",
        "name": "Contact Cursive",
        "description": "Get in touch with the Cursive team, or skip the wait and pick a self-serve plan to go live in minutes. Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo.",
        "url": "https://www.meetcursive.com/contact"
      },
      {
        "@type": "Organization",
        "@id": "https://www.meetcursive.com#organization",
        "name": "Cursive",
        "url": "https://www.meetcursive.com",
        "logo": "https://www.meetcursive.com/logo.png",
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "telephone": "",
            "contactType": "Sales",
            "email": "hey@meetcursive.com",
            "availableLanguage": "en",
            "areaServed": "US"
          },
          {
            "@type": "ContactPoint",
            "telephone": "",
            "contactType": "Customer Support",
            "email": "hey@meetcursive.com",
            "availableLanguage": "en",
            "areaServed": "US"
          }
        ],
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "San Francisco",
          "addressRegion": "CA",
          "addressCountry": "US"
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://www.meetcursive.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Contact",
            "item": "https://www.meetcursive.com/contact"
          }
        ]
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", href: "/" },
              { name: "Contact", href: "/contact" },
            ]} />
          </div>

          {/* Hero */}
          <section className="relative pt-16 pb-20 sm:pt-20 sm:pb-24 bg-white">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="text-center max-w-3xl mx-auto"
              >
                <span className="text-xs font-semibold tracking-[0.25em] text-primary uppercase">
                  Get in touch
                </span>
                <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  Most teams just pick
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    a plan and start
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  Cursive is self-serve. Choose a plan, check out, and you are live in minutes —
                  no sales call required. Prefer to talk first? We are one message away.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Button size="lg" href={GET_LEADS_URL} target="_blank" rel="noopener noreferrer">
                    See plans &amp; get started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                    Book a Call
                  </Button>
                </div>
              </motion.div>
            </Container>
          </section>

          {/* Primary path — pick a plan */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="Skip the Wait,"
                script="Pick a Plan"
                sub="Self-serve, month-to-month, cancel anytime. No setup fee, no contract."
              />
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
                {plans.map((plan, i) => (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                    className={`relative flex flex-col rounded-2xl p-6 sm:p-8 transition-shadow ${
                      plan.highlight
                        ? "bg-white border border-primary shadow-lg ring-1 ring-primary/20"
                        : "bg-white border border-gray-200 hover:shadow-lg"
                    }`}
                  >
                    {plan.highlight && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white whitespace-nowrap">
                        Best Value
                      </span>
                    )}
                    <IconChip Icon={plan.icon} />
                    <h3 className="mt-5 text-lg font-medium text-gray-900">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-4xl font-light text-gray-900">{plan.price}</span>
                      <span className="text-sm text-gray-500">/mo</span>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed flex-1">{plan.description}</p>
                    <Button
                      href={GET_LEADS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant={plan.highlight ? "default" : "outline"}
                      className="w-full mt-8"
                    >
                      Get Started
                    </Button>
                  </motion.div>
                ))}
              </div>
              <p className="mt-8 text-center text-sm text-gray-500">
                Not sure which to pick? <Link href="/pricing" className="text-primary hover:underline">Compare plans</Link> — or message us below.
              </p>
            </Container>
          </section>

          {/* Secondary path — message + book */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                {/* Contact Form */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  <h2 className="text-2xl sm:text-3xl font-light text-gray-900">Have a question first?</h2>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                    Send a note and we will reply within 24 hours.
                  </p>
                  <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-5"
                    toolname="contactCursive"
                    tooldescription="Send a message to the Cursive team with a question about plans, pricing, or fit. Response within 24 hours. Most buyers skip this and self-serve at leads.meetcursive.com/get-leads."
                  >
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value })
                          if (fieldErrors.name) {
                            setFieldErrors({ ...fieldErrors, name: "" })
                          }
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          fieldErrors.name ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Your name"
                        aria-invalid={!!fieldErrors.name}
                        aria-describedby={fieldErrors.name ? "name-error" : undefined}
                        toolparamdescription="Full name of the person contacting Cursive"
                      />
                      {fieldErrors.name && (
                        <p id="name-error" className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value })
                          if (fieldErrors.email) {
                            setFieldErrors({ ...fieldErrors, email: "" })
                          }
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          fieldErrors.email ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="you@company.com"
                        aria-invalid={!!fieldErrors.email}
                        aria-describedby={fieldErrors.email ? "email-error" : undefined}
                        toolparamdescription="Work email address for reply"
                      />
                      {fieldErrors.email && (
                        <p id="email-error" className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={(e) => {
                          setFormData({ ...formData, company: e.target.value })
                          if (fieldErrors.company) {
                            setFieldErrors({ ...fieldErrors, company: "" })
                          }
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          fieldErrors.company ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Your company name"
                        aria-invalid={!!fieldErrors.company}
                        aria-describedby={fieldErrors.company ? "company-error" : undefined}
                        toolparamdescription="Company or organization name"
                      />
                      {fieldErrors.company && (
                        <p id="company-error" className="text-red-500 text-sm mt-1">{fieldErrors.company}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={(e) => {
                          setFormData({ ...formData, message: e.target.value })
                          if (fieldErrors.message) {
                            setFieldErrors({ ...fieldErrors, message: "" })
                          }
                        }}
                        rows={6}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                          fieldErrors.message ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="What can we help you figure out?"
                        aria-invalid={!!fieldErrors.message}
                        aria-describedby={fieldErrors.message ? "message-error" : undefined}
                        toolparamdescription="Message describing the question (e.g., which plan fits, pricing, integrations)"
                      />
                      {fieldErrors.message && (
                        <p id="message-error" className="text-red-500 text-sm mt-1">{fieldErrors.message}</p>
                      )}
                    </div>

                    {status === "success" && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
                        <p className="font-medium">Success!</p>
                        <p className="text-sm mt-1">Thanks! We&apos;ll get back to you within 24 hours.</p>
                      </div>
                    )}

                    {status === "error" && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                        <p className="font-medium">Error</p>
                        <p className="text-sm mt-1">{errorMessage}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={status === "submitting"}
                    >
                      {status === "submitting" ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </motion.div>

                {/* Other ways to reach us */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
                >
                  <h2 className="text-2xl sm:text-3xl font-light text-gray-900">Other ways to reach us</h2>
                  <div className="mt-8 space-y-4">
                    <a
                      href={BOOKING_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-2xl border border-gray-200 p-6 sm:p-7 hover:shadow-lg transition-shadow"
                    >
                      <IconChip Icon={Calendar} />
                      <h3 className="mt-5 text-lg font-medium text-gray-900">Book a call</h3>
                      <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                        Grab a 15-minute slot. We&apos;ll answer questions and walk you through a live demo.
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm text-primary">
                        View available times <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </a>

                    <div className="rounded-2xl border border-gray-200 p-6 sm:p-7">
                      <IconChip Icon={Mail} />
                      <h3 className="mt-5 text-lg font-medium text-gray-900">Email us</h3>
                      <a href="mailto:hey@meetcursive.com" className="mt-3 inline-block text-sm text-primary hover:underline">
                        hey@meetcursive.com
                      </a>
                      <p className="mt-1 text-sm text-gray-600">We respond within 24 hours.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-gray-200 p-6">
                        <IconChip Icon={MessageCircle} />
                        <h3 className="mt-4 text-sm font-medium text-gray-900">Live chat</h3>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">Mon–Fri, 9am–6pm EST.</p>
                      </div>
                      <div className="rounded-2xl border border-gray-200 p-6">
                        <IconChip Icon={Clock} />
                        <h3 className="mt-4 text-sm font-medium text-gray-900">Response time</h3>
                        <p className="mt-2 text-sm text-gray-600 leading-relaxed">Within 24 hours, usually faster.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </Container>
          </section>

          {/* FAQ */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading plain="Quick" script="Answers" />
              <div className="max-w-3xl mx-auto space-y-4">
                {faqs.map((faq, i) => (
                  <motion.div
                    key={faq.question}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04, duration: 0.4, ease: EASE }}
                    className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-7"
                  >
                    <h3 className="text-base font-medium text-gray-900">{faq.question}</h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Button size="lg" href={GET_LEADS_URL} target="_blank" rel="noopener noreferrer">
                  See plans &amp; get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" href="/pricing">
                  View pricing
                </Button>
              </div>
            </Container>
          </section>

          {/* Dashboard CTA */}
          <DashboardCTA
            headline="Prefer to"
            subheadline="Talk Live?"
            description="Book a 15-minute call and we'll answer all your questions. Or just pick a plan from $97/mo and start today."
          />
        </main>
      </HumanView>

      {/* Machine View - AEO-Optimized */}
      <MachineView>
        <MachineContent>
          {/* Header */}
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl text-gray-900 font-bold mb-4">CONTACT CURSIVE</h1>
            <p className="text-gray-700 leading-relaxed">
              Cursive is self-serve. Most teams pick a plan and go live in minutes without talking to
              sales. You can also message the team or book a call. Plans: Visitor Pixel $97/mo, Custom
              Audience $197/mo, or both for $247/mo. Month-to-month, no setup fee, cancel anytime.
            </p>
          </div>

          {/* Fastest Path */}
          <MachineSection title="Fastest Way to Start">
            <p className="text-gray-700 mb-4">
              No sales call required. Pick a self-serve plan, check out, and you are live in minutes.
            </p>
            <MachineList items={[
              { label: "Get Started", href: "https://leads.meetcursive.com/get-leads", description: "Choose a plan and you are live in minutes" },
              { label: "Pricing", href: "https://www.meetcursive.com/pricing", description: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo" },
            ]} />
          </MachineSection>

          {/* Plans */}
          <MachineSection title="Plans">
            <MachineList items={[
              "Visitor Pixel ($97/month) - Identify the companies and people visiting your site",
              "Custom Audience ($197/month) - A fresh weekly list of in-market buyers, delivered to Google Sheets",
              "Pixel + Audience Bundle ($247/month) - Both, in one feed (best value)",
            ]} />
            <p className="text-gray-700 mt-4">
              Every plan is self-serve and month-to-month with no setup fee. Cancel anytime.
            </p>
          </MachineSection>

          {/* Contact Methods */}
          <MachineSection title="Contact Methods">
            <MachineList items={[
              {
                label: "Book a Call",
                href: "https://cal.com/cursiveteam/30min",
                description: "Schedule a 15-minute intro call. We'll answer questions and show you a demo."
              },
              {
                label: "Email",
                href: "mailto:hey@meetcursive.com",
                description: "Send us an email at hey@meetcursive.com. We respond within 24 hours."
              },
              {
                label: "Live Chat",
                description: "Available Monday-Friday, 9am-6pm EST on our website"
              }
            ]} />
          </MachineSection>

          {/* Response Times */}
          <MachineSection title="Response Times">
            <MachineList items={[
              "Message via the contact form: Within 24 hours",
              "Book a call: Slots typically available within 1-2 business days",
              "Self-serve checkout: Live in minutes, no wait"
            ]} />
          </MachineSection>

          {/* Company Information */}
          <MachineSection title="Company Information">
            <p className="text-gray-700 mb-4">
              Cursive is headquartered in San Francisco, CA, United States. We&apos;re a remote-first company with team members across the US.
            </p>
            <MachineList items={[
              { label: "Website", href: "https://www.meetcursive.com" },
              { label: "Get Started", href: "https://leads.meetcursive.com/get-leads" }
            ]} />
          </MachineSection>

          {/* Frequently Asked Questions */}
          <MachineSection title="Frequently Asked Questions About Contacting Cursive">
            <div className="space-y-4">
              <div>
                <p className="text-gray-900 mb-2">Do I need to talk to sales to get started?</p>
                <p className="text-gray-600">No. Every plan is self-serve. Pick Visitor Pixel ($97/mo), Custom Audience ($197/mo), or the bundle ($247/mo), check out, and you are live in minutes. Booking a call is optional.</p>
              </div>
              <div>
                <p className="text-gray-900 mb-2">How quickly will I hear back if I message you?</p>
                <p className="text-gray-600">Within 24 hours, usually much faster. Most teams skip this and self-serve the same day.</p>
              </div>
              <div>
                <p className="text-gray-900 mb-2">Can I cancel anytime?</p>
                <p className="text-gray-600">Yes. All plans are month-to-month with no long-term contract and no setup fee.</p>
              </div>
              <div>
                <p className="text-gray-900 mb-2">Which plan should I pick?</p>
                <p className="text-gray-600">Visitor Pixel to see who is already on your site. Custom Audience for a fresh weekly list of in-market buyers. The bundle for both in one feed at the best value.</p>
              </div>
            </div>
          </MachineSection>

          {/* Additional Resources */}
          <MachineSection title="Additional Resources">
            <MachineList items={[
              {
                label: "Pricing",
                href: "https://www.meetcursive.com/pricing",
                description: "View plans: Visitor Pixel $97/mo, Custom Audience $197/mo, Bundle $247/mo"
              },
              {
                label: "Visitor Identification",
                href: "https://www.meetcursive.com/visitor-identification",
                description: "How the Visitor Pixel resolves anonymous traffic to companies and people"
              },
              {
                label: "About Cursive",
                href: "https://www.meetcursive.com/about",
                description: "Why we built the verified identity and intent data layer"
              },
              {
                label: "Case Studies",
                href: "https://www.meetcursive.com/case-studies",
                description: "See real results from Cursive clients"
              }
            ]} />
          </MachineSection>

        </MachineContent>
      </MachineView>
    </>
  )
}
