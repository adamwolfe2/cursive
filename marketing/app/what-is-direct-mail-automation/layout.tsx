import { generateMetadata as genMeta } from '@/lib/seo/metadata'

export const metadata = genMeta({
  title: 'What is Direct Mail Automation? Complete Guide (2026)',
  description: 'Learn what direct mail automation is, how it works, trigger-based mailing strategies, ROI benchmarks by format, personalization capabilities, and how to integrate physical mail into your digital marketing stack.',
  keywords: [
    'direct mail automation',
    'automated direct mail',
    'direct mail marketing',
    'triggered direct mail',
    'direct mail software',
    'programmatic direct mail',
    'direct mail API',
    'personalized direct mail',
    'direct mail campaigns',
    'B2B direct mail',
  ],
  canonical: 'https://meetcursive.com/what-is-direct-mail-automation',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
