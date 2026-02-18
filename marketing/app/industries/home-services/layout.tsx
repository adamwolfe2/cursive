import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Home Services Lead Generation - Identify B2B Buyers with Cursive',
  description: 'Identify businesses researching home services on your website and convert them with AI-powered outreach and direct mail. Grow your commercial home services pipeline.',
  keywords: ['home services lead generation', 'commercial home services leads', 'home services visitor identification', 'B2B home services', 'home services CRM'],
  canonical: 'https://www.meetcursive.com/industries/home-services',
})

const homeServicesFAQs = [
  {
    question: 'How does Cursive help home services companies generate B2B leads?',
    answer: 'Cursive identifies up to 70% of anonymous businesses visiting your home services website, revealing which property managers, facility directors, and commercial clients are researching your services. Your team can then reach out proactively with personalized proposals before these prospects contact a competitor, significantly increasing your commercial win rate.',
  },
  {
    question: 'What visitor identification rate can home services companies expect?',
    answer: 'Home services companies using Cursive typically identify up to 70% of their anonymous B2B website visitors, converting previously invisible traffic into a warm commercial prospect list. This identification rate is transformative for home services businesses that rely heavily on inbound marketing but see most visitors leave without ever filling out a contact form.',
  },
  {
    question: "How do home services franchises use Cursive's lead generation?",
    answer: 'Home services franchise brands deploy Cursive across franchisee websites to identify commercial clients researching services in each local market, feeding identified leads directly into each location's CRM for immediate follow-up. At the corporate level, franchise brands use Cursive to benchmark lead generation performance across locations and identify best practices for franchisee success.',
  },
  {
    question: "How does Cursive's direct mail work for home services outreach?",
    answer: "Cursive triggers personalized direct mail to identified commercial visitors who don't respond to digital outreach, sending physical proposals or service brochures with 95%+ deliverability to verified business addresses. For home services companies selling recurring commercial contracts, this multi-channel follow-up approach — combining email, phone, and direct mail — significantly improves close rates on high-value accounts.",
  },
  {
    question: 'What intent signals indicate a business needs home services?',
    answer: "Cursive's 450 billion+ intent signal database tracks signals such as researching commercial cleaning vendors, comparing landscaping service providers, or evaluating HVAC maintenance contracts, so you can identify businesses in an active buying cycle before they visit your site. Home services companies use these intent signals to build proactive outreach lists of commercial prospects showing purchase intent in their service area.",
  },
  {
    question: 'Can Cursive integrate with home services CRM platforms?',
    answer: 'Cursive integrates with popular CRM and field service management platforms used by home services companies, including HubSpot and Salesforce, so identified leads flow automatically into your existing sales workflows. Webhook support also enables integration with industry-specific platforms like ServiceTitan, Jobber, and others for seamless lead routing.',
  },
]

export default function HomeServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
          { name: 'Home Services', url: 'https://www.meetcursive.com/industries/home-services' },
        ]),
        generateFAQSchema(homeServicesFAQs),
      ]} />
      {children}
    </>
  )
}
