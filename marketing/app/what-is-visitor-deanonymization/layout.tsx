import { generateMetadata as genMeta } from '@/lib/seo/metadata'

export const metadata = genMeta({
  title: 'What is Visitor Deanonymization? Complete Technical Guide (2026)',
  description: 'Learn how visitor deanonymization works, including IP resolution, device fingerprinting, probabilistic and deterministic matching, confidence scoring, and how to turn anonymous website traffic into identified business contacts.',
  keywords: [
    'visitor deanonymization',
    'website visitor deanonymization',
    'anonymous visitor identification',
    'IP address resolution',
    'device fingerprinting',
    'identity resolution',
    'probabilistic matching',
    'deterministic matching',
    'B2B visitor identification',
    'visitor deanonymization tools',
  ],
  canonical: 'https://meetcursive.com/what-is-visitor-deanonymization',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
