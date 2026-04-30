import { generateMetadata as genMeta } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = genMeta({
  title: 'What is Website Visitor Identification? Complete Guide (2026)',
  description: 'Learn how website visitor identification works, key methods (reverse IP, fingerprinting, cookies), accuracy benchmarks, compliance requirements, and how to turn anonymous traffic into qualified leads.',
  keywords: [
    'website visitor identification',
    'visitor identification software',
    'identify website visitors',
    'anonymous visitor tracking',
    'B2B visitor identification',
    'reverse IP lookup',
    'website visitor tracking',
    'visitor identification tools',
    'identify anonymous traffic',
    'website visitor intelligence',
  ],
  canonical: 'https://www.meetcursive.com/what-is-website-visitor-identification',
})

const visitorIdFAQs = [
  {
    question: 'What is website visitor identification?',
    answer: 'Website visitor identification is the process of revealing the identity of anonymous people visiting your website. Rather than just seeing a session from an unknown IP address, visitor identification software cross-references visitor signals against large identity databases to match visitors to real person profiles — including name, email, job title, company, and LinkedIn URL — without the visitor filling out a form.',
  },
  {
    question: 'How does website visitor identification work?',
    answer: 'Visitor identification uses several techniques. Cookie-based tracking links return visits but only resolves 2–5% of visitors. IP address resolution maps the visitor\'s IP to a known business and resolves 10–15%. Cursive uses a deterministic pixel that resolves visitors against an identity graph of 280M+ verified consumer and 140M+ business profiles refreshed every 30 days via NCOA — achieving a 40–60% match rate with 60–80% pixel-level accuracy, not modeled or probabilistic.',
  },
  {
    question: 'What percentage of website visitors can be identified?',
    answer: 'Match rates vary dramatically by method. Cookie-based tools resolve 2–5% of visitors. IP databases resolve 10–15%. Cursive\'s deterministic pixel achieves a 40–60% match rate with 60–80% pixel-level accuracy — driven by our proprietary geo-framing methodology and an identity graph of 280M+ verified consumer and 140M+ business profiles refreshed every 30 days via NCOA.',
  },
  {
    question: 'Is website visitor identification legal and GDPR compliant?',
    answer: 'Yes, with caveats. For B2B visitor identification in the US, legitimate interest under CCPA and commercial communication standards generally applies. For EU visitors and GDPR compliance, some identification methods require explicit consent. Most B2B visitor identification tools — including Cursive — operate under legitimate interest frameworks for B2B commercial use and provide opt-out mechanisms. Identification of consumer (B2C) visitors has stricter requirements.',
  },
  {
    question: 'What data does visitor identification software reveal?',
    answer: 'Best-in-class tools reveal: full name, verified email address, job title, company name, company size and industry, LinkedIn profile URL, phone number (where available), location, and behavioral data (pages visited, time on site, return visit frequency). Some tools also append intent signals showing what topics the visitor has been researching across the web.',
  },
  {
    question: 'How is B2B visitor identification different from Google Analytics?',
    answer: 'Google Analytics shows you aggregate traffic data — sessions, page views, bounce rates — but identifies no individual visitors. Visitor identification software reveals who each visitor is by name, so you can act on the information. GA tells you "500 people visited your pricing page this week." Visitor identification tells you "John Smith, VP Sales at Acme Corp, visited your pricing page 3 times this week."',
  },
  {
    question: 'What should I do with identified website visitors?',
    answer: 'Common workflows: (1) Push identified visitors to your CRM (HubSpot, Salesforce) and trigger sales alerts for high-value accounts; (2) Enroll visitors in email or LinkedIn outreach sequences; (3) Send triggered direct mail to high-intent visitors; (4) Create retargeting audiences for LinkedIn and Google Ads; (5) Score and prioritize existing pipeline by overlapping with current visitors. The highest-ROI use case is immediate sales follow-up within hours of a pricing page visit.',
  },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'What is Website Visitor Identification?', url: 'https://www.meetcursive.com/what-is-website-visitor-identification' },
        ]),
        generateFAQSchema(visitorIdFAQs),
      ]} />
      {children}
    </>
  )
}
