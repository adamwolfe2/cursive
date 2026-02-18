import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Franchise Lead Generation - Identify Franchise Opportunity Seekers with Cursive',
  description: 'Identify candidates researching franchise opportunities on your website and convert them with AI-powered outreach. Build your franchise development pipeline with Cursive.',
  keywords: ['franchise lead generation', 'franchise development leads', 'franchise opportunity leads', 'franchisee recruitment', 'franchise visitor identification'],
  canonical: 'https://www.meetcursive.com/industries/franchises',
})

const franchisesFAQs = [
  {
    question: 'How does Cursive help franchise brands generate franchise leads?',
    answer: 'Cursive identifies up to 70% of anonymous visitors browsing your franchise opportunity pages, FDD request forms, and investment information, giving your franchise development team a pipeline of warm candidates who have already expressed interest. Once identified, Cursive automatically triggers personalized outreach to engage these candidates at the peak of their interest.',
  },
  {
    question: 'Can Cursive identify visitors researching franchise opportunities?',
    answer: "Yes — Cursive's visitor identification technology reveals the identities of candidates browsing your franchise opportunity website, including their name, email address, and professional background when available. This means your franchise development team can proactively reach out to qualified candidates rather than waiting for them to submit a contact form.",
  },
  {
    question: "How do franchise development teams use Cursive's AI SDR?",
    answer: "Cursive's AI SDR automatically sends personalized follow-up messages to identified franchise opportunity visitors, referencing the specific markets, investment levels, or franchise models they explored on your site. This immediate, behavior-driven outreach dramatically increases the response rate from prospective franchisees and helps development teams work a larger pipeline without adding staff.",
  },
  {
    question: 'What is the typical lead cost for franchise opportunity leads?',
    answer: 'Traditional franchise lead generation through portals and paid advertising often costs $50-$200+ per lead with variable quality. Cursive identifies warm, first-party leads directly from your own website traffic starting at $1,000/month, making the cost per identified prospect a fraction of portal-sourced leads while delivering higher intent and better conversion rates.',
  },
  {
    question: "How does Cursive's direct mail work for franchise development?",
    answer: 'Cursive can trigger physical direct mail campaigns to identified franchise opportunity visitors who do not respond to digital outreach, delivering personalized franchise information packages with 95%+ deliverability to verified business addresses. This multi-channel approach — email plus direct mail — significantly increases overall response rates from prospective franchisees.',
  },
  {
    question: "Can multi-location franchise brands use Cursive's platform?",
    answer: "Yes, Cursive's platform is built to support both franchise development (recruiting new franchisees) and franchisee-level lead generation (helping individual locations grow their customer base). Multi-location franchise brands can use Cursive at the corporate level for development pipeline and deploy it across franchisee websites to drive consistent local lead generation.",
  },
]

export default function FranchisesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
          { name: 'Franchises', url: 'https://www.meetcursive.com/industries/franchises' },
        ]),
        generateFAQSchema(franchisesFAQs),
      ]} />
      {children}
    </>
  )
}
