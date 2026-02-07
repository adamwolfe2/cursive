import { generateMetadata as genMeta } from '@/lib/seo/metadata'

export const metadata = genMeta({
  title: 'What is an AI SDR? Complete Guide to AI Sales Development (2026)',
  description: 'Learn what an AI SDR is, how AI sales development representatives work, capabilities, ROI analysis, implementation guide, and how they compare to human SDRs in 2026.',
  keywords: [
    'AI SDR',
    'AI sales development representative',
    'AI sales development',
    'automated prospecting',
    'AI outbound sales',
    'AI cold email',
    'sales automation AI',
    'AI BDR',
    'automated sales outreach',
    'AI sales agent',
  ],
  canonical: 'https://meetcursive.com/what-is-ai-sdr',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
