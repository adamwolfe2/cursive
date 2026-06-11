import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Cursive Pricing: Visitor Pixel $97, Custom Audience $197 | B2B Lead Generation',
  description: 'Simple, self-serve pricing. Visitor Pixel from $97/mo, Custom Audience from $197/mo, or both in the bundle for $247/mo. Month-to-month, cancel anytime. Install in 60 seconds.',
  keywords: [
    'B2B lead generation pricing',
    'visitor pixel pricing',
    'website visitor identification cost',
    'custom audience pricing',
    'intent data pricing',
    'lead generation cost',
    'B2B data pricing',
    'self-serve lead generation',
    'visitor identification cost',
    'cursive pricing',
  ],
  canonical: 'https://www.meetcursive.com/pricing',
})

const pricingFAQs = [
  {
    question: 'How much does Cursive cost?',
    answer: 'Cursive has three self-serve plans, all month-to-month. The Visitor Pixel is $97/month and identifies the companies and people visiting your site. The Custom Audience is $197/month and delivers a fresh weekly list of people actively searching for your product. The Pixel + Audience Bundle is $247/month and includes both. No setup fee, no long-term contract.',
  },
  {
    question: 'Is there a free trial or free plan?',
    answer: 'There is no free plan, but every plan is month-to-month with no setup fee, so you can start small and cancel anytime. The Visitor Pixel installs in about 60 seconds and Custom Audience plans deliver your first list within 24 hours, so you see value almost immediately.',
  },
  {
    question: 'What is the difference between the Visitor Pixel and the Custom Audience?',
    answer: 'The Visitor Pixel identifies people already visiting your website — it turns anonymous traffic into named companies and contacts. The Custom Audience is proactive: each week we deliver a fresh list of people actively searching for what you sell, whether or not they have visited your site. The bundle gives you both in one feed.',
  },
  {
    question: 'Are there long-term contracts?',
    answer: 'No. Every Cursive plan is month-to-month with no setup fee and no long-term contract. You can upgrade, downgrade, or cancel at any time from your portal.',
  },
  {
    question: 'What does visitor identification cost?',
    answer: 'Website visitor identification is the Visitor Pixel plan at $97/month. It installs in about 60 seconds and resolves 40–60% of your anonymous visitors to company and person-level detail, synced straight to your portal. No per-visitor fees.',
  },
  {
    question: 'How fast can I get started?',
    answer: 'Immediately. Pick a plan, check out, and you are dropped straight into your portal. The pixel installs in about 60 seconds with a single snippet, and audience plans deliver your first list within 24 hours.',
  },
  {
    question: 'What is included in the Pixel + Audience Bundle?',
    answer: 'The Pixel + Audience Bundle ($247/month) includes everything in both plans: deterministic visitor identification on your site plus a fresh weekly audience of in-market prospects, combined into one feed. It is the full top-of-funnel intel layer and the best value versus buying the two separately.',
  },
  {
    question: 'Can I switch between plans?',
    answer: 'Yes. You can upgrade or downgrade at any time from your portal. There are no cancellation penalties and every plan is month-to-month.',
  },
]

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Pricing', url: 'https://www.meetcursive.com/pricing' },
        ]),
        generateFAQSchema(pricingFAQs),
      ]} />
      {children}
    </>
  )
}
