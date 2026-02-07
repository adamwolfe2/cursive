import { generateMetadata as genMeta } from '@/lib/seo/metadata'

export const metadata = genMeta({
  title: 'What is Website Visitor Identification? Complete Guide (2026)',
  description: 'Learn how website visitor identification works, key methods (reverse IP, fingerprinting, cookies), accuracy benchmarks, compliance requirements, and how to turn anonymous traffic into qualified leads.',
  keywords: [
    'website visitor identification',
    'visitor identification software',
    'identify website visitors',
    'anonymous visitor tracking',
    'B2B visitor identification',
    'reverse IP lookup',
    'website visitor tracking',
    'visitor identification tools',
    'identify anonymous traffic',
    'website visitor intelligence',
  ],
  canonical: 'https://meetcursive.com/what-is-website-visitor-identification',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
