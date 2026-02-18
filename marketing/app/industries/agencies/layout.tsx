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
    answer: 'Marketing agencies use Cursive to identify up to 70% of anonymous visitors on their clients websites, giving them a rich pipeline of warm leads that would otherwise be invisible. Agencies layer in Cursive intent data and AI-powered outreach to build always-on lead generation programs for clients across industries, improving retention and demonstrating measurable pipeline impact.',
  },
  {
    question: 'Does Cursive offer white-label or agency pricing?',
    answer: "Cursive supports multi-client account management so agencies can run campaigns across all their clients from a single platform. Reach out to the Cursive team to discuss agency pricing and white-label options starting from the base $1,000/month plan, with volume discounts available for agencies managing multiple client accounts.",
  },
  {
    question: "How do agencies use visitor identification for client campaigns?",
    answer: "Agencies install Cursive's lightweight tracking pixel on client websites to begin identifying up to 70% of anonymous B2B visitors in real time. This visitor data powers highly targeted outreach campaigns, allowing agencies to show clients exactly which companies are engaging with their site and how those accounts are progressing through the funnel.",
  },
  {
    question: 'What reporting does Cursive provide for agency client reporting?',
    answer: "Cursive provides dashboards showing identified visitors, intent signal activity, outreach performance, and pipeline attribution, giving agencies the data they need for compelling client reports. Agencies can export reports and connect Cursive data to their clients' CRMs so pipeline impact is visible directly in tools like HubSpot and Salesforce.",
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
