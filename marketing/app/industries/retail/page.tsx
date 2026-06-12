"use client"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/ui/container"
import { motion } from "framer-motion"
import {
  MapPin, ShoppingBag, Crosshair, Layers, Award, BarChart3,
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
  { icon: MapPin, title: "Geo-targeting by store", body: "Reach consumers within a set radius of each location to drive real foot traffic, not generic impressions." },
  { icon: ShoppingBag, title: "Shopper intent data", body: "Identify people actively shopping your category across online and offline channels, the moment intent is live." },
  { icon: Crosshair, title: "Competitive conquesting", body: "Win customers from competing retailers with personalized offers built from their shopping signals." },
  { icon: Award, title: "Loyalty enrichment", body: "Layer demographics, interests, and purchase behaviors onto your loyalty data for sharper segments." },
  { icon: Layers, title: "Multi-location campaigns", body: "Run location-specific targeting and reporting across every store from a single feed." },
  { icon: BarChart3, title: "In-store attribution", body: "Tie online marketing to in-store visits and purchases so you can prove what actually moves revenue." },
]

const resources = [
  { title: "How to Identify Website Visitors: Technical Guide", description: "Identify online shoppers and drive them to your retail locations.", href: "/blog/how-to-identify-website-visitors-technical-guide" },
  { title: "Guide to Direct Mail Marketing Automation", description: "Send automated direct mail to drive local foot traffic to stores.", href: "/blog/direct-mail" },
  { title: "Omni-Channel Retargeting Strategies", description: "Coordinate campaigns across online and in-store channels.", href: "/blog/retargeting" },
  { title: "B2B Audience Targeting Explained", description: "Target B2B buyers for wholesale and bulk retail orders.", href: "/blog/audience-targeting" },
  { title: "Tips for Improving CRM Integration Workflows", description: "Integrate online and in-store customer data for better insights.", href: "/blog/crm-integration" },
  { title: "How Marketing Data Solutions Improve Campaigns", description: "Leverage customer data to drive more in-store and online sales.", href: "/blog/analytics" },
]

export default function RetailPage() {
  return (
    <>
      <StructuredData data={generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.meetcursive.com' },
        { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
        { name: 'Retail', url: 'https://www.meetcursive.com/industries/retail' },
      ])} />

      {/* Human View */}
      <HumanView>
        <main className="overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs items={[
              { name: "Home", href: "/" },
              { name: "Industries", href: "/industries" },
              { name: "Retail", href: "/industries/retail" },
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
                  Retail marketing
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                    that drives real traffic
                  </span>
                </h1>
                <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                  Drive foot traffic and online sales with location-based targeting and consumer
                  intent data. Identify local shoppers and reach them while they&apos;re in-market.
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

          {/* Why Cursive for Retail */}
          <section className="py-20 sm:py-24 bg-[#F7F9FB]">
            <Container>
              <SectionHeading
                plain="Why Choose Cursive"
                script="for Retail"
                sub="From the sidewalk to the cart, reach the shoppers most likely to buy."
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
                plain="Retail Resources"
                script="& Insights"
                sub="Strategies and best practices for retail marketing."
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
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                      Read article
                      <ArrowRight className="h-4 w-4" />
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
                  Ready to drive more
                  <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                    store traffic?
                  </span>
                </h2>
                <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                  Identify local shoppers and drive them to your stores with targeted omnichannel
                  campaigns. Plans from $97/mo, month-to-month, cancel anytime.
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
            <h1 className="text-2xl text-gray-900 font-bold mb-4">CURSIVE FOR RETAIL</h1>
            <p className="text-gray-700 leading-relaxed">
              Customer acquisition data for retail stores. Drive foot traffic and online sales with
              location-based targeting, shopper intent data, and omnichannel campaigns. Self-serve
              from $97/month.
            </p>
          </div>

          {/* Retail Solutions */}
          <MachineSection title="Solutions for Retail">
            <MachineList items={[
              {
                label: "Geo-Targeting by Store Location",
                description: "Target consumers within a specific radius of your store locations to drive foot traffic"
              },
              {
                label: "Shopper Intent Data",
                description: "Identify consumers actively shopping for products in your category"
              },
              {
                label: "Competitive Conquesting",
                description: "Target customers of competing retailers with personalized offers"
              },
              {
                label: "Multi-Location Campaigns",
                description: "Manage campaigns across multiple stores with location-specific targeting"
              }
            ]} />
          </MachineSection>

          {/* Benefits */}
          <MachineSection title="Benefits">
            <MachineList items={[
              "Drive Store Traffic: Identify local shoppers and drive them to your stores with targeted omnichannel campaigns",
              "In-Store Attribution: Track online marketing to in-store visits and purchases with mobile location data",
              "Loyalty Program Enrichment: Enhance loyalty program data with additional demographics, interests, and purchase behaviors",
              "Omnichannel Coordination: Coordinate campaigns across online and in-store channels for a consistent customer experience",
            ]} />
          </MachineSection>

          {/* Use Cases */}
          <MachineSection title="Common Use Cases">
            <MachineList items={[
              "Local store marketing and foot traffic campaigns",
              "Grand opening and promotional event marketing",
              "Competitive customer conquest campaigns",
              "Loyalty program member acquisition",
              "Online-to-offline attribution tracking",
              "Multi-location retail chain marketing"
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
              { label: "Get Started", href: "https://leads.meetcursive.com/get-leads", description: "Pick a plan and you are live in minutes" },
              { label: "Pricing", href: "https://www.meetcursive.com/pricing", description: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo" },
              { label: "Book a Call", href: "https://cal.com/cursiveteam/30min", description: "Talk to the team before you buy" },
            ]} />
          </MachineSection>

        </MachineContent>
      </MachineView>
    </>
  )
}
