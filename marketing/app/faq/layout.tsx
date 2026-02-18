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
    answer: 'Cursive is a B2B revenue intelligence platform that identifies anonymous website visitors and converts them into actionable sales leads. It combines visitor identification (revealing who is visiting your site), intent data (tracking active buying signals), an AI SDR for automated outreach, and a B2B lead marketplace — all in one platform starting at $1,000/month.',
  },
  {
    question: 'How does Cursive identify anonymous website visitors?',
    answer: 'Cursive uses a lightweight JavaScript snippet on your website that cross-references visitor IP data, device fingerprinting, and our database of 280M+ verified US profiles. When a visitor matches a profile, Cursive reveals their name, email, company, job title, and LinkedIn — typically identifying 50-70% of US B2B visitors. Installation takes under 5 minutes.',
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
    answer: 'Cursive identifies 50-70% of US B2B website visitors with 95%+ email deliverability on identified contacts. This compares favorably to competitors: Warmly identifies ~40%, Clearbit ~30-40%, and RB2B ~50-60%. Accuracy varies by industry — B2B SaaS and professional services typically see the highest identification rates.',
  },
  {
    question: 'What is the difference between the self-serve platform and managed services?',
    answer: 'The self-serve platform (leads.meetcursive.com) lets you access visitor identification, intent audiences, and the lead marketplace directly — you manage your own campaigns and outreach. Managed services (Cursive Outbound and Pipeline) are done-for-you: Cursive builds and runs your outreach campaigns, handles deliverability, and books meetings on your behalf.',
  },
  {
    question: 'How do I get started with Cursive?',
    answer: 'You can start with a free trial at leads.meetcursive.com/signup — no credit card required. The free tier includes 100 lead credits and 7 days of visitor identification data. For managed services, book a 30-minute strategy call at cal.com/cursive/30min. Most accounts are fully set up and running within one week.',
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
