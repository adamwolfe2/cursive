import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Direct Mail Automation — Triggered by Website Visits | Cursive',
  description: 'Automate B2B direct mail campaigns triggered by website visits and digital behavior. Send personalized postcards starting at $1.50/piece with 3-5x higher conversion than digital alone.',
  keywords: [
    'direct mail automation',
    'B2B direct mail',
    'automated postcards',
    'programmatic direct mail',
    'triggered direct mail',
    'physical mail marketing',
    'direct mail retargeting',
    'website to mailbox',
    'b2b direct mail marketing',
    'direct mail for b2b',
  ],
  canonical: 'https://www.meetcursive.com/direct-mail',
})

const directMailFAQs = [
  {
    question: 'How does automated direct mail work?',
    answer: 'Cursive connects your website visitor behavior to physical mail delivery. When a visitor hits a trigger page (like your pricing page or a specific product page), Cursive automatically prints and mails a personalized postcard or letter to their verified physical address. Delivery typically takes 3-5 business days.',
  },
  {
    question: 'How much does automated direct mail cost?',
    answer: 'Postcards start at $1.50 per piece including printing, postage, and delivery. Letters start at $2.50/piece. There are no minimum order requirements. Cursive Direct Mail is included in the Cursive Pipeline plan or available as a standalone add-on to any managed service plan.',
  },
  {
    question: 'How do you find physical addresses for B2B targets?',
    answer: 'Cursive matches visitors to our database of 220M+ verified profiles which includes business and home addresses. For B2B targeting, we use verified business addresses. Address accuracy is guaranteed — we only send mail to verified deliverable addresses.',
  },
  {
    question: 'What triggers can I use to send direct mail?',
    answer: 'Common triggers include: pricing page visits, feature page visits, return visit (2nd or 3rd session), time on site thresholds, specific content downloads, and email non-response follow-up. Triggers can be combined with intent signal thresholds to ensure you only mail the highest-intent prospects.',
  },
  {
    question: 'What types of mail can I send?',
    answer: 'Cursive supports postcards (standard 4x6 and oversized 6x11), letters with handwritten-style envelopes, lumpy mail/dimensional packages for high-value ABM targets, and gift cards as part of meeting incentive campaigns.',
  },
  {
    question: 'How do direct mail campaigns compare to email for B2B?',
    answer: 'B2B direct mail typically sees 4-6x higher response rates than email for the same audience. When combined with email (multi-channel sequence), response rates increase by 3-5x vs email alone. Direct mail is especially powerful for breaking through to prospects who are email-saturated at the VP and C-suite level.',
  },
  {
    question: 'Is direct mail GDPR and CCPA compliant?',
    answer: 'Yes. Cursive only uses verified, consent-appropriate address data. We honor all opt-outs and suppression lists. B2B direct mail to business addresses follows standard commercial mail regulations and is compliant with major privacy frameworks.',
  },
]

export default function DirectMailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Direct Mail', url: 'https://www.meetcursive.com/direct-mail' },
        ]),
        generateFAQSchema(directMailFAQs),
      ]} />
      {children}
    </>
  )
}
