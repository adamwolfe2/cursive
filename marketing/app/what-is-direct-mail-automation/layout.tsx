import { generateMetadata as genMeta } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = genMeta({
  title: 'What is Direct Mail Automation? Complete Guide (2026)',
  description: 'Learn what direct mail automation is, how it works, trigger-based mailing strategies, ROI benchmarks by format, personalization capabilities, and how to integrate physical mail into your digital marketing stack.',
  keywords: [
    'direct mail automation',
    'automated direct mail',
    'direct mail marketing',
    'triggered direct mail',
    'direct mail software',
    'programmatic direct mail',
    'direct mail API',
    'personalized direct mail',
    'direct mail campaigns',
    'B2B direct mail',
  ],
  canonical: 'https://www.meetcursive.com/what-is-direct-mail-automation',
})

const directMailFAQs = [
  {
    question: 'What is direct mail automation?',
    answer: 'Direct mail automation is the process of sending personalized physical mail (postcards, letters, packages) automatically based on digital triggers — without manual intervention. When a prospect visits your pricing page, abandons a trial, or hits a specific engagement threshold, your system automatically prints, addresses, and mails a physical piece to their verified address. This combines the physicality and open rate of direct mail with the precision and timing of digital marketing.',
  },
  {
    question: 'How does automated direct mail work technically?',
    answer: 'Automated direct mail works in four steps: (1) Trigger detection — a digital event fires (website visit, CRM stage change, email non-response after 3 touches); (2) Address resolution — the system matches the prospect to a verified physical address using an identity database; (3) Print-on-demand — the mail piece is automatically generated with personalized content and sent to a print facility; (4) Physical delivery — the piece is mailed via USPS or first-class mail, arriving in 3-5 business days. The entire process is initiated automatically without human involvement.',
  },
  {
    question: 'What types of direct mail can be automated?',
    answer: 'Common automated direct mail formats: postcards (standard 4×6, large 6×11) — best for high-volume triggered campaigns; personalized letters — higher engagement for B2B outreach; lumpy mail/dimensional packages — small gifts or branded items for high-value ABM targets; gift cards — for meeting incentive campaigns ("$25 Amazon gift card for 30 minutes"). Format choice depends on deal value: postcards for SMB ($50 ACV), letters for mid-market ($500+), lumpy mail for enterprise ($5,000+ ACV).',
  },
  {
    question: 'What triggers can start an automated direct mail campaign?',
    answer: 'Common direct mail triggers: (1) Website behavior — pricing page visit, 3rd return visit, specific product page; (2) Email non-response — prospect viewed email but didn\'t reply after 3+ touches; (3) CRM stage — opportunity moved to "evaluation" or "negotiation" stage; (4) Intent signal spike — account shows high buying intent in your category this week; (5) Event-based — attended webinar, downloaded content asset; (6) Time-based — 30 days since last meeting, contract renewal in 90 days.',
  },
  {
    question: 'How much does automated direct mail cost per piece?',
    answer: 'Automated direct mail costs vary by format and provider: postcards (4×6) — $1.00-$2.00 including print and postage; large postcards (6×11) — $1.50-$2.50; personalized letters — $2.00-$3.50; handwritten-style letters — $3.00-$6.00; lumpy mail/packages — $10-$50+. Cursive offers automated postcards starting at $1.50/piece and letters at $2.50/piece with no minimum order. ROI is typically 3-5x response rates vs email alone for the same audience.',
  },
  {
    question: 'What is the response rate for automated direct mail vs email?',
    answer: 'B2B direct mail response rates: postcards 1-5% (vs cold email\'s 1-3%), personalized letters 3-10% (vs email\'s 3-8%), lumpy mail 10-20%+ for high-value ABM targets. When used as part of a multi-channel sequence (email + LinkedIn + direct mail), response rates increase 3-5x vs email alone. Direct mail is especially effective for breaking through to VP and C-suite buyers who are email-saturated.',
  },
  {
    question: 'How do I find physical addresses for B2B direct mail?',
    answer: 'The biggest barrier to B2B direct mail is address data. Options: (1) Ask for address at the meeting request stage; (2) Use a visitor identification platform (Cursive matches visitors to 280M verified profiles including business and home addresses); (3) Purchase address data from a B2B data provider for your target list. Cursive\'s direct mail automation automatically resolves addresses from visitor identification — no manual address collection required.',
  },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'What is Direct Mail Automation?', url: 'https://www.meetcursive.com/what-is-direct-mail-automation' },
        ]),
        generateFAQSchema(directMailFAQs),
      ]} />
      {children}
    </>
  )
}
