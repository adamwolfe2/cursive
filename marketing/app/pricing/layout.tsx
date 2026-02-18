import { generateMetadata } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = generateMetadata({
  title: 'Cursive Pricing: From $0.60/Lead or $1,000/Month | B2B Lead Generation',
  description: 'Flexible B2B lead generation pricing. Self-serve marketplace credits from $0.60/lead or done-for-you services starting at $1,000/month. Start free with 100 credits.',
  keywords: [
    'B2B lead generation pricing',
    'lead marketplace credits',
    'done-for-you lead gen',
    'outbound pricing',
    'AI SDR pricing',
    'lead generation cost',
    'B2B data pricing',
    'self-serve lead credits',
    'visitor identification cost',
    'cursive pricing',
  ],
  canonical: 'https://www.meetcursive.com/pricing',
})

const pricingFAQs = [
  {
    question: 'How much does Cursive cost?',
    answer: 'Cursive offers two pricing models. Self-serve marketplace credits start at $0.60 per lead, with 100 free credits on signup. Done-for-you managed services start at $1,000/month for Cursive Data, $2,500/month for Cursive Outbound, and $5,000/month for Cursive Pipeline (full AI SDR). No long-term contracts required.',
  },
  {
    question: 'Is there a free trial or free plan?',
    answer: 'Yes. Every new account receives 100 free credits (valued at up to $60) on signup, with no credit card required. You can use these credits to purchase leads from our self-serve marketplace immediately.',
  },
  {
    question: 'What is the difference between self-serve credits and managed services?',
    answer: 'Self-serve credits let you browse and buy leads directly from our marketplace at $0.60/lead on a pay-as-you-go basis. Managed services (Cursive Data, Outbound, Pipeline) include dedicated account management, custom ICP targeting, done-for-you campaigns, and strategic oversight from our team.',
  },
  {
    question: 'Are there long-term contracts?',
    answer: 'No. All Cursive managed service plans are month-to-month with no long-term contract requirements. Self-serve credits never expire. You can upgrade, downgrade, or cancel at any time.',
  },
  {
    question: 'What does visitor identification cost?',
    answer: 'Website visitor identification is included in Cursive Pipeline ($5,000/month) and available as a standalone add-on. The pixel installation is free; enrichment credits are used when you identify individual visitors. Contact us for custom pricing based on your monthly traffic volume.',
  },
  {
    question: 'How does the credit system work?',
    answer: 'Credits are used to unlock lead data in the self-serve marketplace. One credit equals one lead record with full contact information. Credits can be purchased in bundles starting at $0.60/lead. Bulk purchases receive volume discounts.',
  },
  {
    question: 'What is included in the Cursive Pipeline plan?',
    answer: 'Cursive Pipeline ($5,000/month) includes everything in Cursive Outbound plus: website visitor identification, AI SDR that books meetings automatically, intent audience building, direct mail automation, and a dedicated growth strategist. It is the complete full-stack outbound solution.',
  },
  {
    question: 'Can I switch between plans?',
    answer: 'Yes. You can upgrade or downgrade at any time. Upgrades take effect immediately; downgrades apply at the start of your next billing cycle. There are no cancellation penalties.',
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
