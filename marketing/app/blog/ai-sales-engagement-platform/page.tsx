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
  { title: "The 12 Best AI Sales Assistants for 2026", description: "Compare 12 AI sales assistant platforms with pricing and features.", href: "/blog/best-ai-sales-assistants" },
  { title: "Cold Email Best Practices for 2026", description: "Proven strategies for deliverability, personalization, and compliance.", href: "/blog/cold-email-2026" },
  { title: "Best AI SDR Tools for 2026", description: "9 AI SDR platforms ranked and compared with pricing.", href: "/blog/best-ai-sdr-tools-2026" },
]

export default function BlogPost() {
  return (
    <main>
      <StructuredData data={generateBlogPostSchema({
        title: "Cursive: AI Sales Engagement Platform",
        description: "Learn how AI sales engagement platforms automate prospecting, outreach, and meeting booking. See how Cursive identifies website visitors and converts them into pipeline.",
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
              AI in Sales
            </div>
            <h1 className="text-5xl font-bold mb-6">
              Cursive: AI Sales Engagement Platform
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              AI sales engagement platforms automate the entire workflow from identifying prospects to booking meetings. This guide covers how they work, core capabilities, and how to evaluate options for your team.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>April 3, 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>9 min read</span>
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
              Your sales team spends hours researching prospects, writing emails, and following up--yet most outreach never gets a response. AI sales engagement platforms change this equation by automating the entire workflow from identifying prospects to booking meetings, using artificial intelligence to decide who to contact, what to say, and when to reach out.
            </p>

            <h2>What Is an AI Sales Engagement Platform</h2>

            <p>
              AI sales engagement uses artificial intelligence to personalize outreach, automate repetitive tasks, and analyze buyer behavior. Sales teams using AI-powered platforms can focus on building relationships and closing deals rather than spending hours on manual prospecting and follow-up. According to Salesforce, teams using AI in their sales process see a 10% increase in win rates and significantly faster meeting preparation.
            </p>

            <p>
              Traditional sales engagement tools automate the <em>sending</em> of emails on a schedule. AI sales engagement platforms go further by deciding <em>who</em> to contact, <em>what</em> to say, and <em>when</em> to reach out based on real-time signals. The difference comes down to intelligence: traditional tools follow rules you set, while AI platforms make decisions based on patterns in your data.
            </p>

            <ul>
              <li><strong>Traditional sales engagement:</strong> Sequences emails automatically but still requires manual research, message writing, and lead prioritization</li>
              <li><strong>AI sales engagement:</strong> Handles the full workflow from identifying prospects to booking meetings, with minimal human input</li>
            </ul>

            <h2>How AI Sales Engagement Platforms Work</h2>

            <p>
              The basic loop is straightforward: data comes in, AI analyzes it, automated actions go out, and the system learns from results. Your website visitor data, CRM records, and third-party intent signals all feed into the platform. AI models then process this information to spot patterns--which prospects match your ideal customer profile, which behaviors signal buying intent, and which messages get responses.
            </p>

            <p>
              From there, the platform takes action automatically. It might send a personalized email sequence, trigger a LinkedIn connection request, or alert a sales rep that a target account just visited your pricing page. Over time, the AI learns which approaches generate replies and meetings, then optimizes without anyone having to adjust settings manually.
            </p>

            <h2>Core Capabilities of AI-Powered Sales Engagement</h2>

            <p>Modern platforms bundle several capabilities that work together. Understanding each one helps you figure out what you actually need versus what's nice to have.</p>

            <h3>Lead Discovery and Prospecting</h3>
            <p>
              AI scans large contact databases--often 100M+ B2B profiles--to surface prospects matching your criteria. Rather than manually building lists, you define your ideal customer profile and the platform continuously identifies new matches. Some platforms also identify anonymous website visitors, turning unknown traffic into named prospects without requiring form fills.
            </p>

            <h3>Automated Outreach Sequences</h3>
            <p>
              Once prospects are identified, multi-step campaigns run without manual intervention. A typical sequence might include an initial email, a LinkedIn connection request two days later, a follow-up email after another three days, and a final touchpoint a week later. The AI handles timing, channel selection, and message variations based on prospect attributes.
            </p>

            <h3>AI-Driven Follow-Ups and Meeting Booking</h3>
            <p>
              When prospects reply, AI agents can handle the conversation. They answer common questions, address objections, and propose meeting times that sync with your calendar. This eliminates the back-and-forth that often delays deals by days or weeks.
            </p>

            <h3>Behavior-Triggered Workflows</h3>
            <p>
              Static sequences treat every prospect the same. Behavior-triggered workflows adapt based on what prospects actually do. If someone visits your pricing page, they might skip ahead in the sequence to receive a more direct message. If they open an email but don't reply, the next touchpoint might shift to a different channel.
            </p>

            <h3>Real-Time Data Enrichment</h3>
            <p>
              Enrichment adds firmographic data (company size, industry, revenue), technographic data (what tools they use), and contact details (verified email, phone, LinkedIn) to every record. Real-time enrichment means this happens instantly when a prospect is identified, not hours or days later when the buying window may have closed.
            </p>

            <h2>How AI Agents Automate the Sales Process</h2>

            <p>AI SDR agents represent the most advanced form of sales engagement automation. They handle the full prospecting-to-meeting workflow that traditionally required a human sales development rep.</p>

            <h3>1. Identify High-Intent Prospects</h3>
            <p>
              The agent monitors intent signals--website visits, content downloads, third-party research behavior--to find prospects actively exploring solutions. A company visiting your pricing page three times in a week signals higher intent than one that read a single blog post six months ago.
            </p>

            <h3>2. Research and Enrich Contact Data</h3>
            <p>
              Once a prospect is identified, the agent pulls relevant context: company news, recent funding rounds, technology stack, LinkedIn profiles of key decision-makers. This research happens in seconds rather than the 15-20 minutes a human rep might spend.
            </p>

            <h3>3. Generate Personalized Messaging</h3>
            <p>
              Using the research, AI writes outreach that references specific details about the prospect's situation. This isn't mail-merge personalization with a first name and company name. It's messaging that acknowledges their tech stack, recent company news, or the specific pages they viewed on your site.
            </p>

            <h3>4. Execute Multi-Channel Sequences</h3>
            <p>
              The agent coordinates outreach across email, LinkedIn, SMS, and sometimes direct mail. Channel selection can be dynamic--if email isn't getting responses, the agent might shift emphasis to LinkedIn or add a phone touchpoint.
            </p>

            <h3>5. Handle Replies and Book Meetings</h3>
            <p>
              When prospects respond, the AI agent continues the conversation. It can answer product questions, handle scheduling logistics, and book meetings directly on sales reps' calendars. The rep's first interaction with the prospect is often the meeting itself.
            </p>

            <h2>Website Visitor Identification and Real-Time Lead Activation</h2>

            <p>
              Most B2B websites convert only 2-3% of visitors through forms. The other 97% browse, compare options, and leave without identifying themselves. Visitor identification technology closes this gap by matching anonymous traffic to company and individual records.
            </p>

            <p>Identification works through multiple signals:</p>

            <ul>
              <li><strong>IP intelligence:</strong> Maps IP addresses to company locations</li>
              <li><strong>Device fingerprinting:</strong> Creates unique identifiers based on browser and device characteristics</li>
              <li><strong>Email graph matching:</strong> Connects device signals to known email addresses</li>
              <li><strong>Third-party data matching:</strong> Cross-references against large B2B databases</li>
            </ul>

            <p>
              When a visitor is identified, their record can be enriched and pushed to your CRM within seconds, triggering outreach while interest is still high. Cursive's identification engine matches up to 70% of B2B website visitors, compared to the 20-30% that most tools achieve.
            </p>

            <h2>Multi-Channel AI Outreach Beyond Email</h2>

            <p>
              Email remains the backbone of B2B outreach, but response rates have declined as inboxes become more crowded. Multi-channel approaches consistently outperform single-channel campaigns.
            </p>

            <h3>Email Sequences</h3>
            <p>
              AI optimizes send times based on when individual prospects are most likely to engage. A/B testing runs continuously, with the AI automatically shifting volume toward better-performing subject lines and message variants.
            </p>

            <h3>LinkedIn Automation</h3>
            <p>
              Automated connection requests and messages extend reach to prospects who don't respond to email. The AI can personalize connection notes based on shared connections, mutual interests, or recent activity.
            </p>

            <h3>SMS Outreach</h3>
            <p>
              For high-priority prospects or time-sensitive follow-ups, text messages cut through inbox noise. SMS works particularly well for meeting confirmations and day-of reminders.
            </p>

            <h3>Direct Mail Automation</h3>
            <p>
              Physical mail stands out precisely because it's uncommon. AI can trigger personalized postcards or packages based on digital behavior--a prospect who viewed your pricing page might receive a handwritten note within 48 hours.
            </p>

            <h2>AI-Powered Personalization at Scale</h2>

            <p>
              Generic templates get ignored. Truly personalized outreach gets responses. The challenge has always been that personalization takes time--time most sales teams don't have when they're trying to reach hundreds of prospects per week.
            </p>

            <p>
              AI solves this by generating personalized content at scale. The AI learns your brand voice, then writes messages that reference prospect-specific details: their company's recent funding round, the specific pages they viewed on your site, or the technology stack they're using.
            </p>

            <table>
              <thead>
                <tr>
                  <th>Traditional Outreach</th>
                  <th>AI-Powered Personalization</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Generic templates with name/company merge fields</td>
                  <td>Dynamic copy referencing specific prospect context</td>
                </tr>
                <tr>
                  <td>Manual research taking 15-20 minutes per prospect</td>
                  <td>Automated research completed in seconds</td>
                </tr>
                <tr>
                  <td>Same message to everyone in a segment</td>
                  <td>Tailored by industry, role, behavior, and intent signals</td>
                </tr>
                <tr>
                  <td>Static sequences that don't adapt</td>
                  <td>Messages that evolve based on prospect engagement</td>
                </tr>
              </tbody>
            </table>

            <h2>Data and Enrichment That Power AI Sales Engagement</h2>

            <p>AI is only as effective as the data feeding it. Incomplete or stale records lead to irrelevant outreach and wasted effort.</p>

            <h3>Firmographic and Demographic Data</h3>
            <p>
              Firmographics describe the company: industry, employee count, annual revenue, headquarters location, funding stage. Demographics describe the individual: job title, seniority level, department, reporting structure. Together, they determine whether a prospect matches your ideal customer profile.
            </p>

            <h3>Technographic Data</h3>
            <p>
              Knowing what tools a company uses enables highly relevant outreach. If you're selling a Salesforce integration, prospects already using Salesforce are warmer than those on a competing CRM. Technographic data also reveals competitive displacement opportunities.
            </p>

            <h3>Intent Signals and Behavior Data</h3>
            <p>
              Intent signals indicate active buying interest. First-party signals come from your own website--pricing page visits, multiple sessions in a week, demo page engagement. Third-party signals come from research behavior across the broader web. Combining both gives you the clearest picture of who's ready to buy.
            </p>

            <h3>Real-Time Enrichment and Verification</h3>
            <p>
              Batch enrichment that runs overnight means you're reaching out to prospects hours after their interest peaked. Real-time enrichment ensures records are complete and verified the moment they're identified. Email verification is particularly important--sending to invalid addresses damages your sender reputation and wastes outreach capacity.
            </p>

            <h2>Integrations for Your Sales Tech Stack</h2>

            <p>An AI sales engagement platform that doesn't connect to your existing tools creates data silos and manual work. Native integrations ensure data flows automatically between systems.</p>

            <h3>CRM Platforms</h3>
            <p>
              Two-way sync with Salesforce, HubSpot, Pipedrive, and other CRMs keeps records current in both directions. When a prospect is identified, they appear in your CRM. When a rep updates a record in the CRM, that change flows back to the engagement platform.
            </p>

            <h3>Marketing Automation Tools</h3>
            <p>
              Connections to Klaviyo, Marketo, ActiveCampaign, and similar platforms enable coordinated campaigns. A prospect identified through visitor tracking can be added to nurture sequences, retargeting audiences, and sales outreach simultaneously.
            </p>

            <h3>Ad Platforms and Retargeting</h3>
            <p>
              Identified visitors can be pushed to LinkedIn Ads, Google Ads, and Meta for retargeting. This ensures your ad spend targets companies that have already shown interest rather than cold audiences.
            </p>

            <h3>Communication and Collaboration Tools</h3>
            <p>
              Slack notifications alert reps when high-intent prospects are identified. Calendar integrations enable AI agents to book meetings directly. Cursive offers 200+ native integrations covering the full B2B tech stack.
            </p>

            <h2>Pipeline Visibility and Revenue Attribution</h2>

            <p>Activity without attribution is just noise. AI sales engagement platforms connect outreach activity to pipeline and revenue outcomes so you can see what's actually working.</p>

            <ul>
              <li><strong>Activity tracking:</strong> Emails sent, opens, clicks, replies, meetings booked</li>
              <li><strong>Pipeline attribution:</strong> Which touches influenced which deals, with multi-touch attribution models</li>
              <li><strong>ROI reporting:</strong> Connect platform spend to revenue generated, calculating true cost per meeting and cost per opportunity</li>
            </ul>

            <h2>AI Sales Engagement Pricing Models</h2>

            <p>Pricing varies significantly across platforms. Understanding common models helps you compare options and predict costs as you scale.</p>

            <h3>Per-Lead and Credit-Based Pricing</h3>
            <p>
              Pay-as-you-go models charge per identified visitor, per enriched record, or per contact unlocked. This model offers flexibility with no long-term commitment--you pay for what you use. Cursive's Lead Marketplace, for example, starts at $0.60 per lead with credits that never expire.
            </p>

            <h3>Tiered Subscription Plans</h3>
            <p>
              Monthly or annual plans based on volume: visitors identified, emails sent, contacts enriched, or seats. Tiers typically start around $500-1,000/month for smaller teams and scale higher for enterprise usage.
            </p>

            <h3>Done-for-You Managed Services</h3>
            <p>
              Fully managed options where the vendor runs campaigns and delivers booked meetings. Pricing often includes a base fee plus per-meeting charges. This model works well for teams that want results without building internal expertise.
            </p>

            <h2>Turn Website Traffic into Booked Meetings with Cursive</h2>

            <p>
              Cursive combines visitor identification, real-time enrichment, and AI-powered outreach into a single platform that runs autonomously. The workflow is straightforward: identify who's on your site, enrich them into complete records, and activate personalized outreach while interest is high.
            </p>

            <p>
              Most teams lose the majority of demand they've already paid for because visitors browse and leave without filling out forms. Cursive closes that gap by identifying up to 70% of B2B traffic and triggering multi-channel outreach--email, LinkedIn, SMS, even direct mail--within hours of a visit. AI agents handle follow-ups and meeting scheduling 24/7, converting anonymous interest into active pipeline without adding manual work.
            </p>

            <h2>Frequently Asked Questions About AI Sales Engagement</h2>

            <h3>How long does it take to implement an AI sales engagement platform?</h3>
            <p>
              Most platforms can be implemented within days. Pixel installation typically takes 5-10 minutes, and CRM integrations complete within hours. Cursive's setup delivers verified leads in your CRM within 48 hours of installation.
            </p>

            <h3>Is AI replacing sales reps?</h3>
            <p>
              AI handles repetitive prospecting and outreach tasks--the work that consumes the majority of a typical SDR's day. This frees sales reps to focus on closing deals and building relationships. Teams using AI sales engagement often see reps handling more pipeline, not fewer reps employed.
            </p>

            <h3>How does AI sales engagement ensure email deliverability?</h3>
            <p>
              Platforms use dedicated sending infrastructure, domain warm-up protocols, and real-time email verification to maintain sender reputation.
            </p>

            <h3>What compliance standards do AI sales engagement platforms follow?</h3>
            <p>
              Reputable platforms comply with GDPR, CCPA, and CAN-SPAM regulations. This includes honoring opt-out requests, maintaining data handling policies, and providing transparency about data sources. Cursive operates with a privacy-first approach and maintains strict compliance across all major regulations.
            </p>

            <h3>Can AI sales engagement platforms identify anonymous website visitors?</h3>
            <p>
              Yes. Platforms use IP intelligence, device fingerprinting, and identity graphs to match anonymous visitors to contact records. Cursive identifies up to 70% of B2B website visitors without requiring form fills.
            </p>

            <h3>What is the difference between an AI SDR and traditional sales engagement tools?</h3>
            <p>
              Traditional tools automate sending sequences but require manual setup, research, and monitoring. AI SDRs autonomously research prospects, write personalized messages, handle replies, and book meetings. The AI makes decisions that previously required human judgment.
            </p>
          </article>
        </Container>
      </section>

      {/* CTA Section */}
      <SimpleRelatedPosts posts={relatedPosts} />
      <DashboardCTA
        headline="See AI Sales Engagement"
        subheadline="in Action"
        description="Cursive identifies website visitors, enriches them in real-time, and runs AI-powered outreach across email, LinkedIn, and SMS to book meetings on autopilot."
      />

      {/* Related Posts */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <Container>
          <h2 className="text-3xl font-bold mb-8 text-center">Read Next</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Link href="/blog/best-ai-sales-assistants" className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="font-bold mb-2">12 Best AI Sales Assistants</h3>
              <p className="text-sm text-gray-600">Platforms compared with pricing</p>
            </Link>
            <Link href="/blog/cold-email-2026" className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="font-bold mb-2">Cold Email Best Practices 2026</h3>
              <p className="text-sm text-gray-600">What's working and what's dead</p>
            </Link>
            <Link href="/blog/best-ai-sdr-tools-2026" className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="font-bold mb-2">Best AI SDR Tools for 2026</h3>
              <p className="text-sm text-gray-600">9 platforms ranked and compared</p>
            </Link>
          </div>
        </Container>
      </section>
      </HumanView>

      <MachineView>
        <MachineContent>
          <h1 className="text-2xl font-bold mb-4">Cursive: AI Sales Engagement Platform</h1>

          <p className="text-gray-700 mb-6">
            Complete guide to AI sales engagement platforms covering prospecting automation, multi-channel outreach, visitor identification, and meeting booking. Published: April 3, 2026. Reading time: 9 minutes.
          </p>

          <MachineSection title="Traditional vs AI Sales Engagement">
            <MachineList items={[
              "Traditional: Sequences emails automatically but requires manual research, message writing, and lead prioritization",
              "AI-powered: Handles full workflow from identifying prospects to booking meetings with minimal human input",
              "Key difference: Traditional tools follow rules you set; AI platforms make decisions based on data patterns"
            ]} />
          </MachineSection>

          <MachineSection title="Core Platform Capabilities">
            <MachineList items={[
              "Lead discovery - AI scans 100M+ B2B profiles to surface ICP matches continuously",
              "Automated outreach sequences - multi-step, multi-channel campaigns without manual intervention",
              "AI-driven follow-ups - agents handle replies, answer questions, and book meetings on rep calendars",
              "Behavior-triggered workflows - adapt sequences based on prospect actions (pricing page visits, email opens)",
              "Real-time data enrichment - firmographic, technographic, and contact data added instantly on identification"
            ]} />
          </MachineSection>

          <MachineSection title="How AI SDR Agents Work">
            <MachineList items={[
              "Step 1: Monitor intent signals (website visits, content downloads, third-party research behavior)",
              "Step 2: Research and enrich contacts in seconds (company news, funding, tech stack, LinkedIn profiles)",
              "Step 3: Generate personalized messaging referencing specific prospect context (not mail-merge)",
              "Step 4: Execute multi-channel sequences (email, LinkedIn, SMS, direct mail) with dynamic channel selection",
              "Step 5: Handle replies and book meetings directly on sales rep calendars"
            ]} />
          </MachineSection>

          <MachineSection title="Visitor Identification">
            <MachineList items={[
              "Only 2-3% of B2B website visitors convert through forms - 97% leave anonymously",
              "Identification uses IP intelligence, device fingerprinting, email graph matching, and third-party data",
              "Cursive identifies up to 70% of B2B website visitors vs 20-30% for most tools",
              "Records enriched and pushed to CRM within seconds for real-time outreach activation"
            ]} />
          </MachineSection>

          <MachineSection title="Multi-Channel Outreach">
            <MachineList items={[
              "Email sequences - AI-optimized send times, continuous A/B testing, auto-shifting to top performers",
              "LinkedIn automation - personalized connection requests based on shared connections and activity",
              "SMS outreach - high-priority prospects and time-sensitive follow-ups cut through inbox noise",
              "Direct mail - AI-triggered personalized packages based on digital behavior"
            ]} />
          </MachineSection>

          <MachineSection title="Data and Enrichment Layers">
            <MachineList items={[
              "Firmographic: industry, employee count, revenue, headquarters, funding stage",
              "Demographic: job title, seniority, department, reporting structure",
              "Technographic: tools used, competitive displacement opportunities",
              "Intent signals: first-party (pricing page visits) + third-party (web research behavior)",
              "Real-time verification: ensures records are complete and email addresses valid on identification"
            ]} />
          </MachineSection>

          <MachineSection title="Integration Ecosystem">
            <MachineList items={[
              "CRM: two-way sync with Salesforce, HubSpot, Pipedrive",
              "Marketing automation: Klaviyo, Marketo, ActiveCampaign",
              "Ad platforms: LinkedIn Ads, Google Ads, Meta retargeting",
              "Collaboration: Slack notifications, calendar integration for AI meeting booking",
              "Cursive: 200+ native integrations covering full B2B tech stack"
            ]} />
          </MachineSection>

          <MachineSection title="Pricing Models">
            <MachineList items={[
              "Per-lead/credit-based: pay per identified visitor or enriched record (Cursive starts at $0.60/lead)",
              "Tiered subscription: $500-1,000+/month based on volume (visitors, emails, contacts, seats)",
              "Done-for-you managed services: base fee + per-meeting charges, vendor runs campaigns"
            ]} />
          </MachineSection>

          <MachineSection title="Related Resources">
            <MachineList items={[
              { label: "The 12 Best AI Sales Assistants for 2026", href: "/blog/best-ai-sales-assistants", description: "Compare platforms with pricing and features" },
              { label: "Cold Email Best Practices for 2026", href: "/blog/cold-email-2026", description: "Proven strategies for deliverability and personalization" },
              { label: "Best AI SDR Tools for 2026", href: "/blog/best-ai-sdr-tools-2026", description: "9 AI SDR platforms ranked and compared" }
            ]} />
          </MachineSection>

          <MachineSection title="Get Started with Cursive">
            <p className="text-gray-700 mb-3">
              Cursive combines visitor identification, real-time enrichment, and AI-powered outreach into one platform. Identifies up to 70% of B2B traffic and triggers multi-channel outreach within hours of a visit.
            </p>
            <MachineList items={[
              { label: "Platform Overview", href: "/platform", description: "Visitor identification, intent data, AI outreach" },
              { label: "Pricing", href: "/pricing", description: "Self-serve marketplace + done-for-you services" },
              { label: "Book a Demo", href: "/book", description: "See Cursive in action" }
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
