"use client"

import { Container } from "@/components/ui/container"
import { DashboardCTA } from "@/components/dashboard-cta"
import { Calendar, Clock, ArrowLeft } from "lucide-react"
import { StructuredData } from "@/components/seo/structured-data"
import { generateBlogPostSchema } from "@/lib/seo/structured-data"
import Link from "next/link"
import { HumanView, MachineView, MachineContent, MachineSection, MachineLink, MachineList } from "@/components/view-wrapper"
import { SimpleRelatedPosts } from "@/components/blog/simple-related-posts"

const relatedPosts = [
  { title: "15 Best Sales Prospecting Tools for B2B Teams in 2026", description: "Top prospecting platforms ranked by data accuracy, automation, and ROI.", href: "/blog/sales-prospecting-tools" },
  { title: "Email Finder: Find Professional Email Addresses for Free", description: "How email finders work and which tools deliver the best results.", href: "/blog/email-finder" },
  { title: "Best Website Visitor Identification Software", description: "Compare the top platforms for identifying anonymous B2B traffic.", href: "/blog/best-website-visitor-identification-software" },
]

export default function BlogPost() {
  return (
    <main>
      <StructuredData data={generateBlogPostSchema({
        title: "The 25 Best Lead Generation Software Tools for 2026",
        description: "Compare the 25 best B2B lead generation software tools for 2026. Covers visitor identification, contact databases, enrichment, and AI-powered outreach platforms.",
        author: "Cursive Team",
        publishDate: "2026-04-03",
        image: "https://www.meetcursive.com/cursive-logo.png"
      })} />

      <HumanView>
        {/* Header */}
      <section className="py-12 bg-white">
        <Container>
          <Link href="/blog" className="inline-flex items-center gap-2 text-primary hover:underline mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          <div className="max-w-4xl">
            <div className="inline-block px-3 py-1 bg-primary text-white rounded-full text-sm font-medium mb-4">
              Lead Generation
            </div>
            <h1 className="text-5xl font-bold mb-6">
              The 25 Best Lead Generation Software Tools for 2026
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Most B2B websites convert around 2-3% of visitors into known leads. The other 97% browse your pricing page, read your case studies, compare you to competitors -- then leave without a trace. Lead generation software closes that gap.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>April 3, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>18 min read</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Article Content */}
      <section className="py-16 bg-white">
        <Container>
          <article className="max-w-3xl mx-auto prose prose-lg prose-blue">
            <p className="lead">
              Most B2B websites convert around 2-3% of visitors into known leads. The other 97% browse your pricing page, read your case studies, compare you to competitors -- then leave without a trace. That is not a traffic problem. It is a capture problem.
            </p>

            <p>
              Lead generation software closes that gap by identifying prospects, enriching their data, and routing them to your sales team before they disappear. This guide covers the 25 best tools for 2026, what features actually matter, and how to choose the right platform for your workflow.
            </p>

            <h2>What Is Lead Generation Software</h2>

            <p>
              Lead generation software automates the process of finding and capturing potential customers. At its core, the software identifies people or companies showing interest in products like yours, then delivers their contact information to your sales team. Some tools focus on building prospect lists from databases. Others capture inbound interest through forms and chatbots. A growing category identifies anonymous website visitors before they ever fill out a form.
            </p>

            <h2>Why B2B Teams Need Lead Generation Tools</h2>

            <h3>Identify High-Intent Prospects Before They Fill Out Forms</h3>
            <p>
              Traditional lead capture waits for visitors to raise their hand. By the time someone fills out a "Contact Sales" form, they have often already made a shortlist. Visitor identification tools surface prospects while they are still in research mode, giving your team a chance to engage before competitors do.
            </p>

            <h3>Reduce Manual Prospecting and Research Time</h3>
            <p>
              Sales reps spend a significant portion of their day on research and data entry. Lead generation software handles enrichment automatically, appending company size, industry, tech stack, and contact details so reps can skip the LinkedIn stalking and start conversations faster.
            </p>

            <h3>Improve Conversion Rates from Existing Traffic</h3>
            <p>
              Rather than simply driving more traffic and spending more on ads, the smarter play is extracting more value from visitors you have already paid to acquire. Identifying even 30-40% more of your anonymous traffic can meaningfully increase qualified pipeline without increasing ad spend.
            </p>

            <h3>Connect Marketing Spend to Pipeline Revenue</h3>
            <p>
              Attribution has always been marketing's challenge. When lead generation software tracks which pages visitors viewed, which campaigns brought them in, and which accounts eventually closed, you can draw a clearer line from spend to revenue.
            </p>

            <h2>Key Features to Look for in Lead Gen Software</h2>

            <ul>
              <li><strong>Visitor identification and match rates:</strong> Match rate refers to the percentage of anonymous website visitors a tool can identify. Company-level identification reveals which organizations are browsing. Individual-level identification provides actual contact details. Industry-standard match rates hover around 20-30%, though advanced platforms can reach higher.</li>
              <li><strong>Data enrichment and contact accuracy:</strong> Enrichment adds firmographic details like industry, employee count, and revenue. The key metric is email deliverability. If contacts bounce at 10% or higher, you are wasting outreach and damaging sender reputation.</li>
              <li><strong>Intent signals and behavioral scoring:</strong> First-party signals come from your own website. Third-party signals track research behavior across the broader web. Scoring combines intent signals to prioritize leads by likelihood to buy.</li>
              <li><strong>CRM and tech stack integrations:</strong> Leads that do not flow into your existing workflows do not get worked. Look for native integrations with your CRM, marketing automation, and communication tools.</li>
              <li><strong>Automation and outreach capabilities:</strong> The more you can automate without sacrificing personalization, the more pipeline you generate per rep.</li>
              <li><strong>Compliance and privacy controls:</strong> GDPR, CCPA, and CAN-SPAM are not optional. Reputable platforms include opt-out handling, consent management, and data residency options.</li>
            </ul>

            <h2>How to Choose the Right Lead Generation Platform</h2>

            <h3>1. Define Your Ideal Customer Profile</h3>
            <p>
              Start with clarity on who you are selling to: industry, company size, job titles, geography. Your ICP determines which data sources matter most.
            </p>

            <h3>2. Evaluate Data Quality and Verification Methods</h3>
            <p>
              Ask vendors how they source and verify data. First-party data and real-time verification consistently outperform stale third-party lists. Request sample data for accounts you know well.
            </p>

            <h3>3. Assess Integration Requirements</h3>
            <p>
              Map your current tech stack before evaluating platforms. Native integrations save implementation time and reduce data sync issues.
            </p>

            <h3>4. Compare Pricing Models and ROI Expectations</h3>
            <p>
              Common models include per-lead credits, monthly subscriptions, and usage-based pricing. Calculate your expected cost per qualified lead against your average contract value.
            </p>

            <h3>5. Test with a Pilot Before Full Commitment</h3>
            <p>
              Most vendors offer trials or limited pilots. Use this period to measure actual match rates, data accuracy, and lead-to-meeting conversion.
            </p>

            <h2>The 25 Best B2B Lead Generation Software Tools</h2>

            <h3>Cursive</h3>
            <p>
              Cursive is a full-stack lead generation platform that combines visitor identification, real-time enrichment, and AI-powered outreach in one system. The platform identifies anonymous B2B website visitors and can trigger personalized email, LinkedIn, and SMS outreach within hours of a visit. Best for B2B teams wanting to turn website traffic into booked meetings without manual prospecting work.
            </p>

            <h3>Leadfeeder</h3>
            <p>
              Leadfeeder identifies companies visiting your website using IP intelligence and integrates directly with Google Analytics. Best for teams new to visitor identification who want a simple starting point.
            </p>

            <h3>ZoomInfo</h3>
            <p>
              ZoomInfo is an enterprise B2B contact and company intelligence platform. Its database covers millions of businesses with detailed firmographic, technographic, and org chart data. Best for large sales organizations with budget for comprehensive data infrastructure.
            </p>

            <h3>Apollo.io</h3>
            <p>
              Apollo combines a prospecting database with built-in sales engagement tools, including email sequences, a dialer, and LinkedIn automation. Best for startups and SMBs wanting an all-in-one prospecting and outreach solution.
            </p>

            <h3>Clearbit</h3>
            <p>
              Clearbit provides real-time enrichment and website visitor reveal through APIs that integrate deeply with product and marketing workflows. Best for product-led growth teams and developers building custom data workflows.
            </p>

            <h3>6sense</h3>
            <p>
              6sense is an account-based marketing platform that uses AI to predict which accounts are in-market before they engage with your brand. Best for enterprise ABM programs with dedicated marketing operations resources.
            </p>

            <h3>Demandbase</h3>
            <p>
              Demandbase combines account identification, advertising, and sales intelligence into an ABM platform. Best for B2B enterprise marketing teams running coordinated ABM campaigns.
            </p>

            <h3>HubSpot Marketing Hub</h3>
            <p>
              HubSpot offers an all-in-one marketing platform with forms, landing pages, email marketing, and lead scoring, plus a free CRM. Best for growing companies wanting marketing automation and CRM in one ecosystem.
            </p>

            <h3>Salesforce Marketing Cloud</h3>
            <p>
              Salesforce Marketing Cloud provides enterprise-grade marketing automation with advanced journey building, personalization, and analytics. Best for large enterprises standardized on Salesforce.
            </p>

            <h3>Seamless.AI</h3>
            <p>
              Seamless.AI uses artificial intelligence to find and verify contact information in real-time. Best for individual sales reps doing high-volume prospecting.
            </p>

            <h3>UpLead</h3>
            <p>
              UpLead is a B2B contact database with real-time email verification built into every search. Best for teams wanting verified contacts with flexible, pay-as-you-go pricing.
            </p>

            <h3>Lusha</h3>
            <p>
              Lusha provides contact enrichment through a browser extension that works on LinkedIn and company websites. Best for European teams and compliance-focused organizations.
            </p>

            <h3>Cognism</h3>
            <p>
              Cognism specializes in EMEA markets with phone-verified mobile numbers. Best for sales teams targeting European markets.
            </p>

            <h3>Hunter</h3>
            <p>
              Hunter finds and verifies professional email addresses associated with any domain. Best for targeted email outreach and list building.
            </p>

            <h3>Intercom</h3>
            <p>
              Intercom captures leads through conversational marketing, using chatbots and live chat that engage visitors in real-time. Best for product-led SaaS companies wanting to engage visitors through conversation.
            </p>

            <h3>Drift</h3>
            <p>
              Drift pioneered conversational marketing with chatbots designed to replace forms and qualify leads through dialogue. Best for companies wanting to replace forms with real-time chat experiences.
            </p>

            <h3>Pipedrive</h3>
            <p>
              Pipedrive is a sales CRM with built-in lead management and prospecting features. Best for small sales teams wanting an intuitive CRM with basic prospecting.
            </p>

            <h3>Albacross</h3>
            <p>
              Albacross identifies companies visiting your website with a focus on European markets and GDPR compliance. Best for European B2B teams needing compliant visitor identification.
            </p>

            <h3>Lead Forensics</h3>
            <p>
              Lead Forensics reveals which companies visit your website using IP address matching. Best for teams wanting basic visitor intelligence with established technology.
            </p>

            <h3>Bombora</h3>
            <p>
              Bombora provides intent data by tracking content consumption across a cooperative of B2B publisher websites. Best for layering intent signals onto existing data and ABM platforms.
            </p>

            <h3>RollWorks</h3>
            <p>
              RollWorks combines account-based advertising with lead scoring and sales insights. Best for mid-market companies starting ABM programs.
            </p>

            <h3>Warmly</h3>
            <p>
              Warmly identifies website visitors and delivers real-time alerts to sales reps via Slack. Best for teams prioritizing immediate follow-up on hot visitors.
            </p>

            <h3>Instantly</h3>
            <p>
              Instantly provides cold email infrastructure with unlimited sending accounts and built-in warmup. Best for agencies and teams running high-volume cold email.
            </p>

            <h3>Reply.io</h3>
            <p>
              Reply.io automates multichannel sales engagement across email, LinkedIn, and phone. Best for SDR teams running coordinated multichannel outreach.
            </p>

            <h3>Clay</h3>
            <p>
              Clay is a data enrichment and workflow automation platform that connects dozens of data sources with AI-powered research. Best for RevOps teams building sophisticated, custom prospecting systems.
            </p>

            <h2>Lead Generation Tools Comparison Table</h2>

            <table>
              <thead>
                <tr>
                  <th>Tool</th>
                  <th>Primary Function</th>
                  <th>Best For</th>
                  <th>Pricing Model</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Cursive</td><td>Visitor ID + AI outreach</td><td>Full-funnel automation</td><td>Monthly subscription</td></tr>
                <tr><td>Leadfeeder</td><td>Visitor identification</td><td>Simple visitor tracking</td><td>Monthly subscription</td></tr>
                <tr><td>ZoomInfo</td><td>Contact database</td><td>Enterprise prospecting</td><td>Annual contract</td></tr>
                <tr><td>Apollo.io</td><td>Database + engagement</td><td>All-in-one prospecting</td><td>Freemium + paid tiers</td></tr>
                <tr><td>Clearbit</td><td>API enrichment</td><td>Product-led growth</td><td>Usage-based</td></tr>
                <tr><td>6sense</td><td>Predictive ABM</td><td>Enterprise ABM</td><td>Annual contract</td></tr>
                <tr><td>Demandbase</td><td>ABM platform</td><td>Enterprise marketing</td><td>Annual contract</td></tr>
                <tr><td>HubSpot</td><td>Marketing automation</td><td>Growing companies</td><td>Freemium + paid tiers</td></tr>
                <tr><td>Seamless.AI</td><td>Contact finding</td><td>Individual reps</td><td>Monthly subscription</td></tr>
                <tr><td>UpLead</td><td>Verified contacts</td><td>Pay-as-you-go data</td><td>Per-credit</td></tr>
                <tr><td>Lusha</td><td>Contact enrichment</td><td>European teams</td><td>Monthly subscription</td></tr>
                <tr><td>Cognism</td><td>EMEA data</td><td>European calling</td><td>Annual contract</td></tr>
                <tr><td>Hunter</td><td>Email finding</td><td>Targeted outreach</td><td>Freemium + paid</td></tr>
                <tr><td>Intercom</td><td>Conversational marketing</td><td>Product-led SaaS</td><td>Monthly subscription</td></tr>
                <tr><td>Drift</td><td>Chatbots</td><td>Form replacement</td><td>Monthly subscription</td></tr>
              </tbody>
            </table>

            <h2>Common Lead Generation Software Mistakes to Avoid</h2>

            <ul>
              <li><strong>Prioritizing volume over data accuracy:</strong> A database with millions of contacts means nothing if 15% bounce. High bounce rates damage sender reputation and waste rep time. Always verify data quality with a sample before committing.</li>
              <li><strong>Ignoring integration complexity:</strong> Tools that require manual CSV exports or Zapier workarounds create friction that compounds over time. Native, bidirectional CRM sync keeps data flowing without ongoing maintenance.</li>
              <li><strong>Overlooking compliance requirements:</strong> GDPR fines can reach 20 million euros or 4% of global revenue. Verify opt-out handling and consent mechanisms before purchasing.</li>
              <li><strong>Choosing based on price alone:</strong> A $0.50 lead that never converts costs infinitely more than a $5 lead that books meetings. Calculate cost per qualified opportunity, not cost per record.</li>
            </ul>

            <h2>How to Get Started with B2B Lead Generation Software</h2>

            <h3>1. Install Your Tracking Pixel or Integration</h3>
            <p>
              Visitor identification tools typically require a JavaScript pixel on your website. With Google Tag Manager, installation takes under 10 minutes.
            </p>

            <h3>2. Configure Filtering and Segmentation Rules</h3>
            <p>
              Exclude existing customers, internal traffic, and bot activity from your lead flow. Set up segments based on behavior. Pricing page visitors, repeat visitors, and visitors who match your ICP criteria deserve different treatment than casual blog readers.
            </p>

            <h3>3. Connect Your CRM and Outreach Tools</h3>
            <p>
              Enable two-way sync so leads flow into existing workflows automatically. Map fields properly to avoid data fragmentation.
            </p>

            <h3>4. Set Up Alerts and Automated Workflows</h3>
            <p>
              Configure real-time notifications for high-intent visitors. Build sequences that trigger based on specific behaviors.
            </p>

            <h3>5. Measure Results and Optimize</h3>
            <p>
              Track match rates, lead-to-meeting conversion, and pipeline generated. Adjust ICP filters and scoring thresholds based on what actually converts.
            </p>

            <h2>Best Lead Generation Software for Small Business</h2>

            <p>
              Small businesses face different constraints than enterprise teams: tighter budgets, limited technical resources, and the need for quick time-to-value. Look for platforms with free tiers or pay-as-you-go pricing that let you start small and scale with results. Apollo.io, Hunter, and HubSpot all offer meaningful free functionality. For visitor identification without long contracts, credit-based marketplaces let you purchase verified B2B leads starting around $0.60 per lead with no subscription required.
            </p>

            <h2>FAQs About Lead Generation Software</h2>

            <h3>What is the average cost of lead generation software?</h3>
            <p>
              Pricing varies dramatically. Simple visitor identification tools start around $100-200 per month. Comprehensive platforms with enrichment and outreach typically run $500-2,000 per month. Enterprise solutions often exceed $30,000 per year. Pay-per-lead models range from $0.50-5.00 per contact depending on data depth and verification.
            </p>

            <h3>How long does it take to set up lead generation software?</h3>
            <p>
              Most modern platforms can be operational within hours, not weeks. Visitor identification pixels install in under 10 minutes with tag managers. CRM integrations typically take 15-60 minutes depending on complexity.
            </p>

            <h3>What is the difference between company-level and individual-level visitor identification?</h3>
            <p>
              Company-level identification reveals which organizations visit your site. Individual-level identification provides specific contact details: name, title, email, and phone for the actual person browsing. Individual-level data is more actionable but requires more sophisticated matching technology.
            </p>

            <h3>What visitor match rate can B2B teams expect from identification tools?</h3>
            <p>
              Industry-standard match rates for company-level identification range from 20-40%. Individual-level identification typically runs lower, around 10-30% for most tools. Advanced platforms using multiple data sources can achieve higher match rates on B2B traffic.
            </p>

            <h2>About the Author</h2>
            <p>
              <strong>Adam Wolfe</strong> is the founder of Cursive, a full-stack lead generation platform that combines visitor identification, data enrichment, and AI-powered outreach to turn anonymous website traffic into qualified pipeline.
            </p>
          </article>
        </Container>
      </section>

      {/* CTA Section */}
      <SimpleRelatedPosts posts={relatedPosts} />
      <DashboardCTA
        headline="Turn Anonymous Traffic"
        subheadline="Into Qualified Pipeline"
        description="Cursive identifies your website visitors, enriches their data, and triggers AI-powered outreach -- all in one platform. See how many leads you're losing today."
      />

      {/* Related Posts */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <Container>
          <h2 className="text-3xl font-bold mb-8 text-center">Read Next</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Link href="/blog/sales-prospecting-tools" className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="font-bold mb-2">15 Best Sales Prospecting Tools</h3>
              <p className="text-sm text-gray-600">Top B2B prospecting platforms for 2026</p>
            </Link>
            <Link href="/blog/email-finder" className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="font-bold mb-2">Email Finder Guide</h3>
              <p className="text-sm text-gray-600">Find professional email addresses by name and company</p>
            </Link>
            <Link href="/blog/best-website-visitor-identification-software" className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="font-bold mb-2">Best Visitor Identification Software</h3>
              <p className="text-sm text-gray-600">Compare top platforms for identifying anonymous traffic</p>
            </Link>
          </div>
        </Container>
      </section>
      </HumanView>

      <MachineView>
        <MachineContent>
          <h1 className="text-2xl font-bold mb-4">The 25 Best Lead Generation Software Tools for 2026</h1>

          <p className="text-gray-700 mb-6">
            Comprehensive comparison of 25 B2B lead generation software tools covering visitor identification, contact databases, enrichment, and AI-powered outreach. Published: April 3, 2026. Reading time: 18 minutes.
          </p>

          <MachineSection title="Key Takeaways">
            <MachineList items={[
              "Most B2B websites convert only 2-3% of visitors into known leads -- 97% leave without a trace",
              "Visitor identification tools surface prospects while they're still in research mode, before competitors engage",
              "Industry-standard match rates hover around 20-30% for company-level identification",
              "Native CRM integrations save implementation time and reduce data sync issues vs Zapier workarounds",
              "Calculate cost per qualified opportunity, not cost per record, when evaluating platforms"
            ]} />
          </MachineSection>

          <MachineSection title="Key Features to Evaluate">
            <MachineList items={[
              "Visitor identification and match rates -- company-level vs individual-level identification",
              "Data enrichment and contact accuracy -- bounce rates above 10% waste outreach and damage reputation",
              "Intent signals and behavioral scoring -- first-party and third-party signals combined",
              "CRM and tech stack integrations -- native two-way sync vs manual exports",
              "Automation and outreach capabilities -- email, LinkedIn, SMS sequences",
              "Compliance and privacy controls -- GDPR, CCPA, CAN-SPAM"
            ]} />
          </MachineSection>

          <MachineSection title="Top 25 Tools Overview">
            <MachineList items={[
              "Cursive -- full-stack visitor ID + AI outreach, monthly subscription",
              "Leadfeeder -- simple visitor tracking via IP intelligence, monthly subscription",
              "ZoomInfo -- enterprise contact database with firmographic/technographic data, annual contract (~$15K+)",
              "Apollo.io -- all-in-one database + engagement, freemium + paid tiers",
              "Clearbit -- API enrichment for product-led growth teams, usage-based",
              "6sense -- predictive ABM for enterprise, annual contract",
              "Demandbase -- ABM platform for enterprise marketing, annual contract",
              "HubSpot -- marketing automation + free CRM, freemium + paid tiers",
              "Seamless.AI -- real-time contact finding for individual reps, monthly subscription",
              "UpLead -- verified contacts with pay-as-you-go pricing, per-credit",
              "Lusha -- GDPR-compliant contact enrichment, monthly subscription",
              "Cognism -- EMEA data with phone-verified mobile numbers, annual contract",
              "Hunter -- email finding and verification, freemium + paid",
              "Intercom -- conversational marketing for product-led SaaS, monthly subscription",
              "Drift -- chatbot-based form replacement, monthly subscription",
              "Pipedrive -- intuitive CRM with basic prospecting, monthly subscription",
              "Albacross -- European visitor identification, monthly subscription",
              "Lead Forensics -- IP-based visitor tracking, annual contract",
              "Bombora -- intent data from B2B publisher network, annual contract",
              "RollWorks -- mid-market ABM platform, monthly subscription",
              "Warmly -- real-time visitor alerts via Slack, monthly subscription",
              "Instantly -- high-volume cold email infrastructure, monthly subscription",
              "Reply.io -- multichannel sales engagement, monthly subscription",
              "Clay -- data enrichment + workflow automation, monthly subscription",
              "Salesforce Marketing Cloud -- enterprise marketing automation, annual contract"
            ]} />
          </MachineSection>

          <MachineSection title="Common Mistakes to Avoid">
            <MachineList items={[
              "Prioritizing volume over data accuracy -- 15% bounce rates damage sender reputation",
              "Ignoring integration complexity -- manual CSV exports create compounding friction",
              "Overlooking compliance -- GDPR fines can reach 20M euros or 4% of global revenue",
              "Choosing based on price alone -- cost per qualified opportunity matters more than cost per record"
            ]} />
          </MachineSection>

          <MachineSection title="Getting Started">
            <MachineList items={[
              "Install tracking pixel via Google Tag Manager (under 10 minutes)",
              "Configure filtering and segmentation rules for high-intent visitors",
              "Connect CRM and outreach tools with two-way sync",
              "Set up real-time alerts for high-intent visitors",
              "Measure match rates, lead-to-meeting conversion, and pipeline generated"
            ]} />
          </MachineSection>

          <MachineSection title="How Cursive Helps">
            <p className="text-gray-700 mb-3">
              Cursive combines visitor identification, real-time enrichment, and AI-powered outreach into a single platform. Identifies anonymous B2B website visitors and triggers personalized email, LinkedIn, and SMS outreach within hours of a visit.
            </p>
            <MachineList items={[
              { label: "Platform Overview", href: "/platform", description: "Visitor identification, intent data, AI outreach" },
              { label: "Pricing", href: "/pricing", description: "Self-serve marketplace + done-for-you services" },
              { label: "Book a Demo", href: "/book", description: "See Cursive in real-time" }
            ]} />
          </MachineSection>

          <MachineSection title="Related Resources">
            <MachineList items={[
              { label: "15 Best Sales Prospecting Tools for B2B Teams in 2026", href: "/blog/sales-prospecting-tools", description: "Top prospecting platforms ranked" },
              { label: "Email Finder: Find Professional Email Addresses for Free", href: "/blog/email-finder", description: "How email finders work and best options" },
              { label: "Best Website Visitor Identification Software", href: "/blog/best-website-visitor-identification-software", description: "Compare top visitor ID platforms" }
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
