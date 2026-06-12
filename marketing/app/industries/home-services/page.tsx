"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  MapPin, Crosshair, Home, Send, CalendarClock, BarChart3,
  ArrowRight, type LucideIcon,
} from "lucide-react"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBreadcrumbSchema } from "@/lib/seo/structured-data"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
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

const benefits: Array<{ icon: LucideIcon; title: string; body: string }> = [
  { icon: Home, title: "Homeowner targeting", body: "Reach verified homeowners in your service area with demographic and property data." },
  { icon: MapPin, title: "Service-area filtering", body: "Target prospects by ZIP code, radius, or custom territories so no budget leaves your map." },
  { icon: Crosshair, title: "High-intent audiences", body: "Identify homeowners actively researching HVAC, roofing, plumbing, and remodeling." },
  { icon: Send, title: "Multi-channel outreach", body: "Export verified contacts to email, ads, and direct mail to reach homeowners where they are." },
  { icon: CalendarClock, title: "Seasonal timing", body: "Build a fresh audience each week, so demand spikes for tune-ups or storm repair land in your queue." },
  { icon: BarChart3, title: "ROI you can track", body: "Tie every identified visitor and contact to the job it became and measure cost per booked call." },
]

const resources = [
  { title: "How to Identify Website Visitors: Technical Guide", description: "Identify homeowners visiting your HVAC, plumbing, or roofing site.", href: "/blog/how-to-identify-website-visitors-technical-guide" },
  { title: "Guide to Direct Mail Marketing Automation", description: "Send automated direct mail to homeowners in your service area.", href: "/blog/direct-mail" },
  { title: "Omni-Channel Retargeting Strategies", description: "Coordinate campaigns across email, direct mail, and digital ads.", href: "/blog/retargeting" },
  { title: "How to Scale Outbound Without Killing Quality", description: "Build scalable marketing systems for seasonal home services.", href: "/blog/scaling-outbound" },
  { title: "Tips for Improving CRM Integration Workflows", description: "Integrate leads directly into your service scheduling CRM.", href: "/blog/crm-integration" },
  { title: "How Marketing Data Solutions Improve Campaigns", description: "Target high-intent homeowners with data-driven campaigns.", href: "/blog/analytics" },
]

export default function HomeServicesPage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.meetcursive.com' },
        { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
        { name: 'Home Services', url: 'https://www.meetcursive.com/industries/home-services' },
      ])} />

      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", href: "/" },
              { name: "Industries", href: "/industries" },
              { name: "Home Services", href: "/industries/home-services" },
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
                  Industry Solutions
                </span>
                <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                  Home Services
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    marketing solutions
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  Lead generation for contractors, HVAC, plumbing, landscaping, and home improvement
                  companies. Identify high-intent homeowners in your service area and reach them while they&apos;re ready to book.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Button size="lg" href={GET_LEADS_URL} target="_blank" rel="noopener noreferrer">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                    Book a Call
                  </Button>
                </div>
              </motion.div>
            </Container>
          </section>

          {/* Why Cursive — benefits */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="Why Home Services Teams"
                script="Choose Cursive"
                sub="Turn anonymous site traffic and in-market homeowners into booked jobs."
              />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {benefits.map((b, i) => (
                  <motion.div
                    key={b.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                    className="rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                  >
                    <IconChip Icon={b.icon} />
                    <h3 className="mt-5 text-lg font-medium text-gray-900">{b.title}</h3>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{b.body}</p>
                  </motion.div>
                ))}
              </div>
            </Container>
          </section>

          {/* Industry Insights */}
          <section className="py-20 sm:py-24 bg-white">
            <Container>
              <SectionHeading
                plain="Resources &"
                script="Insights"
                sub="Strategies and best practices for home services marketing."
              />
              <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {resources.map((resource, i) => (
                  <motion.a
                    key={resource.href}
                    href={resource.href}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                    className="block rounded-2xl border border-gray-200 p-6 sm:p-7 hover:shadow-lg hover:border-primary transition-all group"
                  >
                    <h3 className="text-base font-medium text-gray-900 group-hover:text-primary transition-colors">
                      {resource.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{resource.description}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                      Read article
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </motion.a>
                ))}
              </div>
            </Container>
          </section>

          {/* Final CTA */}
          <section className="py-20 sm:py-28 bg-[#F7F9FB]">
            <Container>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: EASE }}
                className="text-center max-w-2xl mx-auto"
              >
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-900">
                  Ready to fill your
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                    service calendar?
                  </span>
                </h2>
                <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                  Identify homeowners with high purchase intent for HVAC, roofing, and home improvement.
                  Plans from $97/mo, month-to-month, cancel anytime.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <Button size="lg" href={GET_LEADS_URL} target="_blank" rel="noopener noreferrer">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                    Book a Call
                  </Button>
                </div>
              </motion.div>
            </Container>
          </section>
        </main>
      </HumanView>

      {/* Machine View - AEO-Optimized */}
      <MachineView>
        <MachineContent>
          {/* Header */}
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE FOR HOME SERVICES</h1>
            <p className="text-gray-700 leading-relaxed">
              Lead generation platform for contractors, HVAC, plumbing, roofing, landscaping, and home improvement companies. Identify high-intent homeowners in your service area with verified contact data. Self-serve from $97/month.
            </p>
          </div>

          {/* Home Services Solutions */}
          <MachineSection title="Solutions for Home Services">
            <MachineList items={[
              {
                label: "Homeowner Targeting",
                description: "Reach verified homeowners in your service area with demographic and property data"
              },
              {
                label: "Service Area Filtering",
                description: "Target prospects by ZIP code, radius, or custom service territories"
              },
              {
                label: "High-Intent Audiences",
                description: "Identify homeowners actively researching HVAC, roofing, plumbing, remodeling"
              },
              {
                label: "Multi-Channel Outreach",
                description: "Export verified contacts to email, ads, and direct mail to reach homeowners in target neighborhoods"
              }
            ]} />
          </MachineSection>

          {/* Benefits */}
          <MachineSection title="Benefits">
            <MachineList items={[
              "Fill Your Service Calendar: Generate consistent leads to keep your crew booked with high-value jobs year-round",
              "Target High-Intent Homeowners: Identify homeowners actively researching HVAC, roofing, plumbing, and remodeling",
              "Seasonal Timing: Build a fresh weekly audience that matches demand spikes for tune-ups and storm repair",
              "ROI Tracking: Track leads from first contact to completed job and measure cost per booked call",
            ]} />
          </MachineSection>

          {/* Use Cases */}
          <MachineSection title="Common Use Cases">
            <MachineList items={[
              "HVAC repair and installation lead generation",
              "Roofing inspection and replacement campaigns",
              "Plumbing service lead generation",
              "Landscaping and lawn care customer acquisition",
              "Home remodeling and renovation leads",
              "Window and door replacement campaigns"
            ]} />
          </MachineSection>

          {/* Pricing */}
          <MachineSection title="Pricing">
            <p className="text-gray-700 mb-4">
              Self-serve, month-to-month, no setup fee. Cancel anytime.
            </p>
            <MachineList items={[
              "Visitor Pixel ($97/month) - Identify the companies and people visiting your site",
              "Custom Audience ($197/month) - A fresh weekly list of in-market buyers, delivered to Google Sheets",
              "Pixel + Audience Bundle ($247/month) - Both, in one feed",
            ]} />
          </MachineSection>

          {/* Getting Started */}
          <MachineSection title="Get Started">
            <MachineList items={[
              {
                label: "Get Started",
                href: "https://leads.meetcursive.com/get-leads",
                description: "Pick a plan and you are live in minutes"
              },
              {
                label: "Book a Call",
                href: "https://cal.com/cursiveteam/30min",
                description: "Discuss service area and lead generation needs before you buy"
              }
            ]} />
          </MachineSection>

        </MachineContent>
      </MachineView>
    </>
  )
}
