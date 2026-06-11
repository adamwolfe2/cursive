"use client"

import { Container } from "@/components/ui/container"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { StructuredData } from "@/components/seo/structured-data"
import { generateFAQSchema } from "@/lib/seo/faq-schema"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { OrganizationSchema, ArticleSchema } from "@/components/schema/SchemaMarkup"
import Link from "next/link"
import {
  Zap, FileText, PenTool, Send, BarChart3,
  Mail, MailOpen, Package, Gift, BookOpen,
  Target, Users, RefreshCw, Repeat, Building2,
  MapPin, QrCode, Link2, Sparkles, ShieldCheck,
  Eye, Database, ArrowRight, type LucideIcon,
} from "lucide-react"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { GET_LEADS_URL, BOOKING_URL } from "@/lib/cta"

const EASE = [0.22, 1, 0.36, 1] as const

const faqs = [
  {
    question: "What is direct mail automation?",
    answer: "Direct mail automation uses software to trigger, personalize, and send physical mail pieces based on digital signals and behavioral data. Instead of manually planning and executing mail campaigns, automation platforms connect to your CRM and marketing tools to send postcards, letters, handwritten notes, and packages when specific events occur, such as a website visit, demo request, or contract renewal date."
  },
  {
    question: "How much does automated direct mail cost?",
    answer: "Costs vary by format and volume. Automated postcards typically cost $1.50-$3.50 per piece including printing and postage. Handwritten notes range from $3-$8 per piece. Lumpy mail and corporate gifts can cost $15-$100+ per piece. Platform fees range from $500-$2,000 per month for most mid-market solutions. Despite higher per-unit costs than digital channels, direct mail often delivers lower cost-per-acquisition due to significantly higher response rates."
  },
  {
    question: "What response rates can I expect from automated direct mail?",
    answer: "Response rates for automated direct mail significantly outperform digital channels. Triggered postcards average 2-5% response rates. Handwritten notes achieve 5-15% response rates. Lumpy mail and dimensional packages can reach 10-20% response rates. By comparison, cold email averages 1-3% and display advertising averages 0.1-0.5%. The key is targeting: response rates increase substantially when mail is triggered by behavioral signals like website visits or intent data."
  },
  {
    question: "How does direct mail automation integrate with digital marketing?",
    answer: "Modern direct mail platforms integrate with CRMs (Salesforce, HubSpot), marketing automation tools (Marketo, Pardot), and data platforms through native integrations and APIs. Direct mail can be embedded into multi-touch sequences alongside email, LinkedIn, and phone outreach. For example, after three unanswered emails, an automated postcard can be triggered to break through the digital noise, with tracking that feeds engagement data back into your CRM."
  },
  {
    question: "How long does it take for automated direct mail to arrive?",
    answer: "Delivery timelines depend on the mail format and class. First-class postcards and letters typically arrive within 3-5 business days. Standard mail takes 5-10 business days. Handwritten notes are printed and mailed within 1-2 business days and arrive in 3-5 days. Express packages can be delivered next-day for time-sensitive outreach. Most automation platforms provide tracking and estimated delivery dates so you can coordinate follow-up timing."
  },
  {
    question: "Is direct mail automation GDPR and CAN-SPAM compliant?",
    answer: "Direct mail operates under different regulations than email. In the US, the CAN-SPAM Act does not apply to physical mail; instead, direct mail is regulated by the USPS and FTC. In the EU, GDPR does apply to physical mail that uses personal data, meaning you need a lawful basis for processing. Most B2B direct mail falls under the legitimate interest basis. Always include an opt-out mechanism and honor suppression lists. Consult legal counsel for your specific use case."
  },
  {
    question: "Can I track the ROI of automated direct mail?",
    answer: "Yes, modern platforms offer multiple tracking mechanisms. Personalized URLs (PURLs) track web visits from mail recipients. Unique QR codes attribute conversions to specific mail pieces. Promo codes tied to campaigns measure redemption rates. CRM integration tracks downstream pipeline and revenue. Most platforms provide dashboards showing delivery confirmation, response rates, cost per response, and ROI by campaign, segment, and mail format."
  },
  {
    question: "What is the best direct mail format for B2B outreach?",
    answer: "The optimal format depends on your goals and audience. For initial awareness and high-volume outreach, postcards offer the best cost-per-impression. For executive-level outreach and account-based marketing, handwritten notes deliver the highest open and response rates. For sales development, dimensional mailers that include a small gift create a reciprocity effect that increases meeting booking rates by 3-5x compared to email alone. Test multiple formats to find what works best for your specific ICP."
  },
  {
    question: "Where does Cursive fit with direct mail automation?",
    answer: "Cursive does not send mail. We supply the verified identities and mailing addresses that make direct mail automation work. The Visitor Pixel ($97/mo) resolves 40–60% of your anonymous website traffic to real companies and people, and a Custom Audience ($197/mo) delivers a fresh weekly list of in-market buyers built to your ICP. Every record carries a verified work email and, where available, a deliverable postal address — the targeting layer you feed into Sendoso, Lob, Postal.io, or any direct mail tool. Get both for $247/mo."
  }
]

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
    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary" />
    </div>
  )
}

const howItWorks: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Zap,
    title: "Trigger events",
    body: "A specific event initiates the send — a CRM deal-stage change, an unanswered email sequence, a visited pricing page, or an approaching renewal date. The trigger fires through a webhook to the mail platform.",
  },
  {
    icon: FileText,
    title: "Template & personalization",
    body: "The platform picks the right template for the trigger and recipient, then personalizes it with variable data: name, company, industry messaging, custom imagery, and a unique PURL or QR code.",
  },
  {
    icon: PenTool,
    title: "Print production",
    body: "Digital printing enables true one-to-one personalization at scale. Robotic pens write handwritten notes in custom fonts. Most formats produce in 1-2 business days, with same-day options for urgent sends.",
  },
  {
    icon: Send,
    title: "Mailing & delivery",
    body: "CASS certification, NCOA processing, and DPV confirm every address is deliverable before printing. First-class mail arrives in 3-5 business days; some platforms offer same-day local courier delivery.",
  },
  {
    icon: BarChart3,
    title: "Tracking & attribution",
    body: "USPS Informed Delivery, PURLs, QR codes, and promo codes track every piece. The data flows back to your CRM for full pipeline attribution — what separates modern automation from spray-and-pray mail.",
  },
]

const formats: Array<{ icon: LucideIcon; title: string; cost: string; rate: string; bestFor: string }> = [
  { icon: Mail, title: "Triggered postcards", cost: "$1.50-$3.50", rate: "2-5%", bestFor: "High-volume awareness, event follow-up, visitor retargeting" },
  { icon: PenTool, title: "Handwritten notes", cost: "$3-$8", rate: "5-15%", bestFor: "Executive outreach, ABM, thank-you notes" },
  { icon: MailOpen, title: "Personalized letters", cost: "$2-$5", rate: "3-8%", bestFor: "Detailed offers, proposals, contracts" },
  { icon: Package, title: "Lumpy / dimensional", cost: "$15-$50", rate: "10-20%", bestFor: "High-value prospects, demo booking" },
  { icon: Gift, title: "Corporate gifts", cost: "$25-$100+", rate: "15-25%", bestFor: "Customer retention, deal acceleration" },
  { icon: BookOpen, title: "Catalogs / lookbooks", cost: "$3-$10", rate: "3-7%", bestFor: "Product showcase, ecommerce re-engagement" },
]

const triggerGroups: Array<{ icon: LucideIcon; stage: string; triggers: string[] }> = [
  {
    icon: Target,
    stage: "Top of funnel",
    triggers: [
      "A target account browses your pricing or product pages — trigger a postcard within 24 hours",
      "Content download or webinar registration — follow a digital touch with a physical one",
      "Trade show or event attendance — reference the conversation while the memory is fresh",
    ],
  },
  {
    icon: Users,
    stage: "Middle of funnel",
    triggers: [
      "Demo no-show — a handwritten note has a 25-40% re-booking rate",
      "Proposal sent, no response — a dimensional mailer creates urgency three days later",
      "Competitor evaluation signal — send a comparison-focused piece highlighting your differentiation",
    ],
  },
  {
    icon: RefreshCw,
    stage: "Bottom of funnel & retention",
    triggers: [
      "Contract renewal approaching — celebrate the partnership 60 days out",
      "Win-back for churned customers — re-engage 30-90 days after churn with a premium format",
      "Customer milestones & upsell — anniversary cards and upgrade letters reduce churn",
    ],
  },
]

const personalization: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Database,
    title: "Variable data printing",
    body: "Every element — text, images, colors, layout — varies per recipient at full print speed. A fintech prospect sees banking imagery and compliance messaging; a SaaS prospect sees growth-focused content.",
  },
  {
    icon: QrCode,
    title: "Personalized QR codes",
    body: "A unique QR code on each piece links to a personalized landing page and serves as the primary tracking mechanism. Scan rates on direct mail now average 8-12%, up from 2-3% in 2020.",
  },
  {
    icon: Link2,
    title: "Personalized URLs (PURLs)",
    body: "A PURL like yourcompany.com/john-smith creates a premium, one-to-one experience. When the recipient visits, you capture it in your CRM and enable immediate sales follow-up.",
  },
  {
    icon: PenTool,
    title: "Robotic handwriting",
    body: "Actual pens — not printers — write notes in custom handwriting fonts, complete with realistic pressure variation. The result is virtually indistinguishable from a truly hand-written message.",
  },
  {
    icon: MapPin,
    title: "Custom imagery & maps",
    body: "Dynamically generated maps of the recipient's office, satellite imagery, industry benchmark charts, or brand mock-ups demonstrate genuine research and dramatically increase engagement.",
  },
  {
    icon: Sparkles,
    title: "Conditional content",
    body: "Advanced platforms show different content blocks based on persona, industry, or buying-journey stage — so a single template adapts to every segment in your list.",
  },
]

const useCases: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Users,
    title: "B2B sales outreach",
    body: "SDRs send a handwritten note introducing the rep, then call 3-4 days later. With a physical reminder on the desk, calls connect at a much higher rate.",
  },
  {
    icon: Target,
    title: "Account-based marketing",
    body: "Send personalized packages to every member of the buying committee, timed with digital campaigns — an ROI letter for the CFO, a technical booklet for the CTO.",
  },
  {
    icon: ShieldCheck,
    title: "Retention & expansion",
    body: "Onboarding kits, milestone celebrations, and renewal reminders strengthen relationships. Teams report 10-15% lower churn vs digital-only programs.",
  },
  {
    icon: Send,
    title: "Event marketing",
    body: "Pre-event invitations with VIP QR codes build anticipation; same-day post-event postcards strike while the memory is hot — only possible with automation.",
  },
  {
    icon: Building2,
    title: "Real estate",
    body: "Just-listed and just-sold postcards, market-update mailers with local stats, and automated farming campaigns keep agents present in target zip codes.",
  },
  {
    icon: Repeat,
    title: "Ecommerce win-back",
    body: "Triggered by 30/60/90 days of inactivity, postcards featuring previously browsed products and a discount code drive 5-10% reactivation of dormant customers.",
  },
]

const providerRows: Array<{ name: string; strength: string; formats: string; note: string }> = [
  { name: "Sendoso", strength: "Largest gift and swag marketplace", formats: "All formats + eGifts + swag", note: "$10,000+/yr" },
  { name: "Lob", strength: "Developer-first API, high-volume", formats: "Postcards, letters, checks, self-mailers", note: "Pay-per-piece, no platform fee" },
  { name: "Postal.io", strength: "Offline engagement platform for ABM", formats: "All formats + branded merchandise", note: "Custom pricing" },
  { name: "Handwrytten", strength: "Best-in-class robotic handwriting", formats: "Handwritten notes and cards only", note: "$3.25/card" },
  { name: "PostGrid", strength: "Print-and-mail API with address tools", formats: "Postcards, letters, cheques", note: "Pay-per-piece + tiers" },
]

const relatedResources = [
  { title: "What is Website Visitor Identification?", href: "/what-is-website-visitor-identification", desc: "Identify the companies and people on your site to trigger direct mail." },
  { title: "Cursive Visitor Identification", href: "/visitor-identification", desc: "A deterministic pixel that resolves 40–60% of your website traffic." },
  { title: "What is B2B Intent Data?", href: "/what-is-b2b-intent-data", desc: "Intent signals that tell you which accounts to mail first." },
  { title: "Audience Builder", href: "/audience-builder", desc: "Build a fresh weekly list of in-market buyers to feed any channel." },
  { title: "What is Lead Enrichment?", href: "/what-is-lead-enrichment", desc: "Append verified contact and firmographic data for personalization." },
  { title: "Pricing", href: "/pricing", desc: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo." },
]

export default function WhatIsDirectMailAutomation() {
  return (
    <main className="overflow-hidden">
      <OrganizationSchema />
      <ArticleSchema
        title="What is Direct Mail Automation? Complete Guide (2026)"
        description="A comprehensive guide to direct mail automation: how it works, trigger-based strategies, ROI benchmarks, personalization capabilities, provider comparisons, and integration with digital campaigns."
        publishedAt="2026-01-15"
        updatedAt="2026-02-01"
      />
      <StructuredData data={generateFAQSchema({ faqs })} />

      <HumanView>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Resources", href: "/resources" },
              { name: "What is Direct Mail Automation?", href: "/what-is-direct-mail-automation" },
            ]}
          />
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
                Complete Guide · 2026
              </span>
              <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 leading-[1.1]">
                What is direct mail
                <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-2">
                  automation?
                </span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
                <strong className="text-gray-900 font-medium">Direct mail automation</strong> uses software to
                trigger, personalize, and send physical mail — postcards, letters, handwritten notes, and
                dimensional packages — based on digital signals and behavioral data. It pairs the tangible
                impact of physical mail with the precision of digital marketing.
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

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
              className="mt-12 max-w-3xl mx-auto rounded-2xl border border-gray-200 bg-[#F7F9FB] p-6 sm:p-8"
            >
              <p className="text-base text-gray-700 leading-relaxed">
                The average professional receives 120+ emails a day but only a handful of physical mail
                pieces, so direct mail cuts through the digital noise: industry data shows a 9% response rate
                for house lists vs 1% for email, and 70% of consumers say mail feels more personal. The catch
                is targeting — a $15 dimensional mailer only pays off when it reaches the right person at the
                right address. That targeting layer is where{" "}
                <Link href="/platform" className="text-primary hover:underline font-medium">Cursive</Link>{" "}
                fits: we don&apos;t send the mail, we supply the verified identities and addresses that make
                every automated send land.
              </p>
            </motion.div>
          </Container>
        </section>

        {/* How It Works */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="How Direct Mail Automation"
              script="Actually Works"
              sub="A five-step pipeline that turns a digital signal into a physical piece in the recipient's hands — with full attribution back to your CRM."
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {howItWorks.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <IconChip Icon={s.icon} />
                    <span className="text-sm font-semibold text-gray-300">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{s.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{s.body}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Mail Formats */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="Types of Automated"
              script="Direct Mail"
              sub="Each format serves a different stage of the buyer's journey, with its own cost and response-rate profile."
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {formats.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <IconChip Icon={f.icon} />
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {f.rate} response
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{f.title}</h3>
                  <p className="mt-1 text-sm font-medium text-gray-500">{f.cost} per piece</p>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{f.bestFor}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Trigger Events */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="Trigger Events by"
              script="Funnel Stage"
              sub="The power of automation is timing — sending physical pieces exactly when they are most likely to influence a decision."
            />
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {triggerGroups.map((g, i) => (
                <motion.div
                  key={g.stage}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <IconChip Icon={g.icon} />
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{g.stage}</h3>
                  <ul className="mt-4 space-y-3">
                    {g.triggers.map((t) => (
                      <li key={t} className="flex items-start gap-2.5 text-sm text-gray-600 leading-relaxed">
                        <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Personalization */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="Personalization"
              script="Capabilities"
              sub="Modern platforms personalize physical mail at a level that rivals — and often exceeds — digital channels. But personalization is only as good as the data behind it."
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {personalization.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <IconChip Icon={p.icon} />
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{p.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{p.body}</p>
                </motion.div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Every one of these techniques needs an accurate name, company, and address.{" "}
              <Link href="/what-is-lead-enrichment" className="text-primary hover:underline">Lead enrichment</Link>{" "}
              and{" "}
              <Link href="/visitor-identification" className="text-primary hover:underline">visitor identification</Link>{" "}
              are what supply it.
            </p>
          </Container>
        </section>

        {/* ROI & Performance */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="ROI and Performance"
              script="Benchmarks"
              sub="Response rate and effective cost-per-response across channels — the numbers that build your business case."
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: EASE }}
              className="max-w-4xl mx-auto rounded-2xl border border-gray-200 bg-white p-2 sm:p-3 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="px-4 py-3 font-medium">Channel / Format</th>
                      <th className="px-4 py-3 font-medium">Avg. Response</th>
                      <th className="px-4 py-3 font-medium">Cost / Piece</th>
                      <th className="px-4 py-3 font-medium">Cost / Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      ["Cold email", "1-3%", "$0.01-$0.05", "$1-$5"],
                      ["LinkedIn InMail", "10-25%", "$0.80-$1.50", "$3-$15"],
                      ["Display advertising", "0.1-0.5%", "$0.50-$5.00 CPM", "$10-$50"],
                      ["Automated postcards", "2-5%", "$1.50-$3.50", "$30-$175"],
                      ["Handwritten notes", "5-15%", "$3-$8", "$20-$160"],
                      ["Dimensional / lumpy mail", "10-20%", "$15-$50", "$75-$500"],
                      ["Corporate gifts", "15-25%", "$25-$100+", "$100-$667"],
                    ].map((row) => (
                      <tr key={row[0]} className="text-gray-700">
                        <td className="px-4 py-3 font-medium text-gray-900">{row[0]}</td>
                        <td className="px-4 py-3 text-primary font-medium">{row[1]}</td>
                        <td className="px-4 py-3">{row[2]}</td>
                        <td className="px-4 py-3">{row[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
            <p className="mt-6 text-center text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Cost-per-response looks higher for mail, but the responses convert better. Multi-channel
              sequences including direct mail generate ~28% more pipeline than email-only, and meeting-booking
              rates rise 3-5x when a physical touch precedes the call — amplified further when mail is sent
              only to prospects showing active{" "}
              <Link href="/what-is-b2b-intent-data" className="text-primary hover:underline">intent signals</Link>.
            </p>
          </Container>
        </section>

        {/* Use Cases */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="Use Cases for"
              script="Direct Mail Automation"
              sub="Six of the highest-impact ways B2B and B2C teams turn physical mail into pipeline."
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {useCases.map((u, i) => (
                <motion.div
                  key={u.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <IconChip Icon={u.icon} />
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{u.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{u.body}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Where Cursive Fits */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading
              plain="Where Cursive"
              script="Fits In"
              sub="Cursive is not a direct mail tool — we are the data layer that feeds one. Direct mail automation is only as good as the identities and addresses behind it, and that is exactly what we supply."
            />
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  icon: Eye,
                  title: "Visitor Pixel — $97/mo",
                  body: "Resolves 40–60% of your anonymous website traffic to real companies and people, deterministically — each with a verified work email and, where available, a deliverable postal address to trigger mail on.",
                },
                {
                  icon: Users,
                  title: "Custom Audience — $197/mo",
                  body: "A fresh weekly list of in-market buyers built to your exact ICP and delivered to Google Sheets — the targeting list you load into Sendoso, Lob, Postal.io, or any direct mail platform.",
                },
                {
                  icon: Send,
                  title: "Feed any mail tool",
                  body: "Export verified identities and addresses into the direct mail tool you already use. Cursive handles the who and the where; your mail platform handles the print and the send.",
                },
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 hover:shadow-lg transition-shadow"
                >
                  <IconChip Icon={c.icon} />
                  <h3 className="mt-5 text-lg font-medium text-gray-900">{c.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{c.body}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button size="lg" href={GET_LEADS_URL} target="_blank" rel="noopener noreferrer">
                See plans &amp; get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="mt-4 text-sm text-gray-500">
                Get both for $247/mo. Self-serve, month-to-month, cancel anytime.
              </p>
            </div>
          </Container>
        </section>

        {/* Provider Comparison */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading
              plain="Direct Mail Automation"
              script="Providers"
              sub="The platforms that actually print and send the mail. Pair any of them with Cursive's verified identities and addresses for better targeting."
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: EASE }}
              className="max-w-4xl mx-auto rounded-2xl border border-gray-200 p-2 sm:p-3 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="px-4 py-3 font-medium">Provider</th>
                      <th className="px-4 py-3 font-medium">Key Strength</th>
                      <th className="px-4 py-3 font-medium">Mail Formats</th>
                      <th className="px-4 py-3 font-medium">Starting Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {providerRows.map((row) => (
                      <tr key={row.name} className="text-gray-700">
                        <td className="px-4 py-3 font-semibold text-gray-900">{row.name}</td>
                        <td className="px-4 py-3">{row.strength}</td>
                        <td className="px-4 py-3">{row.formats}</td>
                        <td className="px-4 py-3 text-gray-500">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
            <p className="mt-6 text-center text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Whichever tool you choose, the bottleneck is rarely the printing — it is knowing who to mail and
              having a deliverable address.{" "}
              <Link href="/pricing" className="text-primary hover:underline">Cursive</Link>{" "}
              supplies both.
            </p>
          </Container>
        </section>

        {/* FAQ */}
        <section className="py-20 sm:py-24 bg-[#F7F9FB]">
          <Container>
            <SectionHeading plain="Frequently Asked" script="Questions" />
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, i) => (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03, duration: 0.4, ease: EASE }}
                  className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-7"
                >
                  <h3 className="text-base font-medium text-gray-900">{faq.question}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>

        {/* Related Resources */}
        <section className="py-20 sm:py-24 bg-white">
          <Container>
            <SectionHeading plain="Related" script="Resources" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {relatedResources.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 hover:border-primary hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                      {link.title}
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary flex-shrink-0" />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 leading-relaxed">{link.desc}</p>
                </Link>
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
                Feed your direct mail
                <span className="block font-cursive text-4xl sm:text-5xl lg:text-6xl text-gray-500 mt-1">
                  with verified data
                </span>
              </h2>
              <p className="mt-5 text-lg text-gray-600 leading-relaxed">
                Cursive gives you the identities and addresses behind your traffic, so every automated mail
                piece reaches a real, in-market buyer. Plans from $97/mo — self-serve, month-to-month, cancel
                anytime.
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
      </HumanView>

      <MachineView>
        <MachineContent>
          <h1 className="text-2xl font-bold mb-4">What is Direct Mail Automation? Complete Guide (2026)</h1>

          <p className="text-gray-700 mb-6">
            Direct mail automation uses software to trigger, personalize, and send physical mail pieces -- postcards, letters, handwritten notes, and dimensional packages -- based on digital signals and behavioral data. It combines the tangible impact of physical mail with the precision of digital marketing. Published: January 15, 2026.
          </p>

          <MachineSection title="Key Takeaways">
            <MachineList items={[
              "Direct mail achieves 9% response rate for house lists vs. 1% for email",
              "Automation transforms weeks-long manual process into real-time triggered workflows",
              "Mail formats: Postcards ($1.50-$3.50), Handwritten notes ($3-$8), Dimensional ($15-$50), Gifts ($25-$100+)",
              "Triggered direct mail gets 3-5x higher meeting booking rates when combined with digital outreach",
              "70% of consumers say direct mail feels more personal than digital messages",
              "Mail only pays off with accurate targeting — Cursive supplies the verified identities and addresses that feed any direct mail tool (Cursive does not send mail itself)"
            ]} />
          </MachineSection>

          <MachineSection title="How Direct Mail Automation Works">
            <MachineList items={[
              "Step 1: Trigger Events — CRM deal stage change, website visit, email non-response, calendar event fires webhook",
              "Step 2: Template Selection & Personalization — Variable data printing customizes text, images, QR codes per recipient",
              "Step 3: Print Production — Digital printing enables one-to-one personalization; robotic pens for handwritten notes",
              "Step 4: Mailing & Delivery — CASS address verification, NCOA processing, first-class mail arrives 3-5 business days",
              "Step 5: Tracking & Attribution — USPS Informed Delivery, PURLs, QR codes, promo codes feed back to CRM"
            ]} />
          </MachineSection>

          <MachineSection title="Mail Formats & Response Rates">
            <MachineList items={[
              "Triggered Postcards: $1.50-$3.50/piece, 2-5% response rate, best for high-volume awareness",
              "Handwritten Notes: $3-$8/piece, 5-15% response rate, best for executive outreach and ABM",
              "Personalized Letters: $2-$5/piece, 3-8% response rate, best for detailed offers and proposals",
              "Lumpy/Dimensional Mail: $15-$50/piece, 10-20% response rate, best for high-value prospect demos",
              "Corporate Gifts: $25-$100+/piece, 15-25% response rate, best for customer retention and deal acceleration"
            ]} />
          </MachineSection>

          <MachineSection title="Trigger Events by Funnel Stage">
            <MachineList items={[
              "Top-of-Funnel: Website visit to high-intent pages, content download, trade show attendance",
              "Mid-Funnel: Demo no-show, proposal sent with no response, competitor evaluation detected via intent data",
              "Bottom-of-Funnel: Contract renewal approaching (60 days out), win-back for churned customers (30-90 days)",
              "Retention: Customer milestone celebrations, upsell opportunities from usage data"
            ]} />
          </MachineSection>

          <MachineSection title="Personalization Technologies">
            <MachineList items={[
              "Variable Data Printing (VDP) — Every element customized per recipient at full print speed",
              "Personalized QR Codes — Unique codes linking to personalized landing pages (8-12% scan rates in 2026)",
              "PURLs — yourcompany.com/john-smith personalized landing pages with pre-populated data",
              "Robotic Handwriting — Actual pens create authentic handwritten notes from custom fonts",
              "Custom Imagery — Dynamic maps, satellite images, brand mock-ups tailored per recipient"
            ]} />
          </MachineSection>

          <MachineSection title="Use Cases">
            <MachineList items={[
              "B2B Sales Outreach — Handwritten notes before cold calls increase connect rates 3-5x",
              "Account-Based Marketing — Personalized packages to each buying committee member",
              "Customer Retention — Onboarding kits, milestone celebrations, renewal reminders reduce churn 10-15%",
              "Event Marketing — Pre-event invitations and same-day post-event follow-up",
              "Real Estate — Just-listed/sold notifications, market updates, automated farming campaigns",
              "Ecommerce Win-Back — Triggered postcards with browsed products and discount codes (5-10% reactivation)"
            ]} />
          </MachineSection>

          <MachineSection title="Direct Mail Automation Providers">
            <MachineList items={[
              "Sendoso — Largest gift/swag marketplace, all formats + eGifts ($10,000+/yr)",
              "Lob — Developer-first API, high-volume, pay-per-piece (no platform fee)",
              "Postal.io — Offline engagement platform for ABM, all formats + branded merch (custom pricing)",
              "Handwrytten — Best-in-class robotic handwriting, handwritten notes only ($3.25/card)",
              "PostGrid — Print-and-mail API with address verification tools, pay-per-piece plus tiers"
            ]} />
          </MachineSection>

          <MachineSection title="Where Cursive Fits">
            <p className="text-gray-700 mb-4">
              Cursive does not print or send direct mail. Cursive is the identity and address layer that makes direct mail automation effective — supplying the verified identities and deliverable postal addresses you feed into any direct mail tool.
            </p>
            <MachineList items={[
              "Visitor Pixel ($97/month) — resolves 40–60% of anonymous website visitors to real companies and people, with verified work email and, where available, a deliverable postal address",
              "Custom Audience ($197/month) — a fresh weekly list of in-market buyers built to your ICP, delivered to Google Sheets, ready to load into Sendoso, Lob, Postal.io, or any mail platform",
              "Pixel + Audience Bundle ($247/month) — both, in one feed",
              "Self-serve, month-to-month, no setup fee. Cancel anytime."
            ]} />
          </MachineSection>

          <MachineSection title="Related Resources">
            <MachineList items={[
              { label: "Website Visitor Identification Guide", href: "/what-is-website-visitor-identification", description: "Identify visitors to trigger direct mail" },
              { label: "Cursive Visitor Identification", href: "/visitor-identification", description: "Deterministic pixel resolving 40–60% of website traffic" },
              { label: "B2B Intent Data Guide", href: "/what-is-b2b-intent-data", description: "Intent signals for direct mail targeting" },
              { label: "Audience Builder", href: "/audience-builder", description: "Build a weekly list of in-market buyers to feed any channel" },
              { label: "Lead Enrichment Guide", href: "/what-is-lead-enrichment", description: "Enrich data for mail personalization" },
              { label: "Pricing", href: "/pricing", description: "Visitor Pixel $97/mo, Custom Audience $197/mo, or both for $247/mo" }
            ]} />
          </MachineSection>

          <MachineSection title="Get Started">
            <p className="text-gray-700 mb-3">
              Cursive supplies the verified identities and addresses behind your website traffic and in-market audiences, so every automated direct mail piece reaches a real buyer. Self-serve from $97/month, live in minutes.
            </p>
            <MachineList items={[
              { label: "Get Started", href: "https://leads.meetcursive.com/get-leads", description: "Pick a plan and you are live in minutes" },
              { label: "Book a Call", href: "https://cal.com/cursiveteam/30min", description: "Talk to the team before you buy" }
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </main>
  )
}
