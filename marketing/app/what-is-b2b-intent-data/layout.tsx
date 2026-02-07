import { generateMetadata as genMeta } from '@/lib/seo/metadata'

export const metadata = genMeta({
  title: 'What is B2B Intent Data? Complete Guide (2026)',
  description: 'Learn what B2B intent data is, how it works, types of intent signals (first-party, second-party, third-party), scoring models, use cases, and how to choose the right intent data provider.',
  keywords: [
    'B2B intent data',
    'intent data',
    'buyer intent signals',
    'intent-based marketing',
    'purchase intent data',
    'B2B buying signals',
    'intent data providers',
    'sales intent signals',
    'account-based intent',
    'intent scoring',
  ],
  canonical: 'https://meetcursive.com/what-is-b2b-intent-data',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
