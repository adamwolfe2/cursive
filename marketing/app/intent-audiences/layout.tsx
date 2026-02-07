import { generateMetadata } from '@/lib/seo/metadata'

export const metadata = generateMetadata({
  title: 'Intent Data Audiences - 450B+ Monthly Intent Signals',
  description: 'Pre-built intent audience segments across 8 high-value verticals. Access 280M+ US profiles with 450B+ monthly intent signals updated every 7 days. Target buyers actively in-market.',
  keywords: [
    'intent data audiences',
    'B2B intent signals',
    'in-market buyer targeting',
    'intent-based marketing',
    'purchase intent data',
    'buyer intent audiences',
    'intent data provider',
    'behavioral targeting',
  ],
  canonical: 'https://meetcursive.com/intent-audiences',
})

export default function IntentAudiencesLayout({ children }: { children: React.ReactNode }) {
  return children
}
