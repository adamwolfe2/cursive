import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Syndicated Intent Audiences - Pre-Built Segments',
  description: 'Pre-built intent audiences across 8 high-value verticals, 46+ segments, 280M+ US profiles, 450B+ monthly intent signals. Hot, Warm, and Scale intent levels.',
  keywords: ['intent data', 'buyer intent', 'syndicated audiences', 'intent audiences', 'B2B intent data', 'B2C intent data'],
  canonical: 'https://meetcursive.com/intent-audiences',
})

export default function IntentAudiencesLayout({ children }: { children: React.ReactNode }) {
  return children
}
