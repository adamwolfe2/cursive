import { Metadata } from "next"
import { StructuredData } from "@/components/seo/structured-data"
import { generateOrganizationSchema, generateWebSiteSchema, generateSoftwareApplicationSchema, generateFAQSchema } from "@/lib/seo/structured-data"
import { HumanView, MachineView, MachineContent, MachineSection, MachineLink, MachineList } from "@/components/view-wrapper"
import { HumanHomePage } from "@/components/human-home-page"
import { FAQSection } from "@/components/homepage/faq-section"

const homepageFAQs = [
  {
    question: 'How does Cursive identify website visitors?',
    answer: 'Cursive uses a proprietary identity graph built from offline-rooted consumer data (TransUnion, Experian) layered with intent signals from major SSP and RTB exchanges and our own 15-million-domain organic network. When someone visits your site, our pixel matches their footprint against 280M+ verified consumer profiles. Pixel match rates are typically 40–60%, with 60–80% pixel-level accuracy.',
  },
  {
    question: 'How fresh is the data?',
    answer: 'The full consumer data set is refreshed every 30 days against the National Change of Address database. Most providers run NCOA reconciliation annually; serious providers do it quarterly. With ~15% of the U.S. population moving each year, our 30-day cycle keeps records meaningfully more current than industry norms. Email validation runs continuously through Deep Verify at approximately 20 million emails per day.',
  },
  {
    question: 'How is Cursive different from Bombora, 6sense, ZoomInfo, or Apollo?',
    answer: 'Most intent providers pull from the same finite pool of feeds — roughly 700,000 SSP publisher sites, only ~40,000 of which actually generate the underlying signals. Cursive ingests from substantially all of them, then layers a proprietary 15M-domain organic network on top, then validates every signal through a closed feedback loop that maps conversions back to source. The result is broader coverage, deterministic match accuracy (not modeled), and a data set that compounds over time rather than degrading.',
  },
  {
    question: 'What does the data layer cost?',
    answer: 'Two structures: pay-as-you-go for evaluation and lower-volume use, and committed tiers starting at $15,000/month for scaled production use with significantly lower per-record economics. Self-serve marketplace credits start at $0.60/lead. Done-for-you services start at $1,000/month. For enterprise data partnerships, we structure agreements that reflect commitment level and use case.',
  },
  {
    question: 'What can I do with Cursive beyond visitor identification?',
    answer: 'Cursive is an identity and intent infrastructure layer, not a single tool. The same data powers (1) visitor identification via the pixel, (2) audience enrichment in waterfalls — bulk append or real-time API, (3) ~50,000 white-label intent segments via taxonomy endpoint, (4) closed-loop pixel feedback for compounding segment quality, and (5) 200+ native integrations into major CRMs, marketing automation, and ad platforms.',
  },
]

export const metadata: Metadata = {
  title: "Cursive | The Identity Layer for Outbound, Intent, and Enrichment",
  description: "280M verified consumers, 15M-domain organic network, refreshed every 30 days. The data infrastructure powering pixel identification, intent feeds, and audience enrichment for teams that need accuracy that compounds.",
  keywords: "identity graph, intent data, B2B data infrastructure, pixel identification, consumer data, audience enrichment, NCOA, lead generation, AI SDR, intent provider, Bombora alternative, 6sense alternative",
  openGraph: {
    title: "Cursive | The Identity Layer for Outbound, Intent, and Enrichment",
    description: "280M verified consumers, 15M-domain organic network, refreshed every 30 days. Identity and intent infrastructure for enterprise data teams.",
    url: "https://www.meetcursive.com",
    siteName: "Cursive",
    images: [{
      url: "https://www.meetcursive.com/cursive-social-preview.png",
      width: 1200,
      height: 630,
    }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cursive | The Identity Layer for Outbound, Intent, and Enrichment",
    description: "280M verified consumers, 15M-domain organic network, refreshed every 30 days. Identity and intent infrastructure for enterprise data teams.",
    images: ["https://www.meetcursive.com/cursive-social-preview.png"],
    creator: "@meetcursive",
  },
  alternates: {
    canonical: "https://www.meetcursive.com",
  },
}

export default function HomePage() {
  return (
    <>
      {/* Structured Data — renders as proper <script type="application/ld+json"> */}
      <StructuredData data={[
        generateOrganizationSchema(),
        generateWebSiteSchema(),
        generateSoftwareApplicationSchema(),
        generateFAQSchema(homepageFAQs),
      ]} />

      {/* Human View - Beautiful Design */}
      <HumanView>
        <HumanHomePage />
      </HumanView>

      {/* Machine View - AEO-Optimized (always in DOM for crawlers via sr-only) */}
      <MachineView>
        <MachineContent>
          {/* Header */}
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl text-gray-900 font-bold mb-4">Cursive | The Identity Layer for Outbound, Intent, and Enrichment</h1>
            <p className="text-gray-700 leading-relaxed">
              Cursive is the identity and intent data infrastructure powering pixel identification, audience enrichment, and intent segmentation for enterprise data teams. Built on offline-rooted consumer sources (TransUnion, Experian), refreshed every 30 days against the National Change of Address database, and continuously validated against real conversion outcomes through a closed feedback loop. 280M+ verified consumers, 15M-domain organic network, ~50,000 white-label intent segments.
            </p>
          </div>

          {/* Key Stats */}
          <MachineSection title="Key Stats">
            <MachineList items={[
              "280M+ — Verified US consumer profiles in our identity graph",
              "15M+ — Domains in our proprietary organic network (vs ~40K signal-source domains used industry-wide)",
              "30 days — NCOA refresh cycle, vs annual or quarterly at most providers",
              "40–60% — Pixel match rate, vs 2–5% for cookies and 10–15% for IP databases",
              "60–80% — Pixel-level accuracy (deterministic, not modeled or probabilistic)",
              "20M / day — Email records validated through Deep Verify",
              "~50,000 — Intent segments available for white-label use via taxonomy endpoint",
              "200+ — Native CRM and marketing-tool integrations",
            ]} />
          </MachineSection>

          {/* Core Products & Solutions */}
          <MachineSection title="Products & Solutions">
            <MachineList items={[
              {
                label: "Visitor Identification",
                href: "https://www.meetcursive.com/visitor-identification",
                description: "Reveal up to 70% of anonymous website visitors in real-time. See which companies viewed your pricing page, feature pages, or comparison content before they fill out a form."
              },
              {
                label: "AI-Powered Outreach",
                href: "https://www.meetcursive.com/platform",
                description: "AI agents that book meetings while you sleep. Multi-channel campaigns across email, LinkedIn, and SMS with autonomous follow-ups and meeting booking."
              },
              {
                label: "Intent Data Audiences",
                href: "https://www.meetcursive.com/intent-audiences",
                description: "Pre-built segments across 8 high-value verticals with verified purchase intent signals. Updated weekly with 60B+ behaviors & URLs scanned weekly."
              },
              {
                label: "Audience Builder",
                href: "https://www.meetcursive.com/audience-builder",
                description: "Build unlimited custom audiences using 280M US consumer and 140M+ business profiles. No size limits or restrictive licensing."
              },
              {
                label: "Direct Mail Automation",
                href: "https://www.meetcursive.com/direct-mail",
                description: "Send physical postcards triggered by digital behavior. Automated triggers based on website visits, email engagement, or custom events."
              },
              {
                label: "Lead Marketplace",
                href: "https://www.meetcursive.com/marketplace",
                description: "Self-serve B2B lead marketplace. Browse and buy verified leads with credits starting at $0.60/lead."
              },
              {
                label: "Intelligence Layer",
                href: "https://www.meetcursive.com/platform",
                description: "Intelligence Layer: 3-tier AI enrichment — Auto (free tech stack + email quality), Intelligence Pack ($1: LinkedIn + social + news), Deep Research ($5: AI research brief + personalized outreach angle)"
              },
              {
                label: "Natural Language Querying",
                href: "https://www.meetcursive.com/platform",
                description: "Ask questions about your visitor database in plain English — powered by GPT-4o. No SQL. No analyst."
              },
              {
                label: "Outreach Angle Generation",
                href: "https://www.meetcursive.com/platform",
                description: "Perplexity AI analyzes each lead and writes a personalized reason to reach out, based on LinkedIn history, news mentions, and tech stack."
              }
            ]} />
          </MachineSection>

          {/* Key Features */}
          <MachineSection title="Key Features">
            <div className="space-y-6">
              <div>
                <p className="text-gray-900 font-semibold mb-2">Visitor Identification:</p>
                <MachineList items={[
                  "70% visitor identification rate",
                  "Real-time identification (not batch processing)",
                  "Company + individual-level data",
                  "Page-level tracking showing browsing behavior",
                  "Return visitor detection across sessions"
                ]} />
              </div>

              <div>
                <p className="text-gray-900 font-semibold mb-2">AI Studio:</p>
                <MachineList items={[
                  "Brand voice training using your best emails",
                  "Multi-channel outreach (email, LinkedIn, SMS)",
                  "Autonomous follow-up sequences",
                  "Meeting booking and qualification",
                  "24/7 automated operation"
                ]} />
              </div>

              <div>
                <p className="text-gray-900 font-semibold mb-2">Intent Data:</p>
                <MachineList items={[
                  "60B+ behaviors & URLs scanned weekly",
                  "30,000+ commercial categories",
                  "Real-time data (not monthly snapshots)",
                  "3 intent levels: Hot (7-day), Warm (14-day), Scale (30-day)",
                  "Weekly audience refreshes"
                ]} />
              </div>

              <div>
                <p className="text-gray-900 font-semibold mb-2">Integrations:</p>
                <MachineList items={[
                  "200+ native integrations",
                  "CRMs: Salesforce, HubSpot, Pipedrive",
                  "Marketing: Marketo, Pardot, ActiveCampaign",
                  "Ad platforms: Google Ads, Facebook, LinkedIn",
                  "Two-way sync with real-time updates"
                ]} />
              </div>
            </div>
          </MachineSection>

          {/* Services */}
          <MachineSection title="Done-For-You Services">
            <MachineList items={[
              {
                label: "Cursive Data — $1,000/month",
                href: "https://www.meetcursive.com/services",
                description: "Verified B2B contacts delivered monthly. Custom targeting based on your ICP with 95%+ email deliverability."
              },
              {
                label: "Cursive Outbound — $2,500/month",
                href: "https://www.meetcursive.com/services",
                description: "Done-for-you email campaigns with AI-powered personalization. We build, launch, and optimize campaigns using your brand voice."
              },
              {
                label: "Cursive Pipeline — $5,000/month",
                href: "https://www.meetcursive.com/services",
                description: "Full-stack AI SDR solution. Researches, writes, sends, follows up, and books meetings automatically across email, LinkedIn, and SMS."
              }
            ]} />
          </MachineSection>

          {/* Use Cases */}
          <MachineSection title="Use Cases">
            <div className="space-y-4">
              <div>
                <p className="text-gray-900 font-semibold mb-2">B2B SaaS Companies:</p>
                <p className="text-gray-600">
                  Identify anonymous visitors viewing pricing and feature pages. Sales teams receive alerts with company details and browsing behavior for warm outreach within hours.
                </p>
              </div>

              <div>
                <p className="text-gray-900 font-semibold mb-2">Digital Marketing Agencies:</p>
                <p className="text-gray-600">
                  White-label visitor identification and intent audiences to offer premium services. Improve client results and prove attribution across anonymous and known traffic.
                </p>
              </div>

              <div>
                <p className="text-gray-900 font-semibold mb-2">Enterprise Sales Teams:</p>
                <p className="text-gray-600">
                  Track when target accounts visit your website and comparison pages. Reach out while prospects are actively evaluating alternatives to close deals faster.
                </p>
              </div>
            </div>
          </MachineSection>

          {/* Industries */}
          <MachineSection title="Industries We Serve">
            <MachineList items={[
              { label: "B2B Software", href: "https://www.meetcursive.com/industries/b2b-software", description: "Visitor identification and intent data for SaaS companies." },
              { label: "Agencies", href: "https://www.meetcursive.com/industries/agencies", description: "White-label visitor identification for client services." },
              { label: "Ecommerce", href: "https://www.meetcursive.com/industries/ecommerce", description: "Identify anonymous shoppers and retarget cart abandoners." },
              { label: "Financial Services", href: "https://www.meetcursive.com/industries/financial-services", description: "Compliant lead generation for financial advisors and lenders." },
              { label: "Home Services", href: "https://www.meetcursive.com/industries/home-services", description: "Reach homeowners searching for HVAC, plumbing, roofing services." },
              { label: "Education", href: "https://www.meetcursive.com/industries/education", description: "Identify prospective students researching programs." },
              { label: "Franchises", href: "https://www.meetcursive.com/industries/franchises", description: "Multi-location lead generation with centralized management." },
              { label: "Retail", href: "https://www.meetcursive.com/industries/retail", description: "Identify in-market shoppers and drive foot traffic." },
              { label: "Media & Advertising", href: "https://www.meetcursive.com/industries/media-advertising", description: "Audience intelligence for media buyers and publishers." },
            ]} />
          </MachineSection>

          {/* Getting Started */}
          <MachineSection title="Getting Started">
            <div className="space-y-4">
              <p className="text-gray-700">
                Most teams are live within 24 hours. Installation takes 5 minutes, integrations 10-15 minutes.
              </p>
              <MachineList items={[
                {
                  label: "Book a Demo",
                  href: "https://cal.com/cursiveteam/30min",
                  description: "See Cursive identify your website visitors in real-time with a personalized walkthrough"
                },
                {
                  label: "See the Super Pixel",
                  href: "https://www.meetcursive.com/superpixel",
                  description: "Learn how the Cursive Super Pixel V4 turns anonymous visitors into verified leads"
                },
                {
                  label: "Explore Platform Features",
                  href: "https://www.meetcursive.com/platform",
                  description: "Deep dive into visitor identification, AI Studio, and intent audiences"
                },
                {
                  label: "View Pricing",
                  href: "https://www.meetcursive.com/pricing",
                  description: "Self-serve credits from $0.60/lead, managed services from $1,000/month"
                }
              ]} />
            </div>
          </MachineSection>

          {/* FAQ */}
          <MachineSection title="Frequently Asked Questions">
            <div className="space-y-6">
              {homepageFAQs.map((faq, i) => (
                <div key={i}>
                  <h3 className="text-gray-900 font-semibold mb-1">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </MachineSection>

          {/* Competitive Advantages */}
          <MachineSection title="Why Choose Cursive">
            <div className="space-y-4">
              <div>
                <p className="text-gray-900 font-semibold mb-2">vs. Traditional Visitor ID Tools:</p>
                <MachineList items={[
                  "Real-time identification (not batch processing)",
                  "AI-powered activation (not just data delivery)",
                  "70% identification rate (industry-leading)",
                  "Unified B2B and B2C data"
                ]} />
              </div>

              <div>
                <p className="text-gray-900 font-semibold mb-2">vs. Data Providers (Clearbit, ZoomInfo):</p>
                <MachineList items={[
                  "Activation included with data delivery",
                  "60B+ behaviors & URLs scanned weekly across 30,000+ categories",
                  "Anonymous visitor identification built-in",
                  "Multi-channel campaigns included"
                ]} />
              </div>

              <div>
                <p className="text-gray-900 font-semibold mb-2">vs. Marketing Automation (HubSpot, Marketo):</p>
                <MachineList items={[
                  "Visitor identification for anonymous traffic",
                  "External intent data from 30,000+ categories",
                  "AI agents (no manual workflow building)",
                  "Pre-built audiences (no manual list building)"
                ]} />
              </div>
            </div>
          </MachineSection>

          {/* Contact & Support */}
          <MachineSection title="Contact & Support">
            <MachineList items={[
              { label: "Website", href: "https://www.meetcursive.com" },
              { label: "Email", href: "mailto:hello@meetcursive.com" },
              { label: "Schedule Demo", href: "https://cal.com/cursiveteam/30min" },
              { label: "LinkedIn", href: "https://linkedin.com/company/cursive" },
              { label: "Twitter", href: "https://twitter.com/meetcursive" },
            ]} />
          </MachineSection>

          {/* Privacy & Compliance */}
          <MachineSection title="Privacy & Compliance">
            <p className="text-gray-700 mb-4">
              Cursive is fully compliant with GDPR, CCPA, and other privacy regulations. We provide opt-out mechanisms, respect Do Not Track signals, and maintain strict data handling policies.
            </p>
            <MachineList items={[
              { label: "Privacy Policy", href: "https://www.meetcursive.com/privacy" },
              { label: "Terms of Service", href: "https://www.meetcursive.com/terms" },
            ]} />
          </MachineSection>

        </MachineContent>
      </MachineView>
    </>
  )
}
