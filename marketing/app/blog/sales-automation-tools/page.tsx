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
  { title: "Outbound Sales Outreach: The Complete Guide for 2026", description: "Step-by-step outbound process from ICP definition through multi-channel execution.", href: "/blog/outbound-sales-outreach" },
  { title: "12 Best Outreach Platforms for 2026", description: "Compare 12 leading outreach platforms by pricing, features, and use case.", href: "/blog/best-outreach-platforms" },
  { title: "Best AI SDR Tools for 2026", description: "9 AI SDR platforms ranked and compared with pricing.", href: "/blog/best-ai-sdr-tools-2026" },
]

export default function BlogPost() {
  return (
    <main>
      <StructuredData data={generateBlogPostSchema({
        title: "Best Sales Automation Tools in 2026: 15 Platforms We Tested",
        description: "We tested 15 sales automation platforms across prospecting, outreach, CRM management, and conversation intelligence. See pricing, features, and which tool fits your workflow.",
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
              Sales Outreach
            </div>
            <h1 className="text-5xl font-bold mb-6">
              Best Sales Automation Tools in 2026: 15 Platforms We Tested
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Your sales reps spend 72% of their time on tasks that don't involve selling. We tested 15 platforms to help you find the right fit.
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
              Your sales reps spend 72% of their time on tasks that don't involve selling. Data entry, prospect research, follow-up scheduling, CRM updates -- it adds up to hours every day that could be spent in actual conversations.
            </p>

            <p>
              Sales automation tools handle that repetitive work so your team can focus on closing deals. We tested 15 platforms across prospecting, outreach, CRM management, and conversation intelligence to help you find the right fit for your workflow and budget.
            </p>

            <h2>What Sales Automation Software Actually Does</h2>

            <p>
              Sales automation tools handle the repetitive work that eats up your reps' time -- lead generation, data entry, email follow-ups, and CRM updates. According to Salesforce's State of Sales report, reps spend just 28% of their time actually selling. The rest goes to admin tasks, research, and manual data logging.
            </p>

            <p>
              The best platforms now use AI to personalize outreach at scale. Instead of blasting the same template to 500 prospects, AI-powered tools research each account, write relevant messaging, and adjust follow-up timing based on engagement.
            </p>

            <p>Here's what sales automation typically covers:</p>

            <ul>
              <li><strong>Lead generation and prospecting:</strong> Finding contact data, verifying emails, and importing prospects into your CRM automatically</li>
              <li><strong>Data entry automation:</strong> Populating CRM fields from form fills, email signatures, and enrichment sources</li>
              <li><strong>Email and sequence automation:</strong> Triggering personalized outreach based on prospect behavior, then managing follow-ups until a reply or meeting</li>
              <li><strong>CRM synchronization:</strong> Keeping records current across your stack in real-time</li>
            </ul>

            <h2>Best Sales Automation Tools Compared</h2>

            <div className="not-prose overflow-x-auto my-8">
              <table className="min-w-full text-sm border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-semibold">Tool</th>
                    <th className="text-left p-3 font-semibold">Best For</th>
                    <th className="text-left p-3 font-semibold">Key Strength</th>
                    <th className="text-left p-3 font-semibold">Starting Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr><td className="p-3 font-medium">Cursive</td><td className="p-3">Visitor ID + automated outreach</td><td className="p-3">Identifies anonymous traffic, triggers AI outreach in hours</td><td className="p-3">$1,000/mo</td></tr>
                  <tr><td className="p-3 font-medium">Apollo.io</td><td className="p-3">Prospecting and B2B database</td><td className="p-3">275M+ contacts with built-in sequencing</td><td className="p-3">Free tier</td></tr>
                  <tr><td className="p-3 font-medium">HubSpot Sales Hub</td><td className="p-3">All-in-one CRM</td><td className="p-3">Pipeline management, email sequences, lead scoring</td><td className="p-3">Free tier</td></tr>
                  <tr><td className="p-3 font-medium">Salesforce Sales Cloud</td><td className="p-3">Enterprise customization</td><td className="p-3">Deep workflow automation, extensive integrations</td><td className="p-3">$25/user/mo</td></tr>
                  <tr><td className="p-3 font-medium">Outreach</td><td className="p-3">Sales engagement at scale</td><td className="p-3">AI-driven forecasting and seller productivity</td><td className="p-3">Custom</td></tr>
                  <tr><td className="p-3 font-medium">Reply.io</td><td className="p-3">Multichannel sequences</td><td className="p-3">Email, LinkedIn, SMS in unified workflows</td><td className="p-3">$59/user/mo</td></tr>
                  <tr><td className="p-3 font-medium">Pipedrive</td><td className="p-3">Visual pipeline management</td><td className="p-3">Intuitive deal tracking for small teams</td><td className="p-3">$14/user/mo</td></tr>
                  <tr><td className="p-3 font-medium">Clay</td><td className="p-3">Lead research and enrichment</td><td className="p-3">Pulls data from 75+ sources automatically</td><td className="p-3">$149/mo</td></tr>
                  <tr><td className="p-3 font-medium">Instantly</td><td className="p-3">High-volume cold email</td><td className="p-3">Unlimited email accounts, built-in warmup</td><td className="p-3">$37/mo</td></tr>
                  <tr><td className="p-3 font-medium">Regie.ai</td><td className="p-3">AI content generation</td><td className="p-3">Enterprise-scale prospecting content</td><td className="p-3">Custom</td></tr>
                  <tr><td className="p-3 font-medium">ZoomInfo</td><td className="p-3">B2B contact data</td><td className="p-3">Intent signals and org charts</td><td className="p-3">Custom</td></tr>
                  <tr><td className="p-3 font-medium">Gong</td><td className="p-3">Conversation intelligence</td><td className="p-3">Call analysis and deal insights</td><td className="p-3">Custom</td></tr>
                  <tr><td className="p-3 font-medium">Klenty</td><td className="p-3">Sales engagement sequences</td><td className="p-3">Strong CRM sync for mid-market</td><td className="p-3">$50/user/mo</td></tr>
                  <tr><td className="p-3 font-medium">LinkedIn Sales Navigator</td><td className="p-3">Social selling</td><td className="p-3">Account-based prospecting on LinkedIn</td><td className="p-3">$99/mo</td></tr>
                  <tr><td className="p-3 font-medium">Lemlist</td><td className="p-3">Personalized cold outreach</td><td className="p-3">Dynamic images and video in emails</td><td className="p-3">$59/mo</td></tr>
                </tbody>
              </table>
            </div>

            <h2>15 Best Sales Automation Platforms by Use Case</h2>

            <h3>Cursive</h3>
            <p>
              Cursive combines visitor identification with AI-powered outreach. When someone visits your website, Cursive identifies up to 70% of that anonymous traffic, enriches records with verified contact data, and triggers personalized email, LinkedIn, and SMS sequences within hours.
            </p>
            <p>
              The platform includes 200+ native integrations, so identified visitors flow directly into your CRM. For teams that want hands-off execution, Cursive also offers done-for-you services where their team runs campaigns and books meetings on your behalf.
            </p>
            <p><strong>Best for:</strong> Teams losing pipeline to anonymous website visitors who never fill out forms.</p>

            <h3>Apollo.io</h3>
            <p>
              Apollo.io gives you access to 275M+ contacts and a built-in sequencing tool. You can build targeted lists, verify emails in real-time, and launch outbound campaigns without leaving the platform. The free tier is generous enough for small teams to test the workflow.
            </p>
            <p><strong>Best for:</strong> Teams that want prospecting data and outreach in one platform.</p>

            <h3>HubSpot Sales Hub</h3>
            <p>
              HubSpot Sales Hub works best when you're already in the HubSpot ecosystem. The CRM is free, and sales automation features like email sequences, meeting scheduling, and AI-powered lead scoring layer on top. The learning curve is gentle, and native marketing integration means sales and marketing work from the same data.
            </p>
            <p><strong>Best for:</strong> Teams wanting an all-in-one CRM with built-in automation.</p>

            <h3>Salesforce Sales Cloud</h3>
            <p>
              Salesforce remains the default for enterprise teams with complex workflows. The customization depth is unmatched -- custom objects, approval processes, territory management, and integrations with nearly every tool. That flexibility comes with complexity, though. Implementation typically takes weeks, not days.
            </p>
            <p><strong>Best for:</strong> Large teams requiring deep customization and enterprise-grade security.</p>

            <h3>Outreach</h3>
            <p>
              Outreach is an AI-driven revenue platform focused on sales engagement and forecasting. It helps reps manage sequences, track engagement, and prioritize accounts based on buying signals. Pricing is custom and typically enterprise-focused.
            </p>
            <p><strong>Best for:</strong> Revenue teams focused on forecasting accuracy and rep productivity.</p>

            <h3>Reply.io</h3>
            <p>
              Reply.io handles multichannel sequences across email, LinkedIn, SMS, and calls in a single workflow. You can set up automated LinkedIn connection requests that trigger email follow-ups if there's no response. The interface is straightforward, and pricing is accessible for growing teams.
            </p>
            <p><strong>Best for:</strong> Teams running multichannel outbound sequences.</p>

            <h3>Pipedrive</h3>
            <p>
              Pipedrive is a visual, intuitive CRM designed for small-to-midsize sales teams. The drag-and-drop pipeline makes deal tracking simple, and automation features handle routine tasks like follow-up reminders and activity logging.
            </p>
            <p><strong>Best for:</strong> Small teams wanting simple pipeline management without complexity.</p>

            <h3>Clay</h3>
            <p>
              Clay pulls prospect data from 75+ sources automatically. Instead of manually checking LinkedIn, company websites, and news articles, Clay aggregates everything into enriched lead profiles that flow directly into your outreach tools.
            </p>
            <p><strong>Best for:</strong> Teams that prioritize deep prospect research before outreach.</p>

            <h3>Instantly</h3>
            <p>
              Instantly focuses on high-volume cold email with unlimited sending accounts and built-in email warmup. The platform helps you scale outreach without destroying deliverability. Setup is fast, and pricing is straightforward.
            </p>
            <p><strong>Best for:</strong> Teams scaling cold email campaigns.</p>

            <h3>Regie.ai</h3>
            <p>
              Regie.ai generates AI-powered prospecting content at enterprise scale. The platform learns your brand voice and produces email sequences, LinkedIn messages, and call scripts that sound like your team wrote them.
            </p>
            <p><strong>Best for:</strong> Enterprise teams generating high volumes of prospecting content.</p>

            <h3>ZoomInfo</h3>
            <p>
              ZoomInfo is a foundational B2B data platform with contact information, org charts, and intent signals. Many sales automation tools pull from ZoomInfo's database, but accessing it directly gives you the freshest data and most granular filtering.
            </p>
            <p><strong>Best for:</strong> Teams that want high-quality B2B contact data and intent signals.</p>

            <h3>Gong</h3>
            <p>
              Gong analyzes sales conversations -- calls, emails, meetings -- to surface insights about what's working and what's not. It identifies deal risks, coaching opportunities, and patterns across your entire sales organization.
            </p>
            <p><strong>Best for:</strong> Teams focused on conversation intelligence and sales coaching.</p>

            <h3>Klenty</h3>
            <p>
              Klenty is a sales engagement platform with strong CRM synchronization. It handles email sequences, call tasks, and LinkedIn outreach while keeping your CRM updated in real-time. The bi-directional sync is particularly robust.
            </p>
            <p><strong>Best for:</strong> Mid-market teams wanting tight CRM integration with their sequences.</p>

            <h3>LinkedIn Sales Navigator</h3>
            <p>
              Sales Navigator is LinkedIn's premium prospecting tool. It surfaces leads based on your ICP criteria, tracks account activity, and integrates with CRMs to log engagement. It's not a standalone automation tool, but it's essential for account-based or social selling motions.
            </p>
            <p><strong>Best for:</strong> Teams running account-based prospecting on LinkedIn.</p>

            <h3>Lemlist</h3>
            <p>
              Lemlist specializes in personalized cold outreach with dynamic images and videos. You can automatically insert prospect-specific visuals into emails -- like their LinkedIn photo on a coffee mug or their company logo on a billboard.
            </p>
            <p><strong>Best for:</strong> Teams prioritizing creative, highly personalized cold outreach.</p>

            <h2>What to Look for in Sales Automation Software</h2>

            <h3>Lead Enrichment and Data Verification</h3>
            <p>
              Bounced emails hurt your sender reputation and waste rep time. Look for tools that automatically verify contact data before outreach and enrich records with firmographic details like company size, industry, and tech stack.
            </p>

            <h3>Multichannel Outreach Capabilities</h3>
            <p>
              Email-only sequences underperform compared to multichannel approaches. The best platforms coordinate outreach across email, LinkedIn, SMS, and phone -- adjusting the sequence based on where prospects engage.
            </p>

            <h3>CRM and Tech Stack Integrations</h3>
            <p>
              Fragmented tools create data silos. Prioritize platforms with native, two-way sync to your CRM. Real-time updates matter more than overnight batch syncs, especially for fast-moving sales cycles.
            </p>

            <h3>AI-Powered Personalization</h3>
            <p>
              True AI personalization goes beyond mail-merge fields. Look for tools that research prospects, generate relevant messaging, and adapt based on engagement -- without requiring manual input for each contact.
            </p>

            <h3>Intent Data and Lead Scoring</h3>
            <p>
              Intent data reveals which accounts are actively researching solutions like yours. Combined with lead scoring, it helps reps prioritize outreach to prospects most likely to convert.
            </p>

            <h2>Benefits of Sales Automation Tools</h2>

            <ul>
              <li><strong>Reduced manual tasks:</strong> Reps spend less time on data entry and more time in conversations</li>
              <li><strong>Faster lead response:</strong> Automated triggers ensure follow-up within minutes, not hours</li>
              <li><strong>Personalization at scale:</strong> AI enables one-to-one messaging for every prospect without manual research</li>
              <li><strong>Increased pipeline without headcount:</strong> Automation handles volume that would otherwise require hiring additional SDRs</li>
              <li><strong>Improved CRM data quality:</strong> Automatic synchronization keeps records accurate without relying on reps to log activities</li>
            </ul>

            <h2>How to Automate Your Sales Process</h2>

            <h3>1. Audit your current sales workflow</h3>
            <p>
              Start by mapping where your reps spend time on repetitive, low-value tasks. Common culprits include manual CRM updates, prospect research, follow-up scheduling, and lead assignment.
            </p>

            <h3>2. Identify high-impact automation opportunities</h3>
            <p>
              Prioritize tasks with the highest time cost and lowest complexity. Follow-up emails, CRM data entry, and lead routing are typically the fastest wins.
            </p>

            <h3>3. Select tools that integrate with your stack</h3>
            <p>
              New tools that don't connect to your existing CRM create more problems than they solve. Verify native integrations before committing.
            </p>

            <h3>4. Start with one channel before expanding</h3>
            <p>
              Master automation on email before adding LinkedIn, SMS, or phone. A phased approach reduces rollout friction and helps you identify what's working.
            </p>

            <h3>5. Measure results and iterate</h3>
            <p>
              Track response rates, meetings booked, and pipeline generated. Use the data to adjust sequences, timing, and targeting continuously.
            </p>

            <h2>Common Sales Automation Mistakes to Avoid</h2>

            <ul>
              <li><strong>Automating before defining your ICP:</strong> Automation amplifies whatever you feed it. If your targeting is off, you'll scale bad outreach faster. Define your Ideal Customer Profile before automating anything.</li>
              <li><strong>Ignoring deliverability and compliance:</strong> Neglecting email hygiene damages sender reputation and creates legal risk. Use tools with built-in compliance features for CAN-SPAM, GDPR, and CCPA.</li>
              <li><strong>Over-relying on AI without human review:</strong> AI-generated content can miss context or brand voice. Always have humans review outreach before it scales, especially in the early stages.</li>
              <li><strong>Skipping CRM integration:</strong> Disconnected tools create duplicate records, missed follow-ups, and incomplete reporting. Prioritize platforms with deep, reliable CRM sync from day one.</li>
            </ul>

            <h2>Convert Website Visitors into Pipeline with Automated Outreach</h2>

            <p>
              Most B2B websites convert just 2-3% of traffic. The other 97% browse, compare, and leave without filling out a form. That's demand you already paid for -- disappearing.
            </p>

            <p>
              Visitor identification combined with automated outreach closes the gap. By identifying the companies visiting your site and triggering personalized sequences while interest is high, you turn anonymous traffic into qualified pipeline.
            </p>

            <h2>FAQs About Sales Automation Tools</h2>

            <h3>How do sales automation tools handle GDPR and CAN-SPAM compliance?</h3>
            <p>
              Most platforms include opt-out handling, consent tracking, and Do-Not-Contact list integration. Configuration responsibility falls on your team, so verify that any tool you choose supports the specific regulations in your target markets.
            </p>

            <h3>What is the difference between sales automation and an AI SDR?</h3>
            <p>
              Sales automation handles pre-defined tasks like sending email sequences. An AI SDR autonomously researches prospects, writes personalized outreach, handles objections, and schedules meetings -- without requiring human input for each action.
            </p>

            <h3>Can sales automation tools reach website visitors who never filled out a form?</h3>
            <p>
              Yes. Visitor identification tools use IP intelligence, device fingerprinting, and data matching to reveal anonymous companies visiting your site. From there, they surface decision-maker contacts and trigger automated outreach sequences.
            </p>

            <h3>How long does it typically take to see ROI from sales automation software?</h3>
            <p>
              Most teams see measurable pipeline impact within 30-90 days. The timeline depends on implementation complexity, existing process maturity, and team adoption rate.
            </p>

            <h2>About the Author</h2>
            <p>
              <strong>Adam Wolfe</strong> is the founder of Cursive. He's run 500+ cold email campaigns
              generating $50M+ in pipeline for B2B companies.
            </p>
          </article>
        </Container>
      </section>

      {/* CTA Section */}
      <SimpleRelatedPosts posts={relatedPosts} />
      <DashboardCTA
        headline="Stop Losing Pipeline to"
        subheadline="Anonymous Website Visitors"
        description="Cursive identifies up to 70% of your anonymous B2B traffic and triggers personalized outreach within hours. See how sales automation actually works."
      />
      </HumanView>

      <MachineView>
        <MachineContent>
          <h1 className="text-2xl font-bold mb-4">Best Sales Automation Tools in 2026: 15 Platforms We Tested</h1>

          <p className="text-gray-700 mb-6">
            Comprehensive comparison of 15 sales automation platforms tested across prospecting, outreach, CRM management, and conversation intelligence. Published: April 3, 2026. Reading time: 9 minutes.
          </p>

          <MachineSection title="Key Takeaways">
            <MachineList items={[
              "Sales reps spend 72% of their time on non-selling tasks (data entry, research, CRM updates)",
              "Only 28% of rep time goes to actual selling according to Salesforce State of Sales report",
              "AI-powered tools now research accounts, write messaging, and adjust follow-up timing automatically",
              "Visitor identification closes the 97% gap of B2B traffic that leaves without filling a form",
              "Best-in-class platforms combine data enrichment, multi-channel outreach, and CRM sync in one tool"
            ]} />
          </MachineSection>

          <MachineSection title="Top 15 Tools Quick Comparison">
            <MachineList items={[
              "Cursive ($1,000/mo) - Visitor ID + automated outreach, identifies anonymous traffic and triggers AI outreach",
              "Apollo.io (Free tier) - 275M+ contacts with built-in sequencing for prospecting and outreach",
              "HubSpot Sales Hub (Free tier) - All-in-one CRM with pipeline management, sequences, lead scoring",
              "Salesforce Sales Cloud ($25/user/mo) - Enterprise customization with deep workflow automation",
              "Outreach (Custom) - AI-driven forecasting and seller productivity at scale",
              "Reply.io ($59/user/mo) - Multichannel sequences across email, LinkedIn, SMS",
              "Pipedrive ($14/user/mo) - Visual pipeline management for small teams",
              "Clay ($149/mo) - Lead research pulling from 75+ data sources",
              "Instantly ($37/mo) - High-volume cold email with unlimited accounts and warmup",
              "Regie.ai (Custom) - Enterprise AI content generation for prospecting",
              "ZoomInfo (Custom) - B2B contact data with intent signals and org charts",
              "Gong (Custom) - Conversation intelligence and deal insights",
              "Klenty ($50/user/mo) - Sales engagement with strong CRM sync",
              "LinkedIn Sales Navigator ($99/mo) - Account-based prospecting on LinkedIn",
              "Lemlist ($59/mo) - Personalized outreach with dynamic images and video"
            ]} />
          </MachineSection>

          <MachineSection title="What to Look For in Sales Automation Software">
            <MachineList items={[
              "Lead enrichment and data verification - verify contacts before outreach, enrich with firmographic data",
              "Multichannel outreach - coordinate email, LinkedIn, SMS, phone in unified sequences",
              "CRM and tech stack integrations - native two-way sync with real-time updates",
              "AI-powered personalization - research prospects and generate relevant messaging automatically",
              "Intent data and lead scoring - prioritize accounts actively researching your category",
              "Real-time lead delivery - reach prospects while interest is highest"
            ]} />
          </MachineSection>

          <MachineSection title="Common Mistakes to Avoid">
            <MachineList items={[
              "Automating before defining ICP - scales bad outreach faster",
              "Ignoring deliverability and compliance - damages sender reputation, creates legal risk",
              "Over-relying on AI without human review - misses context and brand voice",
              "Skipping CRM integration - creates duplicate records, missed follow-ups, incomplete reporting"
            ]} />
          </MachineSection>

          <MachineSection title="How Cursive Helps">
            <p className="text-gray-700 mb-3">
              Cursive combines visitor identification with AI-powered outreach automation. The platform identifies up to 70% of anonymous B2B website traffic, enriches visitors into complete contact records, and triggers personalized sequences within hours.
            </p>
            <MachineList items={[
              "Visitor identification - reveal anonymous website visitors showing intent",
              "AI-powered personalization - research prospects and write relevant messaging at scale",
              "Multi-channel sequences - email, LinkedIn, SMS, and direct mail automation",
              "200+ native CRM integrations - identified visitors flow directly into your CRM",
              "Done-for-you services - Cursive's team runs campaigns and books meetings on your behalf"
            ]} />
          </MachineSection>

          <MachineSection title="Related Resources">
            <MachineList items={[
              { label: "Outbound Sales Outreach Guide", href: "/blog/outbound-sales-outreach", description: "Complete outbound process from ICP to execution" },
              { label: "Best Outreach Platforms for 2026", href: "/blog/best-outreach-platforms", description: "12 platforms compared by pricing and features" },
              { label: "Best AI SDR Tools for 2026", href: "/blog/best-ai-sdr-tools-2026", description: "9 AI SDR platforms ranked and compared" }
            ]} />
          </MachineSection>

          <MachineSection title="Get Started with Cursive">
            <p className="text-gray-700 mb-3">
              Stop losing pipeline to anonymous website visitors. Cursive identifies who's on your site, enriches them into actionable leads, and triggers personalized outreach while intent is high.
            </p>
            <MachineList items={[
              { label: "Platform Overview", href: "/platform", description: "Visitor identification, intent data, AI outreach" },
              { label: "Pricing", href: "/pricing", description: "Self-serve marketplace + done-for-you services" },
              { label: "Visitor Identification", href: "/visitor-identification", description: "70% identification rate for B2B traffic" },
              { label: "Book a Demo", href: "/book", description: "See Cursive in real-time" }
            ]} />
          </MachineSection>

          <MachineSection title="About the Author">
            <p className="text-gray-700">
              Adam Wolfe is the founder of Cursive. He's run 500+ cold email campaigns generating $50M+ in pipeline for B2B companies.
            </p>
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
