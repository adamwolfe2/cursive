import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema, generateBlogPostSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'How to Identify Anonymous Website Visitors: Complete B2B Guide (2026)',
  description: 'Step-by-step guide to identifying anonymous website visitors using IP resolution, device fingerprinting, and identity matching. Turn 70% of anonymous traffic into qualified leads with name, email, and LinkedIn.',
  keywords: [
    'how to identify anonymous website visitors',
    'identify anonymous website visitors',
    'identify website visitors',
    'anonymous visitor identification',
    'deanonymize website visitors',
    'website visitor tracking',
    'visitor identification software',
    'b2b lead generation from website',
    'website visitor identification guide',
    'turn anonymous traffic into leads',
  ],
  canonical: 'https://www.meetcursive.com/blog/how-to-identify-anonymous-website-visitors',
})

const identifyVisitorsFAQs = [
  {
    question: 'Can you identify anonymous website visitors?',
    answer: 'Yes. Modern visitor identification tools can identify 50-70% of anonymous B2B website visitors by name, email, company, and LinkedIn profile. They use a combination of IP-to-company resolution, device fingerprinting, and identity graph matching against databases of 250M+ professional profiles. The remaining 30-50% are typically consumer traffic, VPN users, or individuals not in B2B identity databases.',
  },
  {
    question: 'How do websites identify anonymous visitors?',
    answer: 'Websites identify anonymous visitors through four main methods: (1) IP address resolution — mapping IP ranges to companies and individuals; (2) Device fingerprinting — combining browser, OS, screen, and network signals into a probabilistic ID; (3) Identity graph matching — comparing device/IP signals against databases of known professional profiles; (4) First-party signals — email link clicks, form submissions, and cookie matches from prior sessions. Tools like Cursive combine all four methods to achieve 70% identification rates.',
  },
  {
    question: 'Is identifying website visitors legal?',
    answer: 'Yes, with proper disclosure. B2B visitor identification is legal under GDPR, CCPA, and CASL when you: (1) disclose data collection in your privacy policy; (2) provide opt-out mechanisms; (3) use data only for legitimate business purposes; (4) do not sell data to third parties without consent. Most visitor identification tools are built for B2B use, targeting business professionals in their professional capacity — this carries a lower regulatory burden than consumer targeting. Cursive is GDPR-compliant and provides a privacy center for visitor opt-outs.',
  },
  {
    question: 'What data do you get when you identify a website visitor?',
    answer: 'When a visitor is identified, you typically receive: full name, work email address, LinkedIn profile URL, job title, company name, company size, industry, phone number (when available), and the pages they visited on your site. High-quality tools like Cursive also include intent data — which topics they are actively researching — and the specific pages visited, time on page, and whether they hit high-value pages like pricing or demo.',
  },
  {
    question: 'What is the best tool for identifying anonymous website visitors?',
    answer: 'Cursive identifies 70% of anonymous B2B website visitors — the highest rate in the market — at $1,000/month with no long-term commitment. For pure company-level ID (not person-level), Leadfeeder and Albacross are cheaper options at $139-$299/month but only tell you the company, not the person. RB2B focuses on US LinkedIn profiles at 50-60% identification. For enterprise teams with $50k+ budgets, Demandbase and 6sense combine visitor ID with intent data and ABM advertising.',
  },
  {
    question: 'How do I install website visitor tracking?',
    answer: 'Installation takes under 5 minutes: (1) Sign up for a visitor identification tool; (2) Copy the JavaScript tracking snippet; (3) Add it to the <head> of your website — via Google Tag Manager, your CMS, or directly in code; (4) Verify the snippet is firing on your pages; (5) Connect to your CRM to push identified visitors into existing contact records. Cursive provides a GTM template and direct integrations with Salesforce, HubSpot, Pipedrive, and Close.',
  },
  {
    question: 'How long until I start seeing identified visitors?',
    answer: 'Most tools start identifying visitors within minutes of snippet installation — as soon as real traffic arrives. You will see your first identified leads within hours for sites with steady traffic. Volume depends on your traffic: sites with 1,000+ monthly B2B visitors typically see 50-200 identified leads per day with a 70% identification rate. Lower-traffic sites may see 5-20 leads per day but these are all high-intent prospects who chose to visit your site.',
  },
]

export default function HowToIdentifyVisitorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Blog', url: 'https://www.meetcursive.com/blog' },
          { name: 'How to Identify Anonymous Website Visitors', url: 'https://www.meetcursive.com/blog/how-to-identify-anonymous-website-visitors' },
        ]),
        generateFAQSchema(identifyVisitorsFAQs),
        generateBlogPostSchema({
          title: 'How to Identify Anonymous Website Visitors: Complete B2B Guide (2026)',
          description: 'Step-by-step guide to identifying anonymous website visitors using IP resolution, device fingerprinting, and identity matching. Turn 70% of anonymous traffic into qualified leads with name, email, and LinkedIn.',
          url: 'https://www.meetcursive.com/blog/how-to-identify-anonymous-website-visitors',
          datePublished: '2026-02-18',
          dateModified: '2026-02-18',
        }),
      ]} />
      {children}
    </>
  )
}
