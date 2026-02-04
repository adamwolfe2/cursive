import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Website Visitor Identification & Tracking',
  description: 'Transform anonymous clicks into valuable contacts. Identify, enrich, and activate visitor data—instantly reveal up to 70% of website traffic.',
  keywords: ['visitor identification', 'website tracking', 'anonymous visitor identification', 'visitor tracking pixel', 'identify website visitors'],
  canonical: 'https://meetcursive.com/visitor-identification',
})

export default function VisitorIdentificationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
