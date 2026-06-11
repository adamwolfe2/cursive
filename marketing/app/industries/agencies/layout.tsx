import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Lead Generation for Marketing Agencies - Cursive',
  description: 'Help your agency clients grow with visitor identification, intent data, and AI-powered outreach. White-label friendly tools built for agency scale.',
  keywords: ['marketing agency lead generation', 'agency visitor identification', 'white label lead generation', 'agency client reporting', 'B2B agency tools'],
  canonical: 'https://www.meetcursive.com/industries/agencies',
})

const agenciesFAQs = [
  {
    question: 'How can marketing agencies use Cursive for client lead generation?',
    answer: 'Marketing agencies use Cursive to resolve anonymous visitors on client sites against a deterministic identity graph of 280M+ verified consumer and 140M+ business profiles, with a 40–60% pixel match rate (vs 2–5% for cookie-based tools and 10–15% for IP databases). Agencies can also receive fresh weekly lists of in-market buyers in Google Sheets to support client lead generation programs across industries.',
  },
  {
    question: 'Does Cursive offer white-label or agency pricing?',
    answer: "Cursive supports multi-client account management so agencies can run campaigns across all their clients from a single platform. Self-serve plans are Visitor Pixel at $97/month, Custom Audience at $197/month, and the Pixel + Audience Bundle at $247/month. All are month-to-month with no setup fee and can be canceled anytime at leads.meetcursive.com/get-leads.",
  },
  {
    question: "How do agencies use visitor identification for client campaigns?",
    answer: "Agencies install Cursive's lightweight tracking pixel on client websites to resolve anonymous B2B visitors in real time at a 40–60% deterministic match rate — significantly higher than cookie-based tools (2–5%) or IP databases (10–15%). This visitor data powers highly targeted outreach campaigns, allowing agencies to show clients exactly which companies are engaging with their site and how those accounts are progressing through the funnel.",
  },
  {
    question: 'What reporting does Cursive provide for agency client reporting?',
    answer: "Cursive provides identified visitor and in-market audience data that agencies can use for compelling client reports. Agencies can export the data and connect it to their clients' workflows so pipeline impact is visible alongside tools like HubSpot and Salesforce.",
  },
  {
    question: 'Can agencies manage multiple client accounts in Cursive?',
    answer: 'Yes, Cursive is built to support agencies managing multiple client accounts, with separate workspaces and tracking pixels for each client. This architecture ensures client data stays isolated and secure while giving agencies a unified view across all their accounts from the Cursive platform.',
  },
  {
    question: "How do agencies use Cursive's intent data for client targeting?",
    answer: "Cursive's 450 billion+ intent signal database lets agencies identify companies that are actively researching their clients' product categories, even before those companies visit the client's website. Agencies use this intent data to build proactive outreach lists for clients, reaching in-market prospects at the right moment and dramatically improving campaign conversion rates.",
  },
]

export default function AgenciesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
          { name: 'Agencies', url: 'https://www.meetcursive.com/industries/agencies' },
        ]),
        generateFAQSchema(agenciesFAQs),
      ]} />
      {children}
    </>
  )
}
