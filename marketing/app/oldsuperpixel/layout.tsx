import { Metadata } from 'next'
import { StructuredData } from '@/components/seo/structured-data'
import { generateSoftwareApplicationSchema, generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata: Metadata = {
  title: 'Cursive Super Pixel — Turn Anonymous Website Visitors Into Verified Leads | Book a Demo',
  description: 'The Cursive Super Pixel V4 identifies, enriches, and delivers your website visitors as verified leads with name, email, mobile, and intent score — in real time. 98% US coverage. 60B+ daily intent signals. 0.05% bounce rate.',
  openGraph: {
    title: 'Cursive Super Pixel — Turn Anonymous Website Visitors Into Verified Leads',
    description: 'The Cursive Super Pixel V4 identifies your website visitors as verified leads with name, email, mobile, and intent score — in real time.',
    type: 'website',
    url: 'https://www.meetcursive.com/oldsuperpixel',
    siteName: 'Cursive',
    images: [{ url: 'https://www.meetcursive.com/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cursive Super Pixel — Turn Anonymous Website Visitors Into Verified Leads',
    description: 'Identify your website visitors as verified leads with name, email, mobile, and intent score in real time.',
    images: ['https://www.meetcursive.com/og-image.png'],
  },
  alternates: { canonical: 'https://www.meetcursive.com/oldsuperpixel' },
  robots: { index: true, follow: true },
}

const superpixelFAQs = [
  {
    question: 'How is this different from other pixel tools claiming 60–80% match rates?',
    answer: 'Match rate claims are misleading without context. A 60% claimed match rate typically yields ~15% usable contacts after data decay. Our geo-framed, NCOA-verified methodology means the matches we deliver are real, verified contacts — not bulk IP grabs padded to inflate numbers.',
  },
  {
    question: 'Where does your data come from?',
    answer: 'We license directly from primary data providers and maintain our own proprietary identity graph. We are not a reseller. We do not buy derivatives. Our data is refreshed via NCOA every 30 days and email-verified at 10–15M records per day.',
  },
  {
    question: "What's the bounce rate on your emails?",
    answer: '0.05% — verified against millions of records. Industry average for derivative-based data is 20%+.',
  },
  {
    question: 'Can I run V4 alongside V3?',
    answer: 'Yes. Both can run simultaneously on the same site.',
  },
  {
    question: 'How do I get leads into my CRM?',
    answer: 'Via persistent API, native workflow integrations (GoHighLevel, Klaviyo), or custom HTTP endpoints. We have templates and a 17-minute walkthrough video covering every scenario.',
  },
  {
    question: "What if my leads don't convert immediately?",
    answer: "Intent level matters. Medium-intent leads require a nurture-first approach — run DSP exposure before calling. High-intent leads are ready for direct outreach. We'll help you match your approach to the intent level.",
  },
]

export default function SuperPixelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateSoftwareApplicationSchema(),
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'Products', url: 'https://www.meetcursive.com/platform' },
          { name: 'Super Pixel V4', url: 'https://www.meetcursive.com/oldsuperpixel' },
        ]),
        generateFAQSchema(superpixelFAQs),
      ]} />
      {children}
    </>
  )
}
