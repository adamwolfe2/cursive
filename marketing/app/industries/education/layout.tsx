import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Education Lead Generation - Identify EdTech & Training Buyers with Cursive',
  description: 'Identify companies researching education and training solutions on your site. Turn anonymous EdTech visitors into qualified leads with AI-powered outreach.',
  keywords: ['education lead generation', 'EdTech lead generation', 'corporate training leads', 'education visitor identification', 'B2B education sales'],
  canonical: 'https://www.meetcursive.com/industries/education',
})

const educationFAQs = [
  {
    question: 'How does Cursive help education companies identify prospective clients?',
    answer: 'Cursive identifies up to 70% of the anonymous companies and decision-makers visiting your EdTech or corporate training website, revealing which organizations are actively researching your programs, pricing, and curriculum pages. This identification gives your sales team a warm prospect list of companies already expressing interest, eliminating cold outreach to unqualified targets.',
  },
  {
    question: 'What intent signals indicate someone is researching education solutions?',
    answer: "Cursive's 450 billion+ intent signal database tracks behavioral signals such as researching corporate training vendors, comparing LMS platforms, or searching for compliance training providers across thousands of web sources. EdTech companies use these signals to identify and engage organizations in an active evaluation cycle before a competitor does.",
  },
  {
    question: 'How do EdTech companies use Cursive for B2B sales?',
    answer: "EdTech SaaS companies use Cursive to identify the HR leaders, L&D managers, and procurement teams visiting their site, then trigger Cursive's AI SDR to send personalized outreach referencing the specific programs or features those visitors explored. This automated, behavior-driven approach allows EdTech sales teams to scale outreach without adding headcount.",
  },
  {
    question: 'What compliance considerations apply to education sector data?',
    answer: 'Cursive identifies B2B business contacts — company names, work email addresses, and professional profiles — rather than student or individual consumer data, keeping its use cases squarely outside of FERPA and COPPA scope. Cursive is designed for B2B sales workflows and processes data in accordance with applicable privacy regulations including CCPA and GDPR.',
  },
  {
    question: "How does Cursive's visitor identification work for EdTech SaaS?",
    answer: "Cursive's lightweight JavaScript pixel installs on your EdTech website in minutes and immediately begins identifying up to 70% of anonymous B2B visitors by matching their digital footprint to Cursive's proprietary identity graph. Identified companies and contacts are surfaced in the Cursive dashboard and can be pushed directly to your CRM for sales team follow-up.",
  },
  {
    question: 'What results do education companies typically see with Cursive?',
    answer: 'Education and EdTech companies using Cursive consistently report a meaningful increase in qualified pipeline from their existing website traffic, with many attributing new enterprise training contracts directly to Cursive-identified visitors. Starting at $1,000/month, Cursive enables EdTech companies to maximize the return on their content marketing and SEO investments by converting anonymous traffic into sales conversations.',
  },
]

export default function EducationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Industries', url: 'https://www.meetcursive.com/industries' },
          { name: 'Education', url: 'https://www.meetcursive.com/industries/education' },
        ]),
        generateFAQSchema(educationFAQs),
      ]} />
      {children}
    </>
  )
}
