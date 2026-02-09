import { Metadata } from "next"
import { StructuredData } from "@/components/seo/structured-data"
import { generateOrganizationSchema, generateWebSiteSchema, generateSoftwareApplicationSchema, generateFAQSchema } from "@/lib/seo/structured-data"
import { HumanView, MachineView, MachineContent, MachineSection, MachineLink, MachineList } from "@/components/view-wrapper"
import { HumanHomePage } from "@/components/human-home-page"
import { FAQSection } from "@/components/homepage/faq-section"

const homepageFAQs = [
  {
    question: 'How does visitor identification work?',
    answer: 'Cursive uses advanced IP intelligence, device fingerprinting, and behavioral analysis to identify up to 70% of your anonymous website visitors in real-time. When someone visits your site, we instantly match their digital footprint against our database of 220M+ consumer and 140M+ business profiles.',
  },
  {
    question: 'How accurate is the data?',
    answer: 'Cursive maintains a 70% identification rate for B2B traffic with 95%+ accuracy on matched records. Our data is verified and updated in real-time from multiple authoritative sources.',
  },
  {
    question: 'What pricing plans are available?',
    answer: 'Cursive offers self-serve marketplace credits starting at $0.60/lead, and done-for-you services starting at $1,000/month. All plans include visitor identification, AI-powered outreach, and CRM integrations.',
  },
  {
    question: 'What integrations does Cursive support?',
    answer: 'Cursive natively integrates with 200+ tools including all major CRMs (Salesforce, HubSpot, Pipedrive), marketing automation platforms (Marketo, Pardot, ActiveCampaign), and ad platforms (Google Ads, Facebook, LinkedIn).',
  },
  {
    question: 'How is Cursive different from competitors?',
    answer: 'Unlike traditional visitor ID tools that just deliver data, Cursive combines identification with AI-powered activation. We include 450B+ intent signals, real-time identification, and multi-channel campaigns out of the box.',
  },
]

export const metadata: Metadata = {
  title: "Turn Website Visitors Into Booked Meetings | Cursive",
  description: "Identify 70% of website visitors and automate personalized outreach. Turn anonymous traffic into booked meetings with AI-powered lead generation.",
  keywords: "B2B lead generation, visitor identification, intent data, direct mail marketing, audience targeting, AI SDR, outbound automation",
  openGraph: {
    title: "Turn Website Visitors Into Booked Meetings | Cursive",
    description: "Identify 70% of website visitors and automate personalized outreach. Turn anonymous traffic into booked meetings with AI-powered lead generation.",
    url: "https://meetcursive.com",
    siteName: "Cursive",
    images: [{
      url: "https://meetcursive.com/cursive-social-preview.png",
      width: 1200,
      height: 630,
    }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Turn Website Visitors Into Booked Meetings | Cursive",
    description: "Identify 70% of website visitors and automate personalized outreach. Turn anonymous traffic into booked meetings with AI-powered lead generation.",
    images: ["https://meetcursive.com/cursive-social-preview.png"],
    creator: "@meetcursive",
  },
  alternates: {
    canonical: "https://meetcursive.com",
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
            <h1 className="text-2xl text-gray-900 font-bold mb-4">Turn Website Visitors Into Booked Meetings | Cursive</h1>
            <p className="text-gray-700 leading-relaxed">
              98% of visitors leave without converting. Cursive identifies 70% of anonymous website visitors, enriches them against 220M+ verified contacts, and automates personalized outreach across email, LinkedIn, and SMS.
            </p>
          </div>

          {/* Key Stats */}
          <MachineSection title="Key Stats">
            <MachineList items={[
              "70% - Visitor identification rate for B2B traffic",
              "220M+ - Consumer profiles in our database",
              "140M+ - Business profiles in our database",
              "450B+ - Monthly intent signals tracked across 30,000+ categories",
              "200+ - Native CRM and marketing tool integrations"
            ]} />
          </MachineSection>

          {/* Core Products & Solutions */}
          <MachineSection title="Products & Solutions">
            <MachineList items={[
              {
                label: "Visitor Identification",
                href: "https://meetcursive.com/visitor-identification",
                description: "Reveal up to 70% of anonymous website visitors in real-time. See which companies viewed your pricing page, feature pages, or comparison content before they fill out a form."
              },
              {
                label: "AI-Powered Outreach",
                href: "https://meetcursive.com/platform",
                description: "AI agents that book meetings while you sleep. Multi-channel campaigns across email, LinkedIn, and SMS with autonomous follow-ups and meeting booking."
              },
              {
                label: "Intent Data Audiences",
                href: "https://meetcursive.com/intent-audiences",
                description: "Pre-built segments across 8 high-value verticals with verified purchase intent signals. Updated weekly with 450B+ monthly intent signals."
              },
              {
                label: "Audience Builder",
                href: "https://meetcursive.com/audience-builder",
                description: "Build unlimited custom audiences using 220M+ consumer and 140M+ business profiles. No size limits or restrictive licensing."
              },
              {
                label: "Direct Mail Automation",
                href: "https://meetcursive.com/direct-mail",
                description: "Send physical postcards triggered by digital behavior. Automated triggers based on website visits, email engagement, or custom events."
              },
              {
                label: "Lead Marketplace",
                href: "https://meetcursive.com/marketplace",
                description: "Self-serve B2B lead marketplace. Browse and buy verified leads with credits starting at $0.60/lead."
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
                  "450B+ monthly intent signals",
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
                href: "https://meetcursive.com/services",
                description: "Verified B2B contacts delivered monthly. Custom targeting based on your ICP with 95%+ email deliverability."
              },
              {
                label: "Cursive Outbound — $2,500/month",
                href: "https://meetcursive.com/services",
                description: "Done-for-you email campaigns with AI-powered personalization. We build, launch, and optimize campaigns using your brand voice."
              },
              {
                label: "Cursive Pipeline — $5,000/month",
                href: "https://meetcursive.com/services",
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
              { label: "B2B Software", href: "https://meetcursive.com/industries/b2b-software", description: "Visitor identification and intent data for SaaS companies." },
              { label: "Agencies", href: "https://meetcursive.com/industries/agencies", description: "White-label visitor identification for client services." },
              { label: "Ecommerce", href: "https://meetcursive.com/industries/ecommerce", description: "Identify anonymous shoppers and retarget cart abandoners." },
              { label: "Financial Services", href: "https://meetcursive.com/industries/financial-services", description: "Compliant lead generation for financial advisors and lenders." },
              { label: "Home Services", href: "https://meetcursive.com/industries/home-services", description: "Reach homeowners searching for HVAC, plumbing, roofing services." },
              { label: "Education", href: "https://meetcursive.com/industries/education", description: "Identify prospective students researching programs." },
              { label: "Franchises", href: "https://meetcursive.com/industries/franchises", description: "Multi-location lead generation with centralized management." },
              { label: "Retail", href: "https://meetcursive.com/industries/retail", description: "Identify in-market shoppers and drive foot traffic." },
              { label: "Media & Advertising", href: "https://meetcursive.com/industries/media-advertising", description: "Audience intelligence for media buyers and publishers." },
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
                  href: "https://cal.com/cursive/30min",
                  description: "See Cursive identify your website visitors in real-time with a personalized walkthrough"
                },
                {
                  label: "Try Free Leads",
                  href: "https://leads.meetcursive.com/signup",
                  description: "Sign up for the self-serve marketplace and get 100 free lead credits"
                },
                {
                  label: "Explore Platform Features",
                  href: "https://meetcursive.com/platform",
                  description: "Deep dive into visitor identification, AI Studio, and intent audiences"
                },
                {
                  label: "View Pricing",
                  href: "https://meetcursive.com/pricing",
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
                  "450B+ intent signals across 30,000+ categories",
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
              { label: "Website", href: "https://meetcursive.com" },
              { label: "Email", href: "mailto:hello@meetcursive.com" },
              { label: "Schedule Demo", href: "https://cal.com/cursive/30min" },
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
              { label: "Privacy Policy", href: "https://meetcursive.com/privacy" },
              { label: "Terms of Service", href: "https://meetcursive.com/terms" },
            ]} />
          </MachineSection>

        </MachineContent>
      </MachineView>
    </>
  )
}
