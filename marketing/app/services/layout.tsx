import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Done-For-You Lead Generation Services — From $1k/mo | Cursive',
  description: 'Let Cursive handle your lead generation. Three tiers: Cursive Data ($1k/mo), Cursive Outbound ($2.5k/mo), and Cursive Pipeline ($5k/mo). AI-powered campaigns that book meetings.',
  keywords: [
    'done-for-you lead generation',
    'AI outbound',
    'managed campaigns',
    'B2B lead gen services',
    'AI SDR service',
    'outsourced lead generation',
    'managed outbound',
    'lead generation agency',
  ],
  canonical: 'https://www.meetcursive.com/services',
})

const servicesFAQs = [
  {
    question: 'What managed services does Cursive offer?',
    answer: 'Cursive offers three done-for-you service tiers: Cursive Data ($1k/mo) — visitor identification + intent data + lead lists delivered to your CRM; Cursive Outbound ($2.5k/mo) — Data tier plus AI-powered email and LinkedIn outreach campaigns managed by Cursive; Cursive Pipeline ($5k/mo) — full-funnel including outbound, direct mail, and meeting booking.',
  },
  {
    question: 'What is included in the Cursive Outbound service?',
    answer: 'Cursive Outbound includes visitor identification, intent audience targeting, AI-generated personalized email sequences, LinkedIn outreach, A/B testing, deliverability management (custom domains, warm-up), weekly reporting, and a dedicated campaign manager. We handle everything from list building to inbox placement.',
  },
  {
    question: 'How long does it take to see results from Cursive\'s managed services?',
    answer: 'Most clients see their first booked meetings within 2-3 weeks of launch. Campaigns are fully launched within 5-7 business days of onboarding. Results scale over 60-90 days as AI optimization kicks in and sequences are refined based on response data.',
  },
  {
    question: 'Is there a long-term contract required for managed services?',
    answer: 'No long-term contracts. Cursive managed services are month-to-month. We recommend a minimum 3-month commitment to see full campaign results, but you are never locked in. Cancel anytime with 30 days notice.',
  },
  {
    question: 'What is the onboarding process for Cursive services?',
    answer: 'Onboarding takes 5-7 business days. We start with an ICP (Ideal Customer Profile) workshop, then build your visitor identification setup, configure your CRM integration, build initial audience segments, create email templates and sequences, and warm up sending infrastructure. Your campaign manager guides you through every step.',
  },
  {
    question: 'Can I upgrade or downgrade between service tiers?',
    answer: 'Yes. You can upgrade or downgrade between Cursive Data, Outbound, and Pipeline tiers at the start of any billing period. There are no penalties for changing plans. Upgrades take effect immediately; downgrades apply at the next billing cycle.',
  },
  {
    question: 'How does Cursive\'s AI SDR differ from a human SDR?',
    answer: 'Cursive\'s AI SDR operates 24/7, scales instantly to thousands of personalized touchpoints per day, never gets tired or misses follow-ups, and improves automatically based on response data. For the cost of one human SDR ($5-8k/mo fully loaded), Cursive\'s Pipeline plan delivers 10x the outreach volume with higher personalization and consistent quality.',
  },
]

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Services', url: 'https://www.meetcursive.com/services' },
        ]),
        generateFAQSchema(servicesFAQs),
      ]} />
      {children}
    </>
  )
}
