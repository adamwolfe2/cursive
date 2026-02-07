import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: "Free Website Visitor Audit - See Who's Visiting Your Site",
  description: 'Get a free audit showing the last 100 identified visitors to your website with names, titles, emails, intent scores, and personalized outreach templates. Results in 24 hours.',
  keywords: [
    'free website visitor audit',
    'website visitor identification',
    'visitor tracking',
    'lead identification',
    'website analytics',
    'visitor intelligence',
    'B2B lead generation',
    'website visitor tracking',
  ],
  canonical: 'https://meetcursive.com/free-audit',
})

export default function FreeAuditLayout({ children }: { children: React.ReactNode }) {
  return children
}
