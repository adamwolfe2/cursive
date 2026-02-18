import { generateMetadata as genMeta } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = genMeta({
  title: 'What is Lead Enrichment? Complete Guide (2026)',
  description: 'Learn what lead enrichment is, how it works, types of enrichment data (firmographic, technographic, intent), implementation strategies, and how to choose the right provider for your B2B sales and marketing team.',
  keywords: [
    'lead enrichment',
    'data enrichment',
    'B2B data enrichment',
    'lead enrichment software',
    'CRM enrichment',
    'contact enrichment',
    'firmographic data',
    'technographic data',
    'lead enrichment tools',
    'enrichment API',
  ],
  canonical: 'https://www.meetcursive.com/what-is-lead-enrichment',
})

const leadEnrichmentFAQs = [
  {
    question: 'What is lead enrichment?',
    answer: 'Lead enrichment is the process of adding additional data to existing lead records — going beyond just name and email to append firmographic data (company size, industry, revenue), technographic data (what software they use), contact data (phone numbers, LinkedIn), and behavioral signals (intent data, website activity). Enrichment transforms a basic form submission into a complete profile that helps sales prioritize and personalize outreach.',
  },
  {
    question: 'What types of data can be appended through lead enrichment?',
    answer: 'Lead enrichment can append: firmographic data (company name, size, industry, revenue, location, employee count, funding status, growth rate); contact data (verified email, direct phone, LinkedIn URL, job title, department, seniority); technographic data (CRM used, marketing tools, ad platforms, IT infrastructure); intent data (topics being researched, review sites visited, competitor interest); and social data (LinkedIn activity, job change signals, hiring patterns).',
  },
  {
    question: 'How does lead enrichment work?',
    answer: 'Lead enrichment works by taking a partial identifier — typically an email address, LinkedIn URL, or company name — and querying data providers to return a complete profile. Real-time enrichment happens when a form is submitted (enriching the lead before it enters your CRM). Batch enrichment updates existing CRM records on a schedule. Waterfall enrichment tries multiple providers sequentially until a match is found, maximizing coverage.',
  },
  {
    question: 'What is the ROI of lead enrichment?',
    answer: 'Lead enrichment ROI comes from four areas: (1) Routing efficiency — enriched leads are routed to the right SDR or AE immediately rather than requiring manual research; (2) Prioritization — high-fit leads (matching ICP firmographics) are flagged and worked first; (3) Personalization — reps use enriched data (tech stack, company challenges) to write highly relevant outreach; (4) Scoring accuracy — ML lead scoring works much better with complete data. Companies report 20-40% increase in rep productivity and 15-25% improvement in connect rates after enrichment.',
  },
  {
    question: 'What is the difference between lead enrichment and data append?',
    answer: 'Data append is the broader term for adding data to any existing record (customer records, prospect lists). Lead enrichment is specifically focused on sales leads and prospecting data, typically happening in real-time as leads enter a system. Lead enrichment tools are optimized for sales use cases: CRM integration, real-time API calls, sales-relevant data fields, and scoring. Data append services are often batch-oriented, used for marketing list enhancement.',
  },
  {
    question: 'Which lead enrichment providers are best for B2B?',
    answer: 'Top B2B lead enrichment providers: Cursive (visitor identification + enrichment + intent data, $1k/mo platform); Clearbit/Breeze (HubSpot-native enrichment, strong for SMB-mid market); ZoomInfo (largest database, $15-50k/yr enterprise contracts); Apollo.io (budget-friendly, 200M+ contacts, $49-$99/user/mo); Lusha (LinkedIn-focused, $29-$79/user/mo); and Cognism (EMEA-specialized, $15-40k/yr). Choose based on ICP geography, deal size, and budget.',
  },
  {
    question: 'How accurate is lead enrichment data?',
    answer: 'Lead enrichment data accuracy varies significantly by provider. Email deliverability (the most measurable accuracy metric) ranges from 85% to 97% across providers. Cursive maintains 95%+ email deliverability on enriched contacts. Job title and company data accuracy is typically 85-95% for profiles that have been recently verified. Phone number accuracy is lower (60-80%) since numbers change more frequently than email addresses.',
  },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'What is Lead Enrichment?', url: 'https://www.meetcursive.com/what-is-lead-enrichment' },
        ]),
        generateFAQSchema(leadEnrichmentFAQs),
      ]} />
      {children}
    </>
  )
}
