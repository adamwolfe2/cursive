import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'FAQ — Frequently Asked Questions About Cursive | B2B Lead Generation',
  description: 'Get answers to common questions about visitor identification, intent data, audience building, pricing, integrations, data compliance, and how Cursive works for B2B lead generation.',
  keywords: ['Cursive FAQ', 'visitor identification FAQ', 'intent data questions', 'B2B lead generation FAQ', 'audience building questions', 'data compliance FAQ', 'pricing questions'],
  canonical: 'https://www.meetcursive.com/faq',
})

const faqPageFAQs = [
  {
    question: 'What is Cursive and what does it do?',
    answer: 'Cursive is the identity layer for outbound, intent, and enrichment. We combine deterministic visitor identification (40–60% pixel match rate, not modeled), 280M+ verified consumer and 140M+ business profiles refreshed every 30 days via NCOA, and a closed feedback loop that maps signals back to source URLs and validates against real conversions. Self-serve marketplace from $0.60/lead, managed services from $1,000/month, committed-tier data partnerships from $15K/month.',
  },
  {
    question: 'How does Cursive identify anonymous website visitors?',
    answer: 'Cursive uses a lightweight JavaScript pixel that resolves visitors against our deterministic identity graph of 280M+ verified consumer and 140M+ business profiles, refreshed every 30 days via NCOA. The pixel delivers a 40–60% match rate driven by our proprietary geo-framing methodology — significantly higher than cookie-based tools (2–5%) or IP databases (10–15%) — with 60–80% pixel-level accuracy. Installation takes under 5 minutes.',
  },
  {
    question: 'What integrations does Cursive support?',
    answer: 'Cursive integrates natively with HubSpot, Salesforce, Pipedrive, Close, and Zapier. Via Zapier, you can connect to 5,000+ additional tools. Cursive also supports webhook-based custom integrations for sending identified visitors directly to your CRM, sales engagement tools (Outreach, Salesloft), or Slack.',
  },
  {
    question: 'Is Cursive GDPR and CCPA compliant?',
    answer: 'Yes. Cursive operates under a legitimate interest and B2B commercial use framework. All profiles in our database have been sourced through consent-appropriate channels. We honor all opt-outs, maintain suppression lists, and provide data deletion requests within 30 days. Our data practices comply with GDPR, CCPA, and CAN-SPAM regulations.',
  },
  {
    question: 'How accurate is Cursive\'s visitor identification?',
    answer: 'Cursive delivers a 40–60% deterministic pixel match rate with 60–80% pixel-level accuracy — not modeled or probabilistic. For comparison, cookie-based tools resolve 2–5% of visitors and IP databases resolve 10–15%. Accuracy is reinforced by Deep Verify, our in-house email validation engine processing ~20 million records per day, plus a closed feedback loop that validates signals against real conversions.',
  },
  {
    question: 'What is the difference between the self-serve marketplace, managed services, and committed data partnerships?',
    answer: 'Self-serve marketplace (from $0.60/lead) lets you buy verified leads on demand from our identity graph — you run your own campaigns. Managed services (from $1,000/month) are done-for-you: Cursive builds and runs your outreach, handles deliverability, and books meetings. Committed data partnerships (from $15K/month) give enterprise teams direct access to the underlying identity infrastructure — pixel, taxonomy of ~50,000 intent segments, ~20M/day email validation, and the full closed-feedback-loop dataset.',
  },
  {
    question: 'How do I get started with Cursive?',
    answer: 'You can start with a free trial at leads.meetcursive.com/signup — no credit card required. The free tier includes 100 lead credits and 7 days of visitor identification data. For managed services, book a 30-minute strategy call at cal.com/cursiveteam/30min. Most accounts are fully set up and running within one week.',
  },
  {
    question: 'What kind of companies use Cursive?',
    answer: 'Cursive is primarily used by B2B SaaS companies, professional services firms, and sales teams with 5-500 employees. Ideal customers have at least 500 monthly website visitors and an ACV (average contract value) of $5,000+. Cursive is used by companies across industries including technology, financial services, healthcare services, and real estate.',
  },
]

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'FAQ', url: 'https://www.meetcursive.com/faq' },
        ]),
        generateFAQSchema(faqPageFAQs),
      ]} />
      {children}
    </>
  )
}
