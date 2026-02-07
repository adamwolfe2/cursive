"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Clock, MessageCircle, Calendar } from "lucide-react"
import { useState } from "react"
import { DashboardCTA } from "@/components/dashboard-cta"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import Link from "next/link"
import { Breadcrumbs } from "@/components/Breadcrumbs"

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
      console.error("Form submission error:", error)
    }
  }

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": "https://meetcursive.com/contact#page",
        "name": "Contact Cursive",
        "description": "Get in touch with our team for sales inquiries, technical support, or partnership opportunities. Multiple contact methods available with fast response times.",
        "url": "https://meetcursive.com/contact"
      },
      {
        "@type": "Organization",
        "@id": "https://meetcursive.com#organization",
        "name": "Cursive",
        "url": "https://meetcursive.com",
        "logo": "https://meetcursive.com/logo.png",
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "telephone": "",
            "contactType": "Sales",
            "email": "hello@meetcursive.com",
            "availableLanguage": "en",
            "areaServed": "US"
          },
          {
            "@type": "ContactPoint",
            "telephone": "",
            "contactType": "Customer Support",
            "email": "hello@meetcursive.com",
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
            "item": "https://meetcursive.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Contact",
            "item": "https://meetcursive.com/contact"
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
      {/* Hero Section */}
      <section className="relative py-24 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl lg:text-6xl font-light text-gray-900 mb-6">
              Let's Talk About
              <span className="block font-cursive text-4xl lg:text-5xl text-gray-500 mt-2">
                Your Growth
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              Whether you have questions, need a demo, or want to discuss custom solutions—we're here to help.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Contact Methods */}
      <section className="py-24 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-light text-gray-900 mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (fieldErrors.name) {
                        setFieldErrors({ ...fieldErrors, name: "" })
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent ${
                      fieldErrors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Your name"
                  />
                  {fieldErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (fieldErrors.email) {
                        setFieldErrors({ ...fieldErrors, email: "" })
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent ${
                      fieldErrors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="you@company.com"
                  />
                  {fieldErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={formData.company}
                    onChange={(e) => {
                      setFormData({ ...formData, company: e.target.value })
                      if (fieldErrors.company) {
                        setFieldErrors({ ...fieldErrors, company: "" })
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#007AFF] focus:border-transparent ${
                      fieldErrors.company ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Your company name"
                  />
                  {fieldErrors.company && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.company}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
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
                    placeholder="Tell us about your needs..."
                  />
                  {fieldErrors.message && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.message}</p>
                  )}
                </div>

                {status === "success" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
                    <p className="font-medium">Success!</p>
                    <p className="text-sm mt-1">Thanks! We'll get back to you within 24 hours.</p>
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

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-light text-gray-900 mb-6">Other Ways to Reach Us</h2>

              <div className="space-y-6 mb-8">
                <a
                  href="https://cal.com/adamwolfe/cursive-ai-audit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-6 bg-[#F7F9FB] rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-[#007AFF] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg text-gray-900 mb-1">Book a Call</h3>
                    <p className="text-gray-600 text-sm">
                      Schedule a 15-minute intro call. We'll answer questions and show you a demo.
                    </p>
                    <span className="text-[#007AFF] text-sm mt-2 inline-block">
                      View available times →
                    </span>
                  </div>
                </a>

                <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-lg text-gray-900 mb-1">Email Us</h3>
                    <a href="mailto:hello@meetcursive.com" className="text-[#007AFF] hover:underline">
                      hello@meetcursive.com
                    </a>
                    <p className="text-gray-600 text-sm mt-1">We respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-lg text-gray-900 mb-1">Live Chat</h3>
                    <p className="text-gray-600 text-sm">
                      Available Monday-Friday, 9am-6pm EST
                    </p>
                    <button className="text-[#007AFF] text-sm mt-2 hover:underline">
                      Start chat →
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-lg text-gray-900 mb-1">Response Time</h3>
                    <p className="text-gray-600 text-sm">
                      Support inquiries: Within 24 hours<br />
                      Sales inquiries: Within 4 hours<br />
                      Emergency support: Same day
                    </p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-lg text-gray-900 mb-1">Headquarters</h3>
                    <p className="text-gray-600 text-sm">
                      San Francisco, CA<br />
                      United States
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  We're a remote-first company with team members across the US.
                </p>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Who We Help */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Who We
              <span className="block font-cursive text-4xl lg:text-5xl text-gray-500 mt-2">
                Help
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cursive works with B2B companies across industries who need better lead data, smarter outreach, and more qualified pipeline. Whether you are a startup scaling outbound for the first time or an enterprise team looking to replace outdated tools, we have a solution that fits.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Link href="/industries/b2b-software" className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all">
              <h3 className="text-lg text-gray-900 mb-2">B2B Software Companies</h3>
              <p className="text-gray-600 text-sm">Scale outbound, identify website visitors, and build multi-channel pipeline with AI-powered campaigns.</p>
            </Link>
            <Link href="/industries/agencies" className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all">
              <h3 className="text-lg text-gray-900 mb-2">Digital Agencies</h3>
              <p className="text-gray-600 text-sm">White-label our platform and offer data-driven lead generation as a service to your clients.</p>
            </Link>
            <Link href="/industries/financial-services" className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all">
              <h3 className="text-lg text-gray-900 mb-2">Financial Services</h3>
              <p className="text-gray-600 text-sm">Reach decision-makers with compliant, verified data and personalized outreach sequences.</p>
            </Link>
            <Link href="/industries/ecommerce" className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all">
              <h3 className="text-lg text-gray-900 mb-2">eCommerce Brands</h3>
              <p className="text-gray-600 text-sm">Identify anonymous visitors, retarget high-intent shoppers, and increase conversions with our pixel technology.</p>
            </Link>
            <Link href="/industries/home-services" className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all">
              <h3 className="text-lg text-gray-900 mb-2">Home Services</h3>
              <p className="text-gray-600 text-sm">Target homeowners by demographics, location, and purchase intent to fill your service calendar.</p>
            </Link>
            <Link href="/industries/education" className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200 hover:border-[#007AFF] hover:shadow-lg transition-all">
              <h3 className="text-lg text-gray-900 mb-2">Education</h3>
              <p className="text-gray-600 text-sm">Reach prospective students and corporate training buyers with targeted campaigns and verified contacts.</p>
            </Link>
          </div>
        </Container>
      </section>

      {/* What to Expect - Free Audit Process */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              What to
              <span className="block font-cursive text-4xl lg:text-5xl text-gray-500 mt-2">
                Expect
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every engagement starts with a free audit. Here is exactly what happens when you reach out to Cursive.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex gap-6 items-start bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-[#007AFF] rounded-full flex items-center justify-center flex-shrink-0 text-white font-light text-xl">1</div>
              <div>
                <h3 className="text-lg text-gray-900 mb-2">Submit Your Website URL</h3>
                <p className="text-gray-600 text-sm">Fill out our <Link href="/free-audit" className="text-[#007AFF] hover:underline">free audit form</Link> or reach out through any of our contact methods. All we need to get started is your website URL and work email address.</p>
              </div>
            </div>
            <div className="flex gap-6 items-start bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-[#007AFF] rounded-full flex items-center justify-center flex-shrink-0 text-white font-light text-xl">2</div>
              <div>
                <h3 className="text-lg text-gray-900 mb-2">We Analyze Your Traffic</h3>
                <p className="text-gray-600 text-sm">Within 24 to 48 hours, our team runs a comprehensive analysis of your website visitors. We identify companies, contacts, and intent signals from your recent traffic patterns.</p>
              </div>
            </div>
            <div className="flex gap-6 items-start bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-[#007AFF] rounded-full flex items-center justify-center flex-shrink-0 text-white font-light text-xl">3</div>
              <div>
                <h3 className="text-lg text-gray-900 mb-2">Receive Your Custom Report</h3>
                <p className="text-gray-600 text-sm">Get a detailed report showing your last 100 identified visitors, including company data, contact information, pages viewed, time spent, and AI-generated intent scores.</p>
              </div>
            </div>
            <div className="flex gap-6 items-start bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 bg-[#007AFF] rounded-full flex items-center justify-center flex-shrink-0 text-white font-light text-xl">4</div>
              <div>
                <h3 className="text-lg text-gray-900 mb-2">Strategy Call (30 Minutes)</h3>
                <p className="text-gray-600 text-sm">Schedule an optional 30-minute strategy call to walk through your results. We will discuss which visitors are most likely to convert, suggest outreach templates, and recommend the right <Link href="/pricing" className="text-[#007AFF] hover:underline">Cursive plan</Link> for your goals.</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Frequently Asked
              <span className="block font-cursive text-4xl lg:text-5xl text-gray-500 mt-2">
                Questions
              </span>
            </h2>
            <p className="text-xl text-gray-600">Everything you need to know about getting in touch</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200">
              <h3 className="text-gray-900 mb-2">How quickly will I hear back after contacting Cursive?</h3>
              <p className="text-gray-600 text-sm">
                Sales inquiries receive a response within 4 hours during business hours. General support questions are answered within 24 hours. For urgent matters, we offer same-day support. If you book a call through our scheduling link, you can typically get a slot within 1 to 2 business days.
              </p>
            </div>
            <div className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200">
              <h3 className="text-gray-900 mb-2">What is included in the free audit?</h3>
              <p className="text-gray-600 text-sm">
                The free audit includes identification of your last 100 website visitors with company names, job titles, verified work emails, pages they viewed, time spent on your site, AI-powered intent scores, and personalized outreach templates. It also includes an optional 30-minute strategy call to review the results. There is no credit card required and no obligation to purchase. <Link href="/free-audit" className="text-[#007AFF] hover:underline">Request your free audit here</Link>.
              </p>
            </div>
            <div className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200">
              <h3 className="text-gray-900 mb-2">How does the demo process work?</h3>
              <p className="text-gray-600 text-sm">
                When you book a demo, you will have a 15-minute intro call with one of our team members. We will ask about your current lead generation process, ideal customer profile, and growth goals. Then we will walk you through the Cursive platform live, showing you real-time data, campaign workflows, and reporting dashboards. After the demo, we will recommend a plan and provide a custom proposal. There is zero pressure to buy.
              </p>
            </div>
            <div className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200">
              <h3 className="text-gray-900 mb-2">Do you offer enterprise plans or custom solutions?</h3>
              <p className="text-gray-600 text-sm">
                Yes. For companies needing more than 10,000 leads per month, white-label solutions, custom API integrations, or dedicated account teams, we offer tailored enterprise packages. Enterprise pricing is based on volume, channels, and specific requirements. <Link href="/pricing" className="text-[#007AFF] hover:underline">View our standard pricing</Link> or contact us directly to discuss enterprise options.
              </p>
            </div>
            <div className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200">
              <h3 className="text-gray-900 mb-2">Can I switch plans or cancel after signing up?</h3>
              <p className="text-gray-600 text-sm">
                Absolutely. All Cursive plans are month-to-month with no long-term contracts. You can upgrade, downgrade, or cancel at any time with 30 days notice. Billing is pro-rated when you switch plans, and there are no cancellation penalties. Our Outbound plan also includes a 30-day money-back guarantee. We believe in earning your business every month.
              </p>
            </div>
            <div className="bg-[#F7F9FB] rounded-xl p-6 border border-gray-200">
              <h3 className="text-gray-900 mb-2">What information should I include when contacting Cursive?</h3>
              <p className="text-gray-600 text-sm">
                To help us respond as quickly and accurately as possible, include your company name, website URL, what you are looking for (data, outbound campaigns, full pipeline), your approximate monthly lead volume needs, and any specific questions you have. This allows us to prepare a tailored response and, if applicable, start your free audit right away.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Other Ways to Reach Us */}
      <section className="py-24 bg-[#F7F9FB]">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
              Additional
              <span className="block font-cursive text-4xl lg:text-5xl text-gray-500 mt-2">
                Contact Options
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
              <Mail className="w-10 h-10 text-[#007AFF] mx-auto mb-4" />
              <h3 className="text-gray-900 mb-2">General Inquiries</h3>
              <a href="mailto:hello@meetcursive.com" className="text-[#007AFF] hover:underline text-sm">hello@meetcursive.com</a>
              <p className="text-gray-600 text-sm mt-2">For questions about products, pricing, or partnerships.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
              <Calendar className="w-10 h-10 text-[#007AFF] mx-auto mb-4" />
              <h3 className="text-gray-900 mb-2">Book a Demo</h3>
              <a href="https://cal.com/adamwolfe/cursive-ai-audit" target="_blank" rel="noopener noreferrer" className="text-[#007AFF] hover:underline text-sm">Schedule on Cal.com</a>
              <p className="text-gray-600 text-sm mt-2">15-minute intro call with a live platform walkthrough.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
              <MessageCircle className="w-10 h-10 text-[#007AFF] mx-auto mb-4" />
              <h3 className="text-gray-900 mb-2">Sales Inquiries</h3>
              <a href="mailto:hello@meetcursive.com" className="text-[#007AFF] hover:underline text-sm">hello@meetcursive.com</a>
              <p className="text-gray-600 text-sm mt-2">For enterprise pricing, white-label, and custom solutions. Response within 4 hours.</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Dashboard CTA */}
      <DashboardCTA
        headline="Prefer to"
        subheadline="Talk Live?"
        description="Book a 15-minute call and we'll answer all your questions about Cursive."
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
          Get in touch with our team for sales inquiries, technical support, or partnership opportunities. Multiple contact methods available with fast response times.
        </p>
      </div>

      {/* Contact Methods */}
      <MachineSection title="Contact Methods">
        <MachineList items={[
          {
            label: "Book a Call",
            href: "https://cal.com/adamwolfe/cursive-ai-audit",
            description: "Schedule a 15-minute intro call. We'll answer questions and show you a demo."
          },
          {
            label: "Email",
            href: "mailto:hello@meetcursive.com",
            description: "Send us an email at hello@meetcursive.com. We respond within 24 hours."
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
          "Support inquiries: Within 24 hours",
          "Sales inquiries: Within 4 hours",
          "Emergency support: Same day"
        ]} />
      </MachineSection>

      {/* Company Information */}
      <MachineSection title="Company Information">
        <p className="text-gray-700 mb-4">
          Cursive is headquartered in San Francisco, CA, United States. We're a remote-first company with team members across the US.
        </p>
        <MachineList items={[
          {
            label: "Website",
            href: "https://meetcursive.com"
          },
          {
            label: "Platform Login",
            href: "https://leads.meetcursive.com"
          }
        ]} />
      </MachineSection>

      {/* Who We Help */}
      <MachineSection title="Who We Help">
        <p className="text-gray-700 mb-4">
          Cursive works with B2B companies across industries who need better lead data, smarter outreach, and more qualified pipeline. We serve companies ranging from early-stage startups to enterprise organizations.
        </p>
        <MachineList items={[
          {
            label: "B2B Software Companies",
            href: "https://meetcursive.com/industries/b2b-software",
            description: "Scale outbound, identify website visitors, and build multi-channel pipeline"
          },
          {
            label: "Digital Agencies",
            href: "https://meetcursive.com/industries/agencies",
            description: "White-label our platform to offer data-driven lead generation as a service"
          },
          {
            label: "Financial Services",
            href: "https://meetcursive.com/industries/financial-services",
            description: "Reach decision-makers with compliant, verified data and personalized outreach"
          },
          {
            label: "eCommerce Brands",
            href: "https://meetcursive.com/industries/ecommerce",
            description: "Identify anonymous visitors and retarget high-intent shoppers"
          },
          {
            label: "Home Services",
            href: "https://meetcursive.com/industries/home-services",
            description: "Target homeowners by demographics, location, and purchase intent"
          },
          {
            label: "Education",
            href: "https://meetcursive.com/industries/education",
            description: "Reach prospective students and corporate training buyers with targeted campaigns"
          }
        ]} />
      </MachineSection>

      {/* What to Expect */}
      <MachineSection title="What to Expect When You Contact Us">
        <p className="text-gray-700 mb-4">
          Every engagement starts with a free audit. Here is the process from first contact to results.
        </p>
        <div className="space-y-4">
          <div>
            <p className="text-gray-900 mb-2">Step 1: Submit Your Website URL</p>
            <p className="text-gray-600">Fill out the free audit form or reach out through any contact method. All we need is your website URL and work email.</p>
          </div>
          <div>
            <p className="text-gray-900 mb-2">Step 2: We Analyze Your Traffic (24-48 hours)</p>
            <p className="text-gray-600">Our team runs a comprehensive analysis of your website visitors, identifying companies, contacts, and intent signals.</p>
          </div>
          <div>
            <p className="text-gray-900 mb-2">Step 3: Receive Your Custom Report</p>
            <p className="text-gray-600">Get a detailed report with your last 100 identified visitors including company data, contact info, pages viewed, time spent, and AI intent scores.</p>
          </div>
          <div>
            <p className="text-gray-900 mb-2">Step 4: Optional 30-Minute Strategy Call</p>
            <p className="text-gray-600">Walk through your results, discuss which visitors are most likely to convert, and receive outreach templates and plan recommendations.</p>
          </div>
        </div>
      </MachineSection>

      {/* Frequently Asked Questions */}
      <MachineSection title="Frequently Asked Questions About Contacting Cursive">
        <div className="space-y-4">
          <div>
            <p className="text-gray-900 mb-2">How quickly will I hear back after contacting Cursive?</p>
            <p className="text-gray-600">Sales inquiries receive a response within 4 hours during business hours. General support questions are answered within 24 hours. Urgent matters receive same-day support.</p>
          </div>
          <div>
            <p className="text-gray-900 mb-2">What is included in the free audit?</p>
            <p className="text-gray-600">Identification of your last 100 website visitors with company names, job titles, verified work emails, pages viewed, time spent, AI intent scores, and personalized outreach templates. Also includes an optional 30-minute strategy call. No credit card required.</p>
          </div>
          <div>
            <p className="text-gray-900 mb-2">How does the demo process work?</p>
            <p className="text-gray-600">Book a 15-minute intro call. We ask about your current lead generation process, ICP, and goals. Then we walk through the platform live showing real-time data, campaign workflows, and reporting dashboards. After the demo, we recommend a plan and provide a custom proposal with zero pressure.</p>
          </div>
          <div>
            <p className="text-gray-900 mb-2">Do you offer enterprise plans or custom solutions?</p>
            <p className="text-gray-600">Yes. For companies needing 10,000+ leads per month, white-label solutions, custom API integrations, or dedicated account teams, we offer tailored enterprise packages based on volume, channels, and specific requirements.</p>
          </div>
          <div>
            <p className="text-gray-900 mb-2">Can I switch plans or cancel after signing up?</p>
            <p className="text-gray-600">All plans are month-to-month with no long-term contracts. Upgrade, downgrade, or cancel anytime with 30 days notice. Billing is pro-rated with no cancellation penalties. Outbound plan includes a 30-day money-back guarantee.</p>
          </div>
          <div>
            <p className="text-gray-900 mb-2">What information should I include when contacting Cursive?</p>
            <p className="text-gray-600">Include your company name, website URL, what you are looking for (data, outbound campaigns, full pipeline), approximate monthly lead volume needs, and any specific questions. This helps us prepare a tailored response and start your free audit immediately.</p>
          </div>
        </div>
      </MachineSection>

      {/* Common Questions */}
      <MachineSection title="Quick Answers">
        <div className="space-y-4">
          <div>
            <p className="text-gray-900 mb-2">How fast can we start?</p>
            <p className="text-gray-600">Cursive Data: 5-7 days. Outbound: 1-2 weeks. Pipeline: 2-3 weeks.</p>
          </div>
          <div>
            <p className="text-gray-900 mb-2">Can I cancel anytime?</p>
            <p className="text-gray-600">Yes. All plans are month-to-month with 30 days notice.</p>
          </div>
          <div>
            <p className="text-gray-900 mb-2">Do you offer custom plans?</p>
            <p className="text-gray-600">Absolutely. We build custom solutions for enterprise needs.</p>
          </div>
        </div>
      </MachineSection>

      {/* Additional Contact Options */}
      <MachineSection title="Other Ways to Reach Us">
        <MachineList items={[
          {
            label: "General Inquiries",
            href: "mailto:hello@meetcursive.com",
            description: "hello@meetcursive.com - For questions about products, pricing, or partnerships"
          },
          {
            label: "Book a Demo",
            href: "https://cal.com/adamwolfe/cursive-ai-audit",
            description: "15-minute intro call with a live platform walkthrough"
          },
          {
            label: "Sales Inquiries",
            href: "mailto:hello@meetcursive.com",
            description: "hello@meetcursive.com - Enterprise pricing, white-label, and custom solutions. Response within 4 hours."
          }
        ]} />
      </MachineSection>

      {/* Additional Resources */}
      <MachineSection title="Additional Resources">
        <MachineList items={[
          {
            label: "FAQ Page",
            href: "https://meetcursive.com/faq",
            description: "Comprehensive answers to common questions"
          },
          {
            label: "Pricing",
            href: "https://meetcursive.com/pricing",
            description: "View pricing tiers and plans"
          },
          {
            label: "Platform Overview",
            href: "https://meetcursive.com/platform",
            description: "Explore platform features and capabilities"
          },
          {
            label: "Free Audit",
            href: "https://meetcursive.com/free-audit",
            description: "Request a free analysis of your last 100 website visitors"
          },
          {
            label: "Case Studies",
            href: "https://meetcursive.com/case-studies",
            description: "See real results from Cursive clients"
          }
        ]} />
      </MachineSection>

    </MachineContent>
  </MachineView>
</>
  )
}
