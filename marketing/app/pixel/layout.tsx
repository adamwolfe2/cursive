import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Website Visitor Pixel - See Who Visits Your Website | Done-For-You Setup',
  description: 'Identify anonymous website visitors with Cursive Pixel. Done-for-you setup in 48 hours. Get company names, decision-maker contacts, pages viewed, and intent scores. $750/mo + $0.50/visitor.',
  keywords: ['website visitor tracking', 'visitor identification pixel', 'anonymous visitor identification', 'website tracking pixel', 'B2B visitor tracking', 'done-for-you pixel setup'],
  canonical: 'https://meetcursive.com/pixel',
})

export default function PixelLayout({ children }: { children: React.ReactNode }) {
  return children
}
