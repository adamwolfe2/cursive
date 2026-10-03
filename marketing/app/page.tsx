import { START_URL } from "@/lib/cta"
import { Metadata } from "next"
import { StructuredData } from "@/components/seo/structured-data"
import { generateOrganizationSchema, generateWebSiteSchema, generateSoftwareApplicationSchema } from "@/lib/seo/structured-data"
import { HumanView, MachineView, MachineContent, MachineSection, MachineList } from "@/components/view-wrapper"
import { HumanHomePage } from "@/components/human-home-page"
import { faqs } from "@/components/homepage/faq-data"

export const metadata: Metadata = {
  title: "Cursive | Get 25 free leads from your website",
  description: "Your site in, 25 buyers out. Cursive reads your website, works out who buys, and finds 25 people who fit, with work emails and why each one fits. Free, about a minute, no card.",
  keywords: "B2B leads, free leads, lead generation, ICP, decision makers, work emails, LinkedIn outreach, done-for-you outreach, sales pipeline dashboard, ZoomInfo alternative, Apollo alternative",
  openGraph: {
    title: "Cursive | Get 25 free leads from your website",
    description: "Your site in, 25 buyers out. Cursive reads your website, works out who buys, and finds 25 people who fit, with work emails and why each one fits. Free, about a minute, no card.",
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
    title: "Cursive | Get 25 free leads from your website",
    description: "Your site in, 25 buyers out. Cursive reads your website, works out who buys, and finds 25 people who fit, with work emails and why each one fits. Free, about a minute, no card.",
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
      {/* Structured data. The FAQ schema comes from FAQSection, built from the same answers visitors see. */}
      <StructuredData data={[generateOrganizationSchema(), generateWebSiteSchema(), generateSoftwareApplicationSchema()]} />

      <HumanView>
        <HumanHomePage />
      </HumanView>

      {/* Machine view (sr-only, for crawlers and AI assistants). Mirrors the visible page: same claims, same prices. */}
      <MachineView>
        <MachineContent>
          <div className="mb-12 pb-6 border-b border-gray-200">
            <h1 className="text-2xl text-gray-900 font-bold mb-4">Cursive | Get 25 free leads from your website</h1>
            <p className="text-gray-700 leading-relaxed">
              Cursive finds your buyers, reaches them for you, and gives you the system to run it. Paste your website and
              Cursive works out who buys from you, then finds 25 decision makers who fit, each with a checked work email
              and a reason they fit. Free, about a minute, no card. Leads come from 400M+ business contacts,
              multi-sourced and enriched across several databases. Every batch learns from the leads you like, the
              ones you skip and the past customers you upload.
            </p>
          </div>

          <MachineSection title="How Cursive works">
            <MachineList items={[
              { label: "1. Find them", href: START_URL, description: "25 free leads from your website, then credits or a weekly plan. Like or skip leads and upload past customers; each next batch gets closer to your ideal buyer." },
              { label: "2. Reach them", href: "https://cal.com/cursiveteam/30min", description: "Done-for-you LinkedIn and email outreach to the same list. Copy written and run by the Cursive team, inside each platform's limits." },
              { label: "3. Run it", href: "https://cal.com/cursiveteam/30min", description: "A custom company dashboard that ties together leads, replies, site visitors, site chat, your CRM and any API. Built and hosted by Cursive." },
            ]} />
          </MachineSection>

          <MachineSection title="Plans & Pricing">
            <MachineList items={[
              { label: "Free: 25 leads", href: START_URL, description: "Paste your website, get 25 decision makers with checked work emails. No card." },
              { label: "Lead credits: 100 for $49, 500 for $199, 2,000 for $599", href: "https://www.meetcursive.com/#pricing", description: "Pay as you go; unused credits roll over. Early access." },
              { label: "Starter: $197/month", href: "https://www.meetcursive.com/#pricing", description: "100 leads a month, 25 every Monday, 14-day trial." },
              { label: "Growth: $497/month", href: "https://www.meetcursive.com/#pricing", description: "500 leads a month, tuned by the leads you like and your customer list. Early access." },
              { label: "Outreach: $1,497/month (LinkedIn) or $2,497/month (LinkedIn + email)", href: "https://www.meetcursive.com/#pricing", description: "Done-for-you outreach to your list. Month-to-month." },
              { label: "Operating system: from $2,500 setup + $500/month", href: "https://www.meetcursive.com/#pricing", description: "A custom company dashboard for leads, outreach, visitors, chat and CRM." },
              { label: "Visitor Pixel: $97/month add-on", href: "https://www.meetcursive.com/pixel", description: "See which companies visit your site." },
            ]} />
          </MachineSection>

          <MachineSection title="Frequently Asked Questions">
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="text-gray-900 font-semibold mb-1">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </MachineSection>

          <MachineSection title="Contact">
            <MachineList items={[
              { label: "Get 25 free leads", href: START_URL },
              { label: "Book a call", href: "https://cal.com/cursiveteam/30min" },
              { label: "Email", href: "mailto:hey@meetcursive.com" },
              { label: "LinkedIn", href: "https://linkedin.com/company/cursive" },
              { label: "Privacy Policy", href: "https://www.meetcursive.com/privacy" },
              { label: "Terms of Service", href: "https://www.meetcursive.com/terms" },
            ]} />
          </MachineSection>
        </MachineContent>
      </MachineView>
    </>
  )
}
