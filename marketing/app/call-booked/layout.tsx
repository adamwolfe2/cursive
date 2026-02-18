import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Your Call is Booked | Cursive',
  description: 'Thanks for booking a call with Cursive. Learn everything about our all-in-one growth platform: visitor identification, audience building, outbound automation, and 420M+ verified contacts.',
  keywords: [
    'Cursive platform',
    'B2B lead generation',
    'visitor identification',
    'audience builder',
    'outbound automation',
    'AI SDR',
    'growth platform',
  ],
  canonical: 'https://www.meetcursive.com/call-booked',
})

export default function CallBookedLayout({ children }: { children: React.ReactNode }) {
  return children
}
