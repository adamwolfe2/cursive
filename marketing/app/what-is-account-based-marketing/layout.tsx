import { generateMetadata as genMeta } from '@/lib/seo/metadata'

export const metadata = genMeta({
  title: 'What is Account-Based Marketing (ABM)? Complete Guide (2026)',
  description: 'Learn how account-based marketing works, ABM types (one-to-one, one-to-few, one-to-many), the ABM framework, tech stack, measuring success, and implementation strategies for B2B revenue teams.',
  keywords: [
    'account-based marketing',
    'ABM strategy',
    'account-based marketing guide',
    'ABM framework',
    'B2B account targeting',
    'ABM technology stack',
    'ABM campaigns',
    'account-based sales',
    'ABM measurement',
    'ABM implementation',
  ],
  canonical: 'https://meetcursive.com/what-is-account-based-marketing',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
