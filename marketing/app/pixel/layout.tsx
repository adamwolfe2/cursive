import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Website Visitor Tracking Pixel - Identify Anonymous Traffic',
  description: 'Install Cursive\'s lightweight tracking pixel to identify 70% of anonymous website visitors in real-time. Get company names, decision-maker contacts, and page-level behavior data.',
  keywords: [
    'website tracking pixel',
    'visitor identification pixel',
    'anonymous visitor tracking',
    'B2B website pixel',
    'visitor tracking script',
    'website visitor intelligence',
    'real-time visitor identification',
    'done-for-you pixel setup',
  ],
  canonical: 'https://meetcursive.com/pixel',
})

export default function PixelLayout({ children }: { children: React.ReactNode }) {
  return children
}
